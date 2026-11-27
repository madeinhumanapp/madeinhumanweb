// Proves de dades estructurades (JSON-LD) de tota la web (WEB-G04e), sense navegador.
// Ús: node proves/dades-estructurades.mjs [--arrel dist]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const idxArrel = args.indexOf('--arrel');
const ARREL = path.resolve(ARREL_REPO, idxArrel >= 0 ? args[idxArrel + 1] : 'dist');
const WEB = 'https://madeinhuman.cat';

if (!fs.existsSync(ARREL) || !fs.statSync(ARREL).isDirectory()) {
  console.error(`✗ La carpeta ${ARREL} no existeix: executa abans npm run construir`);
  process.exit(1);
}

const PENDENTS_DE_CLAUDE = new Set([]);
const AVIS_LEGAL = new Set(['avis-legal.html', 'es/aviso-legal.html']);

function atribut(etiqueta, nom) {
  const m = new RegExp(`(?:^|\\s)${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? m[3]).replace(/&amp;/g, '&').trim() : null;
}

const htmlFitxers = [];
(function recorre(rel = '') {
  for (const e of fs.readdirSync(path.join(ARREL, rel), { withFileTypes: true })) {
    if (!rel && e.name === '_previsualitzacio') continue;
    const r = path.join(rel, e.name);
    if (e.isDirectory()) recorre(r);
    else if (e.name.endsWith('.html')) htmlFitxers.push(r.split(path.sep).join('/'));
  }
})();
htmlFitxers.sort();

// Recull la canònica de cada fitxer HTML per validar si una URL .html és coherent amb la canònica
const canonicaDeFitxer = new Map();
const htmlContingut = new Map();
for (const rel of htmlFitxers) {
  const html = fs.readFileSync(path.join(ARREL, rel), 'utf8');
  htmlContingut.set(rel, html);
  const cap = (/<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? '').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of cap.matchAll(/<link\b[^>]*>/gi)) {
    const rels = (atribut(m[0], 'rel') || '').toLowerCase().split(/\s+/);
    if (rels.includes('canonical')) {
      const href = atribut(m[0], 'href');
      if (href) { canonicaDeFitxer.set(rel, href); break; }
    }
  }
}

const errors = [];
const avisos = [];
let totalBlocs = 0;

function afegir(pagina, detall) {
  const linia = `${pagina}: ${detall}`;
  if (PENDENTS_DE_CLAUDE.has(pagina)) avisos.push(linia);
  else errors.push(linia);
}

const noBuit = v => typeof v === 'string' ? v.trim().length > 0 : Boolean(v);

function validarNode(rel, node, idx, esArrel = false) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(x => validarNode(rel, x, idx, esArrel)); return; }

  const tipusLlista = Array.isArray(node['@type']) ? node['@type'] : (node['@type'] ? [node['@type']] : []);

  if (tipusLlista.includes('Article') || tipusLlista.includes('NewsArticle')) {
    for (const camp of ['headline', 'datePublished', 'author', 'publisher', 'inLanguage']) {
      if (!noBuit(node[camp])) afegir(rel, `JSON-LD[${idx}] ${tipusLlista.join('/')}: falta «${camp}»`);
    }
  }

  if (tipusLlista.includes('BreadcrumbList')) {
    const els = node.itemListElement;
    if (!Array.isArray(els) || els.length === 0) {
      afegir(rel, `JSON-LD[${idx}] BreadcrumbList: itemListElement buit`);
    } else {
      els.forEach((el, i) => {
        if (el?.position !== i + 1) afegir(rel, `JSON-LD[${idx}] BreadcrumbList: posició esperada ${i + 1}, trobada ${el?.position}`);
        const item = typeof el?.item === 'string' ? el.item : el?.item?.['@id'];
        if (!item || !item.startsWith(WEB)) {
          afegir(rel, `JSON-LD[${idx}] BreadcrumbList[${i}]: item ha de començar per ${WEB} (${item || 'buit'})`);
        }
      });
    }
  }

  if (tipusLlista.includes('FAQPage')) {
    const els = node.mainEntity;
    if (!Array.isArray(els) || els.length === 0) {
      afegir(rel, `JSON-LD[${idx}] FAQPage: mainEntity buit`);
    } else {
      els.forEach((q, i) => {
        if (!noBuit(q?.name)) afegir(rel, `JSON-LD[${idx}] FAQPage[${i}]: falta la pregunta (name)`);
        if (!noBuit(q?.acceptedAnswer?.text)) afegir(rel, `JSON-LD[${idx}] FAQPage[${i}]: falta la resposta (acceptedAnswer.text)`);
      });
    }
  }

  // Comprova Service només en nodes principals (arrel o dins @graph), no en itemOffered d'un OfferCatalog (hereten provider/areaServed del pare)
  if (esArrel && tipusLlista.includes('Service')) {
    if (!noBuit(node.serviceType)) afegir(rel, `JSON-LD[${idx}] Service: falta «serviceType»`);
    if (!node.areaServed || (Array.isArray(node.areaServed) && node.areaServed.length === 0)) {
      afegir(rel, `JSON-LD[${idx}] Service: falta «areaServed»`);
    }
    if (!node.provider) afegir(rel, `JSON-LD[${idx}] Service: falta «provider»`);
  }

  // Cap streetAddress, postalCode ni geo fora de l'avís legal
  if (!AVIS_LEGAL.has(rel)) {
    for (const proh of ['streetAddress', 'postalCode', 'geo']) {
      if (Object.prototype.hasOwnProperty.call(node, proh)) {
        afegir(rel, `JSON-LD[${idx}]: conté camp prohibit «${proh}» fora de l'avís legal`);
      }
    }
  }

  // Revisa URL internes amb .html si la canònica de la pàgina destí no porta .html
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'string' && v.startsWith(`${WEB}/`) && /\.html(?:$|[?#])/i.test(v)) {
      const rutaFitxer = v.slice(WEB.length + 1).split(/[?#]/)[0];
      const canDesti = canonicaDeFitxer.get(rutaFitxer);
      if (canDesti && !/\.html$/i.test(canDesti)) {
        afegir(rel, `JSON-LD[${idx}].${k}: URL interna amb .html (${v}) però la canònica és ${canDesti}`);
      }
    } else if (v && typeof v === 'object') {
      validarNode(rel, v, idx, false);
    }
  }
}

for (const rel of htmlFitxers) {
  const html = htmlContingut.get(rel);
  let idx = 0;
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    totalBlocs++;
    let dades;
    try {
      dades = JSON.parse(m[1]);
    } catch (err) {
      afegir(rel, `JSON-LD[${idx}] no és JSON vàlid (${err.message})`);
      idx++;
      continue;
    }
    const ctx = dades?.['@context'];
    if (ctx !== 'https://schema.org') {
      afegir(rel, `JSON-LD[${idx}]: @context esperat «https://schema.org», trobat «${ctx}»`);
    }
    if (Array.isArray(dades?.['@graph'])) validarNode(rel, dades['@graph'], idx, true);
    else validarNode(rel, dades, idx, true);
    idx++;
  }
}

console.log(`Analitzats ${totalBlocs} blocs JSON-LD en ${htmlFitxers.length} pàgines a ${path.relative(ARREL_REPO, ARREL) || ARREL}`);
for (const a of avisos) console.log(`⚠ [PENDENT DE CLAUDE] ${a}`);
for (const e of errors) console.log(`✗ ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} infraccions de dades estructurades trobades`);
  process.exit(1);
}
console.log('\ntotes les comprovacions de dades estructurades correctes');
