import { tokenize, endToken, isLexicalError, errorPosition } from './lexer.js';
import { S, IN, NO_ERROR, TABLE, inputClass } from './table.js';
import { MESSAGES } from './messages.js';

const OPENING_FOR = { ')': '(', ']': '[' };

/**
 * Проганяє токени через автомат і збирає ВСІ помилки, не зупиняючись на першій.
 * Дужки (стек) і коми в аргументах функцій слідкує сам аналізатор — скінченний автомат цього не вміє.
 * @param {string} src
 * @returns {{ tokens: import('./lexer.js').Token[], errors: { pos: number, code: string, message: string }[], steps: object[] }}
 */
export function analyze(src) {
  const tokens = tokenize(src);
  const errors = [];
  const steps = [];
  /** @type {{ char: string, pos: number, isCall: boolean }[]} */
  const brackets = [];

  let state = S.START;
  let prev;
  let afterUnknown = false;

  tokens.forEach(feed);
  feed(endToken(src));
  brackets.forEach((opened) => report({ code: 'UNCLOSED', pos: opened.pos, opened }));

  errors.sort((a, b) => a.pos - b.pos);
  return { tokens, errors, steps };

  function feed(tok) {
    const input = inputClass(tok);
    if (isLexicalError(tok)) report({ code: tok.type, pos: errorPosition(tok), tok });
    if (input === IN.UNKNOWN) skipUnknownSymbol(tok);
    else transition({ tok, input });
  }

  function skipUnknownSymbol(tok) {
    afterUnknown = true;
    logStep({ tok, input: IN.UNKNOWN, to: state, note: 'ERROR_RECOVERY: символ пропущено' });
  }

  function transition({ tok, input }) {
    const cell = TABLE[state][input];
    if (isStrayClosingBracket({ input, cell })) return skipStrayBracket(tok);

    const error = pardonedError(cell);
    registerError({ tok, input, cell, error });
    if (input === IN.LPAREN || input === IN.LBRACKET) openBracket(tok);
    moveTo({ tok, input, next: cell.next, error });
  }

  function moveTo({ tok, input, next, error }) {
    logStep({ tok, input, to: next, note: error });
    state = next;
    prev = tok;
    afterUnknown = false;
  }

  /** Операнд відразу після пропущеного символу ($, #) — не «відсутній оператор». */
  function pardonedError(cell) {
    return cell.error === 'MISSING_OP' && afterUnknown ? NO_ERROR : cell.error;
  }

  function registerError({ tok, input, cell, error }) {
    if (cell.ignored) fail({ code: error, tok });
    else if (input === IN.CLOSE_BRACKET) closeBracket(tok, error);
    else if (input === IN.COMMA) argumentSeparator(tok, error);
    else if (error) fail({ code: error, tok });
  }

  function fail({ code, tok, ...extra }) {
    report({ code, pos: tok.pos, tok, ...extra });
  }

  function report({ code, pos, ...context }) {
    errors.push({ pos, code, message: MESSAGES[code]({ prev, ...context }) });
  }

  function logStep({ tok, input, to, note = NO_ERROR }) {
    steps.push({ tok, input, from: state, to, note });
  }

  function isStrayClosingBracket({ input, cell }) {
    return input === IN.CLOSE_BRACKET && !cell.ignored && brackets.length === 0;
  }

  function skipStrayBracket(tok) {
    fail({ code: 'UNMATCHED_CLOSE', tok });
    logStep({ tok, input: IN.CLOSE_BRACKET, to: state, note: 'ERROR_RECOVERY: зайва дужка пропущена' });
  }

  function openBracket(tok) {
    brackets.push({ char: tok.value, pos: tok.pos, isCall: state === S.FUNC });
  }

  function closeBracket(tok, error) {
    const opened = brackets.pop();
    if (opened.char !== OPENING_FOR[tok.value]) fail({ code: 'MISMATCH', tok, opened });
    if (error === 'EMPTY_PARENS') reportEmptyParens(opened);
    else if (error) fail({ code: error, tok });
  }

  /** `f()` — коректний виклик без аргументів; помилка лише для `()` поза функцією. */
  function reportEmptyParens(opened) {
    if (!opened.isCall) report({ code: 'EMPTY_PARENS', pos: opened.pos });
  }

  /**
   * Кома має стояти безпосередньо у виклику функції. Незакриті дужки між комою
   * і функцією вважаються помилками (по одній на дужку), аналіз продовжується.
   */
  function argumentSeparator(tok, error) {
    if (error) fail({ code: error, tok });
    const call = brackets.findLastIndex((bracket) => bracket.isCall);
    if (call === -1) {
      if (!error) fail({ code: 'COMMA_OUTSIDE', tok });
      return;
    }
    while (brackets.length - 1 > call) {
      const opened = brackets.pop();
      report({ code: 'UNCLOSED', pos: opened.pos, opened });
    }
  }
}
