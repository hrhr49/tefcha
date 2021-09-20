import {parse} from '../src/parser'
import {defaultConfig} from '../src/config'

import {simpleProgs} from '../debug/simple'
import {ifProgs} from '../debug/if'
import {loopProgs} from '../debug/loop'
import {jumpProgs} from '../debug/jump'


test('parse valid indent', () => {
  let prog: string;

  prog = `
  if a
    a`;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  if a
      a`;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  if a
      a
    # this is comment
  # this is comment2
    # this is comment3
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  if a
      a\\
    # this is not comment
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  // 2 spaces indent and 4 spaces indent
  prog = `
  if a
      if b
        c
      d
  e`;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  // 2 spaces indent and 4 spaces indent
  prog = `
  if a
      if b
        c
  e`;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  // tab indent and 2 spaces indent
  prog = `
  if a
  \tif b
  \t  c
  \td
  e`;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  // tab indent and 2 spaces indent
  prog = `
  if a
  \tif b
  \t  c
  e`;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  a\\
    a
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();
  prog = `
  a\\
    a
  a
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();
  prog = `
  a\\
    \\
  \\
    a\\
  a
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();
});

test('parse invalid indent', () => {
  let prog: string;

  prog = `
    a
  a
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('unexpected indent');

  // not compatible indents
  prog = `
  if a
  \t  b
    \tc
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('unexpected indent');

  prog = `
  if a
      b
  # this is comment\\
    this line should not be concatenated
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('unexpected indent');
});

test('parse valid program', () => {
  [
    ...simpleProgs,
    ...ifProgs,
    ...loopProgs,
    ...jumpProgs,
  ].forEach(prog => {
    expect(() => {parse(prog, defaultConfig)}).not.toThrowError();
  });

  let prog: string;

  prog = `
  switch a
    case b
      c
    case d
      e
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  while c
    switch a
      case b
        continue
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  try
    a
  except
    b
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  try
    a
  except someError
    b
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  try
    a
  except someErrorB
    b
  except someErrorC
    c
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

});



test('check to throw error while parsing invalid program', () => {
  let prog: string;

  prog =`
  a
    a`;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('unexpected indent');

  prog = `
  if a
      a
    a`;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('unexpected indent');

  prog = 'a\\';
  expect(() => {parse(prog, defaultConfig)}).toThrowError('EOF');

  prog = `
  a\\
  if b
    c
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('unexpected indent');

  prog = 'elif';
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = 'else';
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  if a
    b
  else
    c
  elif d
    e
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  if a
    b
  else
    c
  else
    e
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = 'do';
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  do
    a
  while b
    c
  `;

  expect(() => {parse(prog, defaultConfig)}).toThrowError('unexpected indent');

  prog = 'break';
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  if a
    break`;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  if a
    continue`;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = 'case a';
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  switch a
  case b
    c
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  switch a
    b
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  switch a
    case b
      continue
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  switch a
    case b
      break
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError();

  prog = `
  try
    a
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('cannot find corresponding keyword "except" to keyword "try".');

  prog = `
  try
    a
  try
    b
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('cannot find corresponding keyword "except" to keyword "try".');

  prog = `
  except
    a
  `;
  expect(() => {parse(prog, defaultConfig)}).toThrowError('before "except" block, "try" or "except" block should exists.');
});
