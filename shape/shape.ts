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
  width: 0;
  height: 0;
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

const transShape = (shape: Shape, dx: number, dy: number): Shape => {
  shape.x += dx;
  shape.y += dy;
  return shape;
}

const createGroup = ({x, y, children, className = ''}: 
                     {x: number; y: number; children: Shape[]; className?: string}): Group => {
  if (children.length === 0) {
    // add dummy shape.
    children = [...children,
    {
      type: 'point',
       x,
       y,
       width: 0,
       height: 0,
       minX: 0,
       maxX: 0,
       minY: 0,
       maxY: 0,
       className: '',
    }];
  }
  const minX = Math.min(...children.map(child => child.x + child.minX));
  const minY = Math.min(...children.map(child => child.y + child.minY));
  const maxX = Math.max(...children.map(child => child.x + child.maxX));
  const maxY = Math.max(...children.map(child => child.y + child.maxY));

  console.log(minX);
  console.log(minY);
  return {
    type: 'group',
    x, y,
    minX, minY,
    maxX, maxY,
    width: maxX - minX,
    height: maxY - minY,
    children,
    className,
  }
}

export {
  Point,
  Path,
  Text,
  Rect,
  Diamond,
  Group,
  Shape,
  transShape,
  createGroup,
}
