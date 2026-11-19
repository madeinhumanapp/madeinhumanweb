// Plantilla base (prototip): cap, menú, peu i elements comuns de totes les pàgines.
// Les dades comunes (contacte, menú, peu, SEO per defecte) són a contingut/lloc.json:
// s'escriuen un sol cop i surten iguals a totes les pàgines.
import { esc, attr } from './text.mjs';
import { enllac, renderBloc } from './blocs.mjs';

const meta = (nom, valor) => (valor == null ? '' : `\n  <meta name="${nom}" content="${esc(valor)}" />`);
const prop = (nom, valor) => (valor == null ? '' : `\n  <meta property="${nom}" content="${esc(valor)}" />`);

function cap(lloc, p) {
  const c = p.cap, d = lloc.cap;
  const og = { ...d.og, ...c.og };
  const tw = { ...d.twitter, ...c.twitter };
  return `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(c.titol)}</title>${meta('description', c.descripcio)}${meta('keywords', c.paraulesClau)}
  <link rel="canonical" href="${esc(c.canonica)}" />${(c.alternatives || []).map(a => `
  <link rel="alternate" hreflang="${a.idioma}" href="${esc(a.href)}" />`).join('\n')}${prop('og:title', og.titol)}${prop('og:description', og.descripcio)}${prop('og:type', og.tipus)}${prop('og:url', og.url)}${prop('og:locale', og.locale)}${prop('og:locale:alternate', og.localeAlternatiu)}${prop('og:site_name', og.nomLloc)}${prop('og:image', og.imatge)}${prop('og:image:width', og.imatgeAmplada)}${prop('og:image:height', og.imatgeAlcada)}${prop('og:image:alt', og.imatgeAlt)}${meta('twitter:card', tw.targeta)}${meta('twitter:title', tw.titol)}${meta('twitter:description', tw.descripcio)}${meta('twitter:image', tw.imatge)}${Object.entries(d.geo || {}).map(([k, v]) => meta(k, v)).join('\n')}
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />${meta('author', d.autor)}${meta('robots', c.robots ?? d.robots)}${meta('theme-color', d.colorTema)}${(c.jsonld || []).map(j => `
  <script type="application/ld+json">
${JSON.stringify(j, null, 2)}
  </script>`).join('\n')}${d.precarregar.map(f => `
  <link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin />`).join('\n')}${(c.estils || d.estils).map(e => `
  <link rel="stylesheet" href="${e}" />`).join('\n')}
</head>`;
}

function menu(lloc, ctx) {
  const m = lloc.menu[ctx.idioma];
  const altre = m.altreIdioma;
  return `
<div class="scroll-progress" id="scrollProgress"></div>
<nav class="nav" id="navbar">
  <div class="container nav-inner">
    <a href="#top" class="nav-logo">Madein<span>human</span></a>
    <div class="nav-links">${m.enllacos.map(([t, h]) => `<a href="${esc(enllac(h, ctx))}">${esc(t)}</a>`).join('\n')}<a href="${altre.href}" hreflang="${altre.idioma}" lang="${altre.idioma}" class="nav-idioma">${esc(altre.text)}</a></div>
    <a href="${esc(enllac(m.crida.href, ctx))}" class="nav-cta">${esc(m.crida.text)}</a>
    <button class="nav-burger" aria-label="Menú" onclick="toggleMenu()"><span></span><span></span><span></span></button>
  </div>
  <div class="nav-mobile" id="navMobile">${[...m.enllacos, [m.crida.text, m.crida.href]].map(([t, h]) =>
    `<a href="${esc(enllac(h, ctx))}"${h.includes('#') ? ' onclick="toggleMenu()"' : ''}>${esc(t)}</a>`).join('\n')}<a href="${altre.href}" hreflang="${altre.idioma}" lang="${altre.idioma}">${esc(altre.text)}</a></div>
</nav>`;
}

function peu(lloc, ctx) {
  const f = lloc.peu[ctx.idioma], k = lloc.contacte;
  const item = e => {
    if (e.tipus === 'correu') return `<li><a href="mailto:${k.correu}">${k.correu}</a></li>`;
    if (e.tipus === 'whatsapp') return `<li><a href="https://wa.me/${k.telefon.replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp: ${esc(k.telefonVisible)}</a></li>`;
    if (e.tipus === 'adreca') return `<li><address>${esc(k.carrer)}<br>${esc(k.cp)} ${esc(k.ciutat)}</address></li>`;
    return `<li><a href="${esc(enllac(e.href, ctx))}"${e.extern ? ' target="_blank" rel="noopener"' : ''}>${esc(e.text)}</a></li>`;
  };
  return `
<footer>
  <div class="container">
    <div class="footer-grid footer-grid-4">
      <div>
        <div class="footer-logo">Madein<span>human</span></div>
        <p class="footer-desc">${esc(f.descripcio)}</p>
        <a href="${esc(enllac(f.boto.href, ctx))}" class="btn btn-primary" style="padding:12px 20px;font-size:14px">${esc(f.boto.text)} <span class="arrow" aria-hidden="true">&rarr;</span></a>
      </div>${f.columnes.map(c => `
      <div class="footer-col">
        <div class="footer-col-title">${esc(c.titol)}</div>
        <ul>${c.elements.map(item).join('\n')}</ul>
      </div>`).join('\n')}
    </div>
    <div class="footer-bottom">
      <span>${esc(f.copyright)}</span>
      <span class="made"><span class="dot-live"></span> ${esc(f.estat)}</span>
    </div>
  </div>
</footer>`;
}

function flotants(lloc, ctx) {
  const tel = lloc.contacte.telefon.replace(/\D/g, '');
  return `
<a href="#top" class="back-to-top" id="backToTop" aria-label="Tornar a dalt">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
</a>
<a href="https://wa.me/${tel}" target="_blank" rel="noopener noreferrer" class="whatsapp-float" aria-label="${esc(lloc.menu[ctx.idioma].whatsappEtiqueta)}">
  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${lloc.icones.whatsapp[0]}" fill="#fff"/>
    <path d="${lloc.icones.whatsapp[1]}" fill="#fff"/>
  </svg>
  <span class="whatsapp-pulse"></span>
</a>`;
}

// formularis: { id: plantilla HTML } de plantilles/formularis/ (protegits, no editables)
export function pagina(lloc, p, formularis = {}) {
  const ctx = { ruta: p.ruta, idioma: p.idioma, formularis };
  return `<!DOCTYPE html>
<html lang="${p.idioma}">
${cap(lloc, p)}
<body>
${menu(lloc, ctx)}
${p.blocs.map(b => renderBloc(b, ctx)).join('\n')}
${peu(lloc, ctx)}
${flotants(lloc, ctx)}
${(p.scripts || []).map(s => `<script src="${s}"></script>`).join('\n')}
</body>
</html>
`;
}
