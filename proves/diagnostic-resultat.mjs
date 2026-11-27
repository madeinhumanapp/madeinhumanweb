// Proves de la pantalla de resultat del diagnòstic en semàfor (WEB-G02), amb Playwright i sense internet:
// serveix dist/ amb la CSP de _headers, omple el diagnòstic, intercepta POST https://rgpd.madeinhuman.cat/api/public/diagnostic
// i comprova els tres nivells (baix 20, mitjà 50, alt 80): llum encesa, etiqueta, índex, aria-label, focus, 3 riscos,
// estat documental, crida, contenidor #reserva ocult i cap error ni infracció de CSP.
// Ús: npm run construir && node proves/diagnostic-resultat.mjs [--captures]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const CAPTURES = process.argv.includes('--captures');
const DIR_CAPTURES = path.join(ARREL, 'captures/diagnostic-resultat');
const ORIGEN = 'https://madeinhuman.cat';
const API_URL = 'https://rgpd.madeinhuman.cat/api/public/diagnostic';

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(path.join(DIST, 'diagnostic.html'))) {
  console.log('✗ dist/diagnostic.html no existeix: executa abans npm run construir');
  process.exit(1);
}

const csp = (() => {
  let dins = false;
  for (const l of fs.readFileSync(path.join(DIST, '_headers'), 'utf8').split('\n')) {
    if (/^\/diagnostic\s*$/.test(l)) { dins = true; continue; }
    if (dins && /^\S/.test(l)) break;
    const m = dins && /^\s+Content-Security-Policy:\s*(.+)$/.exec(l);
    if (m) return m[1].trim();
  }
  return null;
})();

const TIPUS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json',
};

function fitxerDe(url) {
  const p = decodeURIComponent(new URL(url).pathname);
  let f = path.join(DIST, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  return f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}

const CASOS = [
  {
    nivell: 'baix', etiqueta: 'Risc baix', index: 20, docsText: '8 de 10 documents',
    resposta: {
      ok: true, referencia: 'DG-2026-0001', index: 20, nivell: 'baix',
      top: ['Revisar terminis de conservació', 'Actualitzar clàusules de formularis', 'Documentar còpies de seguretat'],
      documentsOk: 8, documentsTotal: 10, documentsDubte: false,
    },
  },
  {
    nivell: 'mitja', etiqueta: 'Risc mitjà', index: 50, docsText: '4 de 10 documents',
    resposta: {
      ok: true, referencia: 'DG-2026-0002', index: 50, nivell: 'mitja',
      top: ['Contractes d\'encàrrec pendents', 'Falta doble verificació al correu', 'Registre d\'activitats incomplet'],
      documentsOk: 4, documentsTotal: 10, documentsDubte: false,
    },
  },
  {
    nivell: 'alt', etiqueta: 'Risc alt', index: 80, docsText: 'pendent de confirmar',
    resposta: {
      ok: true, referencia: 'DG-2026-0003', index: 80, nivell: 'alt',
      top: ['Tractament de dades sensibles sense anàlisi de riscos', 'Sense còpies externes ni protocol de bretxes', 'Manca de documentació bàsica del RGPD'],
      documentsOk: 0, documentsTotal: 10, documentsDubte: true,
    },
  },
];

if (CAPTURES) fs.mkdirSync(DIR_CAPTURES, { recursive: true });

const navegador = await chromium.launch(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {});

async function executarCas(cas, viewport) {
  const ctx = await navegador.newContext({ viewport });
  await ctx.addInitScript(() => {
    window.MIH_TURNSTILE_CLAU = 'clau-de-prova';
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  let interceptat = false;
  await p.route('**/*', async route => {
    const req = route.request();
    const url = req.url();
    if (url === API_URL) {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': ORIGEN, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' } });
      }
      interceptat = true;
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(cas.resposta) });
    }
    if (url.startsWith(ORIGEN)) {
      const f = fitxerDe(url);
      if (!f) return route.fulfill({ status: 404, body: 'no trobat' });
      const headers = { 'Content-Type': TIPUS[path.extname(f)] || 'application/octet-stream' };
      if (csp && f.endsWith('.html')) headers['Content-Security-Policy'] = csp;
      return route.fulfill({ status: 200, headers, body: fs.readFileSync(f) });
    }
    if (url.startsWith('https://challenges.cloudflare.com/turnstile/')) {
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(ARREL, 'proves/turnstile-simulat.js')) });
    }
    return route.abort();
  });

  await p.goto(`${ORIGEN}/diagnostic`, { waitUntil: 'load' });
  await p.click('section.step.on [data-go="next"]');

  const preguntes = await p.evaluate(() =>
    [...document.querySelectorAll('section.step[data-id]')].filter(s => s.querySelector('.opt')).map(s => ({
      id: s.dataset.id,
      multi: !!s.querySelector('.opt[role="checkbox"]'),
      valors: [...s.querySelectorAll('.opt')].map(b => b.dataset.v),
    })));
  for (const q of preguntes) {
    const s = `section.step[data-id="${q.id}"]`;
    await p.waitForSelector(`${s}.on`);
    if (q.multi) {
      const v = q.valors.find(x => !['cap', 'segur'].includes(x));
      await p.click(`${s} .opt[data-v="${v}"]`);
      await p.click(`${s} [data-go="next"]`);
    } else {
      await p.click(`${s} .opt[data-v="${q.valors[0]}"]`);
    }
  }
  await p.waitForSelector('section.step[data-id="contacte"].on');
  await p.fill('#d-nom', 'Persona de Prova');
  await p.fill('#d-empresa', 'Empresa de Prova SL');
  await p.fill('#d-email', 'prova@exemple.cat');
  await p.check('#f input[name="privacitat"]');
  await p.click('#send');
  await p.waitForSelector('section.step[data-id="resultat"].on');

  const dades = await p.evaluate(() => {
    const res = document.querySelector('section.step[data-id="resultat"]');
    const sem = res.querySelector('.semafor');
    const llums = [...res.querySelectorAll('.llum')].map(el => ({ n: el.dataset.llum, on: el.classList.contains('on') }));
    const pill = res.querySelector('.pill')?.textContent?.trim();
    const idx = res.querySelector('.semafor-index')?.textContent?.replace(/\s+/g, ' ').trim();
    const tops = [...res.querySelectorAll('ol.tops li')].map(li => li.textContent.replace(/^\d+/, '').trim());
    const sent = res.querySelector('.sent')?.textContent || '';
    const cta = res.querySelector('.cta a.btn');
    const reserva = document.getElementById('reserva');
    const focusTitol = document.activeElement === res.querySelector('h2');
    const desborda = document.documentElement.scrollWidth > window.innerWidth + 1;
    return {
      role: sem?.getAttribute('role'),
      aria: sem?.getAttribute('aria-label'),
      llums, pill, idx, tops, sent,
      ctaText: cta?.textContent?.trim(),
      ctaHref: cta?.getAttribute('href'),
      reservaOcult: Boolean(reserva && reserva.hidden && reserva.innerHTML === ''),
      focusTitol, desborda,
      infraccions: window.__infraccions,
    };
  });

  if (CAPTURES) {
    await p.screenshot({ path: path.join(DIR_CAPTURES, `${cas.nivell}-${viewport.width}.png`), fullPage: true, animations: 'disabled' });
  }

  const etiquetaVista = `${cas.nivell} (${viewport.width}px)`;
  ok(`${etiquetaVista}: petició interceptada a l'API`, interceptat);
  ok(`${etiquetaVista}: només la llum «${cas.nivell}» és encesa`,
    dades.llums.length === 3
    && dades.llums.every(l => (l.n === cas.nivell ? l.on : !l.on)),
    JSON.stringify(dades.llums));
  ok(`${etiquetaVista}: etiqueta «${cas.etiqueta}» i índex «${cas.index} / 100»`,
    dades.pill === cas.etiqueta && dades.idx === `${cas.index} / 100`, `${dades.pill} · ${dades.idx}`);
  ok(`${etiquetaVista}: role="img" i aria-label complet`,
    dades.role === 'img' && dades.aria === `${cas.etiqueta}: índex ${cas.index} sobre 100`, `${dades.role} · ${dades.aria}`);
  ok(`${etiquetaVista}: 3 riscos principals en llista numerada i estat documental`,
    dades.tops.length === 3 && cas.resposta.top.every((t, i) => dades.tops[i] === t) && dades.sent.includes(cas.docsText),
    JSON.stringify(dades.tops));
  ok(`${etiquetaVista}: crida «Reservar una trucada de 20 minuts», #reserva ocult i focus al títol`,
    dades.ctaText?.includes('Reservar una trucada de 20 minuts') && Boolean(dades.ctaHref) && dades.reservaOcult && dades.focusTitol);
  ok(`${etiquetaVista}: sense desbordament horitzontal, errors de consola ni infraccions de CSP`,
    !dades.desborda && errors.length === 0 && dades.infraccions.length === 0,
    [dades.desborda ? 'desborda' : '', ...errors, ...dades.infraccions].filter(Boolean).join(' · '));

  await ctx.close();
}

const vistes = CAPTURES
  ? [{ width: 375, height: 812 }, { width: 1280, height: 900 }]
  : [{ width: 1280, height: 900 }];

for (const vista of vistes) {
  for (const cas of CASOS) {
    await executarCas(cas, vista);
  }
}

await navegador.close();
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions del resultat del diagnòstic correctes');
process.exit(fallades ? 1 : 0);
