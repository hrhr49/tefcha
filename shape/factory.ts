import {
  Text,
  Shape,
  createGroup,
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
      type: 'path',
      x, y,
      width: 0,
      height: Math.abs(step),
      cmds: [
        ['v', step],
      ],
      minX: 0,
      maxX: 0,
      minY: Math.min(0, step),
      maxY: Math.max(0, step),
      isArrow,
      className,
    };
  }

  hline = ({x, y, step, isArrow = false, className = ''}:
           {x: number; y: number; step: number; isArrow?: boolean; className?: string}): Shape => {
    return {
      type: 'path',
      x, y,
      width: Math.abs(step),
      height: 0,
      cmds: [
        ['h', step],
      ],
      minX: Math.min(0, step),
      maxX: Math.max(0, step),
      minY: 0,
      maxY: 0,
      isArrow,
      className,
    };
  }

  text = ({text, className = ''}:
          {text: string; className?: string}): Shape => {
    const {width, height} = this.measureText(text);
    return {
      type: 'text',
      content: text,
      x: 0, y: 0,
      minX: 0, maxX: width,
      minY: 0, maxY: height,
      width, height,
      className,
    };
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

    const textShape: Text = {
      type: 'text',
      content: text,
      x: - textSize.width / 2,
      y: height / 2 - textSize.height / 2,
      minX: 0,
      minY: 0,
      maxX: textSize.width,
      maxY: textSize.height,
      width: textSize.width,
      height: textSize.height,
      className: '',
    }
    const wrapShape: Shape = {
      type,
      x: - width / 2,
      y: 0,
      width, height,
      minX: 0,
      minY: 0,
      maxX: width,
      maxY: height,
      className,
    }
    return createGroup({x, y, children: [textShape, wrapShape]});
  }
}

export {
  Factory,
  MeasureTextFunc,
  TextSize,
}
