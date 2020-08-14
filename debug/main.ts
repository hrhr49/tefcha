import {render} from '../renderer/svg'


const progs = [
String.raw`
a
`,

String.raw`
a
bc
`,

String.raw`
while a
  b
`,

String.raw`
while a
  b
  break
`,

String.raw`
do
  b
while c
`,

String.raw`
do
  b
  break
while c
`,

String.raw`
do
  b
  continue
  s
while c
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
  pass
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
while aaaaaa
  if a
    break
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
  pass
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
  a
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

String.raw`
while a
  if a
    pass
  else
    break
  if b
    if e
      break
  else
    continue
  if b
    pass
  else
    break
`,

String.raw`
do
  if a
    break
  elif b
    break
  elif c
    break
  else
    break
while bb
`,

String.raw`
do
  if a
    break
  elif d
    d
while d
`,

String.raw`
do
  if a
    break
  elif d
    d
while d
`,

String.raw`
i = 1
while i <= 100
  if i % 15 == 0
    print("FizzBuzz")
    break
  elif i % 3 == 0
    print("Fizz")
    break
  elif i % 5 == 0
    print("Buzz")
    break
  else
    print(i)
`,

String.raw`
while i <= 100
  if i % 15 == 0
    a
  else
    if a
      continue
`,

String.raw`
while a
  if a
    if c
      break
    if d
      continue
    while i <= 100
      if i % 15 == 0
        a
      else
        if a
          break
    if a
      break
  elif b
    if c
      break
    if d
      continue
    while i <= 100
      if i % 15 == 0
        a
      else
        if a
          continue
    if b
      continue
  else
    if c
      break
    if d
      continue
    while i <= 100
      if i % 15 == 0
        a
      else
        if a
          break
        else
          continue
    if c
      break
    else
      continue
End
`,

String.raw`
# This is a example.
# NOTE:
#   The line starts with "#" is comment.
#   "\n" is newline.
#   All indent must be "  " (2 whitespaces).

Start\nFizzBuzz!
i = 1

while i <= 100
  if i % 15 == 0
    print("FizzBuzz")
  elif i % 3 == 0
    print("Fizz")
    if aafeafe
      continue
    elif baaaffaweeaaa
      break
  elif i % 5 == 0
    print("Buzz")
  else
    print(ia)
    break
End
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
    const svg = render({src: prog, document});
    showSVG(svg);
  } catch(e) {
    const msg = `error!\n${e.stack}`;
    showCode(msg);
  }
});
