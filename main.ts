import './style.css'
import {render} from './renderer/svg'


const prog = String.raw`
else
  al
`;

try {
  const svg = render(prog);
  console.log(svg);
  document.body.append(svg);
} catch(e) {
  const code = document.createElement('code');
  const pre = document.createElement('pre');
  pre.textContent = 'error!\n' + e.toString();
  code.append(pre);
  document.body.append(code);
}
