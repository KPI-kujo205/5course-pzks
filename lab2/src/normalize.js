import { constant, fromSigned, operation, variable } from './form.js';

/**
 * @typedef {Object} Builders
 * @property {(terms: import('./form.js').Term[]) => import('./form.js').Term} buildSum
 * @property {(product: {sign: 1 | -1, factors: import('./form.js').Factor[]}) => import('./form.js').Term} buildProduct
 */

/**
 * Розкриває дужки, замінює `-` і `/` на знаки й обернені множники. Зведення доданків і множників
 * виконують `builders`: прості або з оптимізацією.
 * @param {import('./parse.js').Ast} ast
 * @param {Builders} builders
 * @returns {import('./form.js').Form}
 */
export function normalize(ast, builders) {
  return toNode(ast);

  function toNode(ast) {
    return fromSigned(toSigned(ast));
  }

  function toSigned(ast) {
    switch (ast.kind) {
      case 'num':
        return { sign: 1, node: constant(ast.value) };
      case 'var':
        return { sign: 1, node: variable(ast.name) };
      case 'neg':
        return negated(toSigned(ast.arg));
      case 'call':
        return { sign: 1, node: operation({ name: ast.name, args: ast.args.map(toNode) }) };
      default:
        return toSignedBinary(ast);
    }
  }

  function toSignedBinary(ast) {
    if (ast.op === '+' || ast.op === '-') return builders.buildSum(collectTerms({ ast, sign: 1 }));
    if (ast.op === '^') return { sign: 1, node: operation({ name: '^', args: [toNode(ast.left), toNode(ast.right)] }) };
    return builders.buildProduct(collectFactors({ ast, inverse: false }));
  }

  function negated({ sign, node }) {
    return { sign: -sign, node };
  }

  function collectTerms({ ast, sign }) {
    if (ast.kind !== 'bin' || (ast.op !== '+' && ast.op !== '-')) return expandTerm(applySign(toSigned(ast), sign));
    const rightSign = ast.op === '-' ? -sign : sign;
    return [...collectTerms({ ast: ast.left, sign }), ...collectTerms({ ast: ast.right, sign: rightSign })];
  }

  function applySign({ sign, node }, extraSign) {
    return { sign: sign * extraSign, node };
  }

  function expandTerm({ sign, node }) {
    if (node.kind !== 'sum') return [{ sign, node }];
    return node.terms.map((term) => ({ sign: sign * term.sign, node: term.node }));
  }

  function collectFactors({ ast, inverse }) {
    if (ast.kind !== 'bin' || (ast.op !== '*' && ast.op !== '/')) return singleFactor({ ast, inverse });
    const left = collectFactors({ ast: ast.left, inverse });
    const right = collectFactors({ ast: ast.right, inverse: ast.op === '/' ? !inverse : inverse });
    return { sign: left.sign * right.sign, factors: [...left.factors, ...right.factors] };
  }

  function singleFactor({ ast, inverse }) {
    const { sign, node } = toSigned(ast);
    return { sign, factors: expandFactor({ node, inverse }) };
  }

  function expandFactor({ node, inverse }) {
    if (node.kind !== 'prod') return [{ inverse, node }];
    return node.factors.map((factor) => ({ inverse: factor.inverse !== inverse, node: factor.node }));
  }
}
