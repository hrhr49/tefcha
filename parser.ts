import {Config} from './config'

class TefchaParseError extends Error {}

const tefchaError = ({lineno, msg, src = ''}: {lineno?: number; msg: string; src?: string}): Error => {
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
  return new TefchaParseError(`${mainMsg}\n${positionInfo}`);
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
  nestLevel: number;
}

const extractLineInfo = (src: string, config: Config): LineInfo[] => {
  let lineInfoList: LineInfo[] = [];
  let keepedLine: string = ''; // string to keep line ends with '\'

  src.split(/\r\n|\r|\n/).forEach((line, lineno) => {
    // add 1 because lineno starts with 1
    lineno++;

    // concatenate previous line ends with '\'
    line = keepedLine + line;

    // skip empty line
    if (line.trim() === '') return;

    let nestLevel = 0;
    // count the number of indent
    while (line.startsWith(config.src.indentStr)) {
      nestLevel++;
      line = line.slice(config.src.indentStr.length);
    }

    // skip comment
    if (line.startsWith(config.src.commentStr)) return;

    // if the line ends with '\', keep it.
    if (line.endsWith('\\')) {
      keepedLine = line.slice(0, -1);
      return;
    }

    keepedLine = '';

    lineInfoList.push({
      lineno,
      line,
      nestLevel,
    });
  });

  if (keepedLine !== '') {
    throw tefchaError({msg: `EOF is found after '\\'`});
  }

  // if all lines has same indent, remove it.
  const minNestLevel = Math.min(...lineInfoList.map(l => l.nestLevel));
  lineInfoList = lineInfoList.map(l => ({...l, nestLevel: l.nestLevel - minNestLevel}));

  return lineInfoList;
};

const _parse = (lineInfoList: LineInfo[], src: string): ASTNode => {
  const rootNode: ASTNode = {type: 'program', lineno: 0, children: []};
  let nodeStack: ASTNode[] = [rootNode]; // stack to keep parents

  lineInfoList.forEach(({lineno, line, nestLevel}) => {
    // if unexpected indent exists, throw error
    if ((nodeStack.length - 1) < nestLevel) {
      throw tefchaError({lineno, src, msg: 'unexpected indent'});
    }

    // if unindent is found, pop nodes from parents stack
    while ((nodeStack.length - 1) > nestLevel) {
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
      return;
    }

    const newNode = {
      type: firstWord,
      lineno,
      content: line.slice(line.indexOf(' ') + 1),
      children: [],
    };
    currentNode.children.push(newNode);

    if (INDENT_KEYWORDS.includes(firstWord)) {
      const lastChildNode: ASTNode | null =
        currentNode.children.length > 0 ?
          currentNode.children.slice(-1)[0] :
          null;
      // 'while' of do-while do not have indent
      if (!(lastChildNode.type === 'do' && firstWord === 'while')) {
        nodeStack.push(newNode);
      }
    }
  });
  return rootNode;
}

const validateAST = (node: ASTNode, parents: ASTNode[], src: string): void => {
  if (!node.children) return;
  // console.log(node.type);

  let prevChild: ASTNode = {type: 'none', lineno: -1};
  node.children.forEach((child, idx) => {
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
          throw tefchaError({lineno, src, msg: 'before "else" statement, "if" or "elif" shoud exists.'});
        }
        break;
      case 'elif':
        if (!['if', 'elif'].includes(prevChild.type)) {
          throw tefchaError({lineno, src, msg: 'before "elif" statement, "if" or "elif" shoud exists.'});
        }
        break;
      case 'while':
        break;
      case 'switch':
        break;
      case 'case':
        if (node.type !== 'switch') {
          throw tefchaError({lineno, src, msg: 'keyword "case" shoud be in "switch" statement.'});
        }
        break;
      case 'continue':
        if (![...parents, node].some(n => ['for', 'while', 'do'].includes(n.type))) {
          throw tefchaError({lineno, src, msg: 'at ${lineno} "continue" statement shoud be in loop'});
        }
        break;
      case 'break':
        if (![...parents, node].some(n => ['for', 'while', 'do', 'case'].includes(n.type))) {
          throw tefchaError({lineno, src, msg: '"break" statement shoud be in loop or "case".'});
        }
        break;
      case 'do':
        if (idx + 1 >= node.children.length || node.children[idx + 1].type !== 'while') {
          throw tefchaError({lineno, src, msg: 'cannot find corresponding keyword "while" to keyword "do".'});
        }
        break;
      case 'pass':
        break;
      default:
        throw tefchaError({lineno, src, msg: `node type "${child.type}" is not implemented yet.`});
    }
    prevChild = child;
  });
  node.children.forEach(child => validateAST(child, [...parents, node], src));
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
}
