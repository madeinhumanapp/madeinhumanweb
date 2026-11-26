// =============================================================================
// «Necesito un DPO?» · Contenido jurídico y textos (FUENTE DE VERDAD)
//
// ⚠️ AGENT: NO MODIFIQUES ESTE ARCHIVO. Contiene el contenido normativo y todos
// los textos que ve el usuario. Si crees que falta o sobra algo, apúntalo en
// NOTES-AGENT.md y continúa. La lógica (src/avaluar.js) y la interfaz
// (src/app.js) deben leerlo todo de aquí.
//
// Revisión jurídica: hecha (Albert, 18/11/2026). Fuentes:
//   · RGPD (Reglamento (UE) 2016/679), arts. 37, 38 y 39.
//   · LOPDGDD (Ley orgánica 3/2018), art. 34.
//   · Directrices del GT29 sobre los DPD (WP 243 rev.01), para «actividad
//     principal» y «gran escala» (no fijan cifras: por eso está «No lo sé»).
// Registro: tú (guía de marca). Respuestas posibles: 'si' | 'no' | 'nsnc' (no lo sé).
// =============================================================================

export const VERSIO = '2026-11-18'

/** Preguntas, en el orden en que se hacen. `nomesSi` indica cuándo hay que hacerla. */
export const PREGUNTES = [
  {
    id: 'public',
    text: '¿Tu organización es una autoridad o un organismo público?',
    ajuda: 'Por ejemplo, un ayuntamiento, un consejo comarcal, una universidad pública o un ente que dependa de la Administración. Una empresa privada que trabaje para la Administración no lo es.',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'sector',
    text: '¿Tu actividad es alguna de estas?',
    ajuda: 'La ley española obliga a tener un DPO en estos sectores. Si no es ninguna, elige «Ninguna de estas».',
    tipus: 'llista', // una sola opción de entre SECTORS, más 'cap'
  },
  {
    id: 'sectorCondicio',
    // El texto concreto sale de SECTORS[i].condicio.text
    nomesSi: { pregunta: 'sector', teCondicio: true },
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'seguiment',
    text: '¿Tu actividad principal consiste en hacer un seguimiento regular y sistemático de personas?',
    ajuda: 'Por ejemplo: geolocalizar clientes o vehículos, elaborar perfiles de comportamiento para publicidad, programas de fidelización que analizan hábitos, videovigilancia de espacios abiertos al público como servicio. «Actividad principal» significa la que hace el negocio, no tareas de apoyo como la nómina.',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'sensibles',
    text: '¿Tu actividad principal consiste en tratar datos sensibles o penales?',
    ajuda: 'Datos sensibles: salud, genéticos, biométricos para identificar personas, origen étnico, opiniones políticas, religión, afiliación sindical, vida u orientación sexual. Penales: condenas e infracciones. Tener datos de salud del equipo para la nómina no cuenta: debe ser el núcleo del negocio (una clínica, un laboratorio…).',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'granEscala',
    text: '¿Este tratamiento se hace a gran escala?',
    ajuda: 'No hay una cifra legal. Se valora el número de personas afectadas, el volumen de datos, cuánto tiempo se conservan y el alcance geográfico. Un hospital o una red de clínicas, sí; un médico que trabaja solo, en principio no.',
    nomesSi: { algunaDe: ['seguiment', 'sensibles'], valors: ['si', 'nsnc'] },
    opcions: ['si', 'no', 'nsnc'],
  },
]

export const ETIQUETES_OPCIO = { si: 'Sí', no: 'No', nsnc: 'No lo sé' }

/**
 * Sectores del art. 34.1 LOPDGDD. Los que tienen `condicio` solo obligan si
 * se cumple (pregunta de seguimiento 'sectorCondicio').
 */
export const SECTORS = [
  { id: 'a', text: 'Colegio profesional o consejo general de colegios', article: 'LOPDGDD, art. 34.1.a' },
  { id: 'b', text: 'Centro docente (cualquier nivel educativo reglado) o universidad', article: 'LOPDGDD, art. 34.1.b' },
  { id: 'c', text: 'Operador de redes o servicios de comunicaciones electrónicas', article: 'LOPDGDD, art. 34.1.c',
    condicio: { text: '¿Tratas datos personales de forma habitual y sistemática a gran escala?' } },
  { id: 'd', text: 'Prestador de servicios de la sociedad de la información (plataformas, apps, comercio en línea…)', article: 'LOPDGDD, art. 34.1.d',
    condicio: { text: '¿Elaboras perfiles de los usuarios del servicio a gran escala?' } },
  { id: 'e', text: 'Entidad de crédito', article: 'LOPDGDD, art. 34.1.e' },
  { id: 'f', text: 'Entidad aseguradora o reaseguradora', article: 'LOPDGDD, art. 34.1.f' },
  { id: 'g', text: 'Empresa de servicios de inversión', article: 'LOPDGDD, art. 34.1.g' },
  { id: 'h', text: 'Distribuidora o comercializadora de electricidad o gas natural', article: 'LOPDGDD, art. 34.1.h' },
  { id: 'i', text: 'Responsable de ficheros comunes de solvencia o de prevención del fraude', article: 'LOPDGDD, art. 34.1.i' },
  { id: 'j', text: 'Publicidad, prospección comercial o investigación de mercados', article: 'LOPDGDD, art. 34.1.j',
    condicio: { text: '¿Haces tratamientos basados en las preferencias de las personas o elaboras perfiles?' } },
  { id: 'k', text: 'Centro sanitario obligado a conservar historias clínicas', article: 'LOPDGDD, art. 34.1.k',
    condicio: { text: '¿Es un centro sanitario, y no un profesional de la salud que ejerce a título individual?' } },
  { id: 'l', text: 'Emisión de informes comerciales sobre personas físicas', article: 'LOPDGDD, art. 34.1.l' },
  { id: 'm', text: 'Operador de juego por canales electrónicos, informáticos o telemáticos', article: 'LOPDGDD, art. 34.1.m' },
  { id: 'n', text: 'Empresa de seguridad privada', article: 'LOPDGDD, art. 34.1.n' },
  { id: 'ñ', text: 'Federación deportiva', article: 'LOPDGDD, art. 34.1.ñ',
    condicio: { text: '¿Tratas datos de menores de edad?' } },
]
export const SECTOR_CAP = { id: 'cap', text: 'Ninguna de estas' }

/** Motivos que pueden aparecer en el resultado (los `id` los usa avaluar()). */
export const MOTIUS = {
  'art37-1-a': { text: 'Eres una autoridad o un organismo público.', article: 'RGPD, art. 37.1.a' },
  'lopdgdd-34-1': { text: 'Tu actividad es uno de los sectores en los que la ley española obliga a tener un DPO.', article: 'LOPDGDD, art. 34.1' }, // + el artículo del sector
  'art37-1-b': { text: 'Tu actividad principal implica un seguimiento regular y sistemático de personas a gran escala.', article: 'RGPD, art. 37.1.b' },
  'art37-1-c': { text: 'Tu actividad principal consiste en tratar datos sensibles o penales a gran escala.', article: 'RGPD, arts. 37.1.c, 9 i 10' },
}

/** Resultados posibles. */
export const VEREDICTES = {
  obligatori: {
    titol: 'Sí, debes designar *un DPO*.',
    text: 'Puede ser una persona del equipo o un servicio externo, pero debe tener conocimientos de protección de datos, independencia y acceso a la dirección.',
    passos: [
      'Designa al DPO y déjalo por escrito.',
      'Comunica la designación a la autoridad de control (la AEPD o, si procede, la APDCat) en un plazo de diez días (LOPDGDD, art. 34.3).',
      'Publica los datos de contacto del DPO, por ejemplo en la política de privacidad (RGPD, art. 37.7).',
    ],
  },
  'cal-revisar': {
    titol: 'Depende de alguna respuesta *que hay que precisar*.',
    text: 'Con lo que has respondido no se puede saber a ciencia cierta. Los puntos que hay que mirar con calma son estos:',
    passos: ['Revisa con alguien de confianza los puntos marcados, o háblalo con nosotros.'],
  },
  recomanable: {
    titol: 'No es obligatorio, pero *puedes planteártelo*.',
    text: 'Tratas datos o haces un seguimiento que merecen atención, aunque no a gran escala. Un DPO voluntario, o un asesoramiento periódico, te ayuda a tenerlo controlado. Si lo designas voluntariamente, también debes comunicarlo a la autoridad de control (LOPDGDD, art. 34.3).',
    passos: ['Revisa que tienes el registro de actividades y el análisis de riesgos al día.'],
  },
  'no-obligatori': {
    titol: 'No, en principio *no hace falta* un DPO.',
    text: 'Con tus respuestas, ningún supuesto del artículo 37 del RGPD ni del artículo 34 de la LOPDGDD te obliga. El RGPD, sin embargo, se debe cumplir igualmente.',
    passos: ['Haz el diagnóstico gratuito para saber dónde estás en el resto de obligaciones.'],
  },
}

/** Textos fijos de la página. */
export const TEXTOS = {
  titol: '¿Necesito un *DPO*?',
  entrada: 'Responde unas cuantas preguntas y te diremos si la normativa te obliga a tener un delegado de protección de datos (DPO), y por qué.',
  durada: '2 minutos · sin registro · no se envía ni se guarda nada',
  avis: 'Resultado orientativo, basado en el artículo 37 del RGPD y el artículo 34 de la LOPDGDD. No sustituye al análisis de tu caso concreto.',
  ctaPrincipal: { text: 'Haz el diagnóstico gratuito · 4 min (en catalán)', url: 'https://madeinhuman.cat/diagnostic.html?utm_source=eina-dpo&utm_medium=web&utm_campaign=necessito-dpo&utm_content=resultat' },
  ctaSecundari: { text: 'Háblalo con nosotros', url: 'https://madeinhuman.cat/es/?utm_source=eina-dpo&utm_medium=web&utm_campaign=necessito-dpo&utm_content=resultat#contacto' },
  tornar: 'Volver a empezar',
  enrere: 'Atrás',
  seguent: 'Continuar',
  comencar: 'Empezar',
}
