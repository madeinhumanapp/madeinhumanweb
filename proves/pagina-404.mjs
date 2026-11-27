// Proves de la pàgina d'error 404 (WEB-T13), sense navegador: dist/404.html manté
// <html lang="ca"> i el noindex, porta el missatge en català, porta el mateix missatge
// en castellà dins d'un element lang="es" amb els quatre enllaços principals de /es/,
// i no té cap enllaç intern cap a una pàgina que no existeixi a dist/.
// Ús: npm run construir && node proves/pagina-404.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

const FITXER = path.join(DIST, '404.html');
if (!fs.existsSync(FITXER)) { console.log('✗ dist/404.html no existeix: executa abans npm run construir'); process.exit(1); }
const html = fs.readFileSync(FITXER, 'utf8');

// 1) Estructura bàsica (no canvia)
ok('<html lang="ca">', /<html lang="ca">/.test(html));
ok('robots noindex', /<meta name="robots" content="noindex"\s*\/>/.test(html));
ok('el missatge en català (títol i frase)',
  html.includes('Aquesta pàgina <em>no existeix.</em>') && html.includes('Potser l\'adreça ha canviat o té algun error'));
const enllacosCa = ['href="/"', 'href="/#serveis"', 'href="/diagnostic.html"', 'href="/actualitat/"', 'href="/#contacte"', 'href="/es/"'];
ok('els enllaços en català que ja hi havia no canvien', enllacosCa.every(h => html.includes(h)));

// 2) El mateix missatge en castellà, dins d'un element lang="es", sota el català
const blocsEs = [...html.matchAll(/<(section|div|article)\b[^>]*\blang="es"[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => m[2]);
const blocEs = blocsEs.find(b => b.includes('Esta página')) || '';
ok('hi ha un element lang="es" amb el text en castellà', !!blocEs);
ok('el bloc en castellà va sota el missatge en català',
  html.indexOf('Aquesta pàgina') !== -1 && html.indexOf('lang="es"') > html.indexOf('Aquesta pàgina'));
ok('el títol i la frase en castellà', blocEs.includes('Esta página no existe.')
  && blocEs.includes('Quizás la dirección ha cambiado o tiene algún error. Puedes volver al inicio o ir directamente a donde querías.'));
const enllacosEs = [['Inicio', '/es/'], ['Servicios', '/es/#servicios'], ['Contacto', '/es/#contacto'], ['Preguntas frecuentes', '/es/preguntas-frecuentes/']];
ok('els quatre enllaços principals en castellà', enllacosEs.every(([t, href]) => blocEs.includes(`<a href="${href}">${t}</a>`)),
  enllacosEs.filter(([t, href]) => !blocEs.includes(`<a href="${href}">${t}</a>`)).map(([t]) => t).join(', '));

// 2b) Formularis de cerca (WEB-G05d): GET cap a /cerca/ (ca) i /es/buscar/ (es) amb camp q i etiqueta
const blocCa = html.slice(html.indexOf('<main'), html.indexOf('Esta página no existe.'));
ok('formulari GET de cerca en català cap a /cerca/ amb camp q i etiqueta',
  /<form\b[^>]*method="get"[^>]*action="\/cerca\/"[^>]*>/i.test(blocCa)
  && /<label\b[^>]*for="cerca-404-ca"[^>]*>/i.test(blocCa)
  && /<input\b[^>]*id="cerca-404-ca"[^>]*name="q"[^>]*>/i.test(blocCa));
ok('formulari GET de cerca en castellà cap a /es/buscar/ amb camp q i etiqueta',
  /<form\b[^>]*method="get"[^>]*action="\/es\/buscar\/"[^>]*>/i.test(blocEs)
  && /<label\b[^>]*for="cerca-404-es"[^>]*>/i.test(blocEs)
  && /<input\b[^>]*id="cerca-404-es"[^>]*name="q"[^>]*>/i.test(blocEs));

// 3) Cap enllaç intern trencat: la pàgina de destinació ha d'existir a dist/
const hrefs = [...html.matchAll(/\b(?:href|action)="([^"]+)"/g)].map(m => m[1]).filter(h => h.startsWith('/'));
const existeix = h => {
  const p = h.split('#')[0].split('?')[0];
  if (!p || p === '/') return true;
  const rel = p.endsWith('/') ? p + 'index.html' : p;
  return fs.existsSync(path.join(DIST, rel)) || fs.existsSync(path.join(DIST, rel + '.html')) || fs.existsSync(path.join(DIST, rel, 'index.html'));
};
const trencats = [...new Set(hrefs.filter(h => !existeix(h)))];
ok('cap enllaç ni action trencat cap a pàgines que no existeixen a dist/', !trencats.length, trencats.join(', '));

console.log(fallades ? `✗ ${fallades} comprovacions de la pàgina 404 han fallat` : 'totes les comprovacions de la pàgina 404 correctes');
process.exit(fallades ? 1 : 0);
