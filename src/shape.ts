const {max, min} = Math;

class BaseShape {
  x: number;
  y: number;

  w: number;
  h: number;

  // NOTE: these values are relative coordinate
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor({
    x = 0,
    y = 0,
    w = 0,
    h = 0,
    minX = 0,
    minY = 0,
    maxX = 0,
    maxY = 0,
  }: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
  }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
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
      minX = min(minX, px);
      minY = min(minY, py);
      maxX = max(maxX, px);
      maxY = max(maxY, py);
    });

    super({
      x, y,
      minX, minY, maxX, maxY,
      w: maxX - minX,
      h: maxY - minY,
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
      w,
      h,
      x = 0,
      y = 0,
      isLabel = false,
    }
      :
    {
      content: string;
      x?: number;
      y?: number;
      w: number;
      h: number
      isLabel?: boolean;
    }
  ) {
    super({
      x, y,
      maxX: w,
      maxY: h,
      w, h,
    });
    this.content = content;
    this.type = 'text';
    this.isLabel = isLabel;
  }

  static byMeas = ({x = 0, y = 0, text, attrs, meas, isLabel}:
    {x?: number, y?: number, text: string; attrs: any, meas: MeasureTextFunc, isLabel?: boolean}): Text => {
    const {w, h} = meas(text, attrs);
    return new Text({
      content: text,
      x, y,
      w, h,
      isLabel,
    });
  }
}

class Rect extends BaseShape {
  readonly type: 'rect';
  constructor({x = 0, y = 0, w, h}
    : {x?: number; y?: number; w: number; h: number}
  ) {
    super({x, y, w, h, maxX: w, maxY: h});
    this.type = 'rect';
  }
}

class Frame extends BaseShape {
  readonly type: 'frame';
  constructor({x = 0, y = 0, w, h}
    : {x?: number; y?: number; w: number; h: number}
  ) {
    super({x, y, w, h, maxX: w, maxY: h});
    this.type = 'frame';
  }
}

class Diamond extends BaseShape {
  readonly type: 'diamond';
  constructor({x = 0, y = 0, w, h}
    : {x?: number; y?: number; w: number; h: number}
  ) {
    super({x, y, w, h, maxX: w, maxY: h});
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
    this.minX = min(...children.map(c => c.x + c.minX));
    this.minY = min(...children.map(c => c.y + c.minY));
    this.maxX = max(...children.map(c => c.x + c.maxX));
    this.maxY = max(...children.map(c => c.y + c.maxY));
    this.w = this.maxX - this.minX;
    this.h = this.maxY - this.minY;
    this.type = 'group';
    this.children = children;
  }

  add = (shape: Shape): Group => {
    this.minX = min(this.minX, shape.x + shape.minX);
    this.minY = min(this.minY, shape.y + shape.minY);
    this.maxX = max(this.maxX, shape.x + shape.maxX);
    this.maxY = max(this.maxY, shape.y + shape.maxY);
    this.w = this.maxX - this.minX;
    this.h = this.maxY - this.minY;
    this.children.push(shape);
    return this;
  }
}

type Shape = Point | Path | Text | Rect | Frame | Diamond | Group;
type ShapeType = Shape['type'];

interface TextSize {
  readonly w: number;
  readonly h: number;
}

type MeasureTextFunc = (text: string, attrs?: any) => TextSize;

export {
  Point,
  Path,
  Text,
  Rect,
  Frame,
  Diamond,
  Group,
  Shape,
  ShapeType,
  BaseShape,
  PathCmd,
  MeasureTextFunc,
  TextSize,
}
