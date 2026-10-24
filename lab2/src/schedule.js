/**
 * @typedef {Object} TreeNode
 * @property {number} id
 * @property {'const' | 'var' | 'op'} kind
 * @property {string} label
 * @property {number} [value] значення числової константи
 * @property {TreeNode[]} children
 * @property {number} level ярус: 0 для листків, інакше 1 + найвищий ярус дітей
 */

/**
 * Будує дерево паралельної форми. Доданки й множники зливаються попарно, найраніші першими (як у алгоритмі Гаффмена),
 * тому висота мінімальна, а ярус кожної операції — найраніший із можливих, тобто ширина максимальна.
 * @param {import('./form.js').Form} form
 * @returns {TreeNode}
 */
export function schedule(form) {
  let nextId = 0;
  return build(form);

  function build(node) {
    switch (node.kind) {
      case 'const':
        return leaf({ kind: 'const', label: String(node.value), value: node.value });
      case 'var':
        return leaf({ kind: 'var', label: node.name });
      case 'op':
        return opNode({ label: node.name, children: node.args.map(build) });
      case 'sum':
        return mergeAll({ items: node.terms.map(({ sign, node: inner }) => ({ tree: build(inner), flipped: sign < 0 })), rules: sumRules() });
      default:
        return mergeAll({ items: node.factors.map(({ inverse, node: inner }) => ({ tree: build(inner), flipped: inverse })), rules: productRules() });
    }
  }

  function sumRules() {
    return {
      same: '+',
      differ: '-',
      finish: (tree) => opNode({ label: 'neg', children: [tree] }),
    };
  }

  function productRules() {
    return {
      same: '*',
      differ: '/',
      finish: (tree) => opNode({ label: '/', children: [leaf({ kind: 'const', label: '1', value: 1 }), tree] }),
    };
  }

  function leaf({ kind, label, value }) {
    return { id: nextId++, kind, label, value, children: [], level: 0 };
  }

  function opNode({ label, children }) {
    const level = 1 + Math.max(0, ...children.map((child) => child.level));
    return { id: nextId++, kind: 'op', label, children, level };
  }

  function mergeAll({ items, rules }) {
    const queue = [...items].sort((a, b) => a.tree.level - b.tree.level);
    while (queue.length > 1) insertByLevel({ queue, item: mergePair({ first: queue.shift(), second: queue.shift(), rules }) });
    const [last] = queue;
    return last.flipped ? rules.finish(last.tree) : last.tree;
  }

  function mergePair({ first, second, rules }) {
    if (first.flipped === second.flipped) {
      return { tree: opNode({ label: rules.same, children: [first.tree, second.tree] }), flipped: first.flipped };
    }
    const [straight, flipped] = first.flipped ? [second, first] : [first, second];
    return { tree: opNode({ label: rules.differ, children: [straight.tree, flipped.tree] }), flipped: false };
  }
}

function insertByLevel({ queue, item }) {
  let position = queue.length;
  while (position > 0 && queue[position - 1].tree.level > item.tree.level) position--;
  queue.splice(position, 0, item);
}
