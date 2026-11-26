// Proves de les metadades (WEB-T10), sense navegador: recorre els .html de dist/ (menys _previsualitzacio/)
// i, per a les pàgines sense noindex, comprova que <title> té com a màxim 60 caràcters i
// <meta name="description"> com a màxim 155, comptant el text real (entitats HTML desfetes: &#x27; i &amp;
// són un sol caràcter). Les pàgines de PENDENTS_DE_CLAUDE (fitxers fixos que corregeix Claude) surten com a
// avís, no com a error. Cada pàgina que falla es llista amb la seva llargada.
// Ús: npm run construir && node proves/metadades.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');

const TITOL_MAX = 60;
const DESCRIPCIO_MAX = 155;
// Fitxers fixos que no es toquen en aquest encàrrec: si fallen, és avís (els corregeix Claude)
const PENDENTS_DE_CLAUDE = ['diagnostic.html'];

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(DIST)) {
  console.log('✗ dist/ no existeix: executa abans npm run construir');
  process.exit(1);
}

// Text real: desfà les entitats HTML (&amp; al final, perquè no es tornin a decodificar)
const desescapa = s => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&');

function atributHtml(etiqueta, nom) {
  const m = new RegExp(`\\b${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}

function analitzarHtml(html) {
  const cap = (/<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html).replace(/<!--[\s\S]*?-->/g, '');
  let noindex = false;
  let descripcio = null;
  for (const m of cap.matchAll(/<meta\b[^>]*>/gi)) {
    const nom = (atributHtml(m[0], 'name') || '').trim().toLowerCase();
    if (nom === 'robots' && /\bnoindex\b/i.test(atributHtml(m[0], 'content') || '')) noindex = true;
    if (nom === 'description' && descripcio === null) descripcio = atributHtml(m[0], 'content');
  }
  const titolCru = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(cap)?.[1];
  return {
    noindex,
    titol: titolCru === undefined ? null : desescapa(titolCru).trim(),
    descripcio: descripcio === null ? null : desescapa(descripcio),
  };
}

const pagines = [];
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(DIST, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = path.join(rel, e.name);
    if (e.isDirectory()) recorre(r);
    else if (e.name.endsWith('.html')) {
      pagines.push({ ruta: r.split(path.sep).join('/'), ...analitzarHtml(fs.readFileSync(path.join(DIST, r), 'utf8')) });
    }
  }
})();

const indexables = pagines.filter(p => !p.noindex);
const pendents = new Set(PENDENTS_DE_CLAUDE);

ok(`s'han trobat pàgines indexables a dist/ (${indexables.length})`, indexables.length > 0);

const senseTitol = indexables.filter(p => p.titol === null);
ok('totes les pàgines indexables tenen <title>', senseTitol.length === 0, senseTitol.map(p => p.ruta).join(', '));

const senseDescripcio = indexables.filter(p => p.descripcio === null);
if (senseDescripcio.length) {
  console.log(`nota: ${senseDescripcio.length} pàgina(es) indexable(s) sense meta description (no es comprova la llargada): ${senseDescripcio.map(p => p.ruta).join(', ')}`);
}

const titolMassaLlarg = indexables.filter(p => p.titol !== null && p.titol.length > TITOL_MAX);
const descripcioMassaLlarga = indexables.filter(p => p.descripcio !== null && p.descripcio.length > DESCRIPCIO_MAX);

for (const p of titolMassaLlarg) {
  const avis = pendents.has(p.ruta);
  console.log(`${avis ? '!' : '✗'} ${p.ruta} — títol de ${p.titol.length} caràcters (màxim ${TITOL_MAX})${avis ? ' · avís: pendent de Claude' : ''}: «${p.titol}»`);
}
for (const p of descripcioMassaLlarga) {
  const avis = pendents.has(p.ruta);
  console.log(`${avis ? '!' : '✗'} ${p.ruta} — descripció de ${p.descripcio.length} caràcters (màxim ${DESCRIPCIO_MAX})${avis ? ' · avís: pendent de Claude' : ''}: «${p.descripcio}»`);
}

const errorsTitol = titolMassaLlarg.filter(p => !pendents.has(p.ruta));
const errorsDescripcio = descripcioMassaLlarga.filter(p => !pendents.has(p.ruta));

ok(`tots els títols de les pàgines indexables fan com a màxim ${TITOL_MAX} caràcters (llevat dels pendents de Claude)`,
  errorsTitol.length === 0, errorsTitol.map(p => `${p.ruta} (${p.titol.length})`).join(', '));
ok(`totes les descripcions de les pàgines indexables fan com a màxim ${DESCRIPCIO_MAX} caràcters (llevat dels pendents de Claude)`,
  errorsDescripcio.length === 0, errorsDescripcio.map(p => `${p.ruta} (${p.descripcio.length})`).join(', '));

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de títols i descripcions correctes');
process.exit(fallades ? 1 : 0);
