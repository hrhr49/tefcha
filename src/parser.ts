import {Config} from './config'


class TefchaError extends Error {
  constructor({lineno, msg, src = ''}: {lineno?: number; msg: string; src?: string}) {
    const RANGE_LINES = 5
    let mainMsg = msg;
    if (lineno && lineno > 0) {
      mainMsg = `at line ${lineno}: ${mainMsg}`;
    }
    let positionInfo = '';
    if (src && lineno > 0) {
      positionInfo = src.split(/\n/)
        .map((line, idx) => ({lineno: idx + 1, line}))
        .slice(Math.max(0, lineno - 1 - RANGE_LINES), lineno - 1 + RANGE_LINES)
        .map(({lineno: ln, line}) => `${ln === lineno ? '>' : ' '}${ln}: ${line}`)
        .join('\n');
    }
    super(`${mainMsg}\n${positionInfo}`);
  }
}

// indent based AST
interface ASTNode {
  type: string;
  lineno: number;
  content?: string;
  children?: ASTNode[];
}

// after line starts with these, indent should exists
// except for 'while' of do-while statement.
const INDENT_KEYWORDS = [
  'if', 'else', 'elif', 'while', 'for', 'do',
  'switch', 'case'
];
const KEYWORDS = [...INDENT_KEYWORDS, 'continue', 'break', 'pass'];


interface LineInfo {
  lineno: number;
  line: string;
  nest: number;
}

const extractLineInfo = (src: string, config: Config): LineInfo[] => {
  let lineInfoList: LineInfo[] = [];
  let keptLine: string = ''; // string to keep line ends with '\'
  const {indentStr, commentStr} = config.src;

  src.split(/\r\n|\r|\n/).forEach((line, lineno) => {
    // add 1 because lineno starts with 1
    lineno++;

    // concatenate previous line ends with '\'
    line = keptLine + line;

    // skip empty line
    if (line.trim() === '') return;

    let nest = 0;
    // count the number of indent
    while (line.startsWith(indentStr)) {
      nest++;
      line = line.slice(indentStr.length);
    }

    // skip comment
    if (line.startsWith(commentStr)) return;

    // if the line ends with '\', keep it.
    if (line.endsWith('\\')) {
      keptLine = line.slice(0, -1);
      return;
    }

    keptLine = '';

    lineInfoList.push({
      lineno,
      line,
      nest,
    });
  });

  if (keptLine !== '') {
    throw new TefchaError({msg: `EOF is found after '\\'`});
  }

  // if all lines has same indent, remove it.
  const minNest = Math.min(...lineInfoList.map(l => l.nest));
  lineInfoList = lineInfoList.map(l => ({...l, nest: l.nest - minNest}));

  return lineInfoList;
};

const _parse = (lineInfoList: LineInfo[], src: string): ASTNode => {
  const rootNode: ASTNode = {type: 'program', lineno: 0, children: []};
  let nodeStack: ASTNode[] = [rootNode]; // stack to keep parents

  lineInfoList.forEach(({lineno, line, nest}) => {
    // if unexpected indent exists, throw error
    if ((nodeStack.length - 1) < nest) {
      throw new TefchaError({lineno, src, msg: 'unexpected indent'});
    }

    // if unindent is found, pop nodes from parents stack
    while ((nodeStack.length - 1) > nest) {
      nodeStack.pop();
    }

    const currentNode = nodeStack.slice(-1)[0];
    const firstWord = line.split(' ')[0];

    // simple text
    if (!KEYWORDS.includes(firstWord)) {
      currentNode.children.push({
        type: 'text',
        lineno,
        content: line,
      });
    } else {
      const newNode = {
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

      if (INDENT_KEYWORDS.includes(firstWord)) {
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

  let prevChild: ASTNode = {type: 'none', lineno: -1};
  children.forEach((child, idx) => {
    const {lineno} = child;
    switch (child.type) {
      case 'program':
        break;
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
      case 'switch':
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
        if (![...parents, node].some(n => ['for', 'while', 'do', 'case'].includes(n.type))) {
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
      default:
        throw new TefchaError({lineno, src, msg: `node type "${child.type}" is not implemented yet.`});
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
