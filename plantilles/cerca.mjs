// Plantilla de les pàgines de cerca interna (/cerca/ i /es/buscar/, WEB-G05d):
// noindex, follow, marc interior, fora del mapa del lloc, sense tercers i amb alternativa <noscript>.
import { marcInterior } from './serveis.mjs';
import { t } from './textos.mjs';

export const RUTA_CERCA = '/cerca/';
export const RUTA_CERCA_ES = '/es/buscar/';

const RUTES = {
  ca: {
    ruta: RUTA_CERCA,
    rutaAltre: RUTA_CERCA_ES,
    indexUrl: '/cerca/index.json',
    buitHref: '/#contacte',
    seccions: [
      ['cerca.sec_inici', '/'],
      ['cerca.sec_serveis', '/#serveis'],
      ['cerca.sec_diagnostic', '/diagnostic'],
      ['cerca.sec_faq', '/preguntes-frequents/'],
      ['cerca.sec_actualitat', '/actualitat/'],
      ['cerca.sec_contacte', '/#contacte'],
    ],
  },
  es: {
    ruta: RUTA_CERCA_ES,
    rutaAltre: RUTA_CERCA,
    indexUrl: '/es/buscar/index.json',
    buitHref: '/es/#contacto',
    seccions: [
      ['cerca.sec_inici', '/es/'],
      ['cerca.sec_serveis', '/es/#servicios'],
      ['cerca.sec_diagnostic', '/diagnostic'],
      ['cerca.sec_faq', '/es/preguntas-frecuentes/'],
      ['cerca.sec_contacte', '/es/#contacto'],
    ],
  },
};

/** → [['cerca/index.html', htmlCa], ['es/buscar/index.html', htmlEs]] */
export function paginesCerca(lloc, dades) {
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const alternates = [['ca', RUTA_CERCA], ['es', RUTA_CERCA_ES], ['x-default', RUTA_CERCA]];

  return ['ca', 'es'].map(lang => {
    const k = RUTES[lang];
    const c = dades.COMU[lang];
    const h1 = t(lang, 'cerca.h1');
    const molla = t(lang, 'cerca.molla');
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'SearchResultsPage', name: h1, url: WEB + k.ruta, inLanguage: lang, publisher: { '@id': `${WEB}/#empresa` } },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
            { '@type': 'ListItem', position: 2, name: molla, item: WEB + k.ruta },
          ],
        },
      ],
    };

    const html = m.cap(lang, t(lang, 'cerca.titol_seo'), t(lang, 'cerca.desc'), k.ruta, alternates, ld, {
      comentari: false,
      robots: 'noindex, follow',
    })
      + m.nav(lang, k.rutaAltre) + `  <main id="contingut" class="pagina" tabindex="-1">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="${e(t(lang, 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">${e(molla)}</span></nav>
      <span class="eyebrow">${e(t(lang, 'cerca.eyebrow'))}</span>
      <h1 class="section-title pagina-h1">${e(h1)}</h1>
      <p class="pagina-lede">${e(t(lang, 'cerca.lede'))}</p>
      <form class="cerca-form" role="search" method="get" action="${k.ruta}" data-cerca-form data-cerca-index="${k.indexUrl}" data-cerca-idioma="${lang}">
        <label class="cerca-label" for="cerca-q">${e(t(lang, 'cerca.label'))}</label>
        <div class="cerca-fila">
          <input id="cerca-q" class="cerca-input" type="search" name="q" autocomplete="off" placeholder="${e(t(lang, 'cerca.placeholder'))}" />
          <button type="submit" class="btn btn-primary cerca-boto">${e(t(lang, 'cerca.boto'))}</button>
        </div>
      </form>
      <p class="cerca-estat" data-cerca-estat role="status" aria-live="polite"></p>
      <ol class="cerca-resultats" data-cerca-resultats></ol>
      <div class="cerca-buit" data-cerca-buit hidden>
        <p class="cerca-buit-titol">${e(t(lang, 'cerca.buit_titol'))}</p>
        <p>${e(t(lang, 'cerca.buit_text'))} <a href="${k.buitHref}">${e(t(lang, 'cerca.buit_enllac'))}</a>.</p>
      </div>
      <noscript>
        <section class="pagina-seccio cerca-noscript">
          <h2>${e(t(lang, 'cerca.noscript_titol'))}</h2>
          <p>${e(t(lang, 'cerca.noscript_text'))}</p>
          <ul class="pagina-altres">
${k.seccions.map(([clau, href]) => `            <li><a href="${href}">${e(t(lang, clau))}</a></li>`).join('\n')}
          </ul>
        </section>
      </noscript>
    </div>
  </main>
  <script src="/cerca.js" defer></script>
` + m.peu(lang);

    return [`${k.ruta.slice(1)}index.html`, html];
  });
}
