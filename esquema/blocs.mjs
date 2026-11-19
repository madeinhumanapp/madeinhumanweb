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
  separador: { nom: 'Línia separadora', camps: {} },
  html: { nom: 'HTML (pendent de migrar)', bloquejat: true, camps: { html: { tipus: 'html', etiqueta: 'HTML', obligatori: true } } },
};

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
  return errors;
}

export function validarPagina(p) {
  const errors = [];
  for (const k of ['pagina', 'idioma', 'ruta', 'fitxer']) if (!p[k]) errors.push(`falta «${k}»`);
  if (!p.cap?.titol) errors.push('falta el títol (cap.titol)');
  (p.blocs || []).forEach((b, i) => errors.push(...validarBloc(b, `blocs[${i}] (${b.tipus})`)));
  return errors;
}
