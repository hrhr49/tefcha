import {ASTNode} from './parser'
import {
  Factory,
  MeasureTextFunc,
  Shape,
  Group,
} from './shape'
import {Config} from './config'

interface Flowchart {
  type: 'flowchart';
  shapeGroup: Group;
}

interface Context {
  factory: Factory;
  config: Config;
}

interface FlowChartParams {
  node: ASTNode;
  config: Config;
  measureText: MeasureTextFunc;
}

const createFlowchart = ({
  node,
  config,
  measureText,
}: FlowChartParams): Flowchart => {
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
  let y = 0;
  const shapes: Shape[] = [];

  let childIdx = 0;
  while (childIdx < node.children.length) {
    let child = node.children[childIdx];
    switch (child.type) {
      case 'text': {
        const vline = ctx.factory.vline(
          {x: 0, y, step: ctx.config.flowchart.stepY}
        );
        shapes.push(vline);
        y += ctx.config.flowchart.stepY;

        const rect = ctx.factory.rect({text: child.content});
        rect.y = y;
        shapes.push(rect);
        y += rect.height;
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
        const {shapeGroup} = createIfFlowchart(nodes, ctx);
        ctx.factory.trans(shapeGroup, 0, y);
        shapes.push(shapeGroup);
        y += shapeGroup.height;
        continue;
      }
      case 'while': {
        const {shapeGroup} = createWhileFlowchart(child, ctx);
        ctx.factory.trans(shapeGroup, 0, y);
        shapes.push(shapeGroup);
        y += shapeGroup.height;
        break;
      }
      case 'do': {
        let doNode = child;
        let whileNode = node.children[childIdx + 1];
        const {shapeGroup} = createDoWhileFlowchart(doNode, whileNode, ctx);
        ctx.factory.trans(shapeGroup, 0, y);
        shapes.push(shapeGroup);
        y += shapeGroup.height;
        childIdx += 2;
        continue;
      }
    }
    childIdx++;
  }
  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
  };
};

const createIfFlowchart = (nodes: ASTNode[], ctx: Context): Flowchart => {
  //                 _
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

  const {shapeGroup: ifShapeGroup} = createFlowchartSub(ifNode, ctx);
  ctx.factory.trans(ifShapeGroup, 0, cond.y + cond.maxY);
  shapes.push(ifShapeGroup);

  // create else part flowchart
  const {shapeGroup: elseShapeGroup} = createIfFlowchart(nodes.slice(1), ctx);
  ctx.factory.trans(
    elseShapeGroup,
    Math.max(cond.width / 2, ifShapeGroup.maxX) + ctx.config.flowchart.stepX - elseShapeGroup.minX,
    y + cond.height / 2,
  );
  shapes.push(elseShapeGroup);

  const branchHline = ctx.factory.hline({
    x: cond.width / 2,
    y: y + cond.height / 2,
    step: elseShapeGroup.x - cond.width / 2,
  });
  shapes.push(branchHline);

  const mergeY = Math.max(
    ifShapeGroup.y + ifShapeGroup.maxY,
    elseShapeGroup.y + elseShapeGroup.maxY,
  ) + ctx.config.flowchart.stepY;

  [ifShapeGroup, elseShapeGroup].forEach(sg => {
    const vline = ctx.factory.vline({
      x: sg.x,
      y: sg.y + sg.maxY,
      step: mergeY - sg.maxY - sg.y,
    });
    shapes.push(vline);
  });

  const mergeHline = ctx.factory.hline({
    x: elseShapeGroup.x,
    y: mergeY,
    step: - elseShapeGroup.x + cond.x,
    isArrow: true,
  });

  shapes.push(mergeHline);

  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
  };
}

const createWhileFlowchart = (node: ASTNode, ctx: Context): Flowchart => {
  //                   |
  //  loop back path   |
  //       +---------->|
  //       |           |
  //       |       _.-' '-._
  //       |      '-._   _.-'----+
  //       |          '+'        |
  //       |           |         |
  //       |  block +--+--+      |  loop exit path
  //       |        |     |      |
  //       |        +--+--+      |
  //       |           |         |
  //       +-----------+         |
  //                             |
  //                             |
  //                   +---------+
  //                   |

  console.assert(node.type === 'while');
  const shapes = [];
  let y = 0;

  shapes.push(ctx.factory.vline(
    {x: 0, y, step: ctx.config.flowchart.stepY}
  ));
  y += ctx.config.flowchart.stepY;

  const cond = ctx.factory.diamond({text: node.content});
  shapes.push(cond);
  ctx.factory.trans(cond, 0, y);
  y += cond.height;

  const {shapeGroup: blockShapeGroup} = createFlowchartSub(node, ctx);
  ctx.factory.trans(blockShapeGroup, 0, y);
  shapes.push(blockShapeGroup);
  y += blockShapeGroup.height

  shapes.push(ctx.factory.vline(
    {x: 0, y, step: ctx.config.flowchart.stepY}
  ));
  y += ctx.config.flowchart.stepY;

  // loop back path
  shapes.push(ctx.factory.path({
    x: 0, y,
    cmds: [
      ['h', - Math.max(cond.width / 2, - blockShapeGroup.minX) - ctx.config.flowchart.stepX],
      ['v', cond.y - ctx.config.flowchart.stepY / 2 - y],
      ['h', Math.max(cond.width / 2, - blockShapeGroup.minX) + ctx.config.flowchart.stepX],
    ],
    isArrow: true,
  }));

  // loop exit path
  shapes.push(ctx.factory.path({
    x: cond.width / 2, y: cond.y + cond.height / 2,
    cmds: [
      ['h', Math.max(0, blockShapeGroup.maxX - cond.width / 2) + ctx.config.flowchart.stepX],
      ['v', ctx.config.flowchart.stepX + y - cond.y - cond.height / 2],
      ['h', - Math.max(cond.width / 2, blockShapeGroup.maxX) - ctx.config.flowchart.stepX],
    ],
  }));

  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
  };
}

const createDoWhileFlowchart = (doNode: ASTNode, whileNode: ASTNode, ctx: Context): Flowchart => {
  //
  //                   |
  //  loop back path   |
  //       +---------->|
  //       |           |
  //       |  block +--+--+
  //       |        |     |
  //       |        +--+--+
  //       |           |
  //       |       _.-' '-._
  //       |      '-._   _.-'----+
  //       |          '+'        | loop exit path
  //       |           |         |
  //       +-----------+         |
  //                             |
  //                   +---------+
  //                   |

  console.assert(doNode.type === 'do');
  console.assert(doNode.type === 'while');
  const shapes = [];
  let y = 0;

  shapes.push(ctx.factory.vline(
    {x: 0, y, step: ctx.config.flowchart.stepY}
  ));
  y += ctx.config.flowchart.stepY;

  const {shapeGroup: blockShapeGroup} = createFlowchartSub(doNode, ctx);
  ctx.factory.trans(blockShapeGroup, 0, y);
  shapes.push(blockShapeGroup);
  y += blockShapeGroup.height

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

  // loop back path
  shapes.push(ctx.factory.path({
    x: 0, y,
    cmds: [
      ['h', - Math.max(cond.width / 2, - blockShapeGroup.minX) - ctx.config.flowchart.stepX],
      ['v', blockShapeGroup.y + blockShapeGroup.minY + ctx.config.flowchart.stepY / 2 - y],
      ['h', Math.max(cond.width / 2, - blockShapeGroup.minX) + ctx.config.flowchart.stepX],
    ],
    isArrow: true,
  }));

  // loop exit path
  shapes.push(ctx.factory.path({
    x: cond.width / 2, y: cond.y + cond.height / 2,
    cmds: [
      ['h', Math.max(0, blockShapeGroup.maxX - cond.width / 2) + ctx.config.flowchart.stepX],
      ['v', ctx.config.flowchart.stepX + y - cond.y - cond.height / 2],
      ['h', - Math.max(cond.width / 2, blockShapeGroup.maxX) - ctx.config.flowchart.stepX],
    ],
  }));

  return {
    type: 'flowchart',
    shapeGroup: ctx.factory.group({x: 0, y: 0, children: shapes}),
  };
}

export {
  createFlowchart,
  Flowchart,
}
