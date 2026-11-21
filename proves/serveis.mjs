// Proves de l'esquema de les pàgines de servei (C-10): el contingut actual és vàlid i els errors típics s'aturen.
// Ús: npm run serveis
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarServeis } from '../esquema/serveis.mjs';

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
  ['enllaç del menú no segur', d => { d.COMU.ca.nav[0][1] = 'javascript:alert(1)'; }, /enllaç no vàlid/],
  ['mètode amb 3 passos', d => { d.COMU.es.metode.pop(); }, /com a mínim 4/],
];
for (const [nom, canvi, patro] of casos) {
  const e = amb(canvi);
  ok(`rebutja: ${nom}`, e.some(x => patro.test(x)), e.join('; ') || 'cap error');
}
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions dels serveis correctes');
process.exit(fallades ? 1 : 0);
