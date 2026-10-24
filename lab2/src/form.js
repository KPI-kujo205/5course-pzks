/**
 * Нормальна форма виразу: дужки розкриті, віднімання і ділення замінені знаками й ознакою оберненості.
 * @typedef {{kind: 'const', value: number}
 *   | {kind: 'var', name: string}
 *   | {kind: 'op', name: string, args: Form[]}
 *   | {kind: 'sum', terms: Term[]}
 *   | {kind: 'prod', factors: Factor[]}} Form
 * @typedef {{sign: 1 | -1, node: Form}} Term доданок зі знаком
 * @typedef {{inverse: boolean, node: Form}} Factor множник, можливо обернений (стоїть у знаменнику)
 */

export function constant(value) {
  return { kind: 'const', value };
}

export function variable(name) {
  return { kind: 'var', name };
}

export function operation({ name, args }) {
  return { kind: 'op', name, args };
}

export function sum(terms) {
  return { kind: 'sum', terms };
}

export function product(factors) {
  return { kind: 'prod', factors };
}

/**
 * Перетворює форму зі знаком у самостійну форму: мінус стає сумою з одного від'ємного доданка.
 * @param {Term} signed
 * @returns {Form}
 */
export function fromSigned({ sign, node }) {
  if (sign === 1) return node;
  const terms = node.kind === 'sum' ? node.terms : [{ sign: 1, node }];
  return sum(terms.map((term) => ({ sign: -term.sign, node: term.node })));
}

/** Канонічний ключ: рівні за змістом форми (з точністю до порядку доданків і множників) мають однаковий ключ. */
export function keyOf(node) {
  switch (node.kind) {
    case 'const':
      return `#${node.value}`;
    case 'var':
      return node.name;
    case 'op':
      return `${node.name}(${node.args.map(keyOf).join(',')})`;
    case 'sum':
      return `(${node.terms.map(({ sign, node: inner }) => `${sign > 0 ? '+' : '-'}${keyOf(inner)}`).sort().join('')})`;
    default:
      return `[${node.factors.map(factorKey).sort().join('*')}]`;
  }
}

export function factorKey({ inverse, node }) {
  return `${inverse ? '/' : ''}${keyOf(node)}`;
}
