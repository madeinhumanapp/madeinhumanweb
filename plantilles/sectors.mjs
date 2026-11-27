// Plantilla de pàgines de sector (WEB-G01): contingut/sectors/<slug>.json → /sectors/<slug>/
// i índex /sectors/ (només amb les pàgines publicades). Fa servir el mateix marc que les pàgines
// de servei (marcInterior) i reaprofita les classes d'actualitat (noticia-revisio, noticia-fonts,
// noticia-cta) i el paràgraf destacat del Markdown (text-destacat).
import { markdown } from './markdown.mjs';
import { enriquit } from './text.mjs';
import { marcInterior } from './serveis.mjs';
import { dataLlarga } from './actualitat.mjs';

export const RUTA_SECTORS = '/sectors/';
const REVISAT_PER_DEFECTE = 'Revisat per un consultor RGPD i DPO extern de madeinhuman';
const CTA_TEXT_DEFECTE = { diagnostic: 'Fer el diagnòstic gratuït', contacte: 'Parla amb nosaltres', servei: 'Veure el servei' };
const ETIQUETA_SECTOR = {
  salut: 'Salut',
  educacio: 'Educació i lleure',
  comerc: 'Comerç',
  serveis: 'Serveis professionals',
  hostaleria: 'Hostaleria i turisme',
  social: 'Entitats socials',
};

const pla = t => String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\n/g, ' ');

/** → [[ruta relativa, html], …]: índex /sectors/ (si hi ha publicades) i cada pàgina visible. */
export function paginesSectors(lloc, dades, sectors, { ambEsborranys = false } = {}) {
  const ordenats = [...sectors].sort((a, b) => a.slug.localeCompare(b.slug));
  const publicats = ordenats.filter(s => s.estat === 'publicat');
  const visibles = ambEsborranys ? ordenats : publicats;
  if (!visibles.length) return [];

  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const c = dades.COMU.ca;
  const ambIndex = publicats.length > 0;
  const out = [];

  // 1. Índex /sectors/ (només si hi ha alguna pàgina publicada; només llista les publicades)
  if (ambIndex) {
    const titolIndex = 'Protecció de dades per sectors · Girona · Madeinhuman';
    const descIndex = 'Guies pràctiques de protecció de dades i RGPD per sector per a empreses i entitats de Girona: obligacions, documents i primeres passes.';
    const ldIndex = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', name: 'Protecció de dades per sectors', url: WEB + RUTA_SECTORS,
          inLanguage: 'ca', publisher: { '@id': `${WEB}/#empresa` } },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
          { '@type': 'ListItem', position: 2, name: 'Sectors', item: WEB + RUTA_SECTORS },
        ] },
      ],
    };
    const targetes = publicats.map(s => `<li><a href="${RUTA_SECTORS}${s.slug}/"><strong>${e(s.h1)}</strong><span>${e(s.entradeta)}</span></a></li>`).join('');
    out.push([`${RUTA_SECTORS.slice(1)}index.html`,
      m.cap('ca', titolIndex, descIndex, RUTA_SECTORS, [['ca', RUTA_SECTORS], ['x-default', RUTA_SECTORS]], ldIndex, { comentari: false })
      + m.nav('ca', '/es/') + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="Ruta"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">Sectors</span></nav>
      <span class="eyebrow">Sectors · Girona</span>
      <h1 class="section-title pagina-h1">Protecció de dades per sectors</h1>
      <p class="pagina-lede">Cada activitat tracta dades diferents i té riscos propis. Aquí trobareu guies pràctiques adaptades al vostre sector.</p>
      <ul class="pagina-serveis">${targetes}</ul>
    </div>
  </main>
` + m.peu('ca')]);
  }

  // 2. Cada pàgina de sector visible (publicades; i esborranys només si ambEsborranys)
  for (const s of visibles) {
    const url = `${RUTA_SECTORS}${s.slug}/`;
    const esborrany = s.estat === 'esborrany';
    const nomServei = s.servei_relacionat ? dades.PAGINES[s.servei_relacionat].ca.curt : s.h1;
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
        inLanguage: 'ca',
        ...(cites.length ? { citation: cites } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
          { '@type': 'ListItem', position: 2, name: 'Sectors', item: WEB + RUTA_SECTORS },
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
      ? `      <p class="sector-esborrany" role="note">Esborrany: pendent de validació</p>\n`
      : '';
    const mollaSectors = ambIndex ? `<a href="${RUTA_SECTORS}">Sectors</a>` : 'Sectors';
    const revisio = s.data_revisio
      ? `      <p class="noticia-revisio">Darrera revisió jurídica: <time datetime="${e(s.data_revisio)}">${dataLlarga(s.data_revisio)}</time> · ${e(s.revisat_per || REVISAT_PER_DEFECTE)}</p>\n`
      : '';
    const seccions = s.seccions.map(({ titol, cos }) => `      <section class="pagina-seccio">
        <h2>${e(titol)}</h2>
        ${markdown(cos)}
      </section>
`).join('');
    const documents = s.documents?.length ? `      <section class="pagina-seccio sector-documents">
        <h2>Documents habituals</h2>
        <ul>
${s.documents.map(doc => `          <li>${e(doc)}</li>`).join('\n')}
        </ul>
      </section>
` : '';
    const faqHtml = s.faq?.length ? `      <section class="pagina-seccio sector-faq">
        <h2>Preguntes freqüents</h2>
        <dl class="sector-faq-llista">
${s.faq.map(f => `          <div class="sector-faq-item">
            <dt>${e(f.pregunta)}</dt>
            <dd>${enriquit(f.resposta)}</dd>
          </div>`).join('\n')}
        </dl>
      </section>
` : '';
    const servei = s.servei_relacionat
      ? `      <p class="noticia-servei">Et pot interessar: <a href="${m.url_servei('ca', s.servei_relacionat)}">${e(dades.PAGINES[s.servei_relacionat].ca.curt)}</a></p>\n`
      : '';
    const fonts = s.fonts?.length ? `      <section class="noticia-fonts" aria-label="Fonts">
        <h2>Fonts</h2>
        <ul>
${s.fonts.map(f => `          <li><a href="${e(f.url)}" target="_blank" rel="noopener">${e(f.nom)}</a></li>`).join('\n')}
        </ul>
      </section>
` : '';
    const destiCta = s.cta_desti === 'diagnostic' ? '/diagnostic'
      : s.cta_desti === 'contacte' ? '/#contacte'
      : m.url_servei('ca', s.servei_relacionat);
    const textCta = s.cta_text || CTA_TEXT_DEFECTE[s.cta_desti];
    const ctaHtml = `      <aside class="noticia-cta">
        <h2>${e(c.cta_titol)}</h2>
        <a class="btn btn-primary" href="${destiCta}">${e(textCta)}</a>
      </aside>
`;

    out.push([`${url.slice(1)}index.html`,
      m.cap('ca', s.titol_seo, s.descripcio, url, [['ca', url], ['x-default', url]], ld, {
        comentari: false,
        robots: esborrany ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
      })
      + m.nav('ca', '/es/') + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="Ruta"><a href="${c.home}">${e(c.inici)}</a> › ${mollaSectors} › <span aria-current="page">${e(s.h1)}</span></nav>
${franjaEsborrany}      <span class="eyebrow">${e(ETIQUETA_SECTOR[s.sector] || s.sector)} · Girona</span>
      <h1 class="section-title pagina-h1">${e(s.h1)}</h1>
${revisio}      <p class="pagina-lede">${e(s.entradeta)}</p>
      <blockquote class="text-destacat">
        <p>${enriquit(s.capsula)}</p>
      </blockquote>
${seccions}${documents}${faqHtml}${servei}${fonts}${ctaHtml}    </div>
  </main>
` + m.peu('ca')]);
  }

  return out;
}

/** Dates `lastmod` del mapa del lloc per a les pàgines de sector publicades (amb `data_revisio`) i l'índex `/sectors/`. */
export function datesSectorsMapa(WEB, sectors) {
  const dates = new Map();
  const publicats = (sectors || []).filter(s => s.estat === 'publicat');
  let mesRecent = '';
  for (const s of publicats) {
    if (s.data_revisio) {
      dates.set(`${WEB}${RUTA_SECTORS}${s.slug}/`, s.data_revisio);
      if (s.data_revisio > mesRecent) mesRecent = s.data_revisio;
    }
  }
  if (publicats.length && mesRecent) dates.set(`${WEB}${RUTA_SECTORS}`, mesRecent);
  return dates;
}
