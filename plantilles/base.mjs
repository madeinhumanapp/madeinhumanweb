// Plantilla base (prototip): cap, menú, peu i elements comuns de totes les pàgines.
// Les dades comunes (contacte, menú, peu, SEO per defecte) són a contingut/lloc.json:
// s'escriuen un sol cop i surten iguals a totes les pàgines.
import { esc, attr } from './text.mjs';
import { renderBloc } from './blocs.mjs';
import { menu, peu } from './marc.mjs';

const meta = (nom, valor) => (valor == null ? '' : `\n  <meta name="${nom}" content="${esc(valor)}" />`);
const prop = (nom, valor) => (valor == null ? '' : `\n  <meta property="${nom}" content="${esc(valor)}" />`);

// Text pla d'un text enriquit (per al JSON-LD): sense *, ** ni enllaços
const pla = t => String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

// Un FAQPage sense «mainEntity» es genera amb les preguntes destacades de contingut/faq.json
function jsonldAmbFaq(j, faq) {
  if (j['@type'] !== 'FAQPage' || j.mainEntity) return j;
  return { ...j, mainEntity: (faq || []).filter(f => f.destacada).map(f => ({
    '@type': 'Question', name: f.pregunta, acceptedAnswer: { '@type': 'Answer', text: pla(f.resposta) },
  })) };
}

// Les dades de contacte del JSON-LD surten de contingut/lloc.json (font única): si es canvien al panell,
// també canvien aquí. Només se substitueixen els camps que ja hi són (mateix ordre, mateix resultat).
function ambContacte(j, lloc) {
  const k = lloc.contacte;
  const posa = (o, camp, v) => (camp in o ? { ...o, [camp]: v } : o);
  const recorre = o => {
    if (Array.isArray(o)) return o.map(recorre);
    if (!o || typeof o !== 'object') return o;
    let r = Object.fromEntries(Object.entries(o).map(([c, v]) => [c, recorre(v)]));
    if (r['@type'] === 'PostalAddress') {
      r = posa(r, 'streetAddress', k.carrer); r = posa(r, 'postalCode', k.cp); r = posa(r, 'addressLocality', k.ciutat);
    } else if (r.address || r.telephone) {
      r = posa(r, 'telephone', k.telefon); r = posa(r, 'email', k.correu);
    }
    return r;
  };
  return recorre(j);
}

function cap(lloc, p, faq) {
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
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />${meta('author', d.autor)}${meta('robots', c.robots ?? d.robots)}${meta('theme-color', d.colorTema)}${(c.jsonld || []).map(j => ambContacte(jsonldAmbFaq(j, faq), lloc)).map(j => `
  <script type="application/ld+json">
${JSON.stringify(j, null, 2)}
  </script>`).join('\n')}${d.precarregar.map(f => `
  <link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin />`).join('\n')}${(c.estils || d.estils).map(e => `
  <link rel="stylesheet" href="${e}" />`).join('\n')}
</head>`;
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
// actualitat: targetes de les notícies publicades (plantilles/actualitat.mjs → targeta), de la més nova a la més antiga
export function pagina(lloc, p, formularis = {}, faq = [], actualitat = []) {
  const ctx = { ruta: p.ruta, idioma: p.idioma, formularis, faq, actualitat };
  return `<!DOCTYPE html>
<html lang="${p.idioma}">
${cap(lloc, p, faq)}
<body>
${menu(lloc, ctx)}
${p.blocs.filter(b => !b.amagat).map(b => renderBloc(b, ctx)).join('\n')}
${peu(lloc, ctx)}
${flotants(lloc, ctx)}
${(p.scripts || []).map(s => `<script src="${s}"></script>`).join('\n')}
<script src="/menu.js" defer></script>
</body>
</html>
`;
}
