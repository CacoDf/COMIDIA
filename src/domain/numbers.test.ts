import { parseDecimal } from './numbers';

test.each([
  ['72,5', 72.5],
  ['72.5', 72.5],
  [' 80 ', 80],
  ['0,25', 0.25],
  ['1.250,5', null],
  ['', null],
  ['abc', null],
  ['-3', null],
  ['3,', null],
])('parseDecimal(%s)', (input, expected) => {
  expect(parseDecimal(input)).toBe(expected);
});
