// Proves d'enllaços interns, fragments (#id) i enllaços externs de tota la web (WEB-G04e), sense navegador.
// Ús: node proves/enllacos.mjs [--arrel dist]
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

const PENDENTS_DE_CLAUDE = new Set([]);

function atribut(etiqueta, nom) {
  const m = new RegExp(`(?:^|\\s)${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  if (!m) return null;
  return (m[1] ?? m[2] ?? m[3]).replace(/&amp;/g, '&').trim();
}

function teAtribut(etiqueta, nom) {
  return new RegExp(`(?:^|\\s)${nom}(?:\\s*=|\\s|>|\\/)`, 'i').test(etiqueta);
}

function netejarHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => {
      // Conserva només l'etiqueta d'obertura per revisar src= en scripts externs
      const obre = /<script\b[^>]*>/i.exec(m)?.[0] || '';
      return obre + '</script>';
    })
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

const htmlFitxers = [];
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(ARREL, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = path.join(rel, e.name);
    if (e.isDirectory()) recorre(r);
    else if (e.name.endsWith('.html')) htmlFitxers.push(r.split(path.sep).join('/'));
  }
})();
htmlFitxers.sort();

// Recull tots els ids de cada fitxer HTML
const idsPerFitxer = new Map();
const contingutNet = new Map();
for (const rel of htmlFitxers) {
  const net = netejarHtml(fs.readFileSync(path.join(ARREL, rel), 'utf8'));
  contingutNet.set(rel, net);
  const ids = new Set();
  for (const m of net.matchAll(/<[a-z][^>]*>/gi)) {
    const id = atribut(m[0], 'id');
    if (id) ids.add(id);
  }
  idsPerFitxer.set(rel, ids);
}

function resoldreLocal(urlSenseFrag, fitxerActual) {
  const ruta = urlSenseFrag.split('?')[0];
  if (!ruta) return fitxerActual;
  let rel;
  if (ruta.startsWith('/')) {
    rel = ruta.slice(1);
  } else {
    const dir = path.posix.dirname(fitxerActual);
    rel = path.posix.normalize(dir === '.' ? ruta : `${dir}/${ruta}`);
  }
  try { rel = decodeURIComponent(rel); } catch { /* manté cru */ }
  const candidats = [];
  if (!rel || rel === '.') {
    candidats.push('index.html');
  } else if (rel.endsWith('/')) {
    candidats.push(`${rel}index.html`);
  } else {
    candidats.push(rel);
    if (!path.posix.extname(rel)) {
      candidats.push(`${rel}.html`);
      candidats.push(`${rel}/index.html`);
    }
  }
  for (const c of candidats) {
    const abs = path.resolve(ARREL, c);
    if ((abs === ARREL || abs.startsWith(ARREL + path.sep)) && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      return path.relative(ARREL, abs).split(path.sep).join('/');
    }
  }
  return null;
}

const errors = [];
const avisos = [];
const dominisExterns = new Set();

function afegir(pagina, detall) {
  const linia = `${pagina}: ${detall}`;
  if (PENDENTS_DE_CLAUDE.has(pagina)) avisos.push(linia);
  else errors.push(linia);
}

for (const rel of htmlFitxers) {
  const net = contingutNet.get(rel);
  for (const m of net.matchAll(/<(a|link|script|img|source|iframe|audio|video)\b[^>]*>/gi)) {
    const tag = m[1].toLowerCase();
    const etiq = m[0];
    const esHref = tag === 'a' || tag === 'link';
    const nomAttr = esHref ? 'href' : 'src';
    const val = atribut(etiq, nomAttr);

    // Enllaços <a href=""> o <a href="#"> sense ús
    if (tag === 'a' && teAtribut(etiq, 'href')) {
      if (val === '') { afegir(rel, 'enllaç amb href="" buit'); continue; }
      if (val === '#') { afegir(rel, 'enllaç amb href="#" sense destinació'); continue; }
    }
    if (val === null || val === '') continue;

    // Ignora esquemes no-HTTP(S)
    if (/^(mailto:|tel:|data:|javascript:|blob:)/i.test(val)) continue;

    // Enllaç extern
    if (/^https?:\/\//i.test(val) || val.startsWith('//')) {
      let u;
      try { u = new URL(val.startsWith('//') ? `https:${val}` : val); } catch { afegir(rel, `URL no vàlida (${val})`); continue; }
      const host = u.hostname.toLowerCase();
      const esPropi = host === 'madeinhuman.cat' || host === 'www.madeinhuman.cat';
      if (!esPropi) dominisExterns.add(host);
      if (tag === 'a' && (atribut(etiq, 'target') || '').toLowerCase() === '_blank' && !esPropi) {
        const rels = (atribut(etiq, 'rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
        if (!rels.includes('noopener')) {
          afegir(rel, `enllaç extern amb target="_blank" sense rel="noopener" (${val})`);
        }
      }
      continue;
    }

    // Només enllaç a fragment dins de la mateixa pàgina
    if (val.startsWith('#')) {
      const frag = decodeURIComponent(val.slice(1));
      if (!idsPerFitxer.get(rel)?.has(frag)) {
        afegir(rel, `fragment inexistent a la mateixa pàgina (${val})`);
      }
      continue;
    }

    // Enllaç o recurs intern (comença per / o és relatiu)
    const [rutaPart, fragPart] = val.split('#');
    const resolt = resoldreLocal(rutaPart, rel);
    if (!resolt) {
      afegir(rel, `${tag}[${nomAttr}="${val}"] no existeix a ${path.relative(ARREL_REPO, ARREL) || ARREL}`);
      continue;
    }
    if (fragPart) {
      const frag = decodeURIComponent(fragPart);
      if (resolt.endsWith('.html') && !idsPerFitxer.get(resolt)?.has(frag)) {
        afegir(rel, `fragment #${frag} inexistent a ${resolt} (des de ${val})`);
      }
    }
  }
}

console.log(`Analitzades ${htmlFitxers.length} pàgines HTML a ${path.relative(ARREL_REPO, ARREL) || ARREL}`);
if (dominisExterns.size) {
  console.log(`Dominis externs enllaçats (${dominisExterns.size}): ${[...dominisExterns].sort().join(', ')}`);
}
for (const a of avisos) console.log(`⚠ [PENDENT DE CLAUDE] ${a}`);
for (const e of errors) console.log(`✗ ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} infraccions d'enllaços trobades`);
  process.exit(1);
}
console.log('\ntotes les comprovacions d\'enllaços correctes');
