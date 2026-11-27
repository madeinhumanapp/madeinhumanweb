// Proves de pes de pàgines i imatges de tota la web (WEB-G04e), sense navegador.
// Ús: node proves/pes.mjs [--arrel dist]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const idxArrel = args.indexOf('--arrel');
const ARREL = path.resolve(ARREL_REPO, idxArrel >= 0 ? args[idxArrel + 1] : 'dist');

if (!fs.existsSync(ARREL) || !fs.statSync(ARREL).isDirectory()) {
  console.error(`✗ La carpeta ${ARREL} no existeix: executa abans npm run construir`);
  process.exit(1);
}

const PRESSUPOST_PAGINA = 500 * 1024; // 500 kB
const LIMIT_IMATGE = 300 * 1024;      // 300 kB
const AVIS_PRESSUPOST = new Set(['recollida.html']);
const PENDENTS_DE_CLAUDE = new Set([]);
const EXT_IMATGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']);

function atribut(etiqueta, nom) {
  const m = new RegExp(`(?:^|\\s)${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]).replace(/&amp;/g, '&').trim() : null;
}

const htmlFitxers = [];
const imatgesFitxers = [];
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(ARREL, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = path.join(rel, e.name);
    if (e.isDirectory()) recorre(r);
    else {
      const ext = path.extname(e.name).toLowerCase();
      if (ext === '.html') htmlFitxers.push(r.split(path.sep).join('/'));
      else if (EXT_IMATGE.has(ext)) imatgesFitxers.push(r.split(path.sep).join('/'));
    }
  }
})();
htmlFitxers.sort();
imatgesFitxers.sort();

function resoldreFitxer(url, htmlRel) {
  if (!url || /^(https?:|\/\/|data:|mailto:|tel:|#)/i.test(url)) return null;
  const net = url.split(/[?#]/)[0];
  if (!net) return null;
  let rel = net.startsWith('/') ? net.slice(1) : path.posix.normalize(`${path.posix.dirname(htmlRel)}/${net}`);
  try { rel = decodeURIComponent(rel); } catch { /* manté cru */ }
  const abs = path.resolve(ARREL, rel);
  if ((abs === ARREL || abs.startsWith(ARREL + path.sep)) && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    return path.relative(ARREL, abs).split(path.sep).join('/');
  }
  return null;
}

const errors = [];
const avisos = [];
const pesos = [];

for (const rel of htmlFitxers) {
  const html = fs.readFileSync(path.join(ARREL, rel), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const recursos = new Set([rel]);

  // CSS (<link rel="stylesheet" href="...">)
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const rels = (atribut(m[0], 'rel') || '').toLowerCase().split(/\s+/);
    if (rels.includes('stylesheet')) {
      const f = resoldreFitxer(atribut(m[0], 'href'), rel);
      if (f) recursos.add(f);
    }
  }
  // JS (<script src="...">)
  for (const m of html.matchAll(/<script\b[^>]*>/gi)) {
    const f = resoldreFitxer(atribut(m[0], 'src'), rel);
    if (f) recursos.add(f);
  }
  // Imatges (<img src="...">)
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const f = resoldreFitxer(atribut(m[0], 'src'), rel);
    if (f) recursos.add(f);
  }

  let total = 0;
  for (const r of recursos) total += fs.statSync(path.join(ARREL, r)).size;
  pesos.push({ rel, total, recursos: recursos.size });

  if (total > PRESSUPOST_PAGINA) {
    const msg = `${rel}: ${(total / 1024).toFixed(1)} kB (pressupost ${(PRESSUPOST_PAGINA / 1024).toFixed(0)} kB)`;
    if (AVIS_PRESSUPOST.has(rel) || PENDENTS_DE_CLAUDE.has(rel)) avisos.push(msg);
    else errors.push(msg);
  }
}

// Cap imatge de més de 300 kB
for (const img of imatgesFitxers) {
  const mida = fs.statSync(path.join(ARREL, img)).size;
  if (mida > LIMIT_IMATGE) {
    const msg = `imatge ${img}: ${(mida / 1024).toFixed(1)} kB (màxim ${(LIMIT_IMATGE / 1024).toFixed(0)} kB)`;
    if (PENDENTS_DE_CLAUDE.has(img)) avisos.push(msg);
    else errors.push(msg);
  }
}

const top5 = [...pesos].sort((a, b) => b.total - a.total).slice(0, 5);
console.log(`Analitzades ${htmlFitxers.length} pàgines i ${imatgesFitxers.length} imatges a ${path.relative(ARREL_REPO, ARREL) || ARREL}`);
console.log('5 pàgines més pesants:');
for (const p of top5) console.log(`  - ${p.rel}: ${(p.total / 1024).toFixed(1)} kB (${p.recursos} fitxers)`);
for (const a of avisos) console.log(`⚠ ${a}`);
for (const e of errors) console.log(`✗ ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} infraccions de pes trobades`);
  process.exit(1);
}
console.log('\ntotes les comprovacions de pes correctes');
