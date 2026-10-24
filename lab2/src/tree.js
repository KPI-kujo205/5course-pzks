const BINARY_OPERATIONS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '^': (a, b) => a ** b,
};

/**
 * @param {import('./schedule.js').TreeNode} tree
 * @returns {import('./schedule.js').TreeNode[]} усі вузли, батько перед дітьми
 */
export function nodesOf(tree) {
  return [tree, ...tree.children.flatMap(nodesOf)];
}

/**
 * @param {import('./schedule.js').TreeNode} tree
 * @returns {{height: number, width: number, operations: number, levels: import('./schedule.js').TreeNode[][]}}
 *   levels[k - 1] — операції k-го ярусу
 */
export function measure(tree) {
  const operations = nodesOf(tree).filter((node) => node.kind === 'op');
  const levels = Array.from({ length: tree.level }, (_, k) => operations.filter((node) => node.level === k + 1));
  return {
    height: tree.level,
    width: Math.max(0, ...levels.map((level) => level.length)),
    operations: operations.length,
    levels,
  };
}

/**
 * Обчислює дерево. Результат NaN, якщо змінної немає у `variables` або операція невідома.
 * @param {{tree: import('./schedule.js').TreeNode, variables?: Record<string, number>}} input
 * @returns {number}
 */
export function evaluate({ tree, variables = {} }) {
  if (tree.kind === 'const') return tree.value;
  if (tree.kind === 'var') return variables[tree.label] ?? NaN;
  const args = tree.children.map((child) => evaluate({ tree: child, variables }));
  return applyOperation({ label: tree.label, args });
}

function applyOperation({ label, args }) {
  if (label === 'neg') return -args[0];
  if (label in BINARY_OPERATIONS) return BINARY_OPERATIONS[label](...args);
  return typeof Math[label] === 'function' ? Math[label](...args) : NaN;
}

/**
 * Запис піддерева як інфіксного виразу без зовнішніх дужок.
 * @param {import('./schedule.js').TreeNode} node
 * @returns {string}
 */
export function expressionOf(node) {
  if (node.kind !== 'op') return node.label;
  if (node.label === 'neg') return `-${operand(node.children[0])}`;
  if (node.label in BINARY_OPERATIONS) return `${operand(node.children[0])} ${node.label} ${operand(node.children[1])}`;
  if (node.label === '[]') return indexExpression(node.children);
  return `${node.label}(${node.children.map(expressionOf).join(', ')})`;
}

function indexExpression([base, ...indices]) {
  return `${operand(base)}[${indices.map(expressionOf).join(', ')}]`;
}

function operand(node) {
  const infix = node.kind === 'op' && (node.label === 'neg' || node.label in BINARY_OPERATIONS);
  return infix ? `(${expressionOf(node)})` : expressionOf(node);
}
