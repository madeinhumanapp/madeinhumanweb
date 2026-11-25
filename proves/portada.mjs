// Proves de la portada amb navegador (portada.js, fil.js i estils): les notes fan la seva transició (primer l'any,
// després el text), el fil subratlla «premisses» i encén les premisses i els passos del mètode quan hi arriba, els
// serveis es fonen com un Venn en fer scroll, les finestres dels serveis s'obren i es tanquen bé, i tot funciona
// sense JavaScript i amb «reduir moviment».
// Serveix dist/ amb la CSP general de _headers, a 375, 768 i 1280 px.
// Ús: npm run construir && node proves/portada.mjs
//     NAVEGADOR=/ruta/a/chrome si Playwright no té el seu navegador instal·lat (npm run navegador)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

if (!fs.existsSync(path.join(DIST, 'portada.js'))) { console.log('✗ dist/portada.js no existeix: executa abans npm run construir'); process.exit(1); }
const serveis = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
const portada = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/portada.ca.json'), 'utf8'));
const items = portada.blocs.find(b => b.tipus === 'serveis').pilars.flatMap(p => p.enllacos);

// CSP general de _headers (regla /*), la mateixa que aplica Cloudflare Pages a la portada
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
const TIPUS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const servidor = http.createServer((req, res) => {
  let f = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (f.endsWith('/')) f += 'index.html';
  let ruta = path.join(DIST, f);
  if (!ruta.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(ruta) && fs.existsSync(ruta + '.html')) ruta += '.html';
  if (!fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404).end(); return; }
  const cap = { 'Content-Type': TIPUS[path.extname(ruta)] || 'application/octet-stream' };
  if (csp && ruta.endsWith('.html')) cap['Content-Security-Policy'] = csp;
  res.writeHead(200, cap);
  fs.createReadStream(ruta).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;
const navegador = await chromium.launch(process.env.NAVEGADOR ? { executablePath: process.env.NAVEGADOR } : {});

const VISTES = [
  { nom: 'mòbil 375', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  { nom: 'tauleta 768', viewport: { width: 768, height: 1024 } },
  { nom: 'escriptori 1280', viewport: { width: 1280, height: 800 } },
];

async function obre(opcions, extra = {}) {
  const ctx = await navegador.newContext({ ...opcions, ...extra });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('cookie_consent', 'rejected'); } catch (e) {}
    window.__infraccions = [];
    document.addEventListener('securitypolicyviolation', e => window.__infraccions.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  return { ctx, p, errors };
}
const fusio = p => p.evaluate(() => getComputedStyle(document.querySelector('.fusio')).getPropertyValue('--fusio').trim());
const vesA = async (p, y) => { await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(120); };
const desborda = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

for (const v of VISTES) {
  const { ctx, p, errors } = await obre(v);
  const vh = v.viewport.height;
  const geo = await p.evaluate(() => {
    const top = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
    const f = document.querySelector('.fusio'), j = document.querySelector('.fusio-junts');
    return { y: top(f), b: Math.max(top(f) + f.offsetHeight, top(j) + j.offsetHeight), viva: f.classList.contains('fusio-viva') };
  });
  ok(`${v.nom}: el Venn s'anima amb JavaScript (.fusio-viva)`, geo.viva);

  // 0a) Notes: en baixar, primer apareix l'any (a1), després va al seu costat (a2) i al final entra el text (a3)
  const nota = await p.evaluate(() => { const n = document.querySelector('.nota'); let t = 0; for (let e = n; e; e = e.offsetParent) t += e.offsetTop; return { top: t, viva: n.classList.contains('nota-viva') }; });
  const fases = [];
  for (let y = Math.max(0, nota.top - vh); y <= nota.top + 40; y += 30) {
    await vesA(p, y);
    fases.push(await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.nota')); return ['--a1', '--a2', '--a3'].map(k => parseFloat(cs.getPropertyValue(k)) || 0); }));
  }
  const ordre = fases.every(([a, b, c]) => a >= b && b >= c);
  const creixen = fases.every((f, i) => !i || f.every((x, k) => x >= fases[i - 1][k]));
  const final = fases[fases.length - 1].every(x => x === 1);
  ok(`${v.nom}: la nota 2018 fa la transició (l'any primer, després el text) sense tirar enrere`, nota.viva && ordre && creixen && final, JSON.stringify(fases.filter((_, i) => i % 3 === 0)));

  // 0a') Presentació de les premisses: el passat (b1), el punt que s'encén (b2) i el futur (b3), en aquest ordre
  const intro = await p.evaluate(() => { const n = document.querySelector('.premisses-intro'); let t = 0; for (let e = n; e; e = e.offsetParent) t += e.offsetTop; return { top: t, viva: n.classList.contains('intro-viva') }; });
  const fasesB = [];
  for (let y = Math.max(0, intro.top - vh); y <= intro.top; y += 30) {
    await vesA(p, y);
    fasesB.push(await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.premisses-intro')); return ['--b1', '--b2', '--b3'].map(k => parseFloat(cs.getPropertyValue(k)) || 0); }));
  }
  const ordreB = fasesB.every(([a, b, c]) => a >= b && b >= c);
  const creixenB = fasesB.every((f, i) => !i || f.every((x, k) => x >= fasesB[i - 1][k]));
  const opac = await p.evaluate(() => ['.pres-passat', '.pres-futur'].map(s => parseFloat(getComputedStyle(document.querySelector(s)).opacity)));
  const punt = await p.evaluate(() => document.querySelector('.premisses-presentacio').textContent.includes('dades. Ara'));
  ok(`${v.nom}: la presentació passa del passat al futur pel punt, sense tirar enrere (al final, el futur ple i el passat esmorteït)`,
    intro.viva && ordreB && creixenB && fasesB[fasesB.length - 1].every(x => x === 1) && opac[1] === 1 && opac[0] > 0.5 && opac[0] < 0.8 && punt,
    JSON.stringify({ fases: fasesB.filter((_, i) => i % 4 === 0), opac, punt }));

  // 0b) Subratllat: el fil passa just per sota de «premisses» i s'hi veu
  const sub = await p.evaluate(() => {
    const em = document.querySelector('[data-fil="subratllat"]'), rs = [...em.getClientRects()], r = rs[rs.length - 1];
    const y1 = r.bottom + scrollY, x0 = r.left + scrollX, x1 = r.right + scrollX;
    const m = madeinhumanFil.mostres().filter(([x, y, , vis]) => x > x0 && x < x1 && y > y1 && y < y1 + 22 && vis >= 0.8);
    return { mostres: m.length, cobreix: m.length ? (Math.max(...m.map(q => q[0])) - Math.min(...m.map(q => q[0]))) / (x1 - x0) : 0 };
  });
  ok(`${v.nom}: el fil subratlla «premisses» (${Math.round(sub.cobreix * 100)} % de la paraula)`, sub.mostres > 10 && sub.cobreix > 0.8, JSON.stringify(sub));

  // 0c) Premisses i passos del mètode: s'encenen quan hi arriba el fil i s'apaguen si es torna amunt
  const encesos = () => p.evaluate(() => ({ prem: [...document.querySelectorAll('.premissa')].map(e => e.classList.contains('fil-arribat')), passos: [...document.querySelectorAll('.step')].map(e => e.classList.contains('fil-arribat')) }));
  await vesA(p, 0); await p.waitForTimeout(250);
  const dalt = await encesos();
  const metode = await p.evaluate(() => { const m = document.querySelector('#metode'); let t = 0; for (let e = m; e; e = e.offsetParent) t += e.offsetTop; return t + m.offsetHeight; });
  await vesA(p, metode); await p.waitForTimeout(250);
  const baix = await encesos();
  await vesA(p, 0); await p.waitForTimeout(250);
  const altre = await encesos();
  ok(`${v.nom}: les premisses i els passos s'encenen quan hi arriba el fil (i s'apaguen en tornar amunt)`,
    [...dalt.prem, ...dalt.passos].every(x => !x) && [...baix.prem, ...baix.passos].every(x => x) && [...altre.prem, ...altre.passos].every(x => !x) && baix.prem.length === 3 && baix.passos.length === 4,
    JSON.stringify({ dalt, baix, altre }));

  // 1) Fusió: separats abans d'arribar-hi; en baixar, el valor creix (mai enrere) passant per valors intermedis
  //    fins a 1. Comprova també que no hi ha desbordament horitzontal en cap moment.
  await vesA(p, 0);
  const f0 = parseFloat(await fusio(p));
  const valors = []; let desbordat = false;
  for (let y = Math.max(0, geo.y - vh * 1.2); y <= geo.b; y += 40) {
    await vesA(p, y);
    valors.push(parseFloat(await fusio(p)));
    if (await desborda(p)) desbordat = true;
  }
  const creix = valors.every((x, i) => !i || x >= valors[i - 1]);
  const intermedis = valors.filter(x => x > 0.05 && x < 0.95).length;
  ok(`${v.nom}: els àmbits es fonen en fer scroll (0 → ${intermedis} valors intermedis → 1)`, f0 === 0 && creix && intermedis >= 3 && valors[valors.length - 1] === 1, valors.join(' '));
  ok(`${v.nom}: cap desbordament horitzontal durant la fusió`, !desbordat);

  // 2) Quan la punta del fil arriba sota l'escena (on els fils es retroben), la fusió ja és completa
  await vesA(p, Math.max(0, geo.b + 30 - vh * 0.62));
  ok(`${v.nom}: quan el fil arriba a la juntura de sota, la fusió és completa`, (await fusio(p)) === '1', await fusio(p));

  // 3) Fusionats: cap text d'un àmbit queda sota el panell «Junts» ni sota l'altre àmbit
  const sota = await p.evaluate(() => {
    const rect = el => el.getBoundingClientRect();
    const toca = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const junts = rect(document.querySelector('.fusio-junts'));
    const [rgpd, ia] = [...document.querySelectorAll('.fusio-ambit')];
    const res = [];
    for (const [amb, altre] of [[rgpd, ia], [ia, rgpd]]) {
      const tw = document.createTreeWalker(amb, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() ? 1 : 2) });
      const rng = document.createRange();
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        rng.selectNodeContents(n);
        for (const r of rng.getClientRects()) {
          if (toca(r, junts)) res.push(`«${n.nodeValue.trim().slice(0, 30)}» sota «Junts»`);
          if (amb === rgpd && toca(r, rect(altre))) res.push(`«${n.nodeValue.trim().slice(0, 30)}» sota l'àmbit d'IA`);
        }
      }
    }
    return res;
  });
  ok(`${v.nom}: fusionats, cap text queda tapat`, !sota.length, sota.slice(0, 3).join(' · '));

  // 4) Finestres: cada servei obre la seva, amb l'entradeta i l'enllaç; es tanca amb el fons, la X i Esc
  for (const [i, e] of items.entries()) {
    const slug = /\/serveis\/([a-z0-9-]+)\//.exec(e.href)[1];
    const clau = Object.keys(serveis.SLUG.ca).find(k => serveis.SLUG.ca[k] === slug);
    const sel = `a.detall-item[href="${e.href}"]`;
    await p.locator(sel).scrollIntoViewIfNeeded();
    await p.click(sel);
    await p.waitForTimeout(150);
    const d = await p.evaluate(slug => {
      const dl = document.getElementById('detall-' + slug);
      return dl && { obert: dl.open, titol: dl.querySelector('.detall-dialeg-titol').textContent, text: dl.querySelector('.detall-dialeg-text')?.textContent || '',
        enllac: dl.querySelector('.detall-dialeg-mes').getAttribute('href'), bloqueig: document.documentElement.classList.contains('dialeg-obert') };
    }, slug);
    ok(`${v.nom}: «${e.text}» obre la seva finestra amb l'entradeta i l'enllaç`, d && d.obert && d.titol === e.text && d.text === serveis.PAGINES[clau].ca.lede && d.enllac === e.href && d.bloqueig, JSON.stringify(d));
    const tancaAmb = ['fons', 'x', 'esc'][i % 3];
    if (tancaAmb === 'fons') await p.mouse.click(4, Math.round(vh / 3));
    else if (tancaAmb === 'x') await p.click(`#detall-${slug} .detall-tanca`);
    else await p.keyboard.press('Escape');
    await p.waitForTimeout(150);
    const t = await p.evaluate(([slug, sel]) => ({ obert: document.getElementById('detall-' + slug).open, focus: document.activeElement === document.querySelector(sel), bloqueig: document.documentElement.classList.contains('dialeg-obert') }), [slug, sel]);
    ok(`${v.nom}: es tanca amb ${{ fons: 'un clic fora', x: 'la X', esc: 'Esc' }[tancaAmb]} i el focus torna a l'ítem`, !t.obert && t.focus && !t.bloqueig, JSON.stringify(t));
  }
  // clicar dins la finestra no la tanca
  await p.click(`a.detall-item[href="${items[0].href}"]`);
  await p.waitForTimeout(150);
  const slug0 = /\/serveis\/([a-z0-9-]+)\//.exec(items[0].href)[1];
  await p.click(`#detall-${slug0} .detall-dialeg-text`);
  ok(`${v.nom}: clicar dins la finestra no la tanca`, await p.evaluate(s => document.getElementById('detall-' + s).open, slug0));
  await p.keyboard.press('Escape');

  // 5) Zones de toc
  const petits = await p.evaluate(() => [...document.querySelectorAll('.detall-item, .detall-tanca')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); }).map(el => el.textContent.trim().slice(0, 20) || el.className));
  ok(`${v.nom}: zones de toc de 44 px com a mínim`, !petits.length, petits.join(', '));
  ok(`${v.nom}: cap desbordament horitzontal`, !(await desborda(p)));

  const infr = await p.evaluate(() => window.__infraccions);
  ok(`${v.nom}: cap error de consola ni infracció de CSP`, !errors.length && !infr.length, [...errors, ...infr].slice(0, 3).join(' · '));
  await ctx.close();
}

// Contacte sense repeticions i línia #faq cap a la pàgina de preguntes freqüents
{
  const { ctx, p } = await obre(VISTES[2]);
  const r = await p.evaluate(() => {
    const c = document.querySelector('#contacte'), f = document.querySelector('#faq');
    return { text: c.textContent.replace(/\s+/g, ' '), faq: f && f.querySelector('a') && f.querySelector('a').getAttribute('href') };
  });
  ok('el contacte no repeteix el missatge i diu «24 hores» (sense «laborables»)', !/Contacte ràpid|laborals|laborables/.test(r.text) && /24 hores/.test(r.text) && (r.text.match(/Tens un dubte/g) || []).length === 1, r.text.slice(0, 200));
  ok('la portada manté #faq amb una línia cap a /preguntes-frequents/', r.faq === '/preguntes-frequents/', String(r.faq));
  await ctx.close();
}

// Sense JavaScript: els serveis es veuen fusionats i els ítems són enllaços a les pàgines de servei
{
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'load' });
  const r = await p.evaluate(() => {
    const f = document.querySelector('.fusio'), j = document.querySelector('.fusio-junts');
    return { viva: f.classList.contains('fusio-viva'), opacitat: getComputedStyle(j).opacity, transf: getComputedStyle(document.querySelector('.fusio-rgpd')).transform,
      enllacos: [...document.querySelectorAll('a.detall-item')].map(a => a.getAttribute('href')), oberts: [...document.querySelectorAll('dialog[open]')].length };
  });
  ok('sense JavaScript: els serveis es veuen fusionats', !r.viva && r.opacitat === '1' && r.transf === 'none', JSON.stringify(r));
  ok('sense JavaScript: els ítems són enllaços a les pàgines de servei i cap finestra és oberta',
    JSON.stringify(r.enllacos) === JSON.stringify(items.map(e => e.href)) && r.oberts === 0, JSON.stringify(r.enllacos));
  await ctx.close();
}

// «Reduir moviment»: fusionats des del principi, sense escoltar el scroll, i les vores de llum quietes
{
  const { ctx, p } = await obre(VISTES[2], { reducedMotion: 'reduce' });
  await vesA(p, 0);
  const r = await p.evaluate(() => {
    const f = document.querySelector('.fusio');
    f.scrollIntoView();
    const it = document.querySelector('.detall-item');
    return { viva: f.classList.contains('fusio-viva'), valor: getComputedStyle(f).getPropertyValue('--fusio').trim(), anim: getComputedStyle(it, '::before').animationName };
  });
  await p.waitForTimeout(300);
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.detall-item'), '::before').animationName);
  ok('amb «reduir moviment» els serveis es veuen fusionats i no s\'animen', !r.viva && r.valor === '1', JSON.stringify(r));
  ok('amb «reduir moviment» les vores de llum no giren', anim === 'none', anim);
  const rm = await p.evaluate(() => ({ notes: [...document.querySelectorAll('.nota')].some(n => n.classList.contains('nota-viva')),
    intro: document.querySelector('.premisses-intro').classList.contains('intro-viva'),
    futur: getComputedStyle(document.querySelector('.pres-futur')).opacity,
    encesos: [...document.querySelectorAll('.premissa, .step')].every(e => e.classList.contains('fil-arribat')) }));
  ok('amb «reduir moviment» les notes i la presentació no s\'animen (el futur es veu) i les premisses i els passos es veuen encesos',
    !rm.notes && !rm.intro && rm.futur === '1' && rm.encesos, JSON.stringify(rm));
  await ctx.close();
}

await navegador.close();
servidor.close();
console.log(fallades ? `✗ ${fallades} comprovacions de la portada han fallat` : 'totes les comprovacions de la portada correctes');
process.exit(fallades ? 1 : 0);
