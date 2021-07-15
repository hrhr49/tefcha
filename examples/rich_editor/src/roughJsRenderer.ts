import rough from 'roughjs/bin/rough';
import {RoughSVG} from 'roughjs/bin/svg';

import {
  Renderer,
} from '../../../src/renderer/svg';
import {
  TextSize,
  MeasureTextFunc,
  Shape,
  Text,
  Rect,
  Frame,
  Diamond,
  Path,
} from '../../../src/shape'
import {
  Config,
  mergeDefaultConfig
} from '../../../src/config'

class RoughJsRenderer extends Renderer {
  rc: RoughSVG

  constructor({
    src,
    config,
    document,
  }: any) {
    super({src, config, document});
    this.rc = rough.svg(this.svg as SVGSVGElement);
  }

  renderText = ({
    x,
    y,
    shape,
    config
  }: {
    x: number,
    y: number,
    shape: Text,
    config: Config
  }): SVGElement => {
    return this.createTextSVGElement(
      shape.content,
      {
        x,
        y: y + this.measureText('A', shape.isLabel ? config.label.attrs : config.text.attrs).h / 2,
        'dominant-baseline': 'central',
        ...(shape.isLabel ? config.label.attrs : config.text.attrs),
        // NOTE: white colored text is hard to see.
        stroke: 'black',
        fill: 'black',
      })
  }

  renderRect = ({
    x,
    y,
    shape,
    config,
  }: {
    x: number,
    y: number,
    shape: Rect,
    config: Config,
  }): SVGElement => {
    const {w, h} = shape;
    return this.rc.rectangle(x, y, w, h, {
      ...config.rect.attrs,
    });
  }

  renderFrame = ({
    x,
    y,
    shape,
    config,
  }: {
    x: number,
    y: number,
    shape: Frame,
    config: Config,
  }): SVGElement => {
    const {w, h} = shape;
    return this.rc.rectangle(x, y, w, h, config.frame.attrs);
  }

  renderDiamond = ({
    x,
    y,
    shape,
    config,
  }: {
    x: number,
    y: number,
    shape: Diamond,
    config: Config,
  }): SVGElement => {
    const {w, h} = shape;
    return this.rc.polygon(
      [
        [x + w / 2,y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
        [x,y + h / 2],
      ],
      {
        ...config.diamond.attrs,
      }
    );
  }

  renderPath = ({
    x,
    y,
    shape,
    config,
  }: {
    x: number,
    y: number,
    shape: Path,
    config: Config,
  }): SVGElement => {
    const m = `M ${x} ${y}`;
    const l = shape.cmds.map(cmd => cmd.join(' ')).join(' ');
    //     arrow = 'marker-end="url(#arrow-head)"' if self.is_arrow else ''
    return this.rc.path(
      `${m} ${l}`,
      {
        ...(shape.isArrow ?
            {'marker-end': 'url(#arrow-head)'} : {}),
        ...config.path.attrs,
      }
    );
  }

}

export {
  RoughJsRenderer,
}
