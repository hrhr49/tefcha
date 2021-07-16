// import * as fs from 'fs';
// import * as xml2js from 'xml2js';


// const extractItemFromSVG = (svgObj: any): any => {
//   const shapes = svgObj.svg.g;
//   const hlines = [];
//   const vlines = [];

//   shapes.forEach(shape => {
//     if (shape.rect) {
//       shape.rect.forEach(rectAttr => {
//         let {x, y, width, height} = rectAttr.$
//         x = Number(x);
//         y = Number(y);
//         width = Number(width);
//         height = Number(height);

//         hlines.push({
//           x1: x,
//           x2: x + width,
//           y: y,
//         });
//         hlines.push({
//           x1: x,
//           x2: x + width,
//           y: y + height,
//         });
//         vlines.push({
//           y1: y,
//           y2: y + height,
//           x: x,
//         });
//         vlines.push({
//           y1: y,
//           y2: y + height,
//           x: x + width,
//         });
//       });
//     } else if (shape.path) {
//       shape.path.forEach(pathAttr => {
//         const {d} = pathAttr.$;
//         // console.log(pathAttr.$);
//         // console.log(pathAttr.$.d);
//         const commands = d.split(' ');
//         let x = Number(commands[1]);
//         let y = Number(commands[2]);

//         let idx = 3;
//         while (idx < commands.length) {
//           const dir = commands[idx];
//           if (dir === 'v') {
//             idx++;
//             const step = Number(commands[idx]);
//             vlines.push({
//               y1: y,
//               y2: y + step,
//               x: x,
//             });
//             y += step;
//           } else if(dir === 'h') {
//             idx++;
//             const step = Number(commands[idx]);
//             hlines.push({
//               x1: x,
//               x2: x + step,
//               y: y,
//             });
//             x += step;
//           } else {
//             throw 'err';
//           }
//           idx++;
//         }
//       });
//     }
//   })

//   return {
//     hlines,
//     vlines,
//   };
// };

// const isIntersect = (start1, end1, start2, end2) => {
//   return (
//     (start1 >= start2 && start1 <= end2)
//     || (start2 >= start1 && start2 <= end1)
//   );
// };

// const distanceHLines = (hline1, hline2): number => {
//   let {x1: x11, x2: x12, y: y1} = hline1;
//   let {x1: x21, x2: x22, y: y2} = hline2;
//   if (isIntersect(x11, x12, x21, x22)) {
//     return Math.abs(y1 - y2);
//   } else {
//     const xd = Math.min(
//       Math.abs(x11 - x21),
//       Math.abs(x11 - x22),
//       Math.abs(x12 - x21),
//       Math.abs(x12 - x22),
//     );
//     return Math.sqrt(Math.pow(xd, 2) + Math.pow(y1 - y2, 2));
//   }
// };

// const checkSVGFile = (filename: string, {hlineDistMax}: any): string => {
//   const xmlStr = fs.readFileSync(filename, 'utf-8');
//   let ret = 'OK';
//   xml2js.parseString(xmlStr, (err, result) => {
//     if (err) {
//       ret = 'NG: svg parse error';
//     } else {
//       const {hlines, vlines} = extractItemFromSVG(result);
//       for (let i = 0; i < hlines.length; i++ ) {
//         for (let j = i + 1; j < hlines.length; j++ ) {
//           const hline1 = hlines[i];
//           const hline2 = hlines[j];
//           const d = distanceHLines(hline1, hline2);
//           if (d < hlineDistMax) {
//             ret = `NG: hlines too close\nd: ${d}\nhline1: ${JSON.stringify(hline1)}\nhline2: ${JSON.stringify(hline2)}`;
//           }
//         }
//       }
//     }
//   });
//   return ret;
// };

// export {
//   checkSVGFile,
// }
