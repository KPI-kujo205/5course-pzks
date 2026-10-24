import { nodesOf } from './src/tree.js';

const LEAF_GAP = 56;
const LEVEL_GAP = 58;
const PAD_LEFT = 34;
const PAD = 24;
const PILL_HEIGHT = 24;
const CHAR_WIDTH = 8;

/**
 * Малює дерево по ярусах: листки внизу, корінь угорі.
 * @param {import('./src/schedule.js').TreeNode} tree
 * @returns {string} SVG
 */
export function renderTree(tree) {
  const nodes = nodesOf(tree);
  const positions = layout(tree);
  const width = PAD_LEFT + PAD * 2 + (leafCount(tree) - 1) * LEAF_GAP + CHAR_WIDTH * 4;
  const height = PAD * 2 + tree.level * LEVEL_GAP + PILL_HEIGHT;
  const body = [
    ...nodes.flatMap((node) => node.children.map((child) => edge({ from: positions.get(node.id), to: positions.get(child.id), childId: child.id }))),
    ...levelLabels({ tree, positions }),
    ...nodes.map((node) => nodeShape({ node, at: positions.get(node.id) })),
  ];
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body.join('')}</svg>`;
}

/**
 * Підсвічує піддерево вузла під курсором, решту притемнює.
 * @param {{svg: SVGElement, tree: import('./src/schedule.js').TreeNode}} input
 */
export function highlightOnHover({ svg, tree }) {
  const byId = new Map(nodesOf(tree).map((node) => [node.id, node]));
  svg.querySelectorAll('.node').forEach((element) => {
    element.addEventListener('mouseenter', () => dimOutside({ svg, subtree: nodesOf(byId.get(Number(element.dataset.id))) }));
    element.addEventListener('mouseleave', () => svg.classList.remove('dimmed'));
  });
}

function dimOutside({ svg, subtree }) {
  const inside = new Set(subtree.map((node) => node.id));
  svg.classList.add('dimmed');
  svg.querySelectorAll('.node, .edge').forEach((element) => {
    element.classList.toggle('on', inside.has(Number(element.dataset.id)));
  });
}

function layout(tree) {
  const positions = new Map();
  let nextLeaf = 0;
  place(tree);
  return positions;

  function place(node) {
    const x = node.children.length === 0 ? PAD_LEFT + PAD + nextLeaf++ * LEAF_GAP : meanX(node.children.map(place));
    positions.set(node.id, { x, y: PAD + (tree.level - node.level) * LEVEL_GAP + PILL_HEIGHT / 2 });
    return x;
  }
}

function meanX(xs) {
  return xs.reduce((total, x) => total + x, 0) / xs.length;
}

function leafCount(tree) {
  return nodesOf(tree).filter((node) => node.children.length === 0).length;
}

function edge({ from, to, childId }) {
  const half = PILL_HEIGHT / 2;
  return `<line class="edge" data-id="${childId}" x1="${from.x}" y1="${from.y + half}" x2="${to.x}" y2="${to.y - half}"/>`;
}

function levelLabels({ tree, positions }) {
  const anyAtLevel = (level) => nodesOf(tree).find((node) => node.level === level);
  return Array.from({ length: tree.level }, (_, k) => k + 1).map(
    (level) => `<text class="level" x="0" y="${positions.get(anyAtLevel(level).id).y + 4}">${level}</text>`,
  );
}

function nodeShape({ node, at }) {
  const text = `<text class="label ${node.kind}" x="${at.x}" y="${at.y + 5}" text-anchor="middle">${escapeText(node.label)}</text>`;
  if (node.kind !== 'op') return `<g class="node" data-id="${node.id}">${text}</g>`;
  const pillWidth = Math.max(PILL_HEIGHT, node.label.length * CHAR_WIDTH + 14);
  const pill = `<rect class="pill" x="${at.x - pillWidth / 2}" y="${at.y - PILL_HEIGHT / 2}" width="${pillWidth}" height="${PILL_HEIGHT}" rx="${PILL_HEIGHT / 2}"/>`;
  return `<g class="node" data-id="${node.id}">${pill}${text}</g>`;
}

function escapeText(text) {
  return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
