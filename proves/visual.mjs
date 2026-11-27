// Regressió visual automàtica sense dependències (WEB-G06a):
// compara píxel a píxel totes les pàgines HTML (llevat de _previsualitzacio/ i recollida.html)
// entre --base i --actual a les amplades indicades, i genera captures/visual/informe.html.
// Ús: node proves/visual.mjs --base <dist de referència> [--actual dist] [--amplades 375,768,1280] [--llindar 4] [--estricte]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opcio = (nom, defecte) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : defecte);

const baseArg = opcio('--base', null);
if (!baseArg) {
  console.error('Ús: node proves/visual.mjs --base <carpeta> [--actual dist] [--amplades 375,768,1280] [--llindar 4] [--estricte]');
  process.exit(1);
}
const DIR_BASE = path.resolve(ARREL, baseArg);
const DIR_ACTUAL = path.resolve(ARREL, opcio('--actual', 'dist'));
const AMPLADES = opcio('--amplades', '375,768,1280').split(',').map(Number).filter(n => Number.isFinite(n) && n > 0);
const LLINDAR = Number(opcio('--llindar', '4'));
const ESTRICTE = args.includes('--estricte');
const SORTIDA = path.join(ARREL, 'captures/visual');
const SORTIDA_IMG = path.join(SORTIDA, 'img');

for (const [etiqueta, dir] of [['--base', DIR_BASE], ['--actual', DIR_ACTUAL]]) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`✗ La carpeta ${etiqueta} (${dir}) no existeix`);
    process.exit(1);
  }
}

const TIPUS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function servirCarpeta(dir) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const ruta = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      let fitxer = path.join(dir, ruta);
      if (ruta.endsWith('/')) fitxer = path.join(fitxer, 'index.html');
      else if (!fs.existsSync(fitxer) && fs.existsSync(fitxer + '.html')) fitxer += '.html';
      if ((fitxer === dir || fitxer.startsWith(dir + path.sep)) && fs.existsSync(fitxer) && fs.statSync(fitxer).isFile()) {
        const buf = fs.readFileSync(fitxer);
        res.writeHead(200, {
          'Content-Type': TIPUS[path.extname(fitxer)] || 'application/octet-stream',
          'Content-Length': buf.length,
          'Cache-Control': 'no-store',
          'Connection': 'close',
        });
        res.end(buf);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Connection': 'close' });
        res.end('no trobat');
      }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

function llistarHtml(dir) {
  const out = [];
  (function recorre(rel = '') {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      if (!rel && e.name === '_previsualitzacio') continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) recorre(r);
      else if (e.name.endsWith('.html') && r !== 'recollida.html') out.push(r);
    }
  })();
  return out.sort();
}

const rutaUrl = rel => '/' + (rel === 'index.html' ? '' : rel.replace(/\/index\.html$/, '/'));
const slugFitxer = rel => (rel.replace(/\/index\.html$|\.html$/, '').replace(/[^a-zA-Z0-9_-]+/g, '_') || 'index');
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[ch]));

const paginesBase = new Set(llistarHtml(DIR_BASE));
const paginesActual = new Set(llistarHtml(DIR_ACTUAL));
const comunes = [...paginesBase].filter(p => paginesActual.has(p)).sort();
const nomesActual = [...paginesActual].filter(p => !paginesBase.has(p)).sort();
const nomesBase = [...paginesBase].filter(p => !paginesActual.has(p)).sort();

fs.rmSync(SORTIDA, { recursive: true, force: true });
fs.mkdirSync(SORTIDA_IMG, { recursive: true });

const [srvBase, srvActual] = await Promise.all([servirCarpeta(DIR_BASE), servirCarpeta(DIR_ACTUAL)]);

const launchOpts = {
  args: ['--disable-dev-shm-usage', '--disable-gpu'],
  ...(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {}),
};

let navegador = null;
let ctx = null;
let pagina = null;
let paginaDiff = null;

async function iniciarNavegador() {
  if (navegador) { try { await navegador.close(); } catch {} }
  navegador = await chromium.launch(launchOpts);
  ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('cookie_consent', 'rejected'); } catch {}
  });
  pagina = await ctx.newPage();
  await pagina.route(u => !u.href.startsWith('http://127.0.0.1:') && !u.href.startsWith('data:') && u.href !== 'about:blank', route => route.abort());
  paginaDiff = await ctx.newPage();
  await paginaDiff.setContent('<!doctype html><html><body></body></html>');
}

const resultats = [];
let ambDiferencies = 0;

try {
  await iniciarNavegador();

  async function capturar(port, rel, amplada) {
    for (let intent = 0; intent < 3; intent++) {
      let falladesLocals = 0;
      const onFail = req => { if (req.url().startsWith('http://127.0.0.1:')) falladesLocals++; };
      pagina.on('requestfailed', onFail);
      try {
        await pagina.setViewportSize({ width: amplada, height: 900 });
        await pagina.goto(`http://127.0.0.1:${port}${rutaUrl(rel)}`, { waitUntil: 'networkidle' });
        if (falladesLocals > 0) throw new Error('crashed: subrecurs local fallit');
        // Assegura que tots els fulls d'estil, les animacions d'entrada i les tipografies quedin estables
        const cssOk = await pagina.evaluate(async () => {
          const esperats = document.querySelectorAll('link[rel="stylesheet"]').length;
          if (esperats > 0 && document.styleSheets.length < esperats) return false;
          document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
            el.classList.add('visible', 'in');
          });
          if (document.fonts && document.fonts.ready) await document.fonts.ready;
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          return true;
        });
        if (!cssOk || falladesLocals > 0) throw new Error('crashed: full d\'estil incomplet');
        return await pagina.screenshot({ fullPage: true, animations: 'disabled', type: 'png' });
      } catch (err) {
        if (intent === 2 || !/crashed|closed|Target page|ERR_ABORTED|ERR_CONNECTION/i.test(String(err.message))) throw err;
        await iniciarNavegador();
      } finally {
        pagina.off('requestfailed', onFail);
      }
    }
  }

  async function compararPng(bufA, bufB) {
    if (bufA.equals(bufB)) return { diferents: 0, total: 1, pct: 0, midaDiferent: false, diffBuf: null, wA: 0, hA: 0, wB: 0, hB: 0 };
    const b64A = bufA.toString('base64');
    const b64B = bufB.toString('base64');
    const res = await paginaDiff.evaluate(async ({ a, b, llindar }) => {
      const carregar = src => new Promise((ok, err) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = err;
        img.src = 'data:image/png;base64,' + src;
      });
      const [imgA, imgB] = await Promise.all([carregar(a), carregar(b)]);
      const wA = imgA.naturalWidth, hA = imgA.naturalHeight;
      const wB = imgB.naturalWidth, hB = imgB.naturalHeight;
      const w = Math.max(wA, wB);
      const h = Math.max(hA, hB);

      const cA = document.createElement('canvas'); cA.width = w; cA.height = h;
      const ctxA = cA.getContext('2d', { willReadFrequently: true });
      ctxA.drawImage(imgA, 0, 0);
      const dA = ctxA.getImageData(0, 0, w, h).data;

      const cB = document.createElement('canvas'); cB.width = w; cB.height = h;
      const ctxB = cB.getContext('2d', { willReadFrequently: true });
      ctxB.drawImage(imgB, 0, 0);
      const dB = ctxB.getImageData(0, 0, w, h).data;

      const cD = document.createElement('canvas'); cD.width = w; cD.height = h;
      const ctxD = cD.getContext('2d');
      const out = ctxD.createImageData(w, h);
      const dO = out.data;

      let diferents = 0;
      const total = w * h;
      for (let i = 0; i < dA.length; i += 4) {
        const y = (i / 4 / w) | 0;
        const x = (i / 4) % w;
        const fora = x >= wA || y >= hA || x >= wB || y >= hB;
        const diff = fora
          || Math.abs(dA[i] - dB[i]) > llindar
          || Math.abs(dA[i + 1] - dB[i + 1]) > llindar
          || Math.abs(dA[i + 2] - dB[i + 2]) > llindar
          || Math.abs(dA[i + 3] - dB[i + 3]) > llindar;
        if (diff) {
          diferents++;
          // Color --vermell (#FF5050) de marca.css per destacar els píxels diferents
          dO[i] = 255; dO[i + 1] = 80; dO[i + 2] = 80; dO[i + 3] = 255;
        } else {
          const gris = Math.round((dB[i] * 0.299 + dB[i + 1] * 0.587 + dB[i + 2] * 0.114) * 0.35);
          dO[i] = gris; dO[i + 1] = gris; dO[i + 2] = gris; dO[i + 3] = 255;
        }
      }
      const midaDiferent = wA !== wB || hA !== hB;
      let diffDataUrl = null;
      if (diferents > 0 || midaDiferent) {
        ctxD.putImageData(out, 0, 0);
        diffDataUrl = cD.toDataURL('image/png');
      }
      return { diferents, total, pct: total ? (diferents / total) * 100 : 0, midaDiferent, wA, hA, wB, hB, diffDataUrl };
    }, { a: b64A, b: b64B, llindar: LLINDAR });
    const diffBuf = res.diffDataUrl ? Buffer.from(res.diffDataUrl.split(',')[1], 'base64') : null;
    return { ...res, diffBuf };
  }

  for (const amplada of AMPLADES) {
    // Captura per lots del mateix origen (evita canvis constants de procés de renderitzat)
    const capturesBase = new Map();
    for (const rel of comunes) capturesBase.set(rel, await capturar(srvBase.port, rel, amplada));
    for (const rel of comunes) {
      const bufA = capturesBase.get(rel);
      capturesBase.delete(rel);
      const bufB = await capturar(srvActual.port, rel, amplada);
      const cmp = await compararPng(bufA, bufB);
      const esDiferent = cmp.diferents > 0 || cmp.midaDiferent;
      const clau = `${slugFitxer(rel)}-${amplada}`;
      let imgAbans = null, imgDespres = null, imgDiff = null;
      if (esDiferent) {
        ambDiferencies++;
        imgAbans = `img/${clau}-abans.png`;
        imgDespres = `img/${clau}-despres.png`;
        imgDiff = `img/${clau}-diff.png`;
        fs.writeFileSync(path.join(SORTIDA, imgAbans), bufA);
        fs.writeFileSync(path.join(SORTIDA, imgDespres), bufB);
        if (cmp.diffBuf) fs.writeFileSync(path.join(SORTIDA, imgDiff), cmp.diffBuf);
        const detall = cmp.midaDiferent
          ? `${cmp.pct.toFixed(2)}% píxels (${cmp.wA}×${cmp.hA} → ${cmp.wB}×${cmp.hB})`
          : `${cmp.pct.toFixed(2)}% píxels`;
        console.log(`≠ ${rel} (${amplada} px): ${detall}`);
      }
      resultats.push({ rel, amplada, esDiferent, pct: cmp.pct, midaDiferent: cmp.midaDiferent, wA: cmp.wA, hA: cmp.hA, wB: cmp.wB, hB: cmp.hB, imgAbans, imgDespres, imgDiff });
    }
  }
} finally {
  if (navegador) { try { await navegador.close(); } catch {} }
  srvBase.srv.close();
  srvActual.srv.close();
}

// Genera l'informe HTML a captures/visual/informe.html
const filesTaula = resultats.map(r => {
  const estat = r.esDiferent
    ? `<span class="estat-diff">${r.pct.toFixed(2)}%${r.midaDiferent ? ` (${r.wA}×${r.hA} → ${r.wB}×${r.hB})` : ''}</span>`
    : '<span class="estat-ok">idèntica</span>';
  const enllac = r.esDiferent ? `<a href="#diff-${esc(slugFitxer(r.rel))}-${r.amplada}">${esc(r.rel)}</a>` : esc(r.rel);
  return `        <tr><td>${enllac}</td><td>${r.amplada} px</td><td>${estat}</td></tr>`;
}).join('\n');

const targetesDiff = resultats.filter(r => r.esDiferent).map(r => `      <section class="diff-bloc" id="diff-${esc(slugFitxer(r.rel))}-${r.amplada}">
        <h2>${esc(r.rel)} · ${r.amplada} px <span class="estat-diff">${r.pct.toFixed(2)}%${r.midaDiferent ? ` (${r.wA}×${r.hA} → ${r.wB}×${r.hB})` : ''}</span></h2>
        <div class="diff-graella">
          <figure><figcaption>Abans (base)</figcaption><img src="${esc(r.imgAbans)}" alt="Abans: ${esc(r.rel)} a ${r.amplada} px" loading="lazy" /></figure>
          <figure><figcaption>Després (actual)</figcaption><img src="${esc(r.imgDespres)}" alt="Després: ${esc(r.rel)} a ${r.amplada} px" loading="lazy" /></figure>
          <figure><figcaption>Diferències</figcaption><img src="${esc(r.imgDiff)}" alt="Diferències: ${esc(r.rel)} a ${r.amplada} px" loading="lazy" /></figure>
        </div>
      </section>`).join('\n');

const extraNoves = nomesActual.length
  ? `<p class="extra"><strong>Pàgines noves (només a actual, ${nomesActual.length}):</strong> ${nomesActual.map(p => `<code>${esc(p)}</code>`).join(', ')}</p>` : '';
const extraElim = nomesBase.length
  ? `<p class="extra"><strong>Pàgines eliminades (només a base, ${nomesBase.length}):</strong> ${nomesBase.map(p => `<code>${esc(p)}</code>`).join(', ')}</p>` : '';

const informe = `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Informe de regressió visual · Madeinhuman</title>
  <style>
    :root { --nit:#0A0E1A; --nit-elevat:#0F1426; --crema:#F3EFE8; --daurat:#C4956A; --gris-clar:#A3AABA; --verd:#4ADE80; --vermell:#FF5050; --vora:rgba(255,255,255,.12); }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; background: var(--nit); color: var(--crema); font: 15px/1.55 system-ui, -apple-system, sans-serif; }
    h1 { margin: 0 0 8px; font-size: 26px; color: var(--crema); }
    h2 { margin: 0 0 14px; font-size: 18px; display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; }
    .meta { color: var(--gris-clar); margin: 0 0 24px; font-size: 13.5px; }
    .extra { margin: 12px 0; color: var(--gris-clar); }
    code { font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: var(--daurat); }
    a { color: var(--daurat); }
    table { width: 100%; border-collapse: collapse; margin: 20px 0 32px; background: var(--nit-elevat); border: 1px solid var(--vora); }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--vora); }
    th { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--gris-clar); }
    .estat-ok { color: var(--verd); font-weight: 600; }
    .estat-diff { color: var(--vermell); font-weight: 600; }
    .diff-bloc { margin: 28px 0; padding: 20px; border: 1px solid var(--vora); border-radius: 12px; background: var(--nit-elevat); }
    .diff-graella { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .diff-graella figure { margin: 0; }
    .diff-graella figcaption { font-size: 12.5px; color: var(--gris-clar); margin-bottom: 6px; }
    .diff-graella img { width: 100%; height: auto; border: 1px solid var(--vora); border-radius: 6px; display: block; }
    @media (max-width: 900px) { .diff-graella { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>Informe de regressió visual</h1>
  <p class="meta">Base: <code>${esc(path.relative(ARREL, DIR_BASE) || DIR_BASE)}</code> · Actual: <code>${esc(path.relative(ARREL, DIR_ACTUAL) || DIR_ACTUAL)}</code> · Amplades: ${AMPLADES.join(', ')} px · Llindar: ${LLINDAR} · Comparades: ${resultats.length} captures · Diferències: ${ambDiferencies}</p>
  ${extraNoves}${extraElim}
  <table>
    <thead><tr><th>Pàgina</th><th>Amplada</th><th>Resultat</th></tr></thead>
    <tbody>
${filesTaula}
    </tbody>
  </table>
${targetesDiff || '  <p class="estat-ok">Cap diferència visual detectada.</p>'}
</body>
</html>
`;
fs.writeFileSync(path.join(SORTIDA, 'informe.html'), informe);

const totalDiff = ambDiferencies + nomesBase.length;
console.log(ambDiferencies ? `${ambDiferencies} captures amb diferències` : 'cap diferència visual');
if (nomesActual.length) console.log(`pàgines noves (no eren a base): ${nomesActual.join(', ')}`);
if (nomesBase.length) console.log(`pàgines eliminades (només a base): ${nomesBase.join(', ')}`);
console.log(`informe: captures/visual/informe.html (${resultats.length} captures comparades)`);

process.exit(ESTRICTE && totalDiff > 0 ? 1 : 0);
