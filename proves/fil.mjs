// Proves del fil conductor de la portada (fil.js), amb navegador. Serveix dist/ amb la CSP general de _headers i,
// a quatre mides de pantalla, comprova que el fil es posa en marxa, que no mou la maqueta, que mai es veu per sobre
// d'un text o d'un botó, que acaba al contacte, que no hi ha errors ni infraccions de CSP, el mode «reduir moviment»
// i que sempre es mou. També n'informa del rendiment (no fa fallar la prova: cal mirar-ho en un mòbil real).
// Proves per píxels (v0.3): cap capa de la web tapa el fil, cap llum sobre el text, els controls ni la imatgeria,
// el fil és invisible sota les capes fixes (navegació, botons flotants) i hi ha espurnes (cap amb «reduir moviment»).
// Ús: npm run construir && node proves/fil.mjs [--captures]
//     NAVEGADOR=/ruta/a/chrome si Playwright no té el seu navegador instal·lat (npm run navegador)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const CAPTURES = process.argv.includes('--captures');
let fallades = 0;
// Descodificador PNG mínim (8 bits, RGB/RGBA, sense entrellaçat: el que fa Playwright): torna RGB per píxel
function llegeixPNG(buf) {
  let p = 8, w, h, ct; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), tipus = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (tipus === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] !== 0 || (ct !== 2 && ct !== 6)) throw new Error('PNG no suportat'); }
    else if (tipus === 'IDAT') idat.push(d); else if (tipus === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), st = w * bpp, out = new Uint8Array(w * h * 3);
  let prev = new Uint8Array(st);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], line = Uint8Array.from(raw.subarray(y * (st + 1) + 1, (y + 1) * (st + 1)));
    for (let x = 0; x < st; x++) {
      const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[x] = v & 255;
    }
    for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) out[(y * w + x) * 3 + k] = line[x * bpp + k];
    prev = line;
  }
  return { w, h, d: out };
}
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

// Proves per píxels, en un context net amb totes les aparicions acabades i sense animacions (tret de la del body,
// que només fa aparèixer la pàgina) ni la textura de gra (body::before, una pel·lícula uniforme sobre tota la web).
// A cada posició del recorregut:
//  1) llum sobre el text: alfa màxim del canvas dins de cada línia de text, control o imatge (ha de ser 0);
//  2) capes fixes: alfa màxim del canvas sota la navegació i els botons flotants (ha de ser 0);
//  3) capes que tapen el fil: es pinta de magenta opac tot el que el fil hi té dibuixat amb prou opacitat
//     (≥ 25 %), es fa una captura i cada píxel ha de sortir magenta, tret del text i de les capes fixes.
async function capesIPixels(v) {
  const ctx = await navegador.newContext(v);
  await ctx.addInitScript(() => { window.FIL_MANUAL = true; try { localStorage.setItem('cookie_consent', 'rejected'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: '*, *::before, *::after { transition: none !important; scroll-behavior: auto !important } *:not(body), *::before, *::after { animation: none !important } body { opacity: 1 !important; animation: none !important } body::before { display: none !important }' });
  await p.evaluate(() => {
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(e => e.classList.add('revealed'));
    // l'escena dels serveis, fusionada: és l'estat que es veu quan el fil hi arriba (ho comprova proves/portada.mjs)
    const fusio = document.querySelector('.fusio'); if (fusio) fusio.classList.remove('fusio-viva');
    madeinhumanFil.reconstruir();
  });
  // el fil es reconstrueix sol (tipografies, ResizeObserver, 150 ms d'espera) i en fer-ho buida les rajoles:
  // cal esperar que s'aturi abans de pintar-les de magenta i fer la captura
  await p.waitForTimeout(600);
  const D = v.deviceScaleFactor || 1, vh = v.viewport.height;
  const fi = await p.evaluate(() => madeinhumanFil.nodes().filter(n => n.tipus === 'cursor').pop().trig + 400);
  let cand = 0, tapats = 0, maxText = 0, maxFix = 0; const onText = [], onTapat = [];
  for (let y = 0; y <= fi; y += Math.round(vh * 0.5)) {
    const r = await p.evaluate(([y, t]) => {
      scrollTo(0, y); madeinhumanFil.render(t, scrollY);
      const D = devicePixelRatio, W = Math.round(innerWidth * D), H = Math.round(innerHeight * D), sy = scrollY;
      const fixos = '.nav, .whatsapp-float, .back-to-top, .scroll-progress, .cookie-banner, .fil-capa, script, style';
      const prot = [], fix = [], rng = document.createRange();
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() ? 1 : 2) });
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.parentElement || n.parentElement.closest(fixos)) continue;
        rng.selectNodeContents(n);
        for (const q of rng.getClientRects()) if (q.width >= 1 && q.height >= 1 && q.bottom > 0 && q.top < innerHeight) prot.push([q.left, q.top, q.right, q.bottom, n.nodeValue.trim().slice(0, 30)]);
      }
      for (const el of document.querySelectorAll('a.btn, button, input, select, textarea, img, svg, video, iframe')) {
        if (el.closest(fixos)) continue;
        const q = el.getBoundingClientRect();
        if (q.width && q.height && q.bottom > 0 && q.top < innerHeight) prot.push([q.left, q.top, q.right, q.bottom, `<${el.tagName.toLowerCase()}>`]);
      }
      for (const el of document.querySelectorAll('.nav, .whatsapp-float, .back-to-top, .scroll-progress, .cookie-banner')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.02) continue;
        const q = el.getBoundingClientRect();
        if (q.width && q.height) fix.push([q.left, q.top, q.right, q.bottom, el.className.split(' ')[0]]);
      }
      const ex = [...prot, ...fix].map(q => [Math.floor((q[0] - 2) * D), Math.floor((q[1] - 2) * D), Math.ceil((q[2] + 2) * D), Math.ceil((q[3] + 2) * D)]);
      const mask = new Uint8Array(W * H);
      let maxT = 0, quinT = '', maxF = 0, quinF = '';
      const maxDins = (d, cw, ch, off, q) => {           // alfa màxim dins d'un rectangle (1 px de marge cap endins)
        let m = 0;
        const x0 = Math.max(0, Math.ceil(q[0] * D) + 1), x1 = Math.min(cw, Math.floor(q[2] * D) - 1);
        const y0 = Math.max(0, Math.ceil(q[1] * D) + 1 - off), y1 = Math.min(ch, Math.floor(q[3] * D) - 1 - off);
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) m = Math.max(m, d[(yy * cw + xx) * 4 + 3]);
        return m;
      };
      for (const cv of document.querySelectorAll('.fil-capa canvas')) {
        if (cv.style.display === 'none') continue;
        const g = cv.getContext('2d'), img = g.getImageData(0, 0, cv.width, cv.height), d = img.data, off = Math.round((cv.offsetTop - sy) * D);
        for (const q of prot) { const m = maxDins(d, cv.width, cv.height, off, q); if (m > maxT) { maxT = m; quinT = q[4]; } }
        for (const q of fix) { const m = maxDins(d, cv.width, cv.height, off, q); if (m > maxF) { maxF = m; quinF = q[4]; } }
        for (let cy = 0; cy < cv.height; cy++) {
          const ry = cy + off; if (ry < 0 || ry >= H) continue;
          for (let cx = 0; cx < Math.min(cv.width, W); cx++) {
            const i = (cy * cv.width + cx) * 4; if (!d[i + 3]) continue;
            const visible = d[i + 3] >= 64;
            d[i] = 255; d[i + 1] = 0; d[i + 2] = 255; d[i + 3] = 255;
            if (!visible) continue;
            let fora = false; for (const e of ex) if (cx >= e[0] && cx < e[2] && ry >= e[1] && ry < e[3]) { fora = true; break; }
            if (!fora) mask[ry * W + cx] = 1;
          }
        }
        g.putImageData(img, 0, 0);
      }
      let s = ''; for (let i = 0; i < mask.length; i += 8192) s += String.fromCharCode.apply(null, mask.subarray(i, i + 8192));
      return { W, mask: btoa(s), maxT, quinT, maxF, quinF };
    }, [y, 3.4 + y / 500]);
    if (r.maxT > maxText) maxText = r.maxT;
    if (r.maxT > 2) onText.push(`y=${y}: ${r.maxT}/255 a «${r.quinT}»`);
    if (r.maxF > maxFix) maxFix = r.maxF;
    if (r.maxF > 2) onText.push(`y=${y}: ${r.maxF}/255 sota ${r.quinF}`);
    const img = llegeixPNG(await p.screenshot({ type: 'png' }));
    const mask = Buffer.from(r.mask, 'base64');
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      cand++;
      if (Math.max(255 - img.d[i * 3], img.d[i * 3 + 1], 255 - img.d[i * 3 + 2]) > 8) { tapats++; if (onTapat.length < 3) onTapat.push(`y=${y}: (${((i % r.W) / D) | 0}, ${(Math.floor(i / r.W) / D) | 0})`); }
    }
  }
  ok(`${v.nom}: cap llum del fil sobre el text, els controls ni la imatgeria (màx. ${maxText}/255)`, maxText <= 2, onText.filter(t => !t.includes('sota')).slice(0, 3).join(' · '));
  ok(`${v.nom}: el fil no es veu mai sota la navegació ni els botons flotants (màx. ${maxFix}/255)`, maxFix <= 2, onText.filter(t => t.includes('sota')).slice(0, 3).join(' · '));
  ok(`${v.nom}: cap capa de la web tapa el fil (${tapats} de ${cand} píxels)`, cand > 1000 && tapats === 0, onTapat.join(' · '));
  await ctx.close();
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
  // Un canvi d'alçada de la finestra sense canvi de maqueta (al mòbil, el navegador amaga les barres en fer scroll) no
  // refà el recorregut: refer-lo vol dir mesurar tot el text de la pàgina i encallava el scroll
  const rc0 = (await p.evaluate(() => madeinhumanFil.estat())).reconstruccions;
  await p.evaluate(() => window.dispatchEvent(new Event('resize'))); await p.waitForTimeout(400);
  const rc1 = (await p.evaluate(() => madeinhumanFil.estat())).reconstruccions;
  ok(`${v.nom}: canviar només l'alçada de la finestra no refà el recorregut`, rc1 === rc0, `${rc0} → ${rc1}`);
  // cap marxa enrere per la mateixa vertical: plegaria la trena i hi faria un nus quadrat (p. ex. capçalera → 1a nota al mòbil)
  const enrere = await p.evaluate(() => { const m = madeinhumanFil.mostres(), out = [];
    // (mostres consecutives d'un mateix tram: un salt de més de 10 px és el pas d'un tram, o d'un fil, al següent)
    for (let i = 1; i < m.length; i++) if (m[i][1] < m[i - 1][1] - 0.5 && Math.abs(m[i][0] - m[i - 1][0]) < 1.5 && m[i - 1][1] - m[i][1] < 10) out.push(`${Math.round(m[i][0])},${Math.round(m[i][1])}`);
    return out; });
  ok(`${v.nom}: el fil no torna mai amunt per la mateixa vertical (cap plec a la trena)`, !enrere.length, enrere.slice(0, 4).join(' · '));

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
    // L'escena dels serveis, fusionada, les notes i la presentació acabades, i les premisses i els passos, encesos: és
    // l'estat que es veu allà on el fil ja és dibuixat (el fil hi arriba al 62 % de la pantalla, quan les notes ja han
    // acabat la transició; ho comprova proves/portada.mjs)
    const fusio = document.querySelector('.fusio'); if (fusio) fusio.classList.remove('fusio-viva');
    document.querySelectorAll('.nota').forEach(n => n.classList.remove('nota-viva'));
    document.querySelectorAll('.premisses-intro').forEach(n => n.classList.remove('intro-viva'));
    document.querySelectorAll('.premissa, .step').forEach(e => e.classList.add('fil-arribat'));
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

  // Espurnes: en un tram trenat, en uns segons n'hi ha d'haver (destells, espurnetes, pols d'or)
  const esp = await p.evaluate(() => {
    const fi = madeinhumanFil.nodes().filter(n => n.tipus === 'cursor').pop().trig;
    let max = 0;
    for (let t = 20; t < 26; t += 0.1) { madeinhumanFil.render(t, fi * 0.5); max = Math.max(max, madeinhumanFil.estat().espurnes); }
    return max;
  });
  ok(`${v.nom}: hi ha espurnes (fins a ${esp} alhora en un tram trenat)`, esp > 0);

  await capesIPixels(v);

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
  const ep = await p.evaluate(() => madeinhumanFil.estat().espurnes);
  ok('amb «reduir moviment» no hi ha espurnes', ep === 0, `${ep} espurnes`);
  await ctx.close();
}

// Bàner de galetes (primera visita, sense consentiment desat): el fil no s'hi veu mai a sota
{
  const ctx = await navegador.newContext(VISTES[0]);
  await ctx.addInitScript(() => { window.FIL_MANUAL = true; });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const b = document.querySelector('.cookie-banner');
    if (!b || getComputedStyle(b).display === 'none') return { sense: true };
    const fi = madeinhumanFil.nodes().filter(n => n.tipus === 'cursor').pop().trig;
    let max = 0;
    for (let i = 0; i <= 12; i++) {
      const y = Math.round(fi * i / 12);
      window.scrollTo({ top: y, behavior: 'instant' }); madeinhumanFil.render(3 + i, scrollY);
      const q = b.getBoundingClientRect();
      for (const cv of document.querySelectorAll('.fil-capa canvas')) {
        if (cv.style.display === 'none') continue;
        const D = devicePixelRatio, off = Math.round((cv.offsetTop - scrollY) * D), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        const y0 = Math.max(0, Math.ceil(q.top * D) + 1 - off), y1 = Math.min(cv.height, Math.floor(q.bottom * D) - 1 - off);
        for (let yy = y0; yy < y1; yy++) for (let xx = 0; xx < cv.width; xx++) max = Math.max(max, d[(yy * cv.width + xx) * 4 + 3]);
      }
    }
    return { max };
  });
  ok(`amb el bàner de galetes, el fil no s'hi veu a sota${r.sense ? ' (no hi ha bàner: no es comprova)' : ` (màx. ${r.max}/255)`}`, r.sense || r.max <= 2);
  await ctx.close();
}

await navegador.close();
servidor.close();
console.log(fallades ? `✗ ${fallades} comprovacions del fil han fallat` : 'totes les comprovacions del fil correctes');
process.exit(fallades ? 1 : 0);
