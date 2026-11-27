// Proves de la taula de validació d'esborranys i les marques [REVISAR] ressaltades (WEB-G04a), sense navegador.
// Ús: node proves/esborranys.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ressaltarRevisar } from '../plantilles/actualitat.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'esborranys-'));
let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

const construir = (env, sortida, extraArgs = []) => {
  try {
    return {
      ok: true,
      sortida: execFileSync('node', ['eines/construir.mjs', '--sortida', sortida, ...extraArgs], {
        cwd: ARREL, env: { ...process.env, CF_PAGES_BRANCH: '', ...env }, encoding: 'utf8', stdio: 'pipe',
      }),
    };
  } catch (e) {
    return { ok: false, sortida: String(e.stderr) + String(e.stdout) };
  }
};

// 1. Prova unitària d'escapament de ressaltarRevisar (una marca amb <b> escapat no genera cap etiqueta <b>)
const htmlEscapat = '<main><div><p>Text [REVISAR: dada amb &lt;b&gt;negreta&lt;/b&gt;]</p></div></main>';
const resEsc = ressaltarRevisar(htmlEscapat, 'ca');
ok('ressaltarRevisar numera la marca i preserva l\'escapament sense crear <b>',
  resEsc.marques.length === 1
  && resEsc.html.includes('<mark class="revisar" id="revisar-1">[REVISAR: dada amb &lt;b&gt;negreta&lt;/b&gt;]</mark>')
  && !resEsc.html.includes('<b>')
  && resEsc.html.includes('Marques pendents (1)')
  && resEsc.html.includes('href="#revisar-1"'));

// 2. Fitxers temporals de sectors i notícies/guies (publicats + esborranys amb 0, 1 i 3 marques)
const dirSectors = path.join(TMP, 'sectors');
const dirAct = path.join(TMP, 'actualitat');
fs.mkdirSync(dirSectors);
fs.mkdirSync(dirAct);

const sectorBase = {
  slug: 'sector-tres-marques',
  idioma: 'ca',
  grup_hreflang: 'grup-clinica',
  estat: 'esborrany',
  sector: 'salut',
  titol_seo: 'RGPD clíniques prova · Madeinhuman',
  descripcio: 'Descripció de prova per al sector de clíniques.',
  h1: 'Sector amb tres marques',
  entradeta: 'Entradeta amb [REVISAR: primera marca].',
  capsula: 'Càpsula de prova amb [REVISAR: segona marca] per comprovar el ressaltat.',
  seccions: [
    { titol: 'Primera pregunta?', cos: 'Cos de prova amb [REVISAR: tercera marca].' },
    { titol: 'Segona pregunta?', cos: 'Cos sense marques.' },
  ],
  documents: ['Document de prova'],
  faq: [{ pregunta: 'Pregunta?', resposta: 'Resposta sense marques.' }],
  servei_relacionat: 'dpo',
  cta_desti: 'diagnostic',
  fonts: [{ nom: 'RGPD', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' }],
};

const sectorEsZero = {
  ...structuredClone(sectorBase),
  slug: 'sector-cero-marcas',
  idioma: 'es',
  grup_hreflang: 'grup-clinica',
  titol_seo: 'RGPD clínicas prueba · Madeinhuman',
  h1: 'Sector sin marcas',
  entradeta: 'Entradilla sin marcas pendientes.',
  capsula: 'Cápsula limpia sin ninguna marca pendiente.',
  seccions: [
    { titol: '¿Primera pregunta?', cos: 'Texto sin marcas.' },
    { titol: '¿Segunda pregunta?', cos: 'Más texto sin marcas.' },
  ],
};

const sectorPublicat = {
  ...structuredClone(sectorBase),
  slug: 'sector-publicat-prova',
  grup_hreflang: 'grup-pub',
  estat: 'publicat',
  h1: 'Sector publicat sense marques',
  entradeta: 'Entradeta publicada.',
  capsula: 'Càpsula publicada.',
  seccions: [
    { titol: 'Primera pregunta?', cos: 'Text publicat.' },
    { titol: 'Segona pregunta?', cos: 'Més text publicat.' },
  ],
};

fs.writeFileSync(path.join(dirSectors, `${sectorBase.slug}.json`), JSON.stringify(sectorBase, null, 2));
fs.writeFileSync(path.join(dirSectors, `${sectorEsZero.slug}.json`), JSON.stringify(sectorEsZero, null, 2));
fs.writeFileSync(path.join(dirSectors, `${sectorPublicat.slug}.json`), JSON.stringify(sectorPublicat, null, 2));

const guiaUnaMarca = `---
titol: "Guia amb una marca"
resum: "Resum de la guia de prova."
data: 2026-12-01
etiqueta: rgpd
tipus_article: guia
font_nom: "RGPD"
font_url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj"
estat: esborrany
idioma: ca
---

## Què cal revisar?

Text de la guia amb [REVISAR: confirmar article 33].
`;

const noticiaZeroMarques = `---
titol: "Notícia en esborrany neta"
resum: "Resum de la notícia en esborrany."
data: 2026-12-02
etiqueta: ia
tipus_article: noticia
font_nom: "EUR-Lex"
font_url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj"
estat: esborrany
idioma: ca
---

## Novetat

Text sense cap marca pendent.
`;

const noticiaPublicada = `---
titol: "Notícia publicada de prova"
resum: "Resum publicat."
data: 2026-01-10
etiqueta: rgpd
font_nom: "AEPD"
font_url: "https://www.aepd.es/"
estat: publicat
idioma: ca
---

## Detall

Contingut ja publicat.
`;

fs.writeFileSync(path.join(dirAct, '2026-12-01-guia-una-marca.md'), guiaUnaMarca);
fs.writeFileSync(path.join(dirAct, '2026-12-02-noticia-zero-marques.md'), noticiaZeroMarques);
fs.writeFileSync(path.join(dirAct, '2026-01-10-noticia-publicada.md'), noticiaPublicada);

// 3. Construcció en mode --esborranys
const outDraft = path.join(TMP, 'dist-draft');
const rDraft = construir({ DIR_SECTORS: dirSectors, DIR_ACTUALITAT: dirAct, DATA_CONSTRUCCIO: '2026-06-01' }, outDraft, ['--esborranys']);
ok('--esborranys construeix sense errors', rDraft.ok, rDraft.sortida);

const htmlTaula = fs.readFileSync(path.join(outDraft, 'esborranys/index.html'), 'utf8');
ok('/esborranys/ existeix, té noindex, nofollow, franja i resum total (4 esborranys, 4 marques)',
  htmlTaula.includes('<meta name="robots" content="noindex, nofollow" />')
  && htmlTaula.includes('Esborrany: pendent de validació')
  && htmlTaula.includes('<strong>4</strong> esborranys · <strong>4</strong> marques'));

const filesTaula = [...htmlTaula.matchAll(/<tr\b[^>]*>\s*<td>([\s\S]*?)<\/tr>/g)].map(m => m[0]);
ok('la taula té exactament els 4 esborranys i no les pàgines publicades',
  filesTaula.length === 4
  && !htmlTaula.includes(sectorPublicat.h1)
  && !htmlTaula.includes('Notícia publicada de prova'));

// Ordre esperat: 0 marques (notícia, sector), 1 marca (guia), 3 marques (sector)
const idxNoticia0 = htmlTaula.indexOf('Notícia en esborrany neta');
const idxSector0 = htmlTaula.indexOf('Sector sin marcas');
const idxGuia1 = htmlTaula.indexOf('Guia amb una marca');
const idxSector3 = htmlTaula.indexOf('Sector amb tres marques');
ok('la taula ordena de menys a més marques (0 → 1 → 3) i després per tipus i títol',
  idxNoticia0 > 0 && idxNoticia0 < idxSector0 && idxSector0 < idxGuia1 && idxGuia1 < idxSector3);

ok('la taula inclou columnes tipus, idioma, enllaç de traducció pel grup_hreflang i fitxer curt amb camí complet a title',
  htmlTaula.includes('<td>notícia</td>')
  && htmlTaula.includes('<td>guia</td>')
  && htmlTaula.includes('<td>sector</td>')
  && htmlTaula.includes('href="/es/sectores/sector-cero-marcas/">Versió ES</a>')
  && htmlTaula.includes('href="/sectors/sector-tres-marques/">Versió CA</a>')
  && htmlTaula.includes('<code title="contingut/sectors/sector-tres-marques.json">sector-tres-marques.json</code>')
  && htmlTaula.includes('<code title="contingut/actualitat/2026-12-01-guia-una-marca.md">2026-12-01-guia-una-marca.md</code>'));

// 3b. Taula de validació 2.0 (WEB-G05b): filtres per URL, <details> per esborrany, Markdown i guia
ok('la taula té filtres per tipus i idioma amb enllaços d\'URL i files amb data-tipus / data-idioma / data-marques',
  htmlTaula.includes('data-filtre-tipus="sector" href="/esborranys/?tipus=sector"')
  && htmlTaula.includes('data-filtre-tipus="guia" href="/esborranys/?tipus=guia"')
  && htmlTaula.includes('data-filtre-tipus="noticia" href="/esborranys/?tipus=noticia"')
  && htmlTaula.includes('data-filtre-idioma="ca" href="/esborranys/?idioma=ca"')
  && htmlTaula.includes('data-filtre-idioma="es" href="/esborranys/?idioma=es"')
  && htmlTaula.includes('data-tipus="sector" data-idioma="ca" data-marques="3"')
  && htmlTaula.includes('data-tipus="sector" data-idioma="es" data-marques="0"')
  && htmlTaula.includes('data-tipus="guia" data-idioma="ca" data-marques="1"')
  && htmlTaula.includes('data-tipus="noticia" data-idioma="ca" data-marques="0"'));

const detalls = [...htmlTaula.matchAll(/<details class="esborranys-detall">[\s\S]*?<\/details>/g)].map(m => m[0]);
ok('cada esborrany amb marques té un <details> amb la llista completa de marques [REVISAR]',
  detalls.length === 2
  && detalls[0].includes('Veure 1 marca')
  && detalls[0].includes('[REVISAR: confirmar article 33]')
  && detalls[1].includes('Veure 3 marques')
  && detalls[1].includes('[REVISAR: primera marca]')
  && detalls[1].includes('[REVISAR: segona marca]')
  && detalls[1].includes('[REVISAR: tercera marca]'));

const mdBloc = /<pre id="esborranys-markdown" hidden>([\s\S]*?)<\/pre>/.exec(htmlTaula)?.[1] || '';
ok('hi ha botons de copiar/descarregar i el Markdown agrupat per fitxer amb les 4 marques',
  htmlTaula.includes('id="btn-copiar-marques"')
  && htmlTaula.includes('Copiar totes les marques')
  && htmlTaula.includes('id="btn-descarregar-marques"')
  && htmlTaula.includes('Descarregar en Markdown')
  && mdBloc.includes('# Marques [REVISAR] pendents')
  && mdBloc.includes('Total: 4 marques en 2 esborranys.')
  && mdBloc.includes('## contingut/actualitat/2026-12-01-guia-una-marca.md — Guia amb una marca (1)')
  && mdBloc.includes('- [REVISAR: confirmar article 33]')
  && mdBloc.includes('## contingut/sectors/sector-tres-marques.json — Sector amb tres marques (3)')
  && mdBloc.includes('- [REVISAR: tercera marca]'));

ok('hi ha el requadre «Com es publica un esborrany» i el script /esborranys/esborranys.js',
  htmlTaula.includes('Com es publica un esborrany')
  && htmlTaula.includes('estat: publicat')
  && htmlTaula.includes('data_revisio')
  && htmlTaula.includes('src="/esborranys/esborranys.js"')
  && fs.existsSync(path.join(outDraft, 'esborranys/esborranys.js')));

// 4. Ressaltat de marques i caixa resum a les pàgines d'esborrany
const htmlSec3 = fs.readFileSync(path.join(outDraft, `sectors/${sectorBase.slug}/index.html`), 'utf8');
ok('sector amb 3 marques pinta <mark class="revisar" id="revisar-1..3"> i caixa «Marques pendents (3)»',
  htmlSec3.includes('<mark class="revisar" id="revisar-1">[REVISAR: primera marca]</mark>')
  && htmlSec3.includes('<mark class="revisar" id="revisar-2">[REVISAR: segona marca]</mark>')
  && htmlSec3.includes('<mark class="revisar" id="revisar-3">[REVISAR: tercera marca]</mark>')
  && htmlSec3.includes('<h2>Marques pendents (3)</h2>')
  && htmlSec3.includes('href="#revisar-1"')
  && htmlSec3.includes('href="#revisar-2"')
  && htmlSec3.includes('href="#revisar-3"'));

const htmlSec0 = fs.readFileSync(path.join(outDraft, `es/sectores/${sectorEsZero.slug}/index.html`), 'utf8');
ok('esborrany sense marques no porta ni <mark class="revisar"> ni caixa de marques pendents',
  !htmlSec0.includes('class="revisar"') && !htmlSec0.includes('class="revisar-caixa"'));

const htmlGuia1 = fs.readFileSync(path.join(outDraft, 'actualitat/guia-una-marca/index.html'), 'utf8');
ok('guia en esborrany ressalta la marca i afegeix la caixa «Marques pendents (1)»',
  htmlGuia1.includes('<mark class="revisar" id="revisar-1">[REVISAR: confirmar article 33]</mark>')
  && htmlGuia1.includes('<h2>Marques pendents (1)</h2>')
  && htmlGuia1.includes('href="#revisar-1"'));

const htmlActEsb = fs.readFileSync(path.join(outDraft, 'actualitat/esborranys/index.html'), 'utf8');
ok('/actualitat/esborranys/ es manté i enllaça a /esborranys/',
  htmlActEsb.includes('href="/esborranys/"'));

const mapaDraft = fs.readFileSync(path.join(outDraft, 'sitemap.xml'), 'utf8');
ok('/esborranys/ no entra mai al mapa del lloc', !mapaDraft.includes('/esborranys/'));

// 5. A producció no existeix /esborranys/ ni cap <mark class="revisar"
const outProd = path.join(TMP, 'dist-prod');
const rProd = construir({ DIR_SECTORS: dirSectors, DIR_ACTUALITAT: dirAct, DATA_CONSTRUCCIO: '2026-06-01' }, outProd);
ok('producció construeix sense errors', rProd.ok, rProd.sortida);
ok('producció no genera /esborranys/, /esborranys/esborranys.js ni /actualitat/esborranys/',
  !fs.existsSync(path.join(outProd, 'esborranys/index.html'))
  && !fs.existsSync(path.join(outProd, 'esborranys/esborranys.js'))
  && !fs.existsSync(path.join(outProd, 'actualitat/esborranys/index.html')));
let algunMarkProd = false;
(function recorre(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (ent.name !== '_previsualitzacio') recorre(r); }
    else if (ent.name.endsWith('.html') && fs.readFileSync(r, 'utf8').includes('class="revisar"')) algunMarkProd = true;
  }
})(outProd);
ok('a producció no apareix cap <mark class="revisar"> en cap pàgina', !algunMarkProd);

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de la taula d\'esborranys correctes');
process.exit(fallades ? 1 : 0);
