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

`
while a
  try
    a
    a
    a
    break
  except
    b
`,

`
while a
  try
    a
    break
  except
    b
    b
    b
`,
`
while a
  try
    a
    a
    a
    continue
  except b
    b
`,
`
while a
  try
    a
    continue
  except b
    b
    b
    b
`,
`
while a
  try
    a
    break
  except b
    b
    continue
`,
`
while a
  try
    a
  except b
    b
    break
`,
`
while a
  try
    b
    while c
      d
  except d
    try
      break
    except
      a
      continue
  a
end
`,
`
while a
  try
    break
  except d
    a
`,
`
while a
  try
    break
  except d
    a
  except e
    continue
`
];

export {tryExceptProgs}
