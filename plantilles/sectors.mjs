// Plantilla de pàgines de sector (WEB-G01 / WEB-G03): contingut/sectors/<slug>.json → /sectors/<slug>/ (ca)
// o /es/sectores/<slug>/ (es), i índexs /sectors/ i /es/sectores/ (només amb les pàgines publicades).
// Fa servir marcInterior i reaprofita les classes d'actualitat (noticia-revisio, noticia-fonts, noticia-cta)
// i el paràgraf destacat del Markdown (text-destacat).
import { markdown } from './markdown.mjs';
import { enriquit } from './text.mjs';
import { marcInterior } from './serveis.mjs';
import { dataLlarga } from './actualitat.mjs';

export const RUTA_SECTORS = '/sectors/';
export const RUTA_SECTORS_ES = '/es/sectores/';
const RUTA_PER_IDIOMA = { ca: RUTA_SECTORS, es: RUTA_SECTORS_ES };
const MESOS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function dataLlargaIdioma(iso, lang) {
  if (lang !== 'es') return dataLlarga(iso);
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESOS_ES[m - 1]} de ${a}`;
}

const TEXTOS = {
  ca: {
    sectors: 'Sectors',
    eyebrowIdx: 'Sectors · Girona',
    titolIdx: 'Protecció de dades per sectors · Girona · Madeinhuman',
    descIdx: 'Guies pràctiques de protecció de dades i RGPD per sector per a empreses i entitats de Girona: obligacions, documents i primeres passes.',
    h1Idx: 'Protecció de dades per sectors',
    ledeIdx: 'Cada activitat tracta dades diferents i té riscos propis. Aquí trobareu guies pràctiques adaptades al vostre sector.',
    esborrany: 'Esborrany: pendent de validació',
    revisioPrefix: 'Darrera revisió jurídica:',
    revisatDefecte: 'Revisat per un consultor RGPD i DPO extern de madeinhuman',
    docsTitol: 'Documents habituals',
    faqTitol: 'Preguntes freqüents',
    interessa: 'Et pot interessar:',
    fontsTitol: 'Fonts',
    ctaDefecte: { diagnostic: 'Fer el diagnòstic gratuït', contacte: 'Parla amb nosaltres', servei: 'Veure el servei' },
    contacteHref: '/#contacte',
    altreHome: '/es/',
    etiquetes: {
      salut: 'Salut',
      educacio: 'Educació i lleure',
      comerc: 'Comerç',
      serveis: 'Serveis professionals',
      hostaleria: 'Hostaleria i turisme',
      social: 'Entitats socials',
    },
  },
  es: {
    sectors: 'Sectores',
    eyebrowIdx: 'Sectores · Girona',
    titolIdx: 'Protección de datos por sectores · Girona · Madeinhuman',
    descIdx: 'Guías prácticas de protección de datos y RGPD por sector para empresas y entidades de Girona: obligaciones, documentos y primeros pasos.',
    h1Idx: 'Protección de datos por sectores',
    ledeIdx: 'Cada actividad trata datos distintos y tiene riesgos propios. Aquí encontraréis guías prácticas adaptadas a vuestro sector.',
    esborrany: 'Borrador: pendiente de validación',
    revisioPrefix: 'Última revisión jurídica:',
    revisatDefecte: 'Revisado por un consultor RGPD y DPO externo de madeinhuman',
    docsTitol: 'Documentos que suelen hacer falta',
    faqTitol: 'Preguntas frecuentes',
    interessa: 'Te puede interesar:',
    fontsTitol: 'Fuentes',
    ctaDefecte: { diagnostic: 'Hacer el diagnóstico gratuito', contacte: 'Habla con nosotros', servei: 'Ver el servicio' },
    contacteHref: '/es/#contacto',
    altreHome: '/',
    etiquetes: {
      salut: 'Salud',
      educacio: 'Educación y ocio',
      comerc: 'Comercio',
      serveis: 'Servicios profesionales',
      hostaleria: 'Hostelería y turismo',
      social: 'Entidades sociales',
    },
  },
};

export const urlSector = s => `${RUTA_PER_IDIOMA[s.idioma || 'ca']}${s.slug}/`;
const pla = t => String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\n/g, ' ');

/** → [[ruta relativa, html], …]: índexs /sectors/ i /es/sectores/ (si hi ha publicades) i cada pàgina visible. */
export function paginesSectors(lloc, dades, sectors, { ambEsborranys = false } = {}) {
  const ordenats = [...sectors].sort((a, b) => a.slug.localeCompare(b.slug));
  const publicats = ordenats.filter(s => s.estat === 'publicat');
  const visibles = ambEsborranys ? ordenats : publicats;
  if (!visibles.length) return [];

  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const out = [];

  const pubPerIdioma = {
    ca: publicats.filter(s => (s.idioma || 'ca') === 'ca'),
    es: publicats.filter(s => s.idioma === 'es'),
  };
  const ambIndex = { ca: pubPerIdioma.ca.length > 0, es: pubPerIdioma.es.length > 0 };

  // Agrupa les pàgines visibles per grup_hreflang per generar hreflang recíprocs només entre pàgines existents
  const grups = new Map();
  for (const s of visibles) {
    if (!s.grup_hreflang) continue;
    const g = grups.get(s.grup_hreflang) || {};
    g[s.idioma || 'ca'] = s;
    grups.set(s.grup_hreflang, g);
  }

  // 1. Índexs /sectors/ i /es/sectores/ (només si hi ha alguna pàgina publicada en aquell idioma)
  for (const lang of ['ca', 'es']) {
    if (!ambIndex[lang]) continue;
    const t = TEXTOS[lang];
    const c = dades.COMU[lang];
    const rutaIdx = RUTA_PER_IDIOMA[lang];
    const alternates = ambIndex.ca && ambIndex.es
      ? [['ca', RUTA_SECTORS], ['es', RUTA_SECTORS_ES], ['x-default', RUTA_SECTORS]]
      : [[lang, rutaIdx], ['x-default', rutaIdx]];
    const urlAltre = ambIndex.ca && ambIndex.es ? RUTA_PER_IDIOMA[lang === 'ca' ? 'es' : 'ca'] : t.altreHome;
    const ldIndex = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', name: t.h1Idx, url: WEB + rutaIdx,
          inLanguage: lang, publisher: { '@id': `${WEB}/#empresa` } },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
          { '@type': 'ListItem', position: 2, name: t.sectors, item: WEB + rutaIdx },
        ] },
      ],
    };
    const targetes = pubPerIdioma[lang].map(s => `<li><a href="${urlSector(s)}"><strong>${e(s.h1)}</strong><span>${e(s.entradeta)}</span></a></li>`).join('');
    out.push([`${rutaIdx.slice(1)}index.html`,
      m.cap(lang, t.titolIdx, t.descIdx, rutaIdx, alternates, ldIndex, { comentari: false })
      + m.nav(lang, urlAltre) + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="Ruta"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">${e(t.sectors)}</span></nav>
      <span class="eyebrow">${e(t.eyebrowIdx)}</span>
      <h1 class="section-title pagina-h1">${e(t.h1Idx)}</h1>
      <p class="pagina-lede">${e(t.ledeIdx)}</p>
      <ul class="pagina-serveis">${targetes}</ul>
    </div>
  </main>
` + m.peu(lang)]);
  }

  // 2. Cada pàgina de sector visible (publicades; i esborranys només si ambEsborranys)
  for (const s of visibles) {
    const lang = s.idioma || 'ca';
    const t = TEXTOS[lang];
    const c = dades.COMU[lang];
    const rutaIdx = RUTA_PER_IDIOMA[lang];
    const url = urlSector(s);
    const esborrany = s.estat === 'esborrany';

    const parella = s.grup_hreflang ? grups.get(s.grup_hreflang) : null;
    const teParella = Boolean(parella && parella.ca && parella.es);
    const alternates = teParella
      ? [['ca', urlSector(parella.ca)], ['es', urlSector(parella.es)], ['x-default', urlSector(parella.ca)]]
      : [[lang, url], ['x-default', url]];
    const urlAltre = teParella ? urlSector(parella[lang === 'ca' ? 'es' : 'ca']) : t.altreHome;

    const nomServei = s.servei_relacionat ? dades.PAGINES[s.servei_relacionat][lang].curt : s.h1;
    const cites = (s.fonts || []).map(f => f.url);
    const graf = [
      m.empresa_ld(),
      {
        '@type': 'Service',
        name: s.h1,
        description: s.descripcio,
        url: WEB + url,
        serviceType: nomServei,
        provider: { '@id': `${WEB}/#empresa` },
        areaServed: dades.ZONA.map(z => ({ '@type': 'AdministrativeArea', name: z })),
        inLanguage: lang,
        ...(cites.length ? { citation: cites } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
          { '@type': 'ListItem', position: 2, name: t.sectors, item: WEB + rutaIdx },
          { '@type': 'ListItem', position: 3, name: s.h1, item: WEB + url },
        ],
      },
    ];
    if (s.faq?.length) {
      graf.push({
        '@type': 'FAQPage',
        mainEntity: s.faq.map(f => ({
          '@type': 'Question',
          name: f.pregunta,
          acceptedAnswer: { '@type': 'Answer', text: pla(f.resposta) },
        })),
      });
    }
    const ld = { '@context': 'https://schema.org', '@graph': graf };

    const franjaEsborrany = esborrany
      ? `      <p class="sector-esborrany" role="note">${e(t.esborrany)}</p>\n`
      : '';
    const mollaSectors = ambIndex[lang] ? `<a href="${rutaIdx}">${e(t.sectors)}</a>` : e(t.sectors);
    const revisio = s.data_revisio
      ? `      <p class="noticia-revisio">${e(t.revisioPrefix)} <time datetime="${e(s.data_revisio)}">${dataLlargaIdioma(s.data_revisio, lang)}</time> · ${e(s.revisat_per || t.revisatDefecte)}</p>\n`
      : '';
    const seccions = s.seccions.map(({ titol, cos }) => `      <section class="pagina-seccio">
        <h2>${e(titol)}</h2>
        ${markdown(cos)}
      </section>
`).join('');
    const documents = s.documents?.length ? `      <section class="pagina-seccio sector-documents">
        <h2>${e(t.docsTitol)}</h2>
        <ul>
${s.documents.map(doc => `          <li>${e(doc)}</li>`).join('\n')}
        </ul>
      </section>
` : '';
    const faqHtml = s.faq?.length ? `      <section class="pagina-seccio sector-faq">
        <h2>${e(t.faqTitol)}</h2>
        <dl class="sector-faq-llista">
${s.faq.map(f => `          <div class="sector-faq-item">
            <dt>${e(f.pregunta)}</dt>
            <dd>${enriquit(f.resposta)}</dd>
          </div>`).join('\n')}
        </dl>
      </section>
` : '';
    const servei = s.servei_relacionat
      ? `      <p class="noticia-servei">${e(t.interessa)} <a href="${m.url_servei(lang, s.servei_relacionat)}">${e(dades.PAGINES[s.servei_relacionat][lang].curt)}</a></p>\n`
      : '';
    const fonts = s.fonts?.length ? `      <section class="noticia-fonts" aria-label="${e(t.fontsTitol)}">
        <h2>${e(t.fontsTitol)}</h2>
        <ul>
${s.fonts.map(f => `          <li><a href="${e(f.url)}" target="_blank" rel="noopener">${e(f.nom)}</a></li>`).join('\n')}
        </ul>
      </section>
` : '';
    const destiCta = s.cta_desti === 'diagnostic' ? '/diagnostic'
      : s.cta_desti === 'contacte' ? t.contacteHref
      : m.url_servei(lang, s.servei_relacionat);
    const textCta = s.cta_text || t.ctaDefecte[s.cta_desti];
    const ctaHtml = `      <aside class="noticia-cta">
        <h2>${e(c.cta_titol)}</h2>
        <a class="btn btn-primary" href="${destiCta}">${e(textCta)}</a>
      </aside>
`;

    out.push([`${url.slice(1)}index.html`,
      m.cap(lang, s.titol_seo, s.descripcio, url, alternates, ld, {
        comentari: false,
        robots: esborrany ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
      })
      + m.nav(lang, urlAltre) + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="Ruta"><a href="${c.home}">${e(c.inici)}</a> › ${mollaSectors} › <span aria-current="page">${e(s.h1)}</span></nav>
${franjaEsborrany}      <span class="eyebrow">${e(t.etiquetes[s.sector] || s.sector)} · Girona</span>
      <h1 class="section-title pagina-h1">${e(s.h1)}</h1>
${revisio}      <p class="pagina-lede">${e(s.entradeta)}</p>
      <blockquote class="text-destacat">
        <p>${enriquit(s.capsula)}</p>
      </blockquote>
${seccions}${documents}${faqHtml}${servei}${fonts}${ctaHtml}    </div>
  </main>
` + m.peu(lang)]);
  }

  return out;
}

/** Dates `lastmod` del mapa del lloc per a les pàgines de sector publicades (amb `data_revisio`) i els índexs `/sectors/` i `/es/sectores/`. */
export function datesSectorsMapa(WEB, sectors) {
  const dates = new Map();
  const publicats = (sectors || []).filter(s => s.estat === 'publicat');
  for (const lang of ['ca', 'es']) {
    const delLang = publicats.filter(s => (s.idioma || 'ca') === lang);
    let mesRecent = '';
    for (const s of delLang) {
      if (s.data_revisio) {
        dates.set(`${WEB}${urlSector(s)}`, s.data_revisio);
        if (s.data_revisio > mesRecent) mesRecent = s.data_revisio;
      }
    }
    if (delLang.length && mesRecent) dates.set(`${WEB}${RUTA_PER_IDIOMA[lang]}`, mesRecent);
  }
  return dates;
}
