// Proves de teclat, focus visible, menú mòbil i contrast WCAG AA (WEB-G06b), amb Playwright i servidor local.
// Comprova totes les pàgines generades de dist/:
// 1. Primer Tab → «Salta al contingut» / «Saltar al contenido» visible; Enter → focus a <main id="contingut">.
// 2. Focus visible a tots els elements enfocables amb teclat de la portada i d'una pàgina de servei.
// 3. Menú mòbil a 375 px amb Enter, Espai i Escape (retorna el focus al botó i actualitza aria-expanded).
// 4. Contrast WCAG AA (4,5:1 text normal; 3:1 text gran ≥ 24 px o ≥ 18,66 px en negreta) a 1280 px.
// Ús: npm run construir && node proves/teclat.mjs [--arrel dist]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const idxArrel = args.indexOf('--arrel');
const DIST = path.resolve(ARREL_REPO, idxArrel >= 0 ? args[idxArrel + 1] : 'dist');

if (!fs.existsSync(DIST) || !fs.statSync(DIST).isDirectory()) {
  console.error(`✗ La carpeta ${DIST} no existeix: executa abans npm run construir`);
  process.exit(1);
}

// Excepcions de contrast que exigirien crear un color nou fora de marca.css (cap si tot es pot arreglar amb marca.css)
const PENDENTS_DE_CLAUDE = [];

const TIPUS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
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

// Pàgines generades (exclou aplicacions estàtiques separades i _previsualitzacio/)
const EXCLOURE = new Set([
  'recollida.html', 'diagnostic.html', 'necessito-dpo/index.html',
  'es/necesito-dpo/index.html', 'obligacions-ia/index.html', 'es/autotest-saas/index.html',
]);
const pagines = [];
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(DIST, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) recorre(r);
    else if (e.name.endsWith('.html') && !EXCLOURE.has(r)) pagines.push(r);
  }
})();
pagines.sort();

const rutaUrl = rel => '/' + (rel === 'index.html' ? '' : rel.replace(/\/index\.html$/, '/'));

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

const { srv, port } = await servirCarpeta(DIST);
const launchOpts = {
  args: ['--disable-dev-shm-usage', '--disable-gpu'],
  ...(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {}),
};

let navegador = null;
let ctx = null;
let p = null;

async function iniciar() {
  if (navegador) { try { await navegador.close(); } catch {} }
  navegador = await chromium.launch(launchOpts);
  ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('cookie_consent', 'rejected'); } catch {}
  });
  p = await ctx.newPage();
  await p.route(u => !u.href.startsWith('http://127.0.0.1:') && !u.href.startsWith('data:') && u.href !== 'about:blank', route => route.abort());
}

async function obrir(rel, amplada = 1280) {
  for (let intent = 0; intent < 3; intent++) {
    let falladesLocals = 0;
    const onFail = req => { if (req.url().startsWith('http://127.0.0.1:')) falladesLocals++; };
    p.on('requestfailed', onFail);
    try {
      await p.setViewportSize({ width: amplada, height: 900 });
      await p.goto(`http://127.0.0.1:${port}${rutaUrl(rel)}`, { waitUntil: 'networkidle' });
      if (falladesLocals > 0) throw new Error('crashed: subrecurs local fallit');
      const cssOk = await p.evaluate(async () => {
        const esperats = document.querySelectorAll('link[rel="stylesheet"]').length;
        if (esperats > 0 && document.styleSheets.length < esperats) return false;
        const st = document.createElement('style');
        st.textContent = '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }';
        document.head.appendChild(st);
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => el.classList.add('visible', 'in'));
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return true;
      });
      if (!cssOk || falladesLocals > 0) throw new Error('crashed: full d\'estil incomplet');
      return;
    } catch (err) {
      if (intent === 2 || !/crashed|closed|Target page/i.test(String(err.message))) throw err;
      await iniciar();
    } finally {
      p.off('requestfailed', onFail);
    }
  }
}

try {
  await iniciar();

  // 1. «Salta al contingut» + contrast WCAG AA a totes les pàgines generades (1280 px)
  const errorsSalta = [];
  const infraccionsContrast = [];
  const pendentsContrast = [];
  let saltatsFonsImatge = 0;

  for (const rel of pagines) {
    await obrir(rel, 1280);

    // 1a. Primer Tab → «Salta al contingut» / «Saltar al contenido», Enter → <main id="contingut">
    await p.keyboard.press('Tab');
    const infoSalta = await p.evaluate(() => {
      const a = document.activeElement;
      const r = a ? a.getBoundingClientRect() : null;
      return {
        esSalta: Boolean(a && a.classList.contains('salta-contingut')),
        text: a ? a.textContent.trim() : '',
        href: a ? a.getAttribute('href') : '',
        visible: Boolean(r && r.left >= 0 && r.width > 0 && r.height > 0),
        lang: document.documentElement.lang,
      };
    });
    const textEsperat = infoSalta.lang === 'es' ? 'Saltar al contenido' : 'Salta al contingut';
    await p.keyboard.press('Enter');
    const idDespres = await p.evaluate(() => ({
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
    }));
    if (!infoSalta.esSalta || !infoSalta.visible || infoSalta.text !== textEsperat || infoSalta.href !== '#contingut' || idDespres.tag !== 'MAIN' || idDespres.id !== 'contingut') {
      errorsSalta.push(`${rel}: tab=${infoSalta.esSalta ? infoSalta.text : 'altre'} (visible=${infoSalta.visible}), enter=${idDespres.tag}#${idDespres.id}`);
    }

    // 1b. Contrast WCAG AA del text visible a 1280 px
    const audit = await p.evaluate(() => {
      function parseColor(str) {
        const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(str || '');
        if (!m) return null;
        return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
      }
      function blend(fg, bg) {
        const a = fg[3];
        if (a >= 1) return [fg[0], fg[1], fg[2], 1];
        return [
          fg[0] * a + bg[0] * (1 - a),
          fg[1] * a + bg[1] * (1 - a),
          fg[2] * a + bg[2] * (1 - a),
          1,
        ];
      }
      function lum(rgb) {
        const c = rgb.slice(0, 3).map(v => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      }
      function ratio(c1, c2) {
        const l1 = lum(c1), l2 = lum(c2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }
      function selectorCurt(el) {
        const cls = typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
        return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls;
      }

      let saltats = 0;
      const vistos = new Set();
      const infraccions = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const txt = (node.nodeValue || '').trim();
        if (!txt) continue;
        const el = node.parentElement;
        if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE'].includes(el.tagName)) continue;
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || rect.right <= 0) continue;
        // Comprova que cap ancestre amagui l'element (p. ex. opacity: 0 o offscreen)
        let amagat = false;
        let fonsImatge = false;
        const capes = [];
        let opacitatAcum = 1;
        for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
          const cs = getComputedStyle(cur);
          const op = Number(cs.opacity);
          if (cs.display === 'none' || cs.visibility === 'hidden' || op === 0) { amagat = true; break; }
          opacitatAcum *= op;
          if (cs.backgroundImage && cs.backgroundImage !== 'none') fonsImatge = true;
          const bg = parseColor(cs.backgroundColor);
          if (bg && bg[3] > 0) capes.push(bg);
          if (bg && bg[3] >= 1) break;
        }
        if (amagat) continue;
        if (fonsImatge) { saltats++; continue; }

        let bgFinal = [10, 14, 26, 1];
        for (let i = capes.length - 1; i >= 0; i--) bgFinal = blend(capes[i], bgFinal);
        const fgRaw = parseColor(st.color);
        if (!fgRaw) continue;
        const fgEff = blend([fgRaw[0], fgRaw[1], fgRaw[2], fgRaw[3] * opacitatAcum], bgFinal);

        const mida = parseFloat(st.fontSize) || 16;
        const pes = parseInt(st.fontWeight, 10) || 400;
        const gran = mida >= 24 || (mida >= 18.66 && pes >= 700);
        const minim = gran ? 3.0 : 4.5;
        const r = ratio(fgEff, bgFinal);
        if (r + 0.01 < minim) {
          const sel = selectorCurt(el);
          const fgHex = fgEff.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
          const bgHex = bgFinal.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
          const clau = `${sel}|${fgHex}|${bgHex}`;
          if (!vistos.has(clau)) {
            vistos.add(clau);
            infraccions.push({ sel, r: Number(r.toFixed(2)), minim, fg: `#${fgHex}`, bg: `#${bgHex}`, mida: Math.round(mida), mostra: txt.slice(0, 40) });
          }
        }
      }
      return { saltats, infraccions };
    });

    saltatsFonsImatge += audit.saltats;
    for (const inf of audit.infraccions) {
      const desc = `${rel} · ${inf.sel} (${inf.fg} sobre ${inf.bg}, ${inf.r}:1 < ${inf.minim}:1, ${inf.mida}px) «${inf.mostra}»`;
      if (PENDENTS_DE_CLAUDE.some(x => x.pagina === rel && x.patro.test(desc))) pendentsContrast.push(desc);
      else infraccionsContrast.push(desc);
    }
  }

  ok(`«Salta al contingut» funciona amb Tab + Enter a totes les pàgines generades (${pagines.length})`,
    errorsSalta.length === 0, errorsSalta.slice(0, 5).join(' | '));

  // 2. Focus visible a la portada (index.html) i a una pàgina de servei (serveis/dpo-extern/index.html)
  for (const rel of ['index.html', 'serveis/dpo-extern/index.html']) {
    await obrir(rel, 1280);
    await p.evaluate(() => { window.__vistosFocus = new Set(); });
    const senseContorn = [];
    let comprovats = 0;
    // Recorre els elements enfocables amb Tab real (dispara :focus-visible)
    for (let pas = 0; pas < 220; pas++) {
      await p.keyboard.press('Tab');
      const info = await p.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return null;
        if (window.__vistosFocus.has(el)) return { repetit: true };
        window.__vistosFocus.add(el);
        const st = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const clau = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('name') ? `[name=${el.getAttribute('name')}]` : ''} «${el.textContent.trim().slice(0, 24)}»`;
        const teOutline = st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 1;
        const teBoxShadow = st.boxShadow && st.boxShadow !== 'none';
        return {
          repetit: false,
          clau,
          visible: r.width > 0 && r.height > 0,
          teIndicador: teOutline || teBoxShadow,
          outline: `${st.outlineWidth} ${st.outlineStyle} ${st.outlineColor}`,
        };
      });
      if (!info || info.repetit) break;
      if (!info.visible) continue;
      comprovats++;
      if (!info.teIndicador) senseContorn.push(`${info.clau} (${info.outline})`);
    }
    ok(`focus visible en tots els elements enfocables amb teclat de ${rel} (${comprovats} comprovats)`,
      comprovats > 5 && senseContorn.length === 0, senseContorn.slice(0, 5).join(' | '));
  }

  // 3. Menú mòbil amb teclat a 375 px (Enter, Escape amb retorn de focus i Espai)
  await obrir('index.html', 375);
  await p.locator('.nav-burger').focus();
  const abans = await p.evaluate(() => ({
    expanded: document.querySelector('.nav-burger')?.getAttribute('aria-expanded'),
    obert: document.getElementById('navMobile')?.classList.contains('open'),
  }));
  await p.keyboard.press('Enter');
  const obertEnter = await p.evaluate(() => ({
    expanded: document.querySelector('.nav-burger')?.getAttribute('aria-expanded'),
    obert: document.getElementById('navMobile')?.classList.contains('open'),
  }));
  await p.keyboard.press('Escape');
  const tancatEsc = await p.evaluate(() => ({
    expanded: document.querySelector('.nav-burger')?.getAttribute('aria-expanded'),
    obert: document.getElementById('navMobile')?.classList.contains('open'),
    focusAlBoto: document.activeElement?.classList.contains('nav-burger'),
  }));
  await p.keyboard.press('Space');
  const obertEspai = await p.evaluate(() => ({
    expanded: document.querySelector('.nav-burger')?.getAttribute('aria-expanded'),
    obert: document.getElementById('navMobile')?.classList.contains('open'),
  }));
  await p.keyboard.press('Space');
  const tancatEspai = await p.evaluate(() => ({
    expanded: document.querySelector('.nav-burger')?.getAttribute('aria-expanded'),
    obert: document.getElementById('navMobile')?.classList.contains('open'),
  }));
  ok('menú mòbil (375 px) s\'obre i tanca amb Enter/Espai, Escape el tanca i retorna el focus al botó, i aria-expanded està al dia',
    abans.expanded === 'false' && !abans.obert
    && obertEnter.expanded === 'true' && obertEnter.obert
    && tancatEsc.expanded === 'false' && !tancatEsc.obert && tancatEsc.focusAlBoto
    && obertEspai.expanded === 'true' && obertEspai.obert
    && tancatEspai.expanded === 'false' && !tancatEspai.obert,
    JSON.stringify({ abans, obertEnter, tancatEsc, obertEspai, tancatEspai }));

  // 4. Contrast WCAG AA
  console.log(`Contrast WCAG AA analitzat a ${pagines.length} pàgines (1280 px) · ${saltatsFonsImatge} elements sobre fons amb imatge/degradat saltats`);
  for (const av of pendentsContrast) console.log(`⚠ [PENDENT DE CLAUDE] ${av}`);
  for (const err of infraccionsContrast) console.log(`✗ [CONTRAST] ${err}`);
  ok('cap infracció de contrast WCAG AA', infraccionsContrast.length === 0, `${infraccionsContrast.length} infraccions`);
} finally {
  if (navegador) { try { await navegador.close(); } catch {} }
  srv.close();
}

console.log(fallades ? `\n${fallades} comprovacions de teclat i contrast fallides` : '\ntotes les comprovacions de teclat, focus i contrast correctes');
process.exit(fallades ? 1 : 0);
