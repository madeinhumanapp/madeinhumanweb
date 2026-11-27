// Informe de registre lingüístic «tu» / «vosaltres» (i «tú» / «vosotros») — WEB-G07c.
// Eina de NOMÉS LECTURA: no modifica cap fitxer del repositori ni de contingut/.
// Construeix la web (amb esborranys per defecte) en una carpeta temporal fora del repositori,
// n'extreu el text visible (sense <script> ni <style>, però incloent aria-label, alt, placeholder i title)
// i escriu l'informe a captures/registre/informe.md (carpeta ignorada per git).
//
// Ús: node eines/registre.mjs [--sense-esborranys]
//
// Regles i límits de detecció:
// - Totes les coincidències fan servir límits Unicode de paraula ((?<![\p{L}\p{N}_]) … (?![\p{L}\p{N}_]))
//   perquè les lletres accentuades (à, é, í, ó, ú, ç, ñ, ·) no trenquin mai una paraula.
// - Falsos positius evitats explícitament:
//   · «us» dins d'una paraula («usuari», «just», «ús») o en majúscules («US» = Estats Units).
//   · «et» en llatí («et al.», «et cetera», «et seq.»), en majúscules («ET») o «Et» en majúscula inicial
//     enmig d'una frase (noms propis o marques), admetent només «Et» a principi de frase/clàusula.
//   · «te» en castellà com a substantiu («té» porta accent i no coincideix; «el te» / «un te» / «del te»
//     també s'exclouen) i mai com a sufix de paraules acabades en -te («parte», «cliente», «frente»).
//   · «os» en majúscules («OS» = sistema operatiu) o dins d'altres paraules («todos», «datos»).
//   · Imperatius de 2a persona singular homògrafs de la 3a persona del singular (p. ex. ca «respon»,
//     «demana», «comença», «escriu», «consulta», «prova»; es «responde», «pide», «empieza», «escribe»,
//     «consulta», «prueba»): només compten si van a principi de frase/clàusula en majúscula (típics de
//     botons o crides a l'acció) i no darrere d'un article/pronom/preposició, mentre que les formes amb
//     pronom enclític («escriu-nos», «contacta'ns», «escríbenos», «cuéntanos») compten sempre.
// - Límits coneguts: és una anàlisi lèxica sense analitzador morfosintàctic complet; alguns imperatius
//   infreqüents o formes verbals molt específiques poden no ser a la llista, i els textos generats només
//   per JavaScript en temps d'execució (com les preguntes internes de diagnostic.js o autotest-saas) no
//   s'avaluen si no formen part de l'HTML inicial.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TEXTOS } from '../plantilles/textos.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIDA = path.join(ARREL, 'captures/registre/informe.md');

const ENTITATS = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  laquo: '«', raquo: '»', ndash: '–', mdash: '—', hellip: '…',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·',
  rarr: '→', larr: '←', uarr: '↑', darr: '↓', bull: '•',
  copy: '©', euro: '€',
};

export function desescaparHtml(str) {
  return String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (tot, nom) => (Object.prototype.hasOwnProperty.call(ENTITATS, nom) ? ENTITATS[nom] : tot));
}

/** Extreu el text visible d'un document HTML (sense <head>, <script>, <style> ni blocs ocults,
 *  però incloent els atributs visibles aria-label, alt, placeholder i title). */
export function extreureTextVisible(html) {
  const cosMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  let bloc = cosMatch ? cosMatch[1] : String(html);

  // Elimina comentaris, scripts, estils, plantilles, SVG interns i <pre hidden> (exportacions internes)
  bloc = bloc
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<pre\b[^>]*\bhidden\b[^>]*>[\s\S]*?<\/pre>/gi, ' ');

  // Extreu valors d'atributs visibles d'interfície
  const atributs = [];
  const reTag = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  let mTag;
  while ((mTag = reTag.exec(bloc)) !== null) {
    const attrs = mTag[2];
    const reAttr = /\b(aria-label|alt|placeholder|title)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    let mAttr;
    while ((mAttr = reAttr.exec(attrs)) !== null) {
      const val = desescaparHtml(mAttr[2] ?? mAttr[3] ?? '').replace(/\s+/g, ' ').trim();
      if (val) atributs.push(val);
    }
  }

  // Converteix salts de bloc en salts de línia per conservar fronteres de frase/botó
  const textCos = desescaparHtml(
    bloc
      .replace(/<\/?(?:p|div|section|article|main|aside|header|footer|nav|h[1-6]|li|ul|ol|dl|dt|dd|tr|td|th|blockquote|details|summary|button|label|option|figcaption|br|hr)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  );

  const linies = [...textCos.split(/\r?\n/), ...atributs]
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return linies.join('\n');
}

export function detectarIdioma(html, rel = '') {
  const m = /<html\b[^>]*\blang\s*=\s*["']([a-z]{2})/i.exec(html);
  if (m) return m[1].toLowerCase() === 'es' ? 'es' : 'ca';
  return rel.startsWith('es/') ? 'es' : 'ca';
}

export function esPaginaEsborrany(html, rel = '') {
  return /\bclass\s*=\s*["'][^"']*\b(?:sector-esborrany|franja-esborrany)\b/i.test(html)
    || rel === 'esborranys/index.html'
    || rel === 'actualitat/esborranys/index.html'
    || rel.startsWith('es/autotest-saas/');
}

const INI = '(?<![\\p{L}\\p{N}_])';
const FI = '(?![\\p{L}\\p{N}_])';

function esIniciFrase(text, index) {
  const pre = text.slice(Math.max(0, index - 8), index);
  if (!pre.trim()) return true;
  return /(?:^|[\n.!?:;·—–«(\[|])\s*$/.test(pre);
}

const PRE_EXCL_CA = /\b(?:el|la|els|les|un|una|uns|unes|en|es|se|que|qui|no|ja|també|sempre|només|quan|si|on|hi|ho|li|de|d'|d’|a|al|del|pel|per|amb|sense|seu|seva|seus|seves|aquest|aquesta|cada|tot|tota|molt|més|menys)$/i;
const PRE_EXCL_ES = /\b(?:el|la|los|las|un|una|unos|unas|en|se|que|quien|no|ya|también|siempre|solo|sólo|cuando|si|donde|le|lo|de|al|del|por|para|con|sin|su|sus|este|esta|cada|todo|toda|muy|más|menos)$/i;

const REGLES = {
  ca: {
    tu: [
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}tu${FI}`, 'giu'),
        filtre: (m) => m !== 'TU',
      },
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}et${FI}`, 'giu'),
        filtre: (m, idx, text) => {
          if (m === 'ET') return false;
          // Evita expressions llatines (et al., et cetera, et seq.)
          const post = text.slice(idx + m.length, idx + m.length + 14);
          if (/^\s+(?:al\.?|cetera|seq\.?)(?![\p{L}])/iu.test(post)) return false;
          // «Et» amb majúscula inicial només és català a principi de frase/clàusula (evita noms propis)
          if (m[0] === 'E' && !esIniciFrase(text, idx)) return false;
          return true;
        },
      },
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}t['’](?=[aeiouàèéíòóúüh])`, 'giu'),
      },
      {
        categoria: 'clític',
        re: new RegExp(`(?<=[\\p{L}])(?:-te|['’]t)${FI}`, 'giu'),
      },
      {
        categoria: 'possessiu',
        re: new RegExp(`${INI}(?:(?:el|la|els|les|al|del|pel|als|dels|pels)\\s+)?(?:teu|teva|teus|teves)${FI}`, 'giu'),
      },
      {
        categoria: 'verb 2sg',
        re: new RegExp(
          `${INI}(?:tens|pots|vols|necessites|fas|fes|ets|saps|tractes|uses|gestiones|compleixes|revises|guardes|comparteixes|envies|pagues|dones|dius|veus|coneixes|treballes|reculls|busques|trobes|rebràs|sabràs|trobaràs|tindràs|podràs|hauràs|has|estàs|vas|vens|disposes|utilitzes|incorpores|allotges|escriu-nos|contacta['’]ns|explica['’]ns|prova-ho|demana['’]ns|parla['’]ns)${FI}`,
          'giu',
        ),
      },
      {
        // Imperatius homògrafs de 3sg: només a principi de frase/clàusula (majúscula) i sense passiva reflexa ni determinant previ
        categoria: 'imperatiu 2sg',
        re: new RegExp(
          `${INI}(?:descobreix|demana|escriu|respon|comença|parla|contacta|prova|explica|consulta|troba|segueix|obre|comprova|posa|tria|revisa|envia)${FI}`,
          'giu',
        ),
        filtre: (m, idx, text) => {
          if (m === m.toUpperCase()) return false;
          if (!esIniciFrase(text, idx)) return false;
          if (m[0] !== m[0].toUpperCase()) return false;
          const pre = text.slice(Math.max(0, idx - 24), idx).trim();
          if (pre && PRE_EXCL_CA.test(pre)) return false;
          // Evita construccions impersonals/passives en 3sg («Comença a aplicar-se el RGPD»)
          const post = text.slice(idx + m.length, idx + m.length + 28);
          if (/^\s+a\s+[\p{L}]+-se(?![\p{L}])/iu.test(post)) return false;
          return true;
        },
      },
    ],
    vosaltres: [
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}vosaltres${FI}`, 'giu'),
      },
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}us${FI}`, 'giu'),
        filtre: (m) => m !== 'US',
      },
      {
        categoria: 'clític',
        re: new RegExp(`(?<=[\\p{L}])-vos${FI}`, 'giu'),
      },
      {
        categoria: 'possessiu',
        re: new RegExp(`${INI}(?:(?:el|la|els|les|al|del|pel|als|dels|pels)\\s+)?(?:vostre|vostra|vostres)${FI}`, 'giu'),
      },
      {
        categoria: 'verb 2pl',
        re: new RegExp(
          `${INI}(?:teniu|podeu|voleu|necessiteu|feu|sou|sabeu|tracteu|descobriu|demaneu|escriviu|responeu|comenceu|reserveu|cerqueu|trobareu|trobeu|rebreu|sabreu|tindreu|podreu|haureu|heu|vau|esteu|aneu|veniu|useu|gestioneu|complireu|compliu|reviseu|guardeu|compartiu|envieu|pagueu|doneu|passeu|dieu|veieu|coneixeu|treballeu|recolliu|busqueu|volíeu|teníeu|podíeu|sabíeu|trieu|marqueu|confirmeu|contacteu|expliqueu|proveu|consulteu|seguiu|obriu|comproveu|poseu|parleu|disposeu|utilitzeu|incorporeu|allotgeu)${FI}`,
          'giu',
        ),
      },
    ],
  },
  es: {
    tu: [
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}tú${FI}`, 'giu'),
      },
      {
        categoria: 'possessiu',
        re: new RegExp(`${INI}(?:tu|tus)${FI}`, 'giu'),
        filtre: (m) => m !== 'TU' && m !== 'TUS',
      },
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}te${FI}`, 'giu'),
        filtre: (m, idx, text) => {
          if (m === 'TE') return false;
          // Evita el substantiu «te» (sense accent) darrere d'article o preposició de beguda («un te», «el te», «taza de te»)
          const pre = text.slice(Math.max(0, idx - 20), idx).trim();
          if (/\b(?:el|un|del|al|taza\s+de|infusión\s+de)$/i.test(pre)) return false;
          return true;
        },
      },
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}(?:ti|contigo)${FI}`, 'giu'),
        filtre: (m) => m !== 'TI',
      },
      {
        categoria: 'verb 2sg',
        re: new RegExp(
          `${INI}(?:tienes|puedes|quieres|necesitas|haces|haz|eres|sabes|tratas|usas|gestionas|cumples|revisas|guardas|compartes|envías|pagas|das|pasas|dices|ves|conoces|trabajas|recoges|buscas|encuentras|recibes|recibirás|sabrás|encontrarás|tendrás|podrás|deberás|has|estás|vas|vienes|dispones|utilizas|incorporas|alojas|pon|escríbenos|cuéntanos|contáctanos|llámanos|dinos|pídenos|pruébalo|hazlo)${FI}`,
          'giu',
        ),
      },
      {
        categoria: 'imperatiu 2sg',
        re: new RegExp(
          `${INI}(?:descubre|pide|escribe|responde|empieza|habla|contacta|prueba|consulta|encuentra|sigue|abre|comprueba|elige|revisa|envía)${FI}`,
          'giu',
        ),
        filtre: (m, idx, text) => {
          if (m === m.toUpperCase()) return false;
          if (!esIniciFrase(text, idx)) return false;
          if (m[0] !== m[0].toUpperCase()) return false;
          const pre = text.slice(Math.max(0, idx - 24), idx).trim();
          if (pre && PRE_EXCL_ES.test(pre)) return false;
          return true;
        },
      },
    ],
    vosaltres: [
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}(?:vosotros|vosotras)${FI}`, 'giu'),
      },
      {
        categoria: 'pronom',
        re: new RegExp(`${INI}os${FI}`, 'giu'),
        filtre: (m) => m !== 'OS',
      },
      {
        categoria: 'possessiu',
        re: new RegExp(`${INI}(?:vuestro|vuestra|vuestros|vuestras)${FI}`, 'giu'),
      },
      {
        categoria: 'verb 2pl',
        re: new RegExp(
          `${INI}(?:tenéis|podéis|queréis|necesitáis|hacéis|sois|sabéis|tratáis|usáis|gestionáis|cumplís|revisáis|guardáis|compartís|enviáis|pagáis|dais|pasáis|decís|veis|conocéis|trabajáis|recogéis|buscáis|encontráis|recibís|recibiréis|sabréis|encontraréis|tendréis|podréis|deberéis|habéis|estáis|vais|venís|disponéis|utilizáis|incorporáis|alojáis|queríais|teníais|podíais|sabíais|elegís|confirmáis|contactáis|explicáis|probáis|consultáis|seguís|abrís|comprobáis|ponéis|habláis|reserváis|descubrid|pedid|escribid|escribidnos|responded|empezad|reservad|buscad|enviad|elegid|marcad|revisad|confirmad|guardad|haced|hablad|contactad|contactadnos|contadnos|probad|consultad|seguid|abrid|comprobad|poned|llamad|llamadnos|pedidnos)${FI}`,
          'giu',
        ),
      },
    ],
  },
};

export function extreureContext(text, index, longitud, ampleContext = 60) {
  const meitat = Math.floor(ampleContext / 2);
  // Limita el context a la mateixa línia per llegibilitat
  const iniciLinia = text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const fiLiniaPos = text.indexOf('\n', index + longitud);
  const fiLinia = fiLiniaPos === -1 ? text.length : fiLiniaPos;

  const inici = Math.max(iniciLinia, index - meitat);
  const fi = Math.min(fiLinia, index + longitud + meitat);
  const abans = text.slice(inici, index);
  const forma = text.slice(index, index + longitud);
  const despres = text.slice(index + longitud, fi);
  const pref = inici > iniciLinia ? '…' : '';
  const suf = fi < fiLinia ? '…' : '';
  return `${pref}${abans}**${forma}**${despres}${suf}`.replace(/\s+/g, ' ').trim();
}

export function classificarRegistre(nTu, nVosaltres) {
  if (nTu === 0 && nVosaltres === 0) return 'cap';
  if (nTu > 0 && nVosaltres > 0) return 'mixt';
  return nTu > 0 ? 'tu' : 'vosaltres';
}

function cercarLlista(text, regles) {
  const trobades = [];
  for (const regla of regles) {
    regla.re.lastIndex = 0;
    let m;
    while ((m = regla.re.exec(text)) !== null) {
      const forma = m[0];
      const idx = m.index;
      if (regla.filtre && !regla.filtre(forma, idx, text)) continue;
      trobades.push({
        forma,
        categoria: regla.categoria,
        index: idx,
        longitud: forma.length,
        context: extreureContext(text, idx, forma.length, 60),
      });
    }
  }
  // Elimina solapaments (prioritza la coincidència més llarga)
  trobades.sort((a, b) => a.index - b.index || b.longitud - a.longitud);
  const netes = [];
  let ultimFi = -1;
  for (const t of trobades) {
    if (t.index < ultimFi) continue;
    netes.push(t);
    ultimFi = t.index + t.longitud;
  }
  return netes;
}

export function analitzarRegistre(text, idioma = 'ca') {
  const conjunt = REGLES[idioma === 'es' ? 'es' : 'ca'];
  const tu = cercarLlista(text, conjunt.tu);
  const vosaltres = cercarLlista(text, conjunt.vosaltres);
  const registre = classificarRegistre(tu.length, vosaltres.length);
  return { tu, vosaltres, registre };
}

function llistarHtml(dir) {
  const out = [];
  (function recorre(rel = '') {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      if (!rel && e.name === '_previsualitzacio') continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) recorre(r);
      else if (e.name.endsWith('.html')) out.push(r);
    }
  })();
  return out.sort();
}

const rutaDe = rel => '/' + (rel === 'index.html' ? '' : rel.replace(/\/index\.html$/, '/'));
const escMd = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

/** Analitza les cadenes d'interfície comunes (menú, peu de contingut/lloc.json i claus de plantilles/textos.mjs). */
export function analitzarInterficieComuna() {
  const lloc = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
  const candidats = [];

  for (const lang of ['ca', 'es']) {
    const menu = lloc.menu?.[lang];
    if (menu) {
      for (const e of menu.enllacos || []) candidats.push({ font: `lloc.json · menu.${lang}`, idioma: lang, text: e.text });
      if (menu.crida?.text) candidats.push({ font: `lloc.json · menu.${lang}.crida`, idioma: lang, text: menu.crida.text });
      if (menu.whatsappEtiqueta) candidats.push({ font: `lloc.json · menu.${lang}.whatsappEtiqueta`, idioma: lang, text: menu.whatsappEtiqueta });
    }
    const peu = lloc.peu?.[lang];
    if (peu) {
      if (peu.descripcio) candidats.push({ font: `lloc.json · peu.${lang}.descripcio`, idioma: lang, text: peu.descripcio });
      if (peu.boto?.text) candidats.push({ font: `lloc.json · peu.${lang}.boto`, idioma: lang, text: peu.boto.text });
      for (const col of peu.columnes || []) {
        if (col.titol) candidats.push({ font: `lloc.json · peu.${lang}.col`, idioma: lang, text: col.titol });
        for (const el of col.elements || []) candidats.push({ font: `lloc.json · peu.${lang}.enllac`, idioma: lang, text: el.text });
      }
    }
    const dic = TEXTOS[lang] || {};
    for (const [clau, val] of Object.entries(dic)) {
      const textNet = extreureTextVisible(String(val));
      candidats.push({ font: `textos.mjs · ${clau}`, idioma: lang, text: textNet });
    }
  }

  const trobades = [];
  for (const c of candidats) {
    const res = analitzarRegistre(c.text, c.idioma);
    if (res.registre === 'cap') continue;
    const formes = [
      ...res.tu.map(x => `tu: «${x.forma}»`),
      ...res.vosaltres.map(x => `vosaltres: «${x.forma}»`),
    ];
    trobades.push({ ...c, registre: res.registre, formes });
  }
  return trobades;
}

function comptarRegistres(llista) {
  const c = { total: llista.length, tu: 0, vosaltres: 0, mixt: 0, cap: 0 };
  for (const p of llista) c[p.registre]++;
  return c;
}

export function generarInforme({ ambEsborranys = true, fitxerSortida = SORTIDA } = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'registre-web-'));
  try {
    const argsConstruir = [path.join(ARREL, 'eines/construir.mjs'), '--sortida', tmpDir];
    if (ambEsborranys) argsConstruir.push('--esborranys');
    execFileSync(process.execPath, argsConstruir, { cwd: ARREL, stdio: 'pipe' });

    const fitxers = llistarHtml(tmpDir);
    const pagines = [];
    for (const rel of fitxers) {
      const html = fs.readFileSync(path.join(tmpDir, rel), 'utf8');
      const idioma = detectarIdioma(html, rel);
      const esborrany = esPaginaEsborrany(html, rel);
      const text = extreureTextVisible(html);
      const res = analitzarRegistre(text, idioma);
      pagines.push({
        rel,
        ruta: rutaDe(rel),
        idioma,
        esborrany,
        nTu: res.tu.length,
        nVosaltres: res.vosaltres.length,
        registre: res.registre,
        tu: res.tu,
        vosaltres: res.vosaltres,
      });
    }

    const totes = comptarRegistres(pagines);
    const pubCa = comptarRegistres(pagines.filter(p => !p.esborrany && p.idioma === 'ca'));
    const pubEs = comptarRegistres(pagines.filter(p => !p.esborrany && p.idioma === 'es'));
    const esbCa = comptarRegistres(pagines.filter(p => p.esborrany && p.idioma === 'ca'));
    const esbEs = comptarRegistres(pagines.filter(p => p.esborrany && p.idioma === 'es'));
    const interficie = analitzarInterficieComuna();

    const linies = [
      '# Informe de registre lingüístic («tu» / «vosaltres»)',
      '',
      `- **Mode:** ${ambEsborranys ? 'web completa amb esborranys' : 'només pàgines publicades (`--sense-esborranys`)'}`,
      `- **Pàgines analitzades:** ${pagines.length}`,
      '- **Nota:** informe de només lectura generat automàticament sobre el text visible de l\'HTML (incloent `aria-label`, `alt`, `placeholder` i `title`). No modifica cap fitxer del repositori.',
      '',
      '## Resum',
      '',
      '| Àmbit | Total | Tu | Vosaltres | Mixt | Cap |',
      '|---|---:|---:|---:|---:|---:|',
      `| **Totes les pàgines** | ${totes.total} | ${totes.tu} | ${totes.vosaltres} | ${totes.mixt} | ${totes.cap} |`,
      `| Publicades (ca) | ${pubCa.total} | ${pubCa.tu} | ${pubCa.vosaltres} | ${pubCa.mixt} | ${pubCa.cap} |`,
      `| Publicades (es) | ${pubEs.total} | ${pubEs.tu} | ${pubEs.vosaltres} | ${pubEs.mixt} | ${pubEs.cap} |`,
    ];
    if (ambEsborranys) {
      linies.push(`| Esborranys (ca) | ${esbCa.total} | ${esbCa.tu} | ${esbCa.vosaltres} | ${esbCa.mixt} | ${esbCa.cap} |`);
      linies.push(`| Esborranys (es) | ${esbEs.total} | ${esbEs.tu} | ${esbEs.vosaltres} | ${esbEs.mixt} | ${esbEs.cap} |`);
    }

    linies.push('', '## Frases d\'interfície comunes (menú, peu i `plantilles/textos.mjs`)', '');
    if (interficie.length) {
      linies.push('| Font | Idioma | Registre | Formes detectades | Text |');
      linies.push('|---|---|---|---|---|');
      for (const item of interficie) {
        linies.push(`| \`${escMd(item.font)}\` | ${item.idioma} | ${item.registre} | ${escMd(item.formes.join(', '))} | ${escMd(item.text)} |`);
      }
    } else {
      linies.push('Cap frase d\'interfície comuna amb marques de registre.');
    }

    linies.push('', '## Inventari per pàgina', '');
    linies.push('| Idioma | Ruta | Esborrany | Tu | Vosaltres | Registre dominant |');
    linies.push('|---|---|---|---:|---:|---|');
    for (const p of pagines) {
      linies.push(`| ${p.idioma} | \`${p.ruta}\` | ${p.esborrany ? 'sí' : 'no'} | ${p.nTu} | ${p.nVosaltres} | **${p.registre}** |`);
    }

    const mixtes = pagines.filter(p => p.registre === 'mixt');
    linies.push('', `## Pàgines mixtes (${mixtes.length})`, '');
    if (!mixtes.length) {
      linies.push('Cap pàgina mixta detectada.');
    } else {
      for (const p of mixtes) {
        linies.push(`### \`${p.ruta}\` (${p.idioma}${p.esborrany ? ', esborrany' : ''} · tu: ${p.nTu}, vosaltres: ${p.nVosaltres})`, '');
        const totesOcurr = [
          ...p.tu.map(o => ({ ...o, tipus: p.idioma === 'es' ? 'tú' : 'tu' })),
          ...p.vosaltres.map(o => ({ ...o, tipus: p.idioma === 'es' ? 'vosotros' : 'vosaltres' })),
        ].sort((a, b) => a.index - b.index);
        for (const o of totesOcurr) {
          linies.push(`- **[${o.tipus}]** \`${o.forma}\` (${o.categoria}): ${o.context}`);
        }
        linies.push('');
      }
    }

    fs.mkdirSync(path.dirname(fitxerSortida), { recursive: true });
    fs.writeFileSync(fitxerSortida, linies.join('\n') + '\n', 'utf8');
    return { pagines, totes, interficie, fitxerSortida };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const esPrincipal = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const senseEsborranys = process.argv.includes('--sense-esborranys');
  const { totes, fitxerSortida } = generarInforme({ ambEsborranys: !senseEsborranys });
  console.log(`informe de registre: ${path.relative(ARREL, fitxerSortida)}`);
  console.log(`pàgines: ${totes.total} · tu: ${totes.tu} · vosaltres: ${totes.vosaltres} · mixt: ${totes.mixt} · cap: ${totes.cap}`);
}
