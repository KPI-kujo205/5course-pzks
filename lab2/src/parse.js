import { T } from '../../lab1/src/lexer.js';

/**
 * @typedef {{kind: 'num', value: number}
 *   | {kind: 'var', name: string}
 *   | {kind: 'neg', arg: Ast}
 *   | {kind: 'bin', op: string, left: Ast, right: Ast}
 *   | {kind: 'call', name: string, args: Ast[]}} Ast
 */

/**
 * Будує дерево розбору з токенів, які пройшли аналіз Лаб 1. Індексація `A[i]` стає викликом `[]`.
 * @param {import('../../lab1/src/lexer.js').Token[]} tokens
 * @returns {Ast}
 */
export function parse(tokens) {
  let index = 0;
  return parseSum();

  function current() {
    return tokens[index];
  }

  function advance() {
    return tokens[index++];
  }

  function matches(value) {
    return current()?.value === value;
  }

  function parseSum() {
    return parseChain({ operators: ['+', '-'], parseOperand: parseProduct });
  }

  function parseProduct() {
    return parseChain({ operators: ['*', '/'], parseOperand: parseUnary });
  }

  function parseChain({ operators, parseOperand }) {
    let left = parseOperand();
    while (operators.includes(current()?.value)) {
      const op = advance().value;
      left = { kind: 'bin', op, left, right: parseOperand() };
    }
    return left;
  }

  function parseUnary() {
    if (matches('-')) {
      advance();
      return { kind: 'neg', arg: parseUnary() };
    }
    if (matches('+')) {
      advance();
      return parseUnary();
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePostfix();
    if (!matches('^')) return base;
    advance();
    return { kind: 'bin', op: '^', left: base, right: parseUnary() };
  }

  function parsePostfix() {
    let node = parsePrimary();
    while (matches('[')) {
      advance();
      node = { kind: 'call', name: '[]', args: [node, ...parseArguments(']')] };
    }
    return node;
  }

  function parsePrimary() {
    const token = advance();
    switch (token.type) {
      case T.NUMBER:
        return { kind: 'num', value: numberValue(token.value) };
      case T.IDENT:
        return { kind: 'var', name: token.value };
      case T.FUNCTION:
        advance();
        return { kind: 'call', name: token.value, args: parseArguments(')') };
      default:
        return parseGroup(token);
    }
  }

  function parseGroup(opening) {
    const closing = opening.value === '(' ? ')' : ']';
    const inner = parseSum();
    if (!matches(closing)) throw new Error(`Очікувалась '${closing}'`);
    advance();
    return inner;
  }

  function parseArguments(closing) {
    if (matches(closing)) {
      advance();
      return [];
    }
    const args = [parseSum()];
    while (matches(',')) {
      advance();
      args.push(parseSum());
    }
    advance();
    return args;
  }
}

/** @param {string} text */
function numberValue(text) {
  if (/^0[xX]/.test(text)) return parseInt(text.slice(2), 16);
  if (/^0[bB]/.test(text)) return parseInt(text.slice(2), 2);
  if (/[hH]$/.test(text)) return parseInt(text.slice(0, -1), 16);
  if (/^[01]+[bB]$/.test(text)) return parseInt(text.slice(0, -1), 2);
  return Number(text);
}
