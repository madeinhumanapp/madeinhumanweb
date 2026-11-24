// Generador (prototip B): contingut/ + plantilles/ → dist/
// Ús: node eines/construir.mjs [--sortida dist]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pagina } from '../plantilles/base.mjs';
import { paginaLegal } from '../plantilles/legal.mjs';
import { paginaXarxes } from '../plantilles/xarxes.mjs';
import { validarServeis, CAMPS_SERVEI, CAMPS_PORTADA_ES, CAMPS_COMU } from '../esquema/serveis.mjs';
import { validarPagina, validarFaq, validarNoticia, validarLloc, ESQUEMA, CAMPS_NOTICIA, CAMPS_XARXES, validarMedia, usosDeMedia, PATRO_ID_MEDIA } from '../esquema/blocs.mjs';
import { llegirNoticia, publicades, targeta, paginesActualitat, ambNoticiesAlMapa } from '../plantilles/actualitat.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SORTIDA = path.resolve(ARREL, args.includes('--sortida') ? args[args.indexOf('--sortida') + 1] : 'dist');

// El que no es publica: fonts del generador, proves, eines i fitxers del repositori
const NO_PUBLICAR = new Set(['contingut', 'captures', 'plantilles', 'esquema', 'eines', 'proves', 'marca', 'docs', 'dist', 'AGENTS.md',
  'node_modules', '.git', '.github', '.wrangler', 'CLAUDE.md', '.gitignore', 'package.json', 'package-lock.json']);

const t0 = Date.now();
fs.rmSync(SORTIDA, { recursive: true, force: true });
fs.mkdirSync(SORTIDA, { recursive: true });

// 1. Fitxers estàtics (CSS, JS, tipografies, imatges i les aplicacions: diagnòstic, recollida, «Necessito un DPO?»)
let copiats = 0;
(function copia(dir, rel = '') {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (!rel && NO_PUBLICAR.has(e.name)) continue;
    if (!rel && e.name === 'media') continue; // es copia de DIR_MEDIA (per defecte, l'arrel del repositori)
    if (e.isDirectory()) { fs.mkdirSync(path.join(SORTIDA, r), { recursive: true }); copia(dir, r); }
    else { fs.copyFileSync(path.join(dir, r), path.join(SORTIDA, r)); copiats++; }
  }
})(ARREL);

// Mitjans (WEB-M02): els fitxers de contingut/media.json es publiquen a /media/ tal qual.
// A les proves es poden redirigir la biblioteca i la carpeta amb FITXER_MEDIA i DIR_MEDIA.
const FITXER_MEDIA = process.env.FITXER_MEDIA ? path.resolve(process.env.FITXER_MEDIA) : path.join(ARREL, 'contingut/media.json');
const DIR_MEDIA = process.env.DIR_MEDIA ? path.resolve(process.env.DIR_MEDIA) : path.join(ARREL, 'media');
if (fs.existsSync(DIR_MEDIA)) {
  fs.mkdirSync(path.join(SORTIDA, 'media'), { recursive: true });
  for (const e of fs.readdirSync(DIR_MEDIA, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    fs.copyFileSync(path.join(DIR_MEDIA, e.name), path.join(SORTIDA, 'media', e.name));
    copiats++;
  }
}

// 2. Pàgines generades des del contingut
const lloc = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
const DIR_FORMS = path.join(ARREL, 'plantilles/formularis');
const formularis = Object.fromEntries(fs.readdirSync(DIR_FORMS).filter(f => f.endsWith('.html'))
  .map(f => [path.basename(f, '.html'), fs.readFileSync(path.join(DIR_FORMS, f), 'utf8')]));
// FAQ: una sola font per a la llista visible i el JSON-LD
const faq = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/faq.json'), 'utf8'));
const errors = [...validarFaq(faq).map(e => `faq.json: ${e}`), ...validarLloc(lloc).map(e => `lloc.json: ${e}`)];
// Mitjans (WEB-M02): contingut/media.json (si no existeix, buida) i els fitxers de media/
const media = fs.existsSync(FITXER_MEDIA) ? JSON.parse(fs.readFileSync(FITXER_MEDIA, 'utf8')) : [];
errors.push(...validarMedia(media).map(e => `media.json: ${e}`));
// Cada fitxer ha d'existir, no passar del límit i portar els bytes del format (mai SVG)
const MAGIC = {
  webp: b => b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
  jpg: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  mp4: b => b.length >= 8 && b.toString('latin1', 4, 8) === 'ftyp',
};
const LIMIT = { imatge: 2 * 1024 * 1024, video: 20 * 1024 * 1024 };
for (const e of media) {
  if (!e || typeof e !== 'object' || !PATRO_ID_MEDIA.test(e.id || '')) continue; // ja ho marca validarMedia
  const fitxers = e.tipus === 'video' ? [`${e.id}.mp4`] : (Array.isArray(e.mides) ? e.mides : []).map(m => `${e.id}-${m}.${e.format}`);
  for (const f of fitxers) {
    const ruta = path.join(DIR_MEDIA, f);
    if (!fs.existsSync(ruta)) { errors.push(`media.json: falta el fitxer media/${f}`); continue; }
    const b = fs.readFileSync(ruta);
    if (b.length > LIMIT[e.tipus]) errors.push(`media/${f}: ${b.length} bytes (màxim ${LIMIT[e.tipus]})`);
    if (!MAGIC[e.format]?.(b)) errors.push(`media/${f}: els bytes no corresponen al format ${e.format}`);
  }
}
// Notícies: contingut/actualitat/*.md. Només surten les publicades amb data d'avui o anterior (hora de Madrid);
// DATA_CONSTRUCCIO=AAAA-MM-DD fixa «avui» (proves). Les programades surten a la construcció d'aquell dia.
const AVUI = process.env.DATA_CONSTRUCCIO || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
const DIR_ACT = process.env.DIR_ACTUALITAT ? path.resolve(process.env.DIR_ACTUALITAT) : path.join(ARREL, 'contingut/actualitat');
const totes = fs.existsSync(DIR_ACT) ? fs.readdirSync(DIR_ACT).filter(f => f.endsWith('.md')).sort()
  .map(f => llegirNoticia(fs.readFileSync(path.join(DIR_ACT, f), 'utf8'), f)) : [];
const slugs = new Set();
for (const n of totes) {
  errors.push(...validarNoticia(n).map(e => `actualitat/${n.fitxer}: ${e}`));
  if (slugs.has(n.slug)) errors.push(`actualitat/${n.fitxer}: ja hi ha una altra notícia amb el títol curt «${n.slug}»`);
  slugs.add(n.slug);
}
const noticies = errors.length ? [] : publicades(totes, AVUI);
const targetes = noticies.map(targeta);

let generades = 0;
const paginesBlocs = [];
for (const f of fs.readdirSync(path.join(ARREL, 'contingut/pagines'))) {
  const p = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines', f), 'utf8'));
  paginesBlocs.push([f, p]);
  const e = validarPagina(p);
  if (e.length) { errors.push(...e.map(x => `${f}: ${x}`)); continue; }
  fs.mkdirSync(path.dirname(path.join(SORTIDA, p.fitxer)), { recursive: true });
  // Pàgines legals: marc propi i cos en Markdown (contingut/legal/*.md)
  const html = p.plantilla === 'legal' ? paginaLegal(lloc, p, fs.readFileSync(path.join(ARREL, 'contingut', p.cos), 'utf8'))
    : p.plantilla === 'xarxes' ? paginaXarxes(lloc, p)
    : pagina(lloc, p, formularis, faq, targetes, media);
  fs.writeFileSync(path.join(SORTIDA, p.fitxer), html);
  generades++;
}
// Els blocs només poden fer servir entrades de media.json que existeixin i siguin del tipus del filtre
for (const [f, p] of paginesBlocs) errors.push(...usosDeMedia([p], media).map(x => `${f}: ${x}`));
// 2b. Pàgines de servei i portada en castellà (port de marca/pagines/generar.py, encàrrec WEB-H04):
//     plantilles/serveis.mjs exporta paginesServei(lloc, dades) → [[ruta relativa, html], …]
{
  const { paginesServei } = await import('../plantilles/serveis.mjs');
  const dades = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
  const eServeis = validarServeis(dades).map(e => `serveis.json: ${e}`);
  errors.push(...eServeis);
  for (const [rel, html] of eServeis.length ? [] : paginesServei(lloc, dades)) {
    if (!/^[a-z0-9/_-]+\.html$/.test(rel)) { errors.push(`ruta de servei no vàlida: ${rel}`); continue; }
    fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
    fs.writeFileSync(path.join(SORTIDA, rel), html);
    generades++;
  }
}
// 2c. Actualitat: llistat, pàgines de les notícies amb cos, RSS i mapa del lloc (només si n'hi ha de publicades)
if (noticies.length) {
  const dades = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
  const portada = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/portada.ca.json'), 'utf8'));
  const bloc = portada.blocs.find(b => b.tipus === 'actualitat');
  for (const [rel, contingut] of paginesActualitat(lloc, dades, noticies, bloc)) {
    fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
    fs.writeFileSync(path.join(SORTIDA, rel), contingut);
    if (rel.endsWith('.html')) generades++;
  }
  const mapa = path.join(SORTIDA, 'sitemap.xml');
  fs.writeFileSync(mapa, ambNoticiesAlMapa(fs.readFileSync(mapa, 'utf8'), lloc.web, noticies));
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
fs.writeFileSync(path.join(PREV, 'faq.json'), JSON.stringify(faq));
fs.writeFileSync(path.join(PREV, 'media.json'), JSON.stringify(media));
// L'esquema són dades: el panell en genera els formularis sense dependre del codi de la web
fs.writeFileSync(path.join(PREV, 'esquema.json'), JSON.stringify(ESQUEMA, null, 2));
// Esquemes dels continguts que no són blocs de pàgina (els formularis del panell en surten igual)
fs.writeFileSync(path.join(PREV, 'esquema-continguts.json'), JSON.stringify({ noticia: CAMPS_NOTICIA, xarxes: CAMPS_XARXES, servei: CAMPS_SERVEI, portada_es: CAMPS_PORTADA_ES, comu: CAMPS_COMU }, null, 2));
const programades = totes.filter(n => n.cap.estat === 'publicat' && n.cap.data > AVUI).length;
console.log(`dist/: ${generades} pàgines generades, ${copiats} fitxers copiats, ${Date.now() - t0} ms`
  + (totes.length ? ` · notícies: ${noticies.length} publicades${programades ? `, ${programades} programades` : ''}` : ''));
