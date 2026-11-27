/* Turnstile simulat per a les proves (no surten a internet): dona un token fix just en pintar el widget i
   crida la funció de l'URL (?onload=…) com fa el de Cloudflare. */
(function () {
  var t = {
    render: function (el, o) { setTimeout(function () { if (o && o.callback) o.callback('TOKEN-PROVA'); }, 0); return 'w1'; },
    reset: function () {}, remove: function () {}, getResponse: function () { return 'TOKEN-PROVA'; },
  };
  window.turnstile = t;
  var src = document.currentScript && document.currentScript.src;
  var m = src && /[?&]onload=([^&]+)/.exec(src);
  if (m && typeof window[m[1]] === 'function') setTimeout(window[m[1]], 0);
})();
