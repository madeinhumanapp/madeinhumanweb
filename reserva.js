/* =====================================================================
   MADEINHUMAN — Selector de reserves propi (WEB-G05a)
   Sense dependències, sense galetes ni emmagatzematge al navegador.
   Client de l'API de rgpd-tool (/api/public/reserva/franges i /api/public/reserva).
   Es manté desactivat (ACTIVA = false) fins que l'API estigui desplegada.
   ===================================================================== */
(function () {
  'use strict';

  var ACTIVA = false;
  var API_BASE = 'https://rgpd.madeinhuman.cat';

  var TEXTOS = {
    ca: {
      locale: 'ca-ES',
      titol: 'Trieu dia i hora per a la trucada',
      zona: 'Hores en horari de Catalunya',
      carregant: 'Carregant hores disponibles…',
      confirmarTitol: 'Confirmar la trucada de {durada} minuts del {dia} a les {hora}',
      confirmarBtn: 'Confirmar reserva',
      confirmant: 'Confirmant…',
      canviarBtn: "Canviar d'hora",
      exitTitol: 'Trucada reservada',
      exitDetall: '{dia} a les {hora} ({durada} minuts)',
      exitCorreu: 'Us enviarem la confirmació per correu.',
      afegirCalendari: 'Afegir al calendari',
      errOcupada: "Aquesta hora s'acaba d'ocupar. Hem actualitzat les hores disponibles.",
      errToken: "L'enllaç ja no és vàlid.",
      errBuida: 'Ara mateix no hi ha hores lliures disponibles.',
      errXarxa: 'No hem pogut connectar per carregar les hores disponibles.',
      errDades: 'No hem pogut completar la reserva. Torneu a triar una hora.',
      contactar: 'Escriviu-nos',
      diagnostic: 'Fer el diagnòstic gratuït',
      senseToken: 'Per reservar una trucada, feu el diagnòstic gratuït o escriviu-nos.',
      contacteHref: '/#contacte',
      diagnosticHref: '/diagnostic',
      icsSummary: 'Trucada Madeinhuman',
    },
    es: {
      locale: 'es-ES',
      titol: 'Elegid día y hora para la llamada',
      zona: 'Horas en horario de Cataluña',
      carregant: 'Cargando horas disponibles…',
      confirmarTitol: 'Confirmar la llamada de {durada} minutos del {dia} a las {hora}',
      confirmarBtn: 'Confirmar reserva',
      confirmant: 'Confirmando…',
      canviarBtn: 'Cambiar de hora',
      exitTitol: 'Llamada reservada',
      exitDetall: '{dia} a las {hora} ({durada} minutos)',
      exitCorreu: 'Os enviaremos la confirmación por correo.',
      afegirCalendari: 'Añadir al calendario',
      errOcupada: 'Esta hora se acaba de ocupar. Hemos actualizado las horas disponibles.',
      errToken: 'El enlace ya no es válido.',
      errBuida: 'Ahora mismo no hay horas libres disponibles.',
      errXarxa: 'No hemos podido conectar para cargar las horas disponibles.',
      errDades: 'No hemos podido completar la reserva. Volved a elegir una hora.',
      contactar: 'Escribidnos',
      diagnostic: 'Hacer el diagnóstico gratuito',
      senseToken: 'Para reservar una llamada, haced el diagnóstico gratuito o escribidnos.',
      contacteHref: '/es/#contacto',
      diagnosticHref: '/diagnostic',
      icsSummary: 'Llamada Madeinhuman',
    },
  };

  function tr(idioma, clau, vals) {
    var dic = TEXTOS[idioma] || TEXTOS.ca;
    var s = dic[clau] || TEXTOS.ca[clau] || '';
    if (!vals) return s;
    return s.replace(/\{([a-z]+)\}/g, function (_, k) { return vals[k] != null ? String(vals[k]) : ''; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clauDia(iso, zona) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(iso));
  }

  function nomDia(iso, zona, idioma) {
    var dic = TEXTOS[idioma] || TEXTOS.ca;
    return new Intl.DateTimeFormat(dic.locale, {
      timeZone: zona, weekday: 'long', day: 'numeric', month: 'long',
    }).format(new Date(iso)).replace(/,\s*/, ' ');
  }

  function horaLocal(iso, zona, idioma) {
    var dic = TEXTOS[idioma] || TEXTOS.ca;
    return new Intl.DateTimeFormat(dic.locale, {
      timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
  }

  function dataUtcIcs(iso) {
    var d = new Date(iso);
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' +
      p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z';
  }

  function generarIcs(iniciIso, fiIso, idioma, idFranja) {
    var dic = TEXTOS[idioma] || TEXTOS.ca;
    var uidPart = String(idFranja || dataUtcIcs(iniciIso)).replace(/[^a-zA-Z0-9_-]/g, '');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Madeinhuman//Reserva//CA',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + uidPart + '-' + dataUtcIcs(iniciIso) + '@madeinhuman.cat',
      'DTSTAMP:' + dataUtcIcs(new Date().toISOString()),
      'DTSTART:' + dataUtcIcs(iniciIso),
      'DTEND:' + dataUtcIcs(fiIso),
      'SUMMARY:' + dic.icsSummary,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }

  function descarregarIcs(contingut) {
    var blob = new Blob([contingut], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'trucada-madeinhuman.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function enfocarTitol(el) {
    var h = el.querySelector('.reserva-titol');
    if (h) h.focus({ preventScroll: true });
  }

  function muntar(contenidor, token, idioma) {
    if (!ACTIVA || !contenidor) return false;
    var lang = idioma === 'es' ? 'es' : 'ca';
    var dic = TEXTOS[lang];

    contenidor.innerHTML =
      '<div class="reserva-widget">' +
        '<div class="reserva-estat" aria-live="polite"></div>' +
        '<div class="reserva-cos"></div>' +
      '</div>';

    var estatEl = contenidor.querySelector('.reserva-estat');
    var cosEl = contenidor.querySelector('.reserva-cos');
    var estat = { zona: 'Europe/Madrid', durada: 20, franges: [], seleccionada: null, carregant: false };

    function mostrarEstat(text, esError) {
      estatEl.textContent = text || '';
      estatEl.className = 'reserva-estat' + (text ? (esError ? ' reserva-estat-err' : ' reserva-estat-ok') : '');
    }

    function pintarErrorContacte(missatge) {
      mostrarEstat('', false);
      cosEl.innerHTML =
        '<div class="reserva-missatge" role="status">' +
          '<p class="reserva-titol" tabindex="-1">' + esc(missatge) + '</p>' +
          '<p class="reserva-accions"><a class="btn btn-primary reserva-accio" href="' + esc(dic.contacteHref) + '">' + esc(dic.contactar) + '</a></p>' +
        '</div>';
      enfocarTitol(cosEl);
    }

    function pintarFranges(avisPrevi) {
      mostrarEstat(avisPrevi || '', Boolean(avisPrevi));
      if (!estat.franges.length) {
        pintarErrorContacte(dic.errBuida);
        return;
      }
      var ordreDies = [];
      var grups = {};
      estat.franges.forEach(function (f) {
        var clau = clauDia(f.inici, estat.zona);
        if (!grups[clau]) {
          grups[clau] = { nom: nomDia(f.inici, estat.zona, lang), items: [] };
          ordreDies.push(clau);
        }
        grups[clau].items.push(f);
      });

      var htmlDies = ordreDies.map(function (clau) {
        var g = grups[clau];
        var botons = g.items.map(function (f) {
          var hora = horaLocal(f.inici, estat.zona, lang);
          var sel = estat.seleccionada && estat.seleccionada.id === f.id;
          return '<button type="button" class="reserva-franja" data-franja="' + esc(f.id) + '" aria-pressed="' + (sel ? 'true' : 'false') + '">' + esc(hora) + '</button>';
        }).join('');
        return '<div class="reserva-dia">' +
          '<h3 class="reserva-dia-titol">' + esc(g.nom) + '</h3>' +
          '<div class="reserva-franges" role="group" aria-label="' + esc(g.nom) + '">' + botons + '</div>' +
        '</div>';
      }).join('');

      cosEl.innerHTML =
        '<h2 class="reserva-titol" tabindex="-1">' + esc(dic.titol) + '</h2>' +
        '<p class="reserva-zona">' + esc(dic.zona) + '</p>' +
        '<div class="reserva-llista">' + htmlDies + '</div>';

      cosEl.querySelectorAll('.reserva-franja').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-franja');
          var f = estat.franges.filter(function (x) { return x.id === id; })[0];
          if (!f) return;
          estat.seleccionada = f;
          btn.setAttribute('aria-pressed', 'true');
          pintarConfirmacio(f);
        });
      });
      enfocarTitol(cosEl);
    }

    function pintarConfirmacio(franja) {
      mostrarEstat('', false);
      var dia = nomDia(franja.inici, estat.zona, lang);
      var hora = horaLocal(franja.inici, estat.zona, lang);
      var titol = tr(lang, 'confirmarTitol', { durada: estat.durada, dia: dia, hora: hora });
      cosEl.innerHTML =
        '<div class="reserva-confirmacio">' +
          '<h2 class="reserva-titol" tabindex="-1">' + esc(titol) + '</h2>' +
          '<p class="reserva-zona">' + esc(dic.zona) + '</p>' +
          '<div class="reserva-accions">' +
            '<button type="button" class="btn btn-primary reserva-accio" data-reserva-confirmar>' + esc(dic.confirmarBtn) + '</button>' +
            '<button type="button" class="btn btn-ghost reserva-accio" data-reserva-canviar>' + esc(dic.canviarBtn) + '</button>' +
          '</div>' +
        '</div>';

      var btnConf = cosEl.querySelector('[data-reserva-confirmar]');
      var btnCanv = cosEl.querySelector('[data-reserva-canviar]');
      btnCanv.addEventListener('click', function () {
        estat.seleccionada = null;
        pintarFranges('');
      });
      btnConf.addEventListener('click', function () {
        btnConf.disabled = true;
        btnCanv.disabled = true;
        btnConf.textContent = dic.confirmant;
        enviarReserva(franja);
      });
      enfocarTitol(cosEl);
    }

    function pintarExit(inici, fi, idFranja) {
      mostrarEstat('', false);
      var dia = nomDia(inici, estat.zona, lang);
      var hora = horaLocal(inici, estat.zona, lang);
      var detall = tr(lang, 'exitDetall', { dia: dia, hora: hora, durada: estat.durada });
      var ics = generarIcs(inici, fi, lang, idFranja);
      cosEl.innerHTML =
        '<div class="reserva-exit">' +
          '<h2 class="reserva-titol" tabindex="-1">' + esc(dic.exitTitol) + '</h2>' +
          '<p class="reserva-exit-detall">' + esc(detall) + '</p>' +
          '<p class="reserva-exit-correu">' + esc(dic.exitCorreu) + '</p>' +
          '<div class="reserva-accions">' +
            '<button type="button" class="btn btn-primary reserva-accio" data-reserva-ics>' + esc(dic.afegirCalendari) + '</button>' +
          '</div>' +
        '</div>';
      var btnIcs = cosEl.querySelector('[data-reserva-ics]');
      btnIcs.setAttribute('data-ics-preview', ics);
      btnIcs.addEventListener('click', function () { descarregarIcs(ics); });
      enfocarTitol(cosEl);
    }

    function enviarReserva(franja) {
      fetch(API_BASE + '/api/public/reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, franja: franja.id }),
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, ok: r.ok, d: d }; });
        })
        .then(function (res) {
          if (res.ok && res.d && res.d.ok) {
            pintarExit(res.d.inici || franja.inici, res.d.fi || franja.fi, franja.id);
            return;
          }
          if (res.status === 409) {
            estat.seleccionada = null;
            carregarFranges(dic.errOcupada);
            return;
          }
          if (res.status === 404) {
            pintarErrorContacte(dic.errToken);
            return;
          }
          if (res.status === 400) {
            pintarFranges(dic.errDades);
            return;
          }
          pintarErrorContacte(dic.errXarxa);
        })
        .catch(function () {
          pintarErrorContacte(dic.errXarxa);
        });
    }

    function carregarFranges(avisPrevi) {
      mostrarEstat(avisPrevi || dic.carregant, Boolean(avisPrevi));
      cosEl.innerHTML = '';
      fetch(API_BASE + '/api/public/reserva/franges?t=' + encodeURIComponent(token))
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, ok: r.ok, d: d }; });
        })
        .then(function (res) {
          if (res.status === 404) {
            pintarErrorContacte(dic.errToken);
            return;
          }
          if (!res.ok || !res.d || !res.d.ok) {
            pintarErrorContacte(dic.errXarxa);
            return;
          }
          estat.zona = res.d.zona || 'Europe/Madrid';
          estat.durada = res.d.durada || 20;
          estat.franges = Array.isArray(res.d.franges) ? res.d.franges : [];
          pintarFranges(avisPrevi || '');
        })
        .catch(function () {
          pintarErrorContacte(dic.errXarxa);
        });
    }

    if (!token) {
      pintarErrorContacte(dic.errToken);
      return true;
    }
    carregarFranges('');
    return true;
  }

  window.MadeinhumanReserva = {
    activa: function () { return ACTIVA; },
    muntar: muntar,
    generarIcs: generarIcs,
  };

  // Inicialització automàtica de la pàgina /reserva/ (sense scripts inline per respectar la CSP)
  function iniciarPagina() {
    var cont = document.querySelector('[data-reserva-pagina]');
    if (!cont) return;
    var params = new URLSearchParams(window.location.search);
    var token = (params.get('t') || '').trim();
    if (params.has('t') && window.history && typeof window.history.replaceState === 'function') {
      params.delete('t');
      var resta = params.toString();
      var neta = window.location.pathname + (resta ? '?' + resta : '') + window.location.hash;
      window.history.replaceState(null, '', neta);
    }
    var lang = cont.getAttribute('data-idioma') || document.documentElement.lang || 'ca';
    if (!ACTIVA || !token) return;
    muntar(cont, token, lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarPagina);
  } else {
    iniciarPagina();
  }
})();
