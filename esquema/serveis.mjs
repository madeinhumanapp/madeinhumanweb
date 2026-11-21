// Esquema de contingut/serveis.json: pàgines de servei (català i castellà) i portada en castellà (C-10).
// Són pàgines d'estructura fixa: el panell en fa un formulari a mida, no un editor de blocs.
// Les URL dels serveis no es poden canviar des del contingut (enllaços externs, Google, correus).
import { validarCamp } from './blocs.mjs';

const text = (etiqueta, max, extra = {}) => ({ tipus: 'text', etiqueta, max, obligatori: true, ...extra });

export const SERVEIS = ['adequacio', 'dpo', 'auditoria', 'ia', 'web'];
export const SLUGS_ESTABLES = {
  ca: { adequacio: 'adequacio-rgpd-girona', dpo: 'dpo-extern', auditoria: 'auditoria-proteccio-dades', ia: 'reglament-ia-empreses', web: 'textos-legals-web' },
  es: { adequacio: 'adecuacion-rgpd-girona', dpo: 'dpo-externo', auditoria: 'auditoria-proteccion-datos', ia: 'reglamento-ia-empresas', web: 'textos-legales-web' },
};

export const CAMPS_SERVEI = {
  curt: text('Nom curt', 40, { ajuda: 'Surt al menú, a les molles i al peu' }),
  titol_seo: text('Títol per a Google', 90, { ajuda: 'Millor fins a 65 caràcters' }),
  descripcio: text('Descripció per a Google', 200, { ajuda: 'Millor fins a 160 caràcters' }),
  eyebrow: text('Etiqueta sobre el títol', 50),
  h1: { tipus: 'enriquit', etiqueta: 'Titular', max: 80, obligatori: true, ajuda: '*cursiva* i salt de línia' },
  lede: text('Entradeta', 260),
  seccions: {
    tipus: 'llista', etiqueta: 'Seccions', min: 1, max: 6,
    element: {
      titol: text('Títol de la secció', 60),
      cos: { tipus: 'markdown', etiqueta: 'Text', max: 1500, obligatori: true, ajuda: 'Markdown: paràgrafs, llistes amb «- », **negreta**, [enllaç](/ruta)' },
    },
  },
};

export const CAMPS_PORTADA_ES = {
  titol_seo: text('Títol per a Google', 90),
  descripcio: text('Descripció per a Google', 200),
  eyebrow: text('Etiqueta sobre el títol', 50),
  h1: { tipus: 'enriquit', etiqueta: 'Titular', max: 40, obligatori: true },
  lede: text('Entradeta', 260),
  serveis_titol: text('Títol de la llista de serveis', 30),
  contacte_titol: text('Títol del contacte', 30),
  contacte_text: text('Text del contacte', 160),
};

// Textos comuns de les pàgines interiors. El menú i el peu són els de tota la web (contingut/lloc.json, WEB-H07).
export const CAMPS_COMU = {
  inici: text('Molles: inici', 20),
  serveis: text('Molles: serveis', 20),
  metode_titol: text('Títol del mètode', 40),
  metode: { tipus: 'llista', etiqueta: 'Passos del mètode', min: 4, max: 4,
    element: { titol: text('Pas', 30), text: text('Explicació', 140) } },
  cta_titol: text('Crida final: títol', 60),
  cta_text: text('Crida final: text', 260),
  zona_titol: text('Zona: títol', 40),
  zona_text: text('Zona: text', 200, { ajuda: '{zona} es canvia per la llista de comarques' }),
  altres: text('Títol «altres serveis»', 30),
};
const UNA_PARELLA = ['cta_1', 'cta_2'];
const URL_SEGURA = /^(\/|#|https:\/\/|mailto:|tel:)/;

export function validarServeis(d) {
  const errors = [];
  for (const k of ['COMU', 'ZONA', 'SERVEIS', 'SLUG', 'PAGINES', 'PORTADA_ES']) if (!d?.[k]) errors.push(`falta «${k}»`);
  if (errors.length) return errors;
  if (JSON.stringify(d.SERVEIS) !== JSON.stringify(SERVEIS)) errors.push(`SERVEIS: han de ser ${SERVEIS.join(', ')} (els serveis nous els afegeix Claude)`);
  if (JSON.stringify(d.SLUG) !== JSON.stringify(SLUGS_ESTABLES)) errors.push('SLUG: les URL dels serveis no es poden canviar des del contingut');
  if (!Array.isArray(d.ZONA) || d.ZONA.length < 2 || d.ZONA.some(z => typeof z !== 'string' || !z || /[<>]/.test(z))) errors.push('ZONA: llista de llocs (text, com a mínim 2)');
  for (const lang of ['ca', 'es']) {
    const c = d.COMU[lang];
    if (!c) { errors.push(`COMU.${lang}: falta`); continue; }
    Object.entries(CAMPS_COMU).forEach(([k, def]) => validarCamp(def, c[k], `COMU.${lang}.${k}`, errors));
    for (const k of UNA_PARELLA) {
      const [t, u] = Array.isArray(c[k]) ? c[k] : [];
      if (!t || /[<>]/.test(t) || !URL_SEGURA.test(u || '')) errors.push(`COMU.${lang}.${k}: ha de ser [text, enllaç] amb un enllaç vàlid`);
    }
    for (const clau of SERVEIS) {
      const p = d.PAGINES[clau]?.[lang];
      if (!p) { errors.push(`PAGINES.${clau}.${lang}: falta`); continue; }
      Object.entries(CAMPS_SERVEI).forEach(([k, def]) => validarCamp(def, p[k], `PAGINES.${clau}.${lang}.${k}`, errors));
      for (const k of Object.keys(p)) if (!CAMPS_SERVEI[k]) errors.push(`PAGINES.${clau}.${lang}: camp no previst «${k}»`);
    }
  }
  Object.entries(CAMPS_PORTADA_ES).forEach(([k, def]) => validarCamp(def, d.PORTADA_ES[k], `PORTADA_ES.${k}`, errors));
  return errors;
}
