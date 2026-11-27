// Proves del selector de reserves propi (WEB-G05a), amb Playwright i sense internet:
// treballa sobre una còpia temporal de dist/ amb ACTIVA = true i també comprova el dist/ real (ACTIVA = false).
// Intercepta l'API https://rgpd.madeinhuman.cat/api/public/reserva/* i aplica les capçaleres reals de _headers.
// Ús: npm run construir && node proves/reserva.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const ORIGEN = 'https://madeinhuman.cat';
const API_DIAG = 'https://rgpd.madeinhuman.cat/api/public/diagnostic';
const API_FRANGES = 'https://rgpd.madeinhuman.cat/api/public/reserva/franges';
const API_RESERVA = 'https://rgpd.madeinhuman.cat/api/public/reserva';

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(path.join(DIST, 'reserva/index.html')) || !fs.existsSync(path.join(DIST, 'reserva.js'))) {
  console.log('✗ falta dist/reserva/index.html o dist/reserva.js: executa abans npm run construir');
  process.exit(1);
}

// 1. Comprovacions estàtiques del dist/ real
const htmlReserva = fs.readFileSync(path.join(DIST, 'reserva/index.html'), 'utf8');
const jsReal = fs.readFileSync(path.join(DIST, 'reserva.js'), 'utf8');
const mapaReal = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
ok('dist/reserva.js té ACTIVA = false a producció', /\bvar\s+ACTIVA\s*=\s*false\s*;/.test(jsReal));
ok('/reserva/ té noindex, nofollow, enllaços a /diagnostic i /#contacte i queda fora del mapa del lloc',
  htmlReserva.includes('<meta name="robots" content="noindex, nofollow" />')
  && htmlReserva.includes('href="/diagnostic"')
  && htmlReserva.includes('href="/#contacte"')
  && !mapaReal.includes('/reserva/'));

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

// Còpia temporal de dist/ amb ACTIVA = true
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'reserva-'));
const DIST_ACTIVA = path.join(TMP, 'dist');
fs.cpSync(DIST, DIST_ACTIVA, { recursive: true });
fs.writeFileSync(
  path.join(DIST_ACTIVA, 'reserva.js'),
  jsReal.replace(/\bvar\s+ACTIVA\s*=\s*false\s*;/, 'var ACTIVA = true;'),
);

const cspDe = llegirCsp(DIST_ACTIVA);
const navegador = await chromium.launch({
  args: ['--disable-dev-shm-usage'],
  ...(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {}),
});

async function novaPagina(arrelDir, { viewport = { width: 1280, height: 800 }, handlerApi } = {}) {
  const ctx = await navegador.newContext({ viewport });
  await ctx.addInitScript(() => {
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const p = await ctx.newPage();
  const errors = [];
  const peticionsApi = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await p.route('**/*', async route => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith('https://rgpd.madeinhuman.cat/')) {
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

  return { ctx, p, errors, peticionsApi };
}

try {
  // 2. Franges agrupades per dia, canvi d'hora hivern (+01:00) i estiu (UTC Z → +02:00), reserva correcta, .ics i t esborrat de l'URL
  {
    const frangesDst = {
      ok: true, zona: 'Europe/Madrid', durada: 20,
      franges: [
        { id: 'f_hivern_1', inici: '2026-12-03T09:00:00+01:00', fi: '2026-12-03T09:20:00+01:00' },
        { id: 'f_hivern_2', inici: '2026-12-03T10:30:00+01:00', fi: '2026-12-03T10:50:00+01:00' },
        // 08:00 UTC a juliol = 10:00 Europe/Madrid (horari d'estiu +02:00)
        { id: 'f_estiu_1', inici: '2026-07-15T08:00:00Z', fi: '2026-07-15T08:20:00Z' },
      ],
    };
    let postRebut = null;
    const { ctx, p, errors, peticionsApi } = await novaPagina(DIST_ACTIVA, {
      viewport: { width: 375, height: 812 },
      handlerApi: (route, req, url) => {
        if (url.startsWith(API_FRANGES)) {
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(frangesDst) });
        }
        if (url === API_RESERVA && req.method() === 'POST') {
          postRebut = JSON.parse(req.postData());
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN },
            body: JSON.stringify({ ok: true, inici: '2026-12-03T09:00:00+01:00', fi: '2026-12-03T09:20:00+01:00' }) });
        }
        return route.abort();
      },
    });
    await p.goto(`${ORIGEN}/reserva/?t=tok_secret_123`, { waitUntil: 'load' });
    await p.waitForSelector('.reserva-franja');

    const searchDespres = await p.evaluate(() => window.location.search);
    ok('/reserva/?t=… esborra el token de la barra d\'adreces amb history.replaceState', searchDespres === '');

    const text = await p.textContent('#reserva-pagina');
    const dies = await p.locator('.reserva-dia').count();
    ok('agrupa les franges per dia amb horari d\'hivern (09:00) i d\'estiu (08:00Z → 10:00) i avís de zona',
      dies === 2 && text.includes('Hores en horari de Catalunya') && text.includes('09:00') && text.includes('10:30') && text.includes('10:00'));

    const altures = await p.evaluate(() => [...document.querySelectorAll('.reserva-franja')].map(b => b.getBoundingClientRect().height));
    ok('a mòbil (375 px), tots els botons de franja fan com a mínim 44 px d\'alçada', altures.length === 3 && altures.every(h => h >= 44), JSON.stringify(altures));

    await p.click('.reserva-franja[data-franja="f_hivern_1"]');
    await p.waitForSelector('[data-reserva-confirmar]');
    const textConf = await p.textContent('#reserva-pagina');
    ok('en triar una franja mostra el pas de confirmació amb la durada i l\'hora',
      textConf.includes('Confirmar la trucada de 20 minuts') && textConf.includes('09:00'));

    await p.click('[data-reserva-confirmar]');
    await p.waitForSelector('[data-reserva-ics]');
    const ics = await p.getAttribute('[data-reserva-ics]', 'data-ics-preview');
    const textExit = await p.textContent('#reserva-pagina');
    const infraccions = await p.evaluate(() => window.__infraccions);
    ok('reserva correcta envia { t, franja }, mostra confirmació per correu i genera .ics vàlid en UTC sense dades personals',
      postRebut?.t === 'tok_secret_123' && postRebut?.franja === 'f_hivern_1'
      && textExit.includes('Us enviarem la confirmació per correu')
      && ics.includes('BEGIN:VCALENDAR') && ics.includes('DTSTART:20261203T080000Z') && ics.includes('DTEND:20261203T082000Z')
      && ics.includes('SUMMARY:Trucada Madeinhuman') && ics.includes('UID:') && !ics.includes('tok_secret_123'));
    ok('cap error de consola ni infracció de CSP en el flux complet de reserva',
      errors.length === 0 && infraccions.length === 0, [...errors, ...infraccions].join(' | '));
    await ctx.close();
  }

  // 3. Error 409 (franja ocupada) → avís i recàrrega de franges
  {
    let gets = 0;
    const { ctx, p } = await novaPagina(DIST_ACTIVA, {
      handlerApi: (route, req, url) => {
        if (url.startsWith(API_FRANGES)) {
          gets++;
          const franges = gets === 1
            ? [{ id: 'f_1', inici: '2026-12-03T09:00:00+01:00', fi: '2026-12-03T09:20:00+01:00' }]
            : [{ id: 'f_2', inici: '2026-12-03T11:00:00+01:00', fi: '2026-12-03T11:20:00+01:00' }];
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN },
            body: JSON.stringify({ ok: true, zona: 'Europe/Madrid', durada: 20, franges }) });
        }
        if (url === API_RESERVA) {
          return route.fulfill({ status: 409, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN },
            body: JSON.stringify({ ok: false, error: 'ocupada' }) });
        }
        return route.abort();
      },
    });
    await p.goto(`${ORIGEN}/reserva/?t=tok_409`, { waitUntil: 'load' });
    await p.waitForSelector('.reserva-franja[data-franja="f_1"]');
    await p.click('.reserva-franja[data-franja="f_1"]');
    await p.click('[data-reserva-confirmar]');
    await p.waitForSelector('.reserva-franja[data-franja="f_2"]');
    const estatTxt = await p.textContent('.reserva-estat');
    ok('409 mostra «Aquesta hora s\'acaba d\'ocupar» i recarrega les franges', gets === 2 && estatTxt.includes("Aquesta hora s'acaba d'ocupar"));
    await ctx.close();
  }

  // 4. 404, franges: [], error de xarxa i /reserva/ sense t
  for (const [nom, ruta, mode, esperat] of [
    ['404 mostra «L\'enllaç ja no és vàlid» i enllaç a /#contacte', '/reserva/?t=caducat', '404', "L'enllaç ja no és vàlid"],
    ['franges: [] mostra avís i enllaç a /#contacte', '/reserva/?t=buit', 'buit', 'no hi ha hores lliures'],
    ['error de xarxa mostra avís i enllaç a /#contacte', '/reserva/?t=xarxa', 'xarxa', 'No hem pogut connectar'],
    ['/reserva/ sense t mostra missatge d\'entrada sense cridar l\'API', '/reserva/', 'cap', 'Per reservar una trucada, feu el diagnòstic gratuït o escriviu-nos'],
  ]) {
    const { ctx, p, peticionsApi } = await novaPagina(DIST_ACTIVA, {
      handlerApi: route => {
        if (mode === '404') return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: '{"ok":false,"error":"token"}' });
        if (mode === 'buit') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: '{"ok":true,"zona":"Europe/Madrid","durada":20,"franges":[]}' });
        return route.abort('failed');
      },
    });
    await p.goto(`${ORIGEN}${ruta}`, { waitUntil: 'load' });
    if (mode !== 'cap') await p.waitForSelector('.reserva-missatge');
    const txt = await p.textContent('#reserva-pagina');
    const teContacte = await p.locator('#reserva-pagina a[href="/#contacte"]').count() > 0;
    ok(nom, txt.includes(esperat) && teContacte && (mode !== 'cap' || peticionsApi.length === 0));
    await ctx.close();
  }

  // 5. /diagnostic amb i sense tokenReserva (amb ACTIVA = true)
  async function ferDiagnostic(arrelDir, ambToken) {
    const { ctx, p, errors, peticionsApi } = await novaPagina(arrelDir, {
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
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN },
            body: JSON.stringify({ ok: true, zona: 'Europe/Madrid', durada: 20, franges: [{ id: 'f_d1', inici: '2026-12-04T10:00:00+01:00', fi: '2026-12-04T10:20:00+01:00' }] }) });
        }
        return route.abort();
      },
    });
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
    await ctx.close();
    return { reservaOcult, ctaOcult, franges, peticionsApi, errors, infraccions };
  }

  const diagAmb = await ferDiagnostic(DIST_ACTIVA, true);
  ok('/diagnostic (ACTIVA=true + tokenReserva) munta el selector a #reserva i amaga el botó de CALENDARI_URL',
    !diagAmb.reservaOcult && diagAmb.ctaOcult && diagAmb.franges === 1 && diagAmb.errors.length === 0 && diagAmb.infraccions.length === 0);

  const diagSense = await ferDiagnostic(DIST_ACTIVA, false);
  ok('/diagnostic (ACTIVA=true sense tokenReserva) manté #reserva ocult i el botó de CALENDARI_URL visible',
    diagSense.reservaOcult && !diagSense.ctaOcult && diagSense.peticionsApi.filter(x => x.url.includes('/reserva')).length === 0);

  // 6. Sobre el dist/ REAL (ACTIVA = false): cap petició a l'API de reserves ni a /diagnostic ni a /reserva/
  const diagReal = await ferDiagnostic(DIST, true);
  ok('dist/ real (ACTIVA=false): /diagnostic amb tokenReserva NO fa cap petició de reserva',
    diagReal.reservaOcult && !diagReal.ctaOcult && diagReal.peticionsApi.filter(x => x.url.includes('/reserva')).length === 0);

  const { ctx: ctxReal, p: pReal, peticionsApi: apiReal } = await novaPagina(DIST);
  await pReal.goto(`${ORIGEN}/reserva/?t=tok_real`, { waitUntil: 'load' });
  await pReal.waitForTimeout(150);
  const txtReal = await pReal.textContent('#reserva-pagina');
  ok('dist/ real (ACTIVA=false): /reserva/?t=… mostra el missatge alternatiu i NO fa cap petició a l\'API',
    apiReal.length === 0 && txtReal.includes('Per reservar una trucada, feu el diagnòstic gratuït o escriviu-nos'));
  await ctxReal.close();
} finally {
  await navegador.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions del selector de reserves correctes');
process.exit(fallades ? 1 : 0);
