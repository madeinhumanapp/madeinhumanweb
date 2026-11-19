// Comprova un lliurament de revisió lingüística (encàrrec WEB-L01): cada «Text actual» de les taules
// de propostes s'ha de trobar literalment al fitxer indicat, perquè es pugui aplicar sense errors.
// Ús: npm run revisio -- docs/revisio/WEB-L01a-revisio.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fitxer = process.argv[2];
if (!fitxer || !fs.existsSync(fitxer)) { console.error('Indica el fitxer de revisió: npm run revisio -- docs/revisio/WEB-L01a-revisio.md'); process.exit(1); }
const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const net = s => s.trim().replace(/^`+|`+$/g, '').replace(/\\\|/g, '|');

let files = 0, errors = 0;
for (const linia of fs.readFileSync(fitxer, 'utf8').split('\n')) {
  if (!/^\|\s*\d+\s*\|/.test(linia)) continue; // només les files de propostes: | 1 | fitxer | on | text actual | …
  const cel = linia.split(/(?<!\\)\|/).slice(1, -1).map(net);
  const [num, font, , actual] = cel;
  files++;
  const ruta = path.join(ARREL, font);
  if (!fs.existsSync(ruta)) { errors++; console.log(`✗ fila ${num}: el fitxer «${font}» no existeix`); continue; }
  if (!actual) { errors++; console.log(`✗ fila ${num}: falta el text actual`); continue; }
  if (!fs.readFileSync(ruta, 'utf8').includes(actual)) { errors++; console.log(`✗ fila ${num}: no es troba a ${font}: «${actual.slice(0, 80)}»`); }
}
console.log(`\n${files - errors}/${files} propostes amb el text actual trobat literalment`);
process.exit(errors || !files ? 1 : 0);
