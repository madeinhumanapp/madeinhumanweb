// Migració d'una sola vegada (prototip B): index.html → contingut/ + plantilles/formularis/.
//
// Converteix cada secció de la portada en un bloc amb dades. Abans d'acceptar un bloc
// estructurat, el torna a generar amb la seva plantilla i el compara amb l'original
// (forma canònica del DOM): si no és idèntic, el bloc queda com a «html» (tal qual) i
// es llista. Així la migració no pot canviar la pàgina sense que es vegi.
//
// Ús: node eines/extreure-portada.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { BLOCS } from '../plantilles/blocs.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { canonicSrc } = require('../proves/canonic.cjs');

const ARREL = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ORIGEN = 'https://madeinhuman.cat';
const URL_PROVA = `${ORIGEN}/?utm_source=paritat`;
const TIPUS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

const navegador = await chromium.launch();
const p = await navegador.newPage({ javaScriptEnabled: false });
await p.route('**/*', r => {
  const u = new URL(r.request().url());
  if (u.origin !== ORIGEN) return r.abort();
  const f = path.join(ARREL, u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname);
  return fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), contentType: TIPUS[path.extname(f)] || 'application/octet-stream' }) : r.fulfill({ status: 404, body: '' });
});
await p.goto(URL_PROVA);

const extret = await p.evaluate(() => {
  // ── Utilitats ──
  const net = s => s.replace(/\s+/g, ' ').trim();
  const canonEnllac = h => (/^#/.test(h) ? '/' + h : /^(\/|https?:|mailto:|tel:)/.test(h) ? h : '/' + h);
  function mini(el) { // DOM → text enriquit (*cursiva*, **negreta**, \n, [enllaç](url))
    let s = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 8) continue;
      if (n.nodeType === 3) {
        if (/[*[\]]/.test(n.data)) throw new Error('caràcter ambigu al text: ' + n.data.trim().slice(0, 40));
        s += n.data.replace(/\s+/g, ' ');
        continue;
      }
      const t = n.tagName.toLowerCase();
      if (t === 'br') s += '\n';
      else if (t === 'em') s += `*${mini(n).trim()}*`;
      else if (t === 'strong' || t === 'b') s += `**${mini(n).trim()}**`;
      else if (t === 'a' && n.attributes.length === 1) s += `[${mini(n).trim()}](${n.getAttribute('href')})`;
      else throw new Error(`etiqueta no admesa al text: <${t}>`);
    }
    return s.replace(/ *\n */g, '\n').replace(/ {2,}/g, ' ').trim();
  }
  const prova = (fn, el) => { try { return fn(el); } catch (e) { return { error: e.message }; } };
  const meta = s => document.querySelector(s)?.getAttribute('content') ?? undefined;

  // ── Dades del lloc: contacte, menú i peu ──
  const nav = document.querySelector('nav.nav');
  const idioma = nav.querySelector('.nav-idioma');
  const wa = document.querySelector('.whatsapp-float');
  const adreca = document.querySelector('footer address');
  const [carrer, cpCiutat] = adreca.innerHTML.split(/<br\s*\/?>/i).map(net);
  const waTxt = [...document.querySelectorAll('footer a[href^="https://wa.me/"]')][0];
  const contacte = {
    correu: document.querySelector('footer a[href^="mailto:"]').textContent.trim(),
    telefon: '+' + waTxt.getAttribute('href').replace(/\D/g, ''),
    telefonVisible: waTxt.textContent.replace(/^WhatsApp:\s*/, '').trim(),
    carrer, cp: cpCiutat.split(' ')[0], ciutat: cpCiutat.split(' ').slice(1).join(' '),
  };
  const peu = document.querySelector('footer');
  const lloc = {
    web: 'https://madeinhuman.cat',
    contacte,
    cap: {
      og: {
        locale: meta('meta[property="og:locale"]'), localeAlternatiu: meta('meta[property="og:locale:alternate"]'),
        nomLloc: meta('meta[property="og:site_name"]'), imatge: meta('meta[property="og:image"]'),
        imatgeAmplada: meta('meta[property="og:image:width"]'), imatgeAlcada: meta('meta[property="og:image:height"]'),
        imatgeAlt: meta('meta[property="og:image:alt"]'),
      },
      twitter: { targeta: meta('meta[name="twitter:card"]'), imatge: meta('meta[name="twitter:image"]') },
      geo: Object.fromEntries(['geo.region', 'geo.placename', 'geo.position', 'ICBM'].map(k => [k, meta(`meta[name="${k}"]`)])),
      autor: meta('meta[name="author"]'), robots: meta('meta[name="robots"]'), colorTema: meta('meta[name="theme-color"]'),
      precarregar: [...document.querySelectorAll('link[rel="preload"]')].map(l => l.getAttribute('href')),
      estils: [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href')),
    },
    menu: { ca: {
      enllacos: [...nav.querySelectorAll('.nav-links a:not(.nav-idioma)')].map(a => [a.textContent.trim(), canonEnllac(a.getAttribute('href'))]),
      altreIdioma: { text: idioma.textContent.trim(), href: idioma.getAttribute('href'), idioma: idioma.getAttribute('hreflang') },
      crida: { text: nav.querySelector('.nav-cta').textContent.trim(), href: canonEnllac(nav.querySelector('.nav-cta').getAttribute('href')) },
      whatsappEtiqueta: wa.getAttribute('aria-label'),
    } },
    peu: { ca: {
      descripcio: net(peu.querySelector('.footer-desc').textContent),
      boto: { text: net([...peu.querySelector('.btn').childNodes].filter(n => n.nodeType === 3).map(n => n.data).join(' ')), href: canonEnllac(peu.querySelector('.btn').getAttribute('href')) },
      columnes: [...peu.querySelectorAll('.footer-col')].map(c => ({
        titol: c.querySelector('.footer-col-title').textContent.trim(),
        elements: [...c.querySelectorAll('li')].map(li => {
          const a = li.querySelector('a');
          if (li.querySelector('address')) return { tipus: 'adreca' };
          if (a.getAttribute('href').startsWith('mailto:')) return { tipus: 'correu' };
          if (a.getAttribute('href').startsWith('https://wa.me/')) return { tipus: 'whatsapp' };
          return { text: a.textContent.trim(), href: canonEnllac(a.getAttribute('href')), ...(a.target === '_blank' ? { extern: true } : {}) };
        }),
      })),
      copyright: net(peu.querySelector('.footer-bottom > span').textContent),
      estat: net(peu.querySelector('.footer-bottom .made').textContent),
    } },
    icones: { whatsapp: [...wa.querySelectorAll('path')].map(x => x.getAttribute('d')) },
  };

  // ── Capçalera de la pàgina ──
  const cap = {
    titol: document.title,
    descripcio: meta('meta[name="description"]'),
    paraulesClau: meta('meta[name="keywords"]'),
    canonica: document.querySelector('link[rel="canonical"]').getAttribute('href'),
    alternatives: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => ({ idioma: l.getAttribute('hreflang'), href: l.getAttribute('href') })),
    og: { titol: meta('meta[property="og:title"]'), descripcio: meta('meta[property="og:description"]'), tipus: meta('meta[property="og:type"]'), url: meta('meta[property="og:url"]') },
    twitter: { titol: meta('meta[name="twitter:title"]'), descripcio: meta('meta[name="twitter:description"]') },
    jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)),
  };

  // ── Blocs ──
  const DISSENY = el => el.matches('.scroll-progress, nav.nav, footer, .back-to-top, .whatsapp-float, script');
  const candidats = [];
  for (const el of document.body.children) {
    if (DISSENY(el)) continue;
    const html = el.outerHTML;
    let bloc;
    if (el.matches('.section-divider')) bloc = { tipus: 'separador' };
    else if (el.matches('header.hero')) bloc = prova(e => ({
      tipus: 'hero',
      subtitol: net(e.querySelector('.eyebrow').textContent),
      titol: mini(e.querySelector('h1')),
      text: mini(e.querySelector('.hero-sub')),
      botons: [...e.querySelectorAll('.cta-row a')].map(a => ({
        text: net([...a.childNodes].filter(n => n.nodeType === 3).map(n => n.data).join(' ')),
        href: canonEnllac(a.getAttribute('href')),
        estil: a.classList.contains('btn-ghost') ? 'secundari' : 'primari',
        ...(a.querySelector('.arrow') ? { fletxa: true } : {}),
      })),
      etiquetes: [...e.querySelectorAll('.hero-meta > span')].map(mini),
    }), el);
    else if (el.matches('section.spot')) bloc = prova(e => ({
      tipus: 'spot', alternat: e.classList.contains('spot-alt'),
      num: e.querySelector('.spot-num').textContent.trim(), titol: mini(e.querySelector('.spot-title')), text: mini(e.querySelector('.spot-text')),
    }), el);
    else if (el.matches('section.method')) bloc = prova(e => ({
      tipus: 'metode', ancora: e.id || undefined,
      etiqueta: e.querySelector('.section-head .eyebrow')?.textContent.trim(),
      titol: mini(e.querySelector('.section-title')), entradeta: mini(e.querySelector('.section-lead')),
      passos: [...e.querySelectorAll('.step')].map(s => ({ titol: s.querySelector('.step-title').textContent.trim(), text: mini(s.querySelector('.step-body')) })),
    }), el);
    else if (el.matches('section#contacte, section#adequacio')) bloc = prova(e => {
      const clon = e.cloneNode(true);
      clon.querySelector('.section-head .section-title').innerHTML = '{{titol}}';
      clon.querySelector('.section-head .section-lead').innerHTML = '{{entradeta}}';
      return { tipus: 'formulari', formulari: e.id, titol: mini(e.querySelector('.section-head .section-title')),
        entradeta: mini(e.querySelector('.section-head .section-lead')), _plantilla: clon.outerHTML };
    }, el);
    candidats.push({ bloc: bloc || { tipus: 'html' }, html });
  }
  return { lloc, cap, candidats };
});

// ── Verificació bloc a bloc i escriptura ──
fs.mkdirSync(path.join(ARREL, 'plantilles/formularis'), { recursive: true });
const ctx = { ruta: '/', idioma: 'ca' };
const blocs = [];
const informe = [];
for (const [i, { bloc, html }] of extret.candidats.entries()) {
  if (bloc.error) { informe.push(`bloc ${i}: queda com a html (${bloc.error})`); blocs.push({ tipus: 'html', html }); continue; }
  if (bloc.tipus === 'html') { informe.push(`bloc ${i}: html (sense plantilla encara) · ${html.slice(0, 60).replace(/\s+/g, ' ')}…`); blocs.push({ tipus: 'html', html }); continue; }
  if (bloc._plantilla) {
    fs.writeFileSync(path.join(ARREL, 'plantilles/formularis', `${bloc.formulari}.html`), bloc._plantilla + '\n');
    delete bloc._plantilla;
  }
  const generat = BLOCS[bloc.tipus](bloc, ctx);
  const [a, b] = await p.evaluate(([src, original, nou, base]) => {
    const canonic = eval('(' + src + ')');
    const t1 = document.createElement('template'); t1.innerHTML = original;
    const t2 = document.createElement('template'); t2.innerHTML = nou;
    return [canonic(t1.content, base), canonic(t2.content, base)];
  }, [canonicSrc, html, generat, URL_PROVA]);
  const igual = a.join('\n') === b.join('\n');
  if (igual) { informe.push(`bloc ${i}: ${bloc.tipus} ✓ idèntic`); blocs.push(bloc); continue; }
  const d = a.findIndex((l, k) => l !== b[k]);
  informe.push(`bloc ${i}: ${bloc.tipus} ✗ diferent a la línia ${d}: ${a[d]} ≠ ${b[d]} → queda com a html`);
  blocs.push({ tipus: 'html', html });
}
await navegador.close();

const pagina = { pagina: 'portada', idioma: 'ca', ruta: '/', fitxer: 'index.html', cap: extret.cap, blocs, scripts: ['utm.js', 'script.js'] };
fs.mkdirSync(path.join(ARREL, 'contingut/pagines'), { recursive: true });
fs.writeFileSync(path.join(ARREL, 'contingut/lloc.json'), JSON.stringify(extret.lloc, null, 2) + '\n');
fs.writeFileSync(path.join(ARREL, 'contingut/pagines/portada.ca.json'), JSON.stringify(pagina, null, 2) + '\n');
console.log(informe.join('\n'));
const n = t => blocs.filter(b => b.tipus === t).length;
console.log(`\n${blocs.length} blocs: ${blocs.length - n('html')} amb dades, ${n('html')} encara en html`);
