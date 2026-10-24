import { S, IN, TABLE } from '/src/table.js';

const NODE_RADIUS = 40;
const TOP_MARGIN = 70;

/**
 * Кола мають радіус `r`, рамки-групи — півширину `hw` і піввисоту `hh`.
 */
const NODES = {
  START: { x: 90, y: TOP_MARGIN + 250, r: NODE_RADIUS },
  OPEN_PAREN: { x: 350, y: TOP_MARGIN + 150, r: NODE_RADIUS },
  OPERATOR: { x: 350, y: TOP_MARGIN + 350, r: NODE_RADIUS },
  COMMA: { x: 350, y: TOP_MARGIN + 550, r: NODE_RADIUS },
  OPERAND: { x: 680, y: TOP_MARGIN + 150, r: NODE_RADIUS },
  CLOSE_PAREN: { x: 900, y: TOP_MARGIN + 150, r: NODE_RADIUS },
  FUNC: { x: 680, y: TOP_MARGIN + 520, r: NODE_RADIUS },
  GROUP_IN: { x: 350, y: TOP_MARGIN + 350, hw: 130, hh: 255, caption: 'очікується операнд' },
  GROUP_OUT: { x: 790, y: TOP_MARGIN + 150, hw: 185, hh: 70, caption: 'після операнда', captionOnTop: true },
};

const STATES_EXPECTING_OPERAND = [S.OPEN_PAREN, S.OPERATOR, S.COMMA];
const INPUTS_SHARED_BY_THOSE_STATES = [IN.OPERAND, IN.FUNCTION, IN.LPAREN, IN.LBRACKET];
const ACCEPTING_STATES = [S.OPERAND, S.CLOSE_PAREN];

const ARROW_BEND = {
  'START>OPERAND': -0.5, 'START>FUNC': 0.8, 'START>OPEN_PAREN': -0.1, 'START>OPERATOR': 0.05,
  'GROUP_IN>OPERAND': -0.1, 'GROUP_IN>FUNC': 0.1,
  'FUNC>OPEN_PAREN': -0.18,
  'OPEN_PAREN>OPERATOR': 0, 'COMMA>OPERATOR': 0,
  'OPEN_PAREN>CLOSE_PAREN': -0.62,
  'GROUP_OUT>OPERATOR': 0, 'GROUP_OUT>OPEN_PAREN': -0.08, 'GROUP_OUT>COMMA': 0.12,
};
const DEFAULT_BEND = 0.1;

const ARROW_LABEL_POSITION = {
  'START>FUNC': 0.45, 'GROUP_IN>OPERAND': 0.62, 'FUNC>OPEN_PAREN': 0.62,
  'GROUP_OUT>OPERATOR': 0.78, 'GROUP_OUT>OPEN_PAREN': 0.7, 'GROUP_OUT>COMMA': 0.6,
};
const DEFAULT_LABEL_POSITION = 0.5;

const ERROR_MARK_PLACEMENT = {
  START: { dx: 0, dy: -80, labelSide: 'left' },
  OPEN_PAREN: { dx: -215, dy: 0, labelSide: 'above' },
  OPERATOR: { dx: -215, dy: 0, labelSide: 'below' },
  COMMA: { dx: -215, dy: 0, labelSide: 'above' },
  GROUP_OUT: { dx: -45, dy: 105, labelSide: 'right' },
};

const INPUT_SYMBOL = {
  [IN.OPERAND]: 'a..z 0..9',
  [IN.FUNCTION]: 'f(',
  [IN.SIGN]: '+ -',
  [IN.MUL]: '* / ^',
  [IN.LPAREN]: '(',
  [IN.LBRACKET]: '[',
  [IN.CLOSE_BRACKET]: ')',
  [IN.COMMA]: ',',
  [IN.END]: '⏎',
};

document.getElementById('g').innerHTML = renderGraph(buildGraph());

/**
 * @typedef {Object} Graph
 * @property {Map<string, string[]>} arrows ключ "A>B" -> символи на стрілці
 * @property {Map<string, string[]>} errors стан -> символи, що ведуть до помилки
 */

/** @returns {Graph} */
function buildGraph() {
  const graph = { arrows: new Map(), errors: new Map() };
  collectRow({ graph, source: S.START, row: TABLE[S.START] });
  collectRow({ graph, source: 'GROUP_IN', row: TABLE[S.OPEN_PAREN], include: isSharedInput });
  STATES_EXPECTING_OPERAND.forEach((state) => {
    collectRow({ graph, source: state, row: TABLE[state], include: isOwnInput });
  });
  collectRow({ graph, source: 'GROUP_OUT', row: TABLE[S.OPERAND] });
  moveClosingArrowInsideGroup(graph.arrows);
  return graph;
}

function isSharedInput(input) {
  return INPUTS_SHARED_BY_THOSE_STATES.includes(input);
}

function isOwnInput(input) {
  return !isSharedInput(input);
}

function collectRow({ graph, source, row, include = () => true }) {
  for (const [input, cell] of Object.entries(row)) {
    if (include(input)) addTransition({ graph, source, input, cell });
  }
}

/** Звичайний перехід потрапляє в `arrows`, помилковий — в `errors`. */
function addTransition({ graph, source, input, cell }) {
  const { next, error } = cell;
  const arrowKey = `${source}>${next}`;
  if (input === IN.END) {
    if (error) addSymbol({ map: graph.errors, key: source, symbol: INPUT_SYMBOL[IN.END] });
  } else if (error === 'EMPTY_PARENS') {
    addSymbol({ map: graph.arrows, key: arrowKey, symbol: ')*' });
  } else if (error) {
    addSymbol({ map: graph.errors, key: source, symbol: INPUT_SYMBOL[input] });
  } else {
    addSymbol({ map: graph.arrows, key: arrowKey, symbol: INPUT_SYMBOL[input] });
  }
}

function moveClosingArrowInsideGroup(arrows) {
  const key = `GROUP_OUT>${S.CLOSE_PAREN}`;
  const symbols = arrows.get(key);
  arrows.delete(key);
  arrows.set(`${S.OPERAND}>${S.CLOSE_PAREN}`, symbols);
  arrows.set(`${S.CLOSE_PAREN}>${S.CLOSE_PAREN}`, symbols);
}

function addSymbol({ map, key, symbol }) {
  if (!map.has(key)) map.set(key, []);
  const symbols = map.get(key);
  if (!symbols.includes(symbol)) symbols.push(symbol);
}

/** @param {Graph} graph */
function renderGraph({ arrows, errors }) {
  const drawn = [
    ...[...arrows].map(([key, symbols]) => drawArrow({ key, symbols })),
    ...[...errors].map(([state, symbols]) => drawErrorMark({ state, symbols })),
  ];
  const boxes = ['GROUP_IN', 'GROUP_OUT'].map((name) => drawGroupBox(NODES[name]));
  const circles = Object.entries(NODES)
    .filter(([name]) => !name.startsWith('GROUP'))
    .map(([name, node]) => drawStateCircle({ name, node }));

  return [
    arrowHeads(),
    ...drawn.map((part) => part.edge),
    ...boxes,
    ...circles,
    ...drawn.map((part) => part.node),
    ...drawn.map((part) => part.label),
  ].join('');
}

/**
 * @typedef {Object} DrawnPart частини SVG; їх малюють шарами: стрілки, вузли, підписи
 * @property {string} edge
 * @property {string} node
 * @property {string} label
 */

/** @returns {DrawnPart} */
function drawArrow({ key, symbols }) {
  const [from, to] = key.split('>');
  const text = symbols.join(' ');
  const isLoop = from === to || (from === 'GROUP_IN' && to === S.OPEN_PAREN);
  if (isLoop) return drawLoop({ state: to, text });

  const arrow = curve({ from, to, bend: ARROW_BEND[key] ?? DEFAULT_BEND });
  const [x, y] = pointOn(arrow, ARROW_LABEL_POSITION[key] ?? DEFAULT_LABEL_POSITION);
  const kind = from === S.START ? 'start' : '';
  return {
    edge: `<path class="edge ${kind}" d="${arrow.path}"/>`,
    node: '',
    label: labelSvg({ x, y, text, kind }),
  };
}

/** @returns {DrawnPart} */
function drawLoop({ state, text }) {
  const n = NODES[state];
  const direction = state === S.CLOSE_PAREN ? 1 : -1;
  const edgeY = n.y + direction * n.r;
  const inner = edgeY - direction * 4;
  const outer = edgeY + direction * 62;
  return {
    edge: `<path class="edge loop" d="M ${n.x - 20} ${inner} C ${n.x - 55} ${outer}, ${n.x + 55} ${outer}, ${n.x + 20} ${inner}"/>`,
    node: '',
    label: labelSvg({ x: n.x, y: edgeY + direction * 48, text, kind: 'loop' }),
  };
}

/** @returns {DrawnPart} */
function drawErrorMark({ state, symbols }) {
  const n = NODES[state];
  const { dx, dy, labelSide } = ERROR_MARK_PLACEMENT[state];
  const markX = n.x + dx;
  const markY = n.y + dy;
  const [startX, startY] = boundaryPoint({ node: n, toward: [markX, markY], margin: 2 });
  const length = Math.hypot(markX - startX, markY - startY);
  const endX = markX - ((markX - startX) / length) * 16;
  const endY = markY - ((markY - startY) / length) * 16;
  const middleX = (markX + startX) / 2 + 10;

  const labelPlacement = {
    above: { x: middleX, y: markY - 17, anchor: 'middle' },
    below: { x: middleX, y: markY + 17, anchor: 'middle' },
    left: { x: markX - 20, y: markY, anchor: 'end' },
    right: { x: markX + 22, y: markY, anchor: 'start' },
  }[labelSide];

  return {
    edge: `<path class="edge err" d="M ${startX} ${startY} L ${endX} ${endY}"/>`,
    node: `<g class="node err"><circle cx="${markX}" cy="${markY}" r="14"/><text x="${markX}" y="${markY}" style="font-size:12px">E</text></g>`,
    label: labelSvg({ ...labelPlacement, text: symbols.join(' '), kind: 'err' }),
  };
}

function drawGroupBox(node) {
  const captionY = node.captionOnTop ? node.y - node.hh + 20 : node.y + node.hh - 12;
  return (
    `<rect x="${node.x - node.hw}" y="${node.y - node.hh}" width="${node.hw * 2}" height="${node.hh * 2}" rx="18" ` +
    `style="fill:none;stroke:var(--muted);stroke-dasharray:5 5;stroke-width:1.3"/>` +
    `<text x="${node.x - node.hw + 14}" y="${captionY}" style="fill:var(--muted);font:12px system-ui">${node.caption}</text>`
  );
}

function drawStateCircle({ name, node }) {
  const innerCircle = ACCEPTING_STATES.includes(name)
    ? `<circle cx="${node.x}" cy="${node.y}" r="${node.r - 5}" style="stroke-width:1.2"/>`
    : '';
  return `<g class="node"><circle cx="${node.x}" cy="${node.y}" r="${node.r}"/>${innerCircle}<text x="${node.x}" y="${node.y}">${name}</text></g>`;
}

function labelSvg({ x, y, text, kind = '', anchor = 'middle' }) {
  const width = text.length * 7.8 + 10;
  const left = { middle: x - width / 2, start: x - 4, end: x - width + 4 }[anchor];
  return (
    `<rect class="lblbg" x="${left}" y="${y - 10}" width="${width}" height="20" rx="4"/>` +
    `<text class="lbl ${kind}" x="${x}" y="${y}" style="text-anchor:${anchor}">${escapeSvg(text)}</text>`
  );
}

function arrowHeads() {
  const heads = ['edge', 'start', 'loop', 'err'].map(
    (color) =>
      `<marker id="a-${color}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">` +
      `<path d="M0 0L10 5L0 10z" style="fill:var(--${color})"/></marker>`,
  );
  return `<defs>${heads.join('')}</defs>`;
}

function escapeSvg(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** Квадратична крива між вузлами; чим більший `bend`, тим сильніше вона вигнута. */
function curve({ from, to, bend }) {
  const a = NODES[from];
  const b = NODES[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const controlX = (a.x + b.x) / 2 - dy * bend;
  const controlY = (a.y + b.y) / 2 + dx * bend;
  const [x1, y1] = boundaryPoint({ node: a, toward: [controlX, controlY], margin: 2 });
  const [x2, y2] = boundaryPoint({ node: b, toward: [controlX, controlY], margin: 5 });
  return { x1, y1, x2, y2, controlX, controlY, path: `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}` };
}

/** Точка на кривій при параметрі `t` від 0 до 1. */
function pointOn(curveShape, t) {
  const u = 1 - t;
  const { x1, y1, x2, y2, controlX, controlY } = curveShape;
  return [
    u * u * x1 + 2 * u * t * controlX + t * t * x2,
    u * u * y1 + 2 * u * t * controlY + t * t * y2,
  ];
}

/** Точка на межі кола або рамки у напрямку до `toward`, з відступом `margin`. */
function boundaryPoint({ node, toward: [targetX, targetY], margin }) {
  const dx = targetX - node.x;
  const dy = targetY - node.y;
  const length = Math.hypot(dx, dy);
  if (node.r) return [node.x + (dx / length) * (node.r + margin), node.y + (dy / length) * (node.r + margin)];
  const scale = Math.min(node.hw / (Math.abs(dx) || 1e-9), node.hh / (Math.abs(dy) || 1e-9));
  return [node.x + dx * scale + (dx / length) * margin, node.y + dy * scale + (dy / length) * margin];
}
