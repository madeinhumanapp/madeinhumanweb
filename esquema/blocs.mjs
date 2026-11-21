// Esquema del contingut (prototip): quins blocs hi ha, quins camps tenen i amb quins límits.
// Serveix per a tres coses alhora: validar abans de publicar, generar els formularis del
// panell i explicar a Mistral (o a qualsevol) què pot escriure a cada camp.
import { urlSegura } from '../plantilles/text.mjs';

const text = (etiqueta, max, extra = {}) => ({ tipus: 'text', etiqueta, max, obligatori: true, ...extra });
const enriquit = (etiqueta, max, extra = {}) => ({ tipus: 'enriquit', etiqueta, max, obligatori: true, ajuda: '*cursiva*, **negreta**, salt de línia', ...extra });

export const ESQUEMA = {
  hero: {
    nom: 'Capçalera de la portada',
    camps: {
      subtitol: text('Subtítol', 80),
      titol: enriquit('Titular', 80),
      text: enriquit('Descripció', 240),
      botons: {
        tipus: 'llista', etiqueta: 'Botons', min: 1, max: 2,
        element: {
          text: text('Text del botó', 40),
          href: { tipus: 'enllac', etiqueta: 'Enllaç', obligatori: true },
          estil: { tipus: 'seleccio', etiqueta: 'Estil', opcions: ['primari', 'secundari'], obligatori: true },
          fletxa: { tipus: 'bool', etiqueta: 'Amb fletxa' },
        },
      },
      etiquetes: { tipus: 'llista', etiqueta: 'Etiquetes', max: 4, element: enriquit('Etiqueta', 40) },
    },
  },
  spot: {
    nom: 'Frase destacada',
    camps: {
      num: text('Número', 3, { ajuda: '01, 02…' }),
      titol: enriquit('Titular', 80),
      text: enriquit('Text', 300),
      alternat: { tipus: 'bool', etiqueta: 'Fons alternat' },
    },
  },
  context: {
    nom: 'Context i xifres',
    camps: {
      etiqueta: text('Etiqueta', 30),
      titol: enriquit('Titular', 60),
      paragrafs: { tipus: 'llista', etiqueta: 'Paràgrafs', min: 1, max: 3, element: enriquit('Paràgraf', 350) },
      xifres: {
        tipus: 'llista', etiqueta: 'Xifres', min: 1, max: 4,
        element: {
          clau: text('Xifra o sigla', 12, { ajuda: 'Si és un nombre (30.931), s\'anima en aparèixer' }),
          etiqueta: text('Etiqueta', 60),
          text: enriquit('Explicació', 230),
          font: { tipus: 'text', etiqueta: 'Font', max: 80, ajuda: 'Opcional: d\'on surt la xifra' },
        },
      },
    },
  },
  actualitat: {
    nom: 'Actualitat (notícies)',
    camps: {
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'Enllaços com /#actualitat hi apunten' },
      etiqueta: text('Etiqueta', 20),
      titol: enriquit('Titular', 50),
      entradeta: enriquit('Entradeta', 140),
      origen: { tipus: 'seleccio', etiqueta: "D'on surten les notícies", opcions: ['manual', 'actualitat'],
        ajuda: 'actualitat: les 3 últimes publicades a contingut/actualitat/ · manual (o buit): la llista de sota' },
      noticies: {
        tipus: 'llista', etiqueta: 'Notícies (manual)', max: 6,
        element: {
          variant: { tipus: 'seleccio', etiqueta: 'Color del tag', opcions: ['rgpd', 'ia', 'cat'], obligatori: true,
            ajuda: 'rgpd: coure · ia: blau (targeta destacada) · cat: verd' },
          tag: text('Etiqueta del tag', 10),
          data: text('Data', 20),
          titol: enriquit('Títol', 130),
          cos: enriquit('Text', 440),
          font: { tipus: 'text', etiqueta: 'Font', max: 60, ajuda: "Opcional: d'on surt la notícia" },
        },
      },
    },
    comprova: b => (b.origen !== 'actualitat' && !b.noticies?.length ? ['noticies: com a mínim 1 (o origen «actualitat»)'] : []),
  },
  serveis: {
    nom: 'Serveis (pilars, transversal i enllaços)',
    camps: {
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'Enllaços com /#serveis hi apunten' },
      etiqueta: text('Etiqueta', 10),
      titol: enriquit('Titular', 40),
      entradeta: enriquit('Entradeta', 160),
      pilars: {
        tipus: 'llista', etiqueta: 'Pilars', min: 1, max: 3,
        element: {
          variant: { tipus: 'seleccio', etiqueta: 'Color del pilar', opcions: ['estàndard', 'blau'], obligatori: true,
            ajuda: 'blau: pilar destacat' },
          retard: text('Retard de la transició', 10, { bloquejat: true, ajuda: 'Tècnic: no s\'edita des del panell' }),
          num: text('Número', 20, { ajuda: 'Pilar 01, Pilar 02…' }),
          insigniaVariant: { tipus: 'seleccio', etiqueta: 'Color de la insignia', opcions: ['vigent', 'prep'], obligatori: true,
            ajuda: 'vigent: coure · prep: blau' },
          insignia: text('Text de la insignia', 30),
          subtitol: text('Subtítol', 50),
          titol: enriquit('Títol', 70),
          descripcio: enriquit('Descripció', 250),
          llista: { tipus: 'llista', etiqueta: 'Llista de serveis', min: 1, max: 10, element: enriquit('Servei', 60) },
          peu: enriquit('Nota del peu', 350, { ajuda: '**Per a qui:** … o **Nota:** …' }),
        },
      },
      transversalEtiqueta: text('Etiqueta del servei transversal', 30),
      transversalTitol: text('Títol del servei transversal', 30),
      transversalText: enriquit('Descripció del servei transversal', 210),
      enllacosTitol: text('Títol dels enllaços', 20),
      enllacos: {
        tipus: 'llista', etiqueta: 'Enllaços en detall', min: 1, max: 8,
        element: { text: text('Text de l’enllaç', 50), href: { tipus: 'enllac', etiqueta: 'Enllaç', obligatori: true } },
      },
    },
  },
  metode: {
    nom: 'Mètode (passos)',
    camps: {
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'Enllaços com /#metode hi apunten' },
      etiqueta: text('Etiqueta', 30),
      titol: enriquit('Titular', 80),
      entradeta: enriquit('Entradeta', 300),
      passos: { tipus: 'llista', etiqueta: 'Passos', min: 2, max: 6, element: { titol: text('Títol del pas', 40), text: enriquit('Descripció', 300) } },
    },
  },
  formulari: {
    nom: 'Formulari (protegit)',
    camps: {
      formulari: { tipus: 'seleccio', etiqueta: 'Formulari', opcions: ['contacte', 'adequacio'], obligatori: true, bloquejat: true,
        ajuda: 'Els camps del formulari no es poden editar: els rep rgpd-tool.' },
      titol: enriquit('Titular', 80),
      entradeta: enriquit('Entradeta', 400),
    },
  },
  faq: {
    nom: 'Preguntes freqüents',
    camps: {
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'Enllaços com /#faq hi apunten' },
      etiqueta: text('Etiqueta', 20),
      titol: enriquit('Titular', 60),
      entradeta: enriquit('Entradeta', 200),
      pestanyes: {
        tipus: 'llista', etiqueta: 'Pestanyes', min: 2, max: 6, ajuda: 'La primera ha de ser «tots» (totes les preguntes)',
        element: { cat: text('Categoria', 20, { ajuda: 'tots, rgpd, ia, practic, glossari…' }), text: text('Text de la pestanya', 20) },
      },
    },
  },
  separador: { nom: 'Línia separadora', camps: {} },
  html: { nom: 'HTML (pendent de migrar)', bloquejat: true, camps: { html: { tipus: 'html', etiqueta: 'HTML', obligatori: true } } },
};

export function dataValida(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function validarCamp(def, valor, ruta, errors) {
  const buit = valor == null || valor === '' || (Array.isArray(valor) && !valor.length);
  if (buit) { if (def.obligatori || def.min) errors.push(`${ruta}: obligatori`); return; }
  switch (def.tipus) {
    case 'text':
    case 'enriquit':
      if (typeof valor !== 'string') return errors.push(`${ruta}: ha de ser text`);
      if (def.max && valor.length > def.max) errors.push(`${ruta}: ${valor.length} caràcters (màxim ${def.max})`);
      if (/<[a-z/!]/i.test(valor)) errors.push(`${ruta}: no s'hi pot posar HTML (fes servir *cursiva* o **negreta**)`);
      if (def.tipus === 'text' && /\n/.test(valor)) errors.push(`${ruta}: ha de ser una sola línia`);
      break;
    case 'enllac':
      if (typeof valor !== 'string' || !urlSegura(valor)) errors.push(`${ruta}: enllaç no permès (${valor})`);
      break;
    case 'bool':
      if (typeof valor !== 'boolean') errors.push(`${ruta}: ha de ser sí o no`);
      break;
    case 'seleccio':
      if (!def.opcions.includes(valor)) errors.push(`${ruta}: «${valor}» no és cap de: ${def.opcions.join(', ')}`);
      break;
    case 'llista':
      if (!Array.isArray(valor)) return errors.push(`${ruta}: ha de ser una llista`);
      if (def.min && valor.length < def.min) errors.push(`${ruta}: com a mínim ${def.min}`);
      if (def.max && valor.length > def.max) errors.push(`${ruta}: com a màxim ${def.max}`);
      valor.forEach((v, i) => (typeof def.element.tipus === 'string'
        ? validarCamp(def.element, v, `${ruta}[${i}]`, errors)
        : Object.entries(def.element).forEach(([k, d]) => validarCamp(d, v?.[k], `${ruta}[${i}].${k}`, errors))));
      break;
    case 'data':
      if (typeof valor !== 'string' || !dataValida(valor)) errors.push(`${ruta}: ha de ser una data AAAA-MM-DD (${valor})`);
      break;
    case 'html':
      if (typeof valor !== 'string') errors.push(`${ruta}: ha de ser HTML`);
      break;
  }
}

export function validarBloc(bloc, ruta = 'bloc') {
  const def = ESQUEMA[bloc?.tipus];
  if (!def) return [`${ruta}: tipus de bloc desconegut «${bloc?.tipus}»`];
  const errors = [];
  for (const [k, d] of Object.entries(def.camps)) validarCamp(d, bloc[k], `${ruta}.${k}`, errors);
  for (const k of Object.keys(bloc)) if (k !== 'tipus' && !def.camps[k]) errors.push(`${ruta}: camp no previst «${k}»`);
  if (def.comprova) errors.push(...def.comprova(bloc).map(e => `${ruta}.${e}`));
  return errors;
}

export function validarPagina(p) {
  const errors = [];
  for (const k of ['pagina', 'idioma', 'ruta', 'fitxer']) if (!p[k]) errors.push(`falta «${k}»`);
  if (!p.cap?.titol) errors.push('falta el títol (cap.titol)');
  if (p.plantilla === 'legal') {
    for (const k of ['etiqueta', 'titol', 'entradeta', 'notaFinal', 'cos']) if (!p[k]) errors.push(`pàgina legal: falta «${k}»`);
    for (const k of ['descripcio', 'robots', 'canonica']) if (!p.cap?.[k]) errors.push(`pàgina legal: falta «cap.${k}»`);
    if (p.cos && !/^legal\/[a-z0-9-]+\.md$/.test(p.cos)) errors.push('pàgina legal: «cos» ha de ser legal/<nom>.md');
    return errors;
  }
  if (p.plantilla === 'xarxes') {
    if (!p.cap?.descripcio) errors.push('falta «cap.descripcio»');
    Object.entries(CAMPS_XARXES).forEach(([k, d]) => validarCamp(d, p[k], k, errors));
    return errors;
  }
  (p.blocs || []).forEach((b, i) => errors.push(...validarBloc(b, `blocs[${i}] (${b.tipus})`)));
  return errors;
}

// contingut/pagines/xarxes.json (pàgina d'enllaços dels perfils socials). El botó de WhatsApp pren el telèfon de lloc.json.
export const CAMPS_XARXES = {
  titol: enriquit('Titular', 70),
  subtitol: text('Subtítol', 140),
  botons: {
    tipus: 'llista', etiqueta: 'Botons', min: 1, max: 6,
    element: {
      text: text('Text del botó', 40),
      detall: text('Explicació', 80),
      href: { tipus: 'enllac', etiqueta: 'Enllaç', obligatori: true },
      principal: { tipus: 'bool', etiqueta: 'Botó destacat' },
      utm: { tipus: 'bool', etiqueta: 'Afegeix l\'origen (utm) segons la xarxa', ajuda: 'Només per a enllaços de madeinhuman.cat' },
    },
  },
  ambWhatsapp: { tipus: 'bool', etiqueta: 'Botó de WhatsApp al final (telèfon de les dades del lloc)' },
};

// contingut/faq.json: [{ cat, pregunta, resposta, destacada? }]. Les destacades van al JSON-LD (Google).
export const CAMPS_FAQ = {
  cat: text('Categoria', 20),
  pregunta: text('Pregunta', 150),
  resposta: enriquit('Resposta', 900),
  destacada: { tipus: 'bool', etiqueta: 'Destacada (també a Google)' },
};
export function validarFaq(faq) {
  if (!Array.isArray(faq) || !faq.length) return ['ha de ser una llista amb preguntes'];
  const errors = [];
  faq.forEach((f, i) => {
    Object.entries(CAMPS_FAQ).forEach(([k, d]) => validarCamp(d, f?.[k], `[${i}].${k}`, errors));
    for (const k of Object.keys(f || {})) if (!CAMPS_FAQ[k]) errors.push(`[${i}]: camp no previst «${k}»`);
  });
  return errors;
}

// contingut/actualitat/AAAA-MM-DD-titol-curt.md: capçalera «clau: valor» + cos en Markdown.
// Sense cos és una «breu» (només targeta); amb cos té pàgina pròpia a /actualitat/<titol-curt>/.
// El format és el dels esborranys de Mistral (rgpdtool, encàrrec WEB-A05).
export const ETIQUETES_NOTICIA = ['rgpd', 'ia', 'apdcat'];
export const SERVEIS_NOTICIA = ['adequacio', 'dpo', 'auditoria', 'ia', 'web'];
export const CAMPS_NOTICIA = {
  titol: text('Títol', 130, { ajuda: 'Millor fins a 70 caràcters (Google en talla la resta)' }),
  resum: text('Resum', 440, { ajuda: 'Surt a la targeta i a Google: 1 o 2 frases (millor fins a 160 caràcters)' }),
  data: { tipus: 'data', etiqueta: 'Data de publicació', obligatori: true, ajuda: 'No surt a la web abans d\'aquest dia' },
  etiqueta: { tipus: 'seleccio', etiqueta: 'Tema', opcions: ETIQUETES_NOTICIA, obligatori: true, ajuda: 'rgpd: coure · ia: blau · apdcat: verd' },
  font_nom: text('Font (organisme)', 80, { ajuda: 'AEPD, APDCat, Comissió Europea, DOUE…' }),
  font_url: { tipus: 'enllac', etiqueta: 'Enllaç a la font', ajuda: 'Obligatori si la notícia té cos (pàgina pròpia)' },
  data_font: { tipus: 'data', etiqueta: 'Data de la publicació original' },
  servei_relacionat: { tipus: 'seleccio', etiqueta: 'Servei relacionat', opcions: SERVEIS_NOTICIA },
  estat: { tipus: 'seleccio', etiqueta: 'Estat', opcions: ['esborrany', 'publicat'], obligatori: true },
  idioma: { tipus: 'seleccio', etiqueta: 'Idioma', opcions: ['ca'], obligatori: true, ajuda: 'De moment, només català' },
  data_text: { tipus: 'text', etiqueta: 'Data visible (només notícies migrades)', max: 20, bloquejat: true },
  font_text: { tipus: 'text', etiqueta: 'Línia de font (només notícies migrades)', max: 60, bloquejat: true },
};
export function validarNoticia(n) {
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/.test(n.fitxer || ''))
    errors.push('el nom del fitxer ha de ser AAAA-MM-DD-titol-curt.md (minúscules, sense accents)');
  Object.entries(CAMPS_NOTICIA).forEach(([k, d]) => validarCamp(d, n.cap?.[k], k, errors));
  for (const k of Object.keys(n.cap || {})) if (!CAMPS_NOTICIA[k]) errors.push(`camp no previst «${k}»`);
  const u = n.cap?.font_url;
  if (u && !/^https:\/\//.test(u)) errors.push('font_url: ha de començar per https://');
  if (n.cap?.estat === 'publicat' && n.cos.trim() && !u) errors.push('font_url: obligatori per publicar una notícia amb cos');
  if (/<[a-z/!]/i.test(n.cos.replace(/<!--[\s\S]*?-->/g, ''))) errors.push("cos: no s'hi pot posar HTML (fes servir Markdown)");
  if (n.cap?.estat === 'publicat' && /\[REVISAR/.test(JSON.stringify(n.cap) + n.cos))
    errors.push('té marques [REVISAR]: no es pot publicar fins que es resolguin');
  return errors;
}
