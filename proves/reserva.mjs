// Proves del selector de reserves propi (WEB-G05a, actualitzat a WEB-G07a), amb Playwright i sense internet:
// treballa sobre una còpia temporal de dist/ amb ACTIVA = true i també comprova el dist/ real (ACTIVA = false).
// Llegeix les respostes simulades de proves/contractes/reserva.json i aplica les capçaleres reals de _headers.
// Ús: npm run construir && node proves/reserva.mjs [--captures <carpeta>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const CONTRACTE = JSON.parse(fs.readFileSync(path.join(ARREL, 'proves/contractes/reserva.json'), 'utf8'));
const ORIGEN = 'https://madeinhuman.cat';
const API_BASE = 'https://rgpd.madeinhuman.cat';
const API_DIAG = `${API_BASE}/api/public/diagnostic`;
const API_FRANGES = `${API_BASE}${CONTRACTE.franges.ruta.split('?')[0]}`;
const API_RESERVA = `${API_BASE}${CONTRACTE.reserva.ruta}`;

let dirCaptures = null;
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--captures' && process.argv[i + 1]) {
    dirCaptures = path.resolve(process.argv[++i]);
  } else if (arg.startsWith('--captures=')) {
    dirCaptures = path.resolve(arg.slice('--captures='.length));
  }
}
if (dirCaptures) fs.mkdirSync(dirCaptures, { recursive: true });

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(path.join(DIST, 'reserva/index.html')) || !fs.existsSync(path.join(DIST, 'reserva.js'))) {
  console.log('✗ falta dist/reserva/index.html o dist/reserva.js: executa abans npm run construir');
  process.exit(1);
}

// 1. Comprovacions estàtiques del dist/ real i del contracte
const htmlReserva = fs.readFileSync(path.join(DIST, 'reserva/index.html'), 'utf8');
const jsReal = fs.readFileSync(path.join(DIST, 'reserva.js'), 'utf8');
const mapaReal = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const ACTIVA_REAL = /\bvar\s+ACTIVA\s*=\s*true\s*;/.test(jsReal);
ok(`dist/reserva.js declara l'interruptor ACTIVA (ara: ${ACTIVA_REAL})`, /\bvar\s+ACTIVA\s*=\s*(true|false)\s*;/.test(jsReal));
ok('/reserva/ té noindex, nofollow, enllaços a /diagnostic i /#contacte i queda fora del mapa del lloc',
  htmlReserva.includes('<meta name="robots" content="noindex, nofollow" />')
  && htmlReserva.includes('href="/diagnostic"')
  && htmlReserva.includes('href="/#contacte"')
  && !mapaReal.includes('/reserva/'));
ok('proves/contractes/reserva.json defineix estat "pendent" a la resposta 200 del POST',
  CONTRACTE.reserva?.respostes?.['200']?.estat === 'pendent'
  && Array.isArray(CONTRACTE.franges?.respostes?.['200']?.franges)
  && CONTRACTE.franges.respostes['200'].franges.length > 0);

// Llegeix regles CSP de _headers (igual que proves/csp.cjs)
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

function fitxerDe(arrelDir, url) {
  const p = decodeURIComponent(new URL(url).pathname);
  let f = path.join(arrelDir, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  return (f === arrelDir || f.startsWith(arrelDir + path.sep)) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}

// Còpia temporal de dist/ amb ACTIVA = true (i rèplica /es/reserva/ per provar el diccionari es sota CSP real)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'reserva-'));
const DIST_ACTIVA = path.join(TMP, 'dist');
fs.cpSync(DIST, DIST_ACTIVA, { recursive: true });
fs.writeFileSync(
  path.join(DIST_ACTIVA, 'reserva.js'),
  jsReal.replace(/\bvar\s+ACTIVA\s*=\s*(true|false)\s*;/, 'var ACTIVA = true;'),
);
// Còpia amb ACTIVA = false: amb l'interruptor apagat no s'ha de fer cap petició
const DIST_INACTIVA = path.join(TMP, 'dist-inactiva');
fs.cpSync(DIST, DIST_INACTIVA, { recursive: true });
fs.writeFileSync(path.join(DIST_INACTIVA, 'reserva.js'), jsReal.replace(/\bvar\s+ACTIVA\s*=\s*(true|false)\s*;/, 'var ACTIVA = false;'));
fs.mkdirSync(path.join(DIST_ACTIVA, 'es/reserva'), { recursive: true });
fs.writeFileSync(
  path.join(DIST_ACTIVA, 'es/reserva/index.html'),
  htmlReserva
    .replace(/<html\s+lang="ca"/i, '<html lang="es"')
    .replace('data-idioma="ca"', 'data-idioma="es"'),
);

const cspDe = llegirCsp(DIST_ACTIVA);
const launchOpts = {
  args: ['--disable-dev-shm-usage', '--disable-gpu'],
  ...(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {}),
};
let navegador = await chromium.launch(launchOpts);

async function reiniciarNavegador() {
  if (navegador) { try { await navegador.close(); } catch {} }
  navegador = await chromium.launch(launchOpts);
}

async function ambReintent(fn) {
  for (let intent = 0; intent < 3; intent++) {
    try {
      return await fn();
    } catch (err) {
      if (intent === 2 || !/crashed|closed|Target page/i.test(String(err.message))) throw err;
      await reiniciarNavegador();
    }
  }
}

async function novaPagina(arrelDir, { viewport = { width: 1280, height: 800 }, handlerApi } = {}) {
  const ctx = await navegador.newContext({ viewport });
  await ctx.addInitScript(() => {
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const p = await ctx.newPage();
  const errors = [];
  const peticionsApi = [];
  const descarregues = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('download', d => descarregues.push(d.suggestedFilename()));

  await p.route('**/*', async route => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(`${API_BASE}/`)) {
      peticionsApi.push({ method: req.method(), url, body: req.postData() || null });
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': ORIGEN, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' } });
      }
      if (handlerApi) return handlerApi(route, req, url);
      return route.fulfill({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: '{"ok":false}' });
    }
    if (url.startsWith(ORIGEN)) {
      const f = fitxerDe(arrelDir, url);
      if (!f) return route.fulfill({ status: 404, body: 'no trobat' });
      const headers = { 'Content-Type': TIPUS[path.extname(f)] || 'application/octet-stream' };
      const csp = f.endsWith('.html') ? cspDe(new URL(url).pathname) : null;
      if (csp) headers['Content-Security-Policy'] = csp;
      return route.fulfill({ status: 200, headers, body: fs.readFileSync(f) });
    }
    return route.abort();
  });

  return { ctx, p, errors, peticionsApi, descarregues };
}

async function ambPagina(arrelDir, opts, fn) {
  return ambReintent(async () => {
    const sessio = await novaPagina(arrelDir, opts);
    try {
      return await fn(sessio);
    } finally {
      try { await sessio.ctx.close(); } catch {}
    }
  });
}

const FRANJA_CONTRACTE = CONTRACTE.franges.respostes['200'].franges[0];

try {
  // 2. Cas nou (ca): POST amb estat: 'pendent' del contracte → «Sol·licitud rebuda», sense botó .ics, focus al títol i aria-live
  {
    const r = await ambPagina(DIST_ACTIVA, {
      viewport: { width: 375, height: 812 },
      handlerApi: (route, req, url) => {
        if (url.startsWith(API_FRANGES)) {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.franges.respostes['200']) });
        }
        if (url === API_RESERVA && req.method() === 'POST') {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.reserva.respostes['200']) });
        }
        return route.abort();
      },
    }, async ({ p, errors, peticionsApi, descarregues }) => {
      await p.goto(`${ORIGEN}/reserva/?t=tok_secret_123`, { waitUntil: 'load' });
      await p.waitForSelector('.reserva-franja');

      const searchDespres = await p.evaluate(() => window.location.search);
      const altures = await p.evaluate(() => [...document.querySelectorAll('.reserva-franja')].map(b => b.getBoundingClientRect().height));

      await p.click(`.reserva-franja[data-franja="${FRANJA_CONTRACTE.id}"]`);
      await p.waitForSelector('[data-reserva-confirmar]');
      const textConf = await p.textContent('#reserva-pagina');

      await p.click('[data-reserva-confirmar]');
      await p.waitForSelector('.reserva-pendent');
      const titol = await p.textContent('.reserva-pendent .reserva-titol');
      const textPendent = await p.textContent('#reserva-pagina');
      const estatLive = await p.textContent('.reserva-estat[aria-live="polite"]');
      const botonsIcs = await p.locator('[data-reserva-ics]').count();
      const teEnllacContacte = await p.locator('.reserva-pendent a[href="/#contacte"]').textContent();
      const focusAlTitol = await p.evaluate(() => Boolean(document.activeElement && document.activeElement.classList.contains('reserva-titol')));
      const infraccions = await p.evaluate(() => window.__infraccions);
      const reqPost = peticionsApi.find(x => x.method === 'POST' && x.url === API_RESERVA);
      const postRebut = reqPost?.body ? JSON.parse(reqPost.body) : null;

      if (dirCaptures) {
        await p.evaluate(() => window.scrollTo(0, 0));
        await p.screenshot({ path: path.join(dirCaptures, 'reserva-pendent-ca-375.png'), fullPage: true });
        await p.setViewportSize({ width: 1280, height: 800 });
        await p.evaluate(() => window.scrollTo(0, 0));
        await p.screenshot({ path: path.join(dirCaptures, 'reserva-pendent-ca-1280.png'), fullPage: true });
      }
      return { searchDespres, altures, textConf, titol, textPendent, estatLive, botonsIcs, teEnllacContacte, focusAlTitol, infraccions, postRebut, errors, descarregues };
    });

    ok('/reserva/?t=… esborra el token de la barra d\'adreces amb history.replaceState', r.searchDespres === '');
    ok('a mòbil (375 px), tots els botons de franja fan com a mínim 44 px d\'alçada', r.altures.length > 0 && r.altures.every(h => h >= 44), JSON.stringify(r.altures));
    ok('en triar la franja del contracte mostra el pas de confirmació amb la durada i l\'hora',
      r.textConf.includes(`Confirmar la trucada de ${CONTRACTE.franges.respostes['200'].durada} minuts`) && r.textConf.includes('15:00'));
    ok('POST amb estat "pendent" (ca) mostra «Sol·licitud rebuda», detall, text de confirmació manual, enllaç a /#contacte i cap botó ni descàrrega .ics',
      r.postRebut?.t === 'tok_secret_123'
      && r.postRebut?.franja === FRANJA_CONTRACTE.id
      && r.titol === 'Sol·licitud rebuda'
      && r.textPendent.includes('15:00')
      && r.textPendent.includes('20 minuts')
      && r.textPendent.includes("Us confirmarem l'hora per correu. Si no us arriba, reviseu el correu brossa o escriviu-nos.")
      && r.teEnllacContacte?.trim() === 'Escriviu-nos'
      && r.botonsIcs === 0
      && r.descarregues.length === 0);
    ok('estat "pendent" (ca) mou el focus al títol, anuncia el canvi a aria-live i no produeix errors ni infraccions de CSP',
      r.focusAlTitol && r.estatLive.includes('Sol·licitud rebuda') && r.errors.length === 0 && r.infraccions.length === 0,
      [r.focusAlTitol ? '' : 'sense focus', `aria-live="${r.estatLive}"`, ...r.errors, ...r.infraccions].filter(Boolean).join(' | '));
  }

  // 3. Cas nou (es): POST amb estat: 'pendent' del contracte → «Solicitud recibida», sense botó .ics, enllaç a /es/#contacto
  {
    const r = await ambPagina(DIST_ACTIVA, {
      viewport: { width: 375, height: 812 },
      handlerApi: (route, req, url) => {
        if (url.startsWith(API_FRANGES)) {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.franges.respostes['200']) });
        }
        if (url === API_RESERVA && req.method() === 'POST') {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.reserva.respostes['200']) });
        }
        return route.abort();
      },
    }, async ({ p, errors, descarregues }) => {
      await p.goto(`${ORIGEN}/es/reserva/?t=tok_es_123`, { waitUntil: 'load' });
      await p.waitForSelector('.reserva-franja');
      await p.click(`.reserva-franja[data-franja="${FRANJA_CONTRACTE.id}"]`);
      await p.waitForSelector('[data-reserva-confirmar]');
      await p.click('[data-reserva-confirmar]');
      await p.waitForSelector('.reserva-pendent');

      const titol = await p.textContent('.reserva-pendent .reserva-titol');
      const textPendent = await p.textContent('#reserva-pagina');
      const estatLive = await p.textContent('.reserva-estat[aria-live="polite"]');
      const botonsIcs = await p.locator('[data-reserva-ics]').count();
      const teEnllacContacte = await p.locator('.reserva-pendent a[href="/es/#contacto"]').textContent();
      const focusAlTitol = await p.evaluate(() => Boolean(document.activeElement && document.activeElement.classList.contains('reserva-titol')));
      const infraccions = await p.evaluate(() => window.__infraccions);

      if (dirCaptures) {
        await p.evaluate(() => window.scrollTo(0, 0));
        await p.screenshot({ path: path.join(dirCaptures, 'reserva-pendent-es-375.png'), fullPage: true });
        await p.setViewportSize({ width: 1280, height: 800 });
        await p.evaluate(() => window.scrollTo(0, 0));
        await p.screenshot({ path: path.join(dirCaptures, 'reserva-pendent-es-1280.png'), fullPage: true });
      }
      return { titol, textPendent, estatLive, botonsIcs, teEnllacContacte, focusAlTitol, infraccions, errors, descarregues };
    });

    ok('POST amb estat "pendent" (es) mostra «Solicitud recibida», detall, text de confirmació manual, enllaç a /es/#contacto, focus, aria-live i cap .ics',
      r.titol === 'Solicitud recibida'
      && r.textPendent.includes('15:00')
      && r.textPendent.includes('20 minutos')
      && r.textPendent.includes('Os confirmaremos la hora por correo. Si no os llega, revisad la carpeta de correo no deseado o escribidnos.')
      && r.teEnllacContacte?.trim() === 'Escribidnos'
      && r.botonsIcs === 0
      && r.descarregues.length === 0
      && r.focusAlTitol
      && r.estatLive.includes('Solicitud recibida')
      && r.errors.length === 0
      && r.infraccions.length === 0);
  }

  // 4. Compatibilitat amb format antic (POST sense estat) + agrupació hivern (+01:00) i estiu (UTC Z → +02:00) + .ics
  {
    const frangesDst = {
      ...CONTRACTE.franges.respostes['200'],
      franges: [
        ...CONTRACTE.franges.respostes['200'].franges,
        { id: 'f_hivern_2', inici: '2026-12-03T16:30:00+01:00', fi: '2026-12-03T16:50:00+01:00' },
        // 08:00 UTC a juliol = 10:00 Europe/Madrid (horari d'estiu +02:00)
        { id: 'f_estiu_1', inici: '2026-07-15T08:00:00Z', fi: '2026-07-15T08:20:00Z' },
      ],
    };
    const { estat: _estat, ...respostaAntiga } = CONTRACTE.reserva.respostes['200'];
    const r = await ambPagina(DIST_ACTIVA, {
      viewport: { width: 375, height: 812 },
      handlerApi: (route, req, url) => {
        if (url.startsWith(API_FRANGES)) {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(frangesDst) });
        }
        if (url === API_RESERVA && req.method() === 'POST') {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(respostaAntiga) });
        }
        return route.abort();
      },
    }, async ({ p, errors }) => {
      await p.goto(`${ORIGEN}/reserva/?t=tok_antic_123`, { waitUntil: 'load' });
      await p.waitForSelector('.reserva-franja');
      const text = await p.textContent('#reserva-pagina');
      const dies = await p.locator('.reserva-dia').count();

      await p.click(`.reserva-franja[data-franja="${FRANJA_CONTRACTE.id}"]`);
      await p.waitForSelector('[data-reserva-confirmar]');
      await p.click('[data-reserva-confirmar]');
      await p.waitForSelector('[data-reserva-ics]');
      const ics = await p.getAttribute('[data-reserva-ics]', 'data-ics-preview');
      const textExit = await p.textContent('#reserva-pagina');
      const infraccions = await p.evaluate(() => window.__infraccions);
      return { text, dies, ics, textExit, errors, infraccions };
    });

    ok('agrupa les franges per dia amb horari d\'hivern (15:00/16:30) i d\'estiu (08:00Z → 10:00) i avís de zona',
      r.dies === 2 && r.text.includes('Hores en horari de Catalunya') && r.text.includes('15:00') && r.text.includes('16:30') && r.text.includes('10:00'));
    ok('compatibilitat (POST sense estat) manté «Trucada reservada», botó de calendari i .ics vàlid en UTC sense dades personals',
      r.textExit.includes('Trucada reservada')
      && r.textExit.includes('Us enviarem la confirmació per correu')
      && r.ics.includes('BEGIN:VCALENDAR') && r.ics.includes('DTSTART:20261203T140000Z') && r.ics.includes('DTEND:20261203T142000Z')
      && r.ics.includes('SUMMARY:Trucada Madeinhuman') && r.ics.includes('UID:') && !r.ics.includes('tok_antic_123')
      && r.errors.length === 0 && r.infraccions.length === 0);
  }

  // 5. Error 409 (franja ocupada del contracte) → avís i recàrrega de franges
  {
    const r = await ambReintent(async () => {
      let gets = 0;
      const sessio = await novaPagina(DIST_ACTIVA, {
        handlerApi: (route, req, url) => {
          if (url.startsWith(API_FRANGES)) {
            gets++;
            const cos = gets === 1
              ? CONTRACTE.franges.respostes['200']
              : { ...CONTRACTE.franges.respostes['200'], franges: [{ id: 'f_2', inici: '2026-12-03T17:00:00+01:00', fi: '2026-12-03T17:20:00+01:00' }] };
            return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(cos) });
          }
          if (url === API_RESERVA) {
            return route.fulfill({ status: 409, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.reserva.respostes['409']) });
          }
          return route.abort();
        },
      });
      try {
        const { p } = sessio;
        await p.goto(`${ORIGEN}/reserva/?t=tok_409`, { waitUntil: 'load' });
        await p.waitForSelector(`.reserva-franja[data-franja="${FRANJA_CONTRACTE.id}"]`);
        await p.click(`.reserva-franja[data-franja="${FRANJA_CONTRACTE.id}"]`);
        await p.click('[data-reserva-confirmar]');
        await p.waitForSelector('.reserva-franja[data-franja="f_2"]');
        const estatTxt = await p.textContent('.reserva-estat');
        return { gets, estatTxt };
      } finally {
        try { await sessio.ctx.close(); } catch {}
      }
    });
    ok('409 (contracte) mostra «Aquesta hora s\'acaba d\'ocupar» i recarrega les franges', r.gets === 2 && r.estatTxt.includes("Aquesta hora s'acaba d'ocupar"));
  }

  // 6. Error 400 (dades invàlides del contracte) → torna a les franges amb avís
  {
    const estatTxt = await ambPagina(DIST_ACTIVA, {
      handlerApi: (route, req, url) => {
        if (url.startsWith(API_FRANGES)) {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.franges.respostes['200']) });
        }
        if (url === API_RESERVA) {
          return route.fulfill({ status: 400, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.reserva.respostes['400']) });
        }
        return route.abort();
      },
    }, async ({ p }) => {
      await p.goto(`${ORIGEN}/reserva/?t=tok_400`, { waitUntil: 'load' });
      await p.waitForSelector(`.reserva-franja[data-franja="${FRANJA_CONTRACTE.id}"]`);
      await p.click(`.reserva-franja[data-franja="${FRANJA_CONTRACTE.id}"]`);
      await p.click('[data-reserva-confirmar]');
      await p.waitForSelector('.reserva-estat-err');
      return p.textContent('.reserva-estat');
    });
    ok('400 (contracte) torna al selector amb avís d\'error', estatTxt.includes('No hem pogut completar la reserva'));
  }

  // 7. 404, franges: [], error de xarxa i /reserva/ sense t (respostes del contracte)
  for (const [nom, ruta, mode, esperat] of [
    ['404 (contracte) mostra «L\'enllaç ja no és vàlid» i enllaç a /#contacte', '/reserva/?t=caducat', '404', "L'enllaç ja no és vàlid"],
    ['franges: [] (contracte) mostra avís i enllaç a /#contacte', '/reserva/?t=buit', 'buit', 'no hi ha hores lliures'],
    ['error de xarxa mostra avís i enllaç a /#contacte', '/reserva/?t=xarxa', 'xarxa', 'No hem pogut connectar'],
    ['/reserva/ sense t mostra missatge d\'entrada sense cridar l\'API', '/reserva/', 'cap', 'Per reservar una trucada, feu el diagnòstic gratuït o escriviu-nos'],
  ]) {
    const r = await ambPagina(DIST_ACTIVA, {
      handlerApi: route => {
        if (mode === '404') return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.franges.respostes['404']) });
        if (mode === 'buit') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.franges.respostes['200-buit']) });
        return route.abort('failed');
      },
    }, async ({ p, peticionsApi }) => {
      await p.goto(`${ORIGEN}${ruta}`, { waitUntil: 'load' });
      if (mode !== 'cap') await p.waitForSelector('.reserva-missatge');
      const txt = await p.textContent('#reserva-pagina');
      const teContacte = await p.locator('#reserva-pagina a[href="/#contacte"]').count() > 0;
      return { txt, teContacte, peticionsApi };
    });
    ok(nom, r.txt.includes(esperat) && r.teContacte && (mode !== 'cap' || r.peticionsApi.length === 0));
  }

  // 8. /diagnostic amb i sense tokenReserva (amb ACTIVA = true)
  async function ferDiagnostic(arrelDir, ambToken) {
    return ambPagina(arrelDir, {
      handlerApi: (route, req, url) => {
        if (url === API_DIAG) {
          const resp = {
            ok: true, referencia: 'DG-2026-0100', index: 50, nivell: 'mitja',
            top: ['Risc 1', 'Risc 2', 'Risc 3'], documentsOk: 4, documentsTotal: 10, documentsDubte: false,
            ...(ambToken ? { tokenReserva: 'tok_diag_99' } : {}),
          };
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(resp) });
        }
        if (url.startsWith(API_FRANGES)) {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(CONTRACTE.franges.respostes['200']) });
        }
        return route.abort();
      },
    }, async ({ p, errors, peticionsApi }) => {
      await p.goto(`${ORIGEN}/diagnostic`, { waitUntil: 'load' });
      await p.click('[data-go="next"]');
      for (let i = 0; i < 11; i++) {
        const step = p.locator('.step.on');
        await step.locator('.opt').first().click();
        const btnNext = step.locator('[data-go="next"]');
        if (await btnNext.count()) await btnNext.click();
        else await p.waitForTimeout(260);
      }
      await p.fill('#d-nom', 'Marta Prova');
      await p.fill('#d-empresa', 'Empresa Prova SL');
      await p.fill('#d-email', 'marta@exemple.cat');
      await p.check('input[name="privacitat"]');
      await p.click('#send');
      await p.waitForSelector('.step.res.on');
      await p.waitForTimeout(150);
      const reservaOcult = await p.locator('#reserva').isHidden();
      const ctaOcult = await p.locator('.step.res .cta').isHidden();
      const franges = await p.locator('#reserva .reserva-franja').count();
      const infraccions = await p.evaluate(() => window.__infraccions);
      return { reservaOcult, ctaOcult, franges, peticionsApi, errors, infraccions };
    });
  }

  const diagAmb = await ferDiagnostic(DIST_ACTIVA, true);
  ok('/diagnostic (ACTIVA=true + tokenReserva) munta el selector a #reserva i amaga el botó de CALENDARI_URL',
    !diagAmb.reservaOcult && diagAmb.ctaOcult && diagAmb.franges === CONTRACTE.franges.respostes['200'].franges.length && diagAmb.errors.length === 0 && diagAmb.infraccions.length === 0);

  const diagSense = await ferDiagnostic(DIST_ACTIVA, false);
  ok('/diagnostic (ACTIVA=true sense tokenReserva) manté #reserva ocult i el botó de CALENDARI_URL visible',
    diagSense.reservaOcult && !diagSense.ctaOcult && diagSense.peticionsApi.filter(x => x.url.includes('/reserva')).length === 0);

  // 9. Amb l'interruptor apagat (ACTIVA = false): cap petició a l'API de reserves ni a /diagnostic ni a /reserva/
  const diagReal = await ferDiagnostic(DIST_INACTIVA, true);
  ok('ACTIVA=false: /diagnostic amb tokenReserva NO fa cap petició de reserva',
    diagReal.reservaOcult && !diagReal.ctaOcult && diagReal.peticionsApi.filter(x => x.url.includes('/reserva')).length === 0);

  const rReal = await ambPagina(DIST_INACTIVA, {}, async ({ p, peticionsApi }) => {
    await p.goto(`${ORIGEN}/reserva/?t=tok_real`, { waitUntil: 'load' });
    await p.waitForTimeout(150);
    return { txt: await p.textContent('#reserva-pagina'), peticionsApi };
  });
  ok('ACTIVA=false: /reserva/?t=… mostra el missatge alternatiu i NO fa cap petició a l\'API',
    rReal.peticionsApi.length === 0 && rReal.txt.includes('Per reservar una trucada, feu el diagnòstic gratuït o escriviu-nos'));
} finally {
  if (navegador) { try { await navegador.close(); } catch {} }
  fs.rmSync(TMP, { recursive: true, force: true });
}

if (dirCaptures) console.log(`captures desades a ${dirCaptures}`);
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions del selector de reserves correctes');
process.exit(fallades ? 1 : 0);
