/**
 * @typedef {Object} Token
 * @property {string} type значення з T
 * @property {string} value
 * @property {number} pos індекс першого символу
 * @property {number} [errPos] індекс символу, де саме помилка (якщо не перший)
 * @property {string} [reason] уточнення помилки для BAD_NUMBER
 */

export const T = {
  IDENT: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  FUNCTION: 'FUNCTION',
  OPERATOR: 'OPERATOR',
  PAREN: 'PAREN',
  COMMA: 'COMMA',
  END: 'END',
  UNKNOWN: 'UNKNOWN',
  BAD_NUMBER: 'BAD_NUMBER',
  BAD_IDENT: 'BAD_IDENT',
  BAD_FUNCTION: 'BAD_FUNCTION',
};

const LEXICAL_ERROR_TYPES = new Set([T.UNKNOWN, T.BAD_NUMBER, T.BAD_IDENT, T.BAD_FUNCTION]);

const NUMBER_FORMATS = {
  decimalInt: /^\d+$/,
  decimalFraction: /^\d+\.\d+$/,
  fractionWithoutInt: /^\.\d+$/,
  hexPrefix: /^0[xX][0-9a-fA-F]+$/,
  binaryPrefix: /^0[bB][01]+$/,
  binarySuffix: /^[01]+[bB]$/,
  hexSuffix: /^\d[0-9a-fA-F]*[hH]$/,
};

const BROKEN_CONSTANT_HINTS = {
  hasDot: /\./,
  basePrefix: /^0[xXbB]/,
  zeroWithBaseSuffix: /^0.*[hHbB]$/,
  digitsWithBaseSuffix: /^\d+[bBhH]$/,
};

/**
 * @param {string} src
 * @returns {Token[]}
 */
export function tokenize(src) {
  const tokens = [];
  let from = skipSpaces(src, 0);
  while (from < src.length) {
    const { token, end } = readToken(src, from);
    tokens.push(token);
    from = skipSpaces(src, end);
  }
  return tokens;
}

/**
 * Токен-маркер кінця виразу.
 * @param {string} src
 * @returns {Token}
 */
export function endToken(src) {
  return { type: T.END, value: '', pos: src.trimEnd().length };
}

/** @param {Token} token */
export function isLexicalError(token) {
  return LEXICAL_ERROR_TYPES.has(token.type);
}

/** @param {Token} token */
export function errorPosition(token) {
  return token.errPos ?? token.pos;
}

function readToken(src, from) {
  const c = src[from];
  if (/[0-9.]/.test(c)) return readWord({ src, from, pattern: /[0-9A-Za-z_.]/, classify: classifyNumericWord });
  if (/[A-Za-z_]/.test(c)) return readWord({ src, from, pattern: /\w/, classify: classifyName });
  return { token: { type: symbolType(c), value: c, pos: from }, end: from + 1 };
}

function readWord({ src, from, pattern, classify }) {
  const end = scanWhile({ src, from, pattern });
  const token = classify(src.slice(from, end), from);
  return { token: isCallAfter(src, end) ? asCall(token) : token, end };
}

function symbolType(c) {
  if ('+-*/^'.includes(c)) return T.OPERATOR;
  if ('()[]'.includes(c)) return T.PAREN;
  if (c === ',') return T.COMMA;
  return T.UNKNOWN;
}

function classifyName(word, pos) {
  return { type: T.IDENT, value: word, pos };
}

function classifyNumericWord(word, pos) {
  if (Object.values(NUMBER_FORMATS).some((format) => format.test(word))) {
    return { type: T.NUMBER, value: word, pos };
  }
  return { value: word, pos, ...numberProblem(word, pos) };
}

function numberProblem(word, pos) {
  const firstDot = word.indexOf('.');
  const secondDot = firstDot === -1 ? -1 : word.indexOf('.', firstDot + 1);
  if (secondDot !== -1) return { type: T.BAD_NUMBER, reason: 'EXTRA_DOT', errPos: pos + secondDot };
  if (/^\d+\.$/.test(word)) return { type: T.BAD_NUMBER, reason: 'TRAILING_DOT', errPos: pos + firstDot };
  if (Object.values(BROKEN_CONSTANT_HINTS).some((hint) => hint.test(word))) return { type: T.BAD_NUMBER };
  return { type: T.BAD_IDENT };
}

function asCall(token) {
  const validName = token.type === T.IDENT && /^[A-Za-z_]+$/.test(token.value);
  return { type: validName ? T.FUNCTION : T.BAD_FUNCTION, value: token.value, pos: token.pos };
}

function scanWhile({ src, from, pattern }) {
  let i = from;
  while (i < src.length && pattern.test(src[i])) i++;
  return i;
}

function skipSpaces(src, from) {
  return scanWhile({ src, from, pattern: /\s/ });
}

function isCallAfter(src, from) {
  return src[skipSpaces(src, from)] === '(';
}
