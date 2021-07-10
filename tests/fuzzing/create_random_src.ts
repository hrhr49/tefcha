import * as fs from 'fs'

import {parse} from '../../src/parser'
import {defaultConfig} from '../../src/config'

const randRange = (start: number, end: number): number => {
  return start + Math.floor(Math.random() * (end - start));
};

const randChoice = (array: any[]): any => {
  return array[randRange(0, array.length)];
};

const randDist = (total: number, num: number, min: number = 1): number[] => {
  console.assert(min * num <= total);
  const distArray = new Array(num).fill(min);
  let restNum = total - min * num;
  for (let i = 0; i < restNum; i++) {
    distArray[randRange(0, num)]++;
  }
  return distArray;
};

const randChar = (): string => {
  return randChoice('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
}

const randStr = (length: number = 5): string => {
  while (true) {
    const ret = new Array(randRange(1, length+1))
      .fill(null)
      .map(() => randChar())
      .join('');
    if (!['if', 'elif', 'else', 'while', 'switch', 'do', 'case', 'try', 'except', 'break', 'continue', 'for', 'pass', 'Y', 'N', 'yes', 'no', 'Yes', 'No'].includes(ret)) {
      return ret;
    }
  }
};

const addIndent = (lines: string[]): string[] => {
  return lines.map(s => '  ' + s);
};

const createRandomSrc = ({
  lineNum = 10,
  isLooping = false,
  exceptNumMax = 3,
  elifNumMax = 2,
  caseNumMax = 4,
}: {
  lineNum?: number,
  isLooping?: boolean,
  exceptNumMax?: number,
  elifNumMax?: number,
  caseNumMax?: number,
}): string[] => {
  if (lineNum <= 0) {
    return [];
  }
  const items: string[] = ['simple'];
  if (lineNum >= 2) {
    items.push('if', 'while');
    if (isLooping) {
      items.push('continue', 'break');
    }
  }
  if (lineNum >= 3) {
    items.push('do-while');
    items.push('switch-case');
  }
  if (lineNum >= 4) {
    items.push('try-except');
  }

  const item = items[randRange(0, items.length)];
  // console.log(lineNum);
  // console.log(item);
  switch (item) {
    case 'simple': {
      return [
        randStr(),
        ...createRandomSrc({
          lineNum: lineNum - 1,
          isLooping
        }),
      ]
    }
    case 'continue': {
      return [
        ...createRandomSrc({
          lineNum: lineNum - 1,
          isLooping: false
        }),
        'continue',
      ]
    }
    case 'break': {
      return [
        ...createRandomSrc({
          lineNum: lineNum - 1,
          isLooping: false
        }),
        'break',
      ]
    }
    case 'if': {
      let useElse: boolean
      if (lineNum >= 4) {
        useElse = randChoice([true, false]);
      } else {
        useElse = false;
      }
      const elifNum = randRange(
        0,
        Math.max(0, Math.min(elifNumMax, Math.floor((lineNum - 2 - (useElse ? 2 : 0)) / 2))) + 1
      );
      const blockNum = 1 + (useElse ? 1 : 0) + elifNum;
      const blockLineNumArray = randDist(lineNum - blockNum, blockNum);
      const ret = [
        `if ${randStr()}`,
        ...addIndent(createRandomSrc({
          lineNum: blockLineNumArray[0],
          isLooping,
        })),
      ];
      if (elifNum > 0) {
        blockLineNumArray.slice(1, -1).forEach(blockLineNum => {
          ret.push(
            `elif ${randStr()}`,
            ...addIndent(createRandomSrc({
              lineNum: blockLineNum,
              isLooping,
            })),
          )
        });
      }
      if (useElse) {
        ret.push(
          'else',
          ...addIndent(createRandomSrc({
            lineNum: blockLineNumArray.slice(-1)[0],
            isLooping,
          })),
        );
      }

      return ret;
    }
    case 'while': {
      return [
        `while ${randStr()}`,
        ...addIndent(createRandomSrc({
          lineNum: lineNum - 1,
          isLooping: true,
        })),
      ]
    }
    case 'do-while': {
      return [
        'do',
        ...addIndent(createRandomSrc({
          lineNum: lineNum - 2,
          isLooping: true,
        })),
        `while ${randStr()}`,
      ]
    }
    case 'switch-case': {
      const caseNum = randRange(
        1, 
        Math.min(caseNumMax, Math.floor((lineNum - 1) / 2)) + 1,
      );
      const caseLineNumArray = randDist(lineNum - (1 + caseNum), caseNum);

      const ret = [
        `switch ${randStr()}`,
      ];
      caseLineNumArray.forEach(caseLineNum => {
        ret.push(
          `  case ${randStr()}`,
          ...addIndent(addIndent(createRandomSrc({
            lineNum: caseLineNum,
            isLooping,
          }))),
        );
      });
      return ret;
    }
    case 'try-except': {
      const exceptNum = randRange(
        1,
        Math.min(exceptNumMax, Math.floor((lineNum - 2) / 2)) + 1
      );
      const blockLineNumArray = randDist(lineNum - (1 + exceptNum), 1 + exceptNum);
      const ret = [
        'try',
        ...addIndent(createRandomSrc({
          lineNum: blockLineNumArray[0],
          isLooping,
        })),
      ];
      blockLineNumArray.slice(1).forEach(blockLineNum => {
        ret.push(
          `except ${randStr()}`,
          ...addIndent(createRandomSrc({
            lineNum: blockLineNum,
            isLooping,
          })),
        )
      });
      return ret;
    }
    default: {
      console.error(`invalid item ${item}`);
    }
  }
}

// for (let i = 0; i < 10000; i++) {
//   const iStr = `0000000${i}`.slice(-4);
//   while (true) {
//     const lineNum = Math.floor(Math.random() * 50) + 1;
//     const src = createRandomSrc({
//       lineNum,
//     }).join('\n') + '\nend\n';
//     // try {
//       parse(src, defaultConfig);
//     console.log(i);
//       // console.log(src + '\n');
//       fs.writeFileSync(`random_src/${iStr}.txt`, src);
//       break;
//     // } catch {
//     // }
//   }
// }

export {
  createRandomSrc,
}
