/* =============================================
   MADEINHUMAN — Script (v2)
   ============================================= */

// -----------------------------------------------
// Nav scroll
// -----------------------------------------------
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

// Mobile menu
function toggleMenu() {
  document.getElementById('navMobile').classList.toggle('open');
}

// -----------------------------------------------
// Custom checkboxes — toggle .checked class
// -----------------------------------------------
document.querySelectorAll('.check, .privacy-check').forEach(label => {
  const cb = label.querySelector('input[type="checkbox"]');
  if (!cb) return;
  cb.addEventListener('change', () => {
    label.classList.toggle('checked', cb.checked);
  });
});

// Radio buttons — toggle .checked class (mutual exclusion per name)
document.addEventListener('change', (e) => {
  const input = e.target;
  if (input.type !== 'radio') return;
  // Uncheck all same-name radios in the same form
  const form = input.closest('form');
  if (!form) return;
  form.querySelectorAll(`input[type="radio"][name="${input.name}"]`).forEach(r => {
    r.closest('.radio').classList.toggle('checked', r.checked);
  });
});

// teWeb conditional fields
document.addEventListener('change', (e) => {
  if (e.target.name !== 'teWeb') return;
  const show = e.target.value === 'si';
  const urlField = document.getElementById('webUrlField');
  const extras = document.getElementById('webExtras');
  if (urlField) urlField.style.display = show ? '' : 'none';
  if (extras) extras.style.display = show ? '' : 'none';
});

// -----------------------------------------------
// FAQ accordion
// -----------------------------------------------
// Les preguntes són a contingut/faq.json; el generador les incrusta a la pàgina (#dades-faq)
const FAQ_DATA = (() => {
  const el = document.getElementById('dades-faq');
  try { return el ? JSON.parse(el.textContent) : []; } catch { return []; }
})();

let faqTab = 'tots';
let faqOpen = 0;

function renderFAQ() {
  const list = document.getElementById('faqList');
  const filtered = faqTab === 'tots' ? FAQ_DATA : FAQ_DATA.filter(f => f.cat === faqTab);
  list.innerHTML = filtered.map((item, i) => `
    <div class="faq-item${faqOpen === i ? ' open' : ''}" data-idx="${i}">
      <button class="faq-q" type="button">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span>${item.q}</span>
        <span class="plus"></span>
      </button>
      <div class="faq-a">
        <div class="faq-a-inner">${item.a}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.faq-item').dataset.idx);
      faqOpen = faqOpen === idx ? -1 : idx;
      renderFAQ();
    });
  });
}

if (document.getElementById('faqTabs')) {
  document.getElementById('faqTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    faqTab = tab.dataset.cat;
    faqOpen = 0;
    document.querySelectorAll('#faqTabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderFAQ();
  });
  renderFAQ();
}

// -----------------------------------------------
// API
// -----------------------------------------------
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://rgpd.madeinhuman.cat';

function parseEmpleats(val) {
  if (!val) return undefined;
  if (val.startsWith('+')) return parseInt(val.slice(1)) || 500;
  const n = parseInt(val.split(/[–\-]/)[0]);
  return isNaN(n) ? undefined : n;
}

function serveisSeleccionats(form) {
  return Array.from(form.querySelectorAll('input[name="svc"]:checked')).map(el => el.value);
}

// Camps ocults utm_* (omplerts per utm.js); els buits no s'envien
function utmDelFormulari(fd) {
  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(k => {
    if (fd.get(k)) utm[k] = fd.get(k);
  });
  return utm;
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  if (!btn.dataset.orig) btn.dataset.orig = btn.innerHTML;
  if (loading) {
    btn.innerHTML = 'Enviant… <span class="arrow" aria-hidden="true">&rarr;</span>';
  } else {
    btn.innerHTML = btn.dataset.orig;
  }
}

function showResult(formCard, type, msg) {
  // Remove previous messages
  formCard.querySelectorAll('.form-success, .form-error').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = type === 'ok' ? 'form-success' : 'form-error';
  div.innerHTML = `<span>${type === 'ok' ? '✓' : '✗'}</span><span>${msg}</span>`;
  formCard.appendChild(div);
  if (type === 'ok') setTimeout(() => div.remove(), 8000);
}

// -----------------------------------------------
// Formulari de contacte
// -----------------------------------------------
(function () {
  const form = document.getElementById('formContacte');
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const first = form.querySelector(':invalid');
      if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first.focus({ preventScroll: true });
        const field = first.closest('.field');
        if (field) field.classList.add('invalid');
      }
      return;
    }

    if (window.MIH_UTM) window.MIH_UTM.omplir(form);  // origen de la visita (utm.js)
    const fd = new FormData(form);
    const body = {
      nom: fd.get('nom'),
      email: fd.get('email'),
      empresa: fd.get('empresa') || undefined,
      missatge: fd.get('missatge'),
      ...utmDelFormulari(fd),
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

    setLoading(btn, true);
    try {
      const res = await fetch(`${API_URL}/api/public/contacte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error desconegut');
      const nom = body.nom.split(' ')[0];
      showResult(form, 'ok', `Gràcies, ${nom}. Et responem en menys de 24 hores laborals.`);
      form.reset();
      form.querySelectorAll('.privacy-check').forEach(l => l.classList.remove('checked'));
    } catch {
      showResult(form, 'err', "No s'ha pogut enviar el missatge. Torna-ho a intentar.");
    } finally {
      setLoading(btn, false);
    }
  });
})();

// -----------------------------------------------
// Formulari d'adequació RGPD
// -----------------------------------------------
(function () {
  const form = document.getElementById('formAdequacio');
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const first = form.querySelector(':invalid');
      if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first.focus({ preventScroll: true });
        const field = first.closest('.field');
        if (field) field.classList.add('invalid');
      }
      return;
    }

    if (window.MIH_UTM) window.MIH_UTM.omplir(form);  // origen de la visita (utm.js)
    const fd = new FormData(form);

    // Eines digitals — array → JSON string
    const eines = Array.from(form.querySelectorAll('input[name="eina"]:checked')).map(el => el.value);

    // Radio booleans
    const boolVal = (name) => {
      const val = fd.get(name);
      if (val === 'si') return true;
      if (val === 'no') return false;
      return undefined;
    };

    const body = {
      nom: fd.get('personaContacte'),
      email: fd.get('email'),
      empresa: fd.get('empresa') || undefined,
      nif: fd.get('nif') || undefined,
      activitat: fd.get('activitat') || undefined,
      telefon: fd.get('telefon') || undefined,
      personaContacte: fd.get('personaContacte') || undefined,
      adreca: fd.get('adreca') || undefined,
      numTreballadors: parseInt(fd.get('numTreballadors')) || undefined,
      numET: parseInt(fd.get('numET')) || undefined,
      riscArt9: fd.get('riscArt9') || undefined,
      riscCloud: fd.get('riscCloud') || undefined,
      riscIA: fd.get('riscIA') || undefined,
      riscBio: fd.get('riscBio') || undefined,
      riscSector: fd.get('riscSector') || undefined,
      teWeb: boolVal('teWeb'),
      urlWeb: fd.get('urlWeb') || undefined,
      comercElectronic: boolVal('comercElectronic'),
      enviaCV: boolVal('enviaCV'),
      einesCloud: eines.length ? JSON.stringify(eines) : undefined,
      enviaComunicacions: boolVal('enviaComunicacions'),
      grupEmpresarial: boolVal('grupEmpresarial'),
      diversesSeus: boolVal('diversesSeus'),
      observacions: fd.get('observacions') || undefined,
      ...utmDelFormulari(fd),
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

    setLoading(btn, true);
    try {
      const res = await fetch(`${API_URL}/api/public/pressupost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error desconegut');
      const data = await res.json();
      showResult(form, 'ok', `Sol·licitud rebuda (ref. ${data.numero}). Ens posarem en contacte en menys de 48 hores amb la vostra proposta.`);
      form.reset();
      form.querySelectorAll('.check, .privacy-check, .radio').forEach(l => l.classList.remove('checked'));
      document.getElementById('webUrlField').style.display = 'none';
      document.getElementById('webExtras').style.display = 'none';
    } catch {
      showResult(form, 'err', "No s'ha pogut enviar la sol·licitud. Torna-ho a intentar o contacta'ns per correu.");
    } finally {
      setLoading(btn, false);
    }
  });
})();

// -----------------------------------------------
// Scroll progress bar
// -----------------------------------------------
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  function update() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0%';
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// -----------------------------------------------
// Scroll-reveal (IntersectionObserver)
// -----------------------------------------------
(function () {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
})();

// -----------------------------------------------
// Active nav link on scroll
// -----------------------------------------------
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  function update() {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 200) current = s.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// -----------------------------------------------
// Back to top button
// -----------------------------------------------
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
})();

// -----------------------------------------------
// Metric counter animation
// -----------------------------------------------
// Format català: el punt separa els milers i la coma, els decimals
// («30.931», «4,5», «64%»). Les claus no numèriques («RGPD») no es toquen.
(function () {
  const NUM = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(.*)$/;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  // Xifres del bloc de context i de les notes. Els anys (2018, 2026…) no compten: es queden com són.
  const keys = Array.from(document.querySelectorAll('.metric-key, .nota-clau'))
    .filter(k => NUM.test(k.textContent.trim()) && !/^(19|20)\d{2}$/.test(k.textContent.trim()));
  if (!keys.length) return;

  function format(n, decimals, grouped) {
    const [int, dec] = n.toFixed(decimals).split('.');
    const intFmt = grouped ? int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : int;
    return dec ? intFmt + ',' + dec : intFmt;
  }

  function animateValue(el, text) {
    const [, intPart, decPart = '', suffix] = text.match(NUM);
    const decimals = decPart.length;
    const grouped = intPart.includes('.');
    const target = parseFloat(intPart.replace(/\./g, '') + (decimals ? '.' + decPart : ''));
    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = format(target * ease, decimals, grouped) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = text;
    }
    requestAnimationFrame(step);
  }

  const originals = new Map();
  keys.forEach(k => originals.set(k, k.textContent.trim()));

  // Abans de posar-les a zero, es fixa l'amplada final (amb les tipografies ja carregades): així el text no fa
  // saltar la maqueta mentre compta i el fil conductor (fil.js) en protegeix la caixa sencera
  const aZero = () => keys.forEach(k => {
    k.style.minWidth = Math.ceil(k.getBoundingClientRect().width) + 'px';
    const [, , decPart = '', suffix] = originals.get(k).match(NUM);
    k.textContent = format(0, decPart.length, false) + suffix;
  });
  const preparat = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateValue(e.target, originals.get(e.target));
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  preparat.then(() => { aZero(); keys.forEach(k => obs.observe(k)); });
})();

// -----------------------------------------------
// Adequació form progress bar
// -----------------------------------------------
(function () {
  const form = document.getElementById('formAdequacio');
  const fill = document.getElementById('formProgressFill');
  const pct = document.getElementById('formProgressPct');
  const dots = document.querySelectorAll('.form-progress-dot');
  if (!form || !fill) return;

  const sections = form.querySelectorAll('.form-section');
  const totalSections = sections.length;

  function updateProgress() {
    let completed = 0;
    sections.forEach((sec, i) => {
      const required = sec.querySelectorAll('[required]');
      const allFilled = Array.from(required).every(el => {
        if (el.type === 'radio') {
          return form.querySelector(`input[name="${el.name}"]:checked`);
        }
        return el.value && el.value.trim() !== '';
      });
      if (allFilled && required.length > 0) completed++;
      if (dots[i]) dots[i].classList.toggle('active', allFilled && required.length > 0);
    });
    const percent = Math.round((completed / totalSections) * 100);
    fill.style.width = percent + '%';
    if (pct) pct.textContent = percent + '%';
  }

  form.addEventListener('input', updateProgress);
  form.addEventListener('change', updateProgress);
  updateProgress();
})();

// -----------------------------------------------
// Inline field validation (blur)
// -----------------------------------------------
(function () {
  document.addEventListener('blur', (e) => {
    const input = e.target;
    if (!input.matches('.input, .textarea, .select')) return;
    const field = input.closest('.field');
    if (!field) return;

    if (!input.required && !input.value) {
      field.classList.remove('valid', 'invalid');
      return;
    }

    if (input.required && !input.value.trim()) {
      field.classList.remove('valid');
      field.classList.add('invalid');
    } else if (input.type === 'email' && input.value && !input.validity.valid) {
      field.classList.remove('valid');
      field.classList.add('invalid');
    } else if (input.value.trim()) {
      field.classList.remove('invalid');
      field.classList.add('valid');
    }
  }, true);

  document.addEventListener('input', (e) => {
    const input = e.target;
    if (!input.matches('.input, .textarea, .select')) return;
    const field = input.closest('.field');
    if (field && field.classList.contains('invalid') && input.value.trim()) {
      field.classList.remove('invalid');
    }
  });
})();

// -----------------------------------------------
// Smooth scroll to first error on form submit
// -----------------------------------------------
(function () {
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('invalid', (e) => {
      e.preventDefault();
      const first = form.querySelector(':invalid');
      if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first.focus({ preventScroll: true });
        const field = first.closest('.field');
        if (field) field.classList.add('invalid');
      }
    }, true);
  });
})();

// -----------------------------------------------
// Cookie consent banner
// -----------------------------------------------
(function initCookieBanner() {
  if (localStorage.getItem('cookie_consent')) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consentiment de cookies');
  banner.innerHTML =
    '<div class="cookie-banner-text">' +
      'Aquest lloc web utilitza cookies tècniques per garantir el seu funcionament correcte. ' +
      'Consulta la nostra <a href="politica-cookies.html">política de cookies</a> per a més informació.' +
    '</div>' +
    '<div class="cookie-banner-actions">' +
      '<button class="btn btn-primary" id="cookieAccept">Acceptar</button>' +
      '<button class="btn btn-ghost" id="cookieReject">Rebutjar</button>' +
    '</div>';

  document.body.appendChild(banner);

  function closeBanner(value) {
    localStorage.setItem('cookie_consent', value);
    banner.remove();
  }
  document.getElementById('cookieAccept').addEventListener('click', function() { closeBanner('accepted'); });
  document.getElementById('cookieReject').addEventListener('click', function() { closeBanner('rejected'); });
})();
