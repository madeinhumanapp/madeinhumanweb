// Generador (prototip B): contingut/ + plantilles/ → dist/
// Ús: node eines/construir.mjs [--sortida dist]
import fs from 'node:fs';
import path from 'node:path';
import { pagina } from '../plantilles/base.mjs';
import { validarPagina, ESQUEMA } from '../esquema/blocs.mjs';

const ARREL = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const SORTIDA = path.resolve(ARREL, args.includes('--sortida') ? args[args.indexOf('--sortida') + 1] : 'dist');

// El que no es publica: fonts del generador, proves, eines i fitxers del repositori
const NO_PUBLICAR = new Set(['contingut', 'plantilles', 'esquema', 'eines', 'proves', 'marca', 'docs', 'dist', 'AGENTS.md',
  'node_modules', '.git', '.github', '.wrangler', 'CLAUDE.md', '.assetsignore', '.gitignore', 'package.json', 'package-lock.json']);

const t0 = Date.now();
fs.rmSync(SORTIDA, { recursive: true, force: true });
fs.mkdirSync(SORTIDA, { recursive: true });

// Pàgines que genera el port de les pàgines de servei (WEB-H04): si existeix, no es copien mai,
// de manera que si el port no les genera totes (o a la ruta bona) la paritat ho detecta
const DEL_PORT_SERVEIS = [/^serveis\/[^/]+\/index\.html$/, /^es\/servicios\/[^/]+\/index\.html$/, /^es\/index\.html$/];
const AMB_PORT_SERVEIS = fs.existsSync(path.join(ARREL, 'plantilles/serveis.mjs'));

// 1. Fitxers estàtics (CSS, JS, tipografies, imatges i pàgines encara no migrades)
let copiats = 0;
(function copia(dir, rel = '') {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (!rel && NO_PUBLICAR.has(e.name)) continue;
    if (e.isDirectory()) { fs.mkdirSync(path.join(SORTIDA, r), { recursive: true }); copia(dir, r); }
    else if (AMB_PORT_SERVEIS && DEL_PORT_SERVEIS.some(x => x.test(r.split(path.sep).join('/')))) continue;
    else { fs.copyFileSync(path.join(dir, r), path.join(SORTIDA, r)); copiats++; }
  }
})(ARREL);

// 2. Pàgines generades des del contingut (sobreescriuen la versió feta a mà)
const lloc = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
const DIR_FORMS = path.join(ARREL, 'plantilles/formularis');
const formularis = Object.fromEntries(fs.readdirSync(DIR_FORMS).filter(f => f.endsWith('.html'))
  .map(f => [path.basename(f, '.html'), fs.readFileSync(path.join(DIR_FORMS, f), 'utf8')]));
const errors = [];
let generades = 0;
for (const f of fs.readdirSync(path.join(ARREL, 'contingut/pagines'))) {
  const p = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines', f), 'utf8'));
  const e = validarPagina(p);
  if (e.length) { errors.push(...e.map(x => `${f}: ${x}`)); continue; }
  fs.mkdirSync(path.dirname(path.join(SORTIDA, p.fitxer)), { recursive: true });
  fs.writeFileSync(path.join(SORTIDA, p.fitxer), pagina(lloc, p, formularis));
  generades++;
}
// 2b. Pàgines de servei i portada en castellà (port de marca/pagines/generar.py, encàrrec WEB-H04):
//     plantilles/serveis.mjs exporta paginesServei(lloc, dades) → [[ruta relativa, html], …]
if (AMB_PORT_SERVEIS) {
  const { paginesServei } = await import('../plantilles/serveis.mjs');
  const dades = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
  for (const [rel, html] of paginesServei(lloc, dades)) {
    if (!/^[a-z0-9/_-]+\.html$/.test(rel)) { errors.push(`ruta de servei no vàlida: ${rel}`); continue; }
    fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
    fs.writeFileSync(path.join(SORTIDA, rel), html);
    generades++;
  }
}
if (errors.length) { console.error('El contingut no és vàlid:\n  ' + errors.join('\n  ')); process.exit(1); }

// 3. Vista prèvia del panell: les mateixes plantilles, servides al navegador
const PREV = path.join(SORTIDA, '_previsualitzacio');
for (const d of ['plantilles', 'esquema']) {
  fs.mkdirSync(path.join(PREV, d), { recursive: true });
  for (const f of fs.readdirSync(path.join(ARREL, d)).filter(f => f.endsWith('.mjs'))) fs.copyFileSync(path.join(ARREL, d, f), path.join(PREV, d, f));
}
for (const f of fs.readdirSync(path.join(ARREL, 'eines/previsualitzacio'))) fs.copyFileSync(path.join(ARREL, 'eines/previsualitzacio', f), path.join(PREV, f));
fs.writeFileSync(path.join(PREV, 'formularis.json'), JSON.stringify(formularis));
fs.writeFileSync(path.join(PREV, 'lloc.json'), JSON.stringify(lloc));
// L'esquema són dades: el panell en genera els formularis sense dependre del codi de la web
fs.writeFileSync(path.join(PREV, 'esquema.json'), JSON.stringify(ESQUEMA, null, 2));
console.log(`dist/: ${generades} pàgines generades, ${copiats} fitxers copiats, ${Date.now() - t0} ms`);
