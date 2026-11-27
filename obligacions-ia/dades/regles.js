// =============================================================================
// «Test d’obligacions d’IA» · Contingut jurídic i textos (FONT DE VERITAT)
//
// ⚠️ AGENT: NO MODIFIQUIS AQUEST FITXER. Conté el contingut normatiu i tots els
// textos que veu l’usuari. La lògica (src/avaluar.js) i la interfície
// (src/app.js) han de llegir-ho tot d’aquí.
//
// És un ESBORRANY (WEB-T08): no s’enllaça des d’enlloc i és noindex fins que el
// propietari validi el contingut jurídic.
//
// Úniques dades jurídiques permeses (font: document del negoci, annex D):
//   · Art. 4 (alfabetització en IA), reformulat per l’Òmnibus Digital sobre IA,
//     en vigor des del 27/07/2026: obliga a adoptar mesures de suport a
//     l’alfabetització en IA del personal que fa servir sistemes d’IA.
//   · Art. 50 (transparència): les obligacions s’apliquen des del 2/08/2026. El
//     marcatge de l’art. 50.2 té un període transitori fins al 2/12/2026 per als
//     sistemes que ja eren al mercat.
// Qualsevol altra afirmació jurídica → [REVISAR: què cal confirmar].
// Registre: vosaltres (com el diagnòstic). Respostes: 'si' | 'no' | 'nsnc',
// més les opcions específiques de contingutIa.
// =============================================================================

/** Preguntes, en l’ordre en què es fan. `nomesSi` indica quan cal fer-la. */
export const PREGUNTES = [
  {
    id: 'usaIa',
    text: 'El vostre equip fa servir eines d’intel·ligència artificial a la feina?',
    ajuda: 'Per exemple, un xat d’IA o intel·ligència artificial integrada dins dels programes que feu servir (correu, ofimàtica, disseny, programari de gestió…).',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'xatClients',
    text: 'Teniu un xat o un assistent automàtic que parla amb els clients?',
    ajuda: 'Per exemple, un xat del web, un assistent automàtic de missatgeria o un bot que respon correus.',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'contingutIa',
    text: 'La vostra empresa publica contingut generat o modificat amb IA?',
    ajuda: 'Imatges, àudio, vídeo o textos creats o modificats amb intel·ligència artificial, publicats al web, a les xarxes o en campanyes.',
    opcions: ['media', 'textos', 'ambdos', 'no', 'nsnc'],
  },
  {
    id: 'sistemesMercat',
    text: 'El sistema d’IA que feu servir per generar aquest contingut ja era al mercat abans del 2/12/2026?',
    ajuda: '«Ja era al mercat» vol dir que ja s’oferia o es comercialitzava abans d’aquesta data.',
    nomesSi: { pregunta: 'contingutIa', valors: ['media', 'ambdos'] },
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'biometria',
    text: 'Feu servir reconeixement d’emocions o classificació biomètrica?',
    ajuda: 'Per exemple, sistemes que analitzen expressions facials, veu o altres dades biomètriques per classificar persones.',
    opcions: ['si', 'no', 'nsnc'],
  },
  {
    id: 'desenvolupaIa',
    text: 'La vostra empresa desenvolupa o ven sistemes d’IA a tercers?',
    opcions: ['si', 'no', 'nsnc'],
  },
]

export const ETIQUETES_OPCIO = {
  si: 'Sí',
  no: 'No',
  nsnc: 'No ho sé',
  media: 'Imatges, àudio o vídeo',
  textos: 'Només textos',
  ambdos: 'Ambdues coses',
}

/** Obligacions que poden aparèixer al resultat (els `id` els fa servir avaluar()). */
export const OBLIGACIONS = {
  'art4': {
    text: 'Heu d’adoptar mesures de suport a l’*alfabetització en IA* del personal que fa servir sistemes d’IA.',
    article: 'Reglament d’IA, art. 4 · en vigor des del 27/07/2026',
  },
  'art50-xat': {
    text: 'L’*art. 50* exigeix transparència quan s’utilitzen sistemes d’IA en la relació amb persones. [REVISAR: què cal confirmar — l’apartat concret per als xats i assistents automàtics que parlen amb clients].',
    article: 'Reglament d’IA, art. 50 · des del 2/08/2026',
  },
  'art50-2': {
    text: 'Les *imatges, l’àudio i el vídeo* generats o manipulats amb IA s’han de *marcar com a tals*.',
    article: 'Reglament d’IA, art. 50.2',
  },
  'revisar-textos': {
    text: 'Si publiqueu *textos* generats o modificats amb IA, [REVISAR: què cal confirmar — si també s’han de marcar o informar].',
    article: 'Reglament d’IA, art. 50 · [REVISAR: apartat concret]',
  },
  'revisar-biometria': {
    text: 'El *reconeixement d’emocions* i la *classificació biomètrica* poden comportar obligacions molt específiques. [REVISAR: què cal confirmar — articles i condicions].',
    article: 'Reglament d’IA · [REVISAR: articles concrets]',
  },
  'revisar-proveidor': {
    text: 'Si desenvolupeu o veneu *sistemes d’IA* a tercers, hi pot haver obligacions específiques per a qui els posa al mercat. [REVISAR: què cal confirmar — articles i terminis].',
    article: 'Reglament d’IA · [REVISAR: articles concrets]',
  },
}

/** Notes sobre el període transitori de l’art. 50.2, segons la resposta. */
export const NOTES_TRANSITORI = {
  si: 'Com que el sistema ja era al mercat, el marcatge de l’art. 50.2 té un *període transitori fins al 2/12/2026*.',
  no: 'Les obligacions de l’art. 50 s’apliquen *des del 2/08/2026*.',
  nsnc: 'Per saber si us toca el període transitori fins al 2/12/2026, cal confirmar si el sistema ja era al mercat.',
}

/** Pantalles de resultat possibles. */
export const RESULTATS = {
  amb: {
    titol: 'Obligacions *probables*, a valorar',
    text: 'Amb les vostres respostes, aquestes obligacions del Reglament d’IA probablement us afecten. «Probable» no vol dir «obligatòria»: és una valoració orientativa.',
  },
  dubtes: {
    titol: 'Hi ha respostes *a precisar*',
    text: 'Amb el que heu respost no es pot saber del cert. Mireu amb calma aquests punts:',
  },
  cap: {
    titol: 'En principi, *cap obligació específica*',
    text: 'Amb les vostres respostes no detectem obligacions del Reglament d’IA, però això no vol dir que no n’hi hagi en el vostre cas concret. El resultat és orientatiu.',
  },
}

/** Textos fixos de la pàgina. */
export const TEXTOS = {
  titol: 'Test d’*obligacions* d’IA',
  entrada: 'Responeu unes quantes preguntes i us direm quines obligacions del Reglament d’IA probablement us afecten i què volen dir a la pràctica.',
  durada: '2 minuts · sense registre · no s’envia ni es desa res',
  etiquetaDubtes: 'Punts a precisar:',
  avis: 'Eina en esborrany: el contingut encara està en revisió. El resultat és orientatiu, basat en l’art. 4 i l’art. 50 del Reglament d’IA, i no substitueix l’anàlisi del vostre cas concret ni és assessorament jurídic.',
  ctaPrincipal: { text: 'Fer el diagnòstic gratuït', url: '/diagnostic' },
  ctaSecundari: { text: 'Parleu amb nosaltres', url: '/#contacte' },
  tornar: 'Torneu a començar',
  enrere: 'Enrere',
  comencar: 'Comenceu',
}
