import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/fsm.js';
import { UNIT, EXAMPLE, GENERAL } from '../src/samples.js';

test('коректні вирази не дають помилок', () => {
  for (const expr of [
    'a + b * (c - 2)',
    '-x + y',
    'sin(x) ^ 2 + cos(0.5)',
    'f(a, b, g(c))',
    'g() + h(1) * f()',
    '0xAB + 0b010 + 010b + 1Fh + .3',
    'A[7][2-x] * (1)',
  ]) {
    assert.deepEqual(summary(expr), [], expr);
  }
});

test('1: початок та завершення', () => {
  assert.deepEqual(summary('*a + nb -'), ['0:BAD_START', '9:BAD_END']);
});

test('2: кожен зайвий оператор — окрема помилка', () => {
  assert.deepEqual(summary('a ++ nb /* k -+/ g'), [
    '3:UNEXPECTED', '9:UNEXPECTED', '14:UNEXPECTED', '15:UNEXPECTED',
  ]);
});

test('3: невідомі символи', () => {
  assert.deepEqual(summary('a^b$c - d#h + q%t + !b&(z|t)'), [
    '3:UNKNOWN', '9:UNKNOWN', '15:UNKNOWN', '20:UNKNOWN', '22:UNKNOWN', '25:UNKNOWN',
  ]);
});

test('4: змінні та невідомі токени', () => {
  assert.deepEqual(summary('x + var1 + var_2 + _var_3 + var#4 + var!5 + 6var_ + $7 + ?8'), [
    '31:UNKNOWN', '39:UNKNOWN', '44:BAD_IDENT', '52:UNKNOWN', '57:UNKNOWN',
  ]);
});

test('5: недесяткові константи', () => {
  assert.deepEqual(summary('125 + 2nb - 0xAB * 0x0R + 0b010 * 0b20 + ABh * 0Rh + 010b*20b'), [
    '6:BAD_IDENT', '19:BAD_NUMBER', '34:BAD_NUMBER', '47:BAD_NUMBER', '58:BAD_NUMBER',
  ]);
});

test('6: дробові константи', () => {
  assert.deepEqual(summary('0.71/0.72.3 + .3 + 127.0.0.1*8. + 6.07ab - 9f.89hgt'), [
    '9:BAD_NUMBER', '24:BAD_NUMBER', '30:BAD_NUMBER', '34:BAD_NUMBER', '43:BAD_NUMBER',
  ]);
});

test('7: дужки', () => {
  assert.deepEqual(summary(')a+b( -(g+h)(g-k))*()) + (-b(t-2*x*(5) + A[7][2-x]'), [
    '0:BAD_START', '12:MISSING_OP', '19:EMPTY_PARENS', '21:UNMATCHED_CLOSE', '25:UNCLOSED', '28:UNCLOSED',
  ]);
});

test('8: функції та порожні аргументи', () => {
  assert.deepEqual(summary('2(t) - f2(t) + g()/h(2, )*func(-t/q, f(4-t), -(x+2)*(y-2))'), [
    '0:BAD_FUNCTION', '7:BAD_FUNCTION', '24:EMPTY_ARG',
  ]);
});

test('різні типи дужок і кома поза функцією', () => {
  assert.deepEqual(summary('(a]'), ['2:MISMATCH']);
  assert.deepEqual(summary('(a, b)'), ['2:COMMA_OUTSIDE']);
  assert.deepEqual(summary('(*a)'), ['1:UNEXPECTED']);
});

test('еталонний приклад з методички: 11 помилок на заданих позиціях', () => {
  assert.deepEqual(summary(EXAMPLE), [
    '4:UNEXPECTED', '10:BAD_IDENT', '18:UNCLOSED', '24:UNEXPECTED', '32:UNEXPECTED',
    '37:BAD_NUMBER', '42:EMPTY_ARG', '44:BAD_FUNCTION', '47:UNEXPECTED', '49:UNEXPECTED', '50:BAD_END',
  ]);
});

test('порожні дужки: дозволені лише у виклику функції', () => {
  assert.deepEqual(summary('f()'), []);
  assert.deepEqual(summary('a + ()'), ['4:EMPTY_PARENS']);
});

test('загальні тести: аналізатор не падає і знаходить помилки', () => {
  for (const expr of [...UNIT, ...GENERAL]) assert.ok(analyze(expr).errors.length > 0, expr);
});

function summary(expr) {
  return analyze(expr).errors.map((e) => `${e.pos}:${e.code}`);
}
