// Cerca interna sense tercers per a /cerca/ i /es/buscar/ (WEB-G05d).
// Llegeix /cerca/index.json o /es/buscar/index.json, cerca sense accents ni majúscules,
// exigeix totes les paraules, prioritza coincidències al títol, limita a 20 resultats
// i sincronitza ?q= a l'URL (compatible amb «Enrere»).
(function () {
  var MAX_RESULTATS = 20;

  var TEXTOS = {
    ca: {
      un: '1 resultat per a «{q}»',
      molts: '{n} resultats per a «{q}»',
      moltsLimitat: 'Mostrant els primers {max} de {n} resultats per a «{q}»',
      cap: 'Cap resultat per a «{q}»',
      carregant: 'Carregant l’índex…',
      error: 'No hem pogut carregar l’índex de cerca. Torna-ho a provar més tard.',
    },
    es: {
      un: '1 resultado para «{q}»',
      molts: '{n} resultados para «{q}»',
      moltsLimitat: 'Mostrando los primeros {max} de {n} resultados para «{q}»',
      cap: 'Ningún resultado para «{q}»',
      carregant: 'Cargando el índice…',
      error: 'No hemos podido cargar el índice de búsqueda. Vuelve a intentarlo más tarde.',
    },
  };

  function normalitzar(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/l·l/g, 'll')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function paraules(q) {
    var net = normalitzar(q);
    return net ? net.split(/\s+/).filter(Boolean) : [];
  }

  function format(plantilla, vals) {
    return String(plantilla).replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, k) {
      return Object.prototype.hasOwnProperty.call(vals, k) ? String(vals[k]) : '';
    });
  }

  function cercar(index, consulta) {
    var qNorm = normalitzar(consulta);
    var termes = paraules(consulta);
    if (!termes.length) return { total: 0, items: [] };

    var coincidencies = [];
    for (var i = 0; i < index.length; i++) {
      var p = index[i];
      var titolN = p._titolN;
      var descN = p._descN;
      var h2N = p._h2N;
      var totN = p._totN;

      var totes = true;
      for (var j = 0; j < termes.length; j++) {
        if (totN.indexOf(termes[j]) === -1) {
          totes = false;
          break;
        }
      }
      if (!totes) continue;

      var puntuacio = 0;
      if (titolN.indexOf(qNorm) !== -1) puntuacio += 100;
      var totesAlTitol = true;
      for (var k = 0; k < termes.length; k++) {
        if (titolN.indexOf(termes[k]) !== -1) puntuacio += 25;
        else totesAlTitol = false;
        if (h2N.indexOf(termes[k]) !== -1) puntuacio += 6;
        if (descN.indexOf(termes[k]) !== -1) puntuacio += 2;
      }
      if (totesAlTitol) puntuacio += 40;
      coincidencies.push({ item: p, puntuacio: puntuacio });
    }

    coincidencies.sort(function (a, b) {
      return b.puntuacio - a.puntuacio || a.item.titol.localeCompare(b.item.titol);
    });

    return {
      total: coincidencies.length,
      items: coincidencies.slice(0, MAX_RESULTATS).map(function (c) { return c.item; }),
    };
  }

  function iniciar() {
    var form = document.querySelector('[data-cerca-form]');
    if (!form) return;
    var input = form.querySelector('input[name="q"]');
    var estat = document.querySelector('[data-cerca-estat]');
    var llista = document.querySelector('[data-cerca-resultats]');
    var buit = document.querySelector('[data-cerca-buit]');
    var indexUrl = form.getAttribute('data-cerca-index') || '/cerca/index.json';
    var lang = form.getAttribute('data-cerca-idioma') === 'es' ? 'es' : 'ca';
    var tx = TEXTOS[lang];
    var rutaBase = form.getAttribute('action') || window.location.pathname;

    var dadesIndex = null;
    var promesaIndex = null;

    function carregarIndex() {
      if (dadesIndex) return Promise.resolve(dadesIndex);
      if (promesaIndex) return promesaIndex;
      if (estat) estat.textContent = tx.carregant;
      promesaIndex = fetch(indexUrl, { headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (arr) {
          dadesIndex = (Array.isArray(arr) ? arr : []).map(function (p) {
            var titolN = normalitzar(p.titol);
            var descN = normalitzar(p.descripcio);
            var h2N = normalitzar((p.h2 || []).join(' '));
            return {
              url: p.url,
              titol: p.titol,
              descripcio: p.descripcio || '',
              h2: p.h2 || [],
              _titolN: titolN,
              _descN: descN,
              _h2N: h2N,
              _totN: titolN + ' ' + h2N + ' ' + descN,
            };
          });
          return dadesIndex;
        });
      return promesaIndex;
    }

    function pintar(consulta) {
      var q = String(consulta || '').trim();
      if (!q) {
        if (estat) estat.textContent = '';
        if (llista) llista.textContent = '';
        if (buit) buit.hidden = true;
        return;
      }
      carregarIndex().then(function (idx) {
        var res = cercar(idx, q);
        if (llista) llista.textContent = '';
        if (!res.total) {
          if (estat) estat.textContent = format(tx.cap, { q: q });
          if (buit) buit.hidden = false;
          return;
        }
        if (buit) buit.hidden = true;
        if (estat) {
          estat.textContent = res.total === 1
            ? format(tx.un, { q: q })
            : res.total > MAX_RESULTATS
              ? format(tx.moltsLimitat, { max: MAX_RESULTATS, n: res.total, q: q })
              : format(tx.molts, { n: res.total, q: q });
        }
        var frag = document.createDocumentFragment();
        res.items.forEach(function (item) {
          var li = document.createElement('li');
          li.className = 'cerca-resultat';
          var a = document.createElement('a');
          a.className = 'cerca-resultat-titol';
          a.href = item.url;
          a.textContent = item.titol;
          li.appendChild(a);
          var urlEl = document.createElement('span');
          urlEl.className = 'cerca-resultat-url';
          urlEl.textContent = item.url;
          li.appendChild(urlEl);
          if (item.descripcio) {
            var p = document.createElement('p');
            p.className = 'cerca-resultat-desc';
            p.textContent = item.descripcio;
            li.appendChild(p);
          }
          frag.appendChild(li);
        });
        if (llista) llista.appendChild(frag);
      }, function () {
        if (estat) estat.textContent = tx.error;
        if (buit) buit.hidden = true;
      });
    }

    function actualitzarUrl(q, push) {
      if (!window.history || !window.history.replaceState) return;
      var net = String(q || '').trim();
      var desti = rutaBase + (net ? '?q=' + encodeURIComponent(net) : '');
      if (desti === window.location.pathname + window.location.search) return;
      if (push && window.history.pushState) window.history.pushState(null, '', desti);
      else window.history.replaceState(null, '', desti);
    }

    function llegirConsultaUrl() {
      try { return new URLSearchParams(window.location.search).get('q') || ''; }
      catch (err) { return ''; }
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = input ? input.value : '';
      actualitzarUrl(q, true);
      pintar(q);
    });

    var temporitzador = null;
    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(temporitzador);
        temporitzador = setTimeout(function () {
          var q = input.value;
          actualitzarUrl(q, false);
          pintar(q);
        }, 120);
      });
    }

    window.addEventListener('popstate', function () {
      var q = llegirConsultaUrl();
      if (input) input.value = q;
      pintar(q);
    });

    var qInicial = llegirConsultaUrl();
    if (input && qInicial) input.value = qInicial;
    if (qInicial) pintar(qInicial);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
