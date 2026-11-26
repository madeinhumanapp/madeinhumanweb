/* =============================================
   MADEINHUMAN — Control antirobots (Cloudflare Turnstile) als formularis
   Únic tercer de la web, i només a les pàgines amb formulari: el script de Cloudflare es carrega quan el
   visitant comença a omplir un formulari (no en obrir la pàgina). Sense clau, no fa res i els formularis
   s'envien com sempre. rgpd-tool verifica el token quan té el secret (TURNSTILE_SECRET_KEY).
   ============================================= */
(function () {
  'use strict';

  // Clau pública del widget (site key). Buida = desactivat. Només s'aplica a madeinhuman.cat (ni a les
  // vistes prèvies de Cloudflare ni en local); les proves la poden forçar amb window.MIH_TURNSTILE_CLAU.
  var CLAU = '';
  var PRODUCCIO = /^(www\.)?madeinhuman\.cat$/.test(window.location.hostname);
  function clau() { return window.MIH_TURNSTILE_CLAU || (PRODUCCIO ? CLAU : ''); }

  var carrega = null;
  function carregarScript() {
    if (carrega) return carrega;
    carrega = new Promise(function (ok, ko) {
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = function () { if (window.turnstile) ok(window.turnstile); else ko(new Error('turnstile')); };
      s.onerror = function () { ko(new Error('turnstile')); };
      document.head.appendChild(s);
    });
    return carrega;
  }

  // Prepara un formulari. Retorna { token(): Promise<string|undefined>, reiniciar() }
  function preparar(form) {
    if (!form || !clau()) return { token: function () { return Promise.resolve(undefined); }, reiniciar: function () {} };
    var estat = { token: '', error: false, esperes: [], widget: null };
    var caixa = document.createElement('div');
    caixa.className = 'turnstile-caixa';
    var boto = form.querySelector('button[type="submit"]');
    if (boto && boto.parentNode) boto.parentNode.insertBefore(caixa, boto); else form.appendChild(caixa);

    function avisa(t) { estat.esperes.splice(0).forEach(function (f) { f(t); }); }
    var iniciat = false;
    function iniciar() {
      if (iniciat) return;
      iniciat = true;
      carregarScript().then(function (ts) {
        estat.widget = ts.render(caixa, {
          sitekey: clau(), language: 'ca', 'response-field': false,
          callback: function (t) { estat.token = t; avisa(t); },
          'expired-callback': function () { estat.token = ''; },
          'error-callback': function () { estat.error = true; avisa(undefined); },
        });
      }).catch(function () { estat.error = true; avisa(undefined); });
    }
    form.addEventListener('focusin', iniciar);

    return {
      token: function () {
        iniciar();
        if (estat.token) return Promise.resolve(estat.token);
        if (estat.error) return Promise.resolve(undefined);
        return new Promise(function (ok) {
          estat.esperes.push(ok);
          setTimeout(function () { ok(estat.token || undefined); }, 15000);
        });
      },
      // Cada token serveix per a un sol enviament
      reiniciar: function () {
        estat.token = '';
        try { if (window.turnstile && estat.widget != null) window.turnstile.reset(estat.widget); } catch (e) { /* res */ }
      },
    };
  }

  window.MIH_TURNSTILE = { preparar: preparar, clau: clau };
})();
