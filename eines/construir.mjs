// Generador (prototip B): contingut/ + plantilles/ → dist/
// Ús: node eines/construir.mjs [--sortida dist] [--esborranys]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pagina } from '../plantilles/base.mjs';
import { paginaLegal } from '../plantilles/legal.mjs';
import { paginaXarxes } from '../plantilles/xarxes.mjs';
import { validarServeis, CAMPS_SERVEI, CAMPS_PORTADA_ES, CAMPS_COMU } from '../esquema/serveis.mjs';
import { validarPagina, validarFaq, validarNoticia, validarConjuntNoticies, validarLloc, ESQUEMA, CAMPS_NOTICIA, CAMPS_XARXES, validarMedia, usosDeMedia, PATRO_ID_MEDIA } from '../esquema/blocs.mjs';
import { validarSector, validarConjuntSectors, CAMPS_SECTOR } from '../esquema/sectors.mjs';
import { llegirNoticia, publicades, esborranysActualitat, targeta, paginesActualitat, paginesEsborranysActualitat, datesActualitatMapa } from '../plantilles/actualitat.mjs';
import { paginesSectors, datesSectorsMapa, paginaTaulaEsborranys, scriptTaulaEsborranys } from '../plantilles/sectors.mjs';
import { paginaReserva } from '../plantilles/reserva.mjs';
import { paginesCerca } from '../plantilles/cerca.mjs';
import { generarLlmsTxt } from '../plantilles/llms.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SORTIDA = path.resolve(ARREL, args.includes('--sortida') ? args[args.indexOf('--sortida') + 1] : 'dist');
const AMB_ESBORRANYS = args.includes('--esborranys') || Boolean(process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'main');

// El que no es publica: fonts del generador, proves, eines i fitxers del repositori
const NO_PUBLICAR = new Set(['contingut', 'captures', 'plantilles', 'esquema', 'eines', 'proves', 'marca', 'docs', 'dist', 'AGENTS.md',
  'node_modules', '.git', '.github', '.wrangler', 'CLAUDE.md', '.gitignore', 'package.json', 'package-lock.json', 'sitemap.xml']);

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
// FAQ: una sola font per a la llista visible i el JSON-LD (per idioma: faq.json en ca, faq.es.json en es, WEB-T07)
const faq = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/faq.json'), 'utf8'));
const faqEs = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/faq.es.json'), 'utf8'));
const errors = [...validarFaq(faq).map(e => `faq.json: ${e}`), ...validarFaq(faqEs).map(e => `faq.es.json: ${e}`),
  ...validarLloc(lloc).map(e => `lloc.json: ${e}`)];
// faq.es.json ha de tenir les mateixes preguntes (cat, servei) en el mateix ordre que faq.json
if (faq.length !== faqEs.length || faq.some((f, i) => f.cat !== faqEs[i]?.cat || f.servei !== faqEs[i]?.servei))
  errors.push('faq.es.json: ha de tenir les mateixes preguntes (cat, servei) en el mateix ordre que faq.json');
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
  const clauSlug = `${n.cap.idioma || 'ca'}::${n.slug}`;
  if (slugs.has(clauSlug)) errors.push(`actualitat/${n.fitxer}: ja hi ha una altra notícia amb el títol curt «${n.slug}»`);
  slugs.add(clauSlug);
}
errors.push(...validarConjuntNoticies(totes));
const noticies = errors.length ? [] : publicades(totes, AVUI);
const targetes = noticies.filter(n => (n.cap.idioma || 'ca') === 'ca').map(targeta);
// Pàgines de servei (contingut/serveis.json): a la portada, les finestres dels serveis en mostren l'entradeta
const dadesServeis = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));

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
    : pagina(lloc, p, formularis, p.idioma === 'es' ? faqEs : faq, targetes, media, {}, dadesServeis);
  fs.writeFileSync(path.join(SORTIDA, p.fitxer), html);
  generades++;
}
// Els blocs només poden fer servir entrades de media.json que existeixin i siguin del tipus del filtre
for (const [f, p] of paginesBlocs) errors.push(...usosDeMedia([p], media).map(x => `${f}: ${x}`));
// Llegeix i valida les pàgines de sector (WEB-G01 / WEB-G02) abans dels serveis perquè aquests puguin enllaçar les publicades
const DIR_SECTORS = process.env.DIR_SECTORS ? path.resolve(process.env.DIR_SECTORS) : path.join(ARREL, 'contingut/sectors');
const sectors = [];
const slugsSectors = new Set();
if (fs.existsSync(DIR_SECTORS)) {
  for (const f of fs.readdirSync(DIR_SECTORS).filter(x => x.endsWith('.json')).sort()) {
    let s;
    try { s = JSON.parse(fs.readFileSync(path.join(DIR_SECTORS, f), 'utf8')); }
    catch (err) { errors.push(`sectors/${f}: JSON no vàlid (${err.message})`); continue; }
    const eSector = validarSector(s, f);
    if (eSector.length) { errors.push(...eSector.map(x => `sectors/${f}: ${x}`)); continue; }
    if (slugsSectors.has(s.slug)) { errors.push(`sectors/${f}: slug repetit «${s.slug}»`); continue; }
    slugsSectors.add(s.slug);
    sectors.push(s);
  }
}
errors.push(...validarConjuntSectors(sectors, totes));
const sectorsPublicats = sectors.filter(s => s.estat === 'publicat');
const sectorsVisibles = AMB_ESBORRANYS ? sectors : sectorsPublicats;

// 2b. Pàgines de servei i portada en castellà (port de marca/pagines/generar.py, encàrrec WEB-H04):
//     plantilles/serveis.mjs exporta paginesServei(lloc, dades, sectorsPublicats) → [[ruta relativa, html], …]
{
  const { paginesServei } = await import('../plantilles/serveis.mjs');
  const dades = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
  const eServeis = validarServeis(dades).map(e => `serveis.json: ${e}`);
  errors.push(...eServeis);
  for (const [rel, html] of eServeis.length ? [] : paginesServei(lloc, dades, sectorsPublicats)) {
    if (!/^[a-z0-9/_-]+\.html$/.test(rel)) { errors.push(`ruta de servei no vàlida: ${rel}`); continue; }
    fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
    fs.writeFileSync(path.join(SORTIDA, rel), html);
    generades++;
  }
}
// 2c. Actualitat: llistat, pàgines de les notícies amb cos i RSS (per idioma, només si n'hi ha de publicades)
const esbActualitat = AMB_ESBORRANYS && !errors.length ? esborranysActualitat(totes) : [];
const noticiesVisibles = [...noticies, ...esbActualitat];
if (noticies.length || esbActualitat.length) {
  const portada = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/portada.ca.json'), 'utf8'));
  const bloc = portada.blocs.find(b => b.tipus === 'actualitat');
  const ambLlistat = {
    ca: noticies.some(n => (n.cap.idioma || 'ca') === 'ca'),
    es: noticies.some(n => n.cap.idioma === 'es'),
  };
  if (noticies.length) {
    for (const [rel, contingut] of paginesActualitat(lloc, dadesServeis, noticies, bloc, { totesVisibles: noticiesVisibles, sectorsVisibles })) {
      fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
      fs.writeFileSync(path.join(SORTIDA, rel), contingut);
      if (rel.endsWith('.html')) generades++;
    }
  }
  if (esbActualitat.length) {
    for (const [rel, contingut] of paginesEsborranysActualitat(lloc, dadesServeis, esbActualitat, bloc, { totesVisibles: noticiesVisibles, ambLlistat, sectorsVisibles })) {
      fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
      fs.writeFileSync(path.join(SORTIDA, rel), contingut);
      if (rel.endsWith('.html')) generades++;
    }
  }
}
// 2d. Pàgines de sector (WEB-G01): contingut/sectors/<slug>.json → /sectors/<slug>/ i índex /sectors/
//     Els esborranys només es generen amb --esborranys o en vistes prèvies de Cloudflare (CF_PAGES_BRANCH != main).
if (!errors.length && sectors.length) {
  for (const [rel, html] of paginesSectors(lloc, dadesServeis, sectors, { ambEsborranys: AMB_ESBORRANYS, noticiesVisibles })) {
    fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
    fs.writeFileSync(path.join(SORTIDA, rel), html);
    generades++;
  }
}
// 2d-ter. Pàgina de reserva de trucada (WEB-G05a) i cerca interna (WEB-G05d): fora del mapa del lloc
if (!errors.length) {
  const [rel, html] = paginaReserva(lloc, dadesServeis);
  fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
  fs.writeFileSync(path.join(SORTIDA, rel), html);
  generades++;
  for (const [relCerca, htmlCerca] of paginesCerca(lloc, dadesServeis)) {
    fs.mkdirSync(path.dirname(path.join(SORTIDA, relCerca)), { recursive: true });
    fs.writeFileSync(path.join(SORTIDA, relCerca), htmlCerca);
    generades++;
  }
}
// 2d-bis. Taula de validació d'esborranys (WEB-G04a / WEB-G05b): /esborranys/, només en mode esborranys / vista prèvia.
if (AMB_ESBORRANYS && !errors.length) {
  const [rel, html] = paginaTaulaEsborranys(lloc, dadesServeis, {
    sectors,
    noticies: noticiesVisibles,
  });
  fs.mkdirSync(path.dirname(path.join(SORTIDA, rel)), { recursive: true });
  fs.writeFileSync(path.join(SORTIDA, rel), html);
  fs.writeFileSync(path.join(SORTIDA, 'esborranys/esborranys.js'), scriptTaulaEsborranys());
  generades++;
}
if (errors.length) { console.error('El contingut no és vàlid:\n  ' + errors.join('\n  ')); process.exit(1); }

// 2e. Mapa del lloc (WEB-T01 / WEB-G02): recorre els .html de SORTIDA (sense _previsualitzacio/) i hi inclou tota
//     pàgina amb <link rel="canonical"> i sense noindex, amb l'adreça canònica (sense .html final).
function atributHtml(etiqueta, nom) {
  const m = new RegExp(`\\b${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}
function urlIndexable(html) {
  const cap = (/<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html).replace(/<!--[\s\S]*?-->/g, '');
  for (const m of cap.matchAll(/<meta\b[^>]*>/gi)) {
    if ((atributHtml(m[0], 'name') || '').trim().toLowerCase() === 'robots'
      && /\bnoindex\b/i.test(atributHtml(m[0], 'content') || '')) return null;
  }
  for (const m of cap.matchAll(/<link\b[^>]*>/gi)) {
    const rel = atributHtml(m[0], 'rel');
    if (rel && rel.toLowerCase().split(/\s+/).includes('canonical')) {
      const href = atributHtml(m[0], 'href')?.trim();
      if (href) return href.replace(/&amp;/g, '&').replace(/\.html$/i, '');
    }
  }
  return null;
}
const desescaparHtml = s => String(s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
function recullPaginesIndexables(dir) {
  const pagines = new Map();
  (function recorre(rel = '') {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      if (!rel && e.name === '_previsualitzacio') continue;
      const r = path.join(rel, e.name);
      if (e.isDirectory()) recorre(r);
      else if (e.name.endsWith('.html')) {
        const html = fs.readFileSync(path.join(dir, r), 'utf8');
        const loc = urlIndexable(html);
        if (!loc || pagines.has(loc)) continue;
        const lang = (/<html\b[^>]*\blang\s*=\s*"([^"]+)"/i.exec(html)?.[1] || 'ca').toLowerCase().startsWith('es') ? 'es' : 'ca';
        const titolRaw = desescaparHtml(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '');
        const titol = titolRaw.replace(/\s*·\s*Madeinhuman$/i, '').trim() || titolRaw;
        const cap = (/<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? '').replace(/<!--[\s\S]*?-->/g, '');
        let descripcio = '';
        for (const m of cap.matchAll(/<meta\b[^>]*>/gi)) {
          if ((atributHtml(m[0], 'name') || '').trim().toLowerCase() === 'description') {
            descripcio = desescaparHtml(atributHtml(m[0], 'content') || '');
            break;
          }
        }
        const zona = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? html;
        const h2 = [...zona.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
          .map(m => desescaparHtml(m[1]))
          .filter(Boolean);
        let ruta = '/';
        try { ruta = new URL(loc).pathname; } catch { ruta = loc; }
        pagines.set(loc, { loc, url: ruta, lang, titol, descripcio, h2 });
      }
    }
  })();
  return [...pagines.values()].sort((a, b) => a.loc.localeCompare(b.loc));
}
function generarMapa(paginesIndexables, dates) {
  const escXml = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));
  const entrades = paginesIndexables.map(({ loc }) => {
    const lastmod = dates.get(loc);
    return `  <url>\n    <loc>${escXml(loc)}</loc>${lastmod ? `\n    <lastmod>${escXml(lastmod)}</lastmod>` : ''}\n  </url>\n`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entrades}</urlset>\n`;
}
const paginesIndexables = recullPaginesIndexables(SORTIDA);
const datesMapa = new Map([
  ...datesActualitatMapa(lloc.web, noticies),
  ...datesSectorsMapa(lloc.web, sectors),
]);
fs.writeFileSync(path.join(SORTIDA, 'sitemap.xml'), generarMapa(paginesIndexables, datesMapa));

// 2f. Índexs de cerca interna (WEB-G05d): només pàgines publicades i indexables, per idioma (ca i es).
for (const [lang, relIdx] of [['ca', 'cerca/index.json'], ['es', 'es/buscar/index.json']]) {
  const entrades = paginesIndexables
    .filter(p => p.lang === lang)
    .map(({ url, titol, descripcio, h2 }) => ({ url, titol, descripcio, h2 }));
  fs.mkdirSync(path.dirname(path.join(SORTIDA, relIdx)), { recursive: true });
  fs.writeFileSync(path.join(SORTIDA, relIdx), JSON.stringify(entrades, null, 2) + '\n');
}
// 2g. /llms.txt (WEB-G05e): només pàgines publicades i indexables (idèntic amb --esborranys).
fs.writeFileSync(path.join(SORTIDA, 'llms.txt'), generarLlmsTxt(lloc, paginesIndexables));

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
fs.writeFileSync(path.join(PREV, 'serveis.json'), JSON.stringify(dadesServeis));
// L'esquema són dades: el panell en genera els formularis sense dependre del codi de la web
fs.writeFileSync(path.join(PREV, 'esquema.json'), JSON.stringify(ESQUEMA, null, 2));
// Esquemes dels continguts que no són blocs de pàgina (els formularis del panell en surten igual)
fs.writeFileSync(path.join(PREV, 'esquema-continguts.json'), JSON.stringify({ noticia: CAMPS_NOTICIA, sector: CAMPS_SECTOR, xarxes: CAMPS_XARXES, servei: CAMPS_SERVEI, portada_es: CAMPS_PORTADA_ES, comu: CAMPS_COMU }, null, 2));
const programades = totes.filter(n => n.cap.estat === 'publicat' && n.cap.data > AVUI).length;
console.log(`dist/: ${generades} pàgines generades, ${copiats} fitxers copiats, ${Date.now() - t0} ms`
  + (totes.length ? ` · notícies: ${noticies.length} publicades${programades ? `, ${programades} programades` : ''}` : ''));
