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
  const a = ([t, h]) => `<a href="${esc(enllac(h, ctx))}">${esc(t)}</a>`;
  return `${portada ? `
<div class="scroll-progress" id="scrollProgress"></div>` : ''}
<nav class="nav${portada ? '' : ' scrolled'}" id="navbar">
  <div class="container nav-inner">
    <a href="${portada ? '#top' : INICI[ctx.idioma]}" class="nav-logo">Madein<span>human</span></a>
    <div class="nav-links">${m.enllacos.map(a).join('\n')}${idioma(' class="nav-idioma"')}</div>
    <a href="${esc(enllac(m.crida.href, ctx))}" class="nav-cta">${esc(m.crida.text)}</a>
    <button class="nav-burger" type="button" aria-label="${ctx.idioma === 'es' ? 'Menú' : 'Menú'}" aria-controls="navMobile" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
  <div class="nav-mobile" id="navMobile">${[...m.enllacos, [m.crida.text, m.crida.href]].map(a).join('\n')}${idioma('')}</div>
</nav>`;
}

export function peu(lloc, ctx) {
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
        <a href="${esc(enllac(f.boto.href, ctx))}" class="btn btn-primary footer-boto">${esc(f.boto.text)} <span class="arrow" aria-hidden="true">&rarr;</span></a>
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
