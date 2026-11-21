/* Seguretat de contingut (WEB-E01): carrega cada pàgina de dist/ amb les capçaleres de _headers (com Cloudflare:
   totes les regles que coincideixen, «! Capçalera» treu l'anterior) i comprova que no hi ha cap infracció de la
   CSP ni cap error de JavaScript. També prova el menú mòbil i l'enviament del formulari de contacte (API simulada).
   Ús: npm run construir && npm run csp */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARREL = path.resolve(__dirname, '..');
const DIST = path.join(ARREL, 'dist');
const TIPUS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jsx': 'text/babel', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml' };

// _headers → [{ patro, linies }]
const regles = [];
for (const l of fs.readFileSync(path.join(DIST, '_headers'), 'utf8').split('\n')) {
  if (!l.trim() || l.trim().startsWith('#')) continue;
  if (!/^\s/.test(l)) regles.push({ patro: l.trim(), linies: [] });
  else regles[regles.length - 1].linies.push(l.trim());
}
const coincideix = (patro, ruta) => new RegExp('^' + patro.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(ruta);
function capçaleres(ruta) {
  const h = {};
  for (const r of regles) if (coincideix(r.patro, ruta)) for (const l of r.linies) {
    if (l.startsWith('!')) { delete h[l.slice(1).trim().toLowerCase()]; continue; }
    const i = l.indexOf(':');
    const k = l.slice(0, i).trim().toLowerCase(), v = l.slice(i + 1).trim();
    h[k] = h[k] ? `${h[k]}, ${v}` : v;
  }
  return h;
}

const pagines = [];
(function r(rel) {
  for (const e of fs.readdirSync(path.join(DIST, rel), { withFileTypes: true })) {
    const x = path.join(rel, e.name).split(path.sep).join('/');
    if (e.isDirectory()) { if (e.name !== '_previsualitzacio') r(x); }
    else if (e.name.endsWith('.html')) pagines.push('/' + x.replace(/index\.html$/, ''));
  }
})('');

(async () => {
  const navegador = await chromium.launch();
  const context = await navegador.newContext({ viewport: { width: 375, height: 800 } });
  let enviaments = 0;
  await context.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.origin === 'https://rgpd.madeinhuman.cat') { enviaments++; return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}', headers: { 'access-control-allow-origin': 'https://madeinhuman.cat' } }); }
    if (u.origin !== 'https://madeinhuman.cat') return r.fulfill({ status: 404, body: '' });
    const f = path.join(DIST, decodeURIComponent(u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname));
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ body: fs.readFileSync(f), contentType: TIPUS[path.extname(f)] || 'application/octet-stream', headers: capçaleres(u.pathname) });
  });
  await context.addInitScript(() => {
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ← ${e.blockedURI || 'en línia'}`));
  });
  let fallades = 0;
  const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

  for (const ruta of pagines.sort()) {
    const p = await context.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.goto('https://madeinhuman.cat' + ruta);
    await p.waitForTimeout(ruta.includes('recollida') ? 2500 : 400);
    const menu = await p.$('.nav-burger');
    if (menu && await menu.isVisible()) { await menu.click(); await p.waitForTimeout(100); }
    const inf = await p.evaluate(() => window.__infraccions);
    // La recollida s'ha de muntar de debò (Babel compila l'assistent al navegador)
    if (ruta === '/recollida.html' && !(await p.evaluate(() => document.getElementById('app')?.children.length))) errors.push('l\'assistent no s\'ha muntat');
    const csp = capçaleres(ruta)['content-security-policy'] || '';
    ok(`${ruta}`, csp && !inf.length && !errors.length, [...inf, ...errors].join(' | ') || 'sense CSP');
    await p.close();
  }

  // Formulari de contacte: ha de poder enviar a rgpd-tool amb la CSP posada
  const p = await context.newPage();
  await p.goto('https://madeinhuman.cat/');
  await p.evaluate(() => {
    const f = document.getElementById('formContacte');
    f.querySelector('[name=nom]').value = 'Prova'; f.querySelector('[name=email]').value = 'prova@exemple.cat';
    f.querySelector('[name=missatge]').value = 'Missatge de prova'; f.querySelector('[name=rgpd]').checked = true;
    f.requestSubmit();
  });
  await p.waitForTimeout(1000);
  ok('el formulari de contacte arriba a rgpd-tool amb la CSP', enviaments === 1 && !(await p.evaluate(() => window.__infraccions)).length, `${enviaments} enviaments`);

  await navegador.close();
  console.log(fallades ? `\n${fallades} pàgines amb problemes de CSP` : `\n${pagines.length + 1}/${pagines.length + 1} sense cap infracció de la CSP`);
  process.exit(fallades ? 1 : 0);
})();
