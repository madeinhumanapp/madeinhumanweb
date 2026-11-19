/* Paritat entre dues versions de la web (prototip B).
   Compara cada pàgina HTML de --a amb la mateixa de --b: forma canònica del DOM
   (sense JavaScript, tal com surt del generador) i text visible bloc a bloc.

   Ús: node proves/paritat.cjs --a . --b dist [--pagines index.html,serveis/dpo-extern/index.html] */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { canonicSrc } = require('./canonic.cjs');

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const A = path.resolve(opt('--a', '.')), B = path.resolve(opt('--b', 'dist'));
const ORIGEN = 'https://madeinhuman.cat';
const TIPUS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };

function totesLesPagines(arrel) {
  const out = [];
  (function r(rel) {
    for (const e of fs.readdirSync(path.join(arrel, rel), { withFileTypes: true })) {
      const x = path.join(rel, e.name);
      if (e.isDirectory()) { if (!['node_modules', '.git', 'marca', 'admin', 'proves', 'eines', 'plantilles', 'contingut', 'docs', 'dist'].includes(e.name)) r(x); }
      else if (e.name.endsWith('.html')) out.push(x);
    }
  })('');
  return out.sort();
}

async function obre(navegador, arrel, pagina, js) {
  const p = await navegador.newPage({ javaScriptEnabled: js, viewport: { width: 1280, height: 900 } });
  await p.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.origin !== ORIGEN) return r.abort();
    const f = path.join(arrel, u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname);
    return fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), contentType: TIPUS[path.extname(f)] || 'application/octet-stream' }) : r.fulfill({ status: 404, body: '' });
  });
  const ruta = '/' + pagina.replace(/index\.html$/, '');
  await p.goto(`${ORIGEN}${ruta}?utm_source=paritat`);
  return p;
}

const forma = p => p.evaluate(([src]) => {
  const canonic = eval('(' + src + ')');
  return { cap: canonic(document.head, location.href), blocs: [...document.body.children].map(e => canonic(e, location.href)) };
}, [canonicSrc]);
const textVisible = p => p.evaluate(() => [...document.body.children].map(e => (e.innerText || '').replace(/[ \t]+\n/g, '\n').trim()));
// Les pàgines amb aplicacions (recollida, diagnòstic) es pinten amb JavaScript: s'espera que el text
// visible deixi de canviar abans de comparar-lo (si no, la comparació depèn de la velocitat de càrrega)
async function textEstable(p) {
  await p.waitForLoadState('networkidle').catch(() => {});
  let anterior = null;
  for (let i = 0; i < 25; i++) {
    const ara = JSON.stringify(await textVisible(p));
    if (ara === anterior) return JSON.parse(ara);
    anterior = ara;
    await p.waitForTimeout(200);
  }
  return JSON.parse(anterior);
}

(async () => {
  const pagines = opt('--pagines', null)?.split(',') ?? totesLesPagines(A);
  const navegador = await chromium.launch();
  let diferents = 0;
  for (const pag of pagines.filter(x => !fs.existsSync(path.join(B, x)))) { diferents++; console.log(`✗ ${pag}: falta a ${path.relative(process.cwd(), B) || B}`); }
  for (const pag of pagines.filter(x => fs.existsSync(path.join(B, x)))) {
    // Fitxer idèntic byte a byte: no cal obrir-lo
    if (fs.readFileSync(path.join(A, pag)).equals(fs.readFileSync(path.join(B, pag)))) { console.log(`✓ ${pag} (fitxer idèntic)`); continue; }
    const [pa, pb] = [await obre(navegador, A, pag, false), await obre(navegador, B, pag, false)];
    const [fa, fb] = [await forma(pa), await forma(pb)];
    const errors = [];
    const compara = (nom, x, y) => {
      if (x.join('\n') === y.join('\n')) return;
      const i = x.findIndex((l, k) => l !== y[k]);
      errors.push(`${nom}, línia ${i}:\n      abans: ${(x[i] ?? '(res)').trim().slice(0, 160)}\n      ara:   ${(y[i] ?? '(res)').trim().slice(0, 160)}`);
    };
    compara('<head>', fa.cap, fb.cap);
    if (fa.blocs.length !== fb.blocs.length) errors.push(`nombre de blocs: ${fa.blocs.length} → ${fb.blocs.length}`);
    fa.blocs.forEach((b, i) => compara(`bloc ${i}`, b, fb.blocs[i] || []));
    await pa.close(); await pb.close();
    // Text tal com es veu (amb CSS i JS): detecta espais o salts que la forma canònica no veu
    const [ta, tb] = [await obre(navegador, A, pag, true), await obre(navegador, B, pag, true)];
    const [xa, xb] = [await textEstable(ta), await textEstable(tb)];
    xa.forEach((t, i) => { if (t !== xb[i]) errors.push(`text visible del bloc ${i} diferent`); });
    await ta.close(); await tb.close();
    if (errors.length) { diferents++; console.log(`✗ ${pag}\n    ${errors.slice(0, 6).join('\n    ')}`); }
    else console.log(`✓ ${pag}`);
  }
  await navegador.close();
  console.log(`\n${pagines.length - diferents}/${pagines.length} pàgines idèntiques`);
  process.exit(diferents ? 1 : 0);
})();
