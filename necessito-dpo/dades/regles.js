// =============================================================================
// «Necessito DPO?» · Contingut jurídic i textos (FONT DE VERITAT)
//
// ⚠️ AGENT: NO MODIFIQUIS AQUEST FITXER. Conté el contingut normatiu i tots els
// textos que veu l'usuari. Si creus que hi falta o sobra alguna cosa, apunta-ho
// a NOTES-AGENT.md i continua. La lògica (src/avaluar.js) i la interfície
// (src/app.js) han de llegir-ho tot d'aquí.
//
// Revisió jurídica: feta (Albert, 18/11/2026). Fonts:
//   · RGPD (Reglament (UE) 2016/679), arts. 37, 38 i 39.
//   · LOPDGDD (Llei orgànica 3/2018), art. 34.
//   · Directrius del GT29 sobre els DPD (WP 243 rev.01), per a «activitat
//     principal» i «gran escala» (no fixen xifres: per això hi ha «No ho sé»).
// Registre: tu (guia de marca). Respostes possibles: 'si' | 'no' | 'nsnc' (no ho sé).
// =============================================================================

export const VERSIO = '2026-11-18'

/** Preguntes, en l'ordre en què es fan. `nomesSi` indica quan cal fer-la. */
export const PREGUNTES = [
  {
    id: 'public',
    text: 'La teva organització és una autoritat o un organisme públic?',
    ajuda: 'Per exemple, un ajuntament, un consell comarcal, una universitat pública o un ens que en depèn. Una empresa privada que treballa per a l\'Administració no ho és.',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'sector',
    text: 'La teva activitat és alguna d\'aquestes?',
    ajuda: 'La llei espanyola obliga a tenir DPO en aquests sectors. Si no és cap, tria «Cap d\'aquests».',
    tipus: 'llista', // una sola opció d'entre SECTORS, més 'cap'
  },
  {
    id: 'sectorCondicio',
    // El text concret surt de SECTORS[i].condicio.text
    nomesSi: { pregunta: 'sector', teCondicio: true },
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'seguiment',
    text: 'La teva activitat principal consisteix a fer un seguiment regular i sistemàtic de persones?',
    ajuda: 'Per exemple: geolocalitzar clients o vehicles, elaborar perfils de comportament per a publicitat, programes de fidelització que analitzen hàbits, videovigilància d\'espais oberts al públic com a servei. «Activitat principal» vol dir la que fa el negoci, no tasques de suport com la nòmina.',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'sensibles',
    text: 'La teva activitat principal consisteix a tractar dades sensibles o penals?',
    ajuda: 'Dades sensibles: salut, genètiques, biomètriques per identificar persones, origen ètnic, opinions polítiques, religió, afiliació sindical, vida o orientació sexual. Penals: condemnes i infraccions. Tenir dades de salut de l\'equip per a la nòmina no compta: ha de ser el nucli del negoci (una clínica, un laboratori…).',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'granEscala',
    text: 'Aquest tractament es fa a gran escala?',
    ajuda: 'No hi ha una xifra legal. Es valora el nombre de persones afectades, el volum de dades, quant de temps es conserven i l\'abast geogràfic. Un hospital o una xarxa de clíniques, sí; un metge que treballa sol, en principi no.',
    nomesSi: { algunaDe: ['seguiment', 'sensibles'], valors: ['si', 'nsnc'] },
    opcions: ['si', 'no', 'nsnc'],
  },
]

export const ETIQUETES_OPCIO = { si: 'Sí', no: 'No', nsnc: 'No ho sé' }

/**
 * Sectors de l'art. 34.1 LOPDGDD. Els que tenen `condicio` només obliguen si
 * es compleix (pregunta de seguiment 'sectorCondicio').
 */
export const SECTORS = [
  { id: 'a', text: 'Col·legi professional o consell general de col·legis', article: 'LOPDGDD, art. 34.1.a' },
  { id: 'b', text: 'Centre docent (qualsevol nivell educatiu reglat) o universitat', article: 'LOPDGDD, art. 34.1.b' },
  { id: 'c', text: 'Operador de xarxes o serveis de comunicacions electròniques', article: 'LOPDGDD, art. 34.1.c',
    condicio: { text: 'Tracteu dades personals de manera habitual i sistemàtica a gran escala?' } },
  { id: 'd', text: 'Prestador de serveis de la societat de la informació (plataformes, apps, comerç en línia…)', article: 'LOPDGDD, art. 34.1.d',
    condicio: { text: 'Elaboreu perfils dels usuaris del servei a gran escala?' } },
  { id: 'e', text: 'Entitat de crèdit', article: 'LOPDGDD, art. 34.1.e' },
  { id: 'f', text: 'Entitat asseguradora o reasseguradora', article: 'LOPDGDD, art. 34.1.f' },
  { id: 'g', text: 'Empresa de serveis d\'inversió', article: 'LOPDGDD, art. 34.1.g' },
  { id: 'h', text: 'Distribuïdora o comercialitzadora d\'electricitat o gas natural', article: 'LOPDGDD, art. 34.1.h' },
  { id: 'i', text: 'Responsable de fitxers comuns de solvència o de prevenció del frau', article: 'LOPDGDD, art. 34.1.i' },
  { id: 'j', text: 'Publicitat, prospecció comercial o investigació de mercats', article: 'LOPDGDD, art. 34.1.j',
    condicio: { text: 'Feu tractaments basats en les preferències de les persones o n\'elaboreu perfils?' } },
  { id: 'k', text: 'Centre sanitari obligat a conservar històries clíniques', article: 'LOPDGDD, art. 34.1.k',
    condicio: { text: 'És un centre sanitari, i no un professional de la salut que exerceix a títol individual?' } },
  { id: 'l', text: 'Emissió d\'informes comercials sobre persones físiques', article: 'LOPDGDD, art. 34.1.l' },
  { id: 'm', text: 'Operador de joc per canals electrònics, informàtics o telemàtics', article: 'LOPDGDD, art. 34.1.m' },
  { id: 'n', text: 'Empresa de seguretat privada', article: 'LOPDGDD, art. 34.1.n' },
  { id: 'ñ', text: 'Federació esportiva', article: 'LOPDGDD, art. 34.1.ñ',
    condicio: { text: 'Tracteu dades de menors d\'edat?' } },
]
export const SECTOR_CAP = { id: 'cap', text: 'Cap d\'aquests' }

/** Motius que poden aparèixer al resultat (els `id` els fa servir avaluar()). */
export const MOTIUS = {
  'art37-1-a': { text: 'Ets una autoritat o un organisme públic.', article: 'RGPD, art. 37.1.a' },
  'lopdgdd-34-1': { text: 'La teva activitat és un dels sectors en què la llei espanyola obliga a tenir DPO.', article: 'LOPDGDD, art. 34.1' }, // + l'article del sector
  'art37-1-b': { text: 'La teva activitat principal implica un seguiment regular i sistemàtic de persones a gran escala.', article: 'RGPD, art. 37.1.b' },
  'art37-1-c': { text: 'La teva activitat principal consisteix a tractar dades sensibles o penals a gran escala.', article: 'RGPD, arts. 37.1.c, 9 i 10' },
}

/** Resultats possibles. */
export const VEREDICTES = {
  obligatori: {
    titol: 'Sí, has de designar *un DPO*.',
    text: 'Pot ser una persona de l\'equip o un servei extern, però ha de tenir coneixements de protecció de dades, independència i accés a la direcció.',
    passos: [
      'Designa el DPO i deixa-ho per escrit.',
      'Comunica la designació a l\'autoritat de control (l\'AEPD o, si correspon, l\'APDCat) en un termini de deu dies (LOPDGDD, art. 34.3).',
      'Publica les dades de contacte del DPO, per exemple a la política de privacitat (RGPD, art. 37.7).',
    ],
  },
  'cal-revisar': {
    titol: 'Depèn d\'alguna resposta *que cal precisar*.',
    text: 'Amb el que has respost no es pot saber del cert. Els punts que cal mirar amb calma són aquests:',
    passos: ['Revisa amb algú de confiança els punts marcats, o parla-ho amb nosaltres.'],
  },
  recomanable: {
    titol: 'No és obligatori, però *t\'ho pots plantejar*.',
    text: 'Tractes dades o fas un seguiment que mereixen atenció, tot i que no a gran escala. Un DPO voluntari, o un assessorament periòdic, t\'ajuda a tenir-ho controlat. Si el designes voluntàriament, també l\'has de comunicar a l\'autoritat de control (LOPDGDD, art. 34.3).',
    passos: ['Revisa que tens el registre d\'activitats i l\'anàlisi de riscos al dia.'],
  },
  'no-obligatori': {
    titol: 'No, en principi *no cal* un DPO.',
    text: 'Amb les teves respostes, cap supòsit de l\'article 37 del RGPD ni de l\'article 34 de la LOPDGDD t\'obliga. El RGPD, però, s\'ha de complir igualment.',
    passos: ['Fes el diagnòstic gratuït per saber on ets en la resta d\'obligacions.'],
  },
}

/** Textos fixos de la pàgina. */
export const TEXTOS = {
  titol: 'Necessito un *DPO*?',
  entrada: 'Respon unes quantes preguntes i et direm si la normativa t\'obliga a tenir un delegat de protecció de dades (DPO), i per què.',
  durada: '2 minuts · sense registre · no s\'envia ni es desa res',
  avis: 'Resultat orientatiu, basat en l\'article 37 del RGPD i l\'article 34 de la LOPDGDD. No substitueix l\'anàlisi del teu cas concret.',
  ctaPrincipal: { text: 'Fes el diagnòstic gratuït · 4 min', url: 'https://madeinhuman.cat/diagnostic.html?utm_source=eina-dpo&utm_medium=web&utm_campaign=necessito-dpo&utm_content=resultat' },
  ctaSecundari: { text: 'Parla-ho amb nosaltres', url: 'https://madeinhuman.cat/?utm_source=eina-dpo&utm_medium=web&utm_campaign=necessito-dpo&utm_content=resultat#contacte' },
  tornar: 'Torna a començar',
  enrere: 'Enrere',
  seguent: 'Continua',
  comencar: 'Comença',
}
