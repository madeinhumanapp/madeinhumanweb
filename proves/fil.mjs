// Proves del fil conductor de la portada (fil.js), amb navegador. Serveix dist/ amb la CSP general de _headers i,
// a quatre mides de pantalla, comprova que el fil es posa en marxa, que no mou la maqueta, que mai es veu per sobre
// d'un text o d'un botó, que acaba al contacte, que no hi ha errors ni infraccions de CSP, el mode «reduir moviment»
// i que sempre es mou. També n'informa del rendiment (no fa fallar la prova: cal mirar-ho en un mòbil real).
// Ús: npm run construir && node proves/fil.mjs [--captures]
//     NAVEGADOR=/ruta/a/chrome si Playwright no té el seu navegador instal·lat (npm run navegador)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const CAPTURES = process.argv.includes('--captures');
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };
const info = t => console.log(`· ${t}`);

if (!fs.existsSync(path.join(DIST, 'fil.js'))) { console.log('✗ dist/fil.js no existeix: executa abans npm run construir'); process.exit(1); }

// CSP general de _headers (regla /*), la mateixa que aplica Cloudflare Pages a la portada
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
ok('la CSP general de _headers es pot llegir', !!csp);

const TIPUS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.xml': 'application/xml' };
const servidor = http.createServer((req, res) => {
  let f = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (f.endsWith('/')) f += 'index.html';
  let ruta = path.join(DIST, f);
  if (!ruta.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(ruta) && fs.existsSync(ruta + '.html')) ruta += '.html';
  if (!fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404).end(); return; }
  const cap = { 'Content-Type': TIPUS[path.extname(ruta)] || 'application/octet-stream' };
  if (csp && ruta.endsWith('.html')) cap['Content-Security-Policy'] = csp;
  res.writeHead(200, cap);
  fs.createReadStream(ruta).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;
const navegador = await chromium.launch(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {});

const VISTES = [
  { nom: 'escriptori 1440×900', viewport: { width: 1440, height: 900 } },
  { nom: 'portàtil 1280×800', viewport: { width: 1280, height: 800 } },
  { nom: 'pantalla gran 1920×1080', viewport: { width: 1920, height: 1080 } },
  { nom: 'mòbil 390×844', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

// Context amb el bàner de galetes ja respost i un registre d'errors i d'infraccions de CSP
async function obre(opcions, { manual = true, senseFil = false } = {}) {
  const ctx = await navegador.newContext(opcions);
  await ctx.addInitScript(m => {
    if (m) window.FIL_MANUAL = true;
    try { localStorage.setItem('cookie_consent', 'rejected'); } catch (e) {}
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ${e.blockedURI}`));
  }, manual);
  if (senseFil) await ctx.route('**/fil.js', r => r.abort());
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);       // el fil es reconstrueix quan acaben de carregar les tipografies
  return { ctx, p, errors };
}

// Posicions de la maqueta (sense les translacions de les animacions d'aparició)
const MAQUETA = () => {
  const c = el => { let y = 0, e = el; while (e) { y += e.offsetTop; e = e.offsetParent; } return y; };
  return { alcada: document.documentElement.scrollHeight, seccions: [...document.querySelectorAll('header.hero, main > section, body > section, footer')].map(c) };
};

for (const v of VISTES) {
  const { ctx, p, errors } = await obre(v);
  const e = await p.evaluate(() => window.madeinhumanFil && window.madeinhumanFil.estat());
  ok(`${v.nom}: el fil es posa en marxa`, !!e, 'window.madeinhumanFil no existeix');
  if (!e) { await ctx.close(); continue; }
  const cv = await p.evaluate(() => {
    const c = document.querySelector('.fil-capa'), cs = c && getComputedStyle(c);
    return c && { aria: c.getAttribute('aria-hidden'), pos: cs.position, pe: cs.pointerEvents, z: cs.zIndex, classe: document.documentElement.classList.contains('amb-fil'),
      alcada: c.offsetHeight, pagina: document.documentElement.scrollHeight };
  });
  ok(`${v.nom}: la capa del fil és decorativa, no rep clics i no allarga la pàgina`, cv && cv.aria === 'true' && cv.pos === 'absolute' && cv.pe === 'none' && cv.classe && cv.alcada < cv.pagina, JSON.stringify(cv));
  ok(`${v.nom}: recorregut complet (${e.llargada} px, ${e.nodes} nodes)`, e.llargada > 3000 && e.nodes >= 8);

  // El cursor final és just darrere del títol del contacte
  const fi = await p.evaluate(() => {
    const t = document.querySelector('#contacte .section-title');
    let y = 0, x = 0, el = t; while (el) { y += el.offsetTop; x += el.offsetLeft; el = el.offsetParent; }
    const c = madeinhumanFil.nodes().filter(n => n.tipus === 'cursor').pop();
    return { c, y, b: y + t.offsetHeight, x, r: x + t.offsetWidth };
  });
  ok(`${v.nom}: el fil acaba al cursor de «Parla amb nosaltres.»`, fi.c && fi.c.y > fi.y && fi.c.y < fi.b + 6 && fi.c.x > fi.x, JSON.stringify(fi));

  // La maqueta és la mateixa amb el fil i sense
  const amb = await p.evaluate(MAQUETA);
  const sense = await obre(v, { senseFil: true });
  const sn = await sense.p.evaluate(MAQUETA);
  await sense.ctx.close();
  ok(`${v.nom}: el fil no mou la maqueta`, amb.alcada === sn.alcada && amb.seccions.join() === sn.seccions.join(), `${amb.alcada} vs ${sn.alcada}`);

  // Mai es veu per sobre d'un text o d'un control: línies de text mesurades a part, amb les aparicions acabades
  const sobre = await p.evaluate(() => {
    const st = document.createElement('style'); st.textContent = '*{transition:none!important;animation:none!important}';
    document.head.appendChild(st);
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el => el.classList.add('revealed'));
    const fixos = '.nav, .whatsapp-float, .back-to-top, .scroll-progress, .cookie-banner, .fil-capa, script, style';
    const zs = [], rng = document.createRange();
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() ? 1 : 2) });
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.parentElement || n.parentElement.closest(fixos)) continue;
      rng.selectNodeContents(n);
      for (const r of rng.getClientRects()) if (r.width >= 1 && r.height >= 1) zs.push([r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY, n.nodeValue.trim().slice(0, 40)]);
    }
    for (const el of document.querySelectorAll('a.btn, button, input, select, textarea')) {
      if (el.closest(fixos)) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.height) zs.push([r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY, `<${el.tagName.toLowerCase()}>`]);
    }
    const res = [];
    for (const [x, y, m, vis] of madeinhumanFil.mostres()) {
      if (vis < 0.5) continue;
      const mm = Math.max(0, m - 2);
      const z = zs.find(z => x > z[0] - mm && x < z[2] + mm && y > z[1] - mm && y < z[3] + mm);
      if (z) res.push(`(${x | 0}, ${y | 0}) «${z[4]}»`);
    }
    st.remove();
    return res;
  });
  ok(`${v.nom}: el fil mai es veu per sobre d'un text o d'un botó (${e.esvaides} punts esvaïts a sota)`, sobre.length === 0, `${sobre.length} punts: ${sobre.slice(0, 4).join(' · ')}`);

  // Dibuixa sense errors a tot el recorregut
  const dibuix = await p.evaluate(() => {
    const fi = madeinhumanFil.nodes().filter(n => n.tipus === 'cursor').pop().trig + 200;
    let fets = 0;
    for (let i = 0; i <= 10; i++) { madeinhumanFil.render(i * 0.7, fi * i / 10); fets++; }
    return fets;
  });
  ok(`${v.nom}: dibuixa a tot el recorregut`, dibuix === 11);
  const cobertura = await p.evaluate(() => {
    const fi = madeinhumanFil.nodes().filter(n => n.tipus === 'cursor').pop().trig, forats = [];
    for (let i = 0; i <= 8; i++) {
      const sy = Math.round(fi * i / 8);
      madeinhumanFil.render(1, sy);
      const rs = [...document.querySelectorAll('.fil-capa canvas')].filter(c => c.style.display !== 'none').map(c => [c.offsetTop, c.offsetTop + c.offsetHeight]).sort((a, b) => a[0] - b[0]);
      const capa = document.querySelector('.fil-capa').offsetHeight;
      let y = sy; for (const [a, b] of rs) if (a <= y) y = Math.max(y, b);
      if (y < Math.min(sy + innerHeight, capa)) forats.push(sy);
    }
    return forats;
  });
  ok(`${v.nom}: les rajoles cobreixen sempre la pantalla`, !cobertura.length, `forats a ${cobertura.join(', ')}`);

  // Rendiment (informatiu): ms per fotograma sense límit de CPU i amb la CPU 4 vegades més lenta
  const mesura = () => p.evaluate(() => {
    const fi = madeinhumanFil.nodes().filter(n => n.tipus === 'cursor').pop().trig, ts = [];
    for (let i = 0; i < 120; i++) { const a = performance.now(); madeinhumanFil.render(i / 60, (fi * i) / 120); ts.push(performance.now() - a); }
    ts.sort((a, b) => a - b);
    return { mitjana: ts.reduce((a, b) => a + b, 0) / ts.length, p95: ts[Math.floor(ts.length * 0.95)] };
  });
  const r1 = await mesura();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const r4 = await mesura();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  info(`${v.nom}: ${r1.mitjana.toFixed(1)} ms per fotograma (p95 ${r1.p95.toFixed(1)}) · amb la CPU ×4: ${r4.mitjana.toFixed(1)} ms (p95 ${r4.p95.toFixed(1)})`);

  if (CAPTURES) {
    const dir = path.join(ARREL, 'captures', 'fil');
    fs.mkdirSync(dir, { recursive: true });
    const ys = await p.evaluate(() => [0, ...madeinhumanFil.nodes().filter((n, i, a) => n.trig > 0 && (i === a.length - 1 || i % 3 === 0)).map(n => Math.round(n.trig + 80))]);
    for (const [i, y] of ys.entries()) {
      // la web té scroll suau: per a la captura cal anar-hi de cop i esperar que acabin les aparicions
      await p.evaluate(y => { window.scrollTo({ top: y, behavior: 'instant' }); }, y);
      await p.waitForTimeout(1300);
      await p.evaluate(() => madeinhumanFil.render(3.4 + scrollY / 500, scrollY));
      await p.screenshot({ path: path.join(dir, `${v.viewport.width}-${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
    }
    info(`${v.nom}: ${ys.length} captures a captures/fil/`);
  }
  const infr = await p.evaluate(() => window.__infraccions);
  ok(`${v.nom}: cap error de consola ni infracció de CSP`, !errors.length && !infr.length, [...errors, ...infr].slice(0, 3).join(' · '));
  await ctx.close();
}

// Sempre es mou (sense FIL_MANUAL): en un segon ha de dibuixar molts fotogrames
{
  const { ctx, p } = await obre(VISTES[0], { manual: false });
  const a = await p.evaluate(() => madeinhumanFil.estat().renders);
  await p.waitForTimeout(1000);
  const b = await p.evaluate(() => madeinhumanFil.estat().renders);
  ok(`sempre es mou: ${b - a} fotogrames en 1 s a la capçalera`, b - a >= 10);
  await ctx.close();
}

// «Reduir moviment»: el fil surt sencer i quiet (cap bucle) i només es redibuixa quan es fa scroll
{
  const { ctx, p } = await obre({ ...VISTES[0], reducedMotion: 'reduce' }, { manual: false });
  const a = await p.evaluate(() => madeinhumanFil.estat().renders);
  await p.waitForTimeout(800);
  const b = await p.evaluate(() => madeinhumanFil.estat().renders);
  await p.evaluate(() => window.scrollTo(0, 1600));
  await p.waitForTimeout(300);
  const c = await p.evaluate(() => madeinhumanFil.estat().renders);
  ok('amb «reduir moviment» no hi ha animació contínua', b === a, `${b - a} fotogrames sense fer scroll`);
  ok('amb «reduir moviment» es redibuixa en fer scroll', c > b);
  await ctx.close();
}

await navegador.close();
servidor.close();
console.log(fallades ? `✗ ${fallades} comprovacions del fil han fallat` : 'totes les comprovacions del fil correctes');
process.exit(fallades ? 1 : 0);
