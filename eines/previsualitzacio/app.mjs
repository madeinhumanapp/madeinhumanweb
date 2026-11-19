// Vista prèvia del panell (prototip C). Es publica a /_previsualitzacio/.
//  · Només accepta missatges del panell (ORIGENS); _headers només en permet la inserció des d'allà.
//  · Pinta la pàgina amb les mateixes plantilles que el generador (pagina()).
//  · La pàgina pintada no pot fer cap petició (CSP connect-src 'none'): els formularis de la
//    vista prèvia no creen leads.
import { pagina } from './plantilles/base.mjs';
import { validarPagina } from './esquema/blocs.mjs';

const ORIGENS = ['https://rgpd.madeinhuman.cat', 'http://localhost:3000'];
const [lloc, formularis] = await Promise.all([
  fetch('lloc.json').then(r => r.json()),
  fetch('formularis.json').then(r => r.json()),
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
  const { tipus, pagina: p } = e.data || {};
  if (tipus !== 'previsualitzar' || !p) return;
  const errors = validarPagina(p);
  caixaErrors.style.display = errors.length ? 'block' : 'none';
  caixaErrors.textContent = errors.length ? `No es pot mostrar: ${errors.join(' · ')}` : '';
  e.source.postMessage({ tipus: errors.length ? 'errors' : 'fet', errors }, e.origin);
  if (errors.length) return;
  const scroll = (() => { try { return marc.contentWindow.scrollY; } catch { return 0; } })();
  const html = pagina(lloc, p, formularis).replace('<head>', CAP_PREVIA);
  const anterior = urlActual;
  urlActual = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  marc.onload = () => { try { marc.contentWindow.scrollTo(0, scroll); } catch { /* res */ } if (anterior) URL.revokeObjectURL(anterior); };
  marc.src = urlActual;
});

// Avisa el panell que ja pot enviar contingut (no conté cap dada)
window.parent.postMessage({ tipus: 'preparat' }, '*');
