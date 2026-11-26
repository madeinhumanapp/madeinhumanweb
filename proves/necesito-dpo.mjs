// Proves de la versió en castellà de «¿Necesito un DPO?» (WEB-T12), sense navegador:
// 1. es/necesito-dpo/src/avaluar.js és idèntic (bytes) al català: la lògica no canvia.
// 2. dades/regles.js de totes dues versions té les mateixes claus i identificadors
//    (mateixes preguntes, opcions i veredictes en el mateix ordre, mateixos articles).
// 3. A dist/, la pàgina castellana té lang="es", canònica pròpia i parell hreflang
//    recíproc amb la pàgina catalana.
// Ús: npm run construir && node proves/necesito-dpo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const CA_CAN = 'https://madeinhuman.cat/necessito-dpo/';
const ES_CAN = 'https://madeinhuman.cat/es/necesito-dpo/';

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.log('✗ dist/index.html no existeix: executa abans npm run construir');
  process.exit(1);
}

// 1. avaluar.js idèntic a totes dues versions
const caAvaluar = fs.readFileSync(path.join(ARREL, 'necessito-dpo/src/avaluar.js'), 'utf8');
const esAvaluar = fs.readFileSync(path.join(ARREL, 'es/necesito-dpo/src/avaluar.js'), 'utf8');
ok('es/necesito-dpo/src/avaluar.js és idèntic al català', caAvaluar === esAvaluar);

// 2. regles.js: mateixes claus i identificadors, en el mateix ordre
const ca = await import(new URL('../necessito-dpo/dades/regles.js', import.meta.url).href);
const es = await import(new URL('../es/necesito-dpo/dades/regles.js', import.meta.url).href);
const mateixesClaus = (a, b) => JSON.stringify(Object.keys(a ?? {})) === JSON.stringify(Object.keys(b ?? {}));
const err = [];
if (ca.VERSIO !== es.VERSIO) err.push(`VERSIO: «${ca.VERSIO}» vs «${es.VERSIO}»`);
if (ca.PREGUNTES.length !== es.PREGUNTES.length) err.push(`PREGUNTES: ${ca.PREGUNTES.length} vs ${es.PREGUNTES.length}`);
else ca.PREGUNTES.forEach((p, i) => {
  const q = es.PREGUNTES[i];
  if (p.id !== q.id) err.push(`PREGUNTES[${i}].id: «${p.id}» vs «${q.id}»`);
  if (JSON.stringify(p.opcions) !== JSON.stringify(q.opcions)) err.push(`PREGUNTES[${i}] (${p.id}): opcions diferents`);
  if (JSON.stringify(p.nomesSi ?? null) !== JSON.stringify(q.nomesSi ?? null)) err.push(`PREGUNTES[${i}] (${p.id}): nomesSi diferent`);
  if ((p.tipus ?? null) !== (q.tipus ?? null)) err.push(`PREGUNTES[${i}] (${p.id}): tipus diferent`);
});
if (ca.SECTORS.length !== es.SECTORS.length) err.push(`SECTORS: ${ca.SECTORS.length} vs ${es.SECTORS.length}`);
else ca.SECTORS.forEach((s, i) => {
  const t = es.SECTORS[i];
  if (s.id !== t.id) err.push(`SECTORS[${i}].id: «${s.id}» vs «${t.id}»`);
  if (s.article !== t.article) err.push(`SECTORS[${i}] (${s.id}): article diferent`);
  if (Boolean(s.condicio) !== Boolean(t.condicio)) err.push(`SECTORS[${i}] (${s.id}): condicio diferent`);
});
if (ca.SECTOR_CAP.id !== es.SECTOR_CAP.id) err.push(`SECTOR_CAP.id: «${ca.SECTOR_CAP.id}» vs «${es.SECTOR_CAP.id}»`);
if (!mateixesClaus(ca.ETIQUETES_OPCIO, es.ETIQUETES_OPCIO)) err.push('ETIQUETES_OPCIO: claus diferents');
if (!mateixesClaus(ca.MOTIUS, es.MOTIUS)) err.push('MOTIUS: claus diferents');
else for (const k of Object.keys(ca.MOTIUS)) {
  if (ca.MOTIUS[k].article !== es.MOTIUS[k].article) err.push(`MOTIUS.${k}: article diferent`);
}
if (!mateixesClaus(ca.VEREDICTES, es.VEREDICTES)) err.push('VEREDICTES: claus diferents');
else for (const k of Object.keys(ca.VEREDICTES)) {
  if (ca.VEREDICTES[k].passos.length !== es.VEREDICTES[k].passos.length) err.push(`VEREDICTES.${k}: diferent nombre de passos`);
}
if (!mateixesClaus(ca.TEXTOS, es.TEXTOS)) err.push('TEXTOS: claus diferents');
ok('dades/regles.js de totes dues versions té les mateixes claus i identificadors (mateixes preguntes, opcions i veredictes en el mateix ordre)',
  err.length === 0, err.join(' · '));

// 3. A dist/: pàgina castellana amb lang="es", canònica pròpia i parell hreflang recíproc
function atributHtml(etiqueta, nom) {
  const m = new RegExp(`\\b${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}
function analitzarHtml(html) {
  const net = html.replace(/<!--[\s\S]*?-->/g, '');
  const lang = atributHtml(/<html\b[^>]*>/i.exec(net)?.[0] || '', 'lang')?.trim().toLowerCase() || null;
  const cap = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(net)?.[1] ?? net;
  let canonica = null;
  const alternatives = [];
  for (const m of cap.matchAll(/<link\b[^>]*>/gi)) {
    const rels = (atributHtml(m[0], 'rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
    const href = atributHtml(m[0], 'href')?.trim().replace(/&amp;/g, '&') || null;
    if (rels.includes('canonical') && href && !canonica) canonica = href;
    const hreflang = atributHtml(m[0], 'hreflang')?.trim().toLowerCase() || null;
    if (rels.includes('alternate') && hreflang) alternatives.push({ hreflang, href });
  }
  return { lang, canonica, alternatives };
}

const esPath = path.join(DIST, 'es/necesito-dpo/index.html');
const caPath = path.join(DIST, 'necessito-dpo/index.html');
if (!fs.existsSync(esPath) || !fs.existsSync(caPath)) {
  console.log('✗ falta necessito-dpo/index.html o es/necesito-dpo/index.html a dist/: executa abans npm run construir');
  process.exit(1);
}
const dEs = analitzarHtml(fs.readFileSync(esPath, 'utf8'));
const dCa = analitzarHtml(fs.readFileSync(caPath, 'utf8'));
const altEs = Object.fromEntries(dEs.alternatives.map(a => [a.hreflang, a.href]));
const altCa = Object.fromEntries(dCa.alternatives.map(a => [a.hreflang, a.href]));

ok('dist/es/necesito-dpo/index.html té lang="es"', dEs.lang === 'es', `lang=${dEs.lang}`);
ok(`dist/es/necesito-dpo/index.html té la canònica ${ES_CAN}`, dEs.canonica === ES_CAN, `trobada: ${dEs.canonica}`);
ok('hreflang es → la pròpia canònica', altEs['es'] === ES_CAN, JSON.stringify(altEs));
ok(`hreflang ca → ${CA_CAN}`, altEs['ca'] === CA_CAN, JSON.stringify(altEs));
ok(`hreflang x-default → ${CA_CAN}`, altEs['x-default'] === CA_CAN, JSON.stringify(altEs));
ok(`la pàgina catalana declara hreflang es → ${ES_CAN} (parell recíproc)`, altCa['es'] === ES_CAN, JSON.stringify(altCa));
ok(`la pàgina catalana declara ca i x-default → ${CA_CAN}`, altCa['ca'] === CA_CAN && altCa['x-default'] === CA_CAN, JSON.stringify(altCa));

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de «Necesito un DPO» correctes');
process.exit(fallades ? 1 : 0);
