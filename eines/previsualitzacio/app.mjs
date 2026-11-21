// Vista prèvia del panell (prototip C). Es publica a /_previsualitzacio/.
//  · Només accepta missatges del panell (ORIGENS); _headers només en permet la inserció des d'allà.
//  · Pinta la pàgina amb les mateixes plantilles que el generador:
//      { tipus: 'previsualitzar', pagina }                 pàgina de blocs (portada) o xarxes
//      { tipus: 'previsualitzar', serveis, ruta }          una pàgina de serveis.json (p. ex. serveis/dpo-extern/index.html)
//  · La pàgina pintada no pot fer cap petició (CSP connect-src 'none'): els formularis de la
//    vista prèvia no creen leads.
import { pagina } from './plantilles/base.mjs';
import { paginaXarxes } from './plantilles/xarxes.mjs';
import { paginesServei } from './plantilles/serveis.mjs';
import { validarPagina } from './esquema/blocs.mjs';
import { validarServeis } from './esquema/serveis.mjs';

const ORIGENS = ['https://rgpd.madeinhuman.cat', 'http://localhost:3000'];
const [lloc, formularis, faq] = await Promise.all([
  fetch('lloc.json').then(r => r.json()),
  fetch('formularis.json').then(r => r.json()),
  fetch('faq.json').then(r => r.json()),
]);
const marc = document.getElementById('marc');
const caixaErrors = document.getElementById('errors');
let urlActual = null;

const CAP_PREVIA = `<head>
<base href="${location.origin}/">
<meta http-equiv="Content-Security-Policy" content="connect-src 'none'; form-action 'none'">
<meta name="robots" content="noindex">`;

window.addEventListener('message', e => {
  if (!ORIGENS.includes(e.origin)) return;
  const { tipus, pagina: p, serveis, ruta } = e.data || {};
  if (tipus !== 'previsualitzar' || (!p && !serveis)) return;
  let errors, crea;
  if (serveis) {
    errors = validarServeis(serveis);
    crea = () => (paginesServei(lloc, serveis).find(([r]) => r === ruta) || [])[1] || '';
    if (!errors.length && !crea()) errors = [`pàgina desconeguda: ${ruta}`];
  } else {
    errors = validarPagina(p);
    crea = () => (p.plantilla === 'xarxes' ? paginaXarxes(lloc, p) : pagina(lloc, p, formularis, faq));
  }
  caixaErrors.style.display = errors.length ? 'block' : 'none';
  caixaErrors.textContent = errors.length ? `No es pot mostrar: ${errors.join(' · ')}` : '';
  e.source.postMessage({ tipus: errors.length ? 'errors' : 'fet', errors }, e.origin);
  if (errors.length) return;
  const scroll = (() => { try { return marc.contentWindow.scrollY; } catch { return 0; } })();
  const html = crea().replace('<head>', CAP_PREVIA);
  const anterior = urlActual;
  urlActual = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  marc.onload = () => { try { marc.contentWindow.scrollTo(0, scroll); } catch { /* res */ } if (anterior) URL.revokeObjectURL(anterior); };
  marc.src = urlActual;
});

// Avisa el panell que ja pot enviar contingut (no conté cap dada)
window.parent.postMessage({ tipus: 'preparat' }, '*');
