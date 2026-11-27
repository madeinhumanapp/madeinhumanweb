// Port a Node de marca/pagines/generar.py (encàrrec WEB-H04): mateixes funcions,
// mateix ordre i mateix HTML. Les dades de contacte (NAP) no estan aquí: surten de
// contingut/lloc.json (font única), que arriba com a `lloc`.
import { enriquit } from './text.mjs';
import { markdown } from './markdown.mjs';
import { menu, peu as peuComu } from './marc.mjs';
import { t } from './textos.mjs';

const CARPETA = { ca: 'serveis', es: 'es/servicios' };

// Marc comú de les pàgines interiors (cap, menú, peu, bloc final): també el fan servir les notícies
export function marcInterior(lloc, dades) {
  const { COMU, ZONA, SERVEIS, SLUG, PAGINES } = dades;
  const WEB = lloc.web;
  const NAP = {
    nom: lloc.nom,
    carrer: lloc.contacte.carrer,
    cp: lloc.contacte.cp,
    ciutat: lloc.contacte.ciutat,
    telefon: lloc.contacte.telefon,
    telefon_visible: lloc.contacte.telefonVisible,
    correu: lloc.contacte.correu,
  };

  function url_servei(lang, clau) {
    return `/${CARPETA[lang]}/${SLUG[lang][clau]}/`;
  }

  // html.escape(t, quote=True) de Python: també converteix l'apòstrof en &#x27;
  function e(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c]));
  }

  function zona_text(lang) {
    const llista = ZONA.slice(1, -1).join(', ') + t(lang, 'comu.conjuncio_i') + ZONA[ZONA.length - 1];
    return COMU[lang].zona_text.replace('{zona}', () => llista);
  }

  function empresa_ld() {
    return {
      '@type': 'ProfessionalService',
      '@id': `${WEB}/#empresa`,
      name: NAP.nom,
      url: WEB + '/',
      telephone: NAP.telefon,
      email: NAP.correu,
      image: `${WEB}/og-image.png`,
      address: { '@type': 'PostalAddress', addressLocality: NAP.ciutat, addressRegion: 'Girona', addressCountry: 'ES' },
      areaServed: ZONA.map(z => ({ '@type': 'AdministrativeArea', name: z })),
    };
  }

  function cap(lang, titol, descripcio, canonical, alternates, ld, { ogType = 'website', capExtra = '', comentari = true, robots = 'index, follow, max-image-preview:large', ambCanonica = true } = {}) {
    const c = COMU[lang];
    const alt = alternates.map(([l, u]) => `  <link rel="alternate" hreflang="${l}" href="${WEB}${u}" />\n`).join('');
    return `<!DOCTYPE html>
<html lang="${c.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${comentari ? '  <!-- Pàgina generada amb marca/pagines/generar.py: edita contingut.py, no aquest fitxer -->\n' : ''}  <title>${e(titol)}</title>
  <meta name="description" content="${e(descripcio)}" />
  <meta name="robots" content="${robots}" />
${ambCanonica ? `  <link rel="canonical" href="${WEB}${canonical}" />\n` : ''}${alt}  <meta property="og:title" content="${e(titol)}" />
  <meta property="og:description" content="${e(descripcio)}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${WEB}${canonical}" />
  <meta property="og:locale" content="${c.locale}" />
  <meta property="og:site_name" content="Madeinhuman" />
  <meta property="og:image" content="${WEB}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#0A0E1A" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/playfair-display-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/marca.css" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/pagines.css" />
${capExtra}  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body class="pagina-interior">
`;
  }

  // Menú i peu: els comuns de tota la web (plantilles/marc.mjs, WEB-H07)
  function nav(lang, url_altre, ruta = null) {
    return menu(lloc, { idioma: lang, ruta, urlAltre: url_altre }) + '\n';
  }

  function peu(lang) {
    return `${peuComu(lloc, { idioma: lang, ruta: null, zona: lang === 'es' ? t('es', 'serveis.zona_peu') : lloc.contacte.zona })}
<script src="/menu.js" defer></script>
</body>
</html>
`;
  }

  function bloc_final(lang, clau_actual = null) {
    const c = COMU[lang];
    const passos = c.metode.map(({ titol: tit, text: d }, i) => `<li><span class="pas-num">${String(i + 1).padStart(2, '0')}</span><strong>${e(tit)}</strong><span>${e(d)}</span></li>`).join('');
    const altres = SERVEIS.filter(k => k !== clau_actual)
      .map(k => `<li><a href="${url_servei(lang, k)}">${e(PAGINES[k][lang].curt)}</a></li>`).join('');
    return `      <section class="pagina-seccio">
        <h2>${e(c.metode_titol)}</h2>
        <ol class="passos-metode">${passos}</ol>
      </section>
      <section class="pagina-seccio">
        <h2>${e(c.zona_titol)}</h2>
        <p>${e(zona_text(lang))}</p>
      </section>
      <aside class="pagina-cta">
        <h2>${e(c.cta_titol)}</h2>
        <p>${e(c.cta_text)}</p>
        <div class="pagina-cta-botons">
          <a class="btn btn-primary" href="${c.cta_1[1]}">${e(c.cta_1[0])}</a>
          <a class="btn btn-ghost" href="${c.cta_2[1]}">${e(c.cta_2[0])}</a>
        </div>
      </aside>
      <nav class="pagina-seccio" aria-label="${e(c.altres)}">
        <h2>${e(c.altres)}</h2>
        <ul class="pagina-altres">${altres}</ul>
      </nav>
`;
  }

  return { WEB, NAP, e, url_servei, zona_text, empresa_ld, cap, nav, peu, bloc_final };
}

export function paginesServei(lloc, dades, sectorsPublicats = []) {
  const { COMU, ZONA, SERVEIS, SLUG, PAGINES, PORTADA_ES } = dades;
  const { WEB, NAP, e, url_servei, zona_text, empresa_ld, cap, nav, peu, bloc_final } = marcInterior(lloc, dades);

  function pagina_servei(lang, clau) {
    const p = PAGINES[clau][lang];
    const c = COMU[lang];
    const altre = lang === 'ca' ? 'es' : 'ca';
    const url = url_servei(lang, clau);
    const url_altre = url_servei(altre, clau);
    const alternates = [['ca', url_servei('ca', clau)], ['es', url_servei('es', clau)], ['x-default', url_servei('ca', clau)]];
    const ld = { '@context': 'https://schema.org', '@graph': [
      empresa_ld(),
      { '@type': 'Service', name: p.curt, description: p.descripcio, url: WEB + url,
        serviceType: p.curt, provider: { '@id': `${WEB}/#empresa` },
        areaServed: ZONA.map(z => ({ '@type': 'AdministrativeArea', name: z })), inLanguage: lang },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
        { '@type': 'ListItem', position: 2, name: c.serveis, item: WEB + c.breadcrumb_serveis },
        { '@type': 'ListItem', position: 3, name: p.curt, item: WEB + url }] },
    ] };
    const seccions = p.seccions.map(({ titol: tit, cos }) => `      <section class="pagina-seccio">
        <h2>${e(tit)}</h2>
        ${markdown(cos)}
      </section>
`).join('');
    const delServei = (sectorsPublicats || [])
      .filter(s => s.estat === 'publicat' && (s.idioma || 'ca') === lang && s.servei_relacionat === clau)
      .sort((a, b) => a.slug.localeCompare(b.slug));
    const titolSectors = t(lang, 'serveis.per_sectors');
    const prefixSectors = lang === 'es' ? '/es/sectores/' : '/sectors/';
    const perSectors = delServei.length ? `      <nav class="pagina-seccio" aria-label="${e(titolSectors)}">
        <h2>${e(titolSectors)}</h2>
        <ul class="pagina-altres">${delServei.map(s => `<li><a href="${prefixSectors}${s.slug}/">${e(s.h1)}</a></li>`).join('')}</ul>
      </nav>
` : '';
    const cos = `  <main id="contingut" class="pagina" tabindex="-1">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="${e(t(lang, 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › <a href="${c.breadcrumb_serveis}">${e(c.serveis)}</a> › <span aria-current="page">${e(p.curt)}</span></nav>
      <span class="eyebrow">${e(p.eyebrow)}</span>
      <h1 class="section-title pagina-h1">${enriquit(p.h1)}</h1>
      <p class="pagina-lede">${e(p.lede)}</p>
${seccions}${perSectors}${bloc_final(lang, clau)}    </div>
  </main>
`;
    return cap(lang, p.titol_seo, p.descripcio, url, alternates, ld) + nav(lang, url_altre) + cos + peu(lang);
  }

  // Pàgina «no trobada»: Cloudflare Pages la serveix amb codi 404 (sense ella, tornaria la portada amb codi 200)
  function pagina_404() {
    const c = COMU.ca;
    const cos = `  <main id="contingut" class="pagina" tabindex="-1">
    <div class="container pagina-contingut legal-content">
      <span class="eyebrow">${e(t('ca', '404.eyebrow'))}</span>
      <h1 class="section-title pagina-h1">${t('ca', '404.h1')}</h1>
      <p class="pagina-lede">${t('ca', '404.lede')}</p>
      <form class="cerca-form cerca-form-404" role="search" method="get" action="/cerca/">
        <label class="cerca-label" for="cerca-404-ca">${e(t('ca', '404.cerca_label'))}</label>
        <div class="cerca-fila">
          <input id="cerca-404-ca" class="cerca-input" type="search" name="q" autocomplete="off" placeholder="${e(t('ca', '404.cerca_placeholder'))}" />
          <button type="submit" class="btn btn-primary cerca-boto">${e(t('ca', '404.cerca_boto'))}</button>
        </div>
      </form>
      <ul class="pagina-altres">
        <li><a href="/">${e(t('ca', '404.enllac_inici'))}</a></li>
        <li><a href="/#serveis">${e(t('ca', '404.enllac_serveis'))}</a></li>
        <li><a href="/diagnostic.html">${e(c.cta_1[0])}</a></li>
        <li><a href="/actualitat/">${e(t('ca', '404.enllac_actualitat'))}</a></li>
        <li><a href="/#contacte">${e(t('ca', '404.enllac_contacte'))}</a></li>
        <li><a href="/es/" lang="es" hreflang="es">${e(t('ca', '404.altre_idioma'))}</a></li>
      </ul>
      <section class="pagina-seccio" lang="es">
        <h2>${e(t('es', '404.h1'))}</h2>
        <p class="pagina-lede">${t('es', '404.lede')}</p>
        <form class="cerca-form cerca-form-404" role="search" method="get" action="/es/buscar/">
          <label class="cerca-label" for="cerca-404-es">${e(t('es', '404.cerca_label'))}</label>
          <div class="cerca-fila">
            <input id="cerca-404-es" class="cerca-input" type="search" name="q" autocomplete="off" placeholder="${e(t('es', '404.cerca_placeholder'))}" />
            <button type="submit" class="btn btn-primary cerca-boto">${e(t('es', '404.cerca_boto'))}</button>
          </div>
        </form>
        <ul class="pagina-altres">
          <li><a href="/es/">${e(t('es', '404.enllac_inici'))}</a></li>
          <li><a href="/es/#servicios">${e(t('es', '404.enllac_serveis'))}</a></li>
          <li><a href="/es/#contacto">${e(t('es', '404.enllac_contacte'))}</a></li>
          <li><a href="/es/preguntas-frecuentes/">${e(t('es', '404.enllac_faq'))}</a></li>
        </ul>
      </section>
    </div>
  </main>
`;
    return cap('ca', t('ca', '404.titol_seo'), t('ca', '404.desc'), '/404.html', [], { '@context': 'https://schema.org', '@graph': [empresa_ld()] },
      { comentari: false, robots: 'noindex', ambCanonica: false }) + nav('ca', '/es/') + cos + peu('ca');
  }

  function portada_es() {
    const p = PORTADA_ES;
    const ld = { '@context': 'https://schema.org', '@graph': [{ ...empresa_ld(), description: p.descripcio, inLanguage: 'es' }] };
    const alternates = [['ca', '/'], ['es', '/es/'], ['x-default', '/']];
    const targetes = SERVEIS.map(
      k => `<li><a href="${url_servei('es', k)}"><strong>${e(PAGINES[k].es.curt)}</strong><span>${e(PAGINES[k].es.lede)}</span></a></li>`)
      .join('');
    const c = COMU.es;
    const passos = c.metode.map(({ titol: tit, text: d }, i) => `<li><span class="pas-num">${String(i + 1).padStart(2, '0')}</span><strong>${e(tit)}</strong><span>${e(d)}</span></li>`).join('');
    const cos = `  <main id="contingut" class="pagina" tabindex="-1">
    <div class="container pagina-contingut legal-content">
      <span class="eyebrow">${e(p.eyebrow)}</span>
      <h1 class="section-title pagina-h1 pagina-h1-gran">${enriquit(p.h1)}</h1>
      <p class="pagina-lede">${e(p.lede)}</p>
      <section class="pagina-seccio" id="servicios">
        <h2>${e(p.serveis_titol)}</h2>
        <ul class="pagina-serveis">${targetes}</ul>
      </section>
      <section class="pagina-seccio" id="metodo">
        <h2>${e(c.metode_titol)}</h2>
        <ol class="passos-metode">${passos}</ol>
      </section>
      <section class="pagina-seccio">
        <h2>${e(c.zona_titol)}</h2>
        <p>${e(zona_text('es'))}</p>
      </section>
      <aside class="pagina-cta" id="contacto">
        <h2>${e(p.contacte_titol)}</h2>
        <p>${e(p.contacte_text)}</p>
        <p><a href="mailto:${NAP.correu}">${NAP.correu}</a> · <a href="tel:${NAP.telefon}">${NAP.telefon_visible}</a> · ${e(t('es', 'serveis.zona_peu'))}</p>
        <div class="pagina-cta-botons">
          <a class="btn btn-primary" href="mailto:${NAP.correu}">${e(t('es', 'serveis.escriu_nos'))}</a>
          <a class="btn btn-ghost" href="https://wa.me/${NAP.telefon.replace(/^\++/, '')}" target="_blank" rel="noopener">${e(t('es', 'comu.whatsapp'))}</a>
        </div>
      </aside>
    </div>
  </main>
`;
    return cap('es', p.titol_seo, p.descripcio, '/es/', alternates, ld) + nav('es', '/', '/es/') + cos + peu('es');
  }

  const pagines = [];
  for (const lang of ['ca', 'es']) {
    for (const clau of SERVEIS) {
      pagines.push([`${CARPETA[lang]}/${SLUG[lang][clau]}/index.html`, pagina_servei(lang, clau)]);
    }
  }
  pagines.push(['es/index.html', portada_es()]);
  pagines.push(['404.html', pagina_404()]);
  return pagines;
}
