// import * as fs from 'fs'

// import {parse} from '../../src/parser'
// import {defaultConfig} from '../../src/config'

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
  randStrLength = 5,
  exceptNumMax = 3,
  elifNumMax = 2,
  caseNumMin = 2,
  caseNumMax = 4,
  useIf = true,
  useWhile = true,
  useDoWhile = true,
  useBreak = true,
  useContinue = true,
  useSwitchCase = true,
  useTryExcept = true,
}: {
  lineNum?: number,
  randStrLength?: number,
  exceptNumMax?: number,
  elifNumMax?: number,
  caseNumMin?: number,
  caseNumMax?: number,
  useIf?: boolean,
  useWhile?: boolean,
  useDoWhile?: boolean,
  useBreak?: boolean,
  useContinue?: boolean,
  useSwitchCase?: boolean,
  useTryExcept?: boolean,
}): string[] => {

  lineNum = Math.max(0, lineNum);
  randStrLength = Math.max(1, randStrLength);
  exceptNumMax = Math.max(0, exceptNumMax);
  elifNumMax = Math.max(0, elifNumMax);
  caseNumMin = Math.max(0, caseNumMin);
  caseNumMax = Math.max(caseNumMin, caseNumMax);

  const _randStr = () => randStr(randStrLength);

  const _createRandomSrc = ({
    lineNum,
    isLooping = false,
  }: {
    lineNum: number,
    isLooping?: boolean,
  }): string[] => {
    if (lineNum <= 0) {
      return [];
    }
    const items: string[] = ['simple'];
    if (lineNum >= 2) {
      if (useIf) {
        items.push('if');
      }
      if (useWhile) {
        items.push('while');
      }
      if (isLooping) {
        if (useContinue) {
          items.push('continue');
        }
        if (useBreak) {
          items.push('break');
        }
      }
    }
    if (lineNum >= 3) {
      if (useDoWhile) {
        items.push('do-while');
      }
    }
    if (lineNum >= 4) {
      if (useTryExcept) {
        items.push('try-except');
      }
    }
    if (lineNum >= caseNumMin * 2 + 1) {
      if (useSwitchCase) {
        items.push('switch-case');
      }
    }

    const item = items[randRange(0, items.length)];
    // console.log(lineNum);
    // console.log(item);
    switch (item) {
      case 'simple': {
        return [
          _randStr(),
          ..._createRandomSrc({
            lineNum: lineNum - 1,
            isLooping
          }),
        ]
      }
      case 'continue': {
        return [
          ..._createRandomSrc({
            lineNum: lineNum - 1,
            isLooping: false
          }),
          'continue',
        ]
      }
      case 'break': {
        return [
          ..._createRandomSrc({
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
          `if ${_randStr()}`,
          ...addIndent(_createRandomSrc({
            lineNum: blockLineNumArray[0],
            isLooping,
          })),
        ];
        if (elifNum > 0) {
          blockLineNumArray.slice(1, 1 + elifNum).forEach(blockLineNum => {
            ret.push(
              `elif ${_randStr()}`,
              ...addIndent(_createRandomSrc({
                lineNum: blockLineNum,
                isLooping,
              })),
            )
          });
        }
        if (useElse) {
          ret.push(
            'else',
            ...addIndent(_createRandomSrc({
              lineNum: blockLineNumArray.slice(-1)[0],
              isLooping,
            })),
          );
        }

        return ret;
      }
      case 'while': {
        return [
          `while ${_randStr()}`,
          ...addIndent(_createRandomSrc({
            lineNum: lineNum - 1,
            isLooping: true,
          })),
        ]
      }
      case 'do-while': {
        return [
          'do',
          ...addIndent(_createRandomSrc({
            lineNum: lineNum - 2,
            isLooping: true,
          })),
          `while ${_randStr()}`,
        ]
      }
      case 'switch-case': {
        const caseNum = randRange(
          caseNumMin, 
          Math.min(caseNumMax, Math.floor((lineNum - 1) / 2)) + 1,
        );
        const caseLineNumArray = randDist(lineNum - (1 + caseNum), caseNum);

        const ret = [
          `switch ${_randStr()}`,
        ];
        caseLineNumArray.forEach(caseLineNum => {
          ret.push(
            `  case ${_randStr()}`,
            ...addIndent(addIndent(_createRandomSrc({
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
          ...addIndent(_createRandomSrc({
            lineNum: blockLineNumArray[0],
            isLooping,
          })),
        ];
        blockLineNumArray.slice(1).forEach(blockLineNum => {
          ret.push(
            `except ${_randStr()}`,
            ...addIndent(_createRandomSrc({
              lineNum: blockLineNum,
              isLooping,
            })),
          )
        });
        return ret;
      }
      default: {
        throw `invalid item ${item}`;
      }
    }
  }
  return _createRandomSrc({lineNum});
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
