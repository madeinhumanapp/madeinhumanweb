/* =============================================================
   MADEINHUMAN — El fil conductor de la portada (prototip per provar, v0.3 «premium»;
   ?fil=v02 i ?fil=v01 per veure les versions anteriors)

   Dos fils de llum (coure: dades i persones; blau: IA) arriben solts a la capçalera, es trenen al
   cursor daurat del logo i acompanyen la lectura fins al contacte, on acaben en un cursor darrere
   «Parla amb nosaltres.». Es dibuixa en directe en rajoles de <canvas> posades dins de la pàgina (es
   desplacen amb el text, sense retard).

   Capes: la capa del fil va per sobre de tot el contingut (cap fons, targeta ni decoració la tapa) i per
   sota de les capes fixes (navegació, botons flotants, bàner de galetes). Mai no pinta res sobre el text,
   els controls ni la imatgeria (màscara suau), i s'esvaeix abans d'arribar a les capes fixes: no ha de
   semblar mai que passi per sota de res.

   - Avança amb el scroll i retrocedeix si es torna amunt (el scroll és el del navegador).
   - Sempre es mou (trena, polsos de llum, cursor); s'atura si la pestanya no es veu o si no hi ha
     cap tros de fil a la pantalla.
   - Amb «reduir moviment» es dibuixa sencer i quiet.
   - El recorregut es calcula amb les posicions reals de les seccions (marges i espais entre blocs) i
     es recalcula si canvia la maqueta. Si en algun punt s'acosta a un text, s'esvaeix del tot.
   - Espurnes (v0.3): destells on els fils es creuen, guspires que se'n desprenen, cap de cometa als
     polsos de llum, pols d'or dins l'aura i una estrella a la punta. Mai a sobre del text.
   - Colors de marca.css. Sense dependències ni peticions externes (CSP: script-src 'self').
   - Sense JavaScript, la web es queda exactament com ara.

   Proves: proves/fil.mjs. Per a proves deterministes, defineix window.FIL_MANUAL = true abans de
   carregar aquest fitxer i dibuixa amb madeinhumanFil.render(t, scrollY).
   ============================================================= */
(function () {
  'use strict';
  if (window.madeinhumanFil || !document.querySelector) return;

  // ---------- Configuració
  const CONFIG = {
    lectura: 0.62,        // la punta del fil va a aquesta alçada de la pantalla
    kmin: 0.25,           // px de scroll mínims per px de fil (els trams horitzontals no surten de cop)
    pas: 3,               // pas de mostreig del recorregut (px)
    polsCada: 6,          // un pols de llum cada 6 s
    tempsBucle: 12,
    msObjectiu: 9,        // si un fotograma triga més, es rebaixa la qualitat
    // Selectors: primer l'atribut data-fil (si les plantilles el porten) i, si no, les classes actuals
    sel: {
      capcalera: '[data-fil="capcalera"], header.hero',
      context: '[data-fil="context"], .statement', xifra: '.metric',
      principi: '[data-fil="principi"], .spot', titolPrincipi: '.spot-title', nota: '[data-fil="nota"], .nota',
      subratllat: '[data-fil="subratllat"]', premissa: '[data-fil="premissa"]',
      serveis: '[data-fil="serveis"], #serveis', escena: '[data-fil="serveis-escena"], .fusio', pilar: '.fusio-ambit', junts: '.fusio-junts',
      metode: '[data-fil="metode"], #metode', fase: '.step', numFase: '.step-num',
      contacte: '[data-fil="contacte"], #contacte', titolContacte: '.section-title', etiquetaContacte: '.eyebrow',
      fixos: '.nav, .whatsapp-float, .back-to-top, .scroll-progress, .cookie-banner, .fil-capa',
      // capes fixes per sobre del fil: el fil s'hi esvaeix al voltant (es mesuren a cada fotograma)
      capesFixes: '.nav, .whatsapp-float, .back-to-top, .cookie-banner',
      // imatgeria del contingut: com el text, el fil no hi pinta mai a sobre
      media: 'img, svg, video, iframe, picture',
    },
  };

  // ---------- Utilitats
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  const q = (s, p = document) => p && p.querySelector(s), qa = (s, p = document) => p ? [...p.querySelectorAll(s)] : [];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const hash = (n, k) => { const x = Math.sin(n * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- Estils del traç ([mòbil, escriptori] on hi ha parells)
  // · v03 (per defecte, «premium»): el traç de la v02 amb un reflex de fibra òptica a la cara de davant de
  //   cada fil (llum: [alfa, amplada relativa, barreja amb crema]) i les espurnes.
  // · v02 («arrodonit»): un sol traç per fil, gruixut i suau; la trena gira lenta (una volta cada 320 px) i
  //   amb profunditat gradual; on els fils es trenen, una aura compartida de color barrejat (simbiosi).
  // · v01: el primer prototip (tres fibres per fil, trena atapeïda).
  // Les capes, les màscares i l'esvaïment davant del text són els mateixos per als tres estils.
  const NIVELLS_SUAUS = [
    { z: 0.5, w: 1.15, halo: [0.07, 7], mig: [0.17, 2.8], nucli: [0.95, 0.5] },
    { z: 0, w: 1.0, halo: [0.06, 6.5], mig: [0.15, 2.6], nucli: [0.85, 0.45] },
    { z: -0.5, w: 0.88, halo: [0.05, 6], mig: [0.12, 2.4], nucli: [0.68, 0.36] },
    { z: -Infinity, w: 0.78, halo: [0.04, 5.5], mig: [0.09, 2.2], nucli: [0.52, 0.28] },
  ];
  // v03: profunditat contínua en 8 nivells (cap salt visible de brillantor) i halo d'un sol traç (sense juntes).
  // El reflex (llum) s'encén a poc a poc quan el fil gira cap endavant.
  const NQ = 8;
  const NIVELLS_CONTINUS = Array.from({ length: NQ }, (_, b) => {
    const zc = 1 - (2 * b + 1) / NQ, f = (zc + 1) / 2;                  // centre del nivell, de davant (b = 0) a darrere
    return {
      // amplada gairebé constant (els canvis d'amplada entre nivells farien esglaons); el volum el dona l'alfa
      z: b === NQ - 1 ? -Infinity : 1 - 2 * (b + 1) / NQ, w: mix(0.86, 1.1, f),
      halo: [0.06, 6.5], mig: [mix(0.09, 0.17, f), 2.5 / mix(0.86, 1.1, f)], nucli: [mix(0.52, 0.95, f), mix(0.28, 0.5, f)],
      llum: smooth((zc + 0.15) / 0.9),
    };
  });
  const ESTILS = {
    v03: {
      fibres: [[0], [0]], radi: [5.5, 10], LB: [170, 320], V: [20, 42], gruix: [1.4, 1.9],
      ona: [0.65, 0.35, 0], desfilat: 0, margeExtra: 1.5,
      aura: [0.035, 0.05], llum: [0.42, 0.38, 0.62], espurnes: true, haloContinu: true,
      nivells: NIVELLS_CONTINUS,
    },
    v02: {
      fibres: [[0], [0]], radi: [5.5, 10], LB: [170, 320], V: [20, 42], gruix: [1.4, 1.9],
      ona: [0.65, 0.35, 0], desfilat: 0, margeExtra: 1.5,
      aura: [0.035, 0.05], llum: null, espurnes: false,
      nivells: NIVELLS_SUAUS,
    },
    v01: {
      fibres: [[0, 1], [-1, 0, 1]], radi: [3.5, 7], LB: [52, 130], V: [24, 50], gruix: [1.2, 1.35],
      ona: [0.55, 0.30, 0.15], desfilat: 1, margeExtra: 0, aura: null, llum: null, espurnes: false,
      nivells: [
        { z: -0.05, w: 1, halo: [0.06, 9], mig: [0.15, 3.4], nucli: [0.95, 0.55] },
        { z: -Infinity, w: 1, halo: [0.05, 7], mig: null, nucli: [0.42, 0.24] },
      ],
    },
  };
  const nomEstil = (() => { try { return new URLSearchParams(location.search).get('fil'); } catch (e) { return null; } })();
  const NOM_ESTIL = ESTILS[nomEstil] ? nomEstil : 'v03', E = ESTILS[NOM_ESTIL];


  // ---------- Colors (de marca.css; valors de reserva per si no hi són)
  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const hex = (v, d) => { const m = /#([0-9a-f]{6})/i.exec(cs.getPropertyValue(v) || ''); return m ? [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16)) : d; };
    const daurat = hex('--daurat', [196, 149, 106]), dauratClar = hex('--daurat-clar', [217, 168, 120]);
    const blauClar = hex('--blau-clar', [143, 182, 255]), crema = hex('--crema', [243, 239, 232]);
    return { daurat, dauratClar, crema, blau: blauClar, coure: dauratClar.map((v, i) => mix(v, crema[i], 0.25)) };
  }

  // ---------- Geometria: Catmull-Rom centrípeta + remostreig a passos iguals
  function corbaCR(pts) {
    const n = pts.length, out = [];
    const P = [[2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]], ...pts,
      [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]]];
    const dist = (a, b) => Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const t0 = 0, t1 = Math.sqrt(dist(p0, p1)), t2 = t1 + Math.sqrt(dist(p1, p2)), t3 = t2 + Math.sqrt(dist(p2, p3));
      const passos = Math.max(4, Math.ceil(dist(p1, p2) / 2));
      for (let k = 0; k < passos; k++) {
        const t = t1 + (t2 - t1) * k / passos;
        const L = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
        const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
        out.push(L(L(A1, A2, t0, t2), L(A2, A3, t1, t3), t1, t2));
      }
    }
    out.push(pts[n - 1]);
    return out;
  }
  // Ancoratges a prop dels extrems dels trams rectes llargs: la corba no s'arqueja (a mòbil sortiria de pantalla)
  function ancorar(pts) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L > 160 && (Math.abs(dx) < 3 || Math.abs(dy) < 3)) { const e = 45 / L; out.push([a[0] + dx * e, a[1] + dy * e], [b[0] - dx * e, b[1] - dy * e]); }
      out.push(b);
    }
    return out;
  }
  function remostrejar(poly, ds) {
    const acc = [0];
    for (let i = 1; i < poly.length; i++) acc.push(acc[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
    const L = acc[acc.length - 1], n = Math.max(2, Math.floor(L / ds) + 1), out = [];
    let j = 0;
    for (let i = 0; i < n; i++) {
      const s = Math.min(L, i * ds);
      while (j < acc.length - 2 && acc[j + 1] < s) j++;
      const f = (s - acc[j]) / Math.max(1e-9, acc[j + 1] - acc[j]);
      out.push({ x: mix(poly[j][0], poly[j + 1][0], f), y: mix(poly[j][1], poly[j + 1][1], f), d: s });
    }
    for (let i = 0; i < n; i++) {
      const a = out[Math.max(0, i - 2)], b = out[Math.min(n - 1, i + 2)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
      out[i].nx = ty / l; out[i].ny = -tx / l;
    }
    return out;
  }
  const corba = pts => remostrejar(corbaCR(ancorar(pts)), CONFIG.pas);

  // ---------- Mesures del DOM en coordenades de document (sense les translacions de les animacions d'aparició)
  function caixa(el) {
    let x = 0, y = 0, e = el;
    while (e) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight, r: x + el.offsetWidth, b: y + el.offsetHeight };
  }
  function referencia(el) {          // avantpassat amb una sola caixa (els elements en línia poden ocupar diverses línies)
    let e = el;
    while (e && e !== document.body && getComputedStyle(e).display === 'inline') e = e.parentElement;
    return e || el;
  }
  // Rectangle de pantalla → document, compensant les transformacions de les animacions (translació i escala; p. ex.
  // l'any d'una nota que comença gran al centre, o els àmbits del Venn que creixen): sempre la posició final
  function aDocument(r, ref) {
    const r0 = ref.getBoundingClientRect(), c = caixa(ref);
    const ex = c.w && r0.width ? r0.width / c.w : 1, ey = c.h && r0.height ? r0.height / c.h : 1;
    const fx = v => c.x + (v - r0.left) / ex, fy = v => c.y + (v - r0.top) / ey;
    return [fx(r.left), fy(r.top), fx(r.right), fy(r.bottom)];
  }
  function fiDeText(el) {            // final de l'última línia d'un titular
    const rng = document.createRange(); rng.selectNodeContents(el);
    const rs = [...rng.getClientRects()].filter(r => r.width > 0), r = rs[rs.length - 1];
    if (!r) { const c = caixa(el); return { x: c.r, y: c.b, h: c.h }; }
    const z = aDocument(r, referencia(el));
    return { x: z[2], y: z[3], h: z[3] - z[1] };
  }
  function finalCap(seccio, yContingut) {   // part inferior de tot el que hi ha per sobre d'un bloc (títol, paràgraf…)
    let b = 0;
    for (const el of qa('*', q('.container', seccio) || seccio)) {
      if (!el.offsetParent || !el.offsetHeight) continue;
      const c = caixa(el);
      if (c.b <= yContingut + 1 && c.h < 400) b = Math.max(b, c.b);
    }
    return b;
  }
  // Zones on el fil no es pot veure: línies de text, controls (botons, camps) i imatgeria (imatges, SVG, vídeos)
  function zonesDeText(yMax) {
    const zs = [], rng = document.createRange();
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
      { acceptNode: n => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest(CONFIG.sel.fixos) || el.closest('script,style,noscript,template')) continue;
      rng.selectNodeContents(n);
      const rs = rng.getClientRects();
      if (!rs.length) continue;
      const ref = referencia(el);
      for (const r of rs) {
        if (r.width < 1 || r.height < 1) continue;
        const z = aDocument(r, ref);
        if (z[1] <= yMax) zs.push(z);
      }
    }
    for (const el of qa('a.btn, button, input, select, textarea')) {
      if (el.closest(CONFIG.sel.fixos) || !el.offsetParent) continue;
      const c = caixa(el);
      if (c.y <= yMax) zs.push([c.x, c.y, c.r, c.b]);
    }
    for (const el of qa(CONFIG.sel.media)) {
      if (el.closest(CONFIG.sel.fixos) || (el.parentElement && el.parentElement.closest('svg'))) continue;
      let ref = el.parentElement;              // els SVG no tenen offsetParent: es mesuren des del pare HTML
      while (ref && !(ref instanceof HTMLElement)) ref = ref.parentElement;
      const r = el.getBoundingClientRect();
      if (!ref || r.width < 1 || r.height < 1) continue;
      const z = aDocument(r, referencia(ref));
      if (z[1] <= yMax) zs.push(z);
    }
    return zs.sort((a, b) => a[1] - b[1]);
  }

  // ---------- Recorregut
  function Ruta(vh) { this.vh = vh; this.peces = []; this.nodes = []; this.u = 0; this.s = 0; this.trig = 0; }
  Ruta.prototype.disparador = function (p, primer) {
    const t = Math.max(primer ? this.trig : this.trig + CONFIG.pas * CONFIG.kmin, p.y - CONFIG.lectura * this.vh);
    p.trig = t; this.trig = t;
  };
  // Tram compartit: els dos fils al voltant d'una mateixa espina (solts o trenats)
  Ruta.prototype.comu = function (pts, o = {}) {
    if (pts.length < 2) return null;
    const m = corba(pts), L = m[m.length - 1].d;
    for (const p of m) {
      p.r = (o.radi || 0) * (o.entrada ? smooth(p.d / o.entrada) : 1) * (o.sortida ? smooth((L - p.d) / o.sortida) : 1);
      p.la = 0; p.s = this.s + p.d; p.u = this.u + p.d;
    }
    if (o.prep) o.prep(m, L);
    m.forEach((p, i) => { if (o.sempre) p.trig = 0; else this.disparador(p, i === 0); });
    this.s += L; this.u += L;
    this.peces.push({ tipus: 'comu', m, int: o.int || 0.72 });
    return m;
  };
  // Tram separat: cada fil pel seu camí fins que es tornen a trobar
  Ruta.prototype.separat = function (ptsA, ptsB, o = {}) {
    const ms = [corba(ptsA), corba(ptsB)], Ls = ms.map(m => m[m.length - 1].d), L = Math.max(...Ls), t0 = this.trig, fins = [];
    ms.forEach((m, k) => {
      let tr = t0;
      m.forEach((p, i) => {
        p.r = 0; p.la = o.ona || 0; p.s = this.s + p.d; p.u = this.u + p.d * (L / Ls[k]);
        tr = Math.max(i ? tr + CONFIG.pas * CONFIG.kmin : tr, p.y - CONFIG.lectura * this.vh); p.trig = tr;
      });
      fins.push(tr);
    });
    this.trig = Math.max(...fins); this.s += L; this.u += L;
    this.peces.push({ tipus: 'separat', m: ms, int: o.int || 0.8 });
  };
  Ruta.prototype.mostres = function () { return this.peces.flatMap(pc => (pc.tipus === 'comu' ? pc.m : pc.m.flat())); };
  Ruta.prototype.tancar = function (zones, C) {
    const totes = this.mostres();
    for (const n of this.nodes) {          // cada node s'activa quan hi arriba el fil
      if (n.trig !== undefined) continue;
      let best = totes[0], bd = Infinity;
      for (const p of totes) { const d = (p.x - n.ax) ** 2 + (p.y - n.ay) ** 2; if (d < bd) { bd = d; best = p; } }
      n.trig = best.trig; n.u = best.u;
    }
    // Esvaïment davant del text: marge conservador (desplaçament màxim de la mostra + gruix + aura). El fil
    // s'esvaeix del tot (fins a 0) en C.fade px abans del marge; a més, la màscara del dibuix retalla qualsevol
    // resplendor o espurna que arribi a una zona protegida. p.lliure: distància de l'eix a la zona més propera
    // (mida màxima de les espurnes que hi poden sortir).
    let hmax = 0;
    for (const z of zones) hmax = Math.max(hmax, z[3] - z[1]);
    const ABAST = 80;                          // fins on es mira la distància lliure
    for (const p of totes) {
      // el subratllat (un sol cordó prim) pot anar a tocar de la paraula: marge i esvaïment mínims
      p.m = p.sub ? p.r + 1.5 : 1.5 * p.la + Math.max(p.r + 2.5 + E.margeExtra, p.r >= 0.4 * C.radi ? C.mAura : 0);
      let dmin = Infinity, lliure = ABAST;
      let lo = 0, hi = zones.length;           // primera zona que podria tocar (ordenades per y0)
      while (lo < hi) { const mid = (lo + hi) >> 1; if (zones[mid][1] < p.y - hmax - ABAST) lo = mid + 1; else hi = mid; }
      for (let i = lo; i < zones.length && zones[i][1] <= p.y + Math.max(p.m, ABAST) + 2; i++) {
        const z = zones[i];
        const ex = Math.max(z[0] - p.x, 0, p.x - z[2]), ey = Math.max(z[1] - p.y, 0, p.y - z[3]);
        lliure = Math.min(lliure, Math.hypot(ex, ey));
        dmin = Math.min(dmin, Math.hypot(Math.max(ex - p.m, 0), Math.max(ey - p.m, 0)));
        if (!lliure) break;
      }
      p.lliure = lliure;
      p.vis = smooth(dmin / (p.sub ? 3 : C.fade));
    }
    C.zones = zones; C.hmax = hmax;
    C.esvaides = totes.filter(p => p.vis < 0.5).length;
  };

  function construir(vw, vh) {
    const S = CONFIG.sel, mobil = vw < 700;
    const heroEl = q(S.capcalera);
    if (!heroEl) return null;
    const hero = caixa(heroEl), H = hero.h;
    const ci = q('.container', heroEl) || heroEl, cb = caixa(ci), pad = parseFloat(getComputedStyle(ci).paddingLeft) || 0;
    const textL = cb.x + pad, textR = cb.x + cb.w - pad;
    const xL = mobil ? 7 : textL / 2, xR = mobil ? vw - 7 : textR + (vw - textR) * 0.42;
    const K = mobil ? 0.404 : H / 1080;
    const R = new Ruta(vh);
    const C = {
      mobil, K, xL, xR, colors: colors(),
      fibres: E.fibres[mobil ? 0 : 1],
      radi: E.radi[mobil ? 0 : 1], LB: E.LB[mobil ? 0 : 1], V: E.V[mobil ? 0 : 1], gruix: E.gruix[mobil ? 0 : 1],
      solt: (mobil ? 50 : 56) * K, cursor: mobil ? [26, 7] : [46 * K, 12 * K],
    };
    C.mAura = E.aura ? C.radi + 6 : 0;
    C.fade = mobil ? 5 : 9;                     // px en què el fil s'esvaeix del tot abans d'un text
    // Espurnes: destells als encreuaments (cada «periode» s, només una part dels encreuaments), guspires que
    // se'n desprenen, cap de cometa i rastre dels polsos de llum. Mides en px de pantalla.
    C.esp = mobil
      ? { periode: 6, actius: 0.6, vida: 1.7, n: 3, dist: 12, deriva: 4, mida: 0.8, L: 7, capL: 5, rastre: [0, 9, 18, 27] }
      : { periode: 4.8, actius: 0.7, vida: 1.7, n: 4, dist: 22, deriva: 7, mida: 1, L: 12, capL: 7, rastre: [0, 14, 28, 42] };

    // 1) Capçalera: fils solts → cursor → trenats, i baixen pel marge dret
    const P = (fx, fy) => [fx * vw, hero.y + fy * H];
    const heroPts = mobil
      ? [P(-0.14, 0.945), P(0.08, 0.94), P(0.26, 0.933), P(0.40, 0.925), P(0.46, 0.92), P(0.62, 0.895), P(0.75, 0.872), P(0.88, 0.858), [xR, hero.y + 0.915 * H], [xR, hero.b + 40]]
      : [P(-0.06, 0.875), P(0.12, 0.868), P(0.30, 0.862), P(0.46, 0.852), P(0.585, 0.836), P(0.68, 0.80), P(0.77, 0.735), P(0.85, 0.70), P(0.905, 0.725), [xR, hero.y + 0.83 * H], [xR, hero.b + 40]];
    const fusioX = (mobil ? 0.46 : 0.585) * vw;
    // els fils solts passen per sota dels botons amb prou marge, encara que la pantalla sigui baixa
    const yMinSolt = Math.min(hero.b - 24, cb.b + 1.5 * C.solt + 14);
    for (let i = 0; i < heroPts.length && heroPts[i][0] <= fusioX + 1; i++) heroPts[i][1] = Math.max(heroPts[i][1], yMinSolt);
    let fusio = null;
    R.comu(heroPts, {
      sempre: true, int: 1,
      prep: m => {
        fusio = m.find(p => p.x >= fusioX) || m[(m.length / 2) | 0];
        const rH = (mobil ? 20 : 13) * K;
        for (const p of m) {
          const d = p.d - fusio.d;
          p.la = d < 0 ? C.solt * smooth(-d / (560 * K)) : 0;
          p.r = d > 0 ? mix(rH, C.radi, smooth((p.y - hero.y - 0.8 * H) / (0.25 * H))) * smooth(d / (110 * K)) : 0;
        }
      },
    });
    C.uFusio = fusio.u; C.dFusio = fusio.d;
    R.nodes.push({ tipus: 'cursor', x: fusio.x + C.cursor[0] * 0.25, y: fusio.y + (mobil ? 16 : 27 * K), w: C.cursor[0], h: C.cursor[1], parpelleja: true, flaix: true, trig: 0, u: fusio.u });
    C.motes = Array.from({ length: mobil ? 34 : 60 }, (_, i) => {
      const r = n => Math.abs((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1);
      return { s0: r(1), o: r(2) * 2 - 1, k: r(3) < 0.5 ? 0 : 1, r: 0.8 + r(4) * 1.3, al: 0.3 + r(5) * 0.5, ph: r(6), m: 1 + Math.floor(r(7) * 3) };
    });

    // 2) Estacions: notes (xifra i frase), principis (spots) i, si n'hi ha, el bloc de context. El fil hi passa pel
    //    costat (les notes porten el seu; els principis alternen) i, entre dues estacions de costats diferents,
    //    creua la pàgina pel mig de l'espai que les separa. A cada nota deixa un punt i a cada principi, un nus.
    let tram = [[xR, hero.b + 40]];
    let opcionsTram = { radi: C.radi, entrada: 0 };
    const nusos = [], aprimats = [];       // nusos: la trena s'estreny · aprimats: trams de subratllat (un sol cordó)
    const tancaTram = (o = {}) => {
      R.comu(tram, { ...opcionsTram, ...o, prep: m => { for (const p of m) {
        let dm = 1e9; for (const [x, y] of nusos) dm = Math.min(dm, Math.hypot(p.x - x, p.y - y));
        p.r *= 0.15 + 0.85 * smooth(dm / (mobil ? 40 : 70));
        for (const a of aprimats) {
          const dx = Math.max(a.x0 - p.x, 0, p.x - a.x1), d = Math.hypot(dx, p.y - a.y), f = 0.12 + 0.88 * smooth(d / (mobil ? 30 : 50));
          p.r *= f;
          if (f < 0.35) p.sub = true;            // subratllat: cordó prim, a tocar de la paraula
        }
      } } });
    };
    // Rectangle (en coordenades de document) de l'última línia d'un element en línia, p. ex. una <em>
    const ultimaLinia = el => {
      const rng = document.createRange(); rng.selectNodeContents(el);
      const rs = [...rng.getClientRects()].filter(r => r.width > 0), r = rs[rs.length - 1];
      if (!r) { const c = caixa(referencia(el)); return { x0: c.x, x1: c.r, y0: c.y, y1: c.b }; }
      const z = aDocument(r, referencia(el));
      return { x0: z[0], x1: z[2], y0: z[1], y1: z[3] };
    };
    // Extrems del text d'un bloc (les premisses són centrades: el fil hi fa el nus a tocar)
    const extremsText = el => {
      const rng = document.createRange(); rng.selectNodeContents(el);
      const rs = [...rng.getClientRects()].filter(r => r.width > 0).map(r => aDocument(r, el));
      if (!rs.length) { const c = caixa(el); return { x0: c.x, x1: c.r }; }
      return { x0: Math.min(...rs.map(z => z[0])), x1: Math.max(...rs.map(z => z[2])) };
    };
    const serveisEl = q(S.serveis), svY = serveisEl ? caixa(serveisEl).y : Infinity;
    const metEl = q(S.metode), mtY = metEl ? caixa(metEl).y : Infinity;
    const mE = metEl ? caixa(q('.eyebrow', metEl) || q('.section-title', metEl) || metEl) : null;
    const estacions = [];
    for (const el of qa(S.nota)) {
      const c = caixa(q('.nota-inner', el) || el), k = caixa(q('.nota-clau', el) || q('.nota-text', el) || el);
      estacions.push({ tipus: 'nota', y: c.y, b: c.b, costat: el.classList.contains('nota-dreta') ? 'dreta' : 'esquerra', ny: k.y + k.h / 2, kx: k.x, kr: k.r });
    }
    for (const el of qa(S.principi)) {
      const c = caixa(q('.container', el) || el), t = caixa(q(S.titolPrincipi, el) || el);
      estacions.push({ tipus: 'spot', y: t.y, b: c.b, t });
    }
    for (const el of qa(S.subratllat)) {
      const l = ultimaLinia(el);
      estacions.push({ tipus: 'subratllat', y: l.y0, b: l.y1, l, yU: l.y1 + 8 });
    }
    for (const el of qa(S.premissa)) {
      const c = caixa(el), e = extremsText(el);
      estacions.push({ tipus: 'premissa', y: c.y, b: c.b, ny: c.y + c.h / 2, e, el });
    }
    const ctxEl = q(S.context);
    if (ctxEl) { const sb = caixa(ctxEl); estacions.push({ tipus: 'context', y: sb.y, b: sb.b, costat: 'dreta', el: ctxEl }); }
    estacions.sort((a, b) => a.y - b.y);
    let costatActual = 'dreta', ultimB = hero.b, anterior = null;
    const recorre = llista => {
      for (const st of llista) {
        // Subratllat: el fil hi arriba pel seu costat, passa per sota de la paraula (un sol cordó) i surt per l'altre
        if (st.tipus === 'subratllat') {
          const { x0, x1 } = st.l, yU = st.yU, dePerDreta = costatActual !== 'esquerra';
          const [xa, xb] = dePerDreta ? [x1, x0] : [x0, x1], s = dePerDreta ? 1 : -1;
          // punts alineats cada 32 px: el tram del subratllat queda recte (la corba no s'hi pot arquejar cap a la paraula)
          const pas = 32, n = Math.max(1, Math.round(Math.abs(xb - xa) / pas)), recte = [];
          for (let i = 0; i <= n; i++) recte.push([mix(xa + s * 6, xb - s * 6, i / n), yU]);
          tram.push([dePerDreta ? xR : xL, yU - (mobil ? 40 : 70)], [xa + s * (mobil ? 26 : 60), yU], ...recte, [xb - s * (mobil ? 22 : 44), yU + (mobil ? 18 : 30)]);
          aprimats.push({ x0: x0 - 6, x1: x1 + 6, y: yU });
          costatActual = dePerDreta ? 'esquerra' : 'dreta'; ultimB = yU + (mobil ? 18 : 30); anterior = st;
          continue;
        }
        // Principis: alternen; premisses: la primera, pel costat per on arriba el fil, i després alternen
        if (st.tipus === 'spot') st.costat = costatActual === 'dreta' ? 'esquerra' : 'dreta';
        if (st.tipus === 'premissa') st.costat = anterior && anterior.tipus === 'premissa'
          ? (costatActual === 'dreta' ? 'esquerra' : 'dreta') : (costatActual === 'dreta' ? 'dreta' : 'esquerra');
        const esq = st.costat === 'esquerra';
        const x = st.tipus === 'spot' && !mobil ? (esq ? st.t.x / 2 : (st.t.r + vw) / 2) : (esq ? xL : xR);
        // canvi de costat: creua pel mig de l'espai lliure (si ve del mig, va directament cap al costat)
        if (st.costat !== costatActual) tram.push([costatActual === 'mig' ? x : vw / 2, (ultimB + st.y) / 2]);
        if (st.tipus === 'premissa') {
          // el nus, a tocar del text (centrat): el fil cus les premisses
          const g = mobil ? 22 : 34, xp = esq ? Math.max(mobil ? 7 : xL, st.e.x0 - g) : Math.min(mobil ? vw - 7 : xR, st.e.x1 + g);
          tram.push([xp, st.y - (mobil ? 26 : 40)], [xp, st.ny], [xp, st.b + (mobil ? 24 : 28)]);
          nusos.push([xp, st.ny]);
          R.nodes.push({ tipus: 'nus', x: xp, y: st.ny, ax: xp, ay: st.ny, el: st.el });
          costatActual = st.costat; ultimB = st.b; anterior = st;
          continue;
        }
        if (st.tipus === 'spot') {
          const ny = st.t.y + st.t.h / 2;
          tram.push([x, st.y - 70], [x, ny], [x, st.b - 10]);
          nusos.push([x, ny]);
          R.nodes.push({ tipus: 'nus', x, y: ny, ax: x, ay: ny });
        } else if (st.tipus === 'nota') {
          tram.push([x, st.y - 10], [x, st.ny], [x, st.b + 10]);
          nusos.push([x, st.ny]);
          // un punt a l'altura de la xifra i una línia de llum que hi apunta
          R.nodes.push({ tipus: 'punt', x, y: st.ny, ax: x, ay: st.ny, cap: esq ? st.kx - 14 : st.kr + 14 });
        } else {
          tram.push([x, st.y + 50]);
          for (const m of qa(S.xifra, st.el).map(caixa)) {
            tram.push([x, m.y + m.h / 2]);
            R.nodes.push({ tipus: 'punt', x, y: m.y + m.h / 2, ax: x, ay: m.y + m.h / 2 });
          }
          tram.push([x, st.b - 30]);
        }
        costatActual = st.costat; ultimB = st.b; anterior = st;
      }
    };
    recorre(estacions.filter(st => st.y < svY));

    // 3) Serveis (el Venn): el coure baixa pel costat de l'àmbit de RGPD i el blau pel de l'IA; es retroben a sota,
    //    al mig, després del que tenen en comú («Junts»). L'escena s'anima amb transform: les caixes són les finals.
    const escena = serveisEl && q(S.escena, serveisEl);
    const ambits = escena ? qa(S.pilar, escena).map(caixa) : [];
    if (escena && ambits.length >= 2) {
      const sc = caixa(escena), jEl = q(S.junts, escena), jb = jEl ? caixa(jEl).b : sc.b;
      const svE = caixa(q('.eyebrow', serveisEl) || q('.section-title', serveisEl) || serveisEl);
      const esq = ambits.reduce((a, b) => (b.x < a.x ? b : a)), dre = ambits.reduce((a, b) => (b.r > a.r ? b : a));
      const ySplit = (finalCap(serveisEl, sc.y) + sc.y) / 2, yJoin = Math.max(sc.b, jb) + (mobil ? 30 : 40);
      const xCu = mobil ? xL : (xL + esq.x) / 2, xBl = mobil ? xR : (dre.r + xR) / 2;
      if (costatActual !== 'esquerra') tram.push([vw / 2, (ultimB + svE.y) / 2]);
      tram.push([xCu, svE.y - 30], [xCu, ySplit]);
      tancaTram({ sortida: mobil ? 54 : 90 });
      const e = mobil ? 30 : 50, mig = vw / 2;
      R.separat(
        [[xCu, ySplit], [xCu, ySplit + e], [xCu, yJoin - e], [xCu + e, yJoin], [mig - 2 * e, yJoin], [mig - 0.4 * e, yJoin + 0.25 * e], [mig, yJoin + e]],
        [[xCu, ySplit], [xCu + e, ySplit], [mig, ySplit], [xBl - e, ySplit + 2], [xBl, ySplit + e], [xBl, yJoin - e], [xBl - e, yJoin], [mig + 2 * e, yJoin], [mig + 0.4 * e, yJoin + 0.25 * e], [mig, yJoin + e]],
        { ona: mobil ? 1.5 : 3 });
      tram = [[mig, yJoin + e]];
      opcionsTram = { radi: C.radi, entrada: 80 };
      costatActual = 'mig'; ultimB = yJoin + e;
    } else if (serveisEl) {
      const sb = caixa(serveisEl);
      if (costatActual !== 'dreta') tram.push([vw / 2, (ultimB + sb.y) / 2]);
      tram.push([xR, sb.y + 40], [xR, sb.b - 40]);
      costatActual = 'dreta'; ultimB = sb.b;
    }

    // 4) Estacions entre els serveis i el mètode; al mètode, la trena fa de línia de temps i encén un cursor a cada fase
    recorre(estacions.filter(st => st.y > svY && st.y < mtY));
    let ultimX = tram[tram.length - 1][0], ultimY = tram[tram.length - 1][1];
    if (mE && costatActual !== 'esquerra') tram.push([costatActual === 'mig' ? xL : vw / 2, (ultimB + mE.y) / 2]);
    const elsFase = qa(S.fase, metEl), fases = elsFase.map(caixa), nums = qa(S.numFase, metEl).map(caixa);
    if (metEl && fases.length) {
      const mb = caixa(metEl);
      if (!mobil) {
        const yT = (finalCap(metEl, fases[0].y) + fases[0].y) / 2;
        tram.push([xL, mE.y], [xL, yT - 40], [xL + 40, yT], [vw / 2, yT], [xR - 40, yT], [xR, yT + 40], [xR, mb.b - 40]);
        (nums.length ? nums : fases).forEach((n, i) => R.nodes.push({ tipus: 'cursor', fita: true, x: n.x + C.cursor[0] / 2, y: yT + 18 * K, w: C.cursor[0] * 0.8, h: C.cursor[1] * 0.8, ax: n.x + C.cursor[0] / 2, ay: yT, el: elsFase[i] }));
      } else {
        tram.push([xL, mE.y], [xL, mb.b - 40]);
        (nums.length ? nums : fases).forEach((n, i) => R.nodes.push({ tipus: 'cursor', fita: true, x: xL + 0.5, y: n.y + n.h / 2, w: 12, h: 4, ax: xL, ay: n.y + n.h / 2, el: elsFase[i] }));
      }
      ultimX = tram[tram.length - 1][0]; ultimY = tram[tram.length - 1][1];
    }

    // 5) Contacte: el fil acaba en el cursor del logo, darrere «Parla amb nosaltres.»
    const ctEl = q(S.contacte), ttl = q(S.titolContacte, ctEl);
    let yFi = ultimY + 200;
    if (ctEl && ttl) {
      const ct = caixa(ctEl), cE = caixa(q(S.etiquetaContacte, ctEl) || ttl), fi = fiDeText(ttl);
      const cw = mobil ? 18 : 34 * K * 1.2, ch = mobil ? 5 : 9 * K * 1.2;
      const curX = fi.x + (mobil ? 8 : 12) + cw / 2, curY = fi.y - fi.h * 0.26;
      if (!mobil) tram.push([xR, ct.y + 30], [Math.min(xR - 60, curX + 260), cE.y - 10], [curX + 80, curY - 6], [curX + cw / 2 + 4, curY]);
      else tram.push([ultimX === xL ? vw / 2 : xR, ultimX === xL ? ((ultimY + cE.y) / 2) : cE.y - 20], [xR, cE.y + 10], [xR, curY - 12], [curX + cw / 2 + 24, curY], [curX + cw / 2 + 3, curY]);
      tancaTram({ sortida: mobil ? 70 : 140 });
      R.nodes.push({ tipus: 'cursor', final: true, parpelleja: true, x: curX, y: curY, w: cw, h: ch, ax: curX + cw / 2 + 4, ay: curY });
      yFi = curY + 40;
    } else {
      tram.push([ultimX, ultimY + 160]);
      tancaTram({ sortida: 160 });
    }
    R.tancar(zonesDeText(yFi + 200), C);
    C.uFinal = R.u;
    // Trams trenats (per trobar un punt del recorregut a partir de la coordenada s) i pols d'or de l'aura:
    // una mota per finestra de recorregut trenat, que hi llisca lentament i parpelleja
    C.comus = R.peces.filter(pc => pc.tipus === 'comu').map(pc => ({ s0: pc.m[0].s, s1: pc.m[pc.m.length - 1].s, m: pc.m }));
    C.sComu0 = Math.min(...C.comus.map(c => c.s0)); C.sComu1 = Math.max(...C.comus.map(c => c.s1));
    C.pols = [];
    if (E.espurnes) {
      const sp = mobil ? 64 : 42;
      for (const c of C.comus) for (let s0 = c.s0; s0 + sp <= c.s1; s0 += sp) {
        const fin = c.m.slice(Math.round((s0 - c.s0) / CONFIG.pas), Math.round((s0 + sp - c.s0) / CONFIG.pas) + 1);
        if (!fin.length || fin[(fin.length / 2) | 0].r < 0.5 * C.radi) continue;
        const i = C.pols.length + 1, ys = fin.map(p => p.y);
        C.pols.push({
          s0, sp, ph: hash(i, 11), v: (6 + 9 * hash(i, 12)) * (hash(i, 13) < 0.8 ? 1 : -1), lat: hash(i, 14) * 2 - 1,
          r: (mobil ? 0.45 : 0.55) + 0.5 * hash(i, 15), al: 0.25 + 0.35 * hash(i, 16), tw: 0.25 + 0.5 * hash(i, 17),
          c: Math.floor(hash(i, 18) * 3), yMin: Math.min(...ys) - C.radi - 14, yMax: Math.max(...ys) + C.radi + 14,
        });
      }
    }
    C.yMax = Math.max(...R.mostres().map(p => p.y)) + 160;
    // blocs de 48 mostres amb el seu interval vertical (amb marge per als desplaçaments i el resplendor)
    const blocs = m => { const res = []; for (let i = 0; i < m.length; i += 48) { const sl = m.slice(i, i + 48), ys = sl.map(p => p.y), mg = Math.max(...sl.map(p => p.m)) + 30; res.push([i, Math.min(i + 48, m.length), Math.min(...ys) - mg, Math.max(...ys) + mg]); } return res; };
    for (const pc of R.peces) pc.blocs = pc.tipus === 'comu' ? blocs(pc.m) : pc.m.map(blocs);
    return { R, C };
  }

  // ---------- Dibuix en rajoles
  // El fil es pinta en rajoles de canvas posades dins de la pàgina (no en un canvas fix): així es desplacen amb el
  // text de manera nativa i el fil no queda endarrerit en fer scroll ràpid (a l'iPhone el scroll va en un altre fil).
  const RAJOLA = 512;
  function Fil(capa) {
    this.capa = capa; this.rajoles = [];
    this.qualitat = 2;                 // 2: completa · 1: sense fibres laterals · 0: mínima
    this.mida();
  }
  Fil.prototype.mida = function () {
    this.vw = document.documentElement.clientWidth; this.vh = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.qualitat === 0 ? 1 : 2);
    const r = construir(this.vw, this.vh);
    this.R = r && r.R; this.C = r && r.C;
    if (!this.R) return;
    if (E.espurnes) this.sprites();
    // La capa només arriba fins al final del fil: no pot allargar mai la pàgina
    this.alcada = Math.ceil(this.C.yMax);
    this.capa.style.height = this.alcada + 'px';
    for (const rj of this.rajoles) { rj.idx = -1; rj.visible = false; rj.cv.style.display = 'none'; this.dimensiona(rj); }
  };
  // Sprites de les espurnes: es pinten una sola vegada (per color) i després només es copien amb drawImage,
  // molt més ràpid que crear gradients i camins a cada espurna i a cada fotograma
  function spriteEstrella(tint, crema) {
    const N = 96, m = N / 2, L = m / 2.2, wd = L * 0.075, L2 = L * 0.62;
    const c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(m, m, 0, m, m, m);
    rg.addColorStop(0, rgba(tint, 0.3)); rg.addColorStop(0.35, rgba(tint, 0.1)); rg.addColorStop(1, rgba(tint, 0));
    g.fillStyle = rg; g.fillRect(0, 0, N, N);
    g.fillStyle = rgba(crema, 0.9);
    g.beginPath();
    g.moveTo(m - L, m); g.lineTo(m, m - wd); g.lineTo(m + L, m); g.lineTo(m, m + wd); g.closePath();
    g.moveTo(m, m - L2); g.lineTo(m + wd, m); g.lineTo(m, m + L2); g.lineTo(m - wd, m); g.closePath();
    g.fill();
    g.beginPath(); g.arc(m, m, wd * 1.5, 0, TAU); g.fill();
    return c;
  }
  function spritePunt(color) {                  // punt de llum amb resplendor suau (radi del nucli = N / 6)
    const N = 32, m = N / 2, r = N / 6;
    const c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(m, m, r * 0.6, m, m, m);
    rg.addColorStop(0, rgba(color, 0.32)); rg.addColorStop(1, rgba(color, 0));
    g.fillStyle = rg; g.fillRect(0, 0, N, N);
    g.fillStyle = rgba(color, 1); g.beginPath(); g.arc(m, m, r, 0, TAU); g.fill();
    return c;
  }
  Fil.prototype.sprites = function () {
    const col = this.C.colors, blauClar = col.blau.map((v, i) => mix(v, col.crema[i], 0.35)), barreja = col.coure.map((v, i) => mix(v, col.blau[i], 0.5));
    this.spr = {
      estrella: { barreja: spriteEstrella(barreja, col.crema), daurat: spriteEstrella(col.dauratClar, col.crema), blau: spriteEstrella(blauClar, col.crema) },
      punt: [spritePunt(col.crema), spritePunt(col.dauratClar), spritePunt(blauClar)],     // tons: crema, daurat, blau
    };
  };
  Fil.prototype.dimensiona = function (rj) {
    rj.cv.width = Math.round(this.vw * this.dpr); rj.cv.height = Math.round(RAJOLA * this.dpr);
  };
  Fil.prototype.rajola = function () {
    const cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: RAJOLA + 'px', display: 'none' });
    this.capa.appendChild(cv);
    const rj = { cv, g: cv.getContext('2d'), idx: -1, visible: false };
    this.dimensiona(rj);
    this.rajoles.push(rj);
    return rj;
  };
  // Dibuixa les rajoles que toquen la pantalla (amb marge) per a l'instant t i el scroll sy
  Fil.prototype.render = function (t, sy, o = {}) {
    if (!this.R) return false;
    o = Object.assign({}, o, { fixos: this.capesFixes(sy) });
    o.llista = E.espurnes && !o.quiet && this.qualitat > 0 ? this.preparaEspurnes(t, o.revelaTot ? Infinity : sy, sy) : [];
    this.espurnes = o.llista.length;
    const marge = 200, ultima = Math.ceil(this.alcada / RAJOLA) - 1;
    const n0 = Math.max(0, Math.floor((sy - marge) / RAJOLA)), n1 = Math.min(ultima, Math.floor((sy + this.vh + marge) / RAJOLA));
    for (const rj of this.rajoles) if (rj.idx < n0 || rj.idx > n1) rj.idx = -1;
    let dibuixat = false;
    for (let i = n0; i <= n1; i++) {
      let rj = this.rajoles.find(x => x.idx === i) || this.rajoles.find(x => x.idx === -1) || this.rajola();
      if (rj.idx !== i) { rj.idx = i; rj.cv.style.top = (i * RAJOLA) + 'px'; }
      if (!rj.visible) { rj.visible = true; rj.cv.style.display = 'block'; }   // escriure estils només quan canvien
      if (this.dibuixa(rj.g, i * RAJOLA, RAJOLA, t, sy, o)) dibuixat = true;
    }
    for (const rj of this.rajoles) if (rj.idx === -1 && rj.visible) { rj.visible = false; rj.cv.style.display = 'none'; }
    // Premisses i passos del mètode: s'encenen quan hi arriba la punta del fil (i s'apaguen si es torna amunt)
    for (const n of this.R.nodes) {
      if (!n.el) continue;
      const arribat = !!o.revelaTot || n.trig <= sy;
      if (n.el.__filArribat !== arribat) { n.el.__filArribat = arribat; n.el.classList.toggle('fil-arribat', arribat); }
    }
    return dibuixat;
  };

  // Capes fixes visibles (navegació, botons flotants, bàner de galetes) en coordenades de document: el fil
  // s'hi esvaeix al voltant. Es mesuren a cada fotograma perquè canvien amb el scroll (botó «amunt», mida
  // de la navegació) i amb el bàner de galetes.
  Fil.prototype.capesFixes = function (sy) {
    const out = [], ara = performance.now();
    if (!this.elsFixos || ara - this.elsFixosT > 1000) { this.elsFixos = qa(CONFIG.sel.capesFixes); this.elsFixosT = ara; }
    for (const el of this.elsFixos) {
      if (!el.isConnected) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const op = clamp(parseFloat(cs.opacity), 0, 1);
      if (!(op >= 0.02)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom < -40 || r.top > this.vh + 40) continue;
      const rad = cs.borderTopLeftRadius || '0';
      const rodo = rad.endsWith('%') ? parseFloat(rad) >= 40 : parseFloat(rad) >= r.width * 0.4;
      if (rodo) {
        // el botó de WhatsApp fa una ona que creix fins a 1,6 vegades la seva mida: el fil no hi arriba
        const r0 = Math.max(r.width, r.height) / 2 * (el.matches('.whatsapp-float') ? 1.6 : 1) + 3;
        out.push({ cercle: true, cx: (r.left + r.right) / 2, cy: sy + (r.top + r.bottom) / 2, r0, r1: r0 + 16, op });
      } else out.push({ x0: r.left, y0: sy + r.top, x1: r.right, y1: sy + r.bottom, op });
    }
    return out;
  };

  // Punt del recorregut trenat a la coordenada s (o null si s no cau en cap tram trenat)
  Fil.prototype.puntS = function (s) {
    for (const c of this.C.comus) {
      if (s < c.s0 || s > c.s1) continue;
      return c.m[clamp(Math.round((s - c.s0) / CONFIG.pas), 0, c.m.length - 1)];
    }
    return null;
  };

  // Espurnes que no depenen de la rajola, calculades un cop per fotograma: [sprite, x, y, mig costat, alfa]
  // · destells d'intercanvi als encreuaments de la trena (els encreuaments es desplacen amb el gir);
  // · espurnetes que se'n desprenen des d'on era l'encreuament quan ha començat el destell;
  // · pols d'or dins l'aura: motes que llisquen lentament al llarg de la trena i parpellegen.
  // Cap espurna surt d'un punt massa a prop d'un text (p.lliure) i la màscara retalla la resta.
  Fil.prototype.preparaEspurnes = function (t, revela, sy) {
    const C = this.C, S = C.esp, spr = this.spr, Q = this.qualitat, out = [];
    const ya = sy - 260, yb = sy + this.vh + 260;
    const dins = p => p && p.y > ya && p.y < yb && p.trig <= revela && p.vis >= 0.8;
    const mig = C.LB / 2;
    // fins a n1 + 2: les espurnetes d'un encreuament que acaba de sortir del tram encara hi són
    const n0 = Math.ceil((C.sComu0 - C.V * t) / mig), n1 = Math.floor((C.sComu1 - C.V * t) / mig) + 2;
    for (let n = n0; n <= n1; n++) {
      if (hash(n, 1) > S.actius) continue;
      const tau = (((t / S.periode + hash(n, 2)) % 1) + 1) % 1 * S.periode;
      if (tau > S.vida) continue;
      const env = tau < 0.12 ? smooth(tau / 0.12) : Math.exp(-(tau - 0.12) / 0.3);
      const p = this.puntS(C.V * t + n * mig);
      if (env > 0.03 && dins(p) && p.r >= 0.7 * C.radi) {
        const L = Math.min(S.L * (0.75 + 0.5 * hash(n, 3)) * (0.55 + 0.45 * env), (p.lliure - 3) / 2.2);
        if (L >= 2.5) out.push([spr.estrella.barreja, p.x, p.y, 2.2 * L, env]);
      }
      if (Q < 2) continue;
      const pf = this.puntS(C.V * (t - tau) + n * mig);
      if (!dins(pf) || pf.r < 0.7 * C.radi || pf.lliure < 10) continue;
      const abast = Math.min(1, (pf.lliure - 6) / (S.dist * 1.4 + S.deriva));
      const tx = -pf.ny, ty = pf.nx;
      for (let e = 0; e < S.n; e++) {
        const hA = hash(n * 7 + e, 4), hB = hash(n * 7 + e, 5), vida = 1.3 * (0.75 + 0.5 * hash(n * 7 + e, 6));
        if (tau > vida) continue;
        const f = tau / vida, ease = 1 - (1 - f) ** 3, costat = e % 2 ? 1 : -1, ang = (hA - 0.5) * 1.2;
        const dx = (pf.nx * Math.cos(ang) + tx * Math.sin(ang)) * costat, dy = (pf.ny * Math.cos(ang) + ty * Math.sin(ang)) * costat;
        const D = S.dist * (0.6 + 0.8 * hB) * ease * abast, dr = S.deriva * f * abast;
        const a = 0.9 * (1 - f) ** 1.6 * (0.75 + 0.25 * Math.sin(TAU * (tau * 5 + hB)));
        if (a < 0.03) continue;
        out.push([spr.punt[(((n + e) % 3) + 3) % 3], pf.x + dx * D + tx * dr, pf.y + dy * D + ty * dr, 3 * S.mida * (0.7 + 0.6 * hA), a]);
      }
    }
    if (Q === 2) for (const mo of C.pols) {
      if (mo.yMax < ya || mo.yMin > yb) continue;
      const fr = (((mo.ph + mo.v * t / mo.sp) % 1) + 1) % 1, p = this.puntS(mo.s0 + fr * mo.sp);
      if (!dins(p) || p.r < 0.4 * C.radi || p.lliure < C.radi + 6) continue;
      const a = mo.al * Math.sin(Math.PI * fr) * (0.55 + 0.45 * Math.sin(TAU * (t * mo.tw + mo.ph)));
      if (a < 0.03) continue;
      const lat = mo.lat * (p.r + 2.5) * (0.85 + 0.15 * Math.sin(TAU * (t * 0.11 + mo.ph)));
      out.push([spr.punt[mo.c], p.x + p.nx * lat, p.y + p.ny * lat, 3 * mo.r, a]);
    }
    return out;
  };

  // Dibuixa a una rajola la franja [top, top + h] del document, a l'instant t (s) i amb el scroll sy.
  // Torna true si hi ha dibuixat alguna cosa.
  const MASCARA = [[6, 0.35], [3, 0.55], [0.75, 1]];           // vora suau al voltant de text i controls
  const MASCARA_FIXES = [[18, 0.22], [11, 0.4], [5, 0.7], [0, 1]];
  Fil.prototype.dibuixa = function (g, top, h, t, sy, o) {
    const { dpr, R, C } = this;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    const vh = this.vh, K = C.K, Q = this.qualitat, quiet = !!o.quiet;
    const revela = o.revelaTot ? Infinity : sy;
    const col = C.colors;
    g.setTransform(dpr, 0, 0, dpr, 0, -top * dpr);
    g.globalCompositeOperation = 'lighter';
    // Extrems rectes (v02 i v03): amb extrems arrodonits, les juntes entre trams se sumen i fan puntets de llum
    const cap = E.aura ? 'butt' : 'round';
    g.lineCap = cap; g.lineJoin = 'round';
    const y0 = top - 90, y1 = top + h + 90, T = CONFIG.tempsBucle, VP = C.mobil ? 150 : 330;
    const polsos = [];
    if (!quiet) for (let k = Math.floor((t - 0.6 - C.uFinal / VP) / CONFIG.polsCada) - 1; k <= Math.floor((t - 0.6) / CONFIG.polsCada); k++) {
      const up = (t - (0.6 + CONFIG.polsCada * k)) * VP;
      if (up > -200 && up < C.uFinal + 200) polsos.push(up);
    }
    const SIG = 160 * (C.mobil ? 0.5 : K), SIGF = 50 * (C.mobil ? 0.5 : K);
    const fibres = Q === 2 ? C.fibres : [0];
    const S = C.esp, espurnes = E.espurnes && !quiet && Q > 0, RASTRE = S.rastre, RMAX = RASTRE[RASTRE.length - 1];
    let punta = null, dibuixat = false, nEsp = 0;
    const NIV = E.nivells, NB = NIV.length;
    const nivell = z => { for (let b = 0; b < NB - 1; b++) if (z >= NIV[b].z) return b; return NB - 1; };
    // franges de visibilitat (el fil s'esvaeix del tot davant del text): intensitat de cada franja
    const FV = [1, 0.6, 0.28], NV = FV.length;
    const franja = v => (v >= 0.8 ? 0 : v >= 0.45 ? 1 : v >= 0.12 ? 2 : -1);
    const caps = [];        // caps de cometa i rastre dels polsos: [x, y, fil, distància al cap, lliure]
    const ca = col.coure.map((v, i) => mix(v, col.blau[i], 0.5));    // color barrejat: dades + IA

    // Aura compartida: on els dos fils es trenen, una llum suau del color barrejat els embolcalla
    if (E.aura && Q > 0) {
      const resp = quiet ? 1 : 0.9 + 0.1 * Math.sin(TAU * t / 7);    // respira lentament
      for (const pc of R.peces) {
        if (pc.tipus !== 'comu') continue;
        const m = pc.m;
        if (m[0].trig > revela) break;
        const path = new Path2D();
        let prev = false, n = 0;
        for (const [i0, i1, bMin, bMax] of pc.blocs) {
          if (bMax < y0 || bMin > y1) { prev = false; continue; }
          for (let i = i0; i < i1; i++) {
            const p = m[i];
            if (p.trig > revela || p.y < y0 || p.y > y1 || p.vis < 0.8 || p.r < 0.4 * C.radi) { prev = false; continue; }
            if (prev) { path.lineTo(p.x, p.y); n++; } else path.moveTo(p.x, p.y);
            prev = true;
          }
        }
        if (!n) continue;
        dibuixat = true;
        g.lineCap = 'round';
        g.strokeStyle = rgba(ca, E.aura[0] * pc.int * resp); g.lineWidth = 2 * C.radi + 10; g.stroke(path);
        g.strokeStyle = rgba(ca, E.aura[1] * pc.int * resp); g.lineWidth = 1.4 * C.radi; g.stroke(path);
        g.lineCap = cap;
      }
    }

    for (let k = 0; k < 2; k++) {
      const cc = k ? col.blau : col.coure, ccLlum = E.llum ? cc.map((v, i) => mix(v, col.crema[i], E.llum[2])) : cc;
      for (const j of fibres) {
        const gr = C.gruix * (j === 0 ? 1.25 : 0.75), llums = [];
        let prevIn = false, prevB = 0, prevV = 0, px = 0, py = 0, pu = 0, pl = 0;
        for (const pc of R.peces) {
          const m = pc.tipus === 'comu' ? pc.m : pc.m[k], blocs = pc.tipus === 'comu' ? pc.blocs : pc.blocs[k];
          if (m[0].trig > revela) break;
          // tram sencer fora d'aquesta rajola: no cal ni preparar-lo
          let toca = false;
          for (const bl of blocs) if (bl[3] >= y0 && bl[2] <= y1) { toca = true; break; }
          if (!toca) { prevIn = false; continue; }
          // un traç per nivell de profunditat (volum de la trena) × franja de visibilitat; el halo, si és continu,
          // va en un sol traç per franja (sense juntes que facin taques). Es creen només si es fan servir.
          const tr = new Array(NV * NB), usat = new Uint8Array(NV * NB);
          const hp = E.haloContinu ? new Array(NV) : null, husat = new Uint8Array(NV);
          const cami = idx => tr[idx] || (tr[idx] = new Path2D()), camiH = vb => hp[vb] || (hp[vb] = new Path2D());
          let n = 0;
          for (const [i0, i1, bMin, bMax] of blocs) {
            if (bMax < y0 || bMin > y1) { prevIn = false; continue; }
          for (let i = i0; i < i1; i++) {
            const p = m[i];
            if (p.trig > revela || p.y < y0 || p.y > y1) { prevIn = false; continue; }
            const vb = franja(p.vis);
            if (vb < 0) { prevIn = false; continue; }
            let off = 0, z = 0;
            if (p.la) {
              const w = E.ona[0] * Math.sin(TAU * (p.s / (720 * K) - t / T) + (k ? 2.1 : 0.3))
                      + E.ona[1] * Math.sin(TAU * (p.s / (360 * K) - 2 * t / T) + (k ? 4.0 : 1.2))
                      + (E.ona[2] ? E.ona[2] * Math.sin(TAU * (p.s / (240 * K) - 3 * t / T) + (k ? 0.7 : 5.1)) : 0);
              off += p.la * (pc.tipus === 'comu' ? ((k ? -0.5 : 0.5) + w) : w * 0.6);
              z = 0.3 * Math.sin(TAU * (p.s / (360 * K) - 2 * t / T) + k * 2.6);
            }
            if (p.r) { const ph = TAU * (p.s - C.V * t) / C.LB + k * Math.PI; off += p.r * Math.sin(ph); z = Math.cos(ph) * Math.min(1, p.r / C.radi); }
            const esp = (C.mobil ? 0.9 : 1.2) + (p.la ? 6 * K * (p.la / C.solt) : 0);
            const fj = j * esp + (p.la && E.desfilat ? 3 * K * E.desfilat * Math.sin(TAU * (p.s / (170 * K) - 4 * t / T) + j * 2.1 + k * 1.7) * (p.la / C.solt) : 0);
            const x = p.x + p.nx * (off + fj), y = p.y + p.ny * (off + fj);
            const b = nivell(z), idx = b + NB * vb;
            if (prevIn) {
              const path = cami(idx);
              if (b !== prevB || vb !== prevV || i === 0 || !usat[idx]) path.moveTo(px, py);
              path.lineTo(x, y); n++; usat[idx] = 1;
              if (hp) { const ph = camiH(vb); if (vb !== prevV || i === 0 || !husat[vb]) ph.moveTo(px, py); ph.lineTo(x, y); husat[vb] = 1; }
              if (j === 0 && polsos.length) {
                let gg = 0;
                for (const up of polsos) {
                  const dd = p.u - up;
                  if (dd < -3 * SIG || dd > 3 * SIGF) continue;          // contribució menyspreable
                  const sg = dd < 0 ? SIG : SIGF; gg += Math.exp(-(dd * dd) / (sg * sg));
                  // cap de la cometa i rastre d'espurnetes
                  if (espurnes && vb === 0 && dd > -RMAX - 6 && dd < 6) for (const d of RASTRE) { const uo = up - d; if (pu < uo && p.u >= uo) caps.push([x, y, k, d, p.lliure]); }
                }
                if (gg > 0.04 && vb === 0) llums.push([px, py, x, y, gg * pc.int]);
              }
            } else { cami(idx).moveTo(x, y); if (hp) camiH(vb).moveTo(x, y); }
            prevIn = true; prevB = b; prevV = vb; px = x; py = y; pu = p.u; pl = p.lliure;
          }
          }
          if (!n) continue;
          dibuixat = true;
          if (hp && Q > 0) {
            g.lineCap = 'round';
            for (let vb = 0; vb < NV; vb++) if (husat[vb]) { g.strokeStyle = rgba(cc, 0.06 * pc.int * FV[vb]); g.lineWidth = 6.5 * gr; g.stroke(hp[vb]); }
            g.lineCap = cap;
          }
          for (let idx = 0; idx < NV * NB; idx++) {
            if (!usat[idx]) continue;
            const path = tr[idx], nv = NIV[idx % NB], I = pc.int * FV[(idx / NB) | 0], w = gr * nv.w;
            if (Q > 0 && !hp) { g.lineCap = 'round'; g.strokeStyle = rgba(cc, nv.halo[0] * I); g.lineWidth = nv.halo[1] * w; g.stroke(path); g.lineCap = cap; }
            if (Q > 0 && nv.mig) { g.strokeStyle = rgba(cc, nv.mig[0] * I); g.lineWidth = nv.mig[1] * w; g.stroke(path); }
            g.strokeStyle = rgba(cc, nv.nucli[j === 0 ? 0 : 1] * I); g.lineWidth = w; g.stroke(path);
            // reflex de fibra òptica a la cara de davant de cada fil (s'encén a poc a poc en girar cap endavant)
            const ll = nv.llum === undefined ? (nv.z >= 0 ? 1 : 0) : nv.llum;
            if (Q > 0 && E.llum && j === 0 && ll > 0.01) { g.strokeStyle = rgba(ccLlum, E.llum[0] * ll * I); g.lineWidth = E.llum[1] * w; g.stroke(path); }
          }
        }
        if (j === 0 && prevIn && pu < C.uFinal - 2 && !o.revelaTot) {
          if (!punta) punta = [px, py, pl]; else { punta[0] = (punta[0] + px) / 2; punta[1] = (punta[1] + py) / 2; punta[2] = Math.min(punta[2], pl); }
        }
        // polsos de llum: segments agrupats en 10 nivells d'intensitat (un parell de traços per nivell)
        if (llums.length) {
          const NL = 10, lots = new Array(NL);
          for (const [ax, ay, bx, by, gg] of llums) {
            const ql = Math.min(NL - 1, Math.floor(Math.min(1, gg) * NL)), pth = lots[ql] || (lots[ql] = new Path2D());
            pth.moveTo(ax, ay); pth.lineTo(bx, by);
          }
          for (let ql = 0; ql < NL; ql++) {
            if (!lots[ql]) continue;
            const a = (ql + 0.5) / NL, c2 = cc.map((v, i) => mix(v, col.crema[i], 0.42 * a));
            if (Q > 0) { g.strokeStyle = rgba(c2, 0.16 * a); g.lineWidth = 10 * C.gruix; g.stroke(lots[ql]); }
            g.strokeStyle = rgba(c2, 0.85 * a); g.lineWidth = C.gruix * 1.6; g.stroke(lots[ql]);
          }
        }
      }
    }

    // Espurnes amb sprites: destell = estrella de quatre puntes amb halo; guspira = punt de llum amb resplendor
    const spr = this.spr;
    const destell = (x, y, L, a, s) => { const R = 2.2 * L; g.globalAlpha = clamp(a, 0, 1); g.drawImage(s, x - R, y - R, 2 * R, 2 * R); g.globalAlpha = 1; };
    const guspira = (x, y, r, a, s) => { const R = 3 * r; g.globalAlpha = clamp(a, 0, 1); g.drawImage(s, x - R, y - R, 2 * R, 2 * R); g.globalAlpha = 1; };

    if (espurnes) {
      // 1) Destells dels encreuaments, espurnetes i pols d'or: preparats un cop per fotograma (preparaEspurnes)
      for (const it of o.llista || []) {
        if (it[2] + it[3] < y0 || it[2] - it[3] > y1) continue;
        g.globalAlpha = it[4]; g.drawImage(it[0], it[1] - it[3], it[2] - it[3], 2 * it[3], 2 * it[3]);
      }
      g.globalAlpha = 1;
      // 2) Cap de cometa dels polsos de llum i rastre d'espurnetes
      for (const [x, y, k, d, lliure] of caps) {
        if (y < y0 - 20 || y > y1 + 20) continue;
        if (d === 0) {
          const L = Math.min(S.capL, (lliure - 3) / 2.2);
          if (L >= 2.5) { destell(x, y, L, 0.8, k ? spr.estrella.blau : spr.estrella.daurat); nEsp++; }
        } else if (lliure >= 5) {
          const f = d / RASTRE[RASTRE.length - 1];
          guspira(x, y, (C.mobil ? 0.6 : 0.8) * (1.1 - 0.5 * f), 0.6 * (1 - 0.7 * f) * (0.7 + 0.3 * Math.sin(TAU * (t * 3 + d * 0.13))), spr.punt[k ? 2 : 1]);
          nEsp++;
        }
      }
    }

    // Partícules de dades al tram solt de la capçalera
    const heroM = R.peces[0].m;
    if (Q > 0 && heroM[0].y < y1 && heroM[0].y > y0 - vh) {
      for (const mo of C.motes) {
        const s = ((mo.s0 + (quiet ? 0 : t) / T) % 1) * C.dFusio;
        const p = heroM[Math.min(heroM.length - 1, Math.round(s / CONFIG.pas))];
        const el = smooth((C.dFusio - s) / (560 * K));
        const env = smooth(s / (0.2 * C.dFusio)) * smooth((C.dFusio - s) / (0.22 * C.dFusio));
        const lat = el * C.solt * (mo.o * 1.9 + (mo.k ? -0.5 : 0.5));
        const a = mo.al * env * (0.6 + 0.4 * Math.sin(TAU * (mo.m * t / T + mo.ph))) * p.vis;
        if (a < 0.02) continue;
        g.fillStyle = rgba(mo.k ? col.blau : col.coure, a * 0.75);
        g.beginPath(); g.arc(p.x + p.nx * lat, p.y + p.ny * lat, mo.r * (C.mobil ? 0.9 : 1.1), 0, TAU); g.fill();
      }
    }

    // Punta del fil: el «llapis» que escriu, amb una estrella i tres motes que hi orbiten
    if (punta && punta[1] > sy && punta[1] < sy + vh) {
      const rr = C.mobil ? 10 : 18, a = 0.35 + 0.15 * Math.sin(TAU * t / 1.6);
      const rg = g.createRadialGradient(punta[0], punta[1], 0, punta[0], punta[1], rr);
      rg.addColorStop(0, `rgba(250,236,214,${a})`); rg.addColorStop(1, 'rgba(250,236,214,0)');
      g.fillStyle = rg; g.fillRect(punta[0] - rr, punta[1] - rr, 2 * rr, 2 * rr);
      if (espurnes) {
        const L = Math.min(C.mobil ? 5 : 8, (punta[2] - 3) / 2.2);
        if (L >= 2.5) { destell(punta[0], punta[1], L, 0.5 + 0.2 * Math.sin(TAU * t / 1.6), spr.estrella.daurat); nEsp++; }
        const ro = Math.min(C.mobil ? 7 : 11, punta[2] - 4);
        if (ro >= 4) for (let i = 0; i < 3; i++) {
          const an = TAU * (t * (0.22 + 0.05 * i) + i / 3), rad = ro * (0.8 + 0.2 * Math.sin(TAU * (t * 0.4 + i * 0.3)));
          guspira(punta[0] + Math.cos(an) * rad, punta[1] + Math.sin(an) * rad * 0.7, C.mobil ? 0.55 : 0.7, 0.5 + 0.3 * Math.sin(TAU * (t * 1.3 + i / 3)), spr.punt[i]);
          nEsp++;
        }
      }
    }

    // Nodes: xifres, nusos dels principis, fites del mètode i cursors
    const [dr, dg, db] = col.daurat, [cr, cg, cbl] = col.dauratClar;
    R.nodes.forEach((n, ni) => {
      if (n.y < y0 || n.y > y1 || n.trig > revela) return;
      dibuixat = true;
      const a = n.trig === 0 || o.revelaTot ? 1 : clamp((sy - n.trig) / 90, 0, 1);
      const esclat = quiet ? 0 : Math.sin(Math.PI * a) * 0.8;
      if (n.tipus === 'punt' || n.tipus === 'nus') {
        g.globalCompositeOperation = 'lighter';
        const hr = (n.tipus === 'nus' ? 26 : 16) * (C.mobil ? 0.6 : 1);
        const rg = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, hr);
        rg.addColorStop(0, `rgba(${dr},${dg},${db},${0.22 * a + 0.35 * esclat})`); rg.addColorStop(1, `rgba(${dr},${dg},${db},0)`);
        g.fillStyle = rg; g.fillRect(n.x - hr, n.y - hr, 2 * hr, 2 * hr);
        // nota: una línia de llum que surt del punt cap a la xifra (la màscara la retalla abans del text)
        if (n.cap !== undefined && Q > 0 && Math.abs(n.cap - n.x) > 10) {
          const dir = Math.sign(n.cap - n.x), x0 = n.x + dir * 5;
          const lg = g.createLinearGradient(x0, 0, n.cap, 0);
          lg.addColorStop(0, `rgba(${cr},${cg},${cbl},${0.55 * a})`); lg.addColorStop(1, `rgba(${cr},${cg},${cbl},0)`);
          g.fillStyle = lg; g.fillRect(Math.min(x0, n.cap), n.y - 0.6, Math.abs(n.cap - x0), 1.2);
        }
        // detall: una ona que s'eixampla a cada xifra i una òrbita que gira a cada nus
        if (espurnes && n.tipus === 'punt') {
          const f = (((t / 4.5 + ni * 0.27) % 1) + 1) % 1, rad = mix(C.mobil ? 2 : 3, C.mobil ? 8 : 15, 1 - (1 - f) ** 3);
          g.strokeStyle = `rgba(${cr},${cg},${cbl},${0.34 * a * (1 - f) ** 2})`; g.lineWidth = 0.8;
          g.beginPath(); g.arc(n.x, n.y, rad, 0, TAU); g.stroke();
        }
        if (espurnes && n.tipus === 'nus') {
          const ro = (C.mobil ? 5 : 9) * 1.85, an = TAU * (t / 10) + ni * 1.7, arc = Math.PI * 0.75;
          g.strokeStyle = `rgba(${cr},${cg},${cbl},${0.4 * a})`; g.lineWidth = 0.9;
          g.beginPath(); g.arc(n.x, n.y, ro, an, an + arc); g.stroke();
          guspira(n.x + Math.cos(an + arc) * ro, n.y + Math.sin(an + arc) * ro, C.mobil ? 0.8 : 1.1, 0.85 * a, spr.punt[0]);
          nEsp++;
        }
        g.globalCompositeOperation = 'source-over';
        if (n.tipus === 'nus') {
          g.strokeStyle = `rgba(${cr},${cg},${cbl},${0.9 * a})`; g.lineWidth = C.mobil ? 1.2 : 1.5;
          g.beginPath(); g.arc(n.x, n.y, (C.mobil ? 5 : 9) * (0.6 + 0.4 * a), 0, TAU); g.stroke();
        }
        g.fillStyle = `rgba(${cr},${cg},${cbl},${a})`;
        g.beginPath(); g.arc(n.x, n.y, (C.mobil ? 1.8 : 2.6) * (0.5 + 0.5 * a + 0.3 * esclat), 0, TAU); g.fill();
      } else {
        let fl = 0;
        if (n.flaix && !quiet) for (const up of polsos) fl += Math.exp(-(((up - n.u) / (95 * K)) ** 2));
        fl = Math.min(1, fl + esclat);
        const parp = n.parpelleja && !quiet ? 0.5 + 0.5 * Math.cos(TAU * t / (n.final ? 1.1 : 1.5)) : 1;
        g.globalCompositeOperation = 'lighter';
        const hr = Math.max(n.w * 1.5, C.mobil ? 22 : 60 * K);
        const rg = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, hr);
        rg.addColorStop(0, `rgba(${dr},${dg},${db},${(0.09 + 0.06 * parp) * a + 0.24 * fl})`); rg.addColorStop(1, `rgba(${dr},${dg},${db},0)`);
        g.fillStyle = rg; g.fillRect(n.x - hr, n.y - hr, 2 * hr, 2 * hr);
        if (fl > 0.05 && !C.mobil && Q > 0) {
          const lg = g.createLinearGradient(n.x - 350 * K, 0, n.x + 350 * K, 0);
          lg.addColorStop(0, `rgba(${dr},${dg},${db},0)`); lg.addColorStop(0.5, `rgba(${cr},${cg},${cbl},${0.3 * fl})`); lg.addColorStop(1, `rgba(${dr},${dg},${db},0)`);
          g.fillStyle = lg; g.fillRect(n.x - 350 * K, n.y - 0.6, 700 * K, 1.2);
        }
        g.globalCompositeOperation = 'source-over';
        const c3 = [dr, dg, db].map((v, i) => Math.round(mix(v, [cr, cg, cbl][i], fl)));
        g.fillStyle = `rgba(${c3.join(',')},${a * Math.max(n.parpelleja ? 0.62 + 0.38 * parp : 1, fl)})`;
        g.fillRect(n.x - n.w / 2, n.y - n.h / 2, n.w, n.h);
      }
    });

    // Màscares: res no es pinta mai sobre el text, els controls ni la imatgeria (vora suau), i el fil
    // s'esvaeix abans d'arribar a les capes fixes (no ha de semblar mai que passi per sota de res)
    g.globalCompositeOperation = 'destination-out';
    const Z = C.zones, ya = top - 8, yb = top + h + 8;
    let lo = 0, hi = Z.length;
    while (lo < hi) { const md = (lo + hi) >> 1; if (Z[md][1] < ya - C.hmax) lo = md + 1; else hi = md; }
    for (let i = lo; i < Z.length && Z[i][1] <= yb; i++) {
      const z = Z[i];
      if (z[3] < ya) continue;
      for (const [e, al] of MASCARA) { g.fillStyle = `rgba(0,0,0,${al})`; g.fillRect(z[0] - e, z[1] - e, z[2] - z[0] + 2 * e, z[3] - z[1] + 2 * e); }
    }
    for (const f of o.fixos || []) {
      if (f.cercle) {
        if (f.cy + f.r1 < ya || f.cy - f.r1 > yb) continue;
        const rg = g.createRadialGradient(f.cx, f.cy, 0, f.cx, f.cy, f.r1);
        rg.addColorStop(0, `rgba(0,0,0,${f.op})`); rg.addColorStop(f.r0 / f.r1, `rgba(0,0,0,${f.op})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.fillRect(f.cx - f.r1, f.cy - f.r1, 2 * f.r1, 2 * f.r1);
      } else {
        if (f.y1 + 20 < ya || f.y0 - 20 > yb) continue;
        for (const [e, al] of MASCARA_FIXES) { g.fillStyle = `rgba(0,0,0,${al * f.op})`; g.fillRect(f.x0 - e, f.y0 - e, f.x1 - f.x0 + 2 * e, f.y1 - f.y0 + 2 * e); }
      }
    }
    g.globalCompositeOperation = 'source-over';
    this.espurnes += nEsp;
    return dibuixat;
  };

  // ---------- Posada en marxa
  function iniciar() {
    if (!q(CONFIG.sel.capcalera)) return;
    const capa = document.createElement('div');
    capa.className = 'fil-capa';
    capa.setAttribute('aria-hidden', 'true');
    // Estils posats aquí mateix: la capa no pot ocupar espai ni moure la maqueta encara que falti el CSS
    // z-index 30: per sobre de tot el contingut i per sota de les capes fixes (navegació 50, botons ~1000)
    Object.assign(capa.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '0', overflow: 'hidden', pointerEvents: 'none', zIndex: '30' });
    document.body.prepend(capa);
    const fil = new Fil(capa);
    if (!fil.R) { capa.remove(); return; }
    document.documentElement.classList.add('amb-fil');

    const reduir = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };
    const estat = { renders: 0, msPerFotograma: 0, fps30: false, actiu: !window.FIL_MANUAL };
    const t0 = performance.now();
    let raf = 0, ultim = 0, lents = 0;
    const pas = now => {
      raf = 0;
      if (document.hidden || !estat.actiu) return;
      if (estat.fps30 && now - ultim < 30) { raf = requestAnimationFrame(pas); return; }
      ultim = now;
      const a = performance.now();
      const hiHa = fil.render(reduir.matches ? 0 : (now - t0) / 1000, window.scrollY, { revelaTot: reduir.matches, quiet: reduir.matches });
      const ms = performance.now() - a;
      estat.renders++;
      estat.msPerFotograma = estat.msPerFotograma ? estat.msPerFotograma * 0.92 + ms * 0.08 : ms;
      // Qualitat adaptativa: si va just, primer menys detall i després 30 fotogrames per segon
      if (estat.msPerFotograma > CONFIG.msObjectiu && ++lents > 45) {
        lents = 0;
        if (fil.qualitat > 0) { fil.qualitat--; fil.mida(); estat.msPerFotograma = 0; } else estat.fps30 = true;
      } else if (estat.msPerFotograma <= CONFIG.msObjectiu) lents = 0;
      // Sempre es mou mentre hi ha fil a la pantalla; si no n'hi ha, espera el proper scroll
      if (!reduir.matches && hiHa) raf = requestAnimationFrame(pas);
    };
    const demana = () => { if (!raf && estat.actiu) raf = requestAnimationFrame(pas); };
    window.addEventListener('scroll', demana, { passive: true });
    document.addEventListener('visibilitychange', demana);
    if (reduir.addEventListener) reduir.addEventListener('change', demana);
    let espera = 0;
    const reconstruir = () => { clearTimeout(espera); espera = setTimeout(() => { fil.mida(); demana(); }, 150); };
    window.addEventListener('resize', reconstruir);
    if ('ResizeObserver' in window) new ResizeObserver(reconstruir).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reconstruir);

    // Accés per a les proves (proves/fil.mjs)
    window.madeinhumanFil = {
      versio: '0.3', estil: NOM_ESTIL,
      render: (t, sy, o) => fil.render(t, sy, o),
      reconstruir: () => fil.mida(),
      estat: () => ({ ...estat, qualitat: fil.qualitat, llargada: Math.round(fil.C.uFinal), nodes: fil.R.nodes.length, esvaides: fil.C.esvaides, espurnes: fil.espurnes || 0 }),
      mostres: () => fil.R.mostres().map(p => [p.x, p.y, p.m, p.vis]),
      nodes: () => fil.R.nodes.map(n => ({ tipus: n.tipus, x: n.x, y: n.y, trig: n.trig })),
      aturar: () => { estat.actiu = false; },
      reprendre: () => { estat.actiu = true; demana(); },
    };
    demana();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
