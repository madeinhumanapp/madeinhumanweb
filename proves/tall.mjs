// Preparació del tall (WEB-H10): dist/ ha de contenir tot el que Cloudflare publica avui des de l'arrel.
// Compara els fitxers publicables de l'arrel (sense els de .assetsignore) amb dist/:
//   - cap fitxer publicat avui pot faltar a dist/
//   - els que no són pàgines generades han de ser idèntics byte a byte (les pàgines les vigila la paritat)
//   - llista el que dist/ afegeix (pàgines noves, vista prèvia del panell)
// Ús: npm run construir && node proves/tall.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const ignora = fs.readFileSync(path.join(ARREL, '.assetsignore'), 'utf8').split('\n').map(l => l.trim())
  .filter(l => l && !l.startsWith('#')).map(l => l.replace(/\/$/, ''));
const fora = rel => ignora.some(p => rel === p || rel.startsWith(p + '/') || (p.endsWith('*') && rel.startsWith(p.slice(0, -1))))
  || rel.split('/').some(s => s === 'node_modules' || s === '.git') || rel.startsWith('captures/');
const llista = (dir, rel = '') => fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap(e => {
  const r = rel ? `${rel}/${e.name}` : e.name;
  return e.isDirectory() ? llista(dir, r) : [r];
});

const avui = llista(ARREL).filter(r => !fora(r));
const nous = new Set(llista(DIST));
const falten = avui.filter(r => !nous.has(r));
const diferents = avui.filter(r => nous.has(r) && !r.endsWith('.html') && r !== 'sitemap.xml'
  && !fs.readFileSync(path.join(ARREL, r)).equals(fs.readFileSync(path.join(DIST, r))));
const afegits = [...nous].filter(r => !avui.includes(r));

console.log(`publicats avui: ${avui.length} · a dist/: ${nous.size}`);
for (const r of falten) console.log(`✗ falta a dist/: ${r}`);
for (const r of diferents) console.log(`✗ diferent: ${r}`);
const grups = afegits.reduce((g, r) => { const k = r.split('/')[0]; g[k] = (g[k] || 0) + 1; return g; }, {});
console.log(`afegits a dist/: ${Object.entries(grups).map(([k, n]) => `${k} (${n})`).join(', ') || 'cap'}`);
console.log(falten.length || diferents.length ? '\nNO es pot fer el tall' : '\ndist/ conté tot el que es publica avui');
process.exit(falten.length || diferents.length ? 1 : 0);
