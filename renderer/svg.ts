import {parse} from '../parser'
import {
  TextSize,
  MeasureTextFunc,
  Shape
} from '../shape'
import {createFlowchart} from '../flowchart'
import {defaultConfig, Config, mergeDefaultConfig} from '../config'


interface Layers {
  textLayer: SVGElement;
  nodeLayer: SVGElement;
  pathLayer: SVGElement;
}

interface RenderParam {
    src: string;
    config?: Config;
    document: Document;
}

class Renderer {
  dummySVG: SVGElement;
  _document: Document;
  src: string;
  config: Config;

  constructor({
    src,
    config,
    document,
  }: RenderParam) {
    this._document = document;
    this.src = src;
    this.config = {
      ...defaultConfig,
      ...config,
    }

    this.dummySVG = this.el('svg');
  }

  el = (
    tagName: string,
    attrs?: any,
    ...children: (Element | string)[]
  ): SVGElement => {
    const e = this._document.createElementNS('http://www.w3.org/2000/svg', tagName);
    Object.entries(attrs || {})
      .forEach(([k, v]) => e.setAttribute(k === 'className' ? 'class' : k, v.toString()));
    (children || []).forEach(child => e.append(child));
    return e;
  };

  createTextSVGElement = (text: string, attrs?: any): SVGElement => {
    const {el} = this;
    const textSVG = el('text', attrs || {});
    text.split(/\\n/).forEach((line, idx) => {
      textSVG.append(el('tspan', {x: attrs.x, dy: `${idx === 0 ? 0 : 1}em`}, line));
    });
    return textSVG;
  }

  // this is not good...
  measureText: MeasureTextFunc =
    (text: string, attrs: any = {}): TextSize => {
      const {dummySVG, createTextSVGElement} = this;
      const _attrs = {...attrs, x: (attrs.x || 0)};
      this._document.body.append(dummySVG);
      const textSVG = createTextSVGElement(text, _attrs);
      dummySVG.append(textSVG);
      const {width, height} = textSVG.getBoundingClientRect();
      dummySVG.removeChild(textSVG);
      this._document.body.removeChild(dummySVG);
      return {w: width, h: height};
    }

  renderShape = ({
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
    let {
      el,
      createTextSVGElement,
      renderShape,
      measureText,
    } = this;
    const x = offsetX + shape.x;
    const y = offsetY + shape.y;
    const {w, h} = shape;

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
              y: y + measureText('A', shape.isLabel ? config.label.attrs : config.text.attrs).h / 2,
              'dominant-baseline': 'central',
              ...(shape.isLabel ? config.label.attrs : config.text.attrs),
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
        layers.nodeLayer.append(el('rect', {x, y, width: w, height: h, ...config.rect.attrs}));
        break;
      case 'diamond':
        layers.nodeLayer.append(el('polygon', {
          points: `${x + w / 2},${y}, ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`,
          ...config.diamond.attrs,
        }));
        break;
      case 'point':
        break;
      default:
    }
  };

  render = () => {
    let {src, config, el, measureText, renderShape} = this;
    config = mergeDefaultConfig(config);
    const svg = this.el('svg');
    const arrowHeadDef = el('defs', null,
      el('marker',
        {
          id: 'arrow-head',
          markerUnits: 'userSpaceOnUse',
          markerWidth: `${config.arrowHead.size}`,
          markerHeight: `${config.arrowHead.size * 2}`,
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
      node: parse(src, config),
      config,
      measureText: measureText,
    });

    renderShape({
      layers: {
        pathLayer,
        nodeLayer,
        textLayer,
      },
      shape: flowchart.shapes,
      config,
    });

    svg.append(pathLayer);
    svg.append(nodeLayer);
    svg.append(textLayer);

    svg.setAttribute('width', (flowchart.shapes.w + config.flowchart.marginX * 2).toString());
    svg.setAttribute('height', (flowchart.shapes.h + config.flowchart.marginY * 2).toString());
    return svg;
  };
}


const render = (param: RenderParam) => {
  return new Renderer(param).render();
}

export {
  render,
}
