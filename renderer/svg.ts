import {parse} from '../parser'
import {
  TextSize,
  MeasureTextFunc,
  Shape
} from '../shape'
import {createFlowchart} from '../flowchart'
import {defaultConfig, Config} from '../config'

const el = (
  tagName: string,
  attrs?: any,
  ...children: (Element | string)[]
): SVGElement => {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  Object.entries(attrs || {})
    .forEach(([k, v]) => e.setAttribute(k === 'className' ? 'class' : k, v.toString()));
  (children || []).forEach(child => e.append(child));
  return e;
};

const dummySVG = el('svg');

const createTextSVGElement = (text: string, attrs?: any): SVGElement => {
  const textSVG = el('text', attrs || {});
  text.split(/\\n/).forEach((line, idx) => {
    textSVG.append(el('tspan', {x: attrs.x, dy: `${idx === 0 ? 0 : 1}em`}, line));
  });
  return textSVG;
}

// this is not good...
const measureText: MeasureTextFunc =
  (text: string, attrs: any = {}): TextSize => {
  const _attrs = {...attrs, x: (attrs.x || 0)};
  document.body.append(dummySVG);
  const textSVG = createTextSVGElement(text, _attrs);
  dummySVG.append(textSVG);
  const { width, height } = textSVG.getBoundingClientRect();
  dummySVG.removeChild(textSVG);
  document.body.removeChild(dummySVG);
  return {width, height};
}


interface Layers {
  textLayer: SVGElement;
  nodeLayer: SVGElement;
  pathLayer: SVGElement;
}

const renderShape = ({
  layers,
  shape,
  config,
  offsetX = 0,
  offsetY = 0,
}: {
  layers: Layers;
  shape: Shape;
  config: Config;
  offsetX?: number;
  offsetY?: number;
}): void => {
  const x = offsetX + shape.x;
  const y = offsetY + shape.y;
  const {width, height} = shape;

  switch (shape.type) {
    case 'group':
      shape.children.forEach(child => renderShape({layers, config, shape: child, offsetX: x, offsetY: y}));
      break;
    case 'text':
      layers.textLayer.append(
        createTextSVGElement(
          shape.content,
          {
            x,
            y: y + measureText('A', shape.isLabel ? config.label.attrs : config.text.attrs).height / 2,
            'dominant-baseline': 'central',
            ...config.text.attrs,
          })
      );
      break;
    case 'path':
      const m = `M ${x} ${y}`;
      const l = shape.cmds.map(cmd => cmd.join(' ')).join(' ');
      //     arrow = 'marker-end="url(#arrow-head)"' if self.is_arrow else ''
      layers.pathLayer.append(el('path', {
        d: `${m} ${l}`,
        ...(shape.isArrow ?
          {'marker-end': 'url(#arrow-head)'} : {}),
        ...config.path.attrs,
      }));
      break;
    case 'rect':
      layers.nodeLayer.append(el('rect', {x, y, width, height, ...config.rect.attrs}));
      break;
    case 'diamond':
      layers.nodeLayer.append(el('polygon', {
        points: `${x + width / 2},${y}, ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`,
        ...config.diamond.attrs,
      }));
      break;
    case 'point':
      break;
    default:
  }
};

const render = (src: string, config?: Config) => {
  config = config || defaultConfig;
  const svg = el('svg');
  const arrowHeadDef = el('defs', null,
    el('marker',
       {
         id: 'arrow-head',
         markerUnits: 'userSpaceOnUse',
         markerWidth: '20',
         markerHeight: '40',
         viewBox: '0 0 10 10',
         refX: '10',
         refY: '5',
         orient: 'auto-start-reverse',
       },
     el('polygon',
        {
          points: '0,0 0,10 10,5',
          'class': 'arrow-head',
          ...config.arrowHead.attrs,
        }
       )
    )
  );
  svg.append(arrowHeadDef);
  const pathLayer = el('g');
  const nodeLayer = el('g');
  const textLayer = el('g');

  const flowchart = createFlowchart({
    node: parse(src),
    config,
    measureText: measureText,
  });

  renderShape({
    layers: {
      pathLayer,
      nodeLayer,
      textLayer,
    },
    shape: flowchart.shapeGroup,
    config,
  });

  svg.append(pathLayer);
  svg.append(nodeLayer);
  svg.append(textLayer);

  svg.setAttribute('width', (flowchart.shapeGroup.width + config.flowchart.marginX * 2).toString());
  svg.setAttribute('height', (flowchart.shapeGroup.height + config.flowchart.marginY * 2).toString());
  return svg;
};

export {
  render,
}
