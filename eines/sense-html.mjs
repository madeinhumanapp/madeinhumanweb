// Comprova que no hi ha HTML dins del contingut (contingut/**/*.json i contingut/legal/*.md).
// El panell només permet text enriquit mínim i Markdown: l'HTML és la via per injectar codi.
// Ús: npm run sense-html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Excepció transitòria: els blocs «html» encara no migrats (la portada ja no en té cap)
const ETIQUETA = /<\/?(p|ul|ol|li|a|em|strong|b|i|br|span|div|h[1-6]|table|tr|td|th|img|script|style|iframe)\b/i;

const fitxers = [];
(function r(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) r(f);
    else if (/\.(json|md)$/.test(e.name)) fitxers.push(f);
  }
})(path.join(ARREL, 'contingut'));

let trobats = 0;
for (const f of fitxers) {
  const rel = path.relative(ARREL, f).split(path.sep).join('/');
  if (f.endsWith('.md')) {
    // Les notes internes <!-- … --> estan permeses al Markdown
    fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (ETIQUETA.test(l.replace(/<!--.*?-->/g, ''))) { trobats++; console.log(`✗ ${rel}:${i + 1}: ${l.trim().slice(0, 90)}`); }
    });
    continue;
  }
  (function rec(o, cami) {
    if (typeof o === 'string') { if (ETIQUETA.test(o) && !cami.endsWith('.html')) { trobats++; console.log(`✗ ${rel} ${cami}: ${o.slice(0, 90).replace(/\n/g, ' ')}`); } }
    else if (Array.isArray(o)) o.forEach((v, i) => rec(v, `${cami}[${i}]`));
    else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => rec(v, cami ? `${cami}.${k}` : k));
  })(JSON.parse(fs.readFileSync(f, 'utf8')), '');
}
console.log(trobats ? `\n${trobats} textos amb HTML` : 'cap HTML al contingut');
process.exit(trobats ? 1 : 0);
