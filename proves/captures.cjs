/* Captures de pàgina sencera a 375, 768 i 1280 px, per comparar abans i després d'un canvi visual.
   Ús: node proves/captures.cjs <etiqueta> [--dir . | --dir dist] [--pagines index.html,serveis/dpo-extern/index.html]
   Desa a captures/<etiqueta>/ (no es puja al repositori). Tot es serveix en local: cap petició a internet. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARREL = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const etiqueta = args[0] && !args[0].startsWith('--') ? args[0] : 'captura';
const opcio = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const DIR = path.resolve(ARREL, opcio('--dir', 'dist'));
const PAGINES = opcio('--pagines', 'index.html,politica-privacitat.html,serveis/dpo-extern/index.html,es/index.html,es/servicios/dpo-externo/index.html').split(',');
const SORTIDA = path.join(ARREL, 'captures', etiqueta);
const TIPUS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

(async () => {
  fs.mkdirSync(SORTIDA, { recursive: true });
  const navegador = await chromium.launch();
  for (const amplada of [375, 768, 1280]) {
    const context = await navegador.newContext({ viewport: { width: amplada, height: 900 }, reducedMotion: 'reduce' });
    await context.route('**/*', r => {
      const u = new URL(r.request().url());
      if (u.origin !== 'https://madeinhuman.cat') return r.fulfill({ status: 404, body: '' });
      const f = path.join(DIR, decodeURIComponent(u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname));
      return fs.existsSync(f) && fs.statSync(f).isFile()
        ? r.fulfill({ body: fs.readFileSync(f), contentType: TIPUS[path.extname(f)] || 'application/octet-stream' })
        : r.fulfill({ status: 404, body: '' });
    });
    // Sense el bàner de cookies (per comparar el disseny, no l'estat del visitant)
    await context.addInitScript(() => { try { localStorage.setItem('cookie_consent', 'rejected'); } catch (e) {} });
    const pagina = await context.newPage();
    const errors = [];
    pagina.on('pageerror', e => errors.push(e.message));
    for (const p of PAGINES) {
      await pagina.goto('https://madeinhuman.cat/' + p.replace(/index\.html$/, ''));
      await pagina.evaluate(() => document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(e => e.classList.add('visible', 'in')));
      await pagina.waitForTimeout(300);
      const desborda = await pagina.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      const nom = `${p.replace(/\/index\.html$|\.html$/, '').replace(/\//g, '_') || 'index'}-${amplada}.png`;
      await pagina.screenshot({ path: path.join(SORTIDA, nom), fullPage: true });
      console.log(`${desborda ? '✗ desborda' : '✓'} ${nom}`);
    }
    if (errors.length) console.log(`  errors de JavaScript: ${errors.join(' | ')}`);
    await context.close();
  }
  await navegador.close();
  console.log(`captures a captures/${etiqueta}/`);
})();
