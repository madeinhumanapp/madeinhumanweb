// Menú i peu únics de totes les pàgines (WEB-H07), en català i en castellà. Dades: contingut/lloc.json
// (menu.<idioma> i peu.<idioma>). Sense onclick: el menú mòbil l'obre /menu.js.
// Les aplicacions (diagnòstic, «Necessito un DPO?», recollida, xarxes) tenen la seva capçalera mínima i no en fan servir.
import { esc } from './text.mjs';
import { enllac } from './blocs.mjs';

const INICI = { ca: '/', es: '/es/' };

/** ctx: { idioma, ruta, urlAltre? } — urlAltre: la mateixa pàgina en l'altre idioma, si existeix */
export function menu(lloc, ctx) {
  const m = lloc.menu[ctx.idioma];
  const portada = ctx.ruta === '/';
  const altre = { ...m.altreIdioma, href: ctx.urlAltre || m.altreIdioma.href };
  const idioma = cls => `<a href="${esc(altre.href)}" hreflang="${altre.idioma}" lang="${altre.idioma}"${cls}>${esc(altre.text)}</a>`;
  const a = e => `<a href="${esc(enllac(e.href, ctx))}">${esc(e.text)}</a>`;
  return `${portada ? `
<div class="scroll-progress" id="scrollProgress"></div>` : ''}
<nav class="nav${portada ? '' : ' scrolled'}" id="navbar">
  <div class="container nav-inner">
    <a href="${portada ? '#top' : INICI[ctx.idioma]}" class="nav-logo">Madein<span>human</span></a>
    <div class="nav-links">${m.enllacos.map(a).join('\n')}${idioma(' class="nav-idioma"')}</div>
    <a href="${esc(enllac(m.crida.href, ctx))}" class="nav-cta">${esc(m.crida.text)}</a>
    <button class="nav-burger" type="button" aria-label="${ctx.idioma === 'es' ? 'Menú' : 'Menú'}" aria-controls="navMobile" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
  <div class="nav-mobile" id="navMobile">${[...m.enllacos, m.crida].map(a).join('\n')}${idioma('')}</div>
</nav>`;
}

export function peu(lloc, ctx) {
  const f = lloc.peu[ctx.idioma], k = lloc.contacte;
  // Columna amb «contacte»: correu, WhatsApp i adreça (de lloc.contacte) abans dels enllaços
  const contacte = [
    `<li><a href="mailto:${esc(k.correu)}">${esc(k.correu)}</a></li>`,
    `<li><a href="https://wa.me/${k.telefon.replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp: ${esc(k.telefonVisible)}</a></li>`,
    `<li><address>${esc(k.carrer)}<br>${esc(k.cp)} ${esc(k.ciutat)}</address></li>`,
  ];
  // Les adreces d'altres webs s'obren en una pestanya nova
  const item = e => `<li><a href="${esc(enllac(e.href, ctx))}"${/^https?:\/\//.test(e.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(e.text)}</a></li>`;
  return `
<footer>
  <div class="container">
    <div class="footer-grid footer-grid-4">
      <div>
        <div class="footer-logo">Madein<span>human</span></div>
        <p class="footer-desc">${esc(f.descripcio)}</p>
        <a href="${esc(enllac(f.boto.href, ctx))}" class="btn btn-primary footer-boto">${esc(f.boto.text)} <span class="arrow" aria-hidden="true">&rarr;</span></a>
      </div>${f.columnes.map(c => `
      <div class="footer-col">
        <div class="footer-col-title">${esc(c.titol)}</div>
        <ul>${[...(c.contacte ? contacte : []), ...(c.elements || []).map(item)].join('\n')}</ul>
      </div>`).join('\n')}
    </div>
    <div class="footer-bottom">
      <span>${esc(f.copyright)}</span>
      <span class="made"><span class="dot-live"></span> ${esc(f.estat)}</span>
    </div>
  </div>
</footer>`;
}
