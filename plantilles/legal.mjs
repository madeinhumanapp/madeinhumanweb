// Plantilla de les pàgines legals (avís legal, privacitat, cookies). El cos és Markdown
// (contingut/legal/*.md); el marc reprodueix el menú i el peu que tenen avui aquestes pàgines.
// Menú i peu: els comuns de tota la web (plantilles/marc.mjs, WEB-H07).
import { esc } from './text.mjs';
import { markdown, enLinia } from './markdown.mjs';
import { menu, peu } from './marc.mjs';

// Dades del lloc dins dels textos legals: {{adreca}} i {{correu}} es prenen de contingut/lloc.json, de manera que un
// canvi a «Dades del lloc» del panell arriba també a l'avís legal i a les polítiques
export function ambDadesDelLloc(text, lloc) {
  const k = lloc.contacte;
  const fet = text.replace(/\{\{adreca\}\}/g, `${k.carrer}, ${k.cp} ${k.ciutat}`).replace(/\{\{correu\}\}/g, k.correu);
  const resta = fet.match(/\{\{[^}]*\}\}/);
  if (resta) throw new Error(`Marca desconeguda als textos legals: ${resta[0]} (només {{adreca}} i {{correu}})`);
  return fet;
}

export function paginaLegal(lloc, p, cosFont) {
  const cos = ambDadesDelLloc(cosFont, lloc);
  const c = p.cap, ctx = { idioma: p.idioma, ruta: p.ruta };
  return `<!DOCTYPE html>
<html lang="${p.idioma}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(c.titol)}</title>
  <meta name="description" content="${esc(c.descripcio)}" />
  <meta name="robots" content="${esc(c.robots)}" />
  <link rel="canonical" href="${esc(c.canonica)}" />${(c.alternatives || []).map(a => `\n  <link rel="alternate" hreflang="${a.idioma}" href="${esc(a.href)}" />`).join('\n')}
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

  <main>
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
  </main>

${peu(lloc, ctx)}

  <script src="/script.js"></script>
  <script src="/menu.js" defer></script>
</body>
</html>
`;
}
