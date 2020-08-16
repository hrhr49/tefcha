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
* if, elif, else, while, do, for, continue, break, switch, case, pass

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
#   All indent must be "  " (2 whitespaces).

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

## Author

hrhr49

hiro49410@gmail.com

## License
MIT
