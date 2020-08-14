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
type Direction = 'right' | 'left' | 'bottom' | 'top';

interface CondInfo {
  readonly direction: Direction;
  readonly isJump: boolean;
  readonly shouldStep: boolean;
};

interface CondPosition {
  readonly right: {x: number, y: number},
  readonly left: {x: number, y: number},
  readonly bottom: {x: number, y: number},
};

const jumpDirectionTable = {
// {{{
  'while': {
    'break': 'right',
    'continue': 'left',
  },
  'doWhile': {
    'break': 'right',
    'continue': 'right',
  },
  'for': {
    'break': 'right',
    'continue': 'left',
  },
// }}}
};

const jumpDirection = (
  loopType: LoopType,
  jumpType: 'break' | 'continue',
): 'right' | 'left' => {
  console.assert(loopType !== 'none');
  return jumpDirectionTable[loopType][jumpType] as 'right' | 'left';
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

  clone = (): LoopStackInfo => {
    return new LoopStackInfo(this.type);
  }
}

class Flowchart {
// {{{
  readonly type: 'flowchart';
  readonly shapeGroup: Group;
  private readonly endPoint: Point;
  readonly config: Config;
  private readonly measureText: MeasureTextFunc;
  loopInfo: LoopStackInfo;
  leftYAllocator: RangeAllocator;
  rightYAllocator: RangeAllocator;
  private alive: boolean;

  constructor(
  {
    shapeGroup,
    endPoint,
    measureText,
    config,
    loopInfo,
    leftYAllocator,
    rightYAllocator,
  }:
  {
    config: Config;
    measureText: MeasureTextFunc;
    loopInfo: LoopStackInfo;
    leftYAllocator: RangeAllocator;
    rightYAllocator: RangeAllocator;
    shapeGroup: Group;
    endPoint: Point;
  }) {
    this.shapeGroup = shapeGroup;
    this.endPoint = endPoint;
    this.measureText = measureText;
    this.config = config;
    this.loopInfo = loopInfo;
    this.leftYAllocator = leftYAllocator;
    this.rightYAllocator = rightYAllocator;

    this.alive = true;
  }

  die = (): void => {
    this.alive = false;
  }

  isAlive = (): boolean => {
    return this.alive;
  }

  head = (): number => {
    return this.endPoint.y;
  }

  shiftX = (x: number): Flowchart => {
    const {shapeGroup, endPoint, loopInfo} = this;
    shapeGroup.trans(x, 0);
    endPoint.trans(x, 0);

    const {breakPoints, continuePoints} = loopInfo;
    breakPoints.forEach(point => point.trans(x, 0));
    continuePoints.forEach(point => point.trans( x, 0));
    return this;
  }

  step = (distance: number = this.config.flowchart.stepY): number => {
    this.shapeGroup.add(Path.vline({x: 0, y: this.head(), step: distance}));
    this.move(distance);
    return this.head();
  }

  stepAbs = (y: number): number => {
    this.step(y - this.head());
    return this.head();
  }

  move = (distance: number = this.config.flowchart.stepY): number => {
    // almost same to "step" but do not add vline.
    this.endPoint.trans(0, distance);
    return this.head();
  }

  moveAbs = (y: number): number => {
    this.move(y - this.head());
    return this.head();
  }

  rect = ({x, y, text}: {x: number, y: number, text: string}): Shape => {
    const {width: textWidth, height: textHeight} = this.measureText(text, this.config.text.attrs);
    const width = textWidth + this.config.rect.padX * 2;
    const height = textHeight + this.config.rect.padY * 2;

    return this.wrapText({
      cls: Rect,
      text, x, y, width, height,
      textWidth, textHeight,
    });
  }

  diamond = ({x, y, text}: {x: number, y: number, text: string}): Shape => {
    const {width: textWidth, height: textHeight} = this.measureText(text, this.config.text.attrs);
    const width = textWidth + textHeight / this.config.diamond.aspectRatio;
    const height = textHeight + textWidth * this.config.diamond.aspectRatio;

    return this.wrapText({
      cls: Diamond,
      text, x, y, width, height,
      textWidth, textHeight,
    });
  }

  private wrapText = (
    {cls, text, x, y, width, height, textWidth, textHeight}: 
    {cls: any, text: string, x: number, y: number, width: number, height: number, textWidth: number, textHeight: number}
  ): Group => {
    const textShape = this.text({
      text, x: -textWidth / 2, y: height / 2 - textHeight / 2,
    });

    const wrapShape = new cls({
      x: - width / 2, width, height,
    });
    return new Group({x, y, children: [textShape, wrapShape]});
  }

  text = ({x, y, text}: {x: number, y: number, text: string}): Text => {
    return Text.createByMeasure({x, y, text, attrs: this.config.text.attrs, measureText: this.measureText, isLabel: false});
  }

  label = ({x, y, text}: {x: number, y: number, text: string}): Text => {
    return Text.createByMeasure({x, y, text, attrs: this.config.text.attrs, measureText: this.measureText, isLabel: true});
  }

  stepAndText = (content: string): void => {
    const rect = this.rect({x: 0, y: 0, text: content});

    // find the space to put vline and recangle.
    const pos = this.rightYAllocator.findAllocatablePosition(
      this.head(),
      rect.height + this.config.flowchart.stepY,
    );

    // keep allocated y-coordinate range.
    this.leftYAllocator.merge(pos, rect.height + this.config.flowchart.stepY);

    this.stepAbs(pos + this.config.flowchart.stepY);
    rect.trans(0, this.head());
    this.shapeGroup.add(rect);
    this.move(rect.height);
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
    const cond = this.diamond({x: 0, y: 0, text: content});
    // find the space to put vline and diamond.
    let pos: number;
    if (jumpLeft) {
      // find the space to draw left direction hline.
      // TODO: the space to put diamond is too large. for left direction, space for hline is enough.
      pos = this.leftYAllocator.allocate(
        this.head(),
        cond.height + this.config.flowchart.stepY,
      );
      this.rightYAllocator.merge(pos, cond.height + this.config.flowchart.stepY);

    } else {
      // find the space to put vline and diamond
      pos = this.rightYAllocator.findAllocatablePosition(
        this.head(),
        cond.height + this.config.flowchart.stepY,
      );
      this.leftYAllocator.merge(pos, cond.height + this.config.flowchart.stepY);
    }

    this.stepAbs(pos + this.config.flowchart.stepY);

    cond.trans(0, this.head());
    this.shapeGroup.add(cond);
    this.move(cond.height);

    const condPos: CondPosition = {
      right : {x: cond.width / 2, y: cond.y + cond.height / 2},
      left : {x: -cond.width / 2, y: cond.y + cond.height / 2},
      bottom : {x: 0, y: cond.y + cond.height},
    };

    this.shapeGroup.add(this.label({
      x: condPos[yesDir].x + this.config.diamond.labelMarginX,
      y: condPos[yesDir].y + this.config.diamond.labelMarginY,
      text: this.config.label.yesText,
    }));

    this.shapeGroup.add(this.label({
      x: condPos[noDir].x + this.config.diamond.labelMarginX,
      y: condPos[noDir].y + this.config.diamond.labelMarginY,
      text: this.config.label.noText,
    }));

    return condPos;
  }

  branch = (): Flowchart => {
    return new Flowchart(
    {
      shapeGroup: new Group({x: this.endPoint.x, y: this.endPoint.y, children: []}),
      endPoint: this.endPoint.clone(),
      measureText: this.measureText,
      config: this.config,
      loopInfo: this.loopInfo.clone(),
      leftYAllocator: this.leftYAllocator.clone(),
      rightYAllocator: this.rightYAllocator.clone(),
    });
  }

  merge = (flowchart: Flowchart): Flowchart => {
    flowchart.shapeGroup.children.forEach(child => {
      child.trans(flowchart.shapeGroup.x, 0);
      this.shapeGroup.add(child);
    });

    this.loopInfo.breakPoints.push(...flowchart.loopInfo.breakPoints);
    this.loopInfo.continuePoints.push(...flowchart.loopInfo.continuePoints);

    if (flowchart.endPoint.y > this.endPoint.y) {
      this.moveAbs(flowchart.endPoint.y);
    }
    return this;
  }

  withLoopType = (type: LoopType, func: () => void) => {
    const {loopInfo, leftYAllocator, rightYAllocator} = this;
    this.loopInfo = new LoopStackInfo(type);

    const leftYA = new RangeAllocator(createRangeList()); 
    const rightYA = new RangeAllocator(createRangeList());
    const leftYAHead = leftYA.clone();
    const rightYAHead = rightYA.clone();

    this.leftYAllocator = leftYA;
    this.rightYAllocator = rightYA;

    func();
    const newloopInfo = this.loopInfo;

    this.loopInfo = loopInfo;
    this.leftYAllocator = leftYAllocator;
    this.rightYAllocator = rightYAllocator;

    this.leftYAllocator.mergeAllocator(leftYAHead);
    this.rightYAllocator.mergeAllocator(rightYAHead);

    return newloopInfo;
  }

  // to debug
  v = (x: number) => {
    this.shapeGroup.add(Path.vline({x, y: 0, step: 100}));
  }

  // to debug
  h = (y: number) => {
    this.shapeGroup.add(Path.hline({x: 0, y, step: 100}));
  }
  // }}}
}

let IS_DEBUG = false
const assert = (tgt: any): void => IS_DEBUG && console.assert(tgt);

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
    shapeGroup: new Group({x: 0, y: 0, children: []}),
    endPoint: new Point({x: 0, y: config.flowchart.marginY}),
    measureText,
    config,
    loopInfo: new LoopStackInfo(),
    leftYAllocator: new RangeAllocator(createRangeList()),
    rightYAllocator: new RangeAllocator(createRangeList()),
  });
  createFlowchartSub(node, flowchart);
  flowchart.shiftX(-flowchart.shapeGroup.minX + config.flowchart.marginX);
  return flowchart;
// }}}
}

const createFlowchartSub = (node: ASTNode, flowchart: Flowchart, shouldStep: boolean = true): void => {
// {{{
  let childIdx = 0;
  while (childIdx < node.children.length && flowchart.isAlive()) {
    let child = node.children[childIdx];
    switch (child.type) {
      case 'text': {
        flowchart.stepAndText(child.content);
        break;
      }
      case 'pass': {
        flowchart.step();
        break;
      }
      case 'if': {
        const nodes: ASTNode[] = [];
        while (
          childIdx < node.children.length &&
          node.children[childIdx].type === 'if'
        ) {
          nodes.push(node.children[childIdx]);
          childIdx++;
        }
        while (
          childIdx < node.children.length &&
          node.children[childIdx].type === 'elif'
        ) {
          nodes.push(node.children[childIdx]);
          childIdx++;
        }
        while (
          childIdx < node.children.length &&
          node.children[childIdx].type === 'else'
        ) {
          nodes.push(node.children[childIdx]);
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
        let whileNode = node.children[childIdx + 1];
        createDoWhileFlowchart(doNode, whileNode, flowchart);
        childIdx += 2;
        continue;
      }
      case 'break':
      case 'continue': {
        const direction = jumpDirection(flowchart.loopInfo.type, child.type);
        if (shouldStep) {
          if (direction === 'right') {
            const pos = flowchart.rightYAllocator.allocate(
              flowchart.head(),
              flowchart.config.flowchart.stepY,
            );

            flowchart.leftYAllocator.merge(pos, flowchart.config.flowchart.stepY);
            flowchart.step(pos + flowchart.config.flowchart.stepY - flowchart.head());
          } else {
            const pos = flowchart.rightYAllocator.findAllocatablePosition(
              flowchart.head() + flowchart.config.flowchart.stepY,
              flowchart.config.flowchart.stepY,
            );

            flowchart.leftYAllocator.merge(pos, flowchart.config.flowchart.stepY);
            flowchart.rightYAllocator.merge(pos, flowchart.config.flowchart.stepY);

            flowchart.stepAbs(pos);
          }
        } else {
          if (direction === 'right') {
            flowchart.rightYAllocator.merge(flowchart.head() - flowchart.config.flowchart.stepY, flowchart.config.flowchart.stepY);
          } else {
            flowchart.leftYAllocator.merge(flowchart.head() - flowchart.config.flowchart.stepY, flowchart.config.flowchart.stepY);
          }
        }

        const {breakPoints, continuePoints} = flowchart.loopInfo;
        if (child.type === 'break') {
          breakPoints.push(new Point({x: 0, y: flowchart.head()}));
        } else {
          continuePoints.push(new Point({x: 0, y: flowchart.head()}));
        }
        flowchart.die();
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
  assert(['if', 'elif'].includes(nodes[0].type));

  const ifFlowchart = flowchart.branch();
  const elseFlowchart = flowchart.branch();

  const ifNode = nodes[0];
  let yesInfo: CondInfo = {
    direction: 'bottom',
    isJump: false,
    shouldStep: true,
  };
  let noInfo: CondInfo = {
    direction: 'right',
    isJump: false,
    shouldStep: true,
  };

  // calculate yesInfo
  if (ifNode.children.length > 0) {
    const ifBlock = ifNode.children[0];
    if (ifBlock.type === 'break' || ifBlock.type === 'continue') {
      const loopOuter = flowchart.loopInfo.type;
      yesInfo = {
        direction: jumpDirection(loopOuter, ifBlock.type),
        isJump: true,
        shouldStep: false,
      };
      // if "yes" direction is not bottom, default "no" direction is bottom.
      noInfo = {
        direction: 'bottom',
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
      const direction = jumpDirection(loopOuter, elseBlock.type);
      if (direction !== yesInfo.direction) {
        noInfo = {
          direction,
          isJump: true,
          shouldStep: false,
        };
      }
    }
  }
  console.assert(yesInfo.direction !== noInfo.direction);

  const condPosition = flowchart.stepAndDiamond({
    content: ifNode.content,
    yesDir: yesInfo.direction,
    noDir: noInfo.direction,
    jumpLeft: (
      (yesInfo.direction === 'left' && yesInfo.isJump)
      ||(noInfo.direction === 'left' && noInfo.isJump)
    ),
    jumpRight: (
      (yesInfo.direction === 'right' && yesInfo.isJump)
      ||(noInfo.direction === 'right' && noInfo.isJump)
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
    if (yesInfo.direction === 'bottom') {
      const elseFlowchartX = Math.max(condPosition.right.x, ifFlowchart.shapeGroup.maxX) + flowchart.config.flowchart.stepX - elseFlowchart.shapeGroup.minX;
      elseFlowchart.shiftX(elseFlowchartX);

      ifFlowchart.shapeGroup.add(Path.hline({
        x: condPosition.right.x,
        y: condPosition.right.y,
        step: elseFlowchart.shapeGroup.x - condPosition.right.x,
      }));

      const mergeY = Math.max(
        ifFlowchart.head(),
        elseFlowchart.head(),
      ) + flowchart.config.flowchart.stepY;

      if (ifFlowchart.isAlive()) ifFlowchart.stepAbs(mergeY);
      if (elseFlowchart.isAlive()) elseFlowchart.stepAbs(mergeY);

      if (elseFlowchart.isAlive()) {
        ifFlowchart.shapeGroup.add(Path.hline({
          x: elseFlowchart.shapeGroup.x,
          y: mergeY,
          step: - elseFlowchart.shapeGroup.x + ifFlowchart.shapeGroup.x,
          isArrow: ifFlowchart.isAlive(),
        }));
      }
    } else {
      elseFlowchart.shiftX(condPosition[noInfo.direction].x);
    }
  }

  flowchart.merge(ifFlowchart);
  flowchart.merge(elseFlowchart);
  if (!ifFlowchart.isAlive() && !elseFlowchart.isAlive()) flowchart.die();
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

  assert(node.type === 'while');
  const loopBackMergeY = flowchart.step();
  const condPos = flowchart.stepAndDiamond({
    content: node.content,
    yesDir: 'bottom',
    noDir: 'right',
  });

  const {breakPoints, continuePoints} = 
    flowchart.withLoopType('while', () => {
      createFlowchartSub(node, flowchart);
    });

  const loopBackPoints: Point[] = [...continuePoints];
  const exitPoints: Point[] = [...breakPoints];
  if (flowchart.isAlive()) {
    flowchart.step();
    loopBackPoints.push(new Point({x: 0, y: flowchart.head()}));
  }
  exitPoints.push(new Point({...condPos.right}));

  const loopBackPathX = Math.min(condPos.left.x, flowchart.shapeGroup.minX) - flowchart.config.flowchart.stepX;
  const exitPathX = Math.max(condPos.right.x, flowchart.shapeGroup.maxX) + flowchart.config.flowchart.stepX;

  // loop back path
  loopBackPoints
    .sort((p1, p2) => p1.y > p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        flowchart.shapeGroup.add(new Path({
          x: p.x, y: p.y,
          cmds: [
            ['h', loopBackPathX - p.x],
            ['v', loopBackMergeY - p.y],
            ['h', -loopBackPathX],
          ],
          isArrow: true,
        }));
      } else {
        flowchart.shapeGroup.add(Path.hline({
          x: p.x,
          y: p.y,
          step: loopBackPathX - p.x,
          isArrow: true,
        }));
      }
    });

  flowchart.move();

  // loop exit path
  exitPoints
    .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        flowchart.shapeGroup.add(new Path({
          x: p.x, y: p.y,
          cmds: [
            ['h', exitPathX - condPos.right.x],
            ['v', flowchart.head() - p.y],
            ['h', -exitPathX],
          ],
        }));
      } else {
        flowchart.shapeGroup.add(Path.hline({
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

  assert(doNode.type === 'do');
  assert(whileNode.type === 'while');

  const loopBackMergeY = flowchart.step();

  const {breakPoints, continuePoints} = 
    flowchart.withLoopType('doWhile', () => {
      createFlowchartSub(doNode, flowchart);
    });

  const exitPoints: Point[] = [...breakPoints];

  let loopBackPathX: number;
  let exitPathX: number;
  let skipPathX = 0;

  if (flowchart.isAlive() || continuePoints.length > 0) {
    if (continuePoints.length > 0) {
      if (flowchart.isAlive()) {
        flowchart.step();
      } else {
        flowchart.move();
      }
      skipPathX = flowchart.shapeGroup.maxX + flowchart.config.flowchart.stepX;

      continuePoints
        .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
        .forEach((p, idx) => {
          if (idx === 0) {
            flowchart.shapeGroup.add(new Path({
              x: p.x, y: p.y,
              cmds: [
                ['h', skipPathX - p.x],
                ['v', flowchart.head() - p.y],
                ['h', -skipPathX],
              ],
              isArrow: true,
            }));
          } else {
            flowchart.shapeGroup.add(Path.hline({
              x: p.x,
              y: p.y,
              step: skipPathX - p.x,
              isArrow: true,
            }));
          }
        });
    }

    // flowchart.step();
    const condPos = flowchart.stepAndDiamond({
      content: whileNode.content,
      yesDir: 'bottom',
      noDir: 'right',
    });

    flowchart.step();
    loopBackPathX = Math.min(condPos.left.x, flowchart.shapeGroup.minX) - flowchart.config.flowchart.stepX;

    // loop back path
    flowchart.shapeGroup.add(new Path({
      x: 0, y: flowchart.head(),
      cmds: [
        ['h', loopBackPathX],
        ['v', loopBackMergeY - flowchart.head()],
        ['h', -loopBackPathX],
      ],
      isArrow: true,
    }));

    exitPathX = Math.max(condPos.right.x, flowchart.shapeGroup.maxX, skipPathX) + flowchart.config.flowchart.stepX;
    exitPoints.push(new Point({...condPos.right}));
  } else {
    flowchart.move();
    exitPathX = flowchart.shapeGroup.maxX + flowchart.config.flowchart.stepX;
  }

  // loop exit path
  flowchart.move();

  exitPoints
    .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        flowchart.shapeGroup.add(new Path({
          x: p.x, y: p.y,
          cmds: [
            ['h', exitPathX - p.x],
            ['v', flowchart.head() - p.y],
            ['h', -exitPathX],
          ],
        }));
      } else {
        flowchart.shapeGroup.add(Path.hline({
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
