// Esquema del contingut (prototip): quins blocs hi ha, quins camps tenen i amb quins límits.
// Serveix per a tres coses alhora: validar abans de publicar, generar els formularis del
// panell i explicar a Mistral (o a qualsevol) què pot escriure a cada camp.
import { urlSegura } from '../plantilles/text.mjs';

const text = (etiqueta, max, extra = {}) => ({ tipus: 'text', etiqueta, max, obligatori: true, ...extra });
const enriquit = (etiqueta, max, extra = {}) => ({ tipus: 'enriquit', etiqueta, max, obligatori: true, ajuda: '*cursiva*, **negreta**, salt de línia', ...extra });

// Id d'una entrada de contingut/media.json (WEB-M02): AAAA-MM-titol-curt-8hex, màxim 80 caràcters
export const PATRO_ID_MEDIA = /^\d{4}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*-[0-9a-f]{8}$/;

// Blocs de la portada que el panell no deixa amagar ni treure: la capçalera, els formularis (connectors amb
// rgpd-tool) i els que són destinació d'enllaços del menú. Els afegibles són els que el panell pot crear.
export const BLOCS_PROTEGITS = ['hero', 'formulari', 'serveis', 'metode', 'faq', 'actualitat'];
export const BLOCS_AFEGIBLES = ['spot', 'context', 'separador', 'imatge', 'galeria', 'video'];

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
          clau: text('Xifra o sigla', 12, { ajuda: 'Si és un nombre (p. ex. 30.931), es mostra comptant quan apareix' }),
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
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'No el canviïs: hi apunten enllaços interns de la web' },
      etiqueta: text('Etiqueta', 20),
      titol: enriquit('Titular', 50),
      entradeta: enriquit('Entradeta', 140),
      origen: { tipus: 'seleccio', etiqueta: "D'on surten les notícies", opcions: ['manual', 'actualitat'],
        ajuda: 'actualitat: les 3 últimes notícies publicades · manual (o buit): la llista de sota' },
      noticies: {
        tipus: 'llista', etiqueta: 'Notícies (manual)', max: 6,
        element: {
          variant: { tipus: 'seleccio', etiqueta: "Color de l'etiqueta", opcions: ['rgpd', 'ia', 'cat'], obligatori: true,
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
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'No el canviïs: hi apunten enllaços interns de la web' },
      etiqueta: text('Etiqueta', 10),
      titol: enriquit('Titular', 40),
      entradeta: enriquit('Entradeta', 160),
      pilars: {
        tipus: 'llista', etiqueta: 'Pilars', min: 1, max: 3,
        element: {
          variant: { tipus: 'seleccio', etiqueta: 'Color del pilar', opcions: ['estàndard', 'blau'], obligatori: true,
            ajuda: 'blau: pilar destacat' },
          retard: text('Retard (no editable)', 10, { bloquejat: true, ajuda: 'No es pot editar des del panell' }),
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
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'No el canviïs: hi apunten enllaços interns de la web' },
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
        ajuda: "Els camps del formulari no es poden editar des d'aquí." },
      titol: enriquit('Titular', 80),
      entradeta: enriquit('Entradeta', 400),
    },
  },
  faq: {
    nom: 'Preguntes freqüents',
    camps: {
      ancora: { tipus: 'text', etiqueta: 'Àncora', max: 30, bloquejat: true, ajuda: 'No el canviïs: hi apunten enllaços interns de la web' },
      etiqueta: text('Etiqueta', 20),
      titol: enriquit('Titular', 60),
      entradeta: enriquit('Entradeta', 200),
      pestanyes: {
        tipus: 'llista', etiqueta: 'Pestanyes', min: 2, max: 6, ajuda: 'La primera ha de ser «tots» (totes les preguntes)',
        element: { cat: text('Categoria', 20, { ajuda: 'Valors possibles: tots, rgpd, ia, practic, glossari…' }), text: text('Text de la pestanya', 20) },
      },
    },
  },
  separador: { nom: 'Línia separadora', camps: {} },
  // Mitjans (WEB-M02): el valor de «media» és l'id d'una entrada de contingut/media.json
  imatge: {
    nom: 'Imatge',
    camps: {
      media: { tipus: 'media', etiqueta: 'Imatge', filtre: 'imatge', obligatori: true, ajuda: 'De la biblioteca de mitjans' },
      alt: text('Text alternatiu', 200, { obligatori: false, ajuda: 'Opcional: substitueix el de la biblioteca' }),
      peu: enriquit('Peu de foto', 200, { obligatori: false }),
      mida: { tipus: 'seleccio', etiqueta: 'Mida', opcions: ['normal', 'ampla'], obligatori: true, ajuda: 'ampla: ocupa més amplada' },
    },
  },
  galeria: {
    nom: 'Galeria d’imatges',
    camps: {
      titol: enriquit('Títol', 80, { obligatori: false }),
      elements: {
        tipus: 'llista', etiqueta: 'Imatges', min: 2, max: 12,
        element: {
          media: { tipus: 'media', etiqueta: 'Imatge', filtre: 'imatge', obligatori: true },
          alt: text('Text alternatiu', 200, { obligatori: false, ajuda: 'Opcional: substitueix el de la biblioteca' }),
        },
      },
    },
  },
  video: {
    nom: 'Vídeo',
    camps: {
      media: { tipus: 'media', etiqueta: 'Vídeo', filtre: 'video', obligatori: true, ajuda: 'De la biblioteca de mitjans' },
      titol: text('Títol', 120, { ajuda: 'Nom accessible del vídeo' }),
      peu: enriquit('Peu', 200, { obligatori: false }),
    },
  },
  html: { nom: 'HTML (encara no editable)', bloquejat: true, camps: { html: { tipus: 'html', etiqueta: 'HTML', obligatori: true } } },
};

export function dataValida(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function validarCamp(def, valor, ruta, errors) {
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
    case 'markdown':
      if (typeof valor !== 'string') return errors.push(`${ruta}: ha de ser text`);
      if (def.max && valor.length > def.max) errors.push(`${ruta}: ${valor.length} caràcters (màxim ${def.max})`);
      if (/<[a-z/!]/i.test(valor.replace(/<!--[\s\S]*?-->/g, ''))) errors.push(`${ruta}: no s'hi pot posar HTML (fes servir Markdown)`);
      break;
    case 'grup':
      if (typeof valor !== 'object' || Array.isArray(valor)) return errors.push(`${ruta}: ha de ser un grup de camps`);
      Object.entries(def.camps).forEach(([k, d]) => validarCamp(d, valor[k], `${ruta}.${k}`, errors));
      for (const k of Object.keys(valor)) if (!def.camps[k]) errors.push(`${ruta}: camp no previst «${k}»`);
      break;
    case 'data':
      if (typeof valor !== 'string' || !dataValida(valor)) errors.push(`${ruta}: ha de ser una data AAAA-MM-DD (${valor})`);
      break;
    case 'media':
      if (typeof valor !== 'string' || valor.length > 80 || !PATRO_ID_MEDIA.test(valor))
        errors.push(`${ruta}: ha de ser un id de media, AAAA-MM-titol-curt-8hex (${valor})`);
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
  // «amagat» és comú a tots els blocs: el bloc es conserva però no es pinta (WEB-P03)
  if ('amagat' in bloc && typeof bloc.amagat !== 'boolean') errors.push(`${ruta}.amagat: ha de ser sí o no`);
  if (bloc.amagat && BLOCS_PROTEGITS.includes(bloc.tipus)) errors.push(`${ruta}: aquest bloc no es pot amagar`);
  for (const k of Object.keys(bloc)) if (k !== 'tipus' && k !== 'amagat' && !def.camps[k]) errors.push(`${ruta}: camp no previst «${k}»`);
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
      utm: { tipus: 'bool', etiqueta: 'Afegeix l\'origen de cada visita segons la xarxa', ajuda: 'Només per a enllaços de madeinhuman.cat' },
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

// contingut/media.json: la biblioteca d'imatges i vídeos (WEB-M02; contracte a
// rgpdtool/docs/panell-web/MEDIA.md). Els fitxers viuen a media/: imatge → media/<id>-<amplada>.<format>
// per a cada valor de «mides»; vídeo → media/<id>.mp4. La llista és la més nova primer.
export const CAMPS_MEDIA = {
  id: text('Id', 80, { ajuda: 'AAAA-MM-titol-curt-8hex; el posa el servidor i és únic' }),
  tipus: { tipus: 'seleccio', etiqueta: 'Tipus', opcions: ['imatge', 'video'], obligatori: true },
  format: { tipus: 'seleccio', etiqueta: 'Format', opcions: ['webp', 'jpg', 'mp4'], obligatori: true,
    ajuda: 'imatge: webp o jpg · vídeo: mp4' },
  mides: { tipus: 'llista', etiqueta: 'Mides (amplades en px)', max: 3,
    element: text('Amplada en px', 4, { ajuda: '480, 960 o 1600; si l’original és més estret que 480, una sola' }),
    ajuda: 'Només imatges: de petita a gran, subconjunt de 480, 960, 1600' },
  amplada: text('Amplada en px (de la mida més gran)', 5),
  alcada: text('Alçada en px', 5),
  alt: text('Text alternatiu (imatge) o descripció (vídeo)', 200),
  credit: text('Crèdit', 120, { obligatori: false }),
  poster: { tipus: 'media', etiqueta: 'Pòster (id d’una imatge)', filtre: 'imatge', obligatori: false, ajuda: 'Només vídeos' },
  data: { tipus: 'data', etiqueta: 'Data de pujada', obligatori: true },
};
const MIDEIX = [480, 960, 1600];
export function validarMedia(entrades) {
  if (!Array.isArray(entrades)) return ['ha de ser una llista d’entrades'];
  const errors = [];
  const perId = new Map();
  entrades.forEach((e, i) => {
    const r = `[${i}]`;
    if (!e || typeof e !== 'object' || Array.isArray(e)) return errors.push(`${r}: ha de ser un objecte`);
    Object.entries(CAMPS_MEDIA).forEach(([k, d]) => {
      if (['mides', 'amplada', 'alcada', 'poster'].includes(k)) return; // es comproven aquí sota, amb regles entre camps
      validarCamp(d, e[k], `${r}.${k}`, errors);
    });
    for (const k of Object.keys(e)) if (!CAMPS_MEDIA[k]) errors.push(`${r}: camp no previst «${k}»`);
    if (typeof e.id === 'string') {
      if (e.id.length > 80) errors.push(`${r}.id: ${e.id.length} caràcters (màxim 80)`);
      if (!PATRO_ID_MEDIA.test(e.id)) errors.push(`${r}.id: ha de ser AAAA-MM-titol-curt-8hex (${e.id})`);
      if (perId.has(e.id)) errors.push(`${r}.id: «${e.id}» repetit`);
      perId.set(e.id, e);
    }
    if (e.tipus === 'imatge' && e.format && !['webp', 'jpg'].includes(e.format))
      errors.push(`${r}.format: una imatge només pot ser webp o jpg (${e.format})`);
    if (e.tipus === 'video' && e.format && e.format !== 'mp4')
      errors.push(`${r}.format: un vídeo només pot ser mp4 (${e.format})`);
    for (const k of ['amplada', 'alcada'])
      if (e[k] !== undefined && (!Number.isInteger(e[k]) || e[k] <= 0)) errors.push(`${r}.${k}: ha de ser un enter positiu (${e[k]})`);
    if (e.tipus === 'imatge') {
      if (!Array.isArray(e.mides) || !e.mides.length) errors.push(`${r}.mides: obligatori en una imatge`);
      else {
        if (!e.mides.every(m => Number.isInteger(m) && m > 0)) errors.push(`${r}.mides: amplades senceres i positives`);
        if (JSON.stringify([...e.mides].sort((a, b) => a - b)) !== JSON.stringify(e.mides)) errors.push(`${r}.mides: de petita a gran`);
        if (e.mides.some(m => m >= 480) && !e.mides.every(m => MIDEIX.includes(m))) errors.push(`${r}.mides: subconjunt de 480, 960, 1600`);
        if (e.mides.length === 1 && e.mides[0] < 480 && e.mides[0] !== e.amplada) errors.push(`${r}.mides: una sola mida menor que 480 ha de ser l’amplada original`);
        if (Number.isInteger(e.amplada) && e.amplada > 0 && Math.max(...e.mides) !== e.amplada)
          errors.push(`${r}.amplada: ha de ser la de la mida més gran (${Math.max(...e.mides)})`);
      }
    } else if (e.mides !== undefined) errors.push(`${r}.mides: només les imatges tenen mides`);
    if (e.poster && e.tipus !== 'video') errors.push(`${r}.poster: només els vídeos tenen pòster`);
  });
  // El pòster pot apuntar a una entrada que va més avall a la llista
  entrades.forEach((e, i) => {
    if (!e?.poster) return;
    const p = perId.get(e.poster);
    if (!p) errors.push(`[${i}].poster: no hi ha cap entrada amb l’id «${e.poster}»`);
    else if (p.tipus !== 'imatge') errors.push(`[${i}].poster: «${e.poster}» no és una imatge`);
  });
  return errors;
}

// Comprova que cada camp «media» dels blocs apunti a una entrada existent i del tipus del filtre
export function usosDeMedia(pagines, entrades) {
  const perId = new Map((entrades || []).map(e => [e?.id, e]));
  const errors = [];
  const revisa = (def, valor, ruta) => {
    if (!def || valor == null || valor === '') return;
    if (def.tipus === 'media') {
      const e = perId.get(valor);
      if (!e) errors.push(`${ruta}: no hi ha cap entrada de media amb l’id «${valor}»`);
      else if (e.tipus !== def.filtre) errors.push(`${ruta}: «${valor}» és de tipus «${e.tipus}», no «${def.filtre}»`);
      return;
    }
    if (def.tipus === 'llista' && Array.isArray(valor)) {
      valor.forEach((v, i) => {
        const el = def.element;
        if (el && typeof el.tipus === 'string') revisa(el, v, `${ruta}[${i}]`);
        else if (el) Object.entries(el).forEach(([k, d]) => revisa(d, v?.[k], `${ruta}[${i}].${k}`));
      });
      return;
    }
    if (def.camps && valor && typeof valor === 'object' && !Array.isArray(valor))
      Object.entries(def.camps).forEach(([k, d]) => revisa(d, valor[k], `${ruta}.${k}`));
  };
  (pagines || []).forEach((p, i) => (p?.blocs || []).forEach((b, j) => {
    const def = ESQUEMA[b?.tipus];
    if (def) Object.entries(def.camps).forEach(([k, d]) => revisa(d, b[k], `pagines[${i}].blocs[${j}] (${b.tipus}).${k}`));
  }));
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
  font_url: { tipus: 'enllac', etiqueta: 'Enllaç a la font', ajuda: 'Obligatori si la notícia té pàgina pròpia' },
  data_font: { tipus: 'data', etiqueta: 'Data de la publicació original' },
  servei_relacionat: { tipus: 'seleccio', etiqueta: 'Servei relacionat', opcions: SERVEIS_NOTICIA,
    ajuda: 'Opcional: al final de la notícia s\'hi enllaçarà aquest servei' },
  estat: { tipus: 'seleccio', etiqueta: 'Estat', opcions: ['esborrany', 'publicat'], obligatori: true,
    ajuda: 'esborrany: no surt a la web · publicat: surt a partir de la seva data, un cop publiquis els canvis' },
  idioma: { tipus: 'seleccio', etiqueta: 'Idioma', opcions: ['ca'], obligatori: true, ajuda: 'De moment, només català' },
  data_text: { tipus: 'text', etiqueta: 'Data visible (només notícies antigues)', max: 20, bloquejat: true },
  font_text: { tipus: 'text', etiqueta: 'Línia de font (només notícies antigues)', max: 60, bloquejat: true },
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

// contingut/lloc.json: dades que surten a totes les pàgines (WEB-P06). Des del panell només s'editen el contacte i
// els textos del menú i del peu; els enllaços del menú i del peu, l'SEO comú i les icones són estructura.
const enllacText = (etiqueta, max) => ({ tipus: 'grup', etiqueta, obligatori: true, camps: { text: text('Text', max), href: { tipus: 'enllac', etiqueta: 'Enllaç', obligatori: true } } });
export const CAMPS_CONTACTE = {
  correu: text('Correu electrònic', 80),
  telefon: text('Telèfon (format internacional)', 16, { ajuda: 'Amb prefix i sense espais: +34600000000. El fan servir els enllaços de trucada i de WhatsApp' }),
  telefonVisible: text('Telèfon tal com es mostra', 20, { ajuda: 'P. ex.: 600 00 00 00' }),
  carrer: text('Adreça', 80),
  cp: text('Codi postal', 5),
  ciutat: text('Població', 40),
};
export const CAMPS_MENU = {
  crida: enllacText('Botó del menú', 30),
  whatsappEtiqueta: text('Text del botó de WhatsApp per a lectors de pantalla', 60, { ajuda: 'El llegeixen els lectors de pantalla' }),
};
export const CAMPS_PEU = {
  descripcio: text('Descripció', 200),
  boto: enllacText('Botó del peu', 40),
  copyright: text('Drets', 80),
  estat: text('Text de la línia inferior', 60),
};
export function validarLloc(l) {
  const errors = [];
  Object.entries(CAMPS_CONTACTE).forEach(([k, d]) => validarCamp(d, l?.contacte?.[k], `contacte.${k}`, errors));
  const k = l?.contacte || {};
  if (k.correu && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(k.correu)) errors.push('contacte.correu: no és una adreça de correu');
  if (k.telefon && !/^\+\d{8,15}$/.test(k.telefon)) errors.push('contacte.telefon: ha de ser +34600000000 (prefix i xifres, sense espais)');
  if (k.cp && !/^\d{5}$/.test(k.cp)) errors.push('contacte.cp: han de ser 5 xifres');
  for (const idioma of ['ca', 'es']) {
    Object.entries(CAMPS_MENU).forEach(([c, d]) => validarCamp(d, l?.menu?.[idioma]?.[c], `menu.${idioma}.${c}`, errors));
    Object.entries(CAMPS_PEU).forEach(([c, d]) => validarCamp(d, l?.peu?.[idioma]?.[c], `peu.${idioma}.${c}`, errors));
  }
  return errors;
}
