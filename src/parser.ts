import {Config} from './config'


class TefchaError extends Error {
  lineno: number | null;
  msg: string;
  src: string;
  type: 'tefcha';

  constructor({lineno, msg, src = ''}: {lineno?: number; msg: string; src?: string}) {
    const RANGE_LINES = 5
    let mainMsg = msg;
    if (lineno && lineno > 0) {
      mainMsg = `at line ${lineno}: ${mainMsg}`;
    }
    let positionInfo = '';
    if (src && lineno !== undefined && lineno > 0) {
      positionInfo = src.split(/\n/)
        .map((line, idx) => ({lineno: idx + 1, line}))
        .slice(Math.max(0, lineno - 1 - RANGE_LINES), lineno - 1 + RANGE_LINES)
        .map(({lineno: ln, line}) => `${ln === lineno ? '>' : ' '}${ln}: ${line}`)
        .join('\n');
    }
    super(`${mainMsg}\n${positionInfo}`);
    this.lineno = lineno ?? null;
    this.msg = msg;
    this.src = src;
    this.type = 'tefcha';
  }
}

// after line starts with these, indent should exists
// except for 'while' of do-while statement.
const INDENT_KEYWORDS = [
  'if', 'else', 'elif', 'while', 'for', 'do',
  'switch', 'case', 'try', 'except',
] as const;
const KEYWORDS = [...INDENT_KEYWORDS, 'continue', 'break', 'pass'] as const;
const NODE_TYPES = [...KEYWORDS, 'program', 'none', 'text'] as const;

type IndentKeyword = (typeof INDENT_KEYWORDS)[number];
type Keyword = (typeof KEYWORDS)[number];
type NodeType = (typeof NODE_TYPES)[number];

const isIndentKeyword = (obj: any): obj is IndentKeyword => {
  return INDENT_KEYWORDS.includes(obj);
};

const isKeyword = (obj: any): obj is Keyword => {
  return KEYWORDS.includes(obj);
};

// this is not used yet.
// const isNodeType = (obj: any): obj is NodeType => {
//   return NODE_TYPES.includes(obj);
// };

// indent based AST
interface ASTNode {
  type: NodeType;
  lineno: number;
  content: string;
  children: ASTNode[];
}

interface LineInfo {
  lineno: number;
  line: string;
  nest: string[];
}

const extractLineInfo = (src: string, config: Config): LineInfo[] => {
  let lineInfoList: LineInfo[] = [];
  let keptLine: string = ''; // string to keep line ends with '\'
  const {commentStr} = config.src;
  let prevNest: string[] = [];

  src.split(/\r\n|\r|\n/).forEach((line, lineno) => {
    // add 1 because lineno starts with 1
    lineno++;

    // concatenate previous line ends with '\'
    line = keptLine + line;

    // skip empty line
    if (line.trim() === '') return;

    // skip comment
    if (line.replace(/^[ \t]+/, '').startsWith(commentStr)) return;

    // if the line ends with '\', keep it.
    if (line.endsWith('\\')) {
      keptLine = line.slice(0, -1);
      return;
    }

    const currentNest: string[] = [];

    const indentMatch = /^[ \t]+/.exec(line);
    if (indentMatch) {
      let indentStr: string = indentMatch[0];

      // remove indent from line
      line = line.slice(indentStr.length);

      while (indentStr.length > 0 && prevNest.length > 0) {
        if (indentStr.startsWith(prevNest[0])) {
          const indent: string = prevNest[0];
          currentNest.push(indent);
          indentStr = indentStr.slice(indent.length);
          prevNest.shift();
        } else {
          throw new TefchaError({lineno, src, msg: 'unexpected indent'});
        }
      }
      if (indentStr.length > 0) {
        currentNest.push(indentStr);
      }
    }

    // copy currentNest to prevNest
    prevNest = [...currentNest];

    keptLine = '';

    lineInfoList.push({
      lineno,
      line,
      nest: currentNest,
    });
  });

  if (keptLine !== '') {
    throw new TefchaError({msg: `EOF is found after '\\'`});
  }

  // if all lines have same indent, remove the indent
  if (lineInfoList.every((l) => l.nest.length > 0)) {
    lineInfoList = lineInfoList.map((l) => ({...l, nest: l.nest.slice(1)}));
  }

  return lineInfoList;
};

const _parse = (lineInfoList: LineInfo[], src: string): ASTNode => {
  const rootNode: ASTNode = {
    type: 'program',
    lineno: 0,
    content: '',
    children: [],
  };
  let nodeStack: ASTNode[] = [rootNode]; // stack to keep parents

  lineInfoList.forEach(({lineno, line, nest}) => {
    // if unexpected indent exists, throw error
    if ((nodeStack.length - 1) < nest.length) {
      throw new TefchaError({lineno, src, msg: 'unexpected indent'});
    }

    // if unindent is found, pop nodes from parents stack
    while ((nodeStack.length - 1) > nest.length) {
      nodeStack.pop();
    }

    const currentNode = nodeStack.slice(-1)[0];
    const firstWord = line.split(' ')[0];

    // simple text
    if (!isKeyword(firstWord)) {
      currentNode.children.push({
        type: 'text',
        lineno,
        content: line,
        children: [],
      });
    } else {
      const newNode: ASTNode = {
        type: firstWord,
        lineno,
        content: line.slice(line.indexOf(' ') + 1),
        children: [],
      };
      const lastChildNode: ASTNode | null =
        currentNode.children.length > 0 ?
          currentNode.children.slice(-1)[0] :
          null;
      currentNode.children.push(newNode);

      if (isIndentKeyword(firstWord)) {
        // 'while' of do-while do not have indent
        if (!(lastChildNode && lastChildNode.type === 'do' && firstWord === 'while')) {
          nodeStack.push(newNode);
        }
      }
    }
  });
  return rootNode;
}

const validateAST = (node: ASTNode, parents: ASTNode[], src: string): void => {
  const children = node.children || [];

  let prevChild: ASTNode = {
    type: 'none',
    lineno: -1,
    content: '',
    children: [],
  };
  children.forEach((child, idx) => {
    const {lineno} = child;
    switch (child.type) {
      case 'program':
        break;
      case 'none':
        throw new TefchaError({lineno, src, msg: `node type "${child.type}" must not be here... this may be bug`});
        // break;
      case 'text':
        break;
      case 'if':
        break;
      case 'else':
        if (!['if', 'elif'].includes(prevChild.type)) {
          throw new TefchaError({lineno, src, msg: 'before "else" statement, "if" or "elif" should exists.'});
        }
        break;
      case 'elif':
        if (!['if', 'elif'].includes(prevChild.type)) {
          throw new TefchaError({lineno, src, msg: 'before "elif" statement, "if" or "elif" should exists.'});
        }
        break;
      case 'while':
        break;
      case 'for':
        throw new TefchaError({lineno, src, msg: `node type "${child.type}" is not implemented yet.`});
        // break;
      case 'switch':
        if (child.children.length === 0) {
          throw new TefchaError({lineno, src, msg: 'switch block needs at least 1 case blocks'});
        }
        break;
      case 'case':
        if (node.type !== 'switch') {
          throw new TefchaError({lineno, src, msg: 'keyword "case" should be in "switch" statement.'});
        }
        break;
      case 'continue':
        if (![...parents, node].some(n => ['for', 'while', 'do'].includes(n.type))) {
          throw new TefchaError({lineno, src, msg: '"continue" statement should be in loop'});
        }
        break;
      case 'break':
        if (![...parents, node].some(n => ['for', 'while', 'do'].includes(n.type))) {
          throw new TefchaError({lineno, src, msg: '"break" statement should be in loop or "case".'});
        }
        break;
      case 'do':
        if (idx + 1 >= children.length || children[idx + 1].type !== 'while') {
          throw new TefchaError({lineno, src, msg: 'cannot find corresponding keyword "while" to keyword "do".'});
        }
        break;
      case 'pass':
        break;
      case 'try':
        if (idx + 1 >= children.length || children[idx + 1].type !== 'except') {
          throw new TefchaError({lineno, src, msg: 'cannot find corresponding keyword "except" to keyword "try".'});
        }
        break;
      case 'except':
        if (!['try', 'except'].includes(prevChild.type)) {
          throw new TefchaError({lineno, src, msg: 'before "except" block, "try" or "except" block should exists.'});
        }
        break;
      default:
        const _: never = child.type;
        throw new TefchaError({lineno, src, msg: `node type "${_}" is invalid.`});
    }
    prevChild = child;
  });

  if (node.type === 'switch') {
    children.forEach(child => {
      const {lineno} = child;
      if (child.type !== 'case') {
        throw new TefchaError({lineno, src, msg: `${child.type}" is found in "switch" block. "switch" should have "case" only`});
      }
    });
  }

  children.forEach(child => validateAST(child, [...parents, node], src));
};


const parse = (src: string, config: Config): ASTNode => {
  const lineInfoList = extractLineInfo(src, config);
  const node = _parse(lineInfoList, src);
  validateAST(node, [], src);
  return node;
};

export {
  ASTNode,
  parse,
  TefchaError,
}
