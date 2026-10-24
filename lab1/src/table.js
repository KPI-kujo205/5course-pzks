import { T } from './lexer.js';

export const S = {
  START: 'START',
  OPERAND: 'OPERAND',
  OPERATOR: 'OPERATOR',
  OPEN_PAREN: 'OPEN_PAREN',
  CLOSE_PAREN: 'CLOSE_PAREN',
  FUNC: 'FUNC',
  COMMA: 'COMMA',
};

export const IN = {
  OPERAND: 'OPERAND',
  FUNCTION: 'FUNCTION',
  SIGN: 'SIGN',
  MUL: 'MUL',
  LPAREN: 'LPAREN',
  LBRACKET: 'LBRACKET',
  CLOSE_BRACKET: 'CLOSE_BRACKET',
  COMMA: 'COMMA',
  END: 'END',
  UNKNOWN: 'UNKNOWN',
};

export const NO_ERROR = '';

const { START, OPERAND, OPERATOR, OPEN_PAREN, CLOSE_PAREN, FUNC, COMMA } = S;

const expectOperand = {
  [IN.OPERAND]: ok(OPERAND),
  [IN.FUNCTION]: ok(FUNC),
  [IN.LPAREN]: ok(OPEN_PAREN),
  [IN.LBRACKET]: ok(OPEN_PAREN),
};
const indexing = ok(OPEN_PAREN);
const afterOperand = {
  [IN.OPERAND]: bad(OPERAND, 'MISSING_OP'),
  [IN.FUNCTION]: bad(FUNC, 'MISSING_OP'),
  [IN.LPAREN]: bad(OPEN_PAREN, 'MISSING_OP'),
  [IN.LBRACKET]: indexing,
  [IN.SIGN]: ok(OPERATOR),
  [IN.MUL]: ok(OPERATOR),
  [IN.CLOSE_BRACKET]: ok(CLOSE_PAREN),
  [IN.COMMA]: ok(COMMA),
  [IN.END]: ok(OPERAND),
};

/**
 * TABLE[стан][клас вхідного символу] = { next, error }.
 * Після помилки автомат не зупиняється, а переходить у `next`.
 * Рішення, які таблиця лишає аналізатору (fsm.js): чи кома стоїть у виклику функції
 * і чи EMPTY_PARENS — це `()` поза викликом (для `f()` помилки немає).
 * Після FUNC лексер гарантує '('.
 */
export const TABLE = {
  [START]: {
    ...expectOperand,
    [IN.SIGN]: ok(OPERATOR),
    [IN.MUL]: ignored('BAD_START'),
    [IN.CLOSE_BRACKET]: ignored('BAD_START'),
    [IN.COMMA]: ignored('BAD_START'),
    [IN.END]: bad(START, 'EMPTY'),
  },
  [OPERAND]: afterOperand,
  [CLOSE_PAREN]: afterOperand,
  [OPERATOR]: {
    ...expectOperand,
    [IN.SIGN]: bad(OPERATOR, 'UNEXPECTED'),
    [IN.MUL]: bad(OPERATOR, 'UNEXPECTED'),
    [IN.CLOSE_BRACKET]: bad(CLOSE_PAREN, 'UNEXPECTED'),
    [IN.COMMA]: bad(COMMA, 'UNEXPECTED'),
    [IN.END]: bad(OPERATOR, 'BAD_END'),
  },
  [OPEN_PAREN]: {
    ...expectOperand,
    [IN.SIGN]: ok(OPERATOR),
    [IN.MUL]: bad(OPEN_PAREN, 'UNEXPECTED'),
    [IN.CLOSE_BRACKET]: bad(CLOSE_PAREN, 'EMPTY_PARENS'),
    [IN.COMMA]: bad(COMMA, 'EMPTY_ARG'),
    [IN.END]: ok(OPEN_PAREN),
  },
  [FUNC]: {
    [IN.LPAREN]: ok(OPEN_PAREN),
  },
  [COMMA]: {
    ...expectOperand,
    [IN.SIGN]: ok(OPERATOR),
    [IN.MUL]: bad(COMMA, 'UNEXPECTED'),
    [IN.CLOSE_BRACKET]: bad(CLOSE_PAREN, 'EMPTY_ARG'),
    [IN.COMMA]: bad(COMMA, 'EMPTY_ARG'),
    [IN.END]: bad(COMMA, 'BAD_END'),
  },
};

/**
 * Клас вхідного символу для автомата. Некоректний операнд (BAD_NUMBER, BAD_IDENT)
 * вважається операндом, щоб аналіз міг іти далі.
 * @param {import('./lexer.js').Token} tok
 */
export function inputClass(tok) {
  switch (tok.type) {
    case T.IDENT:
    case T.NUMBER:
    case T.BAD_NUMBER:
    case T.BAD_IDENT:
      return IN.OPERAND;
    case T.FUNCTION:
    case T.BAD_FUNCTION:
      return IN.FUNCTION;
    case T.OPERATOR:
      return tok.value === '+' || tok.value === '-' ? IN.SIGN : IN.MUL;
    case T.PAREN:
      return parenClass(tok.value);
    case T.COMMA:
      return IN.COMMA;
    case T.END:
      return IN.END;
    default:
      return IN.UNKNOWN;
  }
}

function parenClass(char) {
  if (char === '(') return IN.LPAREN;
  if (char === '[') return IN.LBRACKET;
  return IN.CLOSE_BRACKET;
}

function ok(next) {
  return { next, error: NO_ERROR };
}

function bad(next, error) {
  return { next, error };
}

/** Токен пропускається цілком: не впливає ні на стан, ні на стек дужок. */
function ignored(error) {
  return { next: START, error, ignored: true };
}
