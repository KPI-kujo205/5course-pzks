const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 };
const NEGATION_PRECEDENCE = 3;
const ATOM_PRECEDENCE = 5;

/**
 * Записує дерево розбору як рядок із мінімально потрібними дужками.
 * @param {import('./parse.js').Ast} ast
 * @returns {string}
 */
export function unparse(ast) {
  switch (ast.kind) {
    case 'num':
      return String(ast.value);
    case 'var':
      return ast.name;
    case 'neg':
      return `-${operand({ ast: ast.arg, minPrecedence: 4 })}`;
    case 'call':
      return unparseCall(ast);
    default:
      return unparseBinary(ast);
  }
}

function unparseBinary({ op, left, right }) {
  const own = PRECEDENCE[op];
  const rightAssociative = op === '^';
  const leftText = operand({ ast: left, minPrecedence: rightAssociative ? own + 1 : own });
  const rightText = operand({ ast: right, minPrecedence: rightAssociative ? own : own + 1 });
  return `${leftText}${op}${rightText}`;
}

function unparseCall({ name, args }) {
  if (name !== '[]') return `${name}(${args.map(unparse).join(', ')})`;
  const [base, ...indices] = args;
  return `${operand({ ast: base, minPrecedence: ATOM_PRECEDENCE })}[${indices.map(unparse).join(', ')}]`;
}

function operand({ ast, minPrecedence }) {
  return precedenceOf(ast) < minPrecedence ? `(${unparse(ast)})` : unparse(ast);
}

function precedenceOf(ast) {
  if (ast.kind === 'bin') return PRECEDENCE[ast.op];
  return ast.kind === 'neg' ? NEGATION_PRECEDENCE : ATOM_PRECEDENCE;
}
