const loopProgs = [
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
];

export {loopProgs}
