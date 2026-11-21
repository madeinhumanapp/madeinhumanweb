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

  context: d => `
<section class="block statement">
  <div class="container statement-grid">
    <div class="statement-left reveal-left">
      <span class="eyebrow">${esc(d.etiqueta)}</span>
      <h2 class="section-title" style="margin-top:18px">${enriquit(d.titol)}</h2>
      ${d.paragrafs.map(t => `<p>${enriquit(t)}</p>`).join('\n')}
    </div>
    <div class="metrics reveal-right">${d.xifres.map(x => `
      <div class="metric">
        <div class="metric-key">${esc(x.clau)}</div>
        <div class="metric-body">
          <div class="metric-label">${esc(x.etiqueta)}</div>
          <p>${enriquit(x.text)}</p>${x.font ? `
          <div class="metric-source">${esc(x.font)}</div>` : ''}
        </div>
      </div>`).join('\n')}
    </div>
  </div>
</section>`,

  // origen «actualitat»: les 3 últimes de contingut/actualitat/ (ctx.actualitat, ja ordenades); si no n'hi ha cap
  // de publicada, la llista manual. Les notícies amb pàgina pròpia porten l'enllaç al títol.
  actualitat: (d, ctx = {}) => {
    const deFitxers = d.origen === 'actualitat' && ctx.actualitat?.length;
    const noticies = deFitxers ? ctx.actualitat.slice(0, 3) : d.noticies || [];
    return `
<section class="block actualitat"${attr('id', d.ancora)}>
  <div class="container">
    ${capSeccio(d)}
    <div class="news-grid">${noticies.map(n => `
      <article class="news-card${n.variant === 'ia' ? ' news-card-ia' : ''}">
        <div class="news-meta">
          <span class="news-tag news-tag-${n.variant}">${esc(n.tag)}</span>
          <span class="news-date">${esc(n.data)}</span>
        </div>
        <h3 class="news-title">${n.href ? `<a href="${esc(n.href)}">${enriquit(n.titol)}</a>` : enriquit(n.titol)}</h3>
        <p class="news-body">${enriquit(n.cos)}</p>${n.font ? `
        <div class="news-source">${esc(n.font)}</div>` : ''}
      </article>`).join('\n')}
    </div>${deFitxers ? `
    <p class="news-mes"><a href="/actualitat/">Totes les notícies</a></p>` : ''}
  </div>
</section>`;
  },

  serveis: (d, ctx) => `
<section class="block services"${attr('id', d.ancora)}>
  <div class="container">
    <div class="services-head-row reveal">
      <div class="section-head">
        <span class="eyebrow">${esc(d.etiqueta)}</span>
        <h2 class="section-title">${enriquit(d.titol)}</h2>
        <p class="section-lead">${enriquit(d.entradeta)}</p>
      </div>
    </div>
    <div class="pillar-grid">${d.pilars.map(p => `
      <article class="pillar${p.variant === 'blau' ? ' pillar-blue' : ''} reveal-scale"${attr('style', `transition-delay:${p.retard}`)}>
        <div class="pillar-inner">
          <div class="pillar-head">
            <span class="pillar-num">${esc(p.num)}</span>
            <span class="badge badge-${p.insigniaVariant}"><span class="dot"></span>${esc(p.insignia)}</span>
          </div>
          <div class="pillar-eyebrow">${esc(p.subtitol)}</div>
          <h3>${enriquit(p.titol)}</h3>
          <p class="pillar-lede">${enriquit(p.descripcio)}</p>
          <ul class="svc-list">
${p.llista.map(i => `            <li>${enriquit(i)}</li>`).join('\n')}
          </ul>
          <div class="pillar-foot">${enriquit(p.peu)}</div>
        </div>
      </article>`).join('\n')}
    </div>
    <div class="crossover reveal">
      <div>
        <div class="crossover-label">${esc(d.transversalEtiqueta)}</div>
        <div class="crossover-title">${esc(d.transversalTitol)}</div>
      </div>
      <p class="crossover-body">${enriquit(d.transversalText)}</p>
      <a href="#contacte" class="crossover-arrow" aria-label="Parlem-ne">&rarr;</a>
    </div>
    <nav class="serveis-detall" aria-label="Serveis en detall">
      <span class="serveis-detall-titol">${esc(d.enllacosTitol)}</span>
${d.enllacos.map(e => `      <a href="${esc(enllac(e.href, ctx))}">${esc(e.text)}</a>`).join('\n')}
    </nav>
  </div>
</section>`,

  // FAQ: les preguntes són a contingut/faq.json (una sola font per a la llista visible i el JSON-LD).
  // Es pinten amb script.js a partir de les dades incrustades a #dades-faq.
  faq: (d, ctx) => {
    const dades = (ctx.faq || []).map(f => ({ cat: f.cat, q: esc(f.pregunta), a: enriquit(f.resposta) }));
    return `
<section class="block faq"${attr('id', d.ancora)}>
  <div class="container">
    <div class="faq-header reveal">
      <span class="eyebrow">${esc(d.etiqueta)}</span>
      <h2 class="section-title" style="margin-top:18px">${enriquit(d.titol)}</h2>
      <p class="section-lead">${enriquit(d.entradeta)}</p>
      <div class="tabs" id="faqTabs">
${d.pestanyes.map((t, i) => `        <button class="tab${i === 0 ? ' active' : ''}" data-cat="${esc(t.cat)}">${esc(t.text)}</button>`).join('\n')}
      </div>
    </div>
    <div class="faq-list" id="faqList"></div>
    <script type="application/json" id="dades-faq">${JSON.stringify(dades).replace(/</g, '\\u003c')}</script>
  </div>
</section>`;
  },

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
