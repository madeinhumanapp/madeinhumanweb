/* =============================================
   MADEINHUMAN — Origen de la visita (UTM) als formularis
   Llegeix utm_source, utm_medium, utm_campaign i utm_content de l'URL de la
   mateixa pàgina en el moment d'enviar un formulari i els posa als camps
   ocults. No desa res al dispositiu (ni cookies, ni localStorage, ni
   sessionStorage): fer-ho amb finalitat d'atribució demanaria consentiment
   (LSSI, art. 22.2). Si l'atribució es perd en canviar de pàgina, s'accepta.
   ============================================= */
(function () {
  'use strict';

  var CAMPS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  // Llista blanca: minúscules, xifres, punt, guió baix i guió; 100 caràcters com a màxim
  var VALID = /^[a-z0-9._-]{1,100}$/;

  // Valors vàlids de l'URL actual (els que no passen la llista blanca es descarten)
  function llegir() {
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    CAMPS.forEach(function (camp) {
      var valor = (params.get(camp) || '').trim().toLowerCase();
      if (VALID.test(valor)) utm[camp] = valor;
    });
    return utm;
  }

  // Omple els camps ocults del formulari (i els crea si no hi són); retorna els valors
  function omplir(form) {
    var utm = llegir();
    CAMPS.forEach(function (camp) {
      var input = form.querySelector('input[name="' + camp + '"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = camp;
        form.appendChild(input);
      }
      input.value = utm[camp] || '';
    });
    return utm;
  }

  window.MIH_UTM = { camps: CAMPS, llegir: llegir, omplir: omplir };
})();
