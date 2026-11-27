// Plantilla de les pàgines de cerca interna (/cerca/ i /es/buscar/, WEB-G05d):
// noindex, follow, marc interior, fora del mapa del lloc, sense tercers i amb alternativa <noscript>.
import { marcInterior } from './serveis.mjs';

export const RUTA_CERCA = '/cerca/';
export const RUTA_CERCA_ES = '/es/buscar/';

const CONF = {
  ca: {
    ruta: RUTA_CERCA,
    rutaAltre: RUTA_CERCA_ES,
    indexUrl: '/cerca/index.json',
    titolSeo: 'Cerca · Madeinhuman',
    desc: 'Cerqueu pàgines de serveis, preguntes freqüents i actualitat de Madeinhuman.',
    molla: 'Cerca',
    eyebrow: 'Cerca interna',
    h1: 'Cerca al web',
    lede: 'Troba pàgines de serveis, preguntes freqüents i articles sobre RGPD, DPO i intel·ligència artificial.',
    label: 'Què busques?',
    placeholder: 'p. ex. DPO, cookies, IA, diagnòstic…',
    boto: 'Cercar',
    buitTitol: 'No hem trobat cap pàgina amb aquests termes.',
    buitText: 'Prova-ho amb altres paraules o explica’ns directament què necessites.',
    buitEnllacText: 'Anar al formulari de contacte',
    buitHref: '/#contacte',
    noscriptTitol: 'La cerca interactiva necessita JavaScript',
    noscriptText: 'Podeu navegar directament per les seccions principals del web:',
    seccions: [
      ['Inici', '/'],
      ['Serveis RGPD, DPO i AI Act', '/#serveis'],
      ['Diagnòstic gratuït', '/diagnostic'],
      ['Preguntes freqüents', '/preguntes-frequents/'],
      ['Actualitat', '/actualitat/'],
      ['Contacte', '/#contacte'],
    ],
  },
  es: {
    ruta: RUTA_CERCA_ES,
    rutaAltre: RUTA_CERCA,
    indexUrl: '/es/buscar/index.json',
    titolSeo: 'Buscar · Madeinhuman',
    desc: 'Buscad páginas de servicios, preguntas frecuentes y actualidad de Madeinhuman.',
    molla: 'Buscar',
    eyebrow: 'Búsqueda interna',
    h1: 'Buscar en la web',
    lede: 'Encuentra páginas de servicios, preguntas frecuentes y artículos sobre RGPD, DPO e inteligencia artificial.',
    label: '¿Qué buscas?',
    placeholder: 'p. ej. DPO, cookies, IA, diagnóstico…',
    boto: 'Buscar',
    buitTitol: 'No hemos encontrado ninguna página con esos términos.',
    buitText: 'Prueba con otras palabras o cuéntanos directamente qué necesitas.',
    buitEnllacText: 'Ir al formulario de contacto',
    buitHref: '/es/#contacto',
    noscriptTitol: 'La búsqueda interactiva necesita JavaScript',
    noscriptText: 'Podéis navegar directamente por las secciones principales de la web:',
    seccions: [
      ['Inicio', '/es/'],
      ['Servicios RGPD, DPO y AI Act', '/es/#servicios'],
      ['Diagnóstico gratuito', '/diagnostic'],
      ['Preguntas frecuentes', '/es/preguntas-frecuentes/'],
      ['Contacto', '/es/#contacto'],
    ],
  },
};

/** → [['cerca/index.html', htmlCa], ['es/buscar/index.html', htmlEs]] */
export function paginesCerca(lloc, dades) {
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const alternates = [['ca', RUTA_CERCA], ['es', RUTA_CERCA_ES], ['x-default', RUTA_CERCA]];

  return ['ca', 'es'].map(lang => {
    const k = CONF[lang];
    const c = dades.COMU[lang];
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'SearchResultsPage', name: k.h1, url: WEB + k.ruta, inLanguage: lang, publisher: { '@id': `${WEB}/#empresa` } },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
            { '@type': 'ListItem', position: 2, name: k.molla, item: WEB + k.ruta },
          ],
        },
      ],
    };

    const html = m.cap(lang, k.titolSeo, k.desc, k.ruta, alternates, ld, {
      comentari: false,
      robots: 'noindex, follow',
    })
      + m.nav(lang, k.rutaAltre) + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="Ruta"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">${e(k.molla)}</span></nav>
      <span class="eyebrow">${e(k.eyebrow)}</span>
      <h1 class="section-title pagina-h1">${e(k.h1)}</h1>
      <p class="pagina-lede">${e(k.lede)}</p>
      <form class="cerca-form" role="search" method="get" action="${k.ruta}" data-cerca-form data-cerca-index="${k.indexUrl}" data-cerca-idioma="${lang}">
        <label class="cerca-label" for="cerca-q">${e(k.label)}</label>
        <div class="cerca-fila">
          <input id="cerca-q" class="cerca-input" type="search" name="q" autocomplete="off" placeholder="${e(k.placeholder)}" />
          <button type="submit" class="btn btn-primary cerca-boto">${e(k.boto)}</button>
        </div>
      </form>
      <p class="cerca-estat" data-cerca-estat role="status" aria-live="polite"></p>
      <ol class="cerca-resultats" data-cerca-resultats></ol>
      <div class="cerca-buit" data-cerca-buit hidden>
        <p class="cerca-buit-titol">${e(k.buitTitol)}</p>
        <p>${e(k.buitText)} <a href="${k.buitHref}">${e(k.buitEnllacText)}</a>.</p>
      </div>
      <noscript>
        <section class="pagina-seccio cerca-noscript">
          <h2>${e(k.noscriptTitol)}</h2>
          <p>${e(k.noscriptText)}</p>
          <ul class="pagina-altres">
${k.seccions.map(([nom, href]) => `            <li><a href="${href}">${e(nom)}</a></li>`).join('\n')}
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
