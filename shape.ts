import {Config} from './config'

class BaseShape {
  x: number;
  y: number;

  width: number;
  height: number;

  // NOTE: these values are relative coordinate
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    minX = 0,
    minY = 0,
    maxX = 0,
    maxY = 0,
  }: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
  }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  trans = (dx: number, dy: number): BaseShape => {
    this.x += dx;
    this.y += dy;
    return this;
  }
}

class Point extends BaseShape {
  type: 'point';
  constructor({x, y}: {x: number, y: number}) {
    super({x, y});
    this.type = 'point';
  }
  clone = (): Point => {
    return new Point({x: this.x, y: this.y});
  }
}

type PathCmd = ['v' | 'h', number];

class Path extends BaseShape {
  readonly type: 'path';
  readonly cmds: PathCmd[];
  readonly isArrow?: boolean;

  constructor({x, y, cmds, isArrow = false}:
    {x: number; y: number; cmds: PathCmd[]; isArrow?: boolean}) {
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
      maxY = Math.max(maxY, py);
    });

    super({
      x, y,
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
    });
    this.cmds = cmds;
    this.isArrow = isArrow;
    this.type = 'path';
  }

  static vline = ({x, y, step, isArrow = false}:
    {x: number; y: number; step: number; isArrow?: boolean;}): Path => {
    return new Path({
      x, y,
      cmds: [
        ['v', step],
      ],
      isArrow,
    });
  }

  static hline = ({x, y, step, isArrow = false}:
    {x: number; y: number; step: number; isArrow?: boolean;}): Path => {
    return new Path({
      x, y,
      cmds: [
        ['h', step],
      ],
      isArrow,
    });
  }
}

class Text extends BaseShape {
  readonly type: 'text';
  readonly content: string;
  readonly isLabel?: boolean;

  constructor(
    {
      content,
      width,
      height,
      x = 0,
      y = 0,
      isLabel = false,
    }
      :
    {
      content: string;
      x?: number;
      y?: number;
      width: number;
      height: number
      isLabel?: boolean;
    }
  ) {
    super({
      x, y,
      maxX: width,
      maxY: height,
      width, height,
    });
    this.content = content;
    this.type = 'text';
    this.isLabel = isLabel;
  }

  static createByMeasure = ({x = 0, y = 0, text, attrs, measureText, isLabel}:
    {x?: number, y?: number, text: string; attrs: any, measureText: MeasureTextFunc, isLabel?: boolean}): Text => {
    const {width, height} = measureText(text, attrs);
    return new Text({
      content: text,
      x, y,
      width, height,
      isLabel,
    });
  }
}

class Rect extends BaseShape {
  readonly type: 'rect';
  constructor({x = 0, y = 0, width, height}
    : {x?: number; y?: number; width: number; height: number}
  ) {
    super({x, y, width, height, maxX: width, maxY: height});
    this.type = 'rect';
  }
}

class Diamond extends BaseShape {
  readonly type: 'diamond';
  constructor({x = 0, y = 0, width, height}
    : {x?: number; y?: number; width: number; height: number}
  ) {
    super({x, y, width, height, maxX: width, maxY: height});
    this.type = 'diamond';
  }
}

class Group extends BaseShape {
  readonly type: 'group';
  readonly children: Shape[];

  constructor({x, y, children}:
    {x: number; y: number; children: Shape[]}) {
    super({x, y});
    if (children.length === 0) {
      // add dummy shape.
      children = [...children, new Point({x, y})];
    }
    this.minX = Math.min(...children.map(child => child.x + child.minX));
    this.minY = Math.min(...children.map(child => child.y + child.minY));
    this.maxX = Math.max(...children.map(child => child.x + child.maxX));
    this.maxY = Math.max(...children.map(child => child.y + child.maxY));
    this.width = this.maxX - this.minX;
    this.height = this.maxY - this.minY;
    this.type = 'group';
    this.children = children;
  }

  add = (shape: Shape): Group => {
    this.minX = Math.min(this.minX, shape.x + shape.minX);
    this.minY = Math.min(this.minY, shape.y + shape.minY);
    this.maxX = Math.max(this.maxX, shape.x + shape.maxX);
    this.maxY = Math.max(this.maxY, shape.y + shape.maxY);
    this.width = this.maxX - this.minX;
    this.height = this.maxY - this.minY;
    this.children.push(shape);
    return this;
  }
}

type Shape = Point | Path | Text | Rect | Diamond | Group;
interface TextSize {
  readonly width: number;
  readonly height: number;
}

type MeasureTextFunc = (text: string, attrs?: any) => TextSize;

export {
  Point,
  Path,
  Text,
  Rect,
  Diamond,
  Group,
  Shape,
  BaseShape,
  PathCmd,
  MeasureTextFunc,
  TextSize,
}
