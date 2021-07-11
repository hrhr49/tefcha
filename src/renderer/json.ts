// output JSON for debug.

import {parse} from '../parser'
import {
  TextSize,
  MeasureTextFunc,
  Shape
} from '../shape'
import {createFlowchart} from '../flowchart'
import {Config, mergeDefaultConfig} from '../config'


interface RenderParam {
  src: string;
}

class Renderer {
  dummySVG: SVGElement;
  _document: Document;
  src: string;
  config: Config;

  constructor({
    src,
  }: RenderParam) {
    this._document = document;
    this.src = src;
    this.config = mergeDefaultConfig();

    this.dummySVG = this.el('svg');
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
    jsonOutput,
    shape,
    config,
    offsetX = 0,
    offsetY = 0,
  }: {
    jsonOutput: any;
    shape: Shape;
    config: Config;
    offsetX?: number;
    offsetY?: number;
  }): void => {
    let {
      renderShape,
    } = this;
    const x = offsetX + shape.x;
    const y = offsetY + shape.y;

    switch (shape.type) {
      case 'group':
        shape.children.forEach(child => renderShape({jsonOutput, config, shape: child, offsetX: x, offsetY: y}));
        break;
      case 'text':
      case 'path':
      case 'rect':
      case 'frame':
      case 'diamond':
      case 'point':
        jsonOutput.push({
          ...shape,
          x, y,
          w: shape.w,
          h: shape.h,
        });
        break;
      default:
        const _: never = shape;
        throw `shape ${_} is invalid`;
    }
  };

  render = () => {
    let {src, config, measureText, renderShape} = this;
    const jsonOutput: any[] = [];

    const flowchart = createFlowchart({
      node: parse(src, config),
      config,
      measureText: measureText,
    });

    renderShape({
      jsonOutput,
      shape: flowchart.shapes,
      config,
    });

    return jsonOutput;
  };
}


const render = (param: RenderParam) => {
  return new Renderer(param).render();
}

export {
  render,
  Renderer,
}
