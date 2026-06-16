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
const FAQ_DATA = [
  { cat: "rgpd", q: "La meva empresa de 5 treballadors necessita adequar-se al RGPD?", a: "Sí, sense excepcions. El RGPD s'aplica a qualsevol organització que tracti dades personals — i tractar dades vol dir tenir clients, treballadors, proveïdors o fins i tot un formulari de contacte al web. La diferència respecte a una multinacional és el volum i la complexitat, no l'obligació. Per a una pyme, l'adequació és més senzilla i assequible del que sembla." },
  { cat: "rgpd", q: "Què és un DPO i quan és obligatori tenir-ne un?", a: "El Delegat de Protecció de Dades (DPO) és la figura que supervisa el compliment del RGPD a l'organització. És obligatori si tractes dades a gran escala, dades sensibles (salut, ideologia, biometria), o si fas observació sistemàtica. Moltes pymes no necessiten DPO obligatori, però sí algú que assumeixi la responsabilitat de privacitat. Oferim DPO extern quan cal." },
  { cat: "ia", q: "Uso ChatGPT a la meva empresa. M'afecta el Reglament d'IA?", a: "Probablement sí, encara que de manera lleugera. El Reglament classifica els sistemes d'IA per nivell de risc. Eines d'ús general com ChatGPT tenen obligacions de transparència: has d'informar les persones quan interactuen amb IA, i no pots tractar dades personals sense base legal. Si la fas servir per decisions amb impacte (RRHH, crèdits, selecció), les obligacions augmenten significativament." },
  { cat: "ia", q: "Qui supervisa el compliment del Reglament d'IA a Espanya?", a: "L'AESIA (Agencia Española de Supervisión de la Inteligencia Artificial) és l'organisme encarregat de supervisar el Reglament d'IA a nivell estatal. En matèria de protecció de dades, l'AEPD i l'APDCat (a Catalunya) segueixen tenint un paper clau, ja que la majoria de sistemes d'IA tracten dades personals." },
  { cat: "practic", q: "Quant costa adequar-se al RGPD?", a: "Depèn del punt de partida i de la complexitat del tractament. Per a una pyme estàndard, una adequació completa se situa habitualment entre 2.000 i 6.000 €, amb una quota de manteniment anual inferior. Comencem amb una diagnosi inicial per oferir-te un pressupost concret abans de començar." },
  { cat: "practic", q: "Quant temps porta el procés?", a: "Una adequació RGPD per a pyme es completa habitualment en 4–8 setmanes des de la diagnosi fins a la implementació. La preparació per al Reglament d'IA depèn del nombre de sistemes a avaluar — comptem entre 2 i 4 mesos per a un projecte estàndard. Treballem per fases per no aturar la teva activitat." },
  { cat: "rgpd", q: "Què passa si tinc una inspecció de l'AEPD?", a: "Si has fet la feina, no res greu. L'AEPD valora positivament les empreses que demostren diligència — registre d'activitats, anàlisis de risc, formació interna. T'acompanyem en tot el procés, des de la primera comunicació fins a la resposta formal, sempre amb l'objectiu de minimitzar l'impacte i corregir el que calgui." },
  { cat: "practic", q: "Treballeu fora de Catalunya?", a: "Sí. La major part de la nostra cartera és catalana — pymes i autònoms d'aquí — i el català és la nostra llengua per defecte. Però acompanyem clients d'arreu de l'Estat i d'Europa quan tractem matèria de RGPD o AI Act, en castellà o anglès si cal." },
  { cat: "glossari", q: "RGPD — Reglament General de Protecció de Dades", a: "Reglament europeu (UE) 2016/679, en vigor des del 25 de maig de 2018. Estableix les normes per al tractament de dades personals en tots els estats membres de la UE. Substituí la Directiva 95/46/CE i és d'aplicació directa, sense necessitat de transposició." },
  { cat: "glossari", q: "LOPDGDD — Llei Orgànica de Protecció de Dades", a: "Llei Orgànica 3/2018, de 5 de desembre, de Protecció de Dades Personals i Garantia dels Drets Digitals. Norma estatal espanyola que adapta i complementa el RGPD. Regula aspectes com el dret a la desconnexió digital, la privacitat als centres educatius o el tractament de dades en relacions laborals." },
  { cat: "glossari", q: "DPO / DPD — Delegat de Protecció de Dades", a: "Figura prevista al RGPD (art. 37–39) encarregada de supervisar el compliment intern de la normativa de protecció de dades. Pot ser intern o extern. És obligatori en determinats casos (tractament a gran escala, dades sensibles, autoritats públiques) i recomanable en molts d'altres." },
  { cat: "glossari", q: "AEPD — Agència Espanyola de Protecció de Dades", a: "Autoritat de control independent encarregada de vetllar pel compliment del RGPD i la LOPDGDD a Espanya. Té potestat sancionadora, publica guies i eines de compliment, i resol les reclamacions dels ciutadans. Web: aepd.es." },
  { cat: "glossari", q: "APDCat — Autoritat Catalana de Protecció de Dades", a: "Autoritat de control independent de Catalunya, competent respecte a les administracions públiques catalanes i els partits polítics amb activitat a Catalunya. Col·labora activament en el desenvolupament de metodologies per a l'avaluació d'impacte de la IA sobre drets fonamentals. Web: apdcat.gencat.cat." },
  { cat: "glossari", q: "AESIA — Agència Espanyola de Supervisió de la IA", a: "Organisme estatal creat per supervisar l'aplicació del Reglament europeu d'IA a Espanya. Publica guies i bones pràctiques adreçades a empreses i administracions. Serà l'autoritat sancionadora en matèria d'IA quan el Reglament estigui plenament en vigor. Web: aesia.digital.gob.es." },
  { cat: "glossari", q: "RAT — Registre d'Activitats de Tractament", a: "Document obligatori (RGPD, art. 30) per a la majoria d'organitzacions que tracten dades personals. Recull totes les activitats de tractament que realitza l'empresa: finalitat, categories de dades, destinataris, terminis de conservació i mesures de seguretat. És el punt de partida de qualsevol adequació al RGPD." },
  { cat: "glossari", q: "EIPD — Avaluació d'Impacte en la Protecció de Dades", a: "Anàlisi obligatòria (RGPD, art. 35) quan un tractament pot suposar un risc elevat per als drets i les llibertats de les persones. Habitual en videovigilància a gran escala, tractaments biometrics, o sistemes automatitzats de presa de decisions. L'AEPD publica una llista de casos en què és obligatoria." },
];

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
  : 'https://api.madeinhuman.cat';

function parseEmpleats(val) {
  if (!val) return undefined;
  if (val.startsWith('+')) return parseInt(val.slice(1)) || 500;
  const n = parseInt(val.split(/[–\-]/)[0]);
  return isNaN(n) ? undefined : n;
}

function serveisSeleccionats(form) {
  return Array.from(form.querySelectorAll('input[name="svc"]:checked')).map(el => el.value);
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

    const fd = new FormData(form);
    const body = {
      nom: fd.get('nom'),
      email: fd.get('email'),
      empresa: fd.get('empresa') || undefined,
      missatge: fd.get('missatge'),
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
(function () {
  const keys = document.querySelectorAll('.metric-key');
  if (!keys.length) return;

  function animateValue(el, text) {
    const match = text.match(/^([\d.,]+)(.*)$/);
    if (!match) return;
    const target = parseFloat(match[1].replace(',', '.'));
    const suffix = match[2] || '';
    const isDecimal = match[1].includes(',') || match[1].includes('.');
    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = Math.round(target * ease);
      el.textContent = (isDecimal ? (target * ease).toFixed(0) : val) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = text;
    }
    requestAnimationFrame(step);
  }

  const originals = [];
  keys.forEach(k => {
    originals.push(k.textContent.trim());
    k.textContent = '';
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = Array.from(keys).indexOf(e.target);
        animateValue(e.target, originals[idx]);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  keys.forEach(k => obs.observe(k));
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
