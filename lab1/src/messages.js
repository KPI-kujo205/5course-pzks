/**
 * @typedef {Object} MessageContext
 * @property {import('./lexer.js').Token} tok токен, на якому виявлено помилку
 * @property {import('./lexer.js').Token} prev попередній токен
 * @property {{ char: string, pos: number }} opened дужка, про яку йдеться
 */

/** Тексти помилок за кодом; кожен метод отримує MessageContext. */
export const MESSAGES = {
  EMPTY() {
    return 'Порожній вираз';
  },
  BAD_START({ tok }) {
    return `Некоректний початок виразу: несподіваний токен ${quote(tok.value)}`;
  },
  BAD_END({ prev }) {
    return `Неочікуваний кінець виразу після ${describe(prev)}`;
  },

  UNEXPECTED({ tok, prev }) {
    return `Неочікуваний ${kindOf(tok)} ${quote(tok.value)} після ${describe(prev)}`;
  },
  MISSING_OP({ tok, prev }) {
    return `Відсутній оператор між ${quote(prev.value)} та ${quote(tok.value)}`;
  },

  EMPTY_PARENS() {
    return `Порожні дужки ${quote('()')} поза викликом функції`;
  },
  EMPTY_ARG({ tok }) {
    return `Пропущено аргумент функції, знайдено ${quote(tok.value)}`;
  },
  COMMA_OUTSIDE() {
    return 'Кома поза викликом функції';
  },
  UNMATCHED_CLOSE({ tok }) {
    return `Закриваюча дужка ${quote(tok.value)} не має парної відкриваючої`;
  },
  UNCLOSED({ opened }) {
    return `Відкриваюча дужка ${quote(opened.char)} не має парної закриваючої`;
  },
  MISMATCH({ tok, opened }) {
    return `Невідповідність дужок: ${quote(opened.char)} (позиція ${opened.pos}) закрита як ${quote(tok.value)}`;
  },

  UNKNOWN({ tok }) {
    return `Невідомий символ/оператор ${quote(tok.value)}`;
  },
  BAD_IDENT({ tok }) {
    return `Некоректний ідентифікатор ${quote(tok.value)}`;
  },
  BAD_FUNCTION({ tok }) {
    return `Некоректний ідентифікатор функції ${quote(tok.value)}`;
  },
  BAD_NUMBER({ tok }) {
    if (tok.reason === 'EXTRA_DOT') return 'Зайва десяткова крапка в дробовому числі';
    if (tok.reason === 'TRAILING_DOT') return `Неповне дробове число ${quote(tok.value)}: після крапки немає цифр`;
    return `Некоректна числова константа ${quote(tok.value)}`;
  },
};

function quote(text) {
  return `'${text}'`;
}

function kindOf(tok) {
  return '+-*/^'.includes(tok.value) ? 'оператор' : 'токен';
}

function describe(prev) {
  if (prev.value === ',') return 'коми';
  if ('(['.includes(prev.value)) return 'відкритої дужки';
  return `оператора ${quote(prev.value)}`;
}
