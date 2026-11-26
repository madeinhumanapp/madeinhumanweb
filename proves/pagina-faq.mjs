// Proves de la pàgina de preguntes freqüents (/preguntes-frequents/), amb navegador: les preguntes són a l'HTML (SEO)
// i es llegeixen totes sense JavaScript; les pestanyes filtren i n'obren una; cada resposta amb servei relacionat
// enllaça la pàgina del servei; el FAQPage del JSON-LD és aquí i no a la portada; el menú hi porta; sense errors ni CSP.
// Ús: npm run construir && node proves/pagina-faq.mjs
//     NAVEGADOR=/ruta/a/chrome si Playwright no té el seu navegador instal·lat (npm run navegador)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { enriquit } from '../plantilles/text.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

const FITXER = path.join(DIST, 'preguntes-frequents/index.html');
if (!fs.existsSync(FITXER)) { console.log('✗ dist/preguntes-frequents/index.html no existeix: executa abans npm run construir'); process.exit(1); }
const faq = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/faq.json'), 'utf8'));
const serveis = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 1) HTML generat (el que llegeix Google, sense JavaScript)
const html = fs.readFileSync(FITXER, 'utf8');
const portada = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
ok(`totes les preguntes (${faq.length}) són a l'HTML de la pàgina`, faq.every(f => html.includes(esc(f.pregunta))) && (html.match(/class="faq-item/g) || []).length === faq.length);
const ambServei = faq.filter(f => f.servei);
ok(`les ${ambServei.length} respostes amb servei relacionat enllacen la pàgina del servei`, ambServei.every(f => html.includes(`href="/serveis/${serveis.SLUG.ca[f.servei]}/"`)) && (html.match(/class="faq-servei"/g) || []).length === ambServei.length);
const jsonld = t => [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const fp = jsonld(html).find(j => j['@type'] === 'FAQPage');
ok('el FAQPage del JSON-LD és a la pàgina de preguntes freqüents, amb les destacades', fp && fp.mainEntity.length === faq.filter(f => f.destacada).length && fp.mainEntity.length > 0);
ok('la portada ja no porta el FAQPage', !jsonld(portada).some(j => j['@type'] === 'FAQPage'));
ok('el menú i el peu porten a /preguntes-frequents/ (i no a /#faq)', (portada.match(/href="\/preguntes-frequents\/"/g) || []).length >= 2 && !/href="\/?#faq"/.test(portada.replace(/id="faq"/g, '')));
ok('la pàgina té canònica i és al mapa del lloc', html.includes('<link rel="canonical" href="https://madeinhuman.cat/preguntes-frequents/"') && fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8').includes('https://madeinhuman.cat/preguntes-frequents/'));
ok('els fulls d\'estil i els scripts tenen rutes absolutes (la pàgina és dins d\'una carpeta)', !/<link rel="stylesheet" href="(?!\/)/.test(html) && !/<script src="(?!\/)/.test(html));
const blocFaq = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/preguntes-frequents.json'), 'utf8')).blocs.find(b => b.tipus === 'faq');
const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
ok('la pàgina té exactament un <h1> i és el titular del bloc faq', h1.length === 1 && h1[0][1] === enriquit(blocFaq.titol), `h1 trobats: ${h1.length}; contingut: ${h1[0]?.[1]}`);

// 1b) Pàgina en castellà (/es/preguntas-frecuentes/, WEB-T07): mateixes comprovacions, en castellà
const FITXER_ES = path.join(DIST, 'es/preguntas-frecuentes/index.html');
ok('dist/es/preguntas-frecuentes/index.html existeix', fs.existsSync(FITXER_ES));
const faqEs = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/faq.es.json'), 'utf8'));
const htmlEs = fs.existsSync(FITXER_ES) ? fs.readFileSync(FITXER_ES, 'utf8') : '';
ok(`la pàgina en castellà té lang="es" i totes les preguntes (${faqEs.length}) a l'HTML`,
  /<html lang="es">/.test(htmlEs) && faqEs.every(f => htmlEs.includes(esc(f.pregunta))) && (htmlEs.match(/class="faq-item/g) || []).length === faqEs.length);
const ambServeiEs = faqEs.filter(f => f.servei);
ok(`les ${ambServeiEs.length} respostes amb servei enllacen a /es/servicios/`,
  ambServeiEs.every(f => htmlEs.includes(`href="/es/servicios/${serveis.SLUG.es[f.servei]}/"`)) && (htmlEs.match(/class="faq-servei"/g) || []).length === ambServeiEs.length);
const fpEs = jsonld(htmlEs).find(j => j['@type'] === 'FAQPage');
const destacadesEs = faqEs.filter(f => f.destacada);
ok('el FAQPage del JSON-LD és a la pàgina en castellà, amb les destacades en castellà',
  !!fpEs && fpEs.mainEntity.length === destacadesEs.length && destacadesEs.length > 0
  && fpEs.mainEntity.every((q, i) => q.name === destacadesEs[i].pregunta));
ok('la pàgina en castellà té canònica, parell hreflang amb la catalana i és al mapa del lloc',
  htmlEs.includes('<link rel="canonical" href="https://madeinhuman.cat/es/preguntas-frecuentes/"')
  && htmlEs.includes('<link rel="alternate" hreflang="es" href="https://madeinhuman.cat/es/preguntas-frecuentes/"')
  && htmlEs.includes('<link rel="alternate" hreflang="ca" href="https://madeinhuman.cat/preguntes-frequents/"')
  && htmlEs.includes('<link rel="alternate" hreflang="x-default" href="https://madeinhuman.cat/preguntes-frequents/"')
  && html.includes('<link rel="alternate" hreflang="es" href="https://madeinhuman.cat/es/preguntas-frecuentes/"')
  && fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8').includes('https://madeinhuman.cat/es/preguntas-frecuentes/'));
const blocFaqEs = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/preguntas-frecuentes.json'), 'utf8')).blocs.find(b => b.tipus === 'faq');
const h1Es = [...htmlEs.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
ok('la pàgina en castellà té exactament un <h1> (el titular del bloc faq)', h1Es.length === 1 && h1Es[0][1] === enriquit(blocFaqEs.titol), `h1 trobats: ${h1Es.length}; contingut: ${h1Es[0]?.[1]}`);
ok('el menú en castellà porta a /es/preguntas-frecuentes/', (htmlEs.match(/href="\/es\/preguntas-frecuentes\/"/g) || []).length >= 2);

// 2) Navegador
const csp = (() => {
  let dins = false;
  for (const l of fs.readFileSync(path.join(DIST, '_headers'), 'utf8').split('\n')) {
    if (/^\/\*\s*$/.test(l)) { dins = true; continue; }
    if (dins && /^\S/.test(l)) break;
    const m = dins && /^\s+Content-Security-Policy:\s*(.+)$/.exec(l);
    if (m) return m[1].trim();
  }
  return null;
})();
const TIPUS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const servidor = http.createServer((req, res) => {
  let f = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (f.endsWith('/')) f += 'index.html';
  const ruta = path.join(DIST, f);
  if (!ruta.startsWith(DIST) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404).end(); return; }
  const cap = { 'Content-Type': TIPUS[path.extname(ruta)] || 'application/octet-stream' };
  if (csp && ruta.endsWith('.html')) cap['Content-Security-Policy'] = csp;
  res.writeHead(200, cap);
  fs.createReadStream(ruta).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const URL_FAQ = `http://127.0.0.1:${servidor.address().port}/preguntes-frequents/`;
const navegador = await chromium.launch(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {});

for (const v of [{ nom: 'mòbil 375', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }, { nom: 'escriptori 1280', viewport: { width: 1280, height: 800 } }]) {
  const ctx = await navegador.newContext(v);
  await ctx.addInitScript(() => {
    try { localStorage.setItem('cookie_consent', 'rejected'); } catch (e) {}
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const respostes = [];
  p.on('response', r => { if (r.status() >= 400) respostes.push(`${r.status()} ${r.url()}`); });
  await p.goto(URL_FAQ, { waitUntil: 'networkidle' });
  const estat = () => p.evaluate(() => [...document.querySelectorAll('.faq-item')].filter(it => !it.hidden).map(it => ({
    cat: it.dataset.cat, num: it.querySelector('.num').textContent, obert: it.classList.contains('open'), aria: it.querySelector('.faq-q').getAttribute('aria-expanded') })));
  const e0 = await estat();
  ok(`${v.nom}: amb JavaScript, totes visibles i només la primera oberta`, e0.length === faq.length && e0[0].obert && e0.slice(1).every(x => !x.obert) && e0.every(x => x.aria === String(x.obert)), JSON.stringify(e0.slice(0, 3)));
  ok(`${v.nom}: els estils es carreguen (cap fitxer no trobat)`, !respostes.length && await p.evaluate(() => getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)'), respostes.join(' · '));
  await p.click('#faqTabs .tab[data-cat="ia"]');
  const e1 = await estat();
  ok(`${v.nom}: la pestanya IA només mostra les d'IA, numerades des de 01, amb la primera oberta`, e1.length === faq.filter(f => f.cat === 'ia').length && e1.every(x => x.cat === 'ia') && e1[0].num === '01' && e1[0].obert, JSON.stringify(e1));
  await p.locator('.faq-item:not([hidden]) .faq-q').nth(1).click();
  const e2 = await estat();
  ok(`${v.nom}: en clicar una pregunta s'obre i es tanca l'anterior`, !e2[0].obert && e2[1].obert, JSON.stringify(e2));
  await p.locator('.faq-item:not([hidden]) .faq-q').nth(1).click();
  ok(`${v.nom}: en tornar-hi a clicar es tanca`, (await estat()).every(x => !x.obert));
  ok(`${v.nom}: cap desbordament horitzontal`, !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
  const infr = await p.evaluate(() => window.__infraccions);
  ok(`${v.nom}: cap error de consola ni infracció de CSP`, !errors.length && !infr.length, [...errors, ...infr].slice(0, 3).join(' · '));
  await ctx.close();
}
{
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(URL_FAQ, { waitUntil: 'load' });
  const r = await p.evaluate(() => [...document.querySelectorAll('.faq-item')].map(it => !it.hidden && it.classList.contains('open') && it.querySelector('.faq-a').getBoundingClientRect().height > 10));
  ok('sense JavaScript, totes les respostes es veuen', r.length === faq.length && r.every(Boolean), JSON.stringify(r));
  await ctx.close();
}

await navegador.close();
servidor.close();
console.log(fallades ? `✗ ${fallades} comprovacions de la pàgina de preguntes freqüents han fallat` : 'totes les comprovacions de la pàgina de preguntes freqüents correctes');
process.exit(fallades ? 1 : 0);
