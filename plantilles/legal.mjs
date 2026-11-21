// Plantilla de les pàgines legals (avís legal, privacitat, cookies). El cos és Markdown
// (contingut/legal/*.md); el marc reprodueix el menú i el peu que tenen avui aquestes pàgines.
// A WEB-H07 el menú i el peu passaran a ser els comuns de tota la web.
import { esc } from './text.mjs';
import { markdown, enLinia } from './markdown.mjs';

const NAV = [['Serveis', 'index.html#serveis'], ['Mètode', 'index.html#metode'], ['FAQ', 'index.html#faq'], ['Contacte', 'index.html#contacte']];
const PEU_NAV = [['Serveis', 'index.html#serveis'], ['Mètode', 'index.html#metode'], ['Preguntes freqüents', 'index.html#faq'],
  ['Contacte', 'index.html#contacte'], ['Formulari RGPD', 'index.html#adequacio']];

export function paginaLegal(lloc, p, cos) {
  const c = p.cap, k = lloc.contacte, peu = lloc.peu.ca;
  return `<!DOCTYPE html>
<html lang="${p.idioma}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(c.titol)}</title>
  <meta name="description" content="${esc(c.descripcio)}" />
  <meta name="robots" content="${esc(c.robots)}" />
  <link rel="canonical" href="${esc(c.canonica)}" />
  <link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/playfair-display-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="stylesheet" href="marca.css" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav class="nav" id="navbar">
    <div class="container nav-inner">
      <a href="index.html" class="nav-logo">Madein<span>human</span></a>
      <div class="nav-links">
${NAV.map(([t, h]) => `        <a href="${h}">${t}</a>`).join('\n')}
      </div>
      <a href="index.html#adequacio" class="nav-cta">Sol·licitar adequació</a>
      <button class="nav-burger" aria-label="Menú" onclick="document.getElementById('navMobile').classList.toggle('open')">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav-mobile" id="navMobile">
${[...NAV, ['Sol·licitar adequació', 'index.html#adequacio']].map(([t, h]) => `      <a href="${h}">${t}</a>`).join('\n')}
    </div>
  </nav>

  <section class="block legal-page" style="padding-top:140px;padding-bottom:100px">
    <div class="container" style="max-width:820px">
      <span class="eyebrow">${esc(p.etiqueta)}</span>
      <h1 class="section-title" style="margin-top:18px;margin-bottom:12px">${esc(p.titol)}</h1>
      <p class="section-lead" style="margin-bottom:48px">${esc(p.entradeta)}</p>

      <div class="legal-content">
${markdown(cos, { classeTaula: 'legal-table' })}
        <p class="legal-footer-note">${enLinia(p.notaFinal)}</p>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logo">Madein<span>human</span></div>
          <p class="footer-desc">${esc(peu.descripcio)}</p>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">Navegació</div>
          <ul>
${PEU_NAV.map(([t, h]) => `            <li><a href="${h}">${t}</a></li>`).join('\n')}
          </ul>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">Legal i contacte</div>
          <ul>
            <li><a href="mailto:${k.correu}">${k.correu}</a></li>
            <li><a href="avis-legal.html">Avís legal</a></li>
            <li><a href="politica-privacitat.html">Política de privacitat</a></li>
            <li><a href="politica-cookies.html">Política de cookies</a></li>
            <li><a href="https://apdcat.gencat.cat" target="_blank" rel="noopener">APDCat ↗</a></li>
            <li><a href="https://www.aepd.es" target="_blank" rel="noopener">AEPD ↗</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>${esc(peu.copyright)}</span>
        <span class="made"><span class="dot-live"></span> ${esc(peu.estat)}</span>
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
`;
}
