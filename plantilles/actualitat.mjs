// Notícies (WEB-A01): contingut/actualitat/AAAA-MM-DD-titol-curt.md → targetes de la portada,
// llistat /actualitat/, pàgina pròpia de cada notícia amb cos i canal RSS.
// Format del fitxer: capçalera «clau: valor» entre dues línies «---», cos en Markdown i, opcionalment,
// una altra línia «---» seguida de notes de revisió (no es publiquen mai).
import { markdown } from './markdown.mjs';
import { enriquit } from './text.mjs';
import { marcInterior } from './serveis.mjs';

const ETIQUETA = { rgpd: ['rgpd', 'RGPD'], ia: ['ia', 'AI Act'], apdcat: ['cat', 'APDCat'] };
const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const REVISAT_PER_DEFECTE = 'Revisat per un consultor RGPD i DPO extern de madeinhuman';
const CTA_TEXT_DEFECTE = { diagnostic: 'Fer el diagnòstic gratuït', contacte: 'Parla amb nosaltres', servei: 'Veure el servei' };
export const RUTA = '/actualitat/';

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
export function dataLlarga(iso) {
  const [a, m, d] = parts(iso);
  const mes = MESOS[m - 1];
  return `${d} ${/^[aeiou]/.test(mes) ? "d'" : 'de '}${mes} de ${a}`;
}
const dataRss = iso => new Date(`${iso}T08:00:00Z`).toUTCString().replace('GMT', '+0000');

/** Publicades a `avui` (AAAA-MM-DD), de la més nova a la més antiga. */
export function publicades(noticies, avui) {
  return noticies.filter(n => n.cap.estat === 'publicat' && n.cap.data <= avui)
    .sort((a, b) => b.cap.data.localeCompare(a.cap.data) || a.slug.localeCompare(b.slug));
}

export const teCos = n => Boolean(n.cos.trim());
export const urlNoticia = n => `${RUTA}${n.slug}/`;

/** Dades de la targeta (les pinta el bloc «actualitat» de plantilles/blocs.mjs). */
export function targeta(n) {
  const [variant, tag] = ETIQUETA[n.cap.etiqueta];
  const c = n.cap;
  return {
    variant, tag,
    data: c.data_text || dataCurta(c.data),
    titol: c.titol,
    cos: c.resum,
    font: c.font_text || `Font: ${c.font_nom}${c.data_font ? ` · ${dataCurta(c.data_font)}` : ''}`,
    href: teCos(n) ? urlNoticia(n) : null,
  };
}

// Text pla d'un camp enriquit (per a <title> i descripcions)
const pla = s => String(s).replace(/\*\*?(.+?)\*\*?/g, '$1').replace(/\n/g, ' ');

/** → [[ruta relativa, contingut], …]: llistat, una pàgina per notícia amb cos i rss.xml */
export function paginesActualitat(lloc, dades, noticies, bloc) {
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const c = dades.COMU.ca;
  const rss = `  <link rel="alternate" type="application/rss+xml" title="Madeinhuman · ${e(bloc.etiqueta)}" href="${WEB}${RUTA}rss.xml" />\n`;
  const out = [];
  const targetaHtml = n => {
    const t = targeta(n);
    const titol = t.href ? `<a href="${t.href}">${e(t.titol)}</a>` : e(t.titol);
    return `
        <article class="news-card${t.variant === 'ia' ? ' news-card-ia' : ''}">
          <div class="news-meta">
            <span class="news-tag news-tag-${t.variant}">${e(t.tag)}</span>
            <time class="news-date" datetime="${n.cap.data}">${e(t.data)}</time>
          </div>
          <h2 class="news-title">${titol}</h2>
          <p class="news-body">${e(t.cos)}</p>
          <div class="news-source">${e(t.font)}</div>
        </article>`;
  };
  const molles = (actual, mig) => `      <nav class="molles" aria-label="Ruta"><a href="${c.home}">${e(c.inici)}</a> › ${mig ? `<a href="${RUTA}">${e(bloc.etiqueta)}</a> › ` : ''}<span aria-current="page">${e(actual)}</span></nav>`;
  const cta = `      <aside class="pagina-cta">
        <h2>${e(c.cta_titol)}</h2>
        <p>${e(c.cta_text)}</p>
        <div class="pagina-cta-botons">
          <a class="btn btn-primary" href="${c.cta_1[1]}">${e(c.cta_1[0])}</a>
          <a class="btn btn-ghost" href="${c.cta_2[1]}">${e(c.cta_2[0])}</a>
        </div>
      </aside>
`;

  // Llistat
  const titolLlistat = pla(bloc.titol).replace(/\.$/, '');
  const ldLlistat = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', name: titolLlistat, url: WEB + RUTA, inLanguage: 'ca', publisher: { '@id': `${WEB}/#empresa` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
      { '@type': 'ListItem', position: 2, name: bloc.etiqueta, item: WEB + RUTA }] },
  ] };
  out.push([`${RUTA.slice(1)}index.html`,
    m.cap('ca', `${titolLlistat} · Madeinhuman`, pla(bloc.entradeta), RUTA, [['ca', RUTA], ['x-default', RUTA]], ldLlistat, { comentari: false, capExtra: rss })
    + m.nav('ca', '/es/') + `  <main class="pagina">
    <div class="container pagina-contingut">
${molles(bloc.etiqueta)}
      <span class="eyebrow">${e(bloc.etiqueta)}</span>
      <h1 class="section-title pagina-h1">${enriquit(bloc.titol)}</h1>
      <p class="pagina-lede">${e(pla(bloc.entradeta))}</p>
      <div class="news-grid noticies-llistat">${noticies.map(targetaHtml).join('')}
      </div>
      <p class="noticies-rss"><a href="${RUTA}rss.xml">Segueix les novetats per RSS</a></p>
${cta}    </div>
  </main>
` + m.peu('ca')]);

  // Una pàgina per notícia amb cos
  for (const n of noticies.filter(teCos)) {
    const k = n.cap, url = urlNoticia(n), [, tag] = ETIQUETA[k.etiqueta];
    const fontsExtres = k.fonts_addicionals ? k.fonts_addicionals.split('|').map(s => s.trim()).filter(Boolean) : [];
    const cites = fontsExtres.length ? [...new Set([...(k.font_url ? [k.font_url] : []), ...fontsExtres])] : [];
    const descSeo = k.meta_descripcio || k.resum;
    const ld = { '@context': 'https://schema.org', '@graph': [
      m.empresa_ld(),
      { '@type': k.tipus_article === 'guia' ? 'Article' : 'NewsArticle', headline: k.titol, description: k.resum,
        datePublished: k.data, dateModified: k.data_revisio || k.data, inLanguage: 'ca',
        url: WEB + url, mainEntityOfPage: WEB + url, image: `${WEB}/og-image.png`,
        author: { '@id': `${WEB}/#empresa` }, publisher: { '@id': `${WEB}/#empresa` },
        ...(k.font_url ? { isBasedOn: k.font_url } : {}),
        ...(cites.length ? { citation: cites } : {}) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
        { '@type': 'ListItem', position: 2, name: bloc.etiqueta, item: WEB + RUTA },
        { '@type': 'ListItem', position: 3, name: k.titol, item: WEB + url }] },
    ] };
    const revisio = k.data_revisio
      ? `      <p class="noticia-revisio">Darrera revisió jurídica: <time datetime="${e(k.data_revisio)}">${dataLlarga(k.data_revisio)}</time> · ${e(k.revisat_per || REVISAT_PER_DEFECTE)}</p>
` : '';
    // Bloc «Fonts» si hi ha fonts_addicionals; si només hi ha font_url, es manté la línia «Font: …» d'ara
    const font = fontsExtres.length
      ? `      <section class="noticia-fonts" aria-label="Fonts">
        <h2>Fonts</h2>
        <ul>
${cites.map((u, idx) => (idx === 0 && k.font_url && u === k.font_url
    ? `          <li><a href="${e(u)}" target="_blank" rel="noopener">${e(k.font_nom)}</a>${k.data_font ? `, ${dataLlarga(k.data_font)}` : ''}</li>`
    : `          <li><a href="${e(u)}" target="_blank" rel="noopener">${e(u)}</a></li>`)).join('\n')}
        </ul>
      </section>
`
      : (n.cos.includes(`](${k.font_url})`) ? '' : `      <p class="noticia-font">Font: <a href="${e(k.font_url)}" target="_blank" rel="noopener">${e(k.font_nom)}</a>${k.data_font ? `, ${dataLlarga(k.data_font)}` : ''}</p>
`);
    const servei = k.servei_relacionat ? `      <p class="noticia-servei">Et pot interessar: <a href="${m.url_servei('ca', k.servei_relacionat)}">${e(dades.PAGINES[k.servei_relacionat].ca.curt)}</a></p>
` : '';
    const ctaArticle = k.cta_desti ? (() => {
      const desti = k.cta_desti === 'diagnostic' ? '/diagnostic'
        : k.cta_desti === 'contacte' ? '/#contacte'
        : m.url_servei('ca', k.servei_relacionat);
      const textBoto = k.cta_text || CTA_TEXT_DEFECTE[k.cta_desti];
      return `      <aside class="noticia-cta">
        <h2>${e(c.cta_titol)}</h2>
        <a class="btn btn-primary" href="${desti}">${e(textBoto)}</a>
      </aside>
`;
    })() : cta;
    const altres = noticies.filter(x => x !== n).slice(0, 3);
    out.push([`${url.slice(1)}index.html`,
      m.cap('ca', `${k.titol} · Madeinhuman`, descSeo, url, [['ca', url], ['x-default', url]], ld, { ogType: 'article', comentari: false,
        capExtra: rss + `  <meta property="article:published_time" content="${k.data}" />\n` })
      + m.nav('ca', '/es/') + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
${molles(k.titol, true)}
      <span class="eyebrow">${e(tag)} · <time datetime="${k.data}">${dataLlarga(k.data)}</time></span>
      <h1 class="section-title pagina-h1">${e(k.titol)}</h1>
${revisio}      <p class="pagina-lede">${e(k.resum)}</p>
      <article class="noticia-cos">
${markdown(n.cos)}
      </article>
${font}${servei}${ctaArticle}${altres.length ? `      <nav class="pagina-seccio" aria-label="Més notícies">
        <h2>Més notícies</h2>
        <ul class="pagina-altres">${altres.map(x => `<li><a href="${teCos(x) ? urlNoticia(x) : RUTA}">${e(x.cap.titol)}</a></li>`).join('')}</ul>
      </nav>
` : ''}    </div>
  </main>
` + m.peu('ca')]);
  }

  // Canal RSS
  const x = s => String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  out.push([`${RUTA.slice(1)}rss.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Madeinhuman · ${x(bloc.etiqueta)}</title>
    <link>${WEB}${RUTA}</link>
    <description>${x(pla(bloc.entradeta))}</description>
    <language>ca</language>
    <atom:link href="${WEB}${RUTA}rss.xml" rel="self" type="application/rss+xml" />
${noticies.map(n => {
    const enllac = teCos(n) ? WEB + urlNoticia(n) : (n.cap.font_url || WEB + RUTA);
    return `    <item>
      <title>${x(n.cap.titol)}</title>
      <link>${x(enllac)}</link>
      <guid isPermaLink="false">${WEB}${RUTA}${n.slug}</guid>
      <pubDate>${dataRss(n.cap.data)}</pubDate>
      <category>${x(ETIQUETA[n.cap.etiqueta][1])}</category>
      <description>${x(n.cap.resum)}</description>
    </item>`;
  }).join('\n')}
  </channel>
</rss>
`]);
  return out;
}

/** Dates `lastmod` del mapa del lloc per al llistat d'actualitat i les notícies amb pàgina. */
export function datesActualitatMapa(WEB, noticies) {
  const dates = new Map();
  if (!noticies.length) return dates;
  dates.set(`${WEB}${RUTA}`, noticies[0].cap.data);
  for (const n of noticies.filter(teCos)) dates.set(`${WEB}${urlNoticia(n)}`, n.cap.data);
  return dates;
}
