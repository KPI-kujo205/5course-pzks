import { normalize } from './normalize.js';
import { simplifyingBuilders } from './simplify.js';
import { unparse } from './unparse.js';

/**
 * @typedef {Object} ZeroDivision
 * @property {number} termNumber номер доданка верхнього рівня (з 1)
 * @property {string} term
 * @property {string} divisor
 */

/**
 * Шукає ділення на нуль у кожному доданку верхнього рівня. Дільник перевіряється після спрощення,
 * тому `b+b*0-1*b` теж є нулем.
 * @param {import('./parse.js').Ast} ast
 * @returns {ZeroDivision[]}
 */
export function findZeroDivisions(ast) {
  return topLevelTerms(ast).flatMap((term, index) =>
    zeroDivisorsIn(term).map((divisor) => ({ termNumber: index + 1, term: unparse(term), divisor: unparse(divisor) })),
  );
}

function topLevelTerms(ast) {
  if (ast.kind !== 'bin' || (ast.op !== '+' && ast.op !== '-')) return [ast];
  return [...topLevelTerms(ast.left), ...topLevelTerms(ast.right)];
}

function zeroDivisorsIn(ast) {
  switch (ast.kind) {
    case 'neg':
      return zeroDivisorsIn(ast.arg);
    case 'call':
      return ast.args.flatMap(zeroDivisorsIn);
    case 'bin':
      return [...zeroDivisorOf(ast), ...zeroDivisorsIn(ast.left), ...zeroDivisorsIn(ast.right)];
    default:
      return [];
  }
}

function zeroDivisorOf({ op, right }) {
  return op === '/' && isZero(right) ? [right] : [];
}

function isZero(ast) {
  const form = normalize(ast, simplifyingBuilders);
  return form.kind === 'const' && form.value === 0;
}
