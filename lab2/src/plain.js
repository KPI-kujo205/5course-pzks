import { product, sum } from './form.js';

/** Зведення без оптимізацій: структура виразу лишається, змінюється лише запис. */
export const plainBuilders = { buildSum, buildProduct };

function buildSum(terms) {
  return terms.length === 1 ? terms[0] : { sign: 1, node: sum(terms) };
}

function buildProduct({ sign, factors }) {
  const [only] = factors;
  return factors.length === 1 && !only.inverse ? { sign, node: only.node } : { sign, node: product(factors) };
}
