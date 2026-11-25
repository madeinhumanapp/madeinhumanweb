/* =============================================================
   MADEINHUMAN — Portada: els serveis es fonen i obren un resum

   - Venn: posa --fusio (de 0 a 1) a .fusio segons on és l'escena a la pantalla, i la classe .fusio-viva. Els
     estils fan créixer els dos àmbits l'un cap a l'altre fins que es superposen, i hi fan aparèixer el que tenen
     en comú. Sense JavaScript, o amb «reduir moviment», es veuen fusionats (--fusio val 1 per defecte).
     La posició es calcula amb offsetTop (sense les transformacions de l'animació): no hi ha cap bucle.
   - Ítems dels serveis: obren la finestra (<dialog>) amb l'entradeta de la pàgina del servei. Es tanca amb la X,
     clicant fora o amb Esc, i el focus torna a l'ítem. Amb Ctrl/⌘/Maj o el botó del mig, s'obre la pàgina.
   - Vores de llum: només giren quan l'element és a la pantalla (classe .llum-activa).
   Sense dependències ni peticions externes (CSP: script-src 'self').
   ============================================================= */
(function () {
  'use strict';
  const reduir = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const ambMoviment = () => !(reduir && reduir.matches);

  // ---------- Venn: els dos àmbits es fonen en fer scroll
  const escena = document.querySelector('.fusio');
  if (escena) {
    const junts = escena.querySelector('.fusio-junts');
    const posicio = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
    let topEscena = 0, centreJunts = 0, escriptori = true, raf = 0, ultim = '';
    const mesura = () => {
      topEscena = posicio(escena);
      centreJunts = junts ? posicio(junts) + junts.offsetHeight / 2 : topEscena + escena.offsetHeight;
      escriptori = window.matchMedia('(min-width: 1024px)').matches;
    };
    const calcula = () => {
      raf = 0;
      if (!escena.classList.contains('fusio-viva')) return;
      const vh = window.innerHeight, sy = window.scrollY;
      // Escriptori: comença quan l'escena entra per baix i acaba quan la part de dalt arriba al 20 % de la pantalla.
      // Mòbil: segueix la juntura (on hi ha «Junts»), que acaba al 62 % de la pantalla.
      let p = escriptori
        ? (vh * 0.85 - (topEscena - sy)) / (vh * 0.65)
        : (vh * 1.1 - (centreJunts - sy)) / (vh * 0.48);
      p = Math.min(1, Math.max(0, p));
      p = p * p * (3 - 2 * p);
      const v = String(Math.round(p * 1000) / 1000);
      if (v !== ultim) { escena.style.setProperty('--fusio', v); ultim = v; }
    };
    const demana = () => { if (!raf) raf = requestAnimationFrame(calcula); };
    const refes = () => { mesura(); ultim = ''; calcula(); };
    const activa = () => {
      const viu = ambMoviment();
      escena.classList.toggle('fusio-viva', viu);
      if (!viu) { escena.style.removeProperty('--fusio'); ultim = ''; } else refes();
    };
    window.addEventListener('scroll', demana, { passive: true });
    window.addEventListener('resize', refes);
    if ('ResizeObserver' in window) new ResizeObserver(refes).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refes);
    if (reduir && reduir.addEventListener) reduir.addEventListener('change', activa);
    activa();
  }

  // ---------- Finestres amb el resum de cada servei
  const dialegs = document.querySelectorAll('.detall-dialeg');
  const potDialeg = typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype;
  if (dialegs.length && potDialeg) {
    let origen = null;
    const tanca = d => { if (d.open) d.close(); };
    document.addEventListener('click', e => {
      const a = e.target.closest ? e.target.closest('a.detall-item[data-detall]') : null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const d = document.getElementById('detall-' + a.dataset.detall);
      if (!d) return;                            // sense finestra: l'enllaç porta a la pàgina del servei
      e.preventDefault();
      origen = a;
      d.showModal();
      document.documentElement.classList.add('dialeg-obert');
    });
    dialegs.forEach(d => {
      // Clicar fora del contingut (el fons) la tanca; clicar dins, no
      d.addEventListener('click', e => { if (e.target === d) tanca(d); });
      const x = d.querySelector('.detall-tanca');
      if (x) x.addEventListener('click', () => tanca(d));
      d.addEventListener('close', () => {
        document.documentElement.classList.remove('dialeg-obert');
        if (origen) { origen.focus({ preventScroll: true }); origen = null; }
      });
    });
  }

  // ---------- Vores de llum: només giren a la pantalla
  const llums = document.querySelectorAll('.detall-item, .fusio-junts, .adequacio > .container');
  if (llums.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('llum-activa', e.isIntersecting)), { rootMargin: '80px 0px' });
    llums.forEach(el => io.observe(el));
  }
})();
