import * as fs from 'fs'

const packageObj = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`).toString());
const {
  dependencies,
} = packageObj;

test('check dependencies is empty', () => {
  expect(dependencies).toEqual({});
});
