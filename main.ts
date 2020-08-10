import './style.css'
import {render} from './renderer/svg'


const progs = [
String.raw`
a
`,

String.raw`
if a
`,

String.raw`
if a
  b
`,

String.raw`
if a
  b
else
  c
`,

String.raw`
if a
  b
elif d
  c
`,

String.raw`
if a
  b
elif d
  c
else
  d
`,

String.raw`
while a
`,

String.raw`
while a
  b
`,

String.raw`
while a
  break
`,

String.raw`
while a
  continue
`,

String.raw`
while a
  if b
    break
`,
String.raw`
while a
  if b
    continue
`,

String.raw`
do
while c
`,

String.raw`
do
  d
while c
`,

String.raw`
do
  break
while bb
`,

String.raw`
do
  continue
while bb
`,

String.raw`
do
  if a
    continue
while bb
`,

String.raw`
do
  if a
    break
while bb
`,

String.raw`
do
  if a
    break
  elif baa
    continue
  elif caaaaa
    break
  else
    continue
while bb
`,
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
    const svg = render(prog);
    showSVG(svg);
  } catch(e) {
    const msg = `error!\n${e.stack}`;
    showCode(msg);
  }
});
