// Plantilla de les pàgines legals (avís legal, privacitat, cookies). El cos és Markdown
// (contingut/legal/*.md); el marc reprodueix el menú i el peu que tenen avui aquestes pàgines.
// Menú i peu: els comuns de tota la web (plantilles/marc.mjs, WEB-H07).
import { esc } from './text.mjs';
import { markdown, enLinia } from './markdown.mjs';
import { menu, peu } from './marc.mjs';

export function paginaLegal(lloc, p, cos) {
  const c = p.cap, ctx = { idioma: p.idioma, ruta: p.ruta };
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
  <link rel="stylesheet" href="/marca.css" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
${menu(lloc, ctx)}

  <section class="block legal-page">
    <div class="container legal-container">
      <span class="eyebrow">${esc(p.etiqueta)}</span>
      <h1 class="section-title legal-titol">${esc(p.titol)}</h1>
      <p class="section-lead legal-entradeta">${esc(p.entradeta)}</p>

      <div class="legal-content">
${markdown(cos, { classeTaula: 'legal-table' })}
        <p class="legal-footer-note">${enLinia(p.notaFinal)}</p>
      </div>
    </div>
  </section>

${peu(lloc, ctx)}

  <script src="/script.js"></script>
  <script src="/menu.js" defer></script>
</body>
</html>
`;
}
