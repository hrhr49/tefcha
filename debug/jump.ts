const jumpProgs = [
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
do
  if a
    if c
      break
    if d
      continue
    do
      if i % 15 == 0
        a
      else
        if a
          break
    while i <= 100
    if a
      break
  elif b
    if c
      break
    if d
      continue
    do
      if i % 15 == 0
        a
      else
        if a
          continue
    while i <= 100
    if b
      continue
  else
    if c
      break
    if d
      continue
    do
      if i % 15 == 0
        a
      else
        if a
          break
        else
          continue
    while i <= 100
    if c
      break
    else
      continue
while a
End
`,
String.raw`
do
  if a
    if c
      break
    if d
      continue
    do
      if i % 15 == 0
        a
      else
        if a
          break
    while i <= 100
    if a
      break
  elif b
    if c
      break
    pass
    pass
    pass
    pass
    if d
      continue
    do
      if i % 15 == 0
        a
      else
        if a
          continue
    while i <= 100
    if b
      continue
  else
    if c
      break
    if d
      continue
    do
      if i % 15 == 0
        a
      else
        if a
          break
        else
          continue
    while i <= 100
    if c
      break
    else
      continue
while a
End
`,

String.raw`
# This is a example.
# NOTE:
#   The line starts with "#" is comment.
#   "\n" is newline.
#   All indent must be "  " (2 white spaces).

Start\nFizzBuzz!
i = 1

while i <= 100
  if i % 15 == 0
    print("FizzBuzz")
  elif i % 3 == 0
    print("Fizz")
    if a1
      continue
    elif a2
      break
  elif i % 5 == 0
    print("Buzz")
  else
    print(ia)
    break
End
`,
];

export {jumpProgs}
