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
type Direction = 'N' | 'S' | 'E' | 'W';

interface CondInfo {
  readonly direction: Direction;
  readonly isJump: boolean;
  readonly shouldStep: boolean;
};

interface CondPosition {
  readonly E: {x: number, y: number},
  readonly W: {x: number, y: number},
  readonly S: {x: number, y: number},
};

const jumpDirectionTable = {
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
  readonly breakPoints: Point[];
  readonly continuePoints: Point[];

  constructor(
    type: LoopType = 'none',
  ) {
    this.type = type;
    this.breakPoints = [];
    this.continuePoints = [];
  }
}

class Flowchart {
// {{{
  readonly type: 'flowchart';
  readonly shapes: Group;
  readonly config: Config;
  private readonly measureText: MeasureTextFunc;
  loopInfo: LoopStackInfo;
  LAlloc: RangeAllocator;
  RAlloc: RangeAllocator;
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
    loopInfo,
    LAlloc,
    RAlloc,
    x,
    y,
  }:
  {
    config: Config;
    measureText: MeasureTextFunc;
    loopInfo: LoopStackInfo;
    LAlloc: RangeAllocator;
    RAlloc: RangeAllocator;
    shapes: Group;
    x: number;
    y: number;
  }) {
    this.shapes = shapes;
    this.measureText = measureText;
    this.config = config;
    this.loopInfo = loopInfo;
    this.LAlloc = LAlloc;
    this.RAlloc = RAlloc;

    this.alive = true;
    this.dy = config.flowchart.stepY;
    this.dx = config.flowchart.stepX;
    this.x = x;
    this.y = y;
  }

  shiftX = (x: number): void => {
    const {shapes, loopInfo} = this;
    shapes.trans(x, 0);
    this.x += x;

    const {breakPoints, continuePoints} = loopInfo;
    breakPoints.forEach(point => point.trans(x, 0));
    continuePoints.forEach(point => point.trans( x, 0));
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
      cls: Rect,
      text, x, y, w, h,
      tw, th,
    });
  }

  private diamond = ({x, y, text}: {x: number, y: number, text: string}): Shape => {
    const {w: tw, h: th} = this.measureText(text, this.config.text.attrs);
    const ratio = this.config.diamond.aspectRatio;
    const w = tw + th / ratio;
    const h = th + tw * ratio;

    return this.wrapText({
      cls: Diamond,
      text, x, y, w, h,
      tw, th,
    });
  }

  private wrapText = (
    {cls, text, x, y, w, h, tw, th}: 
    {cls: any, text: string, x: number, y: number, w: number, h: number, tw: number, th: number}
  ): Group => {
    const textShape = this.text({
      text, x: - tw / 2, y: h / 2 - th / 2, isLabel: false,
    });

    const wrapShape = new cls({
      x: - w / 2, w, h,
    });
    return new Group({x, y, children: [textShape, wrapShape]});
  }

  private text = ({x, y, text, isLabel}: {x: number, y: number, text: string, isLabel: boolean}): Text => {
    return Text.createByMeasure({x, y, text, attrs: this.config.text.attrs, measureText: this.measureText, isLabel});
  }

  stepAndText = (content: string): void => {
    const {dy} = this;
    const rect = this.rect({x: 0, y: 0, text: content});

    // find the space to put vline and recangle.
    const pos = this.RAlloc.findAllocatablePosition(
      this.y,
      rect.h + dy,
    );

    // keep allocated y-coordinate range.
    this.LAlloc.merge(pos, rect.h + dy);

    this.stepAbs(pos + dy);
    rect.trans(0, this.y);
    this.shapes.add(rect);
    this.move(rect.h);
  }

  stepAndDiamond = (
    {
      content,
      yesDir,
      noDir,
      jumpLeft = false,
      jumpRight = false,
    }
    :
    {
      content: string,
      yesDir: Direction,
      noDir: Direction,
      jumpLeft?: boolean,
      jumpRight?: boolean,
    }
  ): CondPosition => {
    const {
      LAlloc,
      RAlloc,
      shapes,
      diamond,
      stepAbs,
      move,
      dy,
      text,
    } = this;
    const {yesText, noText} = this.config.label;
    const {labelMarginX, labelMarginY} = this.config.diamond;

    const cond = diamond({x: 0, y: 0, text: content});
    // find the space to put vline and diamond.
    let pos: number;
    if (jumpLeft) {
      // find the space to draw left direction hline.
      // TODO: the space to put diamond is too large. for left direction, space for hline is enough.
      pos = LAlloc.allocate(
        this.y,
        cond.h + dy,
      );
      RAlloc.merge(pos, cond.h + dy);

    } else {
      // find the space to put vline and diamond
      pos = RAlloc.findAllocatablePosition(
        this.y,
        cond.h + dy,
      );
      LAlloc.merge(pos, cond.h + dy);
    }

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
      text: yesText,
      isLabel: true,
    }));

    shapes.add(text({
      x: condPos[noDir].x + labelMarginX,
      y: condPos[noDir].y + labelMarginY,
      text: noText,
      isLabel: true,
    }));

    return condPos;
  }

  branch = (): Flowchart => {
    return new Flowchart(
    {
      shapes: new Group({x: this.x, y: this.y, children: []}),
      measureText: this.measureText,
      config: this.config,
      loopInfo: new LoopStackInfo(this.loopInfo.type),
      LAlloc: this.LAlloc.clone(),
      RAlloc: this.RAlloc.clone(),
      x: this.x,
      y: this.y,
    });
  }

  merge = (flowchart: Flowchart): void => {
    flowchart.shapes.children.forEach(child => {
      child.trans(flowchart.shapes.x, 0);
      this.shapes.add(child);
    });

    this.loopInfo.breakPoints.push(...flowchart.loopInfo.breakPoints);
    this.loopInfo.continuePoints.push(...flowchart.loopInfo.continuePoints);

    if (flowchart.y > this.y) {
      this.moveAbs(flowchart.y);
    }
  }

  withLoopType = (type: LoopType, func: () => void) => {
    const {loopInfo, LAlloc, RAlloc} = this;
    this.loopInfo = new LoopStackInfo(type);

    const newLAlloc = new RangeAllocator(createRangeList()); 
    const newRAlloc = new RangeAllocator(createRangeList());
    const leftYAHead = newLAlloc.clone();
    const rightYAHead = newRAlloc.clone();

    this.LAlloc = newLAlloc;
    this.RAlloc = newRAlloc;

    func();
    const newloopInfo = this.loopInfo;

    this.loopInfo = loopInfo;
    this.LAlloc = LAlloc;
    this.RAlloc = RAlloc;

    this.LAlloc.mergeAllocator(leftYAHead);
    this.RAlloc.mergeAllocator(rightYAHead);

    return newloopInfo;
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
    loopInfo: new LoopStackInfo(),
    LAlloc: new RangeAllocator(createRangeList()),
    RAlloc: new RangeAllocator(createRangeList()),
    x: 0, y: config.flowchart.marginY,
  });
  createFlowchartSub(node, flowchart);
  flowchart.shiftX(-flowchart.shapes.minX + config.flowchart.marginX);
  return flowchart;
// }}}
}

const createFlowchartSub = (node: ASTNode, flowchart: Flowchart, shouldStep: boolean = true): void => {
// {{{
  const {
    step,
    stepAbs,
    dy,
    stepAndText,
    loopInfo,
    LAlloc,
    RAlloc,
  } = flowchart;
  const {
    children,
  } = node;
  const childNum = children.length;
  let childIdx = 0;
  while (childIdx < childNum && flowchart.alive) {
    let child = children[childIdx];
    switch (child.type) {
      case 'text': {
        stepAndText(child.content);
        break;
      }
      case 'pass': {
        step();
        break;
      }
      case 'if': {
        const nodes: ASTNode[] = [];
        while (
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
        while (
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
        let doNode = child;
        let whileNode = children[childIdx + 1];
        createDoWhileFlowchart(doNode, whileNode, flowchart);
        childIdx += 2;
        continue;
      }
      case 'break':
      case 'continue': {
        const direction = jumpDirectionTable[loopInfo.type][child.type];
        if (shouldStep) {
          if (direction === 'E') {
            const pos = RAlloc.allocate(
              flowchart.y,
              dy,
            );

            LAlloc.merge(pos, dy);
            step(pos + dy - flowchart.y);
          } else {
            const pos = RAlloc.findAllocatablePosition(
              flowchart.y + dy,
              dy,
            );

            LAlloc.merge(pos, dy);
            RAlloc.merge(pos, dy);

            stepAbs(pos);
          }
        } else {
          if (direction === 'E') {
            RAlloc.merge(flowchart.y - dy, dy);
          } else {
            LAlloc.merge(flowchart.y - dy, dy);
          }
        }

        const {breakPoints, continuePoints} = loopInfo;
        (child.type === 'break' ?  breakPoints : continuePoints).push(new Point({x: 0, y: flowchart.y}));
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

const createIfFlowchart = (nodes: ASTNode[], flowchart: Flowchart, shouldStep: boolean = true): void => {
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
    createFlowchartSub(nodes[0], flowchart, shouldStep);
    return;
  }

  const ifFlowchart = flowchart.branch();
  const elseFlowchart = flowchart.branch();

  const ifNode = nodes[0];
  let yesInfo: CondInfo = {
    direction: 'S',
    isJump: false,
    shouldStep: true,
  };
  let noInfo: CondInfo = {
    direction: 'E',
    isJump: false,
    shouldStep: true,
  };

  // calculate yesInfo
  if (ifNode.children.length > 0) {
    const ifBlock = ifNode.children[0];
    if (ifBlock.type === 'break' || ifBlock.type === 'continue') {
      const loopOuter = flowchart.loopInfo.type;
      yesInfo = {
        direction: jumpDirectionTable[loopOuter][ifBlock.type],
        isJump: true,
        shouldStep: false,
      };
      // if "yes" direction is not bottom, default "no" direction is bottom.
      noInfo = {
        direction: 'S',
        isJump: false,
        shouldStep: true,
      };
    }
  }

  // if "elif" or "else" exists, calculate noInfo
  if (
    nodes.length > 1
    && nodes[1].type === 'else'
    && nodes[1].children.length > 0
  ) {
    const elseBlock = nodes[1].children[0];
    if (elseBlock.type === 'break' || elseBlock.type === 'continue') {
      const loopOuter = flowchart.loopInfo.type;
      const direction = jumpDirectionTable[loopOuter][elseBlock.type];
      if (direction !== yesInfo.direction) {
        noInfo = {
          direction,
          isJump: true,
          shouldStep: false,
        };
      }
    }
  }

  const condPosition = flowchart.stepAndDiamond({
    content: ifNode.content,
    yesDir: yesInfo.direction,
    noDir: noInfo.direction,
    jumpLeft: (
      (yesInfo.direction === 'W' && yesInfo.isJump)
      ||(noInfo.direction === 'W' && noInfo.isJump)
    ),
    jumpRight: (
      (yesInfo.direction === 'E' && yesInfo.isJump)
      ||(noInfo.direction === 'E' && noInfo.isJump)
    ),
  });

  ifFlowchart.moveAbs(condPosition[yesInfo.direction].y);
  createFlowchartSub(ifNode, ifFlowchart, yesInfo.shouldStep);
  ifFlowchart.shiftX(condPosition[yesInfo.direction].x);

  // create else part flowchart
  elseFlowchart.moveAbs(condPosition[noInfo.direction].y);
  createIfFlowchart(nodes.slice(1), elseFlowchart, noInfo.shouldStep);
  if (noInfo.isJump) {
      elseFlowchart.shiftX(condPosition[noInfo.direction].x);
  } else {
    if (yesInfo.direction === 'S') {
      const elseFlowchartX = Math.max(condPosition.E.x, ifFlowchart.shapes.maxX) + flowchart.dx - elseFlowchart.shapes.minX;
      elseFlowchart.shiftX(elseFlowchartX);

      ifFlowchart.shapes.add(Path.hline({
        x: condPosition.E.x,
        y: condPosition.E.y,
        step: elseFlowchart.shapes.x - condPosition.E.x,
      }));

      const mergeY = Math.max(
        ifFlowchart.y,
        elseFlowchart.y,
      ) + flowchart.dy;

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
      elseFlowchart.shiftX(condPosition[noInfo.direction].x);
    }
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

  const {
    move,
    step,
    dx,
    withLoopType,
    shapes,
    stepAndDiamond,
  } = flowchart;
  step();
  const loopBackMergeY = flowchart.y;
  const condPos = stepAndDiamond({
    content: node.content,
    yesDir: 'S',
    noDir: 'E',
  });

  const {breakPoints, continuePoints} = 
    withLoopType('while', () => {
      createFlowchartSub(node, flowchart);
    });

  const loopBackPoints: Point[] = [...continuePoints];
  const exitPoints: Point[] = [...breakPoints];
  if (flowchart.alive) {
    step();
    loopBackPoints.push(new Point({x: 0, y: flowchart.y}));
  }
  exitPoints.push(new Point({...condPos.E}));

  const loopBackPathX = Math.min(condPos.W.x, shapes.minX) - dx;
  const exitPathX = Math.max(condPos.E.x, shapes.maxX) + dx;

  // loop back path
  loopBackPoints
    .sort((p1, p2) => p1.y > p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        shapes.add(new Path({
          x: p.x, y: p.y,
          cmds: [
            ['h', loopBackPathX - p.x],
            ['v', loopBackMergeY - p.y],
            ['h', -loopBackPathX],
          ],
          isArrow: true,
        }));
      } else {
        shapes.add(Path.hline({
          x: p.x,
          y: p.y,
          step: loopBackPathX - p.x,
          isArrow: true,
        }));
      }
    });

  move();

  // loop exit path
  exitPoints
    .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        shapes.add(new Path({
          x: p.x, y: p.y,
          cmds: [
            ['h', exitPathX - condPos.E.x],
            ['v', flowchart.y - p.y],
            ['h', -exitPathX],
          ],
        }));
      } else {
        shapes.add(Path.hline({
          x: p.x,
          y: p.y,
          step: exitPathX - p.x,
          isArrow: true,
        }));
      }
  });
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

  const {
    move,
    step,
    dx,
    withLoopType,
    shapes,
    stepAndDiamond,
  } = flowchart;

  step();
  const loopBackMergeY = flowchart.y;

  const {breakPoints, continuePoints} = 
    withLoopType('doWhile', () => {
      createFlowchartSub(doNode, flowchart);
    });

  const exitPoints: Point[] = [...breakPoints];

  let loopBackPathX: number;
  let exitPathX: number;
  let skipPathX = 0;

  if (flowchart.alive || continuePoints.length > 0) {
    if (continuePoints.length > 0) {
      if (flowchart.alive) {
        step();
      } else {
        move();
      }
      skipPathX = shapes.maxX + dx;

      continuePoints
        .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
        .forEach((p, idx) => {
          if (idx === 0) {
            shapes.add(new Path({
              x: p.x, y: p.y,
              cmds: [
                ['h', skipPathX - p.x],
                ['v', flowchart.y - p.y],
                ['h', -skipPathX],
              ],
              isArrow: true,
            }));
          } else {
            shapes.add(Path.hline({
              x: p.x,
              y: p.y,
              step: skipPathX - p.x,
              isArrow: true,
            }));
          }
        });
    }

    // flowchart.step();
    const condPos = stepAndDiamond({
      content: whileNode.content,
      yesDir: 'S',
      noDir: 'E',
    });

    step();
    loopBackPathX = Math.min(condPos.W.x, shapes.minX) - dx;

    // loop back path
    shapes.add(new Path({
      x: 0, y: flowchart.y,
      cmds: [
        ['h', loopBackPathX],
        ['v', loopBackMergeY - flowchart.y],
        ['h', -loopBackPathX],
      ],
      isArrow: true,
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
      if (idx === 0) {
        shapes.add(new Path({
          x: p.x, y: p.y,
          cmds: [
            ['h', exitPathX - p.x],
            ['v', flowchart.y - p.y],
            ['h', -exitPathX],
          ],
        }));
      } else {
        shapes.add(Path.hline({
          x: p.x,
          y: p.y,
          step: exitPathX - p.x,
          isArrow: true,
        }));
      }
    });
  // }}}
}

export {
  createFlowchart,
  Flowchart,
}
