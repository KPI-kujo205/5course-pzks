import { analyze } from '../../lab1/src/fsm.js';
import { normalize } from './normalize.js';
import { parse } from './parse.js';
import { plainBuilders } from './plain.js';
import { schedule } from './schedule.js';
import { simplifyingBuilders } from './simplify.js';
import { measure } from './tree.js';
import { findZeroDivisions } from './zero.js';

/**
 * Повний конвеєр: аналіз Лаб 1, пошук ділення на нуль, нормалізація, планування по ярусах.
 * @param {{source: string, simplify: boolean}} input
 * @returns {{status: 'syntax-errors', errors: {pos: number, message: string}[]}
 *   | {status: 'division-by-zero', divisions: import('./zero.js').ZeroDivision[]}
 *   | ({status: 'ok', tree: import('./schedule.js').TreeNode} & ReturnType<typeof measure>)}
 */
export function parallelize({ source, simplify }) {
  const { tokens, errors } = analyze(source);
  if (errors.length > 0) return { status: 'syntax-errors', errors };
  const ast = parse(tokens);
  const divisions = findZeroDivisions(ast);
  if (divisions.length > 0) return { status: 'division-by-zero', divisions };
  const tree = schedule(normalize(ast, simplify ? simplifyingBuilders : plainBuilders));
  return { status: 'ok', tree, ...measure(tree) };
}
