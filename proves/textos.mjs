// Proves dels textos d'interfície centralitzats (WEB-G05c), sense navegador:
// - cada clau existeix en ca i en es, sense valors buits
// - substitució de marcadors {clau} a t()
// - cap clau sense ús dins de plantilles/
// - cap dels textos migrats coneguts no queda escrit directament a plantilles/actualitat.mjs ni plantilles/sectors.mjs
// Ús: node proves/textos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEXTOS, t } from '../plantilles/textos.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

const clausCa = Object.keys(TEXTOS.ca).sort();
const clausEs = Object.keys(TEXTOS.es).sort();

const faltenEs = clausCa.filter(k => !Object.prototype.hasOwnProperty.call(TEXTOS.es, k));
const sobrenEs = clausEs.filter(k => !Object.prototype.hasOwnProperty.call(TEXTOS.ca, k));
ok(`totes les claus (${clausCa.length}) existeixen tant en ca com en es`,
  clausCa.length > 0 && faltenEs.length === 0 && sobrenEs.length === 0,
  [faltenEs.length ? `falten a es: ${faltenEs.join(', ')}` : '', sobrenEs.length ? `falten a ca: ${sobrenEs.join(', ')}` : ''].filter(Boolean).join(' · '));

const buits = [];
for (const lang of ['ca', 'es']) {
  for (const [k, v] of Object.entries(TEXTOS[lang])) {
    if (typeof v !== 'string' || !v.trim()) buits.push(`${lang}.${k}`);
  }
}
ok('cap valor buit en cap idioma', buits.length === 0, buits.join(', '));

// Comprova substitució de marcadors i error en clau desconeguda
let llancaDesconeguda = false;
try { t('ca', 'clau.inexistent'); } catch { llancaDesconeguda = true; }
ok('t() substitueix {n} i {idioma} i llança error si la clau no existeix',
  t('ca', 'comu.lectura_min', { n: 5 }) === '5 min de lectura'
  && t('es', 'comu.marques_pendents', { n: 3 }) === 'Marcas pendientes (3)'
  && t('ca', 'taula.versio_idioma', { idioma: 'ES' }) === 'Versió ES'
  && llancaDesconeguda);

// Recull totes les plantilles (excepte textos.mjs) per comprovar ús de cada clau
const dirPlantilles = path.join(ARREL, 'plantilles');
const codiPlantilles = fs.readdirSync(dirPlantilles)
  .filter(f => f.endsWith('.mjs') && f !== 'textos.mjs')
  .map(f => fs.readFileSync(path.join(dirPlantilles, f), 'utf8'))
  .join('\n');

// Prefixos dinàmics usats via template literal t(lang, `prefix${...}`)
const prefixosDinamics = [...codiPlantilles.matchAll(/\bt\([^,]+,\s*`([a-z0-9_.]+)\$\{/g)].map(m => m[1]);

const senseUs = clausCa.filter(clau => {
  if (codiPlantilles.includes(`'${clau}'`) || codiPlantilles.includes(`"${clau}"`)) return false;
  if (prefixosDinamics.some(p => clau.startsWith(p))) return false;
  return true;
});
ok('cap clau sense ús dins de plantilles/', senseUs.length === 0, senseUs.join(', '));

// Comprova que els textos coneguts no queden escrits directament a les plantilles migrades
const migrades = ['plantilles/actualitat.mjs', 'plantilles/sectors.mjs'];
const textosProhibits = [
  'Darrera revisió jurídica:',
  'Última revisión jurídica:',
  'En aquesta guia',
  'En esta guía',
  'Documents habituals',
  'Documentos que suelen hacer falta',
  "Sectors on s'aplica",
  'Sectores donde se aplica',
  'Guies relacionades',
  'Guías relacionadas',
  'Altres sectors',
  'Otros sectores',
  'Més notícies',
  'Más noticias',
  'Marques pendents (',
  'Marcas pendientes (',
  'min de lectura',
  'Esborrany: pendent de validació',
  'Borrador: pendiente de validación',
  'Taula de validació',
  'Com es publica un esborrany',
  'Copiar totes les marques',
  'Descarregar en Markdown',
  'Segueix les novetats per RSS',
  'Sigue las novedades por RSS',
];

const treureComentaris = codi => codi
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const trobats = [];
for (const rel of migrades) {
  const codi = treureComentaris(fs.readFileSync(path.join(ARREL, rel), 'utf8'));
  for (const text of textosProhibits) {
    if (codi.includes(text)) trobats.push(`${rel}: «${text}»`);
  }
}
ok('cap dels textos d\'interfície migrats no queda escrit directament a actualitat.mjs ni sectors.mjs',
  trobats.length === 0, trobats.join(' · '));

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions dels textos d\'interfície correctes');
process.exit(fallades ? 1 : 0);
