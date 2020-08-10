import {ASTNode} from './parser'
import {
  Factory,
  MeasureTextFunc,
  Shape,
  Group,
  Point,
} from './shape'
import {Config} from './config'


interface Flowchart {
  type: 'flowchart';
  shapeGroup: Group;
  endPoint?: Point;
  breakPoints: Point[];
  continuePoints: Point[];
}

interface Context {
  factory: Factory;
  config: Config;
}


const transFlowchart = (flowchart: Flowchart, ctx: Context, x: number, y: number): Flowchart => {
  const {shapeGroup, endPoint, breakPoints, continuePoints} = flowchart;
  ctx.factory.trans(shapeGroup, x, y);
  if (endPoint) ctx.factory.trans(endPoint, x, y);
  if (breakPoints) {
    breakPoints.forEach(point => ctx.factory.trans(point, x, y));
  }
  if (continuePoints) {
    continuePoints.forEach(point => ctx.factory.trans(point, x, y));
  }
  return flowchart;
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
  const shapeFactory = new Factory(config, measureText);
  const flowchart = createFlowchartSub(node, {config: config, factory: shapeFactory});
  const { shapeGroup } = flowchart;
  shapeFactory.trans(
    shapeGroup,
    - shapeGroup.minX + config.flowchart.marginX,
    - shapeGroup.minY + config.flowchart.marginY
  );
  return flowchart;
}

const createFlowchartSub = (node: ASTNode, ctx: Context): Flowchart => {
  const shapes: Shape[] = [];
  const breakPoints: Point[] = [];
  const continuePoints: Point[] = [];
  let endPoint: Point | undefined = ctx.factory.point({x: 0, y: 0});

  let childIdx = 0;
  while (childIdx < node.children.length && endPoint) {
    let child = node.children[childIdx];
    switch (child.type) {
      case 'text': {
        const vline = ctx.factory.vline(
          {x: 0, y: endPoint.y, step: ctx.config.flowchart.stepY}
        );
        shapes.push(vline);
        ctx.factory.trans(endPoint, 0, ctx.config.flowchart.stepY);

        const rect = ctx.factory.rect({text: child.content});
        ctx.factory.trans(rect, 0, endPoint.y);
        shapes.push(rect);

        ctx.factory.trans(endPoint, 0, rect.height);
        break;
      }
      case 'if': {
        const nodes: ASTNode[] = [];
        while (
          childIdx < node.children.length &&
          ['if', 'elif', 'else'].includes(node.children[childIdx].type)
        ) {
          nodes.push(node.children[childIdx]);
          childIdx++;
        }

        const ifFlowchart = createIfFlowchart(nodes, ctx);
        transFlowchart(ifFlowchart, ctx, 0, endPoint.y);

        shapes.push(ifFlowchart.shapeGroup);
        breakPoints.push(...ifFlowchart.breakPoints);
        continuePoints.push(...ifFlowchart.continuePoints);
        if (ifFlowchart.endPoint) {
          ctx.factory.trans(endPoint, 0, ifFlowchart.shapeGroup.height);
        } else {
          endPoint = null;
        }
        continue;
      }
      case 'while': {
        const whileFlowchart = createWhileFlowchart(child, ctx);
        transFlowchart(whileFlowchart, ctx, 0, endPoint.y);
        shapes.push(whileFlowchart.shapeGroup);
        breakPoints.push(...whileFlowchart.breakPoints);
        continuePoints.push(...whileFlowchart.continuePoints);
        endPoint = whileFlowchart.endPoint;
        if (whileFlowchart.endPoint) {
          ctx.factory.trans(endPoint, 0, whileFlowchart.shapeGroup.height);
        } else {
          endPoint = null;
        }
        break;
      }
      case 'do': {
        let doNode = child;
        let whileNode = node.children[childIdx + 1];
        const doWhileFlowchart = createDoWhileFlowchart(doNode, whileNode, ctx);

        transFlowchart(doWhileFlowchart, ctx, 0, endPoint.y);
        shapes.push(doWhileFlowchart.shapeGroup);
        breakPoints.push(...doWhileFlowchart.breakPoints);
        continuePoints.push(...doWhileFlowchart.continuePoints);
        endPoint = doWhileFlowchart.endPoint;

        if (doWhileFlowchart.endPoint) {
          ctx.factory.trans(endPoint, 0, doWhileFlowchart.shapeGroup.height);
        } else {
          endPoint = null;
        }
        childIdx += 2;
        continue;
      }
      case 'break': {
        const vline = ctx.factory.vline(
          {x: 0, y: endPoint.y, step: ctx.config.flowchart.stepY}
        );
        shapes.push(vline);
        ctx.factory.trans(endPoint, 0, ctx.config.flowchart.stepY);

        breakPoints.push(ctx.factory.point({x: 0, y: endPoint.y}));
        endPoint = null;
        break;
      }
      case 'continue': {
        const vline = ctx.factory.vline(
          {x: 0, y: endPoint.y, step: ctx.config.flowchart.stepY}
        );
        shapes.push(vline);
        ctx.factory.trans(endPoint, 0, ctx.config.flowchart.stepY);

        continuePoints.push(ctx.factory.point({x: 0, y: endPoint.y}));
        endPoint = null;
        break;
      }
    }
    childIdx++;
  }
  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
    endPoint,
    breakPoints,
    continuePoints,
  };
};

const createIfFlowchart = (nodes: ASTNode[], ctx: Context): Flowchart => {
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
  if (nodes.length === 0) {
    return {
      type: 'flowchart',
      shapeGroup: ctx.factory.group({x: 0, y: 0, children: []}),
      endPoint: ctx.factory.point({x:0, y:0}),
      breakPoints: [],
      continuePoints: [],
    };
  } else if (nodes[0].type === 'else') {
    return createFlowchartSub(nodes[0], ctx);
  }
  console.assert(['if', 'elif'].includes(nodes[0].type));
  const shapes: Shape[] = [];

  const vline = ctx.factory.vline(
    {x: 0, y: 0, step: ctx.config.flowchart.stepY}
  );
  shapes.push(vline);
  const y = ctx.config.flowchart.stepY;

  const ifNode = nodes[0];
  const cond = ctx.factory.diamond({text: ifNode.content});
  ctx.factory.trans(cond, 0, y);
  shapes.push(cond);

  shapes.push(
    ctx.factory.trans(
      ctx.factory.label({
        text: ctx.config.label.yesText,
      }),
      ctx.config.diamond.labelMarginX,
      cond.height + ctx.config.diamond.labelMarginY,
    )
  );
  shapes.push(
    ctx.factory.trans(
      ctx.factory.label({
        text: ctx.config.label.noText,
      }),
      cond.width / 2 + ctx.config.diamond.labelMarginX,
      cond.height / 2 + ctx.config.diamond.labelMarginY,
    )
  );

  const ifFlowchart = createFlowchartSub(ifNode, ctx);
  transFlowchart(ifFlowchart, ctx, 0, cond.y + cond.maxY);
  shapes.push(ifFlowchart.shapeGroup);

  // create else part flowchart
  const elseFlowchart = createIfFlowchart(nodes.slice(1), ctx);
  transFlowchart(
    elseFlowchart,
    ctx,
    Math.max(cond.width / 2, ifFlowchart.shapeGroup.maxX) + ctx.config.flowchart.stepX - elseFlowchart.shapeGroup.minX,
    y + cond.height / 2,
  );
  shapes.push(elseFlowchart.shapeGroup);

  const branchHline = ctx.factory.hline({
    x: cond.width / 2,
    y: y + cond.height / 2,
    step: elseFlowchart.shapeGroup.x - cond.width / 2,
  });
  shapes.push(branchHline);

  const mergeY = Math.max(
    ifFlowchart.shapeGroup.y + ifFlowchart.shapeGroup.maxY,
    elseFlowchart.shapeGroup.y + elseFlowchart.shapeGroup.maxY,
  ) + ctx.config.flowchart.stepY;

  [ifFlowchart, elseFlowchart].forEach(flowchart => {
    if (flowchart.endPoint) {
      const sg = flowchart.shapeGroup;
      const vline = ctx.factory.vline({
        x: sg.x,
        y: sg.y + sg.maxY,
        step: mergeY - sg.maxY - sg.y,
      });
      shapes.push(vline);
    }
  });

  if (elseFlowchart.endPoint) {
    const mergeHline = ctx.factory.hline({
      x: elseFlowchart.shapeGroup.x,
      y: mergeY,
      step: - elseFlowchart.shapeGroup.x + cond.x,
      // isArrow: true,
    });
    shapes.push(mergeHline);
  }

  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
    endPoint: (ifFlowchart.endPoint || elseFlowchart.endPoint) ?
              ctx.factory.point({x: 0, y}) : null,
    breakPoints: [...ifFlowchart.breakPoints, ...elseFlowchart.breakPoints],
    continuePoints: [...ifFlowchart.continuePoints, ...elseFlowchart.continuePoints],
  };
}

const createWhileFlowchart = (node: ASTNode, ctx: Context): Flowchart => {
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

  console.assert(node.type === 'while');
  const shapes = [];
  const endPoint: Point = ctx.factory.point({x: 0, y: 0});
  let y = 0;

  shapes.push(ctx.factory.vline(
    {x: 0, y, step: ctx.config.flowchart.stepY}
  ));
  y += ctx.config.flowchart.stepY;

  shapes.push(ctx.factory.vline(
    {x: 0, y, step: ctx.config.flowchart.stepY}
  ));
  y += ctx.config.flowchart.stepY;

  const cond = ctx.factory.diamond({text: node.content});
  shapes.push(cond);
  ctx.factory.trans(cond, 0, y);
  y += cond.height;

  const blockFlowchart = createFlowchartSub(node, ctx);
  transFlowchart(blockFlowchart, ctx, 0, y);
  shapes.push(blockFlowchart.shapeGroup);
  y += blockFlowchart.shapeGroup.height;

  let loopBackPathX: number;
  let exitPathX: number;
  const loopBackPoints: Point[] = [...blockFlowchart.continuePoints];
  const exitPoints: Point[] = [...blockFlowchart.breakPoints];
  if (blockFlowchart.endPoint) {
    shapes.push(ctx.factory.vline(
      {x: 0, y, step: ctx.config.flowchart.stepY}
    ));
    y += ctx.config.flowchart.stepY;
    loopBackPoints.push(ctx.factory.point({x: 0, y}));
  }
  exitPoints.push(ctx.factory.point({x: cond.width / 2, y: cond.y + cond.height / 2}));
  loopBackPathX = -Math.max(cond.width / 2, - blockFlowchart.shapeGroup.minX) - ctx.config.flowchart.stepX;
  exitPathX = Math.max(cond.width / 2, blockFlowchart.shapeGroup.maxX) + ctx.config.flowchart.stepX;

  // loop back path
  loopBackPoints
    .sort((p1, p2) => p1.y > p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        shapes.push(ctx.factory.path({
          x: p.x, y: p.y,
          cmds: [
            ['h', loopBackPathX - p.x],
            ['v', cond.y - ctx.config.flowchart.stepY - p.y],
            ['h', -loopBackPathX],
          ],
          isArrow: true,
        }));
      } else {
        shapes.push(ctx.factory.hline({
          x: p.x,
          y: p.y,
          step: loopBackPathX - p.x,
          isArrow: true,
        }));
      }
    });

  // loop exit path
  exitPoints
    .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        shapes.push(ctx.factory.path({
          x: p.x, y: p.y,
          cmds: [
            ['h', exitPathX - cond.width /2 ],
            ['v', ctx.config.flowchart.stepX + y - cond.y - cond.height / 2],
            ['h', - exitPathX],
          ],
        }));
      } else {
        shapes.push(ctx.factory.hline({
          x: p.x,
          y: p.y,
          step: exitPathX - p.x,
          isArrow: true,
        }));
      }
  });

  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
    endPoint,
    breakPoints: [],
    continuePoints: [],
  };
}

const createDoWhileFlowchart = (doNode: ASTNode, whileNode: ASTNode, ctx: Context): Flowchart => {
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

  console.assert(doNode.type === 'do');
  console.assert(whileNode.type === 'while');
  const shapes = [];
  const endPoint: Point = ctx.factory.point({x: 0, y: 0});
  let y = 0;

  shapes.push(ctx.factory.vline(
    {x: 0, y, step: ctx.config.flowchart.stepY}
  ));
  y += ctx.config.flowchart.stepY;

  const blockFlowchart = createFlowchartSub(doNode, ctx);
  transFlowchart(blockFlowchart, ctx, 0, y);
  shapes.push(blockFlowchart.shapeGroup);
  y += blockFlowchart.shapeGroup.height

  let loopBackPathX: number;
  let exitPathX: number;
  let skipPathX = 0;
  const exitPoints: Point[] = [...blockFlowchart.breakPoints];

  if (blockFlowchart.endPoint || blockFlowchart.continuePoints.length > 0) {
    if (blockFlowchart.continuePoints.length > 0) {
      if (blockFlowchart.endPoint) {
        shapes.push(ctx.factory.vline(
          {x: 0, y, step: ctx.config.flowchart.stepY}
        ));
      }
      y += ctx.config.flowchart.stepY;

      skipPathX = blockFlowchart.shapeGroup.maxX + ctx.config.flowchart.stepX;

      blockFlowchart.continuePoints
        .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
        .forEach((p, idx) => {
          if (idx === 0) {
            shapes.push(ctx.factory.path({
              x: p.x, y: p.y,
              cmds: [
                ['h', skipPathX - p.x],
                ['v', y - p.y],
                ['h', -skipPathX],
              ],
              isArrow: true,
            }));
          } else {
            shapes.push(ctx.factory.hline({
              x: p.x,
              y: p.y,
              step: skipPathX - p.x,
              isArrow: true,
            }));
          }
        });
    }

    shapes.push(ctx.factory.vline(
      {x: 0, y, step: ctx.config.flowchart.stepY}
    ));
    y += ctx.config.flowchart.stepY;

    const cond = ctx.factory.diamond({text: whileNode.content});
    shapes.push(cond);
    ctx.factory.trans(cond, 0, y);
    y += cond.height;
    shapes.push(ctx.factory.vline(
      {x: 0, y, step: ctx.config.flowchart.stepY}
    ));
    y += ctx.config.flowchart.stepY;

    loopBackPathX = Math.min(-cond.width / 2, blockFlowchart.shapeGroup.minX) - ctx.config.flowchart.stepX;

    // loop back path
    shapes.push(ctx.factory.path({
      x: 0, y,
      cmds: [
        ['h', loopBackPathX],
        ['v', blockFlowchart.shapeGroup.y + blockFlowchart.shapeGroup.minY + ctx.config.flowchart.stepY / 2 - y],
        ['h', -loopBackPathX],
      ],
      isArrow: true,
    }));

    exitPathX = Math.max(cond.width / 2, blockFlowchart.shapeGroup.maxX, skipPathX) + ctx.config.flowchart.stepX;
    exitPoints.push(ctx.factory.point({x: cond.width / 2, y: cond.y + cond.height / 2}));
  } else {
    y += ctx.config.flowchart.stepY;
    exitPathX = blockFlowchart.shapeGroup.maxX + ctx.config.flowchart.stepX;
  }

  // loop exit path
  const exitPathY = y + ctx.config.flowchart.stepY;
  exitPoints
    .sort((p1, p2) => p1.y < p2.y ? -1 : 1)
    .forEach((p, idx) => {
      if (idx === 0) {
        shapes.push(ctx.factory.path({
          x: p.x, y: p.y,
          cmds: [
            ['h', exitPathX - p.x],
            ['v', exitPathY - p.y],
            ['h', -exitPathX],
          ],
        }));
      } else {
        shapes.push(ctx.factory.hline({
          x: p.x,
          y: p.y,
          step: exitPathX - p.x,
          isArrow: true,
        }));
      }
    });

  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
    endPoint,
    breakPoints: [],
    continuePoints: [],
  };
}

export {
  createFlowchart,
  Flowchart,
}
