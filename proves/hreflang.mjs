// Proves globals d'etiquetes hreflang (WEB-T02), sense navegador: recorre tots els .html de dist/
// (menys _previsualitzacio/) i comprova que cada pàgina amb <link rel="alternate" hreflang> té
// l'entrada de la seva pròpia llengua cap a la canònica, x-default, destinacions existents a dist/
// i reciprocitat entre pàgines alternatives.
// Ús: npm run construir && npm run hreflang
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const LLOC = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
const WEB = LLOC.web.replace(/\/$/, '');

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.log('✗ dist/index.html no existeix: executa abans npm run construir');
  process.exit(1);
}

function atributHtml(etiqueta, nom) {
  const m = new RegExp(`\\b${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}

function analitzarHtml(html) {
  const net = html.replace(/<!--[\s\S]*?-->/g, '');
  const htmlTag = /<html\b[^>]*>/i.exec(net)?.[0] || '';
  const lang = atributHtml(htmlTag, 'lang')?.trim().toLowerCase() || null;
  const cap = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(net)?.[1] ?? net;

  let canonica = null;
  const alternatives = [];
  for (const m of cap.matchAll(/<link\b[^>]*>/gi)) {
    const rels = (atributHtml(m[0], 'rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
    const href = atributHtml(m[0], 'href')?.trim().replace(/&amp;/g, '&') || null;
    if (rels.includes('canonical') && href && !canonica) {
      canonica = href;
    }
    const hreflang = atributHtml(m[0], 'hreflang')?.trim().toLowerCase() || null;
    if (rels.includes('alternate') && hreflang) {
      alternatives.push({ hreflang, href });
    }
  }
  return { lang, canonica, alternatives };
}

function resoldreFitxer(href) {
  let u;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  if (u.origin !== WEB) return null;
  const p = decodeURIComponent(u.pathname);
  const candidats = [];
  if (p.endsWith('/')) {
    candidats.push(path.join(DIST, p.slice(1), 'index.html'));
  } else if (p.endsWith('.html')) {
    candidats.push(path.join(DIST, p.slice(1)));
  } else {
    candidats.push(path.join(DIST, `${p.slice(1)}.html`));
    candidats.push(path.join(DIST, p.slice(1), 'index.html'));
  }
  for (const c of candidats) {
    const resolt = path.resolve(c);
    if ((resolt === DIST || resolt.startsWith(DIST + path.sep)) && fs.existsSync(resolt) && fs.statSync(resolt).isFile()) {
      return path.relative(DIST, resolt).split(path.sep).join('/');
    }
  }
  return null;
}

// Recorre tots els .html de dist/ (menys _previsualitzacio/)
const paginesPerFitxer = new Map();
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(DIST, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = path.join(rel, e.name);
    if (e.isDirectory()) recorre(r);
    else if (e.name.endsWith('.html')) {
      const ruta = r.split(path.sep).join('/');
      const dades = analitzarHtml(fs.readFileSync(path.join(DIST, r), 'utf8'));
      paginesPerFitxer.set(ruta, { ruta, ...dades });
    }
  }
})();

const ambHreflang = [...paginesPerFitxer.values()].filter(p => p.alternatives.length > 0);
ok(`hi ha pàgines amb hreflang a dist/ (${ambHreflang.length})`, ambHreflang.length > 0);

// 1. Entrada per a la llengua pròpia apuntant a la canònica
const errorsPropia = [];
for (const p of ambHreflang) {
  if (!p.lang) { errorsPropia.push(`${p.ruta}: falta atribut lang a <html>`); continue; }
  if (!p.canonica) { errorsPropia.push(`${p.ruta}: falta <link rel="canonical">`); continue; }
  const propies = p.alternatives.filter(a => a.hreflang === p.lang);
  if (propies.length !== 1 || propies[0].href !== p.canonica) {
    errorsPropia.push(`${p.ruta} (lang=${p.lang}): falta hreflang="${p.lang}" cap a ${p.canonica}`);
  }
}
ok('cada pàgina amb hreflang declara la seva pròpia llengua cap a la canònica',
  errorsPropia.length === 0, errorsPropia.join(' · '));

// 2. Presència de x-default (i sense codis hreflang duplicats)
const errorsXDefault = [];
const errorsDuplicats = [];
for (const p of ambHreflang) {
  const xdefs = p.alternatives.filter(a => a.hreflang === 'x-default');
  if (xdefs.length !== 1 || !xdefs[0].href) {
    errorsXDefault.push(`${p.ruta}: falta hreflang="x-default"`);
  }
  const vistos = new Set();
  for (const a of p.alternatives) {
    if (vistos.has(a.hreflang)) errorsDuplicats.push(`${p.ruta}: hreflang="${a.hreflang}" duplicat`);
    vistos.add(a.hreflang);
  }
}
ok('cada pàgina amb hreflang té x-default', errorsXDefault.length === 0, errorsXDefault.join(' · '));
ok('cap pàgina no repeteix un mateix hreflang', errorsDuplicats.length === 0, errorsDuplicats.join(' · '));

// 3. Cada adreça alternativa correspon a una pàgina existent a dist/
const errorsDesti = [];
for (const p of ambHreflang) {
  for (const a of p.alternatives) {
    if (!a.href || !resoldreFitxer(a.href)) {
      errorsDesti.push(`${p.ruta} (${a.hreflang} → ${a.href})`);
    }
  }
}
ok('cada adreça alternativa existeix a dist/', errorsDesti.length === 0, errorsDesti.join(' · '));

// 4. Reciprocitat: si A apunta a B com a alternativa, B apunta a A
const errorsReciprocitat = [];
for (const a of ambHreflang) {
  for (const alt of a.alternatives) {
    if (!alt.href) continue;
    const fitxerB = resoldreFitxer(alt.href);
    if (!fitxerB) continue; // ja comptat a la comprovació anterior
    const b = paginesPerFitxer.get(fitxerB);
    if (!b) {
      errorsReciprocitat.push(`${a.ruta} → ${alt.href} (no trobada)`);
      continue;
    }
    if (alt.hreflang !== 'x-default' && b.lang !== alt.hreflang) {
      errorsReciprocitat.push(`${a.ruta} declara ${alt.hreflang} cap a ${b.ruta}, però té lang="${b.lang}"`);
    }
    const torna = b.alternatives.some(x => x.href === a.canonica && (x.hreflang === a.lang || (x.hreflang === 'x-default' && a.ruta === b.ruta)));
    if (!torna) {
      errorsReciprocitat.push(`${a.ruta} apunta a ${b.ruta} (${alt.hreflang}), però ${b.ruta} no torna cap a ${a.canonica} (${a.lang})`);
    }
  }
}
ok('reciprocitat entre totes les pàgines alternatives', errorsReciprocitat.length === 0, errorsReciprocitat.join(' · '));

// 5. Actualitat (ca i es): la pròpia llengua i x-default cap a la pròpia canònica; o bé, si hi ha traducció
//    (grup_hreflang, WEB-G04), ca + es + x-default, amb la pròpia llengua cap a la canònica i x-default cap a la catalana
const paginesActualitat = [...paginesPerFitxer.values()].filter(p => p.ruta.startsWith('actualitat/') || p.ruta.startsWith('es/actualidad/'));
const errorsActualitat = [];
for (const p of paginesActualitat) {
  const codis = p.alternatives.map(a => a.hreflang).sort().join(',');
  const href = codi => p.alternatives.find(a => a.hreflang === codi)?.href;
  const propia = href(p.lang) === p.canonica;
  const sola = codis === `${p.lang},x-default`.split(',').sort().join(',') && p.alternatives.every(a => a.href === p.canonica);
  const parella = codis === 'ca,es,x-default' && propia && href('x-default') === href('ca');
  if (!sola && !parella) {
    errorsActualitat.push(`${p.ruta}: té [${codis}] (esperat ${p.lang},x-default cap a ${p.canonica}, o ca,es,x-default amb x-default cap a la catalana)`);
  }
}
ok(`actualitat (${paginesActualitat.length} pàgina/es): pròpia llengua i x-default, o parella ca/es amb x-default cap a la catalana`,
  paginesActualitat.length > 0 && errorsActualitat.length === 0, errorsActualitat.join(' · '));

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de hreflang correctes');
process.exit(fallades ? 1 : 0);
