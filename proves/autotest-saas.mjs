// Proves de l'autotest SaaS en castellà (esborrany, WEB-G06f):
// 1) Avaluació pura (sense navegador): 12 preguntes, paquets, perfil, avisos EIPD/art. 27 i semàfor verd/ambre/vermell.
// 2) Comprovacions estàtiques a dist/: noindex, nofollow, fora del mapa del lloc, sense enllaços des d'altres pàgines, sense fetch ni emmagatzematge.
// 3) Navegador (Playwright, servidor local + CSP real de _headers): recorregut complet a 375 i 1280 px, «Atrás», resultat, 0 xarxa externa, 0 CSP.
// L'eina només es publica a les vistes prèvies (NOMES_ESBORRANYS a eines/construir.mjs): es prova sobre una construcció
// amb esborranys i es comprova que el dist/ de producció no la conté.
// Ús: npm run construir && node eines/construir.mjs --esborranys --sortida /tmp/madeinhuman-dist-esborranys
//     && node proves/autotest-saas.mjs --arrel /tmp/madeinhuman-dist-esborranys
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PREGUNTES, AVISOS, PUNTS, PAQUETS, TEXTOS } from '../es/autotest-saas/dades/preguntes.js';
import { avaluar } from '../es/autotest-saas/src/avaluar.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const DIST_PRODUCCIO = path.join(ARREL, 'dist');
const DIST = ARGS.includes('--arrel') ? path.resolve(ARGS[ARGS.indexOf('--arrel') + 1]) : DIST_PRODUCCIO;

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

// ── 1) Avaluació pura (sense navegador) ──────────────────────────────────────
const IDS_ESPERATS = [
  'clientes', 'equipo', 'jurisdiccion', 'datos', 'infraestructura',
  'ia', 'decisiones', 'dpa', 'borrado', 'cookies', 'documentacion', 'momento',
];
ok('hi ha les 12 preguntes del pla en l\'ordre previst (ia i decisiones separades)',
  PREGUNTES.length === 12 && IDS_ESPERATS.every((id, i) => PREGUNTES[i].id === id),
  PREGUNTES.map(p => p.id).join(', '));

const BASE_VERD = {
  clientes: 'b2c',
  equipo: 'solitario',
  jurisdiccion: 'espana',
  datos: 'cuenta',
  infraestructura: 'ue',
  ia: 'no',
  decisiones: 'no',
  dpa: 'si',
  borrado: 'definidos',
  cookies: 'ninguna',
  documentacion: 'completo',
  momento: 'prelanzamiento',
};

const rVerd = avaluar(BASE_VERD);
ok('cas base ordenat → semàfor verd, només Base SaaS i perfil «Fundador en solitario»',
  rVerd.semaforo.nivell === 'verde'
  && rVerd.paquets.map(p => p.nom).join('|') === 'Base SaaS'
  && rVerd.perfil?.nom === 'Fundador en solitario'
  && rVerd.avisos.length === 0
  && rVerd.completes === true,
  JSON.stringify({ sem: rVerd.semaforo.nivell, paq: rVerd.paquets.map(p => p.nom), perf: rVerd.perfil?.nom }));

const rAmbar = avaluar({
  ...BASE_VERD,
  clientes: 'b2b',
  equipo: '2_5',
  infraestructura: 'eeuu',
  cookies: 'terceros',
  documentacion: 'parcial',
});
ok('cas B2B amb documentació parcial i stack EUA → semàfor ambre, Base SaaS + Trust Pack B2B, sense perfil solitari',
  rAmbar.semaforo.nivell === 'ambar'
  && rAmbar.paquets.some(p => p.nom === 'Base SaaS')
  && rAmbar.paquets.some(p => p.nom === 'Trust Pack B2B')
  && !rAmbar.paquets.some(p => p.nom === 'Add-on IA')
  && rAmbar.perfil === null,
  JSON.stringify({ sem: rAmbar.semaforo.nivell, paq: rAmbar.paquets.map(p => p.nom) }));

const rVermell = avaluar({
  ...BASE_VERD,
  clientes: 'mixto',
  equipo: 'solitario',
  jurisdiccion: 'fuera_ue',
  datos: 'sensibles',
  infraestructura: 'desconocida',
  ia: 'modelo_propio',
  decisiones: 'si',
  dpa: 'no',
  borrado: 'no',
  documentacion: 'nada',
  momento: 'bloqueo_b2b',
});
ok('cas crític → semàfor vermell, els 3 paquets, sense perfil solitari i avisos EIPD + art. 27',
  rVermell.semaforo.nivell === 'rojo'
  && rVermell.paquets.map(p => p.nom).join('|') === 'Base SaaS|Trust Pack B2B|Add-on IA'
  && rVermell.perfil === null
  && rVermell.avisos.map(a => a.id).join('|') === 'eipd|art27',
  JSON.stringify({ sem: rVermell.semaforo.nivell, paq: rVermell.paquets.map(p => p.nom), av: rVermell.avisos.map(a => a.id) }));

// Casos específics d'activació de paquets i perfil
ok('Trust Pack B2B s\'activa amb dpa="no_se" fins i tot en B2C',
  avaluar({ ...BASE_VERD, dpa: 'no_se' }).paquets.some(p => p.nom === 'Trust Pack B2B'));
ok('Trust Pack B2B s\'activa amb momento="bloqueo_b2b"',
  avaluar({ ...BASE_VERD, momento: 'bloqueo_b2b' }).paquets.some(p => p.nom === 'Trust Pack B2B'));
ok('Add-on IA s\'activa amb ia="api_terceros" i amb decisiones="si" per separat',
  avaluar({ ...BASE_VERD, ia: 'api_terceros' }).paquets.some(p => p.nom === 'Add-on IA')
  && avaluar({ ...BASE_VERD, ia: 'no', decisiones: 'si' }).paquets.some(p => p.nom === 'Add-on IA'));
ok('perfil «Fundador en solitario» es desactiva amb dades sensibles o decisions automatitzades',
  avaluar({ ...BASE_VERD, datos: 'sensibles' }).perfil === null
  && avaluar({ ...BASE_VERD, decisiones: 'si' }).perfil === null);

// Avisos EIPD i art. 27: formulats com a «probables, a valorar» i mai com a obligatoris, amb [REVISAR]
ok('avisos EIPD i art. 27 es formulen com a «probable, a valorar» i porten [REVISAR]',
  /probable.*a valorar/i.test(AVISOS.eipd.titol)
  && /probable.*a valorar/i.test(AVISOS.art27.titol)
  && AVISOS.eipd.text.includes('[REVISAR:')
  && AVISOS.art27.text.includes('[REVISAR:')
  && !/\bes obligatori[ao]\b/i.test(AVISOS.eipd.text)
  && !/\bes obligatori[ao]\b/i.test(AVISOS.art27.text));

ok('totes les afirmacions jurídiques de punts, paquets i avís legal porten marca [REVISAR:]',
  Object.values(PUNTS).every(t => t.includes('[REVISAR:'))
  && Object.values(PAQUETS).every(p => p.descripcio.includes('[REVISAR:'))
  && TEXTOS.avisLegal.includes('[REVISAR:'));

// ── 2) Comprovacions estàtiques (codi font i dist/) ──────────────────────────
if (DIST !== DIST_PRODUCCIO && fs.existsSync(path.join(DIST_PRODUCCIO, 'index.html'))) {
  ok('el dist/ de producció no conté l\'autotest SaaS (només vistes prèvies)',
    !fs.existsSync(path.join(DIST_PRODUCCIO, 'es/autotest-saas')));
}
const FITXER_DIST = path.join(DIST, 'es/autotest-saas/index.html');
ok('dist/es/autotest-saas/index.html existeix després de construir', fs.existsSync(FITXER_DIST));
if (!fs.existsSync(FITXER_DIST)) process.exit(1);

const htmlDist = fs.readFileSync(FITXER_DIST, 'utf8');
const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
ok('té noindex, nofollow, franja d\'esborrany i no surt al sitemap.xml',
  /<meta name="robots" content="noindex,\s*nofollow"\s*\/?>/i.test(htmlDist)
  && htmlDist.includes('Borrador: pendiente de validación')
  && !sitemap.includes('autotest-saas'));

// Cap altra pàgina de dist/ enllaça a /es/autotest-saas/
const enllacadors = [];
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(DIST, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = path.join(rel, e.name);
    if (e.isDirectory()) recorre(r);
    else if (e.name.endsWith('.html') && r !== path.join('es', 'autotest-saas', 'index.html')) {
      if (fs.readFileSync(path.join(DIST, r), 'utf8').includes('autotest-saas')) enllacadors.push(r);
    }
  }
})();
ok('cap altra pàgina de dist/ enllaça a /es/autotest-saas/', enllacadors.length === 0, enllacadors.join(', '));

// Sense fetch, sense localStorage/sessionStorage/cookie, sense colors escrits a mà
const senseComentaris = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const jsFont = senseComentaris(fs.readFileSync(path.join(ARREL, 'es/autotest-saas/src/app.js'), 'utf8'))
  + senseComentaris(fs.readFileSync(path.join(ARREL, 'es/autotest-saas/src/avaluar.js'), 'utf8'));
const cssFont = fs.readFileSync(path.join(ARREL, 'es/autotest-saas/estils.css'), 'utf8');
ok('zero fetch, localStorage, sessionStorage ni document.cookie als scripts',
  !/\bfetch\s*\(|localStorage|sessionStorage|document\.cookie|XMLHttpRequest|sendBeacon/i.test(jsFont));
ok('estils.css només fa servir variables de marca.css (cap color hexadecimal ni rgb escrit a mà)',
  !/#[0-9a-f]{3,8}\b|\brgba?\s*\(/i.test(cssFont));

// ── 3) Navegador (Playwright, servidor local amb CSP real de _headers) ───────
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

const TIPUS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

const servidor = http.createServer((req, res) => {
  let f = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (f.endsWith('/')) f += 'index.html';
  const ruta = path.join(DIST, f);
  if (!ruta.startsWith(DIST) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) {
    res.writeHead(404, { Connection: 'close' }).end();
    return;
  }
  const buf = fs.readFileSync(ruta);
  const cap = {
    'Content-Type': TIPUS[path.extname(ruta)] || 'application/octet-stream',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store',
    Connection: 'close',
  };
  if (csp && ruta.endsWith('.html')) cap['Content-Security-Policy'] = csp;
  res.writeHead(200, cap);
  res.end(buf);
});

await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const port = servidor.address().port;
const ORIGEN = `http://127.0.0.1:${port}`;
const URL_TEST = `${ORIGEN}/es/autotest-saas/`;

const navegador = await chromium.launch({
  ...(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {}),
  args: ['--disable-dev-shm-usage', '--disable-gpu'],
});

const RESPOSTES_RECORREGUT = [
  'b2b', 'solitario', 'fuera_ue', 'operativos', 'eeuu',
  'api_terceros', 'no', 'no', 'parcialmente', 'terceros', 'parcial', 'produccion',
];

try {
  const ctx = await navegador.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(() => {
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => {
      window.__infraccions.push(`${e.violatedDirective} ← ${e.blockedURI || 'inline'}`);
    });
  });
  const p = await ctx.newPage();

  for (const v of [
    { nom: 'mòbil 375', viewport: { width: 375, height: 812 } },
    { nom: 'escriptori 1280', viewport: { width: 1280, height: 800 } },
  ]) {
    await p.setViewportSize(v.viewport);
    const errors = [];
    const peticionsExternes = [];
    const onPageErr = e => errors.push(e.message);
    const onConsole = m => { if (m.type() === 'error') errors.push(m.text()); };
    const onReq = req => {
      const u = req.url();
      if (!u.startsWith(ORIGEN) && !u.startsWith('data:')) peticionsExternes.push(u);
    };
    p.on('pageerror', onPageErr);
    p.on('console', onConsole);
    p.on('request', onReq);

    await p.goto(URL_TEST, { waitUntil: 'networkidle' });
    await p.waitForSelector('.boto-principal', { timeout: 5000 });

    // Entrada + franja d'esborrany + botó >= 44px
    const entradaOk = await p.evaluate(() => {
      const franja = document.querySelector('.franja-esborrany');
      const boto = document.querySelector('.boto-principal');
      return Boolean(franja && franja.textContent.includes('Borrador: pendiente de validación')
        && boto && boto.getBoundingClientRect().height >= 44
        && document.documentElement.scrollWidth <= window.innerWidth + 1);
    });
    ok(`${v.nom}: pantalla d'entrada, franja d'esborrany, botó ≥ 44 px i sense desbordament`, entradaOk);

    await p.click('.boto-principal');

    // Recorre les 12 preguntes i comprova «Atrás» a la pregunta 3
    let progresOk = true;
    let enrereOk = false;
    let botons44Ok = true;

    for (let i = 0; i < RESPOSTES_RECORREGUT.length; i++) {
      const txtProgres = (await p.locator('#progres').textContent())?.trim();
      if (txtProgres !== `Pregunta ${i + 1} de 12`) progresOk = false;

      const altures = await p.evaluate(() => [...document.querySelectorAll('.opcio, .boto')]
        .every(b => b.getBoundingClientRect().height >= 44));
      if (!altures) botons44Ok = false;

      if (i === 2 && !enrereOk) {
        await p.click('.boto-enrere');
        const txtEnrere = (await p.locator('#progres').textContent())?.trim();
        const marcada = await p.locator(`.opcio[data-valor="${RESPOSTES_RECORREGUT[1]}"]`).getAttribute('aria-checked');
        enrereOk = txtEnrere === 'Pregunta 2 de 12' && marcada === 'true';
        await p.click(`.opcio[data-valor="${RESPOSTES_RECORREGUT[1]}"]`);
      }

      await p.click(`.opcio[data-valor="${RESPOSTES_RECORREGUT[i]}"]`);
    }

    ok(`${v.nom}: progrés «Pregunta N de 12», botons ≥ 44 px i «Atrás» conserva la resposta`,
      progresOk && botons44Ok && enrereOk,
      `progres=${progresOk} botons44=${botons44Ok} enrere=${enrereOk}`);

    // Resultat accessible
    const resCheck = await p.evaluate(() => {
      const sem = document.querySelector('.semafor[role="img"]');
      const aria = sem?.getAttribute('aria-label') || '';
      const cta = document.querySelector('a.boto-principal');
      const text = document.body.textContent || '';
      return {
        teSemafor: Boolean(sem && aria.toLowerCase().includes('semáforo')),
        tePaquets: text.includes('Base SaaS') && text.includes('Trust Pack B2B') && text.includes('Add-on IA'),
        tePerfil: text.includes('Fundador en solitario'),
        teArt27: text.includes('art. 27 RGPD') && /probable,\s*a valorar/i.test(text),
        ctaOk: Boolean(cta && cta.textContent.trim() === 'Hablemos' && cta.getAttribute('href') === '/es/#contacto'),
        desborda: document.documentElement.scrollWidth > window.innerWidth + 1,
        emmagatzematge: localStorage.length + sessionStorage.length + document.cookie.length,
      };
    });
    ok(`${v.nom}: resultat amb semàfor accessible, paquets, perfil, avís art. 27, CTA /es/#contacto i 0 emmagatzematge`,
      resCheck.teSemafor && resCheck.tePaquets && resCheck.tePerfil && resCheck.teArt27
      && resCheck.ctaOk && !resCheck.desborda && resCheck.emmagatzematge === 0,
      JSON.stringify(resCheck));

    const infr = await p.evaluate(() => window.__infraccions);
    ok(`${v.nom}: cap petició fora de l'origen, cap error de consola ni infracció de CSP`,
      peticionsExternes.length === 0 && errors.length === 0 && infr.length === 0,
      [...peticionsExternes, ...errors, ...infr].slice(0, 3).join(' · '));

    p.off('pageerror', onPageErr);
    p.off('console', onConsole);
    p.off('request', onReq);
  }
  await ctx.close();
} finally {
  await navegador.close();
  servidor.close();
}

console.log(fallades ? `\n${fallades} comprovacions de l'autotest SaaS han fallat` : '\ntotes les comprovacions de l\'autotest SaaS correctes');
process.exit(fallades ? 1 : 0);
