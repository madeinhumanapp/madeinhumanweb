// Ús: npm run domicili (després de npm run construir). Sense navegador.
// WEB-T05: el domicili (carrer i codi postal de contingut/lloc.json) només pot sortir a l'avís legal.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
if (!fs.existsSync(DIST)) { console.error('✗ Falta dist/: executa primer npm run construir'); process.exit(1); }

const lloc = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
const carrer = lloc.contacte.carrer;
const cp = lloc.contacte.cp;
const zona = lloc.contacte.zona;

let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

// Tots els .html publicats a dist/
const pagines = [];
(function recorre(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) recorre(path.join(dir, e.name));
    else if (e.name.endsWith('.html')) pagines.push(path.join(dir, e.name));
  }
})(DIST);
const rel = f => path.relative(DIST, f);
const llegir = f => fs.readFileSync(f, 'utf8');

// Excepcions: les pàgines legals el cos de les quals porta {{adreca}} (contingut/legal/ no es pot editar)
const ambDomicili = new Set();
for (const f of fs.readdirSync(path.join(ARREL, 'contingut/pagines'))) {
  const p = JSON.parse(llegir(path.join(ARREL, 'contingut/pagines', f)));
  if (p.plantilla === 'legal' && llegir(path.join(ARREL, 'contingut', p.cos)).includes('{{adreca}}')) ambDomicili.add(p.fitxer);
}
ok('l’avís legal és una de les pàgines amb domicili', ambDomicili.has('avis-legal.html'), [...ambDomicili].join(', '));

// 1. Cap pàgina (llevat de les legals amb {{adreca}}) conté el carrer ni el codi postal
const fora = pagines.filter(f => !ambDomicili.has(rel(f)) && (llegir(f).includes(carrer) || llegir(f).includes(cp)));
ok(`cap pàgina fora de l’avís legal conté el carrer ni el codi postal (${pagines.length} pàgines)`, !fora.length, fora.map(rel).join(', '));

// 2. L'avís legal sí que els conté
const avis = llegir(path.join(DIST, 'avis-legal.html'));
ok('avis-legal.html sí que conté el carrer i el codi postal', avis.includes(carrer) && avis.includes(cp));

// 3. Cap JSON-LD de cap pàgina té streetAddress, postalCode ni geo
function jsonlds(html) {
  const res = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { res.push(JSON.parse(m[1])); } catch { res.push(null); }
  }
  return res;
}
function teClau(o, clau) {
  if (Array.isArray(o)) return o.some(x => teClau(x, clau));
  if (!o || typeof o !== 'object') return false;
  return Object.entries(o).some(([k, v]) => k === clau || teClau(v, clau));
}
const jsonInvalid = pagines.filter(f => jsonlds(llegir(f)).some(j => j === null));
ok('tot el JSON-LD de les pàgines és vàlid', !jsonInvalid.length, jsonInvalid.map(rel).join(', '));
const maus = [];
for (const f of pagines) {
  for (const j of jsonlds(llegir(f))) {
    if (!j) continue;
    for (const clau of ['streetAddress', 'postalCode', 'geo']) if (teClau(j, clau)) maus.push(`${rel(f)} (${clau})`);
  }
}
ok('cap JSON-LD de cap pàgina té streetAddress, postalCode ni geo', !maus.length, maus.join(', '));

// 3b. Cap coordenada precisa: com a molt 2 decimals (uns 1 km), el centre de la ciutat i no el domicili
const precises = [];
const coordenades = (o, f) => {
  if (Array.isArray(o)) return o.forEach(x => coordenades(x, f));
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    if ((k === 'latitude' || k === 'longitude') && /\.\d{3,}/.test(String(v))) precises.push(`${rel(f)} (${k})`);
    else coordenades(v, f);
  }
};
for (const f of pagines) for (const j of jsonlds(llegir(f))) if (j) coordenades(j, f);
ok('cap JSON-LD té coordenades de més de 2 decimals', !precises.length, precises.join(', '));

// 4. El text de contacte.zona surt al peu de la portada
ok('el peu de la portada (index.html) mostra la zona de treball', llegir(path.join(DIST, 'index.html')).includes(zona));

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions del domicili correctes');
process.exit(fallades ? 1 : 0);
