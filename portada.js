/* =============================================================
   MADEINHUMAN — Portada: els serveis es fonen i obren un resum

   - Notes (2018, 2026…): l'any surt gran al centre, va al seu costat (on passa el fil) i hi entra el text. Posa
     --a1, --a2, --a3 (fases) i --dx (distància del centre a la posició final de l'any) i la classe .nota-viva.
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

  // Posició a la pàgina sense les transformacions de les animacions (offsetTop): cap bucle de mesura
  const posicio = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
  const suau = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const animacions = [];          // { activa(viu), mesura(), calcula(vh, sy) }

  // ---------- Notes: l'any surt gran al centre, va al seu costat i hi entra el text
  document.querySelectorAll('.nota').forEach(nota => {
    const clau = nota.querySelector('.nota-clau');
    let top = 0, ultim = '';
    animacions.push({
      activa(viu) { nota.classList.toggle('nota-viva', viu && !!clau); ultim = ''; if (!viu) ['--a1', '--a2', '--a3', '--dx'].forEach(v => nota.style.removeProperty(v)); },
      mesura() {
        top = posicio(nota);
        // del centre de la nota (el contenidor és centrat) a la posició final de l'any
        if (clau) nota.style.setProperty('--dx', `${Math.round(nota.offsetWidth / 2 - (clau.offsetLeft + clau.offsetWidth / 2))}px`);
      },
      calcula(vh, sy) {
        if (!nota.classList.contains('nota-viva')) return;
        // comença quan la nota entra per baix (95 %) i acaba quan arriba a la meitat de la pantalla
        const p = Math.min(1, Math.max(0, (vh * 0.95 - (top - sy)) / (vh * 0.45)));
        const v = [suau(p / 0.4), suau((p - 0.4) / 0.35), suau((p - 0.68) / 0.32)].map(x => String(Math.round(x * 1000) / 1000));
        const k = v.join();
        if (k === ultim) return;
        ultim = k;
        nota.style.setProperty('--a1', v[0]); nota.style.setProperty('--a2', v[1]); nota.style.setProperty('--a3', v[2]);
      },
    });
  });

  // ---------- Venn: els dos àmbits es fonen en fer scroll
  const escena = document.querySelector('.fusio');
  if (escena) {
    const junts = escena.querySelector('.fusio-junts');
    let topEscena = 0, centreJunts = 0, escriptori = true, ultim = '';
    animacions.push({
      activa(viu) { escena.classList.toggle('fusio-viva', viu); ultim = ''; if (!viu) escena.style.removeProperty('--fusio'); },
      mesura() {
        topEscena = posicio(escena);
        centreJunts = junts ? posicio(junts) + junts.offsetHeight / 2 : topEscena + escena.offsetHeight;
        escriptori = window.matchMedia('(min-width: 1024px)').matches;
      },
      calcula(vh, sy) {
        if (!escena.classList.contains('fusio-viva')) return;
        // Escriptori: comença quan l'escena entra per baix i acaba quan la part de dalt arriba al 20 % de la pantalla.
        // Mòbil: segueix la juntura (on hi ha «Junts»), que acaba al 62 % de la pantalla.
        let p = escriptori
          ? (vh * 0.85 - (topEscena - sy)) / (vh * 0.65)
          : (vh * 1.1 - (centreJunts - sy)) / (vh * 0.48);
        p = suau(p);
        const v = String(Math.round(p * 1000) / 1000);
        if (v !== ultim) { escena.style.setProperty('--fusio', v); ultim = v; }
      },
    });
  }

  if (animacions.length) {
    let raf = 0;
    const calcula = () => { raf = 0; const vh = window.innerHeight, sy = window.scrollY; animacions.forEach(a => a.calcula(vh, sy)); };
    const demana = () => { if (!raf) raf = requestAnimationFrame(calcula); };
    const refes = () => { animacions.forEach(a => a.mesura()); calcula(); };
    const activa = () => { const viu = ambMoviment(); animacions.forEach(a => a.activa(viu)); if (viu) refes(); };
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
