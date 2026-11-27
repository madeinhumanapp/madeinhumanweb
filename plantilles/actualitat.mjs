// Notícies i guies (WEB-A01 / WEB-T06 / WEB-G03 / WEB-G04): contingut/actualitat/AAAA-MM-DD-titol-curt.md →
// targetes de la portada, llistats /actualitat/ i /es/actualidad/, pàgina pròpia de cada notícia/guia amb cos i RSS.
// Format del fitxer: capçalera «clau: valor» entre dues línies «---», cos en Markdown i, opcionalment,
// una altra línia «---» seguida de notes de revisió (no es publiquen mai).
import { markdown } from './markdown.mjs';
import { enriquit } from './text.mjs';
import { marcInterior } from './serveis.mjs';
import { t } from './textos.mjs';

const ETIQUETA = { rgpd: ['rgpd', 'RGPD'], ia: ['ia', 'AI Act'], apdcat: ['cat', 'APDCat'] };
const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const MESOS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const RUTA = '/actualitat/';
export const RUTA_ES = '/es/actualidad/';
const RUTA_ACT = { ca: RUTA, es: RUTA_ES };
const RUTES_IDIOMA = {
  ca: { contacteHref: '/#contacte', altreHome: '/es/' },
  es: { contacteHref: '/es/#contacto', altreHome: '/' },
};

/** Llegeix un fitxer de notícia. No valida (ho fa esquema/blocs.mjs → validarNoticia). */
export function llegirNoticia(text, fitxer) {
  const linies = text.replace(/\r\n/g, '\n').split('\n');
  const cap = {};
  let i = 0;
  if (linies[0]?.trim() === '---') {
    for (i = 1; i < linies.length && linies[i].trim() !== '---'; i++) {
      const m = /^([a-z_]+):\s*(.*)$/.exec(linies[i]);
      if (!m) continue;
      let v = m[2].trim();
      if (v.startsWith('"')) {
        const f = v.lastIndexOf('"');
        v = v.slice(1, f > 0 ? f : undefined).replace(/\\"/g, '"');
      } else v = v.replace(/\s+#.*$/, '').trim();
      if (v !== '') cap[m[1]] = v;
    }
    i++;
  }
  const resta = linies.slice(i);
  const tall = resta.findIndex(l => /^---\s*$/.test(l));
  const cos = (tall < 0 ? resta : resta.slice(0, tall)).join('\n').trim();
  return { fitxer, slug: fitxer.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''), cap, cos };
}

const parts = iso => iso.split('-').map(Number);
export function dataCurta(iso) {
  const [a, m] = parts(iso);
  return `${MESOS[m - 1][0].toUpperCase()}${MESOS[m - 1].slice(1)} ${a}`;
}
function dataCurtaIdioma(iso, lang = 'ca') {
  if (lang !== 'es') return dataCurta(iso);
  const [a, m] = parts(iso);
  return `${MESOS_ES[m - 1][0].toUpperCase()}${MESOS_ES[m - 1].slice(1)} ${a}`;
}
export function dataLlarga(iso) {
  const [a, m, d] = parts(iso);
  const mes = MESOS[m - 1];
  return `${d} ${/^[aeiou]/.test(mes) ? "d'" : 'de '}${mes} de ${a}`;
}
function dataLlargaIdioma(iso, lang = 'ca') {
  if (lang !== 'es') return dataLlarga(iso);
  const [a, m, d] = parts(iso);
  return `${d} de ${MESOS_ES[m - 1]} de ${a}`;
}
const dataRss = iso => new Date(`${iso}T08:00:00Z`).toUTCString().replace('GMT', '+0000');

/** Publicades a `avui` (AAAA-MM-DD), de la més nova a la més antiga. */
export function publicades(noticies, avui) {
  return noticies.filter(n => n.cap.estat === 'publicat' && n.cap.data <= avui)
    .sort((a, b) => b.cap.data.localeCompare(a.cap.data) || a.slug.localeCompare(b.slug));
}

/** Esborranys amb cos, de la data més nova a la més antiga (només per a vistes prèvies / --esborranys). */
export function esborranysActualitat(noticies) {
  return noticies.filter(n => n.cap.estat === 'esborrany' && teCos(n))
    .sort((a, b) => b.cap.data.localeCompare(a.cap.data) || a.slug.localeCompare(b.slug));
}

export const teCos = n => Boolean(n.cos.trim());
export const urlNoticia = n => `${RUTA_ACT[n.cap?.idioma || 'ca']}${n.slug}/`;

/** Dades de la targeta (les pinta el bloc «actualitat» de plantilles/blocs.mjs). */
export function targeta(n) {
  const [variant, tag] = ETIQUETA[n.cap.etiqueta];
  const c = n.cap;
  const lang = c.idioma || 'ca';
  return {
    variant, tag,
    data: c.data_text || dataCurtaIdioma(c.data, lang),
    titol: c.titol,
    cos: c.resum,
    font: c.font_text || `${t(lang, 'comu.font_prefix')} ${c.font_nom}${c.data_font ? ` · ${dataCurtaIdioma(c.data_font, lang)}` : ''}`,
    href: teCos(n) ? urlNoticia(n) : null,
  };
}

// Text pla d'un camp enriquit (per a <title> i descripcions)
const pla = s => String(s).replace(/\*\*?(.+?)\*\*?/g, '$1').replace(/\n/g, ' ');

/** Temps de lectura estimat (paraules del cos / 200, arrodonit amunt, mínim 1). */
export function tempsLectura(cos) {
  const net = String(cos || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_>#|]/g, ' ')
    .trim();
  const paraules = net ? net.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(paraules / 200));
}

function slugTitol(text) {
  const des = String(text)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/l·l/gi, 'll')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return des || 'seccio';
}

/** Afegeix ids estables i únics als <h2> d'una guia i en retorna la llista per construir l'índex. */
function afegirIdsH2(htmlCos) {
  const vistos = new Set();
  const h2s = [];
  const html = htmlCos.replace(/<h2>([\s\S]*?)<\/h2>/g, (tot, inner) => {
    const base = slugTitol(inner);
    let id = base;
    let k = 2;
    while (vistos.has(id)) id = `${base}-${k++}`;
    vistos.add(id);
    const textEscapat = inner.replace(/<[^>]+>/g, '');
    h2s.push({ id, textEscapat });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html, h2s };
}

/** Ressalta cada [REVISAR…] dins del contingut visible (<main>) d'una pàgina d'esborrany i hi afegeix la caixa resum. */
export function ressaltarRevisar(html, lang = 'ca') {
  const mMain = /(<main\b[^>]*>)([\s\S]*?)(<\/main>)/i.exec(html);
  if (!mMain) return { html, marques: [] };
  const [sencer, obre, cosMain, tanca] = mMain;
  // Protegeix les molles i la franja d'esborrany per no duplicar ni alterar marques fora del cos
  const protegits = [];
  let treball = cosMain.replace(/<nav\b[^>]*class="molles"[^>]*>[\s\S]*?<\/nav>|<p\b[^>]*class="sector-esborrany"[^>]*>[\s\S]*?<\/p>/gi,
    m => `\u0000P${protegits.push(m) - 1}\u0000`);
  const marques = [];
  treball = treball.replace(/(<[^>]+>)|([^<]+)/g, (tot, etiq, text) => {
    if (etiq) return etiq;
    return text.replace(/\[REVISAR[^\]]*\]/g, marca => {
      const n = marques.length + 1;
      marques.push({ n, text: marca });
      return `<mark class="revisar" id="revisar-${n}">${marca}</mark>`;
    });
  });
  treball = treball.replace(/\u0000P(\d+)\u0000/g, (_, i) => protegits[Number(i)]);
  if (marques.length) {
    const titol = t(lang, 'comu.marques_pendents', { n: marques.length });
    const caixa = `      <aside class="revisar-caixa" aria-label="${titol}">
        <h2>${titol}</h2>
        <ol>
${marques.map(({ n, text }) => `          <li><a href="#revisar-${n}">#${n}</a> ${text}</li>`).join('\n')}
        </ol>
      </aside>
`;
    const idxFinal = treball.lastIndexOf('</div>');
    treball = idxFinal >= 0
      ? treball.slice(0, idxFinal) + caixa + treball.slice(idxFinal)
      : treball + caixa;
  }
  const resultat = html.slice(0, mMain.index) + obre + treball + tanca + html.slice(mMain.index + sencer.length);
  return { html: resultat, marques };
}

function mapaGrups(noticies) {
  const grups = new Map();
  for (const n of (noticies || []).filter(teCos)) {
    const gr = n.cap?.grup_hreflang;
    if (!gr) continue;
    const g = grups.get(gr) || {};
    g[n.cap.idioma || 'ca'] = n;
    grups.set(gr, g);
  }
  return grups;
}

const urlSectorSimple = s => `${s.idioma === 'es' ? '/es/sectores/' : '/sectors/'}${s.slug}/`;

function renderArticle(n, { m, dades, bloc, altres = [], esborrany = false, grups = new Map(), ambLlistat = { ca: true, es: false }, sectorsVisibles = [] }) {
  const { WEB, e } = m;
  const k = n.cap;
  const lang = k.idioma || 'ca';
  const rutes = RUTES_IDIOMA[lang];
  const c = dades.COMU[lang];
  const rutaLlistat = RUTA_ACT[lang];
  const etiquetaLlistat = lang === 'es' ? t(lang, 'actualitat.etiqueta') : bloc.etiqueta;
  const url = urlNoticia(n);
  const [, tag] = ETIQUETA[k.etiqueta];
  const esGuia = k.tipus_article === 'guia';

  const parella = k.grup_hreflang ? grups.get(k.grup_hreflang) : null;
  const teParella = Boolean(parella && parella.ca && parella.es);
  const alternates = teParella
    ? [['ca', urlNoticia(parella.ca)], ['es', urlNoticia(parella.es)], ['x-default', urlNoticia(parella.ca)]]
    : [[lang, url], ['x-default', url]];
  const urlAltre = teParella ? urlNoticia(parella[lang === 'ca' ? 'es' : 'ca']) : rutes.altreHome;

  const rss = ambLlistat[lang]
    ? `  <link rel="alternate" type="application/rss+xml" title="Madeinhuman · ${e(etiquetaLlistat)}" href="${WEB}${rutaLlistat}rss.xml" />\n`
    : '';
  const cta = `      <aside class="pagina-cta">
        <h2>${e(c.cta_titol)}</h2>
        <p>${e(c.cta_text)}</p>
        <div class="pagina-cta-botons">
          <a class="btn btn-primary" href="${c.cta_1[1]}">${e(c.cta_1[0])}</a>
          <a class="btn btn-ghost" href="${c.cta_2[1]}">${e(c.cta_2[0])}</a>
        </div>
      </aside>
`;
  const fontsExtres = k.fonts_addicionals ? k.fonts_addicionals.split('|').map(s => s.trim()).filter(Boolean) : [];
  const cites = fontsExtres.length ? [...new Set([...(k.font_url ? [k.font_url] : []), ...fontsExtres])] : [];
  const descSeo = k.meta_descripcio || k.resum;
  const ld = { '@context': 'https://schema.org', '@graph': [
    m.empresa_ld(),
    { '@type': esGuia ? 'Article' : 'NewsArticle', headline: k.titol, description: k.resum,
      datePublished: k.data, dateModified: k.data_revisio || k.data, inLanguage: lang,
      url: WEB + url, mainEntityOfPage: WEB + url, image: `${WEB}/og-image.png`,
      author: { '@id': `${WEB}/#empresa` }, publisher: { '@id': `${WEB}/#empresa` },
      ...(k.font_url ? { isBasedOn: k.font_url } : {}),
      ...(cites.length ? { citation: cites } : {}) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
      { '@type': 'ListItem', position: 2, name: etiquetaLlistat, item: WEB + rutaLlistat },
      { '@type': 'ListItem', position: 3, name: k.titol, item: WEB + url }] },
  ] };
  const revisio = k.data_revisio
    ? `      <p class="noticia-revisio">${e(t(lang, 'comu.revisio_prefix'))} <time datetime="${e(k.data_revisio)}">${dataLlargaIdioma(k.data_revisio, lang)}</time> · ${e(k.revisat_per || t(lang, 'comu.revisat_defecte'))}</p>
` : '';
  const lectura = esGuia ? `      <p class="guia-lectura">${e(t(lang, 'comu.lectura_min', { n: tempsLectura(n.cos) }))}</p>\n` : '';
  let cosHtml = markdown(n.cos);
  let indexHtml = '';
  if (esGuia) {
    const ambIds = afegirIdsH2(cosHtml);
    cosHtml = ambIds.html;
    if (ambIds.h2s.length >= 3) {
      const indexTitol = t(lang, 'actualitat.index_guia');
      indexHtml = `      <nav class="guia-index" aria-label="${e(indexTitol)}">
        <h2>${e(indexTitol)}</h2>
        <ol>
${ambIds.h2s.map(h => `          <li><a href="#${h.id}">${h.textEscapat}</a></li>`).join('\n')}
        </ol>
      </nav>
`;
    }
  }
  // Bloc «Fonts» / «Fuentes» si hi ha fonts_addicionals; si només hi ha font_url, es manté la línia «Font: …»
  const fontsTitol = t(lang, 'comu.fonts_titol');
  const font = fontsExtres.length
    ? `      <section class="noticia-fonts" aria-label="${e(fontsTitol)}">
        <h2>${e(fontsTitol)}</h2>
        <ul>
${cites.map((u, idx) => (idx === 0 && k.font_url && u === k.font_url
    ? `          <li><a href="${e(u)}" target="_blank" rel="noopener">${e(k.font_nom)}</a>${k.data_font ? `, ${dataLlargaIdioma(k.data_font, lang)}` : ''}</li>`
    : `          <li><a href="${e(u)}" target="_blank" rel="noopener">${e(u)}</a></li>`)).join('\n')}
        </ul>
      </section>
`
    : (!k.font_url || n.cos.includes(`](${k.font_url})`) ? '' : `      <p class="noticia-font">${e(t(lang, 'comu.font_prefix'))} <a href="${e(k.font_url)}" target="_blank" rel="noopener">${e(k.font_nom)}</a>${k.data_font ? `, ${dataLlargaIdioma(k.data_font, lang)}` : ''}</p>
`);
  const servei = k.servei_relacionat ? `      <p class="noticia-servei">${e(t(lang, 'comu.interessa'))} <a href="${m.url_servei(lang, k.servei_relacionat)}">${e(dades.PAGINES[k.servei_relacionat][lang].curt)}</a></p>
` : '';
  const sectorsGuia = esGuia
    ? [...(sectorsVisibles || [])]
      .filter(s => (s.idioma || 'ca') === lang && Array.isArray(s.articles_relacionats) && s.articles_relacionats.includes(n.slug))
      .sort((a, b) => a.slug.localeCompare(b.slug))
    : [];
  const sectorsAplica = t(lang, 'actualitat.sectors_aplica');
  const sectorsHtml = sectorsGuia.length ? `      <nav class="pagina-seccio" aria-label="${e(sectorsAplica)}">
        <h2>${e(sectorsAplica)}</h2>
        <ul class="pagina-altres">${sectorsGuia.map(s => `<li><a href="${urlSectorSimple(s)}">${e(s.h1)}</a></li>`).join('')}</ul>
      </nav>
` : '';
  const ctaArticle = k.cta_desti ? (() => {
    const desti = k.cta_desti === 'diagnostic' ? '/diagnostic'
      : k.cta_desti === 'contacte' ? rutes.contacteHref
      : m.url_servei(lang, k.servei_relacionat);
    const textBoto = k.cta_text || t(lang, `comu.cta_${k.cta_desti}`);
    return `      <aside class="noticia-cta">
        <h2>${e(c.cta_titol)}</h2>
        <a class="btn btn-primary" href="${desti}">${e(textBoto)}</a>
      </aside>
`;
  })() : cta;
  const mollaActualitat = ambLlistat[lang] ? `<a href="${rutaLlistat}">${e(etiquetaLlistat)}</a>` : e(etiquetaLlistat);
  const esborranysMolla = t(lang, 'comu.esborranys');
  const mollaEsborranys = lang === 'es'
    ? `<a href="/esborranys/">${e(esborranysMolla)}</a>`
    : `<a href="${RUTA}esborranys/">${e(esborranysMolla)}</a>`;
  const rutaAria = e(t(lang, 'comu.ruta'));
  const molles = esborrany
    ? `      <nav class="molles" aria-label="${rutaAria}"><a href="${c.home}">${e(c.inici)}</a> › ${mollaActualitat} › ${mollaEsborranys} › <span aria-current="page">${e(k.titol)}</span></nav>`
    : `      <nav class="molles" aria-label="${rutaAria}"><a href="${c.home}">${e(c.inici)}</a> › ${mollaActualitat} › <span aria-current="page">${e(k.titol)}</span></nav>`;
  const franja = esborrany ? `      <p class="sector-esborrany" role="note">${e(t(lang, 'comu.esborrany'))}</p>\n` : '';
  const mesNoticies = t(lang, 'actualitat.mes_noticies');
  const html = m.cap(lang, `${k.titol} · Madeinhuman`, descSeo, url, alternates, ld, {
    ogType: 'article', comentari: false,
    ...(esborrany ? { robots: 'noindex, nofollow' } : {}),
    capExtra: rss + `  <meta property="article:published_time" content="${k.data}" />\n`,
  })
    + m.nav(lang, urlAltre) + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
${molles}
${franja}      <span class="eyebrow">${e(tag)} · <time datetime="${k.data}">${dataLlargaIdioma(k.data, lang)}</time></span>
      <h1 class="section-title pagina-h1">${e(k.titol)}</h1>
${revisio}${lectura}      <p class="pagina-lede">${e(k.resum)}</p>
${indexHtml}      <article class="noticia-cos">
${cosHtml}
      </article>
${font}${servei}${sectorsHtml}${ctaArticle}${altres.length ? `      <nav class="pagina-seccio" aria-label="${e(mesNoticies)}">
        <h2>${e(mesNoticies)}</h2>
        <ul class="pagina-altres">${altres.map(x => `<li><a href="${teCos(x) ? urlNoticia(x) : rutaLlistat}">${e(x.cap.titol)}</a></li>`).join('')}</ul>
      </nav>
` : ''}    </div>
  </main>
` + m.peu(lang);
  return esborrany ? ressaltarRevisar(html, lang).html : html;
}

/** → [[ruta relativa, contingut], …]: llistat (/actualitat/ i /es/actualidad/ si n'hi ha), pàgines amb cos i rss.xml per idioma. */
export function paginesActualitat(lloc, dades, noticies, bloc, { totesVisibles = noticies, sectorsVisibles = [] } = {}) {
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const out = [];
  const perIdioma = {
    ca: noticies.filter(n => (n.cap.idioma || 'ca') === 'ca'),
    es: noticies.filter(n => n.cap.idioma === 'es'),
  };
  const ambLlistat = { ca: perIdioma.ca.length > 0, es: perIdioma.es.length > 0 };
  const grups = mapaGrups(totesVisibles);

  const targetaHtml = n => {
    const tg = targeta(n);
    const titol = tg.href ? `<a href="${tg.href}">${e(tg.titol)}</a>` : e(tg.titol);
    return `
        <article class="news-card${tg.variant === 'ia' ? ' news-card-ia' : ''}">
          <div class="news-meta">
            <span class="news-tag news-tag-${tg.variant}">${e(tg.tag)}</span>
            <time class="news-date" datetime="${n.cap.data}">${e(tg.data)}</time>
          </div>
          <h2 class="news-title">${titol}</h2>
          <p class="news-body">${e(tg.cos)}</p>
          <div class="news-source">${e(tg.font)}</div>
        </article>`;
  };
  const x = s => String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

  for (const lang of ['ca', 'es']) {
    const llista = perIdioma[lang];
    if (!llista.length) continue;
    const rutes = RUTES_IDIOMA[lang];
    const c = dades.COMU[lang];
    const ruta = RUTA_ACT[lang];
    const etiqueta = lang === 'es' ? t(lang, 'actualitat.etiqueta') : bloc.etiqueta;
    const titolLlistat = lang === 'es' ? t(lang, 'actualitat.titol') : pla(bloc.titol).replace(/\.$/, '');
    const h1Html = lang === 'es' ? t(lang, 'actualitat.h1') : enriquit(bloc.titol);
    const entradeta = lang === 'es' ? t(lang, 'actualitat.entradeta') : pla(bloc.entradeta);
    const rss = `  <link rel="alternate" type="application/rss+xml" title="Madeinhuman · ${e(etiqueta)}" href="${WEB}${ruta}rss.xml" />\n`;
    const alternates = ambLlistat.ca && ambLlistat.es
      ? [['ca', RUTA], ['es', RUTA_ES], ['x-default', RUTA]]
      : [[lang, ruta], ['x-default', ruta]];
    const urlAltre = ambLlistat.ca && ambLlistat.es ? RUTA_ACT[lang === 'ca' ? 'es' : 'ca'] : rutes.altreHome;
    const cta = `      <aside class="pagina-cta">
        <h2>${e(c.cta_titol)}</h2>
        <p>${e(c.cta_text)}</p>
        <div class="pagina-cta-botons">
          <a class="btn btn-primary" href="${c.cta_1[1]}">${e(c.cta_1[0])}</a>
          <a class="btn btn-ghost" href="${c.cta_2[1]}">${e(c.cta_2[0])}</a>
        </div>
      </aside>
`;
    const ldLlistat = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', name: titolLlistat, url: WEB + ruta, inLanguage: lang, publisher: { '@id': `${WEB}/#empresa` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
        { '@type': 'ListItem', position: 2, name: etiqueta, item: WEB + ruta }] },
    ] };
    out.push([`${ruta.slice(1)}index.html`,
      m.cap(lang, `${titolLlistat} · Madeinhuman`, entradeta, ruta, alternates, ldLlistat, { comentari: false, capExtra: rss })
      + m.nav(lang, urlAltre) + `  <main class="pagina">
    <div class="container pagina-contingut">
      <nav class="molles" aria-label="${e(t(lang, 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">${e(etiqueta)}</span></nav>
      <span class="eyebrow">${e(etiqueta)}</span>
      <h1 class="section-title pagina-h1">${h1Html}</h1>
      <p class="pagina-lede">${e(entradeta)}</p>
      <div class="news-grid noticies-llistat">${llista.map(targetaHtml).join('')}
      </div>
      <p class="noticies-rss"><a href="${ruta}rss.xml">${e(t(lang, 'actualitat.rss_link'))}</a></p>
${cta}    </div>
  </main>
` + m.peu(lang)]);

    // Una pàgina per notícia amb cos (dins del seu idioma)
    for (const n of llista.filter(teCos)) {
      const altres = llista.filter(y => y !== n).slice(0, 3);
      out.push([`${urlNoticia(n).slice(1)}index.html`, renderArticle(n, { m, dades, bloc, altres, esborrany: false, grups, ambLlistat, sectorsVisibles })]);
    }

    // Canal RSS per idioma
    out.push([`${ruta.slice(1)}rss.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Madeinhuman · ${x(etiqueta)}</title>
    <link>${WEB}${ruta}</link>
    <description>${x(entradeta)}</description>
    <language>${lang}</language>
    <atom:link href="${WEB}${ruta}rss.xml" rel="self" type="application/rss+xml" />
${llista.map(n => {
      const enllac = teCos(n) ? WEB + urlNoticia(n) : (n.cap.font_url || WEB + ruta);
      return `    <item>
      <title>${x(n.cap.titol)}</title>
      <link>${x(enllac)}</link>
      <guid isPermaLink="false">${WEB}${ruta}${n.slug}</guid>
      <pubDate>${dataRss(n.cap.data)}</pubDate>
      <category>${x(ETIQUETA[n.cap.etiqueta][1])}</category>
      <description>${x(n.cap.resum)}</description>
    </item>`;
    }).join('\n')}
  </channel>
</rss>
`]);
  }
  return out;
}

/** Pàgines d'esborrany d'actualitat (només vistes prèvies / --esborranys): /actualitat/esborranys/ i cada esborrany amb cos. */
export function paginesEsborranysActualitat(lloc, dades, llistaEsborranys, bloc, { totesVisibles = llistaEsborranys, ambLlistat = { ca: true, es: false }, sectorsVisibles = [] } = {}) {
  if (!llistaEsborranys.length) return [];
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const c = dades.COMU.ca;
  const rutaIndex = `${RUTA}esborranys/`;
  const grups = mapaGrups(totesVisibles);
  const ldIndex = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: t('ca', 'actualitat.esb_nom'), url: WEB + rutaIndex, inLanguage: 'ca', publisher: { '@id': `${WEB}/#empresa` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
        { '@type': 'ListItem', position: 2, name: bloc.etiqueta, item: WEB + RUTA },
        { '@type': 'ListItem', position: 3, name: t('ca', 'comu.esborranys'), item: WEB + rutaIndex },
      ] },
    ],
  };
  const mollaAct = ambLlistat.ca ? `<a href="${RUTA}">${e(bloc.etiqueta)}</a>` : e(bloc.etiqueta);
  const items = llistaEsborranys.map(n => `<li><a href="${urlNoticia(n)}"><strong>${e(n.cap.titol)}</strong><span>${e(n.cap.resum)}</span></a></li>`).join('');
  const out = [[`${rutaIndex.slice(1)}index.html`,
    m.cap('ca', t('ca', 'actualitat.esb_titol_seo'), t('ca', 'actualitat.esb_desc'), rutaIndex,
      [['ca', rutaIndex], ['x-default', rutaIndex]], ldIndex, { comentari: false, robots: 'noindex, nofollow' })
    + m.nav('ca', '/es/') + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="${e(t('ca', 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › ${mollaAct} › <span aria-current="page">${e(t('ca', 'comu.esborranys'))}</span></nav>
      <p class="sector-esborrany" role="note">${e(t('ca', 'comu.esborrany'))}</p>
      <span class="eyebrow">${e(t('ca', 'actualitat.esb_eyebrow'))}</span>
      <h1 class="section-title pagina-h1">${e(t('ca', 'actualitat.esb_h1'))}</h1>
      <p class="pagina-lede">${e(t('ca', 'actualitat.esb_lede_prefix'))}<a href="/esborranys/">${e(t('ca', 'actualitat.esb_lede_enllac'))}</a>.</p>
      <ul class="pagina-serveis">${items}</ul>
    </div>
  </main>
` + m.peu('ca')]];
  for (const n of llistaEsborranys) {
    out.push([`${urlNoticia(n).slice(1)}index.html`, renderArticle(n, { m, dades, bloc, altres: [], esborrany: true, grups, ambLlistat, sectorsVisibles })]);
  }
  return out;
}

/** Dates `lastmod` del mapa del lloc per als llistats d'actualitat (ca i es) i les notícies amb pàgina. */
export function datesActualitatMapa(WEB, noticies) {
  const dates = new Map();
  for (const lang of ['ca', 'es']) {
    const llista = (noticies || []).filter(n => (n.cap.idioma || 'ca') === lang);
    if (!llista.length) continue;
    dates.set(`${WEB}${RUTA_ACT[lang]}`, llista[0].cap.data);
    for (const n of llista.filter(teCos)) dates.set(`${WEB}${urlNoticia(n)}`, n.cap.data);
  }
  return dates;
}
