import * as fs from 'fs';


const extractItemFromJSON = (jsonObj: any[]): any => {
  const hlines = [];
  const vlines = [];

  jsonObj.forEach(shape => {
    switch(shape.type) {
      case 'rect': 
      case 'diamond': 
      {
        const {x, y, w, h} = shape;
        hlines.push({
          x1: x,
          x2: x + w,
          y: y,
        });
        hlines.push({
          x1: x,
          x2: x + w,
          y: y + h,
        });
        vlines.push({
          y1: y,
          y2: y + h,
          x: x,
        });
        vlines.push({
          y1: y,
          y2: y + h,
          x: x + w,
        });
        break;
      }
      case 'path': {
        let {x, y} = shape;
        const {cmds} = shape;

        cmds.forEach(([dir, step]: [string, number]) => {
          if (dir === 'v') {
            vlines.push({
              y1: y,
              y2: y + step,
              x: x,
            });
            y += step;
          } else if (dir === 'h') {
            hlines.push({
              x1: x,
              x2: x + step,
              y: y,
            });
            x += step;
          } else {
            throw `unknown path command ${dir}`;
          }
        });
      }
    }
  });

  return {
    hlines,
    vlines,
  };
};

const isIntersect = (start1, end1, start2, end2) => {
  return (
    (start1 >= start2 && start1 <= end2)
    || (start2 >= start1 && start2 <= end1)
  );
};

const distanceHLines = (hline1, hline2): number => {
  let {x1: x11, x2: x12, y: y1} = hline1;
  let {x1: x21, x2: x22, y: y2} = hline2;
  if (isIntersect(x11, x12, x21, x22)) {
    return Math.abs(y1 - y2);
  } else {
    const xd = Math.min(
      Math.abs(x11 - x21),
      Math.abs(x11 - x22),
      Math.abs(x12 - x21),
      Math.abs(x12 - x22),
    );
    return Math.sqrt(Math.pow(xd, 2) + Math.pow(y1 - y2, 2));
  }
};

const checkJSONFile = (filename: string, {hlineDistMax}: any): string => {
  const jsonObj = JSON.parse(fs.readFileSync(filename, 'utf-8'));
  let ret = 'OK';
  const {hlines, vlines} = extractItemFromJSON(jsonObj);
  for (let i = 0; i < hlines.length; i++ ) {
    for (let j = i + 1; j < hlines.length; j++ ) {
      const hline1 = hlines[i];
      const hline2 = hlines[j];
      const d = distanceHLines(hline1, hline2);
      if (d < hlineDistMax) {
        ret = `NG: hlines too close\nd: ${d}\nhline1: ${JSON.stringify(hline1)}\nhline2: ${JSON.stringify(hline2)}`;
      }
    }
  }
  return ret;
};

export {
  checkJSONFile,
}
