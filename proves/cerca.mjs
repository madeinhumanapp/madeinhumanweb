// Proves de la cerca interna sense tercers (WEB-G05d):
// 1) Comprovacions estàtiques (sense navegador) dels índexs /cerca/index.json i /es/buscar/index.json,
//    paritat amb --esborranys (cap esborrany ni pàgina noindex), i estructura de /cerca/ i /es/buscar/.
// 2) Comprovacions de la interfície amb Playwright (sense internet, servidor local amb CSP real de _headers):
//    cerca sense accents, ?q= a l'URL i botó «Enrere», estat buit amb enllaç a /#contacte, i 0 errors ni infraccions CSP.
// Ús: npm run construir && node proves/cerca.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const ORIGEN = 'https://madeinhuman.cat';

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

for (const f of ['cerca/index.html', 'es/buscar/index.html', 'cerca/index.json', 'es/buscar/index.json', 'cerca.js', 'sitemap.xml']) {
  if (!fs.existsSync(path.join(DIST, f))) {
    console.log(`✗ falta dist/${f}: executa abans npm run construir`);
    process.exit(1);
  }
}

// 1. Comprovacions estàtiques dels índexs i les pàgines
const idxCaRaw = fs.readFileSync(path.join(DIST, 'cerca/index.json'), 'utf8');
const idxEsRaw = fs.readFileSync(path.join(DIST, 'es/buscar/index.json'), 'utf8');
const idxCa = JSON.parse(idxCaRaw);
const idxEs = JSON.parse(idxEsRaw);
const mapaXml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locsMapa = new Set([...mapaXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname));

ok('els índexs /cerca/index.json i /es/buscar/index.json són llistes no buides',
  Array.isArray(idxCa) && idxCa.length > 0 && Array.isArray(idxEs) && idxEs.length > 0,
  `ca=${idxCa.length}, es=${idxEs.length}`);

const tots = [...idxCa, ...idxEs];
const campsValids = tots.every(p =>
  typeof p.url === 'string' && p.url.startsWith('/') && !p.url.endsWith('.html')
  && typeof p.titol === 'string' && p.titol.length > 0
  && typeof p.descripcio === 'string'
  && Array.isArray(p.h2)
  && Object.keys(p).sort().join(',') === 'descripcio,h2,titol,url');
ok('cada entrada té exactament { url, titol, descripcio, h2 } sense cos sencer ni .html', campsValids);

const totesAlMapa = tots.every(p => locsMapa.has(p.url));
const sumIgualMapa = tots.length === locsMapa.size;
const capNoindex = tots.every(p => !/\/(404|reserva|cerca|es\/buscar|esborranys|recollida)\b/.test(p.url));
ok('els índexs coincideixen exactament amb les pàgines publicades i indexables del mapa del lloc (cap noindex)',
  totesAlMapa && sumIgualMapa && capNoindex,
  `index=${tots.length}, sitemap=${locsMapa.size}`);

// Comprova que en mode --esborranys els índexs de cerca són idèntics als de producció (cap esborrany)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cerca-'));
try {
  const outEsb = path.join(TMP, 'dist-esb');
  execFileSync('node', ['eines/construir.mjs', '--esborranys', '--sortida', outEsb], {
    cwd: ARREL, env: { ...process.env, CF_PAGES_BRANCH: '' }, stdio: 'pipe',
  });
  const esbCa = fs.readFileSync(path.join(outEsb, 'cerca/index.json'), 'utf8');
  const esbEs = fs.readFileSync(path.join(outEsb, 'es/buscar/index.json'), 'utf8');
  ok('amb --esborranys, /cerca/index.json i /es/buscar/index.json són idèntics als de producció (cap esborrany)',
    esbCa === idxCaRaw && esbEs === idxEsRaw);
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

const htmlCa = fs.readFileSync(path.join(DIST, 'cerca/index.html'), 'utf8');
const htmlEs = fs.readFileSync(path.join(DIST, 'es/buscar/index.html'), 'utf8');
ok('/cerca/ i /es/buscar/ tenen noindex, follow, hreflang recíproc, <noscript> i queden fora del mapa del lloc',
  htmlCa.includes('<meta name="robots" content="noindex, follow" />')
  && htmlEs.includes('<meta name="robots" content="noindex, follow" />')
  && htmlCa.includes('href="https://madeinhuman.cat/es/buscar/"')
  && htmlEs.includes('href="https://madeinhuman.cat/cerca/"')
  && htmlCa.includes('<noscript>') && htmlEs.includes('<noscript>')
  && !locsMapa.has('/cerca/') && !locsMapa.has('/es/buscar/'));

// 2. Comprovacions d'interfície amb Playwright (amb les capçaleres reals de _headers)
function llegirCsp(arrelDir) {
  const regles = [];
  let actual = null;
  for (const linia of fs.readFileSync(path.join(arrelDir, '_headers'), 'utf8').split('\n')) {
    const neta = linia.replace(/\r$/, '');
    if (!neta.trim() || neta.trim().startsWith('#')) continue;
    if (/^\S/.test(neta)) { actual = { patro: neta.trim(), csp: null, reset: false }; regles.push(actual); continue; }
    if (!actual) continue;
    if (/^\s+!\s*Content-Security-Policy\s*$/i.test(neta)) actual.reset = true;
    const m = /^\s+Content-Security-Policy:\s*(.+)$/i.exec(neta);
    if (m) actual.csp = m[1].trim();
  }
  return ruta => {
    let csp = null;
    for (const r of regles) {
      const re = new RegExp('^' + r.patro.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      if (!re.test(ruta)) continue;
      if (r.reset) csp = null;
      if (r.csp) csp = r.csp;
    }
    return csp;
  };
}

const TIPUS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json',
};
function fitxerDe(url) {
  const p = decodeURIComponent(new URL(url).pathname);
  let f = path.join(DIST, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  return (f === DIST || f.startsWith(DIST + path.sep)) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}

const cspDe = llegirCsp(DIST);
const navegador = await chromium.launch({
  args: ['--disable-dev-shm-usage'],
  ...(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {}),
});

try {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => {
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await p.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(ORIGEN)) {
      const f = fitxerDe(url);
      if (!f) return route.fulfill({ status: 404, body: 'no trobat' });
      const headers = { 'Content-Type': TIPUS[path.extname(f)] || 'application/octet-stream' };
      const csp = f.endsWith('.html') ? cspDe(new URL(url).pathname) : null;
      if (csp) headers['Content-Security-Policy'] = csp;
      return route.fulfill({ status: 200, headers, body: fs.readFileSync(f) });
    }
    return route.abort();
  });

  // Cerca per ?q= sense accents ni majúscules («adequacio») i títol primer
  await p.goto(`${ORIGEN}/cerca/?q=adequacio`, { waitUntil: 'load' });
  await p.waitForSelector('.cerca-resultat');
  const titols = await p.locator('.cerca-resultat-titol').allTextContents();
  const valorInput = await p.inputValue('#cerca-q');
  ok('?q=adequacio troba pàgines amb accents («Adequació») i posa la coincidència al títol primer',
    valorInput === 'adequacio' && titols.length > 0 && titols[0].toLowerCase().includes('adequaci'));

  // Nova cerca enviada pel formulari i tornada enrere amb «Enrere»
  await p.fill('#cerca-q', 'terme-inexistent-xyz');
  await p.click('.cerca-boto');
  await p.waitForSelector('[data-cerca-buit]:not([hidden])');
  const buitVisible = await p.locator('[data-cerca-buit]').isVisible();
  const enllacContacte = await p.locator('[data-cerca-buit] a[href="/#contacte"]').count();
  ok('sense resultats mostra el missatge d\'estat buit amb enllaç a /#contacte i actualitza ?q=',
    buitVisible && enllacContacte > 0 && (await p.evaluate(() => window.location.search)) === '?q=terme-inexistent-xyz');

  await p.goBack();
  await p.waitForSelector('.cerca-resultat');
  const qTornada = await p.inputValue('#cerca-q');
  ok('el botó «Enrere» recupera la cerca anterior (?q=adequacio)', qTornada === 'adequacio');

  // Versió en castellà (/es/buscar/?q=proteccion)
  await p.goto(`${ORIGEN}/es/buscar/?q=proteccion`, { waitUntil: 'load' });
  await p.waitForSelector('.cerca-resultat');
  const titolsEs = await p.locator('.cerca-resultat-titol').allTextContents();
  ok('/es/buscar/?q=proteccion troba resultats en castellà sense accents', titolsEs.length > 0);

  const infraccions = await p.evaluate(() => window.__infraccions);
  ok('cap error de consola ni infracció de CSP a la cerca interna',
    errors.length === 0 && infraccions.length === 0, [...errors, ...infraccions].join(' | '));
  await ctx.close();
} finally {
  await navegador.close();
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de la cerca interna correctes');
process.exit(fallades ? 1 : 0);
