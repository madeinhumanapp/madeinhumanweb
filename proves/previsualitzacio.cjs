/* Prototip C: vista prèvia del panell. Comprova, en un navegador:
   1. el panell (origen rgpd.madeinhuman.cat) pinta la pàgina amb les plantilles de la web
   2. un canvi al formulari generat per l'esquema es veu a l'instant
   3. no es pot injectar HTML des d'un camp
   4. els formularis de la vista prèvia no arriben a l'API (cap lead fals)
   5. una altra web no pot inserir la vista prèvia ni enviar-li contingut
   Ús: node eines/construir.mjs && node proves/previsualitzacio.cjs */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARREL = path.resolve(__dirname, '..');
const DIST = path.join(ARREL, 'dist');
const TIPUS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
// Les capçaleres de la vista prèvia surten del _headers real (el que aplica Cloudflare)
const CSP_PREVIA = (() => {
  const t = fs.readFileSync(path.join(DIST, '_headers'), 'utf8');
  const m = /\/_previsualitzacio\/\*\n((?:[ \t]+.*\n?)+)/.exec(t);
  const linia = m && m[1].split('\n').find(l => /content-security-policy:/i.test(l));
  if (!linia) throw new Error('_headers no protegeix /_previsualitzacio/ (frame-ancestors)');
  return linia.split(':').slice(1).join(':').trim();
})();
const resultats = [];
const ok = (nom, cond, detall = '') => { resultats.push([cond, nom]); console.log(`${cond ? '✓' : '✗'} ${nom}${detall ? ' — ' + detall : ''}`); };

(async () => {
  const navegador = await chromium.launch();
  const context = await navegador.newContext();
  let peticionsApi = 0;
  await context.route('**/*', r => {
    const u = new URL(r.request().url());
    const serveix = (f, headers = {}) => (fs.existsSync(f) && fs.statSync(f).isFile()
      ? r.fulfill({ body: fs.readFileSync(f), contentType: TIPUS[path.extname(f)] || 'application/octet-stream', headers })
      : r.fulfill({ status: 404, body: '' }));
    if (u.origin === 'https://madeinhuman.cat') {
      const f = path.join(DIST, u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname);
      // Emula _headers: la vista prèvia només es pot inserir des del panell
      const h = u.pathname.startsWith('/_previsualitzacio/')
        ? { 'content-security-policy': CSP_PREVIA }
        : {};
      return serveix(f, h);
    }
    if (u.origin === 'https://rgpd.madeinhuman.cat') {
      if (u.pathname.startsWith('/api/')) { peticionsApi++; return r.fulfill({ status: 200, body: '{"ok":true}', contentType: 'application/json' }); }
      if (u.pathname.endsWith('portada.ca.json')) return serveix(path.join(ARREL, 'contingut/pagines/portada.ca.json'));
      return serveix(path.join(ARREL, 'proves', u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname));
    }
    if (u.origin === 'https://dolent.example') return r.fulfill({ contentType: 'text/html', body: '<iframe id="x" src="https://madeinhuman.cat/_previsualitzacio/"></iframe>' });
    return r.abort();
  });

  // 1. Panell → vista prèvia
  const p = await context.newPage();
  const errorsJs = [];
  p.on('pageerror', e => errorsJs.push(e.message));
  await p.goto('https://rgpd.madeinhuman.cat/panell-prototip/');
  const marc = async () => {
    for (let i = 0; i < 50; i++) {
      const f = p.frames().find(x => x.url().startsWith('blob:'));
      if (f) { try { await f.waitForSelector('h1', { timeout: 200 }); return f; } catch { /* encara carregant */ } }
      await p.waitForTimeout(100);
    }
    return null;
  };
  let f = await marc();
  ok('la vista prèvia pinta la portada amb les plantilles de la web', !!f && (await f.innerText('h1')).replace(/\s+/g, ' ').trim() === 'Protegir és avançar.');

  // 2. Canvi en directe
  const t0 = Date.now();
  await p.fill('textarea[name="titol"]', 'Protegir\nés *créixer.*');
  let canviat = false;
  for (let i = 0; i < 40 && !canviat; i++) {
    await p.waitForTimeout(100);
    f = p.frames().find(x => x.url().startsWith('blob:'));
    canviat = !!f && await f.evaluate(() => document.querySelector('h1 em')?.textContent === 'créixer.').catch(() => false);
  }
  ok('un canvi al formulari es veu a la vista prèvia', canviat, `${Date.now() - t0} ms`);

  // 3. Injecció d'HTML des d'un camp
  await p.fill('textarea[name="titol"]', '<img src=x onerror="top.injectat=1">');
  await p.waitForTimeout(800);
  const registre = await p.evaluate(() => window.registre.map(m => m.tipus));
  f = p.frames().find(x => x.url().startsWith('blob:'));
  const hiHaImg = await f.evaluate(() => !!document.querySelector('h1 img')).catch(() => false);
  ok('l\'HTML d\'un camp es rebutja (cap <img> a la vista prèvia)', registre.includes('errors') && !hiHaImg && !(await p.evaluate(() => window.injectat)));

  // 4. Els formularis de la vista prèvia no arriben a l'API
  await p.fill('textarea[name="titol"]', 'Protegir\nés *avançar.*');
  f = await marc();
  await f.evaluate(() => {
    const form = document.getElementById('formContacte');
    form.querySelector('[name=nom]').value = 'Prova'; form.querySelector('[name=email]').value = 'prova@exemple.cat';
    form.querySelector('[name=missatge]').value = 'Missatge de prova'; form.querySelector('[name=rgpd]').checked = true;
    form.requestSubmit();
  });
  await p.waitForTimeout(1500);
  ok('el formulari de contacte de la vista prèvia no crea cap lead', peticionsApi === 0, `${peticionsApi} peticions a l'API`);

  // 5a. Una altra web no la pot inserir
  const d = await context.newPage();
  await d.goto('https://dolent.example/');
  await d.waitForTimeout(1000);
  const carregada = await d.frames()[1]?.evaluate(() => !!document.getElementById('marc')).catch(() => false);
  ok('una altra web no pot inserir la vista prèvia', !carregada);

  // 5b. Ni enviar-li contingut si l'obre directament
  const q = await context.newPage();
  await q.goto('https://madeinhuman.cat/_previsualitzacio/');
  await q.waitForTimeout(500);
  const pag = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/portada.ca.json'), 'utf8'));
  await q.evaluate(pg => window.postMessage({ tipus: 'previsualitzar', pagina: pg }, '*'), pag);
  await q.waitForTimeout(500);
  ok('ignora missatges que no vénen del panell', (await q.evaluate(() => document.getElementById('marc').src)) === '');

  // 6. Pàgines que no són de blocs: una de servei (serveis.json) i la d'enllaços (xarxes)
  const envia = async (missatge, esperat) => {
    await p.evaluate(m => document.getElementById('previa').contentWindow.postMessage(m, 'https://madeinhuman.cat'), missatge);
    for (let i = 0; i < 40; i++) {
      await p.waitForTimeout(100);
      const fr = p.frames().find(x => x.url().startsWith('blob:'));
      const text = fr && await fr.evaluate(() => document.body.innerText).catch(() => '');
      if (text && text.includes(esperat)) return true;
    }
    return false;
  };
  const serveis = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
  serveis.PAGINES.dpo.ca.lede = 'Entradeta canviada a la vista prèvia.';
  ok('la vista prèvia pinta una pàgina de servei amb el canvi', await envia({ tipus: 'previsualitzar', serveis, ruta: 'serveis/dpo-extern/index.html' }, 'Entradeta canviada a la vista prèvia.'));
  const xarxes = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/xarxes.json'), 'utf8'));
  xarxes.subtitol = 'Subtítol de prova de la vista prèvia.';
  ok('la vista prèvia pinta la pàgina d\'enllaços', await envia({ tipus: 'previsualitzar', pagina: xarxes }, 'Subtítol de prova de la vista prèvia.'));

  ok('sense errors de JavaScript al panell', errorsJs.length === 0, errorsJs.join(' | '));
  await navegador.close();
  const fallades = resultats.filter(([c]) => !c).length;
  console.log(`\n${resultats.length - fallades}/${resultats.length} comprovacions correctes`);
  process.exit(fallades ? 1 : 0);
})();
