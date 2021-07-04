const tryExceptProgs = [
String.raw`
try
  a
  try e
    f
  except g
    G
except errorB
  b
except errorC
  c1
  c2
`,

];

export {tryExceptProgs}
