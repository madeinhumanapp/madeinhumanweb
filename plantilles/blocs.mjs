// Plantilles dels blocs de contingut (prototip). Cada bloc és una funció pura:
// (dades del bloc, context de la pàgina) → HTML. El disseny viu aquí; el text, a contingut/.
// No fan servir res de Node: les mateixes plantilles funcionen al navegador (vista prèvia del panell).
import { esc, enriquit, attr } from './text.mjs';

// A la portada, els enllaços del menú han de ser només àncores (#serveis), no /#serveis:
// si no, en clicar es perdrien els utm_* de l'URL i l'origen de la visita dels formularis.
export function enllac(href, ctx) {
  if (ctx.ruta === '/' && href.startsWith('/#')) return href.slice(1);
  return href;
}

const boto = (b, ctx) =>
  `<a href="${esc(enllac(b.href, ctx))}" class="btn ${b.estil === 'secundari' ? 'btn-ghost' : 'btn-primary'}">${esc(b.text)}` +
  (b.fletxa ? ' <span class="arrow" aria-hidden="true">&rarr;</span>' : '') + '</a>';

const capSeccio = (d, extraClasse = '') =>
  `<div class="section-head reveal${extraClasse}">` +
  (d.etiqueta ? `<span class="eyebrow">${esc(d.etiqueta)}</span>` : '') +
  `<h2 class="section-title">${enriquit(d.titol)}</h2>` +
  (d.entradeta ? `<p class="section-lead">${enriquit(d.entradeta)}</p>` : '') +
  '</div>';

export const BLOCS = {
  // Transitori: HTML tal qual, mentre un bloc no tingui plantilla pròpia
  html: d => d.html,

  separador: () => '<div class="section-divider"></div>',

  hero: (d, ctx) => `
<header class="hero" id="top">
  <div class="aurora"></div>
  <div class="grid-lines"></div>
  <div class="container hero-inner">
    <span class="eyebrow reveal" style="transition-delay:.1s">${esc(d.subtitol)}</span>
    <h1 class="hero-title reveal" style="transition-delay:.2s">${enriquit(d.titol)}</h1>
    <p class="hero-sub reveal" style="transition-delay:.35s">${enriquit(d.text)}</p>
    <div class="cta-row reveal" style="transition-delay:.5s">${d.botons.map(b => boto(b, ctx)).join('\n')}</div>
  </div>
  <div class="scroll-ind"><div class="line"></div><span>Scroll</span></div>
  <div class="hero-meta">${d.etiquetes.map(e => `<span>${enriquit(e, { negreta: 'b' })}</span>`).join('\n')}</div>
</header>`,

  spot: d => `
<section class="spot${d.alternat ? ' spot-alt' : ''}">
  <div class="container spot-inner">
    <span class="spot-num reveal">${esc(d.num)}</span>
    <h2 class="spot-title reveal" style="transition-delay:.1s">${enriquit(d.titol)}</h2>
    <p class="spot-text reveal" style="transition-delay:.2s">${enriquit(d.text)}</p>
  </div>
</section>`,

  metode: d => `
<section class="block method"${attr('id', d.ancora)}>
  <div class="container">
    ${capSeccio(d)}
    <div class="steps">${d.passos.map((p, i) => `
      <div class="step reveal" style="transition-delay:.${String(i * 10 + 5).padStart(2, '0')}s">
        <div class="step-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="step-title">${esc(p.titol)}</div>
        <div class="step-body">${enriquit(p.text)}</div>
      </div>`).join('\n')}
    </div>
  </div>
</section>`,

  // Formulari protegit: l'estructura i els name="" són a plantilles/formularis/<id>.html
  // i no es poden editar des del contingut; només el titular i l'entradeta.
  // ctx.formularis: { contacte: '<section…>', … } (els carrega el generador o la vista prèvia)
  formulari: (d, ctx) =>
    ctx.formularis[d.formulari]
      .replace('{{titol}}', enriquit(d.titol))
      .replace('{{entradeta}}', enriquit(d.entradeta)),
};

export function renderBloc(bloc, ctx) {
  const fn = BLOCS[bloc.tipus];
  if (!fn) throw new Error(`Tipus de bloc desconegut: ${bloc.tipus}`);
  return fn(bloc, ctx);
}
