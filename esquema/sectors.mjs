// Esquema i validació de les pàgines de sector (WEB-G01): contingut/sectors/<slug>.json.
// Cada fitxer defineix una pàgina /sectors/<slug>/ (esborrany o publicada).
import { validarCamp, SERVEIS_NOTICIA, CTA_DESTI_NOTICIA } from './blocs.mjs';

const text = (etiqueta, max, extra = {}) => ({ tipus: 'text', etiqueta, max, obligatori: true, ...extra });

export const SECTORS = ['salut', 'educacio', 'comerc', 'serveis', 'hostaleria', 'social'];
export const PATRO_SLUG_SECTOR = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const CAMPS_SECTOR = {
  slug: text('Slug (adreça)', 80, { ajuda: 'Igual que el nom del fitxer, en minúscules, sense accents i amb guions: /sectors/<slug>/' }),
  idioma: { tipus: 'seleccio', etiqueta: 'Idioma', opcions: ['ca'], obligatori: true, ajuda: 'De moment, només català' },
  estat: { tipus: 'seleccio', etiqueta: 'Estat', opcions: ['esborrany', 'publicat'], obligatori: true,
    ajuda: 'esborrany: només surt a les vistes prèvies · publicat: surt a la web i al mapa del lloc' },
  sector: { tipus: 'seleccio', etiqueta: 'Sector', opcions: SECTORS, obligatori: true },
  titol_seo: text('Títol per a Google', 60, { ajuda: 'Màxim 60 caràcters' }),
  descripcio: text('Descripció per a Google', 155, { ajuda: 'Màxim 155 caràcters' }),
  h1: text('Titular (H1)', 90),
  entradeta: text('Entradeta', 300, { ajuda: 'Text introductori sota el titular' }),
  capsula: text('Paràgraf càpsula', 420, { ajuda: 'Resposta directa de 40-60 paraules; es pinta com a paràgraf destacat' }),
  seccions: {
    tipus: 'llista', etiqueta: 'Seccions', min: 2, max: 8,
    element: {
      titol: text('Títol de la secció (pregunta)', 90, { ajuda: 'En forma de pregunta (acabat en ?)' }),
      cos: { tipus: 'markdown', etiqueta: 'Text', max: 2500, obligatori: true,
        ajuda: 'Markdown: paràgrafs, llistes amb «- » o «1. », > destacat, taules, **negreta**, [enllaç](/ruta)' },
    },
  },
  documents: {
    tipus: 'llista', etiqueta: 'Documents habituals', max: 10,
    element: text('Document', 120),
    ajuda: 'Documents que normalment necessita el sector (de 0 a 10)',
  },
  faq: {
    tipus: 'llista', etiqueta: 'Preguntes freqüents', max: 6,
    element: {
      pregunta: text('Pregunta', 150),
      resposta: { tipus: 'enriquit', etiqueta: 'Resposta', max: 600, obligatori: true, ajuda: '*cursiva*, **negreta**, salt de línia i [enllaç](/ruta)' },
    },
  },
  servei_relacionat: { tipus: 'seleccio', etiqueta: 'Servei relacionat', opcions: SERVEIS_NOTICIA,
    ajuda: 'Enllaç «Et pot interessar» (obligatori si cta_desti és servei)' },
  cta_desti: { tipus: 'seleccio', etiqueta: 'Crida a l\'acció (destí)', opcions: CTA_DESTI_NOTICIA, obligatori: true,
    ajuda: 'diagnostic (/diagnostic), contacte (/#contacte) o servei (el servei relacionat)' },
  cta_text: { tipus: 'text', etiqueta: 'Text del botó de crida', max: 80,
    ajuda: 'Opcional: si és buit, es fa servir el text per defecte del destí' },
  data_revisio: { tipus: 'data', etiqueta: 'Data de revisió jurídica',
    ajuda: 'Opcional: mostra la barra de revisió sota el titular' },
  revisat_per: { tipus: 'text', etiqueta: 'Revisat per', max: 120,
    ajuda: 'Opcional: per defecte «Revisat per un consultor RGPD i DPO extern de madeinhuman»' },
  fonts: {
    tipus: 'llista', etiqueta: 'Fonts oficials', max: 8,
    element: {
      nom: text('Nom de la font', 120),
      url: { tipus: 'enllac', etiqueta: 'Adreça (https://)', obligatori: true },
    },
  },
};

export function validarSector(s, fitxer = '') {
  const errors = [];
  if (!s || typeof s !== 'object' || Array.isArray(s)) return ['ha de ser un objecte JSON'];
  if (fitxer && !/^[a-z0-9]+(-[a-z0-9]+)*\.json$/.test(fitxer)) {
    errors.push('el nom del fitxer ha de ser <slug>.json (minúscules, sense accents i amb guions)');
  }
  Object.entries(CAMPS_SECTOR).forEach(([k, d]) => validarCamp(d, s[k], k, errors));
  for (const k of Object.keys(s)) if (!CAMPS_SECTOR[k]) errors.push(`camp no previst «${k}»`);

  if (typeof s.slug === 'string' && s.slug) {
    if (!PATRO_SLUG_SECTOR.test(s.slug)) errors.push('slug: només minúscules, números i guions');
    if (fitxer && s.slug !== fitxer.replace(/\.json$/, '')) {
      errors.push(`slug: «${s.slug}» ha de coincidir amb el nom del fitxer «${fitxer.replace(/\.json$/, '')}»`);
    }
  }
  if (Array.isArray(s.seccions)) {
    s.seccions.forEach((sec, i) => {
      if (typeof sec?.titol === 'string' && sec.titol.trim() && !sec.titol.trim().endsWith('?')) {
        errors.push(`seccions[${i}].titol: ha d'anar en forma de pregunta (acabat en ?)`);
      }
    });
  }
  if (Array.isArray(s.fonts)) {
    s.fonts.forEach((f, i) => {
      if (typeof f?.url === 'string' && f.url && !/^https:\/\/[^\s]+$/.test(f.url)) {
        errors.push(`fonts[${i}].url: ha de començar per https:// (${f.url})`);
      }
    });
  }
  if (s.cta_desti === 'servei' && !s.servei_relacionat) {
    errors.push('cta_desti: amb «servei» cal indicar servei_relacionat');
  }
  if (s.estat === 'publicat' && /\[REVISAR/.test(JSON.stringify(s))) {
    errors.push('té marques [REVISAR]: no es pot publicar fins que es resolguin');
  }
  return errors;
}
