import { analyze } from './fsm.js';
import { SAMPLES } from './samples.js';

const args = process.argv.slice(2);
const showTrace = args.includes('--trace');
const expressions = args.filter((arg) => arg !== '--trace');

for (const expr of expressions.length ? expressions : SAMPLES) {
  const result = analyze(expr);
  console.log(formatErrors(expr, result));
  if (showTrace) console.log(formatTrace(result));
  console.log('\n' + '-'.repeat(60) + '\n');
}

function formatErrors(expr, { errors }) {
  const lines = ['Вхідний вираз:', expr, ''];
  if (errors.length === 0) {
    lines.push('Помилок не знайдено.');
  } else {
    lines.push('Список знайдених помилок:');
    errors.forEach((e) => lines.push(`${`[Позиція ${e.pos}]`.padEnd(13)} ${e.message}`));
  }
  return lines.join('\n');
}

function formatTrace({ steps }) {
  const lines = ['', 'Трасування автомата:'];
  for (const s of steps) {
    const token = String(s.tok.value || '<END>').padEnd(8);
    lines.push(`  ${token} ${s.input.padEnd(9)} ${s.from} -> ${s.to} ${s.note}`);
  }
  return lines.join('\n');
}
