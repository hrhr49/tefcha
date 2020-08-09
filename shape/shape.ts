interface BaseShape {
  x: number;
  y: number;

  width: number;
  height: number;

  // NOTE: these values are relative coordinate
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  className: string;
}

interface Point extends BaseShape {
  type: 'point';
}

type PathCmd = ['v' | 'h', number];

interface Path extends BaseShape {
  type: 'path';
  cmds: PathCmd[];
  isArrow?: boolean;
}

interface Text extends BaseShape {
  type: 'text';
  content: string;
  isLabel?: boolean;
}

interface Rect extends BaseShape {
  type: 'rect';
}

interface Diamond extends BaseShape {
  type: 'diamond';
}

interface Group extends BaseShape {
  type: 'group';
  children: Shape[];
}

type Shape = Point | Path | Text | Rect | Diamond | Group;

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
}
