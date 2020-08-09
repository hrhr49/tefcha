import {parse} from '../parser'
import {Shape} from '../shape/shape'
import {TextSize, MeasureTextFunc} from '../shape/factory'
import {createFlowchart} from '../flowchart'
import {defaultConfig} from '../shape/config'

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

const fontHeight = measureText('A').height;


interface Layers {
  textLayer: SVGElement;
  nodeLayer: SVGElement;
  pathLayer: SVGElement;
}

interface RenderFlowchartParams {
  layers: Layers;
  shape: Shape;
  offsetX?: number;
  offsetY?: number;
}

const renderShape = ({
  layers,
  shape,
  offsetX = 0,
  offsetY = 0,
}: RenderFlowchartParams): void => {
  const x = offsetX + shape.x;
  const y = offsetY + shape.y;
  const {width, height, className} = shape;

  switch (shape.type) {
    case 'group':
      shape.children.forEach(child => renderShape({layers, shape: child, offsetX: x, offsetY: y}));
      break;
    case 'text':
      layers.textLayer.append(createTextSVGElement(
        shape.content,
        {
          x,
          y: y + fontHeight / 2,
          'dominant-baseline': 'central',
          className,
        }));
      break;
    case 'path':
      const m = `M ${x} ${y}`;
      const l = shape.cmds.map(cmd => cmd.join(' ')).join(' ');
      //     arrow = 'marker-end="url(#arrow-head)"' if self.is_arrow else ''
      layers.pathLayer.append(el('path', {
        d: `${m} ${l}`,
        ...(shape.isArrow ?
          {'marker-end': 'url(#arrow-head)'} : {}),
        className,
      }));
      break;
    case 'rect':
      layers.nodeLayer.append(el('rect', {x, y, width, height, className}));
      break;
    case 'diamond':
      layers.nodeLayer.append(el('polygon', {
        points: `${x + width / 2},${y}, ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`,
        className,
      }));
      break;
    case 'point':
      break;
    default:
  }
};

const render = (src: string) => {
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
    config: defaultConfig,
    measureText: measureText,
  });

  renderShape({
    layers: {
      pathLayer,
      nodeLayer,
      textLayer,
    },
    shape: flowchart.shapeGroup,
  });

  svg.append(pathLayer);
  svg.append(nodeLayer);
  svg.append(textLayer);

  svg.setAttribute('width', (flowchart.shapeGroup.width + 100).toString());
  svg.setAttribute('height', (flowchart.shapeGroup.height + 100).toString());
  return svg;
};

export {
  render,
}
