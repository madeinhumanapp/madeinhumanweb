// Proves estàtiques d'accessibilitat de tota la web (WEB-G04e), sense navegador.
// Ús: node proves/accessibilitat.mjs [--arrel dist]
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
  return (m[1] ?? m[2] ?? m[3]).replace(/&amp;/g, '&');
}

function teAtribut(etiqueta, nom) {
  return new RegExp(`(?:^|\\s)${nom}(?:\\s*=|\\s|>|\\/)`, 'i').test(etiqueta);
}

function netejar(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, '');
}

function textAccessible(etiqObre, cosIntern) {
  if ((atribut(etiqObre, 'aria-label') || '').trim()) return true;
  if ((atribut(etiqObre, 'aria-labelledby') || '').trim()) return true;
  if ((atribut(etiqObre, 'title') || '').trim()) return true;
  const textPla = cosIntern.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, s => {
    const t = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(s)?.[1] || '';
    const al = atribut(s.match(/<svg\b[^>]*>/i)?.[0] || '', 'aria-label') || '';
    return `${t} ${al}`;
  }).replace(/<img\b[^>]*>/gi, img => atribut(img, 'alt') || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return textPla.length > 0;
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

const errors = [];
const avisos = [];

function afegir(pagina, detall) {
  const linia = `${pagina}: ${detall}`;
  if (PENDENTS_DE_CLAUDE.has(pagina)) avisos.push(linia);
  else errors.push(linia);
}

for (const rel of htmlFitxers) {
  const net = netejar(fs.readFileSync(path.join(ARREL, rel), 'utf8'));

  // 1. <html lang> present i coherent amb la ruta
  const htmlTag = /<html\b[^>]*>/i.exec(net)?.[0] || '';
  const lang = (atribut(htmlTag, 'lang') || '').trim().toLowerCase();
  const esperat = rel.startsWith('es/') ? 'es' : 'ca';
  if (!lang) afegir(rel, 'falta atribut lang a <html>');
  else if (lang !== esperat) afegir(rel, `lang="${lang}" incoherent amb la ruta (esperat «${esperat}»)`);

  // 2. Existeix <main>
  if (!/<main\b[^>]*>/i.test(net)) afegir(rel, 'falta element <main>');

  // 3. Un sol <h1> i cap salt de nivell de títol (p. ex. h2 → h4)
  const titols = [...net.matchAll(/<h([1-6])\b[^>]*>/gi)].map(m => Number(m[1]));
  const h1s = titols.filter(n => n === 1).length;
  if (h1s !== 1) afegir(rel, `s'esperava 1 <h1>, n'hi ha ${h1s}`);
  for (let i = 1; i < titols.length; i++) {
    if (titols[i] > titols[i - 1] + 1) {
      afegir(rel, `salt de nivell de títol: h${titols[i - 1]} → h${titols[i]}`);
    }
  }

  // 4. ids únics a cada pàgina
  const vistosId = new Map();
  for (const m of net.matchAll(/<[a-z][^>]*>/gi)) {
    const id = atribut(m[0], 'id');
    if (!id) continue;
    vistosId.set(id, (vistosId.get(id) || 0) + 1);
  }
  for (const [id, n] of vistosId) {
    if (n > 1) afegir(rel, `id duplicat «${id}» (${n} vegades)`);
  }

  // 5. Cada <img> amb atribut alt (pot ser buit si és decorativa)
  for (const m of net.matchAll(/<img\b[^>]*>/gi)) {
    if (!teAtribut(m[0], 'alt')) afegir(rel, `<img> sense atribut alt (${m[0].slice(0, 80)})`);
  }

  // 6. Cada camp de formulari amb label associada (for= o envoltant) o aria-label / aria-labelledby
  const labelsFor = new Set();
  for (const m of net.matchAll(/<label\b[^>]*>/gi)) {
    const f = atribut(m[0], 'for');
    if (f) labelsFor.add(f);
  }
  // Marca camps dins de <label>...</label>
  const senseLabelsEnvoltants = net.replace(/<label\b[^>]*>[\s\S]*?<\/label>/gi, ' ');
  for (const m of senseLabelsEnvoltants.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
    const tag = m[1].toLowerCase();
    const etiq = m[0];
    if (tag === 'input') {
      const tipus = (atribut(etiq, 'type') || 'text').toLowerCase();
      if (['hidden', 'submit', 'button', 'reset', 'image'].includes(tipus)) continue;
    }
    const id = atribut(etiq, 'id');
    const teLabel = (id && labelsFor.has(id))
      || Boolean((atribut(etiq, 'aria-label') || '').trim())
      || Boolean((atribut(etiq, 'aria-labelledby') || '').trim());
    if (!teLabel) {
      afegir(rel, `camp <${tag}${id ? ` id="${id}"` : ''}${atribut(etiq, 'name') ? ` name="${atribut(etiq, 'name')}"` : ''}> sense label ni aria-label`);
    }
  }

  // 7. Cap enllaç ni botó sense text accessible
  for (const m of net.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const tag = m[1].toLowerCase();
    const obre = `<${tag}${m[2]}>`;
    if (tag === 'a' && !teAtribut(obre, 'href')) continue;
    if (!textAccessible(obre, m[3])) {
      afegir(rel, `<${tag}> sense text accessible (${obre.slice(0, 80)})`);
    }
  }

  // 8. Cada <iframe> amb title no buit
  for (const m of net.matchAll(/<iframe\b[^>]*>/gi)) {
    if (!(atribut(m[0], 'title') || '').trim()) {
      afegir(rel, `<iframe> sense atribut title (${m[0].slice(0, 80)})`);
    }
  }
}

console.log(`Analitzades ${htmlFitxers.length} pàgines HTML a ${path.relative(ARREL_REPO, ARREL) || ARREL}`);
for (const a of avisos) console.log(`⚠ [PENDENT DE CLAUDE] ${a}`);
for (const e of errors) console.log(`✗ ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} infraccions d'accessibilitat trobades`);
  process.exit(1);
}
console.log('\ntotes les comprovacions d\'accessibilitat correctes');
