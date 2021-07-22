import {parse} from '../parser'
import {
  TextSize,
  MeasureTextFunc,
  Shape,
  Text,
  Rect,
  Frame,
  Diamond,
  Path,
} from '../shape'
import {createFlowchart} from '../flowchart'
import {Config, mergeDefaultConfig} from '../config'


interface Layers {
  frameLayer: SVGElement;
  textLayer: SVGElement;
  nodeLayer: SVGElement;
  pathLayer: SVGElement;
}

interface RenderParam {
    src: string;
    config?: Config;
    document: Document;
}

const DEBUG = false;

class Renderer {
  readonly dummySVG: SVGElement;
  readonly svg: SVGElement;
  readonly _document: Document;
  readonly src: string;
  readonly config: Config;
  readonly labelHeight: number;
  readonly textHeight: number;

  constructor({
    src,
    config,
    document,
  }: RenderParam) {
    this._document = document;
    this.src = src;
    this.config = config = mergeDefaultConfig(config);

    this.dummySVG = this.el('svg');
    this.svg = this.el('svg', {
      version: '1.1',
      xmlns: 'http://www.w3.org/2000/svg',
    });

    this.labelHeight = this.measureText('A', config.label.attrs).h;
    this.textHeight = this.measureText('A', config.text.attrs).h;
  }

  el = (
    tagName: string,
    attrs?: any,
    ...children: (Element | string)[]
  ): SVGElement => {
    const e = this._document.createElementNS('http://www.w3.org/2000/svg', tagName);
    Object.entries(attrs || {})
      .forEach(([k, v]: [any, any]) => e.setAttribute(k === 'className' ? 'class' : k, v.toString()));
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
    offsetX = 0,
    offsetY = 0,
  }: {
    layers: Layers;
    shape: Shape;
    offsetX?: number;
    offsetY?: number;
  }): void => {
    const x = offsetX + shape.x;
    const y = offsetY + shape.y;

    switch (shape.type) {
      case 'group':
        shape.children.forEach(child => this.renderShape({layers, shape: child, offsetX: x, offsetY: y}));
        break;
      case 'text':
        layers.textLayer.append(this.renderText({x, y, shape}));
        break;
      case 'path':
        layers.pathLayer.append(this.renderPath({x, y, shape}));
        break;
      case 'rect':
        layers.nodeLayer.append(this.renderRect({x, y, shape}));
        break;
      case 'frame':
        layers.frameLayer.append(this.renderFrame({x, y, shape}));
        break;
      case 'diamond':
        layers.nodeLayer.append(this.renderDiamond({x, y, shape}));
        break;
      case 'point':
        break;
      default:
        const _: never = shape;
        throw `shape ${_} is invalid`;
    }
  };

  renderText = ({
    x,
    y,
    shape,
  }: {
    x: number,
    y: number,
    shape: Text,
  }): SVGElement => {
    const {config} = this;
    return this.createTextSVGElement(
      shape.content,
      {
        x,
        y: y + (shape.isLabel ? this.labelHeight : this.textHeight) / 2,
        'dominant-baseline': 'central',
        ...(shape.isLabel ? config.label.attrs : config.text.attrs),
      })
  }

  renderRect = ({
    x,
    y,
    shape,
  }: {
    x: number,
    y: number,
    shape: Rect,
  }): SVGElement => {
    const {config} = this;
    const {w, h} = shape;
    return this.el('rect', {x, y, width: w, height: h, ...config.rect.attrs})
  }

  renderFrame = ({
    x,
    y,
    shape,
  }: {
    x: number,
    y: number,
    shape: Frame,
  }): SVGElement => {
    const {config} = this;
    const {w, h} = shape;
    return this.el('rect', {x, y, width: w, height: h, ...config.frame.attrs})
  }

  renderDiamond = ({
    x,
    y,
    shape,
  }: {
    x: number,
    y: number,
    shape: Diamond,
  }): SVGElement => {
    const {config} = this;
    const {w, h} = shape;
    return this.el('polygon', {
      points: `${x + w / 2},${y}, ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`,
      ...config.diamond.attrs,
    })
  }

  renderPath = ({
    x,
    y,
    shape,
  }: {
    x: number,
    y: number,
    shape: Path,
  }): SVGElement => {
    const {config} = this;
    const m = `M ${x} ${y}`;
    const l = shape.cmds.map(cmd => cmd.join(' ')).join(' ');
    //     arrow = 'marker-end="url(#arrow-head)"' if self.is_arrow else ''
    return this.el('path', {
      d: `${m} ${l}`,
      ...(shape.isArrow ?
          {'marker-end': 'url(#arrow-head)'} : {}),
      ...config.path.attrs,
    });
  }

  render = () => {
    let {src, config, el, measureText, renderShape} = this;
    const svg = this.svg;
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
    const backgroundLayer = el('g');
    const frameLayer = el('g');
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
        frameLayer,
        pathLayer,
        nodeLayer,
        textLayer,
      },
      shape: flowchart.shapes,
    });

    svg.append(backgroundLayer);
    svg.append(frameLayer);
    svg.append(pathLayer);
    svg.append(nodeLayer);
    svg.append(textLayer);

    // (x, y) have been moved to (0, 0) in createFlowchart().
    const svgX = 0;
    const svgY = 0;
    const svgWidth = flowchart.shapes.w + config.flowchart.marginX * 2;
    const svgHeight = flowchart.shapes.h + config.flowchart.marginY * 2;


    svg.setAttribute('width', String(svgWidth));
    svg.setAttribute('height', String(svgHeight));

    svg.setAttribute('viewBox', `${svgX} ${svgY} ${svgWidth} ${svgHeight}`);
    const backgroundColor = config.flowchart.backgroundColor;
    if (!['', 'none', 'transparent'].includes(backgroundColor)) {
      backgroundLayer.append(el('rect', {x: 0, y: 0, width: svgWidth, height: svgHeight, fill: backgroundColor}));
    }

    return svg;
  };
}


const render = (param: RenderParam) => {
  if (DEBUG) {
    const s = performance.now();
    const ret = new Renderer(param).render();
    const e = performance.now();
    console.log(`rendering: ${e - s} ms`);
    return ret;
  } else {
    return new Renderer(param).render();
  }
}

export {
  render,
  Renderer,
}
