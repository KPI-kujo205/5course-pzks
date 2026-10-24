import { parallelize } from './parallelize.js';
import { SAMPLES } from './samples.js';
import { evaluate, expressionOf } from './tree.js';

const args = process.argv.slice(2);
const simplify = args.includes('--simplify');
const expressions = args.filter((arg) => arg !== '--simplify');
const inputs = expressions.length ? expressions.map((expr) => ({ expr, simplify })) : SAMPLES;

for (const { expr, simplify: simplifyThis } of inputs) {
  console.log(describe({ source: expr, result: parallelize({ source: expr, simplify: simplifyThis }) }));
  console.log('\n' + '-'.repeat(60) + '\n');
}

function describe({ source, result }) {
  const lines = ['Вхідний вираз:', source, ''];
  if (result.status === 'syntax-errors') lines.push(...describeSyntaxErrors(result));
  else if (result.status === 'division-by-zero') lines.push(...describeZeroDivisions(result));
  else lines.push(...describePlan(result));
  return lines.join('\n');
}

function describeSyntaxErrors({ errors }) {
  return ['Синтаксичні помилки:', ...errors.map((e) => `[Позиція ${e.pos}] ${e.message}`)];
}

function describeZeroDivisions({ divisions }) {
  return [
    'Ділення на нуль:',
    ...divisions.map((d) => `Доданок ${d.termNumber}: ${d.term}  (дільник ${d.divisor} = 0)`),
  ];
}

function describePlan({ tree, levels, height, width, operations }) {
  const value = evaluate({ tree });
  const lines = [`Висота: ${height}  Ширина: ${width}  Операцій: ${operations}`];
  if (Number.isFinite(value)) lines.push(`Значення: ${Number(value.toPrecision(12))}`);
  levels.forEach((level, k) => lines.push(`  ярус ${k + 1}: ${level.map(expressionOf).join(';  ')}`));
  return lines;
}
