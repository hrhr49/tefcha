# Tefcha

**NOTE:** **THIS IS UNDER DEVELOPMENT. ANYTHING CAN BE CHANGED.**

Text to Flowchart.

![./img/sample.gif](./img/sample.gif)

## Demo

[https://hrhr49.github.io/tefcha/demo](https://hrhr49.github.io/tefcha/demo)

## Feature
* Convert pseudo code to flowchart image.

## Installation

### CDN

```html
<script src="https://unpkg.com/tefcha/umd/tefcha.js"></script>
```

### npm

```
npm install tefcha
```

### CLI Tool

You can use command line interface also.
https://github.com/hrhr49/tefcha-cli

```
npm install tefcha-cli
```

## Supported

Only these features are supported for now

* if, elif, else statements
* while, do-while statements
* break, continue statement.

## Not Supported (for now)

* for statement
* swich-case statement
* return statement

## Reserved Word
* if, elif, else, while, do, for, continue, break, switch, case, pass, try, except

## Usage

1. Add `<div class="tefca">` tag in HTML file.
2. Write psedo code in `<div class="tefca">` tag.
3. Load `umd/tefcha.js` by script tag.
4. Call `tefcha.initialize()`, then, svg element will be generated.

### Simple Example.

```html
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
</head>

<body>
  <div class="tefcha">
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
  elif i % 5 == 0
    print("Buzz")
  else
    print(i)
End
  </div>
  <script src="https://unpkg.com/tefcha/umd/tefcha.js"></script>
  <script>
    tefcha.initialize();
  </script>
</body>

</html>
```

## Configuration

You can pass a custom configuration to `tefcha.initialize()`.

See

* [./src/config.ts](src/config.ts)
* [./demo/index.html](./demo/index.html)

## Syntax

### Statement

If text is not started with reserved word, it means simple statement.
It is rendered as a box with the text.

```
hello
```
![simple.png](img/simple.png)

### Newline

You can use `\n` for newline.

```
hello\nworld
```

![newline.png](img/newline.png)

### If Statement

* text starts with `if` means if statement.
* indented line means block.

```
if score > 80
  good!

end
```

![if.png](img/if.png)

### If-elif Statement

You can use `elif` and `else` also.

```
if score > 80
  good!
elif score > 30
  soso
else
  bad!

end
```

![if-elif-else.png](img/if-elif-else.png)

### While Statement

* text starts with `while` means while statement.

```
while score < 30
  study again

end
```
![while.png](img/while.png)

### Do While Statement

* text starts with `do` means do-while statement.
* after `do` block, line starts with `while` is needed.

```
do
  get input from user
while input is invalid

end
```
![do-while.png](img/do-while.png)


### Break

You can break loop by `break` keyword.

```
i = 0

while i < n
  if fruits[i] == 'apple'
    break
  i = i + 1
end
```
![break.png](img/break.png)

### Continue

You can use `continue` keyword also.

```
i = 0

while i < n
  if user[i] is null
    continue
  register user[i]
  i = i + 1

end
```
![continue.png](img/continue.png)


## Author

hrhr49

hiro49410@gmail.com

## License
MIT
