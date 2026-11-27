// Proves del mapa del lloc (WEB-T01), sense navegador: llegeix dist/ i comprova que dist/sitemap.xml
// inclou totes les pàgines indexables (i cap noindex), sense .html ni duplicats, ordenades, amb lastmod
// només a /actualitat/ i a les notícies amb pàgina, i en XML vàlid.
// Ús: npm run construir && npm run sitemap
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const FITXER = path.join(DIST, 'sitemap.xml');
const WEB = 'https://madeinhuman.cat';

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(FITXER)) {
  console.log('✗ dist/sitemap.xml no existeix: executa abans npm run construir');
  process.exit(1);
}

const xml = fs.readFileSync(FITXER, 'utf8');

// 1. Estructura XML vàlida
const capValid = xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
  && xml.trimEnd().endsWith('</urlset>');
ok('capçalera XML i etiqueta urlset vàlides', capValid);

const oberts = (xml.match(/<url>/g) || []).length;
const tancats = (xml.match(/<\/url>/g) || []).length;
const interior = /<urlset[^>]*>([\s\S]*)<\/urlset>/.exec(xml)?.[1] ?? '';
const blocs = [...interior.matchAll(/<url>([\s\S]*?)<\/url>/g)];
const resta = interior.replace(/<url>[\s\S]*?<\/url>/g, '').trim();
ok('etiquetes <url> i </url> equilibrades i sense contingut estrany',
  oberts > 0 && oberts === tancats && blocs.length === oberts && resta === '',
  `oberts=${oberts}, tancats=${tancats}, blocs=${blocs.length}`);

ok('sense changefreq ni priority', !/<changefreq>|<priority>/i.test(xml));

const desescaparXml = s => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e]));
const teAmpersandCru = s => /&(?!amp;|lt;|gt;|quot;|apos;)/.test(s);

const entrades = [];
const errorsXml = [];
for (const [, cos] of blocs) {
  const locs = [...cos.matchAll(/<loc>([^<]*)<\/loc>/g)];
  const mods = [...cos.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)];
  const net = cos.replace(/<loc>[^<]*<\/loc>/g, '').replace(/<lastmod>[^<]*<\/lastmod>/g, '').trim();
  if (locs.length !== 1 || mods.length > 1 || net !== '') {
    errorsXml.push(`bloc <url> mal format: ${cos.trim()}`);
    continue;
  }
  const locCru = locs[0][1];
  const modCru = mods[0]?.[1] ?? null;
  if (teAmpersandCru(locCru) || (modCru && teAmpersandCru(modCru))) {
    errorsXml.push(`caràcter & sense escapar a ${locCru}`);
  }
  const loc = desescaparXml(locCru);
  try {
    new URL(loc);
  } catch {
    errorsXml.push(`URL no vàlida: ${loc}`);
  }
  if (modCru && !/^\d{4}-\d{2}-\d{2}$/.test(modCru)) {
    errorsXml.push(`lastmod no vàlid a ${loc}: ${modCru}`);
  }
  entrades.push({ loc, lastmod: modCru });
}
ok('cada entrada <url> té una URL vàlida i XML ben format', errorsXml.length === 0 && entrades.length === blocs.length, errorsXml.slice(0, 3).join(' · '));

const locs = entrades.map(e => e.loc);
const locsSet = new Set(locs);

// 2. Format de les adreces, unicitat i ordre
ok('cap adreça acaba en .html (i /diagnostic.html no hi és)',
  locs.every(u => !/\.html$/i.test(u)) && !locsSet.has(`${WEB}/diagnostic.html`),
  locs.filter(u => /\.html$/i.test(u)).join(', '));
ok(`totes les adreces comencen per ${WEB}/`,
  locs.every(u => u.startsWith(`${WEB}/`)),
  locs.filter(u => !u.startsWith(`${WEB}/`)).join(', '));
ok('sense duplicats', locsSet.size === locs.length, `${locs.length} entrades, ${locsSet.size} úniques`);
ok('ordenades alfabèticament', locs.every((u, i) => i === 0 || locs[i - 1] < u));
ok('cap ruta de _previsualitzacio/', locs.every(u => !u.includes('/_previsualitzacio')));

// 3. Correspondència exacta amb les pàgines indexables de dist/
function atributHtml(etiqueta, nom) {
  const m = new RegExp(`\\b${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}
function analitzarHtml(html) {
  const cap = (/<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html).replace(/<!--[\s\S]*?-->/g, '');
  let noindex = false;
  for (const m of cap.matchAll(/<meta\b[^>]*>/gi)) {
    if ((atributHtml(m[0], 'name') || '').trim().toLowerCase() === 'robots'
      && /\bnoindex\b/i.test(atributHtml(m[0], 'content') || '')) {
      noindex = true;
      break;
    }
  }
  let canonica = null;
  for (const m of cap.matchAll(/<link\b[^>]*>/gi)) {
    const rel = atributHtml(m[0], 'rel');
    if (rel && rel.toLowerCase().split(/\s+/).includes('canonical')) {
      const href = atributHtml(m[0], 'href')?.trim();
      if (href) { canonica = href.replace(/&amp;/g, '&'); break; }
    }
  }
  return { canonica, noindex };
}

const indexables = new Set();
const prohibides = new Set();
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(DIST, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = path.join(rel, e.name);
    if (e.isDirectory()) recorre(r);
    else if (e.name.endsWith('.html')) {
      const { canonica, noindex } = analitzarHtml(fs.readFileSync(path.join(DIST, r), 'utf8'));
      if (canonica && !noindex) {
        indexables.add(canonica.replace(/\.html$/i, ''));
      } else {
        if (canonica) {
          prohibides.add(canonica);
          prohibides.add(canonica.replace(/\.html$/i, ''));
        }
        const rutaWeb = '/' + r.split(path.sep).join('/');
        prohibides.add(`${WEB}${rutaWeb}`);
        prohibides.add(`${WEB}${rutaWeb.replace(/\/index\.html$/, '/').replace(/\.html$/, '')}`);
      }
    }
  }
})();

const falten = [...indexables].filter(u => !locsSet.has(u));
const sobren = locs.filter(u => !indexables.has(u));
ok(`totes les pàgines indexables de dist/ (${indexables.size}) són al mapa i no en sobra cap`,
  falten.length === 0 && sobren.length === 0,
  [falten.length ? `falten: ${falten.join(', ')}` : '', sobren.length ? `sobren: ${sobren.join(', ')}` : ''].filter(Boolean).join(' · '));

const colades = locs.filter(u => prohibides.has(u));
ok('cap pàgina noindex o sense canònica no és al mapa', colades.length === 0, colades.join(', '));

// 4. Regla de lastmod: només /actualitat/, les notícies amb pàgina i les pàgines de sector
const actualitat = entrades.find(e => e.loc === `${WEB}/actualitat/`);
const esLlistat = u => u === `${WEB}/actualitat/` || u === `${WEB}/es/actualidad/`;
ok('el llistat /actualitat/ hi és amb lastmod', Boolean(actualitat && actualitat.lastmod));

const esNoticia = u => /^https:\/\/madeinhuman\.cat\/(actualitat|es\/actualidad)\/[^/]+\/$/.test(u);
// Les pàgines de sector (i els seus índexs) poden portar lastmod = data_revisio (WEB-G02)
const esSector = loc => /^\/(es\/sectores|sectors)\//.test(loc.slice(WEB.length));
const lastmodIndegut = entrades.filter(e => e.lastmod && !esLlistat(e.loc) && !esNoticia(e.loc) && !esSector(e.loc)).map(e => e.loc);
const noticiaSenseLastmod = entrades.filter(e => esNoticia(e.loc) && !e.lastmod).map(e => e.loc);
ok('només el llistat d\'actualitat, les notícies amb pàgina i els sectors tenen lastmod',
  lastmodIndegut.length === 0 && noticiaSenseLastmod.length === 0,
  [lastmodIndegut.length ? `lastmod indegut: ${lastmodIndegut.join(', ')}` : '',
    noticiaSenseLastmod.length ? `notícia sense lastmod: ${noticiaSenseLastmod.join(', ')}` : ''].filter(Boolean).join(' · '));

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions del mapa del lloc correctes');
process.exit(fallades ? 1 : 0);
