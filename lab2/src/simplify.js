import { constant, factorKey, product, sum } from './form.js';

/** Зведення з оптимізацією: згортання констант, `0` і `1`, зведення подібних доданків. */
export const simplifyingBuilders = { buildSum, buildProduct };

const SIGNIFICANT_DIGITS = 12;

function buildSum(terms) {
  const groups = new Map();
  let constantTotal = 0;
  for (const { sign, node } of terms) {
    if (node.kind === 'const') constantTotal += sign * node.value;
    else addToGroup({ groups, sign, node });
  }
  const collected = [...groups.values()].flatMap(termOfGroup);
  const withConstant = roundNumber(constantTotal) === 0 ? collected : [...collected, constantTerm(constantTotal)];
  if (withConstant.length === 0) return { sign: 1, node: constant(0) };
  return withConstant.length === 1 ? withConstant[0] : { sign: 1, node: sum(withConstant) };
}

function addToGroup({ groups, sign, node }) {
  const { coefficient, rest } = splitCoefficient(node);
  const key = rest.map(factorKey).sort().join('*');
  const group = groups.get(key) ?? { coefficient: 0, rest };
  group.coefficient += sign * coefficient;
  groups.set(key, group);
}

function splitCoefficient(node) {
  const factors = node.kind === 'prod' ? node.factors : [{ inverse: false, node }];
  return foldConstants(factors);
}

function termOfGroup({ coefficient, rest }) {
  const rounded = roundNumber(coefficient);
  if (rounded === 0) return [];
  return [{ sign: Math.sign(rounded), node: productNode({ magnitude: Math.abs(rounded), rest }) }];
}

function constantTerm(total) {
  const rounded = roundNumber(total);
  return { sign: Math.sign(rounded), node: constant(Math.abs(rounded)) };
}

function buildProduct({ sign, factors }) {
  const { coefficient, rest } = foldConstants(factors);
  const magnitude = Math.abs(coefficient);
  const resultSign = coefficient < 0 ? -sign : sign;
  if (magnitude === 0) return { sign: 1, node: constant(0) };
  if (rest.length === 0) return { sign: resultSign, node: constant(magnitude) };
  return { sign: resultSign, node: productNode({ magnitude, rest }) };
}

function foldConstants(factors) {
  let coefficient = 1;
  const rest = [];
  for (const factor of factors) {
    if (isFoldable(factor)) coefficient = factor.inverse ? coefficient / factor.node.value : coefficient * factor.node.value;
    else rest.push(factor);
  }
  return { coefficient: roundNumber(coefficient), rest };
}

function isFoldable({ inverse, node }) {
  return node.kind === 'const' && !(inverse && node.value === 0);
}

function productNode({ magnitude, rest }) {
  const factors = [...constantFactors(magnitude), ...rest];
  const [only] = factors;
  return factors.length === 1 && !only.inverse ? only.node : product(factors);
}

function constantFactors(magnitude) {
  if (magnitude === 1) return [];
  const reciprocal = roundNumber(1 / magnitude);
  if (Number.isInteger(reciprocal)) return [{ inverse: true, node: constant(reciprocal) }];
  return [{ inverse: false, node: constant(magnitude) }];
}

function roundNumber(value) {
  return Number(value.toPrecision(SIGNIFICANT_DIGITS));
}
