// Proves dels textos legals en castellà (WEB-T09), sense navegador: a dist/ han d'existir les tres
// pàgines /es/… amb lang="es", canònica pròpia, noindex, parell hreflang recíproc amb la pàgina
// catalana i sense cap marca {{…}} sense substituir; i el peu de /es/ ha d'enllaçar-les a les tres.
// Ús: npm run construir && node proves/legal-castella.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
if (!fs.existsSync(DIST)) { console.error('✗ Falta dist/: executa primer npm run construir'); process.exit(1); }

let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

function atributHtml(etiqueta, nom) {
  const m = new RegExp(`\\b${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}
function analitzarHtml(html) {
  const net = html.replace(/<!--[\s\S]*?-->/g, '');
  const lang = atributHtml(/<html\b[^>]*>/i.exec(net)?.[0] || '', 'lang')?.trim().toLowerCase() || null;
  const cap = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(net)?.[1] ?? net;
  let canonica = null, robots = null;
  const alternatives = [];
  for (const m of cap.matchAll(/<meta\b[^>]*>/gi)) {
    if ((atributHtml(m[0], 'name') || '').trim().toLowerCase() === 'robots') robots = atributHtml(m[0], 'content') || '';
  }
  for (const m of cap.matchAll(/<link\b[^>]*>/gi)) {
    const rels = (atributHtml(m[0], 'rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
    const href = atributHtml(m[0], 'href')?.trim().replace(/&amp;/g, '&') || null;
    if (rels.includes('canonical') && href && !canonica) canonica = href;
    const hreflang = atributHtml(m[0], 'hreflang')?.trim().toLowerCase() || null;
    if (rels.includes('alternate') && hreflang) alternatives.push({ hreflang, href });
  }
  return { lang, canonica, robots, alternatives };
}

const PARELL = [
  { es: 'es/aviso-legal/index.html', ca: 'avis-legal.html',
    esCan: 'https://madeinhuman.cat/es/aviso-legal/', caCan: 'https://madeinhuman.cat/avis-legal.html' },
  { es: 'es/politica-privacidad/index.html', ca: 'politica-privacitat.html',
    esCan: 'https://madeinhuman.cat/es/politica-privacidad/', caCan: 'https://madeinhuman.cat/politica-privacitat.html' },
  { es: 'es/politica-cookies/index.html', ca: 'politica-cookies.html',
    esCan: 'https://madeinhuman.cat/es/politica-cookies/', caCan: 'https://madeinhuman.cat/politica-cookies.html' },
];

for (const p of PARELL) {
  const existeix = fs.existsSync(path.join(DIST, p.es));
  ok(`${p.es} existeix a dist/`, existeix);
  if (!existeix) continue;
  const html = fs.readFileSync(path.join(DIST, p.es), 'utf8');
  const d = analitzarHtml(html);
  const alt = Object.fromEntries(d.alternatives.map(a => [a.hreflang, a.href]));
  ok(`${p.es}: lang="es"`, d.lang === 'es', `lang=${d.lang}`);
  ok(`${p.es}: canònica ${p.esCan}`, d.canonica === p.esCan, `trobada: ${d.canonica}`);
  ok(`${p.es}: noindex`, /\bnoindex\b/i.test(d.robots || ''), `robots=${d.robots}`);
  ok(`${p.es}: hreflang es → la pròpia canònica`, alt['es'] === p.esCan, JSON.stringify(alt));
  ok(`${p.es}: hreflang ca → ${p.caCan}`, alt['ca'] === p.caCan, JSON.stringify(alt));
  ok(`${p.es}: hreflang x-default → ${p.caCan}`, alt['x-default'] === p.caCan, JSON.stringify(alt));
  ok(`${p.es}: sense cap marca {{…}} sense substituir`, !/\{\{[^}]*\}\}/.test(html));
  const caHtml = fs.readFileSync(path.join(DIST, p.ca), 'utf8');
  const dc = analitzarHtml(caHtml);
  const altCa = Object.fromEntries(dc.alternatives.map(a => [a.hreflang, a.href]));
  ok(`${p.ca}: hreflang es → ${p.esCan} (parell recíproc)`, altCa['es'] === p.esCan, JSON.stringify(altCa));
  ok(`${p.ca}: hreflang ca i x-default → ${p.caCan}`, altCa['ca'] === p.caCan && altCa['x-default'] === p.caCan, JSON.stringify(altCa));
}

const esIndex = path.join(DIST, 'es', 'index.html');
ok('dist/es/index.html existeix', fs.existsSync(esIndex));
if (fs.existsSync(esIndex)) {
  const html = fs.readFileSync(esIndex, 'utf8');
  for (const u of ['/es/aviso-legal/', '/es/politica-privacidad/', '/es/politica-cookies/']) {
    ok(`el peu de /es/ enllaça a ${u}`, html.includes(`href="${u}"`));
  }
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions dels textos legals en castellà correctes');
process.exit(fallades ? 1 : 0);
