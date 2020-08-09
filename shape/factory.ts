import {
  Group,
  Shape,
  BaseShape,
  PathCmd,
} from './shape'
import {Config} from './config'

interface TextSize {
  width: number;
  height: number;
}

type MeasureTextFunc = (text: string, attrs?: any) => TextSize;

class Factory {
  private config: Config;
  private measureText: (text: string, attr?: any) => TextSize;

  constructor(config: Config, measureText: MeasureTextFunc) {
    this.config = config;
    this.measureText = measureText;
  }

  private baseShape = (): BaseShape => {
    return {
      x: 0, y: 0, width: 0, height: 0,
      minX: 0, minY: 0, maxX: 0, maxY: 0,
      className: '',
    }
  }

  rect = ({text, className = ''}:
    {text: string; className?: string}): Shape => {
    return this.textWrapperShape({type: 'rect', text, x: 0, y: 0, className});
  }

  diamond = ({text, className = ''}:
    {text: string; className?: string}): Shape => {
    return this.textWrapperShape({type: 'diamond', text, x: 0, y: 0, className});
  }

  vline = ({x, y, step, isArrow = false, className = ''}:
    {x: number; y: number; step: number; isArrow?: boolean; className?: string}): Shape => {
    return {
      ...this.baseShape(),
      type: 'path',
      x, y,
      height: Math.abs(step),
      cmds: [
        ['v', step],
      ],
      minY: Math.min(0, step),
      maxY: Math.max(0, step),
      isArrow,
      className,
    };
  }

  hline = ({x, y, step, isArrow = false, className = ''}:
    {x: number; y: number; step: number; isArrow?: boolean; className?: string}): Shape => {
    return {
      ...this.baseShape(),
      type: 'path',
      x, y,
      width: Math.abs(step),
      cmds: [
        ['h', step],
      ],
      minX: Math.min(0, step),
      maxX: Math.max(0, step),
      isArrow,
      className,
    };
  }

  path = ({x, y, cmds, isArrow = false, className = ''}:
    {x: number; y: number; cmds: PathCmd[]; isArrow?: boolean; className?: string}): Shape => {
    let px = 0;
    let py = 0;
    let minX = 0;
    let minY = 0;
    let maxX = 0;
    let maxY = 0;

    cmds.forEach(cmd => {
      const [cmdName, step] = cmd;
      if (cmdName === 'h') {
        px += step;
      } else {
        py += step;
      }
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxX, py);
    });
    return {
      ...this.baseShape(),
      type: 'path',
      x, y,
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      cmds,
      isArrow,
      className,
    };
  }

  text = ({text, className = ''}:
    {text: string; className?: string}): Shape => {
    const {width, height} = this.measureText(text);
    return {
      ...this.baseShape(),
      type: 'text',
      content: text,
      maxX: width,
      maxY: height,
      width, height,
      className,
    };
  }

  point = ({x, y, className = ''}:
    {x: number; y: number; className?: string}): Shape => {
    return {
      ...this.baseShape(),
      type: 'point',
      x, y,
      className,
    };
  }

  group = ({x, y, children, className = ''}:
    {x: number; y: number; children: Shape[]; className?: string}): Group => {
    if (children.length === 0) {
      // add dummy shape.
      children = [...children, this.point({x, y})];
    }
    const minX = Math.min(...children.map(child => child.x + child.minX));
    const minY = Math.min(...children.map(child => child.y + child.minY));
    const maxX = Math.max(...children.map(child => child.x + child.maxX));
    const maxY = Math.max(...children.map(child => child.y + child.maxY));

    return {
      type: 'group',
      x, y,
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      children,
      className,
    }
  }

  private textWrapperShape = (
    {type, text, x, y, className}:
      {
        type: 'rect' | 'diamond';
        text: string;
        x: number;
        y: number;
        className?: string;
      }
  ): Shape => {
    const textSize = this.measureText(text);
    let width: number;
    let height: number;

    if (type === 'rect') {
      width = textSize.width + this.config.rect.padX * 2;
      height = textSize.height + this.config.rect.padY * 2;
    } else if (type === 'diamond') {
      width = textSize.width + textSize.height / this.config.diamond.aspectRatio;
      height = textSize.height + textSize.width * this.config.diamond.aspectRatio;
      console.assert(Math.abs(height / width - this.config.diamond.aspectRatio) < 0.1);
    } else {
      console.assert(false);
    }

    const textShape = this.trans(
      this.text({text, className}),
      - textSize.width / 2,
      height / 2 - textSize.height / 2
    );
    const wrapShape: Shape = {
      ...this.baseShape(),
      type,
      x: - width / 2,
      width, height,
      maxX: width, maxY: height,
      className,
    }
    return this.group({x, y, children: [textShape, wrapShape]});
  }

  trans = (shape: Shape, dx: number, dy: number): Shape => {
    shape.x += dx;
    shape.y += dy;
    return shape;
  }
}

export {
  Factory,
  MeasureTextFunc,
  TextSize,
}
