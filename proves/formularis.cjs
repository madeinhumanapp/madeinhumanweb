/* =============================================================================
   Contracte dels formularis web → rgpd-tool (prototip A del pla del panell)

   Omple de veritat cada formulari en un navegador (Playwright), intercepta la
   petició a rgpd.madeinhuman.cat i desa el cos JSON que s'hi envia. Res surt a
   internet: totes les peticions externes es tallen o es responen en local.

   Ús (des de l'arrel del repositori de la web):
     node proves/formularis.cjs                 # compara amb proves/contractes/
     node proves/formularis.cjs --desar         # (re)escriu els contractes de referència
     node proves/formularis.cjs --arrel dist    # prova una altra carpeta (la web generada)

   Què es comprova:
     · el cos de cada POST (claus, tipus i valors) és idèntic al de referència
     · el contracte estàtic de cada formulari (name, type, required, valors de les
       opcions) és idèntic: els valors de les opcions també són dades de l'API
     · les opcions del diagnòstic (ids i valors) coincideixen amb les de referència
   ============================================================================= */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const DESAR = args.includes('--desar');
const arrelArg = args.indexOf('--arrel');
const ARREL = path.resolve(arrelArg >= 0 ? args[arrelArg + 1] : '.');
const DIR_CONTRACTES = path.resolve(__dirname, 'contractes');
const ORIGEN = 'https://madeinhuman.cat';
const API = 'https://rgpd.madeinhuman.cat';
const UTM = 'utm_source=instagram&utm_medium=social&utm_campaign=prova-contracte&utm_content=enllac-bio';

const TIPUS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jsx': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json',
};

// Serveix ARREL com si fos madeinhuman.cat (amb l'URL «bonica» de Cloudflare: /ruta/ → /ruta/index.html)
function fitxerDe(url) {
  let p = decodeURIComponent(new URL(url).pathname);
  let f = path.join(ARREL, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  return f.startsWith(ARREL) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}

async function pagina(navegador, ruta, peticions, respostaApi) {
  const p = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', async route => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(API)) {
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': ORIGEN, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' } });
      const cami = new URL(url).pathname;
      let cos = null;
      try { cos = req.postDataJSON(); } catch { cos = req.postData(); }
      peticions.push({ metode: req.method(), cami, cos });
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGEN }, body: JSON.stringify(respostaApi(cami)) });
    }
    if (url.startsWith(ORIGEN)) {
      const f = fitxerDe(url);
      if (!f) return route.fulfill({ status: 404, body: 'no trobat' });
      return route.fulfill({ status: 200, contentType: TIPUS[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
    }
    return route.abort(); // cap petició a tercers
  });
  await p.goto(ORIGEN + ruta);
  return { p, errors };
}

// Contracte estàtic: camps de cada formulari (name, type, required i valors possibles)
async function contracteEstatic(p, selectorForm) {
  return p.evaluate(sel => {
    const form = document.querySelector(sel);
    if (!form) return null;
    const camps = {};
    for (const el of form.querySelectorAll('input[name], select[name], textarea[name]')) {
      const nom = el.name;
      const tipus = el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : (el.type || 'text');
      const c = camps[nom] || (camps[nom] = { tipus, obligatori: false, valors: [] });
      if (el.required) c.obligatori = true;
      if (tipus === 'radio' || tipus === 'checkbox') c.valors.push(el.value);
      if (tipus === 'select') c.valors = [...el.options].map(o => o.value);
    }
    for (const c of Object.values(camps)) { if (!c.valors.length) delete c.valors; }
    return { id: form.id || null, camps };
  }, selectorForm);
}

// Omple de manera determinista: el mateix formulari dona sempre el mateix cos
async function omplir(p, selectorForm) {
  await p.evaluate(sel => {
    const form = document.querySelector(sel);
    const vistos = new Set();
    const exemple = { email: 'prova@exemple.cat', tel: '600000000', url: 'https://www.exemple.cat', number: '7' };
    for (const el of form.querySelectorAll('input[name], select[name], textarea[name]')) {
      const t = el.type;
      if (t === 'hidden' || /^utm_/.test(el.name) || el.name === 'web_url') continue;
      if (t === 'radio') {
        if (!vistos.has(el.name)) { vistos.add(el.name); el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
        continue;
      }
      if (t === 'checkbox') {
        const del_grup = [...form.querySelectorAll(`input[type=checkbox][name="${el.name}"]`)];
        el.checked = del_grup.indexOf(el) < 2; // els dos primers de cada grup (o l'únic)
        el.dispatchEvent(new Event('change', { bubbles: true }));
        continue;
      }
      if (el.tagName === 'SELECT') { el.value = [...el.options].find(o => o.value)?.value ?? ''; el.dispatchEvent(new Event('change', { bubbles: true })); continue; }
      el.value = exemple[t] || (el.tagName === 'TEXTAREA' ? 'Text de prova del contracte.' : `Prova ${el.name}`);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, selectorForm);
}

async function esperarPeticio(peticions, n, p) {
  for (let i = 0; i < 50 && peticions.length < n; i++) await p.waitForTimeout(100);
}

async function main() {
  const navegador = await chromium.launch();
  const resultat = { formularis: {}, cossos: {}, diagnosticOpcions: null, errorsJs: {} };

  // ── Portada: contacte i adequació ────────────────────────────────────────
  {
    const peticions = [];
    const { p, errors } = await pagina(navegador, `/?${UTM}`, peticions, cami =>
      cami.endsWith('/pressupost') ? { ok: true, numero: 'MH-2026-0001' } : { ok: true });
    for (const [clau, sel] of [['contacte', '#formContacte'], ['adequacio', '#formAdequacio']]) {
      resultat.formularis[clau] = await contracteEstatic(p, sel);
      await omplir(p, sel);
      const abans = peticions.length;
      await p.evaluate(sel => document.querySelector(sel).requestSubmit(), sel);
      await esperarPeticio(peticions, abans + 1, p);
      resultat.cossos[clau] = peticions[abans] || null;
    }
    resultat.errorsJs.portada = errors;
    await p.close();
  }

  // ── Diagnòstic: 11 preguntes, contacte i enviament ──────────────────────
  {
    const peticions = [];
    const { p, errors } = await pagina(navegador, `/diagnostic.html?ref=gestoria-prova&${UTM}`, peticions, () => ({
      ok: true, referencia: 'DG-2026-0001', index: 42, nivell: 'mitja', top: ['A', 'B', 'C'], documentsOk: 2, documentsTotal: 10, documentsDubte: false,
    }));
    // Opcions que ofereix la web (ids i valors): han de ser les que accepta rgpd-tool
    resultat.diagnosticOpcions = await p.evaluate(() =>
      [...document.querySelectorAll('section.step[data-id]')].filter(s => s.querySelector('.opt')).map(s => ({
        id: s.dataset.id,
        multi: !!s.querySelector('.opt[role="checkbox"]'),
        valors: [...s.querySelectorAll('.opt')].map(b => b.dataset.v),
      })));
    await p.click('section.step.on [data-go="next"]');
    for (const q of resultat.diagnosticOpcions) {
      const s = `section.step[data-id="${q.id}"]`;
      await p.waitForSelector(`${s}.on`);
      if (q.multi) {
        const valors = q.valors.filter(v => !['cap', 'segur'].includes(v)).slice(0, 2);
        for (const v of valors) await p.click(`${s} .opt[data-v="${v}"]`);
        await p.click(`${s} [data-go="next"]`);
      } else {
        await p.click(`${s} .opt[data-v="${q.valors[0]}"]`);
      }
    }
    await p.waitForSelector('section.step[data-id="contacte"].on');
    await p.fill('#d-nom', 'Prova Contracte');
    await p.fill('#d-empresa', 'Exemple SL');
    await p.fill('#d-email', 'prova@exemple.cat');
    await p.fill('#d-tel', '600000000');
    await p.check('#f input[name="privacitat"]');
    await p.check('#f input[name="comercial"]');
    resultat.formularis.diagnostic = await contracteEstatic(p, '#f');
    await p.click('#send');
    await esperarPeticio(peticions, 1, p);
    resultat.cossos.diagnostic = peticions[0] || null;
    resultat.errorsJs.diagnostic = errors;
    await p.close();
  }

  // ── Recollida: validació del token en carregar ──────────────────────────
  {
    const peticions = [];
    const { p, errors } = await pagina(navegador, '/recollida.html?token=MIH-AAAA-BBBB-CCCC', peticions, () => ({ valid: true, empresa: 'Exemple SL' }));
    await esperarPeticio(peticions, 1, p);
    resultat.cossos.recollidaToken = peticions[0] || null;
    resultat.errorsJs.recollida = errors;
    await p.close();
  }
  // ── URL i àncores que fan servir rgpd-tool i els correus (no es poden moure) ──
  // token-acces.ts → /recollida.html?token=… · embut/config.ts → /#contacte ·
  // informe del diagnòstic → /politica-privacitat.html · gestories → /diagnostic.html?ref=…
  resultat.urlsEstables = {};
  {
    const p = await navegador.newPage();
    await p.route('**/*', route => {
      const f = route.request().url().startsWith(ORIGEN) ? fitxerDe(route.request().url()) : null;
      if (!f) return route.request().url().startsWith(ORIGEN) ? route.fulfill({ status: 404, body: '' }) : route.abort();
      return route.fulfill({ status: 200, contentType: TIPUS[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
    });
    const URLS = ['/#contacte', '/#adequacio', '/#serveis', '/#metode', '/#faq', '/diagnostic.html', '/recollida.html',
      '/politica-privacitat.html', '/avis-legal.html', '/politica-cookies.html', '/necessito-dpo/', '/xarxes/'];
    for (const u of URLS) {
      const [ruta, ancora] = u.split('#');
      const r = await p.goto(ORIGEN + ruta).catch(() => null);
      const existeix = !!r && r.status() === 200;
      const ancoraOk = !ancora || (existeix && await p.evaluate(a => !!document.getElementById(a), ancora));
      resultat.urlsEstables[u] = existeix && ancoraOk ? 'ok' : 'FALTA';
    }
    await p.close();
  }
  await navegador.close();

  // ── Desar o comparar ─────────────────────────────────────────────────────
  const fitxers = {
    'formularis.json': resultat.formularis,
    'cossos.json': resultat.cossos,
    'diagnostic-opcions.json': resultat.diagnosticOpcions,
    'urls-estables.json': resultat.urlsEstables,
  };
  let diferencies = 0;
  fs.mkdirSync(DIR_CONTRACTES, { recursive: true });
  for (const [nom, dades] of Object.entries(fitxers)) {
    const f = path.join(DIR_CONTRACTES, nom);
    const nou = JSON.stringify(dades, null, 2) + '\n';
    if (DESAR) { fs.writeFileSync(f, nou); console.log('desat', path.relative(process.cwd(), f)); continue; }
    if (!fs.existsSync(f)) { console.log(`FALTA ${nom}: executa amb --desar`); diferencies++; continue; }
    const vell = fs.readFileSync(f, 'utf8');
    if (vell === nou) { console.log(`ok   ${nom}`); continue; }
    diferencies++;
    console.log(`DIFERENT ${nom}`);
    const a = vell.split('\n'), b = nou.split('\n');
    for (let i = 0, mostrades = 0; i < Math.max(a.length, b.length) && mostrades < 20; i++) {
      if (a[i] !== b[i]) { console.log(`  línia ${i + 1}\n    abans: ${a[i]}\n    ara:   ${b[i]}`); mostrades++; }
    }
  }
  const errorsJs = Object.entries(resultat.errorsJs).filter(([, e]) => e.length);
  for (const [pag, e] of errorsJs) console.log(`ERRORS JS a ${pag}:`, e);
  for (const [clau, c] of Object.entries(resultat.cossos)) if (!c) { console.log(`SENSE PETICIÓ: ${clau}`); diferencies++; }
  process.exit(diferencies || errorsJs.length ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
