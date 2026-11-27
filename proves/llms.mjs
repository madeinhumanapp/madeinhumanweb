// Proves de /llms.txt (WEB-G05e), sense navegador:
// - estructura llmstxt.org (# Madeinhuman, línia > de lloc.json, seccions sense buides)
// - totes les URLs són absolutes (https://madeinhuman.cat/…), existeixen a dist/ i són indexables (al mapa del lloc)
// - cap esborrany ni pàgina noindex ni marca [REVISAR
// - amb --esborranys, /llms.txt és idèntic byte a byte al de producció
// Ús: npm run construir && node proves/llms.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

if (!fs.existsSync(path.join(DIST, 'llms.txt')) || !fs.existsSync(path.join(DIST, 'sitemap.xml'))) {
  console.log('✗ falta dist/llms.txt o dist/sitemap.xml: executa abans npm run construir');
  process.exit(1);
}

const lloc = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
const llms = fs.readFileSync(path.join(DIST, 'llms.txt'), 'utf8');
const mapaXml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locsMapa = new Set([...mapaXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));

const linies = llms.trim().split('\n');
ok('comença amb «# Madeinhuman» i una línia «> » amb la descripció de lloc.json',
  linies[0] === `# ${lloc.nom}` && llms.includes(`\n> ${lloc.peu.ca.descripcio}\n`));

const seccions = [...llms.matchAll(/^## (.+)$/gm)].map(m => m[1]);
const seccionsPermeses = new Set(['Serveis', 'Preguntes freqüents', 'Actualitat', 'Sectors', 'Legal', 'Español']);
ok('les seccions segueixen el format previst i inclouen Serveis, Preguntes freqüents, Actualitat i Español',
  seccions.every(s => seccionsPermeses.has(s))
  && seccions.includes('Serveis')
  && seccions.includes('Preguntes freqüents')
  && seccions.includes('Actualitat')
  && seccions.includes('Español'),
  seccions.join(', '));

// Cap secció buida (cada ## ha de tenir com a mínim una línia «- [»)
const blocsSeccio = llms.split(/\n(?=## )/).slice(1);
const seccionsBuides = blocsSeccio.filter(b => !/\n- \[/.test(b));
ok('les seccions sense pàgines publicades no surten (cap secció buida)', seccionsBuides.length === 0);

// Totes les URLs són absolutes, existeixen a dist/ i corresponen a pàgines indexables
const enllacos = [...llms.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?$/gm)];
const urls = enllacos.map(m => m[2]);
const existeixADist = url => {
  if (!url.startsWith(lloc.web + '/')) return false;
  const p = new URL(url).pathname;
  if (p === '/') return fs.existsSync(path.join(DIST, 'index.html'));
  const rel = p.endsWith('/') ? p + 'index.html' : p;
  return fs.existsSync(path.join(DIST, rel)) || fs.existsSync(path.join(DIST, rel + '.html')) || fs.existsSync(path.join(DIST, rel, 'index.html'));
};
const invalides = urls.filter(u => !existeixADist(u));
const foraMapa = urls.filter(u => !locsMapa.has(u));
const faltenDelMapa = [...locsMapa].filter(u => !urls.includes(u));
ok(`totes les URLs (${urls.length}) són absolutes (${lloc.web}/…) i existeixen a dist/`,
  urls.length > 0 && invalides.length === 0, invalides.join(', '));
ok('cap pàgina noindex ni esborrany, i totes les pàgines indexables del mapa del lloc hi surten',
  foraMapa.length === 0 && faltenDelMapa.length === 0 && !llms.includes('[REVISAR'),
  [foraMapa.length ? `fora del mapa: ${foraMapa.join(', ')}` : '', faltenDelMapa.length ? `falten: ${faltenDelMapa.join(', ')}` : ''].filter(Boolean).join(' · '));

// Paritat estricta amb --esborranys (cap esborrany no entra mai a /llms.txt)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'llms-'));
try {
  const outEsb = path.join(TMP, 'dist-esb');
  execFileSync('node', ['eines/construir.mjs', '--esborranys', '--sortida', outEsb], {
    cwd: ARREL, env: { ...process.env, CF_PAGES_BRANCH: '' }, stdio: 'pipe',
  });
  const llmsEsb = fs.readFileSync(path.join(outEsb, 'llms.txt'), 'utf8');
  ok('amb --esborranys, /llms.txt és idèntic byte a byte al de producció', llmsEsb === llms);
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de llms.txt correctes');
process.exit(fallades ? 1 : 0);
