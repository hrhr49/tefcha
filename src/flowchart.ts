import {ASTNode} from './parser'
import {
  MeasureTextFunc,
  Shape,
  Group,
  Point,
  Path,
  Text,
  Rect,
  Diamond,
} from './shape'
import {Config} from './config'
import {RangeAllocator, createRangeList} from './range_allocator'


type LoopType = 'while' | 'doWhile' | 'for' | 'none';

//  Direction
//         N
//         ^
//         |
//  W <----+----> E
//         |
//         v
//         S
type Direction = 'N' | 'S' | 'E' | 'W';

interface CondInfo {
  readonly dir: Direction;
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
};

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
  AllocW: RangeAllocator;
  AllocE: RangeAllocator;
  alive: boolean;
  readonly dx: number;
  readonly dy: number;
  y: number;
  x: number;

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
    this.x = x;
    this.y = y;
  }

  shiftX = (x: number): void => {
    const {shapes, loop} = this;
    shapes.trans(x, 0);
    this.x += x;

    const {breaks, continues} = loop;
    breaks.forEach(point => point.trans(x, 0));
    continues.forEach(point => point.trans( x, 0));
  }

  step = (distance: number = this.dy): void => {
    this.shapes.add(Path.vline({x: 0, y: this.y, step: distance}));
    this.move(distance);
  }

  stepAbs = (y: number): void => {
    this.step(y - this.y);
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

  private diamond = ({x, y, text}: {x: number, y: number, text: string}): Shape => {
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
    const textShape = this.text({text, x: - tw / 2, y: h / 2 - th / 2, isLabel: false}); 
    const wrapShape = new cls({x: - w / 2, w, h});
    return new Group({x, y, children: [textShape, wrapShape]});
  }

  private text = ({x, y, text, isLabel}: {x: number, y: number, text: string, isLabel: boolean}): Text => {
    return Text.byMeas({x, y, text, attrs: this.config.text.attrs, meas: this.measureText, isLabel});
  }

  stepText = (content: string): void => {
    const {dy} = this;
    const rect = this.rect({x: 0, y: 0, text: content});

    // find the space to put vline and rectangle.
    const pos = this.AllocE.findSpace(this.y, rect.h + dy);

    // keep allocated y-coordinate range.
    this.AllocW.merge(pos, rect.h + dy);

    this.stepAbs(pos + dy);
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
    }
    :
    {
      content: string,
      yesDir: Direction,
      noDir: Direction,
      jumpW: boolean,
      jumpE: boolean,
    }
  ): CondPosition => {
    const {
      AllocW, AllocE,
      shapes, diamond, text,
      stepAbs, move, dy,
    } = this;
    const {yesText, noText} = this.config.label;
    const {labelMarginX, labelMarginY} = this.config.diamond;

    const cond = diamond({x: 0, y: 0, text: content});
    // find the space to put vline and diamond.
    const pos = (jumpW ? AllocW : AllocE)
      .findSpace(this.y, cond.h + dy);
    
    AllocW.merge(pos, cond.h + dy);
    if (jumpE) AllocE.merge(pos, cond.h + dy);

    stepAbs(pos + dy);

    cond.trans(0, this.y);
    shapes.add(cond);
    move(cond.h);

    const condPos: CondPosition = {
      E : {x: cond.w / 2, y: cond.y + cond.h / 2},
      W : {x: -cond.w / 2, y: cond.y + cond.h / 2},
      S : {x: 0, y: cond.y + cond.h},
    };

    shapes.add(text({
      x: condPos[yesDir].x + labelMarginX,
      y: condPos[yesDir].y + labelMarginY,
      text: yesText, isLabel: true,
    }));

    shapes.add(text({
      x: condPos[noDir].x + labelMarginX,
      y: condPos[noDir].y + labelMarginY,
      text: noText, isLabel: true,
    }));

    return condPos;
  }

  branch = (): Flowchart => {
    return new Flowchart(
    {
      shapes: new Group({x: this.x, y: this.y, children: []}),
      measureText: this.measureText,
      config: this.config,
      loop: new LoopStackInfo(this.loop.type),
      AllocW: this.AllocW.clone(),
      AllocE: this.AllocE.clone(),
      x: this.x, y: this.y,
    });
  }

  merge = (flowchart: Flowchart): void => {
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
  // h = (y: number) => {
  //   this.shapes.add(Path.hline({
  //     x: 0, y,
  //     step: 100,
  //   }));
  // }
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
  });
  createFlowchartSub(node, flowchart);
  flowchart.shiftX(-flowchart.shapes.minX + config.flowchart.marginX);
  return flowchart;
// }}}
}

const createFlowchartSub = (node: ASTNode, flowchart: Flowchart, jump: boolean = false): void => {
// {{{
  const {
    step, stepAbs, stepText, dy,
    AllocW, AllocE, loop,
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
        const direction = jumpDir[loop.type][child.type];
        const pos = jump ?  (flowchart.y - dy) :
          (direction === 'W' ? AllocW : AllocE).findSpace(flowchart.y, dy);
        
        AllocW.merge(pos, dy);
        if (direction === 'E') AllocE.merge(pos, dy);

        if (!jump) stepAbs(pos + dy);

        const {breaks, continues} = loop;
        (child.type === 'break' ?  breaks : continues).push(new Point({x: 0, y: flowchart.y}));
        flowchart.alive = false;
        break;
      }
      case 'for': {
        break;
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

  const {dx, dy} = flowchart;
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
        Math.max(ifFlowchart.y, elseFlowchart.y), dy)
        flowchart.AllocW.merge(pos, dy);
        mergeY = pos + dy;
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
    move, stepAbs, dx, dy, stepCond,
    withLoop, shapes,
    AllocW, AllocE,
  } = blockFlowchart;

  {
    const pos = AllocE.findSpace(blockFlowchart.y, dy);
    AllocW.merge(pos, dy);
    stepAbs(pos + dy);
  }

  const loopBackMergeY = blockFlowchart.y;
  const condPos = stepCond({
    content: node.content,
    yesDir: 'S', noDir: 'E',
    jumpE: false, jumpW: false,
  });

  const {breaks, continues} = 
    withLoop('while', () => {
      createFlowchartSub(node, blockFlowchart);
    });

  const loopBackPoints: Point[] = [...continues];
  const exitPoints: Point[] = [...breaks];
  if (blockFlowchart.alive) {
    const pos = AllocE.findSpace(blockFlowchart.y, dy);
    AllocW.merge(pos, dy);
    stepAbs(pos + dy);
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

  move();

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
    move, step, stepAbs, dx, dy, stepCond,
    shapes, withLoop,
    AllocW, AllocE,
  } = blockFlowchart;

  {
    const pos = AllocE.findSpace(blockFlowchart.y, dy);
    AllocW.merge(pos, dy);
    stepAbs(pos + dy);
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
      if (blockFlowchart.alive) {
        step();
      } else {
        move();
      }
      skipPathX = shapes.maxX + dx;

      continues
        .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
        .forEach((p, idx) => {
          shapes.add(new Path({
            x: p.x, y: p.y, isArrow: true,
            cmds: 
              idx === 0 ?
              [ ['h', skipPathX - p.x],
                ['v', blockFlowchart.y - p.y],
                ['h', -skipPathX] ] :
              [ ['h', skipPathX - p.x] ],
          }));
        });
    }

    const condPos = stepCond({
      content: whileNode.content,
      yesDir: 'S', noDir: 'E',
      jumpW: false, jumpE: false,
    });

    step();
    loopBackPathX = Math.min(condPos.W.x, shapes.minX) - dx;

    // loop back path
    shapes.add(new Path({
      x: 0, y: blockFlowchart.y, isArrow: true,
      cmds: [
        ['h', loopBackPathX],
        ['v', loopBackMergeY - blockFlowchart.y],
        ['h', -loopBackPathX],
      ],
    }));

    exitPathX = Math.max(condPos.E.x, shapes.maxX, skipPathX) + dx;
    exitPoints.push(new Point({...condPos.E}));
  } else {
    move();
    exitPathX = shapes.maxX + dx;
  }

  // loop exit path
  move();

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

export {
  createFlowchart,
  Flowchart,
}
