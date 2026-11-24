// Proves de l'esquema de les pàgines de servei (C-10): el contingut actual és vàlid i els errors típics s'aturen.
// Ús: npm run serveis
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarServeis } from '../esquema/serveis.mjs';
import { validarPagina, validarLloc } from '../esquema/blocs.mjs';
import { pagina } from '../plantilles/base.mjs';
import { ambDadesDelLloc } from '../plantilles/legal.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };
const amb = canvi => { const d = structuredClone(original); canvi(d); return validarServeis(d); };

const e0 = validarServeis(original);
ok('el contingut actual és vàlid', !e0.length, e0.join('; '));
const casos = [
  ['HTML al cos d\'una secció', d => { d.PAGINES.dpo.ca.seccions[0].cos += '<script>x</script>'; }, /HTML/],
  ['HTML al titular', d => { d.PAGINES.ia.es.h1 = '<em>IA</em>'; }, /HTML/],
  ['canviar una URL de servei', d => { d.SLUG.ca.dpo = 'dpo'; }, /URL/],
  ['treure un servei', d => { d.SERVEIS.pop(); }, /SERVEIS/],
  ['falta una pàgina en castellà', d => { delete d.PAGINES.web.es; }, /PAGINES\.web\.es: falta/],
  ['títol per a Google massa llarg', d => { d.PAGINES.auditoria.ca.titol_seo = 'x'.repeat(91); }, /màxim 90/],
  ['secció sense text', d => { d.PAGINES.adequacio.ca.seccions[1].cos = ''; }, /obligatori/],
  ['camp desconegut', d => { d.PAGINES.adequacio.ca.preu = '10'; }, /camp no previst/],
  ['enllaç de la crida no segur', d => { d.COMU.ca.cta_1[1] = 'javascript:alert(1)'; }, /enllaç vàlid/],
  ['mètode amb 3 passos', d => { d.COMU.es.metode.pop(); }, /com a mínim 4/],
];
for (const [nom, canvi, patro] of casos) {
  const e = amb(canvi);
  ok(`rebutja: ${nom}`, e.some(x => patro.test(x)), e.join('; ') || 'cap error');
}
// Blocs amagats de la portada (WEB-P03): es conserven al contingut però no es pinten; els protegits no es poden amagar
const portada = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/portada.ca.json'), 'utf8'));
const lloc = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
const DIR_F = path.join(ARREL, 'plantilles/formularis');
const formularis = Object.fromEntries(fs.readdirSync(DIR_F).filter(f => f.endsWith('.html')).map(f => [path.basename(f, '.html'), fs.readFileSync(path.join(DIR_F, f), 'utf8')]));
const spot = portada.blocs.findIndex(b => b.tipus === 'spot');
const ambAmagat = structuredClone(portada); ambAmagat.blocs[spot].amagat = true;
ok('un bloc amagat és vàlid i no es pinta', !validarPagina(ambAmagat).length && !pagina(lloc, ambAmagat, formularis).includes(portada.blocs[spot].text.slice(0, 30).replace(/\*/g, '')));
const formAmagat = structuredClone(portada); formAmagat.blocs.find(b => b.tipus === 'formulari').amagat = true;
ok('un formulari no es pot amagar', validarPagina(formAmagat).some(e => /no es pot amagar/.test(e)));

// Textos legals: {{adreca}} i {{correu}} surten de lloc.json; una marca desconeguda atura la construcció
const legal = fs.readFileSync(path.join(ARREL, 'contingut/legal/avis-legal.md'), 'utf8');
ok('els textos legals prenen l\'adreça i el correu de les dades del lloc', legal.includes('{{adreca}}') && ambDadesDelLloc(legal, lloc).includes(lloc.contacte.carrer) && !ambDadesDelLloc(legal, lloc).includes('{{'));
let aturat = false; try { ambDadesDelLloc('Hola {{telefon}}', lloc); } catch { aturat = true; }
ok('una marca desconeguda als textos legals atura la construcció', aturat);

// Menú i peu editables (WEB-P06): enllaços amb nom, columnes amb el contacte opcional
const llocAmb = canvi => { const d = structuredClone(lloc); canvi(d); return validarLloc(d); };
const eL = validarLloc(lloc);
ok('les dades actuals del lloc són vàlides', !eL.length, eL.join('; '));
const casosLloc = [
  ['enllaç del menú no segur', d => { d.menu.ca.enllacos[0].href = 'javascript:alert(1)'; }, /enllaç no permès/],
  ['menú sense enllaços', d => { d.menu.es.enllacos = []; }, /obligatori/],
  ['menú amb 8 enllaços', d => { d.menu.ca.enllacos.push(...d.menu.ca.enllacos.slice(0, 2)); }, /com a màxim 7/],
  ['HTML al text d\'un enllaç del peu', d => { d.peu.ca.columnes[0].elements[0].text = '<b>Serveis</b>'; }, /HTML/],
  ['columna buida', d => { d.peu.es.columnes[1].contacte = false; }, /buida/],
  ['4 columnes al peu', d => { d.peu.ca.columnes.push(d.peu.ca.columnes[0]); }, /com a màxim 3/],
];
for (const [nom, canvi, patro] of casosLloc) {
  const e = llocAmb(canvi);
  ok(`rebutja: ${nom}`, e.some(x => patro.test(x)), e.join('; ') || 'cap error');
}
const ambCanvis = structuredClone(lloc);
ambCanvis.menu.ca.enllacos.push({ text: 'Blog & notícies', href: '/actualitat/' });
ambCanvis.peu.ca.columnes[0].elements.push({ text: 'Web externa', href: 'https://example.org/' });
ambCanvis.peu.ca.columnes[0].contacte = true;
const hL = pagina(ambCanvis, portada, formularis);
ok('el menú i el peu pinten els enllaços nous (escapats; els externs, en una pestanya nova)',
  hL.includes('<a href="/actualitat/">Blog &amp; notícies</a>') && hL.includes('<a href="https://example.org/" target="_blank" rel="noopener">Web externa</a>')
  && (hL.match(/href="mailto:/g) || []).length === (pagina(lloc, portada, formularis).match(/href="mailto:/g) || []).length + 1);

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions dels serveis i dels blocs correctes');
process.exit(fallades ? 1 : 0);
