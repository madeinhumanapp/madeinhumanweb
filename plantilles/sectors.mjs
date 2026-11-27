// Plantilla de pàgines de sector (WEB-G01 / WEB-G03): contingut/sectors/<slug>.json → /sectors/<slug>/ (ca)
// o /es/sectores/<slug>/ (es), i índexs /sectors/ i /es/sectores/ (només amb les pàgines publicades).
// Fa servir marcInterior i reaprofita les classes d'actualitat (noticia-revisio, noticia-fonts, noticia-cta)
// i el paràgraf destacat del Markdown (text-destacat).
import { markdown } from './markdown.mjs';
import { enriquit } from './text.mjs';
import { marcInterior } from './serveis.mjs';
import { dataLlarga, ressaltarRevisar, urlNoticia, teCos } from './actualitat.mjs';
import { t } from './textos.mjs';

export const RUTA_SECTORS = '/sectors/';
export const RUTA_SECTORS_ES = '/es/sectores/';
const RUTA_PER_IDIOMA = { ca: RUTA_SECTORS, es: RUTA_SECTORS_ES };
const RUTES_IDIOMA = {
  ca: { contacteHref: '/#contacte', altreHome: '/es/' },
  es: { contacteHref: '/es/#contacto', altreHome: '/' },
};
const MESOS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function dataLlargaIdioma(iso, lang) {
  if (lang !== 'es') return dataLlarga(iso);
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESOS_ES[m - 1]} de ${a}`;
}

export const urlSector = s => `${RUTA_PER_IDIOMA[s.idioma || 'ca']}${s.slug}/`;
const pla = s => String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\n/g, ' ');

/** → [[ruta relativa, html], …]: índexs /sectors/ i /es/sectores/ (si hi ha publicades) i cada pàgina visible. */
export function paginesSectors(lloc, dades, sectors, { ambEsborranys = false, noticiesVisibles = [] } = {}) {
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
    const rutes = RUTES_IDIOMA[lang];
    const c = dades.COMU[lang];
    const rutaIdx = RUTA_PER_IDIOMA[lang];
    const alternates = ambIndex.ca && ambIndex.es
      ? [['ca', RUTA_SECTORS], ['es', RUTA_SECTORS_ES], ['x-default', RUTA_SECTORS]]
      : [[lang, rutaIdx], ['x-default', rutaIdx]];
    const urlAltre = ambIndex.ca && ambIndex.es ? RUTA_PER_IDIOMA[lang === 'ca' ? 'es' : 'ca'] : rutes.altreHome;
    const nomSectors = t(lang, 'sectors.nom');
    const h1Idx = t(lang, 'sectors.h1_idx');
    const ldIndex = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', name: h1Idx, url: WEB + rutaIdx,
          inLanguage: lang, publisher: { '@id': `${WEB}/#empresa` } },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
          { '@type': 'ListItem', position: 2, name: nomSectors, item: WEB + rutaIdx },
        ] },
      ],
    };
    const targetes = pubPerIdioma[lang].map(s => `<li><a href="${urlSector(s)}"><strong>${e(s.h1)}</strong><span>${e(s.entradeta)}</span></a></li>`).join('');
    out.push([`${rutaIdx.slice(1)}index.html`,
      m.cap(lang, t(lang, 'sectors.titol_idx'), t(lang, 'sectors.desc_idx'), rutaIdx, alternates, ldIndex, { comentari: false })
      + m.nav(lang, urlAltre) + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="${e(t(lang, 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">${e(nomSectors)}</span></nav>
      <span class="eyebrow">${e(t(lang, 'sectors.eyebrow_idx'))}</span>
      <h1 class="section-title pagina-h1">${e(h1Idx)}</h1>
      <p class="pagina-lede">${e(t(lang, 'sectors.lede_idx'))}</p>
      <ul class="pagina-serveis">${targetes}</ul>
    </div>
  </main>
` + m.peu(lang)]);
  }

  // 2. Cada pàgina de sector visible (publicades; i esborranys només si ambEsborranys)
  for (const s of visibles) {
    const lang = s.idioma || 'ca';
    const rutes = RUTES_IDIOMA[lang];
    const c = dades.COMU[lang];
    const rutaIdx = RUTA_PER_IDIOMA[lang];
    const url = urlSector(s);
    const esborrany = s.estat === 'esborrany';
    const nomSectors = t(lang, 'sectors.nom');

    const parella = s.grup_hreflang ? grups.get(s.grup_hreflang) : null;
    const teParella = Boolean(parella && parella.ca && parella.es);
    const alternates = teParella
      ? [['ca', urlSector(parella.ca)], ['es', urlSector(parella.es)], ['x-default', urlSector(parella.ca)]]
      : [[lang, url], ['x-default', url]];
    const urlAltre = teParella ? urlSector(parella[lang === 'ca' ? 'es' : 'ca']) : rutes.altreHome;

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
          { '@type': 'ListItem', position: 2, name: nomSectors, item: WEB + rutaIdx },
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
      ? `      <p class="sector-esborrany" role="note">${e(t(lang, 'comu.esborrany'))}</p>\n`
      : '';
    const mollaSectors = ambIndex[lang] ? `<a href="${rutaIdx}">${e(nomSectors)}</a>` : e(nomSectors);
    const revisio = s.data_revisio
      ? `      <p class="noticia-revisio">${e(t(lang, 'comu.revisio_prefix'))} <time datetime="${e(s.data_revisio)}">${dataLlargaIdioma(s.data_revisio, lang)}</time> · ${e(s.revisat_per || t(lang, 'comu.revisat_defecte'))}</p>\n`
      : '';
    const seccions = s.seccions.map(({ titol, cos }) => `      <section class="pagina-seccio">
        <h2>${e(titol)}</h2>
        ${markdown(cos)}
      </section>
`).join('');
    const documents = s.documents?.length ? `      <section class="pagina-seccio sector-documents">
        <h2>${e(t(lang, 'sectors.docs_titol'))}</h2>
        <ul>
${s.documents.map(doc => `          <li>${e(doc)}</li>`).join('\n')}
        </ul>
      </section>
` : '';
    const faqHtml = s.faq?.length ? `      <section class="pagina-seccio sector-faq">
        <h2>${e(t(lang, 'sectors.faq_titol'))}</h2>
        <dl class="sector-faq-llista">
${s.faq.map(f => `          <div class="sector-faq-item">
            <dt>${e(f.pregunta)}</dt>
            <dd>${enriquit(f.resposta)}</dd>
          </div>`).join('\n')}
        </dl>
      </section>
` : '';
    const servei = s.servei_relacionat
      ? `      <p class="noticia-servei">${e(t(lang, 'comu.interessa'))} <a href="${m.url_servei(lang, s.servei_relacionat)}">${e(dades.PAGINES[s.servei_relacionat][lang].curt)}</a></p>\n`
      : '';
    const fontsTitol = t(lang, 'comu.fonts_titol');
    const fonts = s.fonts?.length ? `      <section class="noticia-fonts" aria-label="${e(fontsTitol)}">
        <h2>${e(fontsTitol)}</h2>
        <ul>
${s.fonts.map(f => `          <li><a href="${e(f.url)}" target="_blank" rel="noopener">${e(f.nom)}</a></li>`).join('\n')}
        </ul>
      </section>
` : '';
    const guiesLlista = (s.articles_relacionats || [])
      .map(sl => (noticiesVisibles || []).find(n => n.slug === sl && (n.cap?.idioma || 'ca') === lang && teCos(n)))
      .filter(Boolean);
    const guiesRelTitol = t(lang, 'sectors.guies_rel');
    const guiesHtml = guiesLlista.length ? `      <nav class="pagina-seccio" aria-label="${e(guiesRelTitol)}">
        <h2>${e(guiesRelTitol)}</h2>
        <ul class="pagina-altres">${guiesLlista.map(n => `<li><a href="${urlNoticia(n)}">${e(n.cap.titol)}</a></li>`).join('')}</ul>
      </nav>
` : '';

    const mateixIdioma = visibles.filter(x => x.slug !== s.slug && (x.idioma || 'ca') === lang);
    const mateixSector = mateixIdioma.filter(x => x.sector === s.sector);
    const altresLlista = [...mateixSector, ...mateixIdioma.filter(x => x.sector !== s.sector)].slice(0, 3);
    const altresTitol = t(lang, 'sectors.altres');
    const altresSectorsHtml = altresLlista.length ? `      <nav class="pagina-seccio" aria-label="${e(altresTitol)}">
        <h2>${e(altresTitol)}</h2>
        <ul class="pagina-altres">${altresLlista.map(x => `<li><a href="${urlSector(x)}">${e(x.h1)}</a></li>`).join('')}</ul>
      </nav>
` : '';

    const destiCta = s.cta_desti === 'diagnostic' ? '/diagnostic'
      : s.cta_desti === 'contacte' ? rutes.contacteHref
      : m.url_servei(lang, s.servei_relacionat);
    const textCta = s.cta_text || t(lang, `comu.cta_${s.cta_desti}`);
    const ctaHtml = `      <aside class="noticia-cta">
        <h2>${e(c.cta_titol)}</h2>
        <a class="btn btn-primary" href="${destiCta}">${e(textCta)}</a>
      </aside>
`;
    const etiquetaSector = (() => {
      try { return t(lang, `sectors.etiqueta.${s.sector}`); } catch { return s.sector; }
    })();

    const html = m.cap(lang, s.titol_seo, s.descripcio, url, alternates, ld, {
        comentari: false,
        robots: esborrany ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
      })
      + m.nav(lang, urlAltre) + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="${e(t(lang, 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › ${mollaSectors} › <span aria-current="page">${e(s.h1)}</span></nav>
${franjaEsborrany}      <span class="eyebrow">${e(etiquetaSector)} · Girona</span>
      <h1 class="section-title pagina-h1">${e(s.h1)}</h1>
${revisio}      <p class="pagina-lede">${e(s.entradeta)}</p>
      <blockquote class="text-destacat">
        <p>${enriquit(s.capsula)}</p>
      </blockquote>
${seccions}${documents}${faqHtml}${servei}${guiesHtml}${fonts}${ctaHtml}${altresSectorsHtml}    </div>
  </main>
` + m.peu(lang);
    out.push([`${url.slice(1)}index.html`, esborrany ? ressaltarRevisar(html, lang).html : html]);
  }

  return out;
}

const extreureMarques = text => [...String(text).matchAll(/\[REVISAR[^\]]*\]/g)].map(m => m[0]);

/** Genera el document Markdown amb totes les marques [REVISAR] agrupades per fitxer (WEB-G05b). */
export function generarMarkdownMarques(files, lang = 'ca') {
  const ambMarques = (files || []).filter(f => (f.llistaMarques || []).length > 0);
  const total = ambMarques.reduce((acc, f) => acc + f.llistaMarques.length, 0);
  if (!total) return `${t(lang, 'taula.md_titol')}\n\n${t(lang, 'taula.md_cap')}\n`;
  const blocs = ambMarques.map(f => [
    `## ${f.fitxer} — ${f.titol} (${f.llistaMarques.length})`,
    '',
    ...f.llistaMarques.map(m => `- ${m}`),
  ].join('\n'));
  const totalLinia = t(lang, 'taula.md_total', {
    n: total,
    paraulaMarques: t(lang, total === 1 ? 'taula.md_marca_sg' : 'taula.md_marca_pl'),
    m: ambMarques.length,
    paraulaEsborranys: t(lang, ambMarques.length === 1 ? 'taula.md_esb_sg' : 'taula.md_esb_pl'),
  });
  return `${t(lang, 'taula.md_titol')}\n\n${totalLinia}\n\n${blocs.join('\n\n')}\n`;
}

/** Script petit propi per filtrar /esborranys/ des de l'URL i copiar/descarregar les marques (WEB-G05b). */
export function scriptTaulaEsborranys() {
  return `// Filtres per URL i exportació de marques [REVISAR] de /esborranys/ (WEB-G05b)
(function () {
  var files = Array.prototype.slice.call(document.querySelectorAll('.esborranys-taula tbody tr'));
  var filtresTipus = Array.prototype.slice.call(document.querySelectorAll('[data-filtre-tipus]'));
  var filtresIdioma = Array.prototype.slice.call(document.querySelectorAll('[data-filtre-idioma]'));
  var resum = document.querySelector('[data-esborranys-resum]');
  var totalFiles = files.length;
  var totalMarques = files.reduce(function (acc, tr) { return acc + Number(tr.getAttribute('data-marques') || 0); }, 0);

  function construirUrl(tipus, idioma) {
    var p = new URLSearchParams();
    if (tipus) p.set('tipus', tipus);
    if (idioma) p.set('idioma', idioma);
    var q = p.toString();
    return '/esborranys/' + (q ? '?' + q : '');
  }

  function llegirEstat() {
    var p = new URLSearchParams(window.location.search);
    var tipus = (p.get('tipus') || '').toLowerCase();
    if (tipus === 'notícia') tipus = 'noticia';
    var idioma = (p.get('idioma') || '').toLowerCase();
    return { tipus: tipus, idioma: idioma };
  }

  function aplicar() {
    var estat = llegirEstat();
    var visibles = 0;
    var marquesVisibles = 0;
    files.forEach(function (tr) {
      var okT = !estat.tipus || tr.getAttribute('data-tipus') === estat.tipus;
      var okI = !estat.idioma || tr.getAttribute('data-idioma') === estat.idioma;
      var mostra = okT && okI;
      tr.hidden = !mostra;
      if (mostra) {
        visibles++;
        marquesVisibles += Number(tr.getAttribute('data-marques') || 0);
      }
    });
    filtresTipus.forEach(function (a) {
      var v = a.getAttribute('data-filtre-tipus') || '';
      a.setAttribute('href', construirUrl(v, estat.idioma));
      if (v === estat.tipus) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    filtresIdioma.forEach(function (a) {
      var v = a.getAttribute('data-filtre-idioma') || '';
      a.setAttribute('href', construirUrl(estat.tipus, v));
      if (v === estat.idioma) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (resum) {
      var filtrat = Boolean(estat.tipus || estat.idioma);
      resum.innerHTML = filtrat
        ? '<strong>' + visibles + '</strong> de <strong>' + totalFiles + '</strong> esborranys · <strong>' + marquesVisibles + '</strong> marques <code>[REVISAR]</code> pendents'
        : '<strong>' + totalFiles + '</strong> esborranys · <strong>' + totalMarques + '</strong> marques <code>[REVISAR]</code> pendents';
    }
  }

  filtresTipus.concat(filtresIdioma).forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
      ev.preventDefault();
      var href = a.getAttribute('href');
      if (href && window.history && window.history.pushState) {
        window.history.pushState(null, '', href);
      }
      aplicar();
    });
  });
  window.addEventListener('popstate', aplicar);
  aplicar();

  var fontMd = document.getElementById('esborranys-markdown');
  var avis = document.getElementById('esborranys-avis');
  var btnCopiar = document.getElementById('btn-copiar-marques');
  var btnDescarregar = document.getElementById('btn-descarregar-marques');
  function dirAvis(text) { if (avis) avis.textContent = text; }

  if (btnCopiar && fontMd) {
    btnCopiar.addEventListener('click', function () {
      var md = fontMd.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(md).then(function () {
          dirAvis('Marques copiades al porta-retalls.');
        }, function () {
          dirAvis('No s\\'ha pogut copiar al porta-retalls.');
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = md;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          dirAvis('Marques copiades al porta-retalls.');
        } catch (err) {
          dirAvis('No s\\'ha pogut copiar al porta-retalls.');
        }
        ta.remove();
      }
    });
  }

  if (btnDescarregar && fontMd) {
    btnDescarregar.addEventListener('click', function () {
      var md = fontMd.textContent || '';
      var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'marques-revisar.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      dirAvis('Fitxer marques-revisar.md descarregat.');
    });
  }
})();
`;
}

/** Taula de validació de tots els esborranys (/esborranys/, WEB-G04a / WEB-G05b): només per a vistes prèvies / --esborranys. */
export function paginaTaulaEsborranys(lloc, dades, { sectors = [], noticies = [] } = {}) {
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const c = dades.COMU.ca;
  const ruta = '/esborranys/';

  // Mapa de traduccions visibles per grup_hreflang (sectors i notícies per separat)
  const grupsSectors = new Map();
  for (const s of sectors) {
    if (!s.grup_hreflang) continue;
    const g = grupsSectors.get(s.grup_hreflang) || {};
    g[s.idioma || 'ca'] = s;
    grupsSectors.set(s.grup_hreflang, g);
  }
  const grupsNoticies = new Map();
  for (const n of noticies.filter(teCos)) {
    const gr = n.cap?.grup_hreflang;
    if (!gr) continue;
    const g = grupsNoticies.get(gr) || {};
    g[n.cap.idioma || 'ca'] = n;
    grupsNoticies.set(gr, g);
  }

  const files = [];
  for (const s of sectors) {
    if (s.estat !== 'esborrany') continue;
    const lang = s.idioma || 'ca';
    const parella = s.grup_hreflang ? grupsSectors.get(s.grup_hreflang)?.[lang === 'ca' ? 'es' : 'ca'] : null;
    const textVisible = [
      s.h1, s.entradeta, s.capsula,
      ...(s.seccions || []).flatMap(x => [x.titol, x.cos]),
      ...(s.documents || []),
      ...(s.faq || []).flatMap(x => [x.pregunta, x.resposta]),
    ].join('\n');
    const llistaMarques = extreureMarques(textVisible);
    const fitxer = `contingut/sectors/${s.slug}.json`;
    files.push({
      tipus: t('ca', 'taula.tipus_sector'),
      tipusClau: 'sector',
      idioma: lang,
      titol: s.h1,
      url: urlSector(s),
      marques: llistaMarques.length,
      llistaMarques,
      traduccio: parella ? { url: urlSector(parella), idioma: parella.idioma || 'ca' } : null,
      fitxer,
      nomCurt: `${s.slug}.json`,
    });
  }
  for (const n of noticies) {
    if (n.cap?.estat !== 'esborrany' || !teCos(n)) continue;
    const lang = n.cap.idioma || 'ca';
    const parella = n.cap.grup_hreflang ? grupsNoticies.get(n.cap.grup_hreflang)?.[lang === 'ca' ? 'es' : 'ca'] : null;
    const textVisible = [n.cap.titol, n.cap.resum, n.cos].join('\n');
    const llistaMarques = extreureMarques(textVisible);
    const esGuia = n.cap.tipus_article === 'guia';
    const fitxer = `contingut/actualitat/${n.fitxer}`;
    files.push({
      tipus: t('ca', esGuia ? 'taula.tipus_guia' : 'taula.tipus_noticia'),
      tipusClau: esGuia ? 'guia' : 'noticia',
      idioma: lang,
      titol: n.cap.titol,
      url: urlNoticia(n),
      marques: llistaMarques.length,
      llistaMarques,
      traduccio: parella ? { url: urlNoticia(parella), idioma: parella.cap.idioma || 'ca' } : null,
      fitxer,
      nomCurt: n.fitxer,
    });
  }

  // Ordre: primer les que tenen menys marques, després per tipus i títol
  files.sort((a, b) => a.marques - b.marques || a.tipus.localeCompare(b.tipus, 'ca') || a.titol.localeCompare(b.titol, 'ca'));
  const totalMarques = files.reduce((acc, f) => acc + f.marques, 0);
  const markdownMarques = generarMarkdownMarques(files);

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: t('ca', 'taula.nom'), url: WEB + ruta, inLanguage: 'ca', publisher: { '@id': `${WEB}/#empresa` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
        { '@type': 'ListItem', position: 2, name: t('ca', 'comu.esborranys'), item: WEB + ruta },
      ] },
    ],
  };

  const filtresHtml = files.length ? `      <nav class="esborranys-filtres" aria-label="${e(t('ca', 'taula.filtres_aria'))}">
        <div class="esborranys-filtres-grup">
          <span class="esborranys-filtres-etiqueta">${e(t('ca', 'taula.filtre_tipus'))}</span>
          <a class="esborranys-filtre" data-filtre-tipus="" href="/esborranys/" aria-current="true">${e(t('ca', 'taula.filtre_tots'))}</a>
          <a class="esborranys-filtre" data-filtre-tipus="sector" href="/esborranys/?tipus=sector">${e(t('ca', 'taula.filtre_sectors'))}</a>
          <a class="esborranys-filtre" data-filtre-tipus="guia" href="/esborranys/?tipus=guia">${e(t('ca', 'taula.filtre_guies'))}</a>
          <a class="esborranys-filtre" data-filtre-tipus="noticia" href="/esborranys/?tipus=noticia">${e(t('ca', 'taula.filtre_noticies'))}</a>
        </div>
        <div class="esborranys-filtres-grup">
          <span class="esborranys-filtres-etiqueta">${e(t('ca', 'taula.filtre_idioma'))}</span>
          <a class="esborranys-filtre" data-filtre-idioma="" href="/esborranys/" aria-current="true">${e(t('ca', 'taula.filtre_tots'))}</a>
          <a class="esborranys-filtre" data-filtre-idioma="ca" href="/esborranys/?idioma=ca">${e(t('ca', 'taula.filtre_ca'))}</a>
          <a class="esborranys-filtre" data-filtre-idioma="es" href="/esborranys/?idioma=es">${e(t('ca', 'taula.filtre_es'))}</a>
        </div>
      </nav>
` : '';

  const accionsHtml = files.length ? `      <div class="esborranys-accions">
        <button type="button" class="btn btn-primary esborranys-accio" id="btn-copiar-marques"${totalMarques ? '' : ' disabled'}>${e(t('ca', 'taula.btn_copiar'))}</button>
        <button type="button" class="btn btn-ghost esborranys-accio" id="btn-descarregar-marques"${totalMarques ? '' : ' disabled'}>${e(t('ca', 'taula.btn_descarregar'))}</button>
        <span class="esborranys-avis" id="esborranys-avis" role="status" aria-live="polite"></span>
      </div>
` : '';
  const markdownHtml = files.length ? `      <pre id="esborranys-markdown" hidden>${e(markdownMarques)}</pre>\n` : '';

  const cosTaula = files.length ? `      <div class="esborranys-taula-wrap">
        <table class="esborranys-taula">
          <thead>
            <tr>
              <th scope="col">${e(t('ca', 'taula.col_tipus'))}</th>
              <th scope="col">${e(t('ca', 'taula.col_idioma'))}</th>
              <th scope="col">${e(t('ca', 'taula.col_titol'))}</th>
              <th scope="col">${e(t('ca', 'taula.col_marques'))}</th>
              <th scope="col">${e(t('ca', 'taula.col_traduccio'))}</th>
              <th scope="col">${e(t('ca', 'taula.col_fitxer'))}</th>
            </tr>
          </thead>
          <tbody>
${files.map(f => {
    const detallMarques = f.marques ? `
                <details class="esborranys-detall">
                  <summary>${e(f.marques === 1 ? t('ca', 'taula.veure_1_marca') : t('ca', 'taula.veure_n_marques', { n: f.marques }))}</summary>
                  <ol class="esborranys-marques-llista">
${f.llistaMarques.map(marca => `                    <li>${e(marca)}</li>`).join('\n')}
                  </ol>
                </details>` : '';
    return `            <tr data-tipus="${e(f.tipusClau)}" data-idioma="${e(f.idioma)}" data-marques="${f.marques}">
              <td>${e(f.tipus)}</td>
              <td>${e(f.idioma)}</td>
              <td><a href="${e(f.url)}">${e(f.titol)}</a>${detallMarques}</td>
              <td class="esborranys-marques${f.marques === 0 ? ' esborranys-marques-zero' : ''}">${f.marques}</td>
              <td>${f.traduccio ? `<a href="${e(f.traduccio.url)}">${e(t('ca', 'taula.versio_idioma', { idioma: f.traduccio.idioma.toUpperCase() }))}</a>` : '—'}</td>
              <td class="esborranys-fitxer"><code title="${e(f.fitxer)}">${e(f.nomCurt)}</code></td>
            </tr>`;
  }).join('\n')}
          </tbody>
        </table>
      </div>
` : `      <p>${e(t('ca', 'taula.buit'))}</p>\n`;

  const guiaPublicacioHtml = `      <aside class="esborranys-guia" aria-labelledby="esborranys-guia-titol">
        <h2 id="esborranys-guia-titol">${e(t('ca', 'taula.guia_titol'))}</h2>
        <ol>
          <li>${e(t('ca', 'taula.guia_pas_1_a'))}<code>[REVISAR]</code>${e(t('ca', 'taula.guia_pas_1_b'))}</li>
          <li>${e(t('ca', 'taula.guia_pas_2_a'))}<code>estat: publicat</code>${e(t('ca', 'taula.guia_pas_2_b'))}<code>data_revisio</code>${e(t('ca', 'taula.guia_pas_2_c'))}</li>
          <li>${e(t('ca', 'taula.guia_pas_3'))}</li>
        </ol>
      </aside>
`;

  return ['esborranys/index.html',
    m.cap('ca', t('ca', 'taula.titol_seo'), t('ca', 'taula.desc'), ruta,
      [['ca', ruta], ['x-default', ruta]], ld, { comentari: false, robots: 'noindex, nofollow' })
    + m.nav('ca', '/es/') + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="${e(t('ca', 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">${e(t('ca', 'comu.esborranys'))}</span></nav>
      <p class="sector-esborrany" role="note">${e(t('ca', 'comu.esborrany'))}</p>
      <span class="eyebrow">${e(t('ca', 'taula.eyebrow'))}</span>
      <h1 class="section-title pagina-h1">${e(t('ca', 'taula.nom'))}</h1>
      <p class="pagina-lede">${e(t('ca', 'taula.lede'))}</p>
      <p class="esborranys-resum" data-esborranys-resum aria-live="polite"><strong>${files.length}</strong> ${e(t('ca', 'taula.resum_esborranys'))} · <strong>${totalMarques}</strong> ${e(t('ca', 'taula.resum_marques'))} <code>[REVISAR]</code> ${e(t('ca', 'taula.resum_pendents'))}</p>
${accionsHtml}${filtresHtml}${cosTaula}${guiaPublicacioHtml}${markdownHtml}    </div>
  </main>
  <script src="/esborranys/esborranys.js" defer></script>
` + m.peu('ca')];
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
