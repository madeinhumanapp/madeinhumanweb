// =====================================================================
// Diagnòstic RGPD gratuït (diagnostic.html)
// Envia les respostes a rgpd.madeinhuman.cat/api/public/diagnostic.
// Els `id` i els valors de les preguntes han de coincidir amb
// rgpdtool/src/lib/diagnostic/preguntes.ts
// =====================================================================
(function () {
  'use strict';

  // ✏️ EDITABLE: configuració
  var API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://rgpd.madeinhuman.cat';
  var CALENDARI_URL = 'index.html#contacte';   // ✏️ enllaç de reserva (Cal.com, etc.) quan estigui decidit
  var TURNSTILE_SITE_KEY = '';                  // ✏️ clau pública de Cloudflare Turnstile (buida = desactivat)

  // ── Preguntes ─────────────────────────────────────────────────────
  var Q = [
    { id: 'sector', bloc: 'A · Sobre vosaltres', t: 'A quin sector us dediqueu?', cols: true, opts: [
      ['salut', 'Salut'], ['educacio', 'Educació i lleure'], ['comerc', 'Comerç i botiga en línia'], ['serveis', 'Serveis professionals'],
      ['hostaleria', 'Hostaleria'], ['social', 'Entitat social'], ['altres', 'Altres']] },
    { id: 'mida', bloc: 'A · Sobre vosaltres', t: "Quantes persones formeu l'equip?", help: 'Incloeu-hi totes les persones que treballen amb vosaltres, també les autònomes habituals.', cols: true, opts: [
      ['1', 'Només jo'], ['2-9', 'De 2 a 9'], ['10-49', 'De 10 a 49'], ['50+', '50 o més']] },
    { id: 'sensibles', bloc: 'B · Quines dades tracteu', t: "Tracteu alguna d'aquestes dades?", help: "Podeu marcar-ne més d'una.", multi: true, none: 'cap', opts: [
      ['salut', 'Dades de salut (historials, baixes, informes)'], ['menors', "Dades de menors d'edat"], ['banc', 'Dades bancàries de clients'],
      ['penals', 'Antecedents penals o certificats de delictes sexuals'], ['cap', "Cap d'aquestes"]] },
    { id: 'cameres', bloc: 'B · Quines dades tracteu', t: 'Teniu càmeres de videovigilància?', opts: [['si', 'Sí'], ['no', 'No']] },
    { id: 'web', bloc: 'B · Quines dades tracteu', t: 'Teniu pàgina web?', opts: [
      ['no', 'No'], ['info', 'Sí, només informativa'], ['form', 'Sí, amb formulari de contacte o reserves'], ['botiga', 'Sí, amb botiga en línia']] },
    { id: 'comunicacions', bloc: 'B · Quines dades tracteu', t: 'Envieu butlletins, promocions o missatges per WhatsApp als clients?', opts: [['si', 'Sí'], ['no', 'No']] },
    { id: 'proveidors', bloc: 'B · Quines dades tracteu', t: 'Quins proveïdors externs tenen accés a les vostres dades?', help: "Podeu marcar-ne més d'un.", multi: true, none: 'cap', opts: [
      ['gestoria', 'Gestoria o assessoria'], ['informatic', 'Servei informàtic'], ['nuvol', 'Programes al núvol (gestió, facturació, CRM…)'],
      ['altres', 'Laboratori o altres proveïdors'], ['cap', 'Cap']] },
    { id: 'copies', bloc: 'C · Com les protegiu', t: "Feu còpies de seguretat que es guardin fora de l'oficina?", help: 'Per exemple, al núvol o en un disc que no es queda al local.', opts: [
      ['auto', 'Sí, automàtiques'], ['manual', 'Sí, però a mà i de tant en tant'], ['no', 'No']] },
    { id: '2fa', bloc: 'C · Com les protegiu', t: 'Teniu activada la doble verificació (2FA) al correu i als programes principals?', help: 'És el codi que arriba al mòbil, a més de la contrasenya.', opts: [
      ['si', 'Sí, a tot arreu'], ['alguns', 'En alguns comptes'], ['no', 'No']] },
    { id: 'normes', bloc: 'C · Com les protegiu', t: "L'equip té normes escrites o ha rebut formació sobre protecció de dades?", opts: [['si', 'Sí'], ['no', 'No']] },
    { id: 'docs', bloc: 'D · Quina documentació teniu', t: "Quins d'aquests documents teniu fets?", help: 'Marqueu només els que existeixen i estan actualitzats.', multi: true, none: 'cap', opts: [
      ['politica', 'Política de protecció de dades'], ['rat', "Registre d'activitats del tractament (RAT)"], ['riscos', 'Anàlisi de riscos'],
      ['bretxes', 'Protocol de bretxes de seguretat'], ['drets', 'Protocol per atendre els drets de les persones'], ['contractes', 'Contractes amb els proveïdors (art. 28)'],
      ['confid', "Compromisos de confidencialitat de l'equip"], ['normesdoc', "Normes d'ús dels sistemes informàtics"], ['conservacio', 'Política de conservació de dades'],
      ['clausules', 'Textos legals a la web i als formularis'], ['cap', 'Cap'], ['segur', "No n'estic segur"]] }
  ];
  var DK = ['nsnc', 'No ho sé'];

  // ── Origen (gestoria / campanya) ─────────────────────────────────
  var params = new URLSearchParams(window.location.search);
  var origen = {};
  try { origen = JSON.parse(sessionStorage.getItem('mih_diag_origen') || '{}'); } catch (e) { origen = {}; }
  if (params.get('ref')) origen.ref = params.get('ref').replace(/[^\w.-]/g, '').slice(0, 60);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
    if (params.get(k)) { origen.utm = origen.utm || {}; origen.utm[k] = params.get(k).slice(0, 100); }
  });
  try { sessionStorage.setItem('mih_diag_origen', JSON.stringify(origen)); } catch (e) { /* res */ }

  // ── Utilitats ─────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // ── Construcció de les pantalles ─────────────────────────────────
  var app = document.getElementById('app');
  var A = {};
  Q.forEach(function (q, i) {
    var s = document.createElement('section');
    s.className = 'step';
    s.dataset.id = q.id;
    var opts = q.multi ? q.opts : q.opts.concat([DK]);
    var role = q.multi ? 'group' : 'radiogroup';
    s.innerHTML =
      '<div class="kicker">' + String(i + 1).padStart(2, '0') + ' / ' + Q.length + ' · ' + q.bloc.toUpperCase() + '</div>' +
      '<h2 tabindex="-1" id="q-' + q.id + '">' + esc(q.t) + '</h2><p class="help">' + (q.help ? esc(q.help) : '') + '</p>' +
      '<div class="opts ' + (q.cols ? 'cols' : '') + '" role="' + role + '" aria-labelledby="q-' + q.id + '">' +
      opts.map(function (o) {
        var dk = o[0] === 'nsnc' || o[0] === 'segur';
        return '<button type="button" class="opt' + (dk ? ' dk' : '') + '" role="' + (q.multi ? 'checkbox' : 'radio') + '" ' +
          (q.multi ? 'aria-checked="false"' : 'aria-checked="false"') + ' data-v="' + o[0] + '"><span class="mk" aria-hidden="true"></span>' + esc(o[1]) + '</button>';
      }).join('') +
      '</div><div class="nav"><button type="button" class="back" data-go="prev">← Enrere</button>' +
      (q.multi ? '<button type="button" class="btn" data-go="next" disabled>Continuar →</button>' : '') + '</div>';
    app.appendChild(s);
  });
  // Al CSS, el quadrat de les respostes múltiples es distingeix per [aria-checked] + role=checkbox
  app.querySelectorAll('.opt[role="radio"]').forEach(function (b) { b.removeAttribute('aria-checked'); b.setAttribute('aria-pressed', 'false'); });

  app.insertAdjacentHTML('beforeend',
    '<section class="step" data-id="contacte">' +
      '<div class="kicker">ÚLTIM PAS</div>' +
      '<h2 tabindex="-1">On us enviem l\'informe?</h2>' +
      '<p class="help">Rebreu el PDF en menys d\'un minut.</p>' +
      '<form id="f" novalidate>' +
        '<div class="row"><div class="field"><label for="d-nom">Nom i cognoms *</label><input id="d-nom" name="nom" required autocomplete="name" maxlength="100"></div>' +
        '<div class="field"><label for="d-empresa">Empresa *</label><input id="d-empresa" name="empresa" required autocomplete="organization" maxlength="150"></div></div>' +
        '<div class="row"><div class="field"><label for="d-email">Correu electrònic *</label><input id="d-email" name="email" type="email" required autocomplete="email" maxlength="200"></div>' +
        '<div class="field"><label for="d-tel">Telèfon (opcional)</label><input id="d-tel" name="telefon" type="tel" autocomplete="tel" maxlength="30"></div></div>' +
        '<div class="hp" aria-hidden="true"><label>Web <input name="web_url" tabindex="-1" autocomplete="off"></label></div>' +
        '<label class="check"><input type="checkbox" name="privacitat" required><span>He llegit la <a href="politica-privacitat.html" target="_blank" rel="noopener">política de privacitat</a> i accepto que tracteu les meves dades per enviar-me l\'informe. *</span></label>' +
        '<label class="check"><input type="checkbox" name="comercial"><span><b>Vull rebre consells i novetats de madeinhuman</b> per correu. Us en podeu donar de baixa en qualsevol moment. <i>(Opcional)</i></span></label>' +
        '<div id="turnstile"></div>' +
        '<div class="err" id="err" role="alert"></div>' +
        '<div class="nav"><button type="button" class="back" data-go="prev">← Enrere</button><button class="btn" id="send" type="submit" disabled>Veure el resultat →</button></div>' +
      '</form>' +
    '</section>' +
    '<section class="step res" data-id="resultat" aria-live="polite"></section>');

  var steps = Array.prototype.slice.call(app.querySelectorAll('.step'));
  var cur = 0;

  function show(i) {
    steps[cur].classList.remove('on');
    cur = Math.max(0, Math.min(i, steps.length - 1));
    steps[cur].classList.add('on');
    var total = Q.length + 1;
    document.getElementById('bar').style.width = (cur === steps.length - 1 ? 100 : (Math.min(cur, total) / total * 100)) + '%';
    document.getElementById('count').textContent =
      cur === 0 ? 'Diagnòstic RGPD' : cur <= Q.length ? 'Pregunta ' + cur + ' de ' + Q.length : cur === Q.length + 1 ? 'Últim pas' : 'Resultat';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var h = steps[cur].querySelector('h2');
    if (h) h.focus({ preventScroll: true });
    if (steps[cur].dataset.id === 'contacte') carregarTurnstile();
  }

  app.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); show(go.dataset.go === 'next' ? cur + 1 : cur - 1); return; }
    var o = e.target.closest('.opt');
    if (!o) return;
    var s = o.closest('.step');
    var q = Q.filter(function (x) { return x.id === s.dataset.id; })[0];
    var v = o.dataset.v;
    if (!q.multi) {
      s.querySelectorAll('.opt').forEach(function (b) { b.classList.remove('sel'); b.setAttribute('aria-pressed', 'false'); });
      o.classList.add('sel'); o.setAttribute('aria-pressed', 'true');
      A[q.id] = v;
      setTimeout(function () { show(cur + 1); }, 220);
      return;
    }
    if (v === q.none) {
      var on = !o.classList.contains('sel');
      s.querySelectorAll('.opt').forEach(function (b) { b.classList.remove('sel'); });
      if (on) o.classList.add('sel');
    } else {
      var n = s.querySelector('[data-v="' + q.none + '"]');
      if (n) n.classList.remove('sel');
      o.classList.toggle('sel');
    }
    s.querySelectorAll('.opt').forEach(function (b) { b.setAttribute('aria-checked', b.classList.contains('sel') ? 'true' : 'false'); });
    A[q.id] = Array.prototype.map.call(s.querySelectorAll('.opt.sel'), function (b) { return b.dataset.v; });
    s.querySelector('.btn').disabled = A[q.id].length === 0;
  });

  // ── Turnstile (opcional) ─────────────────────────────────────────
  var turnstileToken = '';
  var turnstileCarregat = false;
  function carregarTurnstile() {
    if (!TURNSTILE_SITE_KEY || turnstileCarregat) return;
    turnstileCarregat = true;
    window.onTurnstileLoad = function () {
      window.turnstile.render('#turnstile', {
        sitekey: TURNSTILE_SITE_KEY, language: 'ca', theme: 'dark',
        callback: function (t) { turnstileToken = t; validar(); },
        'expired-callback': function () { turnstileToken = ''; validar(); }
      });
    };
    var sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    sc.async = true; sc.defer = true;
    document.head.appendChild(sc);
  }

  // ── Enviament ─────────────────────────────────────────────────────
  var f = document.getElementById('f');
  var send = document.getElementById('send');
  var err = document.getElementById('err');
  function validar() {
    send.disabled = !(f.nom.value.trim().length >= 2 && f.empresa.value.trim() && /^\S+@\S+\.\S+$/.test(f.email.value.trim()) &&
      f.privacitat.checked && (!TURNSTILE_SITE_KEY || turnstileToken));
  }
  f.addEventListener('input', validar);
  f.addEventListener('change', validar);

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (send.disabled) return;
    err.classList.remove('on');
    send.disabled = true;
    var orig = send.innerHTML;
    send.innerHTML = 'Calculant…';
    var body = {
      respostes: A,
      nom: f.nom.value.trim(), empresa: f.empresa.value.trim(), email: f.email.value.trim(),
      telefon: f.telefon.value.trim(),
      privacitat: true, comercial: f.comercial.checked,
      ref: origen.ref || '', utm: origen.utm,
      turnstile: turnstileToken || undefined,
      web_url: f.web_url.value
    };
    fetch(API_URL + '/api/public/diagnostic', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok || !x.d.ok) throw new Error(x.d.error || 'error');
        resultat(x.d, body.email, body.comercial);
        show(steps.length - 1);
      })
      .catch(function (e2) {
        err.textContent = (e2 && e2.message && e2.message !== 'error' && e2.message !== 'Failed to fetch')
          ? e2.message
          : "No hem pogut enviar el diagnòstic. Torneu-ho a provar d'aquí una estona o escriviu-nos a info@madeinhuman.cat.";
        err.classList.add('on');
        if (window.turnstile && TURNSTILE_SITE_KEY) { try { window.turnstile.reset('#turnstile'); turnstileToken = ''; } catch (e3) { /* res */ } }
      })
      .then(function () { send.innerHTML = orig; validar(); });
  });

  function resultat(d, email, comercial) {
    var L = { alt: 'Risc alt', mitja: 'Risc mitjà', baix: 'Risc baix' };
    var docs = d.documentsDubte && d.documentsOk === 0 ? 'pendent de confirmar' : d.documentsOk + ' de ' + d.documentsTotal + ' documents';
    var el = steps[steps.length - 1];
    el.innerHTML =
      '<div class="kicker">EL VOSTRE RESULTAT</div>' +
      '<h2 tabindex="-1">' + esc(f.empresa.value.trim()) + '</h2>' +
      '<div class="gauge"><svg viewBox="0 0 200 112" role="img" aria-label="Índex de risc ' + d.index + ' sobre 100">' +
        '<path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14" stroke-linecap="round"/>' +
        '<path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="url(#gg)" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" id="arc"/>' +
        '<defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#6FA287"/><stop offset=".5" stop-color="#D9A878"/><stop offset="1" stop-color="#D0694E"/></linearGradient></defs></svg>' +
        '<div class="n">' + d.index + '<small> / 100</small></div></div>' +
      '<span class="pill ' + esc(d.nivell) + '">' + L[d.nivell] + '</span>' +
      '<ul class="tops">' + d.top.map(function (t, i) { return '<li><span>0' + (i + 1) + '</span>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="sent">📄 Us hem enviat l\'<b>informe complet</b> a <b>' + esc(email) + '</b>: el mapa de riscos, l\'estat de la vostra documentació (' + docs + ') i una mesura que podeu aplicar avui. Si no el veieu en uns minuts, mireu la carpeta de correu brossa.' +
        (comercial ? '<br><br>També us hem enviat un enllaç per <b>confirmar la subscripció</b>.' : '') + '</div>' +
      '<div class="cta"><a class="btn" href="' + esc(CALENDARI_URL) + '">Reservar una trucada de 20 minuts →</a><small>Sense compromís. Repassem l\'informe junts.</small></div>';
    requestAnimationFrame(function () {
      setTimeout(function () {
        var a = document.getElementById('arc');
        if (!a) return;
        a.style.transition = 'stroke-dasharray 1.1s ease';
        a.setAttribute('stroke-dasharray', d.index + ' 100');
      }, 80);
    });
    try { sessionStorage.removeItem('mih_diag_origen'); } catch (e) { /* res */ }
  }
})();
