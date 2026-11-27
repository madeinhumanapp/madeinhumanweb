// Plantilles dels blocs de contingut (prototip). Cada bloc és una funció pura:
// (dades del bloc, context de la pàgina) → HTML. El disseny viu aquí; el text, a contingut/.
// No fan servir res de Node: les mateixes plantilles funcionen al navegador (vista prèvia del panell).
import { esc, enriquit, attr } from './text.mjs';
import { t } from './textos.mjs';

// A la portada, els enllaços del menú han de ser només àncores (#serveis), no /#serveis:
// si no, en clicar es perdrien els utm_* de l'URL i l'origen de la visita dels formularis.
export function enllac(href, ctx) {
  // A les portades, els enllaços a seccions de la mateixa pàgina són àncores: així no es perden els utm_*
  if (ctx.ruta === '/' && href.startsWith('/#')) return href.slice(1);
  if (ctx.ruta === '/es/' && href.startsWith('/es/#')) return href.slice(4);
  return href;
}

/** Genera un id estable (minúscules, sense accents, guions) a partir del text d'una pregunta freqüent (WEB-G06d). */
export function idPreguntaFaq(pregunta, vistos = null) {
  const base = String(pregunta || '')
    .replace(/l·l/gi, 'll')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'pregunta';
  if (!vistos) return base;
  let id = base;
  let k = 2;
  while (vistos.has(id)) id = `${base}-${k++}`;
  vistos.add(id);
  return id;
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

// Mitjans (WEB-M02): ctx.media és un Map id → entrada de media.json. A la vista prèvia del panell,
// ctx.imatges porta { id: 'data:…' }: la imatge es fa servir com a src i no es posa srcset ni sizes.
// La mida més gran que no passa de «maxim» (src); si cap hi entra, la més petita disponible
const midaSrc = (mides, maxim = 960) => {
  const llista = mides || [];
  const dins = llista.filter(m => m <= maxim);
  if (dins.length) return Math.max(...dins);
  return llista.length ? Math.min(...llista) : 0;
};

// Amplada i alçada: només enters positius (a la vista prèvia, les entrades arriben del panell)
const px = v => (Number.isInteger(v) && v > 0 ? v : null);

const imgMedia = (e, alt, sizes, ctx) => {
  const data = ctx.imatges?.[e.id];
  const src = data || `/media/${e.id}-${midaSrc(e.mides)}.${e.format}`;
  const srcset = data ? null : (e.mides || []).map(m => `/media/${e.id}-${m}.${e.format} ${m}w`).join(', ');
  return `<img src="${esc(src)}"${attr('srcset', srcset)}${attr('sizes', data ? null : sizes)}` +
    `${attr('width', px(e.amplada))}${attr('height', px(e.alcada))} alt="${esc(alt)}" loading="lazy" decoding="async" />`;
};

// Presentació de les premisses: «Madeinhuman» amb la lletra del logo; les cursives alternen el color de cada àmbit
// (la primera, coure: protecció de dades; la segona, blau: IA), com al Venn dels serveis. Un salt de línia separa
// el passat (el que hem fet) del futur (el que farem): el punt final del passat és el punt de llum de la transició
// (portada.js); el punt continua sent text per als lectors de pantalla i Google.
const presentacio = t => {
  let n = 0;
  const pinta = s => enriquit(s)
    .replace(/<em>/g, () => `<em class="${n++ % 2 ? 'to-ia' : 'to-dades'}">`)
    .replace(/Madeinhuman/g, '<span class="marca-text">Madein<span>human</span></span>');
  const [passat, ...resta] = String(t).split('\n');
  if (!resta.length) return pinta(passat);
  const amb = pinta(passat).replace(/\.((?:<\/em>)?)\s*$/, '<span class="punt-temps">.</span>$1');
  return `<span class="pres-passat">${amb}</span> <span class="pres-futur">${pinta(resta.join(' '))}</span>`;
};

export const BLOCS = {
  // Transitori: HTML tal qual, mentre un bloc no tingui plantilla pròpia
  html: d => d.html,

  separador: () => '<div class="section-divider"></div>',

  // Imatge de la biblioteca de mitjans (contingut/media.json)
  imatge: (d, ctx) => {
    const e = ctx.media?.get(d.media);
    if (!e) return '';
    return `<figure class="block media-imatge media-${esc(d.mida)}">
  ${imgMedia(e, d.alt || e.alt, '(max-width: 767px) 100vw, 960px', ctx)}${d.peu ? `
  <figcaption>${enriquit(d.peu)}</figcaption>` : ''}
</figure>`;
  },

  // Galeria d'imatges de la biblioteca
  galeria: (d, ctx) => `<section class="block media-galeria">${d.titol ? `
  <h2 class="section-title">${enriquit(d.titol)}</h2>` : ''}
  <div class="media-galeria-graella">${(d.elements || []).map(el => {
    const e = ctx.media?.get(el.media);
    return e ? `
    <figure class="media-imatge">${imgMedia(e, el.alt || e.alt, '(max-width: 767px) 100vw, 480px', ctx)}</figure>` : '';
  }).join('')}
  </div>
</section>`,

  // Vídeo de la biblioteca (amb pòster opcional, que és una imatge de la mateixa biblioteca)
  video: (d, ctx) => {
    const e = ctx.media?.get(d.media);
    if (!e) return '';
    const p = e.poster ? ctx.media.get(e.poster) : null;
    const poster = p ? (ctx.imatges?.[p.id] || `/media/${p.id}-${midaSrc(p.mides)}.${p.format}`) : null;
    return `<figure class="block media-video">
  <video controls preload="none" playsinline${attr('width', px(e.amplada))}${attr('height', px(e.alcada))}${attr('poster', poster)} aria-label="${esc(d.titol)}">
    <source src="${esc(`/media/${e.id}.mp4`)}" type="video/mp4" />
  </video>${d.peu ? `
  <figcaption>${enriquit(d.peu)}</figcaption>` : ''}
</figure>`;
  },

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
  <div class="scroll-ind"><div class="line"></div><span>${esc(t(ctx?.idioma || 'ca', 'blocs.scroll'))}</span></div>
  <div class="hero-meta">${d.etiquetes.map(e => `<span>${enriquit(e, { negreta: 'b' })}</span>`).join('\n')}</div>
</header>`,

  spot: d => `
<section class="spot${d.alternat ? ' spot-alt' : ''}">
  <div class="container spot-inner">${d.num ? `
    <span class="spot-num reveal">${esc(d.num)}</span>` : ''}
    <h2 class="spot-title reveal" style="transition-delay:.1s">${enriquit(d.titol)}</h2>
    <p class="spot-text reveal" style="transition-delay:.2s">${enriquit(d.text)}</p>
  </div>
</section>`,

  // Nota breu al llarg del fil: una xifra o una data i una frase (el fil hi passa pel costat i hi deixa un punt).
  // Transició (portada.js): l'any surt gran al centre, va al seu costat i hi entra el text. Sense JavaScript, estat final.
  nota: d => `
<aside class="block nota nota-${d.costat === 'dreta' ? 'dreta' : 'esquerra'}${d.to === 'ia' ? ' nota-ia' : ''}" data-fil="nota">
  <div class="container nota-inner">${d.clau ? `
    <div class="nota-clau">${esc(d.clau)}</div>` : ''}
    <div class="nota-cos">
      <p class="nota-text">${enriquit(d.text)}</p>${d.font ? `
      <div class="nota-font">${esc(d.font)}</div>` : ''}
    </div>
  </div>
</aside>`,

  // Les nostres premisses: la presentació va dins de dues càpsules (dades i IA) que es fonen en una sola i que el fil
  // encercla; el fil subratlla la paraula en cursiva del títol i cus les premisses (fil.js hi posa .fil-arribat quan
  // hi arriba; sense JavaScript es veu tot, amb les càpsules ja fusionades)
  premisses: d => `
<section class="block premisses" data-fil="premisses">
  <div class="container premisses-inner">${d.etiqueta || d.presentacio ? `
    <div class="premisses-intro">${d.etiqueta ? `
      <span class="eyebrow">${esc(d.etiqueta)}</span>` : ''}${d.presentacio ? `
      <div class="capsules" data-fil="capsula">
        <span class="capsula capsula-dades" aria-hidden="true"></span>${String(d.presentacio).includes('\n') ? `
        <span class="capsula capsula-ia" aria-hidden="true"></span>` : ''}
        <p class="premisses-presentacio">${presentacio(d.presentacio)}</p>
      </div>` : ''}
    </div>` : ''}
    <h2 class="premisses-titol">${enriquit(d.titol).replace('<em>', '<em data-fil="subratllat">')}</h2>
    <ol class="premisses-llista">
${d.items.map(i => `      <li class="premissa" data-fil="premissa">${enriquit(i)}</li>`).join('\n')}
    </ol>
  </div>
</section>`,

  // Crida: una línia discreta (amb àncora opcional) o una targeta amb botons i vora de llum
  crida: (d, ctx) => d.variant === 'linia' ? `
<section class="block crida crida-linia"${attr('id', d.ancora)}>
  <div class="container">
    <p class="crida-linia-text"><span>${enriquit(d.titol)}</span>${d.text ? ` <span class="crida-linia-detall">${enriquit(d.text)}</span>` : ''}${d.botons.map(b => ` <a href="${esc(enllac(b.href, ctx))}">${esc(b.text)}${b.fletxa ? ' <span class="arrow" aria-hidden="true">&rarr;</span>' : ''}</a>`).join('')}</p>
  </div>
</section>` : `
<section class="block crida crida-targeta"${attr('id', d.ancora)}>
  <div class="container">
    <div class="crida-cos">
      <h2 class="section-title">${enriquit(d.titol)}</h2>${d.text ? `
      <p class="section-lead">${enriquit(d.text)}</p>` : ''}
      <div class="cta-row">${d.botons.map(b => boto(b, ctx)).join('\n')}</div>
    </div>
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
    const lang = ctx.idioma || 'ca';
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
    <p class="news-mes"><a href="/actualitat/">${esc(t(lang, 'blocs.totes_noticies'))}</a></p>` : ''}
  </div>
</section>`;
  },

  // Serveis: els dos àmbits es fonen com un Venn en fer scroll (portada.js posa --fusio de 0 a 1; sense JavaScript
  // es veuen fusionats). Cada servei és un enllaç a la seva pàgina que, amb JavaScript, obre una finestra amb
  // l'entradeta de la pàgina (ctx.serveis: contingut/serveis.json) i un enllaç per veure'n més.
  serveis: (d, ctx) => {
    const lang = ctx?.idioma || 'ca';
    // id estable de la finestra: el nom de la pàgina del servei (/serveis/dpo-extern/ → detall-dpo-extern)
    const fitxa = (e, i) => {
      const slug = /^\/serveis\/([a-z0-9-]+)\/$/.exec(e.href)?.[1] || `servei-${i + 1}`;
      const slugs = ctx.serveis?.SLUG?.ca || {};
      const clau = Object.keys(slugs).find(k => slugs[k] === slug);
      return { clau: slug, lede: (clau && ctx.serveis?.PAGINES?.[clau]?.ca?.lede) || '' };
    };
    const ambits = d.pilars.map((p, i) => ({ p, costat: i === 0 ? 'rgpd' : 'ia', serveis: p.enllacos.map((e, j) => ({ ...e, ...fitxa(e, i * 10 + j) })) }));
    return `
<section class="block services"${attr('id', d.ancora)}>
  <div class="container">
    ${capSeccio(d)}
    <div class="fusio" data-fil="serveis-escena">${ambits.map(({ p, costat, serveis }) => `
      <article class="fusio-ambit fusio-${costat}">
        <div class="fusio-cos">
          <span class="badge badge-${p.insigniaVariant}"><span class="dot"></span>${esc(p.insignia)}</span>
          <div class="fusio-subtitol">${esc(p.subtitol)}</div>
          <h3 class="fusio-titol">${enriquit(p.titol)}</h3>
          <p class="fusio-promesa">${enriquit(p.promesa)}</p>
          <ul class="fusio-resultats">
${p.resultats.map(r => `            <li>${esc(r)}</li>`).join('\n')}
          </ul>
          <div class="detall-items">
${serveis.map(e => `            <a class="detall-item detall-${costat}" href="${esc(enllac(e.href, ctx))}" data-detall="${esc(e.clau)}" aria-haspopup="dialog"><span>${esc(e.text)}</span></a>`).join('\n')}
          </div>
        </div>
      </article>`).join('')}
      <div class="fusio-junts">
        <h3 class="fusio-junts-titol">${enriquit(d.junts.titol)}</h3>
        <ul>
${d.junts.items.map(i => `          <li>${esc(i)}</li>`).join('\n')}
        </ul>
      </div>
    </div>${ambits.flatMap(({ p, costat, serveis }) => serveis.map(e => `
    <dialog class="detall-dialeg detall-dialeg-${costat}" id="detall-${esc(e.clau)}" aria-labelledby="detall-${esc(e.clau)}-titol">
      <div class="detall-dialeg-cos">
        <button type="button" class="detall-tanca" aria-label="${esc(t(lang, 'blocs.tanca'))}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg></button>
        <span class="detall-dialeg-ambit">${esc(p.subtitol)}</span>
        <h3 class="detall-dialeg-titol" id="detall-${esc(e.clau)}-titol">${esc(e.text)}</h3>${e.lede ? `
        <p class="detall-dialeg-text">${enriquit(e.lede)}</p>` : ''}
        <a class="detall-dialeg-mes" href="${esc(enllac(e.href, ctx))}">${esc(t(lang, 'blocs.mes_detalls_pregunta'))} <span>${esc(t(lang, 'blocs.mes_detalls_enllac'))}</span> <span class="arrow" aria-hidden="true">&rarr;</span></a>
      </div>
    </dialog>`)).join('')}
  </div>
</section>`;
  },

  // FAQ: les preguntes són a contingut/faq.json (ca) o contingut/faq.es.json (es), segons l'idioma de la pàgina
  // (una sola font per a la llista i el JSON-LD) i es pinten en HTML, totes obertes: sense JavaScript es llegeixen
  // totes. script.js filtra per pestanyes i en deixa oberta una.
  // Si una pregunta té «servei», sota la resposta hi ha l'enllaç a la pàgina del servei en l'idioma de la pàgina (ctx.serveis).
  faq: (d, ctx) => {
    const es = ctx.idioma === 'es';
    const lang = es ? 'es' : 'ca';
    const servei = clau => {
      const slug = ctx.serveis?.SLUG?.[lang]?.[clau], nom = ctx.serveis?.PAGINES?.[clau]?.[lang]?.curt;
      return slug && nom ? `
          <p class="faq-servei">${esc(t(lang, 'comu.interessa'))} <a href="/${es ? 'es/servicios' : 'serveis'}/${esc(slug)}/">${esc(nom)} <span class="arrow" aria-hidden="true">&rarr;</span></a></p>` : '';
    };
    const vistosId = new Set();
    return `
<section class="block faq"${attr('id', d.ancora)}>
  <div class="container">
    <div class="faq-header reveal">
      <span class="eyebrow">${esc(d.etiqueta)}</span>
      <${d.titolPrincipal ? 'h1' : 'h2'} class="section-title" style="margin-top:18px">${enriquit(d.titol)}</${d.titolPrincipal ? 'h1' : 'h2'}>
      <p class="section-lead">${enriquit(d.entradeta)}</p>
      <div class="tabs" id="faqTabs">
${d.pestanyes.map((t, i) => `        <button class="tab${i === 0 ? ' active' : ''}" data-cat="${esc(t.cat)}">${esc(t.text)}</button>`).join('\n')}
      </div>
    </div>
    <div class="faq-list" id="faqList">${(ctx.faq || []).map((f, i) => {
      const idFaq = idPreguntaFaq(f.pregunta, vistosId);
      return `
      <div class="faq-item open" id="${idFaq}" data-cat="${esc(f.cat)}">
        <button class="faq-q" type="button" aria-expanded="true" aria-controls="faq-r${i + 1}">
          <span class="num">${String(i + 1).padStart(2, '0')}</span>
          <span>${esc(f.pregunta)}</span>
          <span class="plus"></span>
        </button>
        <div class="faq-a" id="faq-r${i + 1}">
          <div class="faq-a-inner">${enriquit(f.resposta)}${f.servei ? servei(f.servei) : ''}</div>
        </div>
      </div>`;
    }).join('')}
    </div>
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
      .replace('{{entradeta}}', enriquit(d.entradeta))
      .replace('{{avantatges}}', d.avantatges?.length
        ? `<ul class="adequacio-avantatges reveal">${d.avantatges.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''),
};

export function renderBloc(bloc, ctx) {
  const fn = BLOCS[bloc.tipus];
  if (!fn) throw new Error(`Tipus de bloc desconegut: ${bloc.tipus}`);
  return fn(bloc, ctx);
}
