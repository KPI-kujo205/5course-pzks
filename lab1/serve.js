import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const DIRS = [
  ['/src/', join(ROOT, 'src')],
  ['/', join(ROOT, 'web')],
];

createServer(handleRequest).listen(PORT, () => console.log(`http://localhost:${PORT}`));

async function handleRequest(req, res) {
  const file = resolveFile(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
}

/**
 * Маршрути: `/` -> web/index.html, `/src/*` -> src/*, решта -> web/*.
 * Адреса за межами каталогу дає неіснуючий файл, тобто 404.
 * @param {string} urlPath
 */
function resolveFile(urlPath) {
  const path = urlPath === '/' ? '/index.html' : urlPath;
  const [prefix, dir] = DIRS.find(([p]) => path.startsWith(p));
  const file = join(dir, path.slice(prefix.length));
  return file.startsWith(dir + sep) ? file : join(ROOT, '.not-found');
}
