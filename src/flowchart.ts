import {ASTNode} from './parser'
import {
  MeasureTextFunc,
  Shape,
  Group,
  Point,
  Path,
  Text,
  TextSize,
  Rect,
  Frame,
  Diamond,
} from './shape'
import {Config} from './config'
import {RangeAllocator, createRangeList} from './range-allocator'


const DEBUG = false;
type LoopType = 'while' | 'doWhile' | 'for' | 'none';

//  Direction
//         N
//         ^
//         |
//  W <----+----> E
//         |
//         v
//         S
// type Direction = 'N' | 'S' | 'E' | 'W';

interface CondInfo {
  readonly dir: 'W' | 'S' | 'E';
  readonly jump: boolean;
};

interface CondPosition {
  readonly E: {x: number, y: number},
  readonly W: {x: number, y: number},
  readonly S: {x: number, y: number},
};

const jumpDir = {
// {{{
  'while': {
    'break': 'E',
    'continue': 'W',
  },
  'doWhile': {
    'break': 'E',
    'continue': 'E',
  },
  'for': {
    'break': 'E',
    'continue': 'W',
  },
// }}}
} as const;

class LoopStackInfo {
  readonly type: LoopType;
  readonly breaks: Point[];
  readonly continues: Point[];

  constructor(
    type: LoopType = 'none',
  ) {
    this.type = type;
    this.breaks = [];
    this.continues = [];
  }
}

class Flowchart {
// {{{
  readonly type: 'flowchart';
  readonly shapes: Group;
  readonly config: Config;
  private readonly measureText: MeasureTextFunc;
  loop: LoopStackInfo;

  // allocator of y-axis 
  // for 
  // * arrow crossing other branches that direction is W (West)
  // * rectangle or diamond or horizontal line etc...
  //
  // For Example
  //
  //   branch1                 branch2
  //       |            |          |       
  //       |            |          |       
  //       | object     |          |       
  //    +-----+         |          |       
  //    |     |         |          |       
  //    +-----+         |          |       
  //       |            |          |       
  //       |            |          |       
  //   <---------------------------+
  //       |            |          |       
  //       |<-----------+          |       
  //       | horizontal line       |       
  //       |                       |       
  //
  // When rendering arrow from branch2 to West direction,
  // We have to avoid the objects and the horizontal lines in branch1.
  AllocW: RangeAllocator;

  // allocator of y-axis 
  // for arrow crossing other branches
  // that direction is E (East).
  //
  // For Example
  //
  //   branch1    branch2
  //       |          |       
  //       |          |       
  //  ------------------------>              
  //       |          |       
  //       |          |       
  //
  // When rendering some object or horizontal line in branch2,
  // We have to avoid the arrow.
  AllocE: RangeAllocator;

  alive: boolean;
  readonly dx: number;
  readonly dy: number;
  readonly hlineMargin: number;

  // cache of the size of the label of "yes" or "no" in condition node
  // this is used since measureText function is heavy.
  readonly yesTextSize: TextSize;
  readonly noTextSize: TextSize;

  // NOTE:
  // * "y" is the y-coordinate of end point.
  // TODO: rename variable name to understand easily.
  x: number;
  y: number;

  constructor(
  {
    shapes,
    measureText,
    config,
    loop,
    AllocW,
    AllocE,
    x,
    y,
    yesTextSize,
    noTextSize,
  }:
  {
    config: Config;
    measureText: MeasureTextFunc;
    loop: LoopStackInfo;
    AllocW: RangeAllocator;
    AllocE: RangeAllocator;
    shapes: Group;
    x: number;
    y: number;
    yesTextSize: TextSize;
    noTextSize: TextSize;
  }) {
    this.type = 'flowchart';
    this.shapes = shapes;
    this.measureText = measureText;
    this.config = config;
    this.loop = loop;
    this.AllocW = AllocW;
    this.AllocE = AllocE;

    this.alive = true;
    this.dy = config.flowchart.stepY;
    this.dx = config.flowchart.stepX;
    this.hlineMargin = config.flowchart.hlineMargin;
    this.x = x;
    this.y = y;

    this.yesTextSize = yesTextSize;
    this.noTextSize = noTextSize;

  }

  shiftX = (x: number): void => {
    const {shapes, loop} = this;
    shapes.trans(x, 0);
    this.x += x;

    const {breaks, continues} = loop;
    breaks.forEach(point => point.trans(x, 0));
    continues.forEach(point => point.trans( x, 0));
  }

  step = (distance: number = this.dy, isArrow: boolean = false): void => {
    this.shapes.add(Path.vline({x: 0, y: this.y, step: distance, isArrow}));
    this.move(distance);
  }

  stepAbs = (y: number, isArrow: boolean = false): void => {
    this.step(y - this.y, isArrow);
  }

  move = (distance: number = this.dy): void => {
    // almost same to "step" but do not add vline.
    this.y += distance;
  }

  moveAbs = (y: number): void => {
    this.move(y - this.y);
  }

  private rect = ({x, y, text}: {x: number, y: number, text: string}): Shape => {
    const {w: tw, h: th} = this.measureText(text, this.config.text.attrs);
    const {padX, padY} = this.config.rect;
    const w = tw + padX * 2;
    const h = th + padY * 2;

    return this.wrapText({
      cls: Rect, text,
      x, y, w, h, tw, th,
    });
  }

  public diamond = ({x, y, text}: {x: number, y: number, text: string}): Shape => {
    const {w: tw, h: th} = this.measureText(text, this.config.text.attrs);
    const ratio = this.config.diamond.aspectRatio;
    const w = tw + th / ratio;
    const h = th + tw * ratio;

    return this.wrapText({
      cls: Diamond, text,
      x, y, w, h, tw, th,
    });
  }

  private wrapText = (
    {cls, text, x, y, w, h, tw, th}: 
    {cls: any, text: string, x: number, y: number, w: number, h: number, tw: number, th: number}
  ): Group => {
    const textShape = this.text({text, x: - tw / 2, y: h / 2 - th / 2, w: tw, h: th, isLabel: false}); 
    const wrapShape = new cls({x: - w / 2, w, h});
    return new Group({x, y, children: [textShape, wrapShape]});
  }

  private text = ({
    x,
    y,
    w,
    h,
    text,
    isLabel
  }: {
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    isLabel: boolean
  }): Text => {
    return new Text({
      content: text,
      x, y,
      w, h,
      isLabel,
    });
  }

  public textWithAutoSize = ({
    x,
    y,
    text,
    isLabel
  }: {
    x: number,
    y: number,
    text: string,
    isLabel: boolean
  }): Text => {
    return Text.byMeas({x, y, text, attrs: this.config.text.attrs, meas: this.measureText, isLabel});
  }

  stepText = (content: string): void => {
    const {dy, hlineMargin} = this;
    const rect = this.rect({x: 0, y: 0, text: content});

    // find the space to put vline and rectangle.
    const pos = this.AllocE.findSpace(this.y + dy - hlineMargin, rect.h + hlineMargin);

    // keep allocated y-coordinate range.
    this.AllocW.merge(pos, rect.h + hlineMargin);

    this.stepAbs(pos + hlineMargin, true);
    rect.trans(0, this.y);
    this.shapes.add(rect);
    this.move(rect.h);
  }

  stepCond = (
    {
      content,
      yesDir,
      noDir,
      jumpW,
      jumpE,
      stepY = this.dy,
    }
    :
    {
      content: string,
      yesDir: 'W' | 'S' | 'E',
      noDir: 'W' | 'S' | 'E',
      jumpW: boolean,
      jumpE: boolean,
      stepY?: number,
    }
  ): CondPosition => {
    const {
      AllocW, AllocE,
      shapes, diamond, text,
      stepAbs, move,
      hlineMargin,
      yesTextSize,
      noTextSize,
    } = this;
    const {yesText, noText} = this.config.label;
    const {marginX: labelMarginX, marginY: labelMarginY} = this.config.label;

    const cond = diamond({x: 0, y: 0, text: content});
    // find the space to put hline and diamond.
    let pos: number;
    if (jumpW) {
      let currentPos = this.y + stepY - hlineMargin;
      while (true) {
        // find the space to put diamond.
        const posE = AllocE.findSpace(currentPos, cond.h + hlineMargin);

        // find the space to put hline.
        const posW = AllocW.findSpace(posE + cond.h / 2, hlineMargin);
        if (posW === posE + cond.h / 2) {
          pos = posE;
          break;
        } else {
          currentPos = posW - cond.h / 2;
        }
      }
    } else {
      pos = AllocE.findSpace(this.y + stepY - hlineMargin, cond.h + hlineMargin);
    }
    
    AllocW.merge(pos, cond.h + hlineMargin);
    if (jumpE) AllocE.merge(pos + cond.h / 2, hlineMargin);

    stepAbs(pos + hlineMargin, true);

    cond.trans(0, this.y);
    shapes.add(cond);
    move(cond.h);

    const condPos: CondPosition = {
      E : {x: cond.w / 2, y: cond.y + cond.h / 2},
      W : {x: -cond.w / 2, y: cond.y + cond.h / 2},
      S : {x: 0, y: cond.y + cond.h},
    };

    const yesTextX = yesDir !== 'W' 
      ? condPos[yesDir].x + labelMarginX
      : condPos[yesDir].x - labelMarginX - yesTextSize.w;

    shapes.add(text({
      x: yesTextX,
      y: condPos[yesDir].y + labelMarginY,
      w: yesTextSize.w,
      h: yesTextSize.h,
      text: yesText, isLabel: true,
    }));

    const noTextX = noDir !== 'W' 
      ? condPos[noDir].x + labelMarginX
      : condPos[noDir].x - labelMarginX - noTextSize.w;
    shapes.add(text({
      x: noTextX,
      y: condPos[noDir].y + labelMarginY,
      w: noTextSize.w,
      h: noTextSize.h,
      text: noText, isLabel: true,
    }));

    return condPos;
  }

  branch = (): Flowchart => {
    if (DEBUG) {
      let msg = '';
      let first = this.AllocW.ranges()[0];
      let y = Math.round(this.y);
      if (first) {
        this.AllocW.ranges().forEach(range => {
          const start = Math.round(range.start);
          const end = Math.round(range.end);
          msg += '\n';
          msg += `s:${start}, e:${end}`;
        });
      } else {
        msg = 'first is undef';
      }
      this.h(this.y, `b:${y}, ${msg}`);
    }
    return new Flowchart(
    {
      shapes: new Group({x: this.x, y: this.y, children: []}),
      measureText: this.measureText,
      config: this.config,
      loop: new LoopStackInfo(this.loop.type),
      AllocW: this.AllocW.clone(),
      AllocE: this.AllocE.clone(),
      x: this.x, y: this.y,
      yesTextSize: this.yesTextSize,
      noTextSize: this.noTextSize,
    });
  }

  merge = (flowchart: Flowchart): void => {
    if (Object.is(this, flowchart)) {
      throw `cannot merge same flowchart`;
    }
    flowchart.shapes.children.forEach(child => {
      child.trans(flowchart.shapes.x, 0);
      this.shapes.add(child);
    });

    this.loop.breaks.push(...flowchart.loop.breaks);
    this.loop.continues.push(...flowchart.loop.continues);

    if (flowchart.y > this.y) this.moveAbs(flowchart.y);
  }

  withLoop = (type: LoopType, func: () => void) => {
    const {loop, AllocW, AllocE} = this;
    this.loop = new LoopStackInfo(type);

    const newAllocW = new RangeAllocator(createRangeList()); 

    // NOTE: 
    // We have to discard the inner AllocE of loop after loop
    // and consider the outer AllocE of loop.
    // because it is across the block's flowchart.
    //
    // TODO: 
    // the amount of calculation of "cloneDeep()" is O(n) (n is the number of ranges).
    // To reduce the amount, we have to use stack-based allocation and
    // remove the deep copy process.
    const newAllocE = AllocE.cloneDeep();

    // NOTE:
    // We do not have to consider the outer AllocW because
    // laying flowchart out is done from "W" to "E".
    // So, there are no crossing lines from "E".
    const headW = newAllocW.clone();
    const headE = newAllocE.clone();

    this.AllocW = newAllocW;
    this.AllocE = newAllocE;

    func();
    const newLoop = this.loop;

    this.loop = loop;
    this.AllocW = AllocW;
    this.AllocE = AllocE;

    this.AllocW.mergeAllocator(headW);

    // NOTE: Since laying flowchart out is applied from "W" to "E",
    // we should keep AllocE of inner loop to AllocW.
    this.AllocW.mergeAllocator(headE);

    return newLoop;
  }

  // to debug
  h = (y: number, text: string = '') => {
    this.shapes.add(Path.hline({
      x: 0, y,
      step: 100,
    }));
    if (text !== '') {
      this.shapes.add(new Text({
        content: text,
        x: 0, y,
        w: 0, h: 0,
      }));
    }
  }
  // }}}
}

const createFlowchart = ({
  node,
  config,
  measureText,
}:
{
  node: ASTNode;
  config: Config;
  measureText: MeasureTextFunc;
}): Flowchart => {
// {{{
  const flowchart = new Flowchart(
  {
    shapes: new Group({x: 0, y: 0, children: []}),
    measureText,
    config,
    loop: new LoopStackInfo(),
    AllocW: new RangeAllocator(createRangeList()),
    AllocE: new RangeAllocator(createRangeList()),
    x: 0, y: config.flowchart.marginY,
    yesTextSize: measureText(config.label.yesText, config.label.attrs),
    noTextSize: measureText(config.label.noText, config.label.attrs),
  });
  createFlowchartSub(node, flowchart);
  flowchart.shiftX(-flowchart.shapes.minX + config.flowchart.marginX);
  return flowchart;
// }}}
}

const createFlowchartSub = (node: ASTNode, flowchart: Flowchart, jump: boolean = false): void => {
// {{{
  const {
    step, stepAbs, stepText,
    AllocW, AllocE, loop,
    hlineMargin,
  } = flowchart;
  const {children} = node;
  const childNum = children.length;
  let childIdx = 0;
  while (childIdx < childNum && flowchart.alive) {
    let child = children[childIdx];
    switch (child.type) {
      case 'text': {
        stepText(child.content);
        break;
      }
      case 'pass': {
        step();
        break;
      }
      case 'if': {
        const nodes: ASTNode[] = [];
        if (
          childIdx < childNum &&
          children[childIdx].type === 'if'
        ) {
          nodes.push(children[childIdx]);
          childIdx++;
        }
        while (
          childIdx < childNum &&
          children[childIdx].type === 'elif'
        ) {
          nodes.push(children[childIdx]);
          childIdx++;
        }
        if (
          childIdx < childNum &&
          children[childIdx].type === 'else'
        ) {
          nodes.push(children[childIdx]);
          childIdx++;
        }
        createIfFlowchart(nodes, flowchart);
        continue;
      }
      case 'while': {
        createWhileFlowchart(child, flowchart);
        break;
      }
      case 'do': {
        createDoWhileFlowchart(child, children[childIdx + 1], flowchart);
        childIdx += 2;
        continue;
      }
      case 'break':
      case 'continue': {
        if (loop.type === 'none') {
          throw 'loop type must not be none here.';
        }
        const direction = jumpDir[loop.type][child.type];
        let pos: number;
        if (jump) {
          pos = flowchart.y - hlineMargin;
        } else if (direction === 'W') {
          pos = flowchart.y;
          let posPrev = pos - 99999;
          // find space for both AllocW and AllocE.
          while (pos !== posPrev) {
            posPrev = pos;
            pos = AllocW.findSpace(pos, hlineMargin);
            pos = AllocE.findSpace(pos, hlineMargin);
          }
        } else {
          pos = AllocE.findSpace(flowchart.y, hlineMargin);
        }
        
        AllocW.merge(pos, hlineMargin);
        if (direction === 'E') AllocE.merge(pos, hlineMargin);

        if (!jump) stepAbs(pos + hlineMargin);

        const {breaks, continues} = loop;
        (child.type === 'break' ?  breaks : continues).push(new Point({x: 0, y: flowchart.y}));
        flowchart.alive = false;
        break;
      }
      case 'try': {
        const tryNode = child;
        const exceptNodes: ASTNode[] = [];
        childIdx++;
        while (
          childIdx < childNum &&
          children[childIdx].type === 'except'
        ) {
          exceptNodes.push(children[childIdx]);
          childIdx++;
        }
        createTryExceptFlowchart(tryNode, exceptNodes, flowchart);
        continue;
      }
      case 'switch': {
        const switchNode = child;
        const caseNodes: ASTNode[] = switchNode.children;
        createSwitchCaseFlowchart(switchNode, caseNodes, flowchart);
        break;
      }
      case 'program': 
      case 'none': 
      case 'else':
      case 'elif':
      case 'for': 
      case 'case': 
      case 'except': {
        throw `child type ${child.type} is not expected. this may be bug...`;
        // break;
      }
      default: {
        const _: never = child.type;
        throw `child type ${_} is invalid.`;
      }
    }
    childIdx++;
  }

  // }}}
};

const createIfFlowchart = (nodes: ASTNode[], flowchart: Flowchart, jump: boolean = false): void => {
// {{{
  //                 |
  //                 |
  //             _.-' '-._ branchHline
  //            '-._   _.-'----+
  //                '+'        |
  //                 |         |
  // ifShapeGroup +--+--+   +--+--+ elseShapeGroup
  //              |     |   |     |
  //              +--+--+   +--+--+
  //                 |         |
  //                 |         |
  //                 |<--------+
  //                 | mergeHline
  if (nodes.length === 0) return;
  if (nodes[0].type === 'else') {
    createFlowchartSub(nodes[0], flowchart, jump);
    return;
  }

  const {dx, dy, hlineMargin} = flowchart;
  const ifFlowchart = flowchart.branch();
  const elseFlowchart = flowchart.branch();
  const loopType = flowchart.loop.type;

  const ifNode = nodes[0];
  let yes: CondInfo = {dir: 'S', jump: false};
  let no: CondInfo = {dir: 'E', jump: false};

  // calculate yes
  if (ifNode.children.length > 0) {
    const type = ifNode.children[0].type;
    if (type === 'break' || type === 'continue') {
      if (loopType === 'none') {
          throw 'loop type must not be none here.';
      }
      yes = {dir: jumpDir[loopType][type], jump: true};
      // if "yes" direction is not "S", default "no" direction is "S".
      no = {dir: 'S', jump: false};
    }
  }

  // if "elif" or "else" exists, calculate no
  if (
    nodes.length > 1
    && nodes[1].type === 'else'
    && nodes[1].children.length > 0
  ) {
    const type = nodes[1].children[0].type;
    if (type === 'break' || type === 'continue') {
      if (loopType === 'none') {
          throw 'loop type must not be none here.';
      }
      const dir = jumpDir[loopType][type];
      if (dir !== yes.dir) no = {dir, jump: true};
    }
  }

  const condPos = flowchart.stepCond({
    content: ifNode.content,
    yesDir: yes.dir,
    noDir: no.dir,
    jumpW: 
      (yes.jump && yes.dir === 'W')
      ||(no.jump && no.dir === 'W'),
    jumpE:
      (yes.jump && yes.dir === 'E')
      ||(no.jump && no.dir === 'E'),
    stepY: nodes[0].type === 'if' ? dy : hlineMargin,
  });

  ifFlowchart.moveAbs(condPos[yes.dir].y);
  createFlowchartSub(ifNode, ifFlowchart, yes.jump);
  ifFlowchart.shiftX(condPos[yes.dir].x);

  // create else part flowchart
  elseFlowchart.moveAbs(condPos[no.dir].y);
  createIfFlowchart(nodes.slice(1), elseFlowchart, no.jump);
  if (!no.jump && !yes.jump) {
    const elseFlowchartX = Math.max(condPos.E.x, ifFlowchart.shapes.maxX) + dx - elseFlowchart.shapes.minX;
    elseFlowchart.shiftX(elseFlowchartX);

    ifFlowchart.shapes.add(Path.hline({
      x: condPos.E.x, y: condPos.E.y,
      step: elseFlowchart.shapes.x - condPos.E.x,
    }));

    let mergeY: number;
    if (elseFlowchart.alive) {
      const pos = flowchart.AllocE.findSpace(
        Math.max(ifFlowchart.y, elseFlowchart.y), hlineMargin);
      flowchart.AllocW.merge(pos, hlineMargin);
      mergeY = pos + hlineMargin;
    } else {
      mergeY = Math.max(ifFlowchart.y, elseFlowchart.y);
    }

    if (ifFlowchart.alive) ifFlowchart.stepAbs(mergeY);
    if (elseFlowchart.alive) elseFlowchart.stepAbs(mergeY);

    if (elseFlowchart.alive) {
      ifFlowchart.shapes.add(Path.hline({
        x: elseFlowchart.shapes.x,
        y: mergeY,
        step: - elseFlowchart.shapes.x + ifFlowchart.shapes.x,
        isArrow: ifFlowchart.alive,
      }));
    }
  } else {
    elseFlowchart.shiftX(condPos[no.dir].x);
  }

  flowchart.merge(ifFlowchart);
  flowchart.merge(elseFlowchart);
  if (!ifFlowchart.alive && !elseFlowchart.alive) flowchart.alive = false;
  // }}}
}

const createWhileFlowchart = (node: ASTNode, flowchart: Flowchart): void => {
// {{{
  //                     |
  //  loop back path     |
  //       +------------>|
  //       |             |
  //       |         _.-' '-._
  //       |        '-._   _.-'-----------+
  //       |            '+'               |
  //       |             |                |
  //       |    block +--+--+             |  loop exit path
  //       |          |     | break       |
  //       |          |     +------------>|
  //       | continue |     |             |
  //       |<---------+     |             |
  //       |          |     |             |
  //       |          +--+--+             |
  //       |             |                |
  //       +-------------+                |
  //                                      |
  //                     +----------------+
  //                     |

  const blockFlowchart = flowchart.branch();
  const {
    moveAbs, stepAbs, dx, dy, stepCond,
    withLoop, shapes,
    AllocW, AllocE,
    hlineMargin,
  } = blockFlowchart;

  {
    const pos = AllocE.findSpace(blockFlowchart.y + dy - hlineMargin, hlineMargin);
    AllocW.merge(pos, hlineMargin);
    stepAbs(pos + hlineMargin);
  }

  const loopBackMergeY = blockFlowchart.y;
  const condPos = stepCond({
    content: node.content,
    yesDir: 'S', noDir: 'E',
    jumpE: false, jumpW: false,
    stepY: hlineMargin,
  });

  const {breaks, continues} = 
    withLoop('while', () => {
      createFlowchartSub(node, blockFlowchart);
    });

  const loopBackPoints: Point[] = [...continues];
  const exitPoints: Point[] = [...breaks];
  if (blockFlowchart.alive) {
    const pos = AllocE.findSpace(blockFlowchart.y, hlineMargin);
    AllocW.merge(pos, hlineMargin);
    stepAbs(pos + hlineMargin);
    loopBackPoints.push(new Point({x: 0, y: blockFlowchart.y}));
  }
  exitPoints.push(new Point({...condPos.E}));

  const loopBackPathX = Math.min(condPos.W.x, shapes.minX) - dx;
  const exitPathX = Math.max(condPos.E.x, shapes.maxX) + dx;

  // loop back path
  loopBackPoints
    .sort((p1, p2) => p1.y > p2.y ? -1 : 1)
    .forEach((p, idx) => {
      shapes.add(new Path({
        x: p.x, y: p.y, isArrow: true,
        cmds: 
          idx === 0 ? 
          [ ['h', loopBackPathX - p.x],
            ['v', loopBackMergeY - p.y],
            ['h', -loopBackPathX] ] :
          [ ['h', loopBackPathX - p.x] ],
      }));
    });

  {
    const pos = AllocE.findSpace(blockFlowchart.y, hlineMargin);
    AllocW.merge(pos, hlineMargin);
    moveAbs(pos + hlineMargin);
  }

  // loop exit path
  exitPoints
    .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
    .forEach((p, idx) => {
      shapes.add(new Path({
        x: p.x, y: p.y, isArrow: idx !== 0,
        cmds: 
          idx === 0 ? 
          [ ['h', exitPathX - p.x],
            ['v', blockFlowchart.y - p.y],
            ['h', -exitPathX] ] :
          [ ['h', exitPathX - p.x] ],
      }));
  });

  flowchart.merge(blockFlowchart);
  // }}}
}

const createDoWhileFlowchart = (doNode: ASTNode, whileNode: ASTNode, flowchart: Flowchart): void => {
// {{{
  //
  //                   |
  //  loop back path   |
  //       +---------->|
  //       |           |
  //       |  block +--+--+
  //       |        |     | break
  //       |        |     +------------------+
  //       |        |     |                  |
  //       |        |     | continue         |
  //       |        |     +---+              |
  //       |        |     |   |              |
  //       |        +--+--+   | skip path    |
  //       |           |      |              |
  //       |           |<-----+              |
  //       |           |                     |
  //       |       _.-' '-._                 |
  //       |      '-._   _.-'--------------->|
  //       |          '+'                    | loop exit path
  //       |           |                     |
  //       +-----------+                     |
  //                                         |
  //                   +---------------------+
  //                   |

  const blockFlowchart = flowchart.branch();
  const {
    moveAbs, stepAbs, dx, dy,
    shapes, withLoop,
    AllocW, AllocE,
    hlineMargin,
  } = blockFlowchart;

  {
    const pos = AllocE.findSpace(blockFlowchart.y + dy - hlineMargin, hlineMargin);
    AllocW.merge(pos, hlineMargin);
    stepAbs(pos + hlineMargin);
  }

  const loopBackMergeY = blockFlowchart.y;

  const {breaks, continues} = 
    withLoop('doWhile', () => {
      createFlowchartSub(doNode, blockFlowchart);
    });

  const exitPoints: Point[] = [...breaks];

  let loopBackPathX: number;
  let exitPathX: number;
  let skipPathX = 0;

  if (blockFlowchart.alive || continues.length > 0) {
    if (continues.length > 0) {
      const pos = AllocE.findSpace(blockFlowchart.y, hlineMargin);
      AllocW.merge(pos, hlineMargin);
      if (blockFlowchart.alive) {
        stepAbs(pos + hlineMargin);
      } else {
        moveAbs(pos + hlineMargin);
      }
      skipPathX = shapes.maxX + dx;

      continues
        .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
        .forEach((p, idx) => {
          shapes.add(new Path({
            x: p.x, y: p.y,
            isArrow: idx !== 0 || blockFlowchart.alive,
            cmds: 
              idx === 0 ?
              [ ['h', skipPathX - p.x],
                ['v', blockFlowchart.y - p.y],
                ['h', -skipPathX] ] :
              [ ['h', skipPathX - p.x] ],
          }));
        });
    }

    const diamondFlowchart = blockFlowchart.branch();
    const condPos = diamondFlowchart.stepCond({
      content: whileNode.content,
      yesDir: 'S', noDir: 'E',
      jumpW: false, jumpE: false,
    });

    // NOTE: diamondMaxX = (right side of diamond) + ("no" label of diamond)
    const diamondMaxX = diamondFlowchart.shapes.maxX;
    const diamondMinX = diamondFlowchart.shapes.minX;
    blockFlowchart.merge(diamondFlowchart);

    {
      const pos = AllocE.findSpace(blockFlowchart.y, hlineMargin);
      AllocW.merge(pos, hlineMargin);
      stepAbs(pos + hlineMargin);
    }
    loopBackPathX = Math.min(diamondMinX, shapes.minX) - dx;

    // loop back path
    shapes.add(new Path({
      x: 0, y: blockFlowchart.y, isArrow: true,
      cmds: [
        ['h', loopBackPathX],
        ['v', loopBackMergeY - blockFlowchart.y],
        ['h', -loopBackPathX],
      ],
    }));

    if (breaks.length > 0) {
      exitPathX = Math.max(diamondMaxX, shapes.maxX, skipPathX) + dx;
    } else {
      // if no "break"s, no need to avoid shapes and skipPath.
      exitPathX = diamondMaxX + dx;
    }
    exitPoints.push(new Point({...condPos.E}));
  } else {
    {
      const pos = AllocE.findSpace(blockFlowchart.y, hlineMargin);
      AllocW.merge(pos, hlineMargin);
      moveAbs(pos + hlineMargin);
    }
    exitPathX = shapes.maxX + dx;
  }

  // loop exit path
  {
    const pos = AllocE.findSpace(blockFlowchart.y, hlineMargin);
    AllocW.merge(pos, hlineMargin);
    moveAbs(pos + hlineMargin);
  }

  exitPoints
    .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
    .forEach((p, idx) => {
      shapes.add(new Path({
        x: p.x, y: p.y, isArrow: idx !== 0,
        cmds: 
          idx === 0 ?
          [ ['h', exitPathX - p.x],
            ['v', blockFlowchart.y - p.y],
            ['h', -exitPathX] ] :
          [ ['h', exitPathX - p.x] ],
      }));
    });

  flowchart.merge(blockFlowchart);
  // }}}
}

// const createBlockFlowchart = (node: ASTNode, flowchart: Flowchart, jump: boolean): void => {
// // {{{
//   //            |     
//   //            |
//   //      +-----+-----+ frame border
//   //      | +-------+ |
//   //      | |       | |
//   //      | |       | |
//   //      | +-------+ |
//   //      +-----+-----+
//   //            |      
//   //            |      

//   const {dx, dy, hlineMargin} = flowchart;

//   flowchart.step();
//   const blockFlowchart = flowchart.branch();

//   // find frame border top y-axis space.
//   const frameTopY = blockFlowchart.AllocE.findSpace(
//     blockFlowchart.y,
//     hlineMargin
//   );

//   blockFlowchart.AllocW.merge(frameTopY, hlineMargin);
//   blockFlowchart.stepAbs(frameTopY);

//   createFlowchartSub(node, blockFlowchart);

//   // to avoid blockFlowchart's last node, step blockFlowchart.
//   blockFlowchart.step();

//   // find frame border bottom y-axis space.
//   const frameBottomY = blockFlowchart.AllocE.findSpace(
//     blockFlowchart.y,
//     hlineMargin
//   );
//   blockFlowchart.AllocW.merge(frameTopY, hlineMargin);

//   blockFlowchart.shapes.add(
//     new Rect({
//       x: blockFlowchart.x + blockFlowchart.shapes.minX - dx,
//       y: frameTopY,
//       w: blockFlowchart.shapes.maxX - blockFlowchart.shapes.minX + 2 * dx,
//       h: frameBottomY - frameTopY,
//     })
//   );

//   flowchart.merge(blockFlowchart);
//   if (!blockFlowchart.alive) flowchart.alive = false;

// // }}}
// }

const createTryExceptFlowchart = (tryNode: ASTNode, exceptNodes: ASTNode[], flowchart: Flowchart): void => {
// {{{
  //                     |     
  //                     | frame border
  //               +-----+-----+           
  //               | +-------+ | exceptHline
  //               | |       | +------+-------------+
  //   tryShapeGroup |       | |      | error1      | error2
  //               | |       | |      |             |
  //               | |       | |      v             v
  //               | |       | |   +-----+       +-----+ exceptShapeGroups
  //               | +-------+ |   |     |       |     |
  //               +-----+-----+   +--+--+       +--+--+
  //                     |            |             |
  //                     |            |             |
  //                     |<-----------+-------------+
  //                     |  mergeHline
  //                     |

  // NOTE:
  // to find starting point of exceptHline,
  // we can not use createBlockFlowchart directory...

  const {dx, hlineMargin} = flowchart;

  const tryFlowchart: Flowchart = flowchart.branch();
  const exceptFlowcharts: Flowchart[] = exceptNodes.map(() => flowchart.branch());

  let exceptHlineX: number;
  let exceptHlineY: number;

  const blockFlowchart = tryFlowchart.branch();

  // find frame border top y-axis space.
  const frameTopY_ = blockFlowchart.AllocE.findSpace(
    blockFlowchart.y,
    hlineMargin
  );

  blockFlowchart.AllocW.merge(frameTopY_, hlineMargin);
  const frameTopY = frameTopY_ + hlineMargin;
  blockFlowchart.stepAbs(frameTopY);

  createFlowchartSub(tryNode, blockFlowchart);

  // NOTE:
  // Since blockFlowchart.AllocE's pointer has
  // already gone to forward,
  // We must use tryFlowchart.AllocE here.
  const exceptHlineY_ = tryFlowchart.AllocE.findSpace(
    frameTopY,
    hlineMargin,
  );
  tryFlowchart.AllocW.merge(
    exceptHlineY_,
    hlineMargin,
  );
  exceptHlineY = exceptHlineY_ + hlineMargin;

  // find frame border bottom y-axis space.
  const frameBottomY_ = tryFlowchart.AllocE.findSpace(
    Math.max(
      blockFlowchart.y,
      exceptHlineY
    ),
    hlineMargin
  );
  tryFlowchart.AllocW.merge(frameBottomY_, hlineMargin);

  const frameBottomY = frameBottomY_ + hlineMargin;

  if (blockFlowchart.alive) {
    // step blockFlowchart.
    blockFlowchart.stepAbs(frameBottomY);
  } else {
    // move blockFlowchart.
    blockFlowchart.moveAbs(frameBottomY);
  }

  exceptHlineX = blockFlowchart.x + blockFlowchart.shapes.maxX + dx;
  const rectX = blockFlowchart.x + blockFlowchart.shapes.minX - dx;
  blockFlowchart.shapes.add(
    new Frame({
      x: rectX,
      y: frameTopY,
      w: exceptHlineX - rectX,
      h: frameBottomY - frameTopY,
    })
  );

  tryFlowchart.merge(blockFlowchart);
  if (!blockFlowchart.alive) tryFlowchart.alive = false;

  // change start y-coordinate of exceptFlowcharts
  exceptFlowcharts.forEach(exceptFlowchart => {
    exceptFlowchart.moveAbs(exceptHlineY);
  });

  let prevFlowchart: Flowchart = tryFlowchart;
  exceptNodes.forEach((exceptNode, idx) => {
    const exceptFlowchart: Flowchart = exceptFlowcharts[idx];
    const startY = exceptFlowchart.y;

    createFlowchartSub(exceptNode, exceptFlowchart);

    const exceptFlowchartX = prevFlowchart.x + prevFlowchart.shapes.maxX + dx - exceptFlowchart.shapes.minX;

    exceptFlowchart.shiftX(exceptFlowchartX);

    exceptFlowchart.shapes.add(exceptFlowchart.textWithAutoSize({
      x: exceptFlowchart.config.label.marginX,
      y: startY + exceptFlowchart.config.label.marginY,
      text: exceptNode.content, isLabel: true,
    }));

    prevFlowchart = exceptFlowchart;
  });

  // draw "exceptHline".
  tryFlowchart.shapes.add(Path.hline({
    x: exceptHlineX, y: exceptHlineY,
    step: exceptFlowcharts.slice(-1)[0].shapes.x - exceptHlineX,
  }));

  // const loopType = flowchart.loop.type;

  // let isTryFlowchartAlive = tryFlowchart.alive;
  let isAnyExceptFlowchartAlive = exceptFlowcharts.some(flowchart => flowchart.alive);

  // if any flowchart are alive, find y-axis space for merge position
  if (isAnyExceptFlowchartAlive) {
    const flowchartMaxY = 
      [tryFlowchart, ...exceptFlowcharts]
      .map(flowchart => flowchart.y)
      .reduce((prev, cur) => Math.max(prev, cur));

    // find position of mergeHline
    const pos = flowchart.AllocE.findSpace(
      flowchartMaxY,
      hlineMargin
    );
    flowchart.AllocW.merge(pos, hlineMargin);
    const mergeY = pos + hlineMargin;

    // step all alive flowchart to mergeY.
    [tryFlowchart, ...exceptFlowcharts]
      .filter(flowchart => flowchart.alive)
      .forEach(flowchart => {
        flowchart.stepAbs(mergeY);
      });

    const lastAliveFlowchart = exceptFlowcharts
      .filter(exceptFlowchart => exceptFlowchart.alive)
      .slice(-1)[0];

    // draw "mergeHline".
    tryFlowchart.shapes.add(Path.hline({
      x: lastAliveFlowchart.shapes.x,
      y: mergeY,
      step: - lastAliveFlowchart.shapes.x + tryFlowchart.shapes.x,
      isArrow: tryFlowchart.alive,
    }));
  } else if (tryFlowchart.alive) {
    // to connect next statement,
    // we should step "tryFlowchart".
    const maxY = [tryFlowchart, ...exceptFlowcharts]
      .map(flowchart => flowchart.y)
      .reduce((prev, cur) => Math.max(prev, cur));
    tryFlowchart.stepAbs(maxY);
  }

  flowchart.merge(tryFlowchart);
  exceptFlowcharts.forEach(exceptFlowchart => flowchart.merge(exceptFlowchart));

  // if all branch are dead, disable "alive" flag.
  if ([tryFlowchart, ...exceptFlowcharts]
      .every((flowchart) => !flowchart.alive)
  ) {
    flowchart.alive = false;
  }

  // }}}
}

const createSwitchCaseFlowchart = (switchNode: ASTNode, caseNodes: ASTNode[], flowchart: Flowchart): void => {
// {{{
  //                 |
  //                 |
  //             _.-' '-._ 
  //            '-._   _.-'
  //                '+'
  //                 | caseHline
  //                 +----------------+--------------+
  //                 | case0Label     | case1Label   | case2Label
  //              +--+--+          +--+--+        +--+--+
  //              |     |          |     |        |     |
  //              +--+--+          +--+--+        +--+--+
  //                 |                |              |
  //                 |                |              |
  //                 |<---------------+--------------+
  //                 | mergeHline
  //
  const {dx, hlineMargin} = flowchart;

  const blockFlowchart = flowchart.branch();
  const caseFlowcharts: Flowchart[] = caseNodes.map(() => flowchart.branch());

  const diamond = blockFlowchart.diamond({
    x: 0,
    y: 0,
    text: switchNode.content,
  });

  // find y-axis space to put vline+diamond+vline
  const _diamondTop = blockFlowchart.AllocE.findSpace(
    flowchart.y,
    hlineMargin + diamond.h + hlineMargin,
  );
  blockFlowchart.AllocW.merge(
    _diamondTop,
    hlineMargin + diamond.h + hlineMargin,
  );
  const diamondTop = _diamondTop + hlineMargin;

  blockFlowchart.stepAbs(diamondTop, true);

  blockFlowchart.move(diamond.h);
  // draw diamond
  diamond.trans(0, diamondTop);
  blockFlowchart.shapes.add(diamond);
  blockFlowchart.step(hlineMargin);

  const caseHlineY = blockFlowchart.y;

  // change start y-coordinate of exceptFlowcharts
  caseFlowcharts.forEach(caseFlowchart => {
    caseFlowchart.moveAbs(caseHlineY);
  });

  let prevFlowchartMaxAbsX = 0;
  caseNodes.forEach((caseNode, idx) => {
    const caseFlowchart: Flowchart = caseFlowcharts[idx];
    const startY = caseFlowchart.y;

    createFlowchartSub(caseNode, caseFlowchart);

    const caseFlowchartX = idx === 0 ? 0 : prevFlowchartMaxAbsX + dx - caseFlowchart.shapes.minX;

    caseFlowchart.shiftX(caseFlowchartX);

    caseFlowchart.shapes.add(caseFlowchart.textWithAutoSize({
      x: caseFlowchart.config.label.marginX,
      y: startY + caseFlowchart.config.label.marginY,
      text: caseNode.content, isLabel: true,
    }));

    prevFlowchartMaxAbsX = caseFlowchart.x + caseFlowchart.shapes.maxX;
  });

  // draw "caseHline"
  blockFlowchart.shapes.add(Path.hline({
    x: 0,
    y: caseHlineY,
    step: caseFlowcharts.slice(-1)[0].shapes.x,
  }));

  const aliveCaseFlowchartNum = caseFlowcharts
    .map(caseFlowchart => (caseFlowchart.alive ? 1 : 0) as number)
    .reduce((prev: number, cur: number) => (prev + cur));

  const flowchartMaxY = caseFlowcharts
    .map(flowchart => flowchart.y)
    .reduce((prev, cur) => Math.max(prev, cur));

  // if any flowchart are alive, find y-axis space for merge position
  if (
    aliveCaseFlowchartNum > 0
    &&
      // if first case is alive and alone, no need to draw mergeHline
      !(
        caseFlowcharts[0].alive
        && aliveCaseFlowchartNum === 1
      )
  ) {

    // find position of mergeHline
    const pos = flowchart.AllocE.findSpace(
      flowchartMaxY,
      hlineMargin
    );
    flowchart.AllocW.merge(pos, hlineMargin);
    const mergeY = pos + hlineMargin;

    // step all alive flowchart to mergeY.
    caseFlowcharts
      .filter(caseFlowchart => caseFlowchart.alive)
      .forEach(caseFlowchart => {
        caseFlowchart.stepAbs(mergeY);
      });

    const lastAliveFlowchart = caseFlowcharts
      .filter(caseFlowchart => caseFlowchart.alive)
      .slice(-1)[0];

    // draw "mergeHline".
    blockFlowchart.shapes.add(Path.hline({
      x: lastAliveFlowchart.shapes.x,
      y: mergeY,
      step: - lastAliveFlowchart.shapes.x + blockFlowchart.shapes.x,
      isArrow: caseFlowcharts[0].alive,
    }));
  }
  
  // NOTE: because of mergeHline,
  // some flowchart might grow from previous flowchartMaxY
  const flowchartMaxY2 = caseFlowcharts
    .map(flowchart => flowchart.y)
    .reduce((prev, cur) => Math.max(prev, cur));
  // step all flowchart to mergeY.
  caseFlowcharts
    .forEach(caseFlowchart => {
      if (caseFlowchart.alive) {
        caseFlowchart.stepAbs(flowchartMaxY2);
      } else {
        caseFlowchart.moveAbs(flowchartMaxY2);
      }
    });

  flowchart.merge(blockFlowchart);
  caseFlowcharts.forEach(caseFlowchart => {
    flowchart.merge(caseFlowchart);
  });

  // if all branch are dead, disable "alive" flag.
  if (aliveCaseFlowchartNum === 0) {
    flowchart.alive = false;
  }
// }}}
}

export {
  createFlowchart,
  Flowchart,
}
