import test from 'node:test';
import assert from 'node:assert/strict';
import { parallelize } from '../src/parallelize.js';
import { evaluate } from '../src/tree.js';

test('М1: 8 доданків дають 3 яруси шириною 4', () => {
  const plan = run('a+b+c+d+e+f+g+h');
  assert.deepEqual([plan.height, plan.width, plan.operations], [3, 4, 7]);
});

test('М2: віднімання розпаралелюється так само', () => {
  const plan = run('a-b-c-d-e-f-g-h');
  assert.deepEqual([plan.height, plan.width, plan.operations], [3, 4, 7]);
});

test('М3: ділення розпаралелюється так само', () => {
  const plan = run('a/b/c/d/e/f/g/h');
  assert.deepEqual([plan.height, plan.width, plan.operations], [3, 4, 7]);
});

test('М4: пріоритети дають коректне значення', () => {
  const variables = { a: 2, b: 3, c: 4, d: 5, e: 2, f: 5, g: 2, h: 1, i: 6, j: 7 };
  const { a, b, c, d, e, f, g, h, i, j } = variables;
  const expected = a * (b - 4) - 2 * b * c - c * d - (a * c * d) / e / f / g - g - h - i - j;
  const plan = run('a*(b-4) - 2*b*c - c*d - a*c*d/e/f/g - g-h-i-j');
  assert.ok(Math.abs(evaluate({ tree: plan.tree, variables }) - expected) < 1e-9);
});

test('P1: дужки з плюсом розкриваються, дерево як у М1', () => {
  assert.deepEqual(shape(run('a+(b+c+d+(e+f)+g)+h')), shape(run('a+b+c+d+e+f+g+h')));
});

test('P2: дужки з мінусом розкриваються, 8 доданків — 3 яруси', () => {
  const plan = run('a-((b-c-d)-(e-f)-g)-h');
  assert.equal(plan.height, 3);
  const variables = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
  assert.equal(evaluate({ tree: plan.tree, variables }), 1 - (2 - 3 - 4 - (5 - 6) - 7) - 8);
});

test('E1–E3: значення збігаються з очікуваними', () => {
  assert.equal(evaluate({ tree: run('5040/8/7/6/5/4/3/2').tree }), 0.125);
  assert.equal(evaluate({ tree: run('10-9-8-7-6-5-4-3-2-1').tree }), -35);
  assert.equal(evaluate({ tree: run('64-(32-16)-8-(4-2-1)').tree }), 39);
});

test('приклад вчителя: a+b*c + k - x - d - e - f/g/h/q', () => {
  const plan = run('a+b*c + k - x - d - e - f/g/h/q');
  const variables = { a: 1, b: 2, c: 3, k: 4, x: 5, d: 6, e: 7, f: 8, g: 2, h: 2, q: 2 };
  assert.equal(evaluate({ tree: plan.tree, variables }), 1 + 6 + 4 - 5 - 6 - 7 - 1);
  assert.equal(plan.height, 4);
});

test('S1: спрощення дає i + e/2 - 0.4', () => {
  const plan = run('-(-i)/1.0 + 0 - 0*k*h + 2 - 4.8/2 + 1*e/2', { simplify: true });
  assert.equal(plan.operations, 3);
  assert.ok(Math.abs(evaluate({ tree: plan.tree, variables: { i: 3, e: 4 } }) - 4.6) < 1e-9);
});

test('S2: усі три доданки — ділення на нуль', () => {
  const result = parallelize({ source: 'a*2/0 + b/(b+b*0-1*b) - 1/(c*2*4.76*(1-2+1))', simplify: false });
  assert.equal(result.status, 'division-by-zero');
  assert.deepEqual(result.divisions.map((d) => d.termNumber), [1, 2, 3]);
  assert.equal(result.divisions[1].divisor, 'b+b*0-1*b');
});

test('синтаксичні помилки Лаб 1 зупиняють побудову дерева', () => {
  const result = parallelize({ source: 'a ++ b', simplify: false });
  assert.equal(result.status, 'syntax-errors');
  assert.ok(result.errors.length > 0);
});

test('виклик функції та індекс лишаються операціями', () => {
  const plan = run('f(a+b, c) + A[i+1]');
  assert.equal(plan.status, 'ok');
  assert.ok(plan.operations >= 5);
});

function run(source, { simplify = false } = {}) {
  const result = parallelize({ source, simplify });
  assert.equal(result.status, 'ok', source);
  return result;
}

function shape({ height, width, operations }) {
  return { height, width, operations };
}
