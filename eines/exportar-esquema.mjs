// Exporta l'esquema del contingut a esquema/esquema.json: el panell de rgpd-tool en genera els formularis i
// en valida els canvis abans de desar-los (la validació definitiva és la del generador, a GitHub Actions).
// Ús: npm run exportar-esquema          (escriu el fitxer)
//     npm run exportar-esquema -- --comprovar   (falla si el fitxer no està al dia)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESQUEMA, CAMPS_FAQ, CAMPS_NOTICIA, CAMPS_XARXES, CAMPS_CONTACTE, CAMPS_MENU, CAMPS_PEU } from '../esquema/blocs.mjs';
import { CAMPS_SERVEI, CAMPS_PORTADA_ES, CAMPS_COMU, SERVEIS, SLUGS_ESTABLES } from '../esquema/serveis.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FITXER = path.join(ARREL, 'esquema/esquema.json');
const dades = {
  _avis: 'Fitxer generat per eines/exportar-esquema.mjs a partir de esquema/*.mjs. No l\'editis a mà.',
  versio: 1,
  blocs: ESQUEMA,
  faq: CAMPS_FAQ,
  noticia: CAMPS_NOTICIA,
  xarxes: CAMPS_XARXES,
  lloc: { contacte: CAMPS_CONTACTE, menu: CAMPS_MENU, peu: CAMPS_PEU },
  serveis: { serveis: SERVEIS, slugs: SLUGS_ESTABLES, servei: CAMPS_SERVEI, portada_es: CAMPS_PORTADA_ES, comu: CAMPS_COMU },
};
const text = JSON.stringify(dades, null, 2) + '\n';
if (process.argv.includes('--comprovar')) {
  const actual = fs.existsSync(FITXER) ? fs.readFileSync(FITXER, 'utf8').replace(/\r\n/g, '\n') : '';
  if (actual !== text) { console.error('✗ esquema/esquema.json no està al dia: executa npm run exportar-esquema'); process.exit(1); }
  console.log('esquema.json al dia');
} else {
  fs.writeFileSync(FITXER, text);
  console.log('esquema/esquema.json escrit');
}
