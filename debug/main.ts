import {render} from '../renderer/svg'
import {simpleProgs} from './simple'
import {ifProgs} from './if'
import {loopProgs} from './loop'
import {jumpProgs} from './jump'

const progs = [
  ...simpleProgs,
  ...ifProgs,
  ...loopProgs,
  ...jumpProgs,
];

const showSVG = (svg: Element) => {
  const div = document.createElement('div');
  div.append(svg);
  document.body.append(div);
};

const showCode = (text: string) => {
  const code = document.createElement('code');
  const pre = document.createElement('pre');
  pre.textContent = text;
  code.append(pre);
  document.body.append(code);
};

progs.forEach(prog => {
  try {
    showCode(prog);
    const svg = render({src: prog, document});
    showSVG(svg);
  } catch(e) {
    const msg = `error!\n${e.stack}`;
    showCode(msg);
  }
});
