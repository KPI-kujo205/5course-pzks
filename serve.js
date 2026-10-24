import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const LAB_PATH = /^\/(lab\d+)(\/.*)?$/;

createServer(handleRequest).listen(PORT, () => console.log(`http://localhost:${PORT}`));

async function handleRequest(req, res) {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') return sendLabIndex(res);
  if (LAB_PATH.test(path) && !LAB_PATH.exec(path)[2]) return redirect({ res, to: `${path}/` });
  try {
    const data = await readFile(resolveFile(path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(resolveFile(path))] ?? 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
}

/**
 * Той самий розклад, що й на GitHub Pages: `/labN/*` -> labN/web/*, `/labN/src/*` -> labN/src/*.
 * Адреса за межами каталогу дає неіснуючий файл, тобто 404.
 * @param {string} urlPath
 */
function resolveFile(urlPath) {
  const match = LAB_PATH.exec(urlPath);
  if (!match) return join(ROOT, '.not-found');
  const [, lab, rest = '/'] = match;
  const isSource = rest.startsWith('/src/');
  const dir = join(ROOT, lab, isSource ? 'src' : 'web');
  const relative = isSource ? rest.slice('/src/'.length) : rest.slice(1) || 'index.html';
  const file = join(dir, relative);
  return file.startsWith(dir + sep) ? file : join(ROOT, '.not-found');
}

function redirect({ res, to }) {
  res.writeHead(301, { Location: to }).end();
}

async function sendLabIndex(res) {
  const labs = (await readdir(ROOT)).filter((name) => /^lab\d+$/.test(name)).sort();
  const links = labs.map((lab) => `<li><a href="/${lab}/">${lab}</a></li>`).join('');
  res.writeHead(200, { 'Content-Type': TYPES['.html'] }).end(`<!doctype html><meta charset="utf-8"><ul>${links}</ul>`);
}
