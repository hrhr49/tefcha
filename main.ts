import './style.css'
import {render} from './renderer/svg'


const prog = String.raw`
start Fizz Buzz
i = 1
while i <= 100
  if i % 15 == 0
    FizzBuzz
  elif i % 3 == 0
    Fizz
  elif i % 5 == 0
    Buzz
  else
    i
  i = i + 1
end
`;

try {
  const svg = render(prog);
  console.log(svg);
  document.body.append(svg);
} catch(e) {
  const code = document.createElement('code');
  const pre = document.createElement('pre');
  pre.textContent = 'error!\n'
  pre.textContent += e.stack;
  // pre.textContent += e.toString();
  code.append(pre);
  document.body.append(code);
}
