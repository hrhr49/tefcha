import {parse} from '../src/parser'
import {defaultConfig} from '../src/config'

import {simpleProgs} from '../debug/simple'
import {ifProgs} from '../debug/if'
import {loopProgs} from '../debug/loop'
import {jumpProgs} from '../debug/jump'


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
  a\\
    a
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  switch a
    case b
      c
    case d
      e
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  switch a
    case b
      c
      break
    case d
      e
      break
  `;
  expect(() => {parse(prog, defaultConfig)}).not.toThrowError();

  prog = `
  while c
    switch a
      case b
        continue
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

});
