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
`,
`
while a
  try
    break
  except
    continue
`,
`
while a
  try
    a
    break
  except
    try
    except
`,
`
while GTIa
  try
    while XvnJ
      T
      lFcG
      while i
        try
          while rYq
            PF
        except Fd
          while Sa
            try
              JVxG
            except qrqVM
              if UV
                avaaj
        except Ndi
          BJSDe
        except yXw
          try
            gLbmi
          except rZKRL
            sBP
        break
      break
    continue
  except n
    eu
    while v
      try
        lCPTz
        continue
      except nA
        while e
          if qZuo
            bHK
        break
      except azJ
        if y
          q
        else
          THQ
          m
      except uaxhm
        OmG
        RV
        r
        break
    break
  except l
    while KtrW
      try
        while NrvS
          while TCf
            INH
            continue
      except VO
        k
        while UZ
          u
          while GuETi
            m
        break
      except kkL
        if oM
          pCbcb
        else
          RGjWV
      except t
        if BmH
          iSQ
          eANOs
        break
    continue
  except ux
    CK
    xn
    while MwLh
      try
        if W
          while vElip
            zL
        continue
      except ZjJj
        while H
          u
          break
      except s
        if KUFqX
          tQ
        continue
      except XTfcl
        if XKoh
          P
          break
        elif LDN
          lLlb
        else
          pUNO
    continue
end
`,
`
while a
  if b
    c
  else
    a
    if d
      continue
    else
      break
`,
];

export {tryExceptProgs}
