import {ASTNode} from './parser'
import {
  Shape,
  Group,
  transShape,
  createGroup,
} from './shape/shape'
import {Factory, MeasureTextFunc} from './shape/factory'
import {Config} from './shape/config'

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
  transShape(
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
        transShape(shapeGroup, 0, y);
        shapes.push(shapeGroup);
        y += shapeGroup.height;
        continue;
      }
      case 'while': {
        const nodes: ASTNode[] = [];
        while (
          childIdx < node.children.length &&
          ['if', 'elif', 'else'].includes(node.children[childIdx].type)
        ) {
          nodes.push(node.children[childIdx]);
          childIdx++;
        }
        const {shapeGroup} = createIfFlowchart(nodes, ctx);
        transShape(shapeGroup, 0, y);
        shapes.push(shapeGroup);
        y += shapeGroup.height;
        break;
      }
      case 'do': {
        break;
      }
    }
    childIdx++;
  }
  const flowchart: Flowchart = {
    type: 'flowchart',
    shapeGroup: createGroup({x: 0, y: 0, children: shapes}),
  };
  return flowchart;
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
      shapeGroup: createGroup({x: 0, y: 0, children: []}),
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
  transShape(cond, 0, y);
  shapes.push(cond);

  shapes.push(
    transShape(
      ctx.factory.text({
        text: ctx.config.diamond.yesText,
        className: 'label',
      }),
      ctx.config.diamond.labelMarginX,
      cond.height  + ctx.config.diamond.labelMarginY,
    )
  );
  shapes.push(
    transShape(
      ctx.factory.text({
        text: ctx.config.diamond.noText,
        className: 'label',
      }),
      cond.width / 2 + ctx.config.diamond.labelMarginX,
      cond.height / 2 + ctx.config.diamond.labelMarginY,
    )
  );

  const {shapeGroup: ifShapeGroup} = createFlowchartSub(ifNode, ctx);
  transShape(ifShapeGroup, 0, cond.y + cond.maxY);
  shapes.push(ifShapeGroup);

  // create else part flowchart
  const {shapeGroup: elseShapeGroup} = createIfFlowchart(nodes.slice(1), ctx);
  transShape(
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

  const flowchart: Flowchart = {
    type: 'flowchart',
    shapeGroup: createGroup({x: 0, y: 0, children: shapes}),
  };
  console.log(shapes)
  return flowchart;
}


export {
  createFlowchart,
  Flowchart,
}
