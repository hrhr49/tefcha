const tryExceptProgs = [
String.raw`
while a
  try
    a
    if b
      break
    try e
      f
    except g
      G
  except errorB
    b
    if c
      continue
  except errorC
    c1
    if d
      continue
    else
      try
      except
        e
      try
        gg
      except
    c2
end
`,

];

export {tryExceptProgs}
