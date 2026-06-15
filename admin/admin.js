/* =============================================
   MADEINHUMAN ADMIN — Core JS
   GitHub API CMS · Zero backend
   ============================================= */

let GH = { token: '', repo: '', branch: 'main', owner: '', repoName: '' };
let FILES = { indexHtml: '', indexSha: '', scriptJs: '', scriptSha: '', cssCache: '' };
let NEWS_DATA = [];
let FAQ_DATA = [];
let STEP_DATA = [];
let HAS_CHANGES = false;
let confirmResolve = null;

// -----------------------------------------------
// Auth
// -----------------------------------------------
function doAuth() {
  const token = document.getElementById('tokenInput').value.trim();
  const repo = document.getElementById('repoInput').value.trim();
  const branch = document.getElementById('branchInput').value.trim();
  if (!token || !repo) {
    showAuthError('Cal introduir el token i el repositori.');
    return;
  }
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    showAuthError('Format del repositori: propietari/nom (ex: madeinhumanapp/madeinhumanweb)');
    return;
  }
  GH = { token, repo, branch, owner, repoName };
  const remember = document.getElementById('rememberToken')?.checked;
  const store = remember ? localStorage : sessionStorage;
  store.setItem('gh_token', token);
  store.setItem('gh_repo', repo);
  store.setItem('gh_branch', branch);
  if (remember) localStorage.setItem('gh_remember', '1');
  loadContent();
}

function doLogout() {
  sessionStorage.clear();
  localStorage.removeItem('gh_token');
  localStorage.removeItem('gh_repo');
  localStorage.removeItem('gh_branch');
  localStorage.removeItem('gh_remember');
  GH = { token: '', repo: '', branch: 'main', owner: '', repoName: '' };
  document.getElementById('app').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.style.display = 'block';
}

// Auto-login (check localStorage first, then sessionStorage)
(function () {
  const store = localStorage.getItem('gh_remember') ? localStorage : sessionStorage;
  const t = store.getItem('gh_token');
  const r = store.getItem('gh_repo');
  const b = store.getItem('gh_branch');
  if (t && r) {
    document.getElementById('tokenInput').value = t;
    document.getElementById('repoInput').value = r;
    if (b) document.getElementById('branchInput').value = b;
    if (localStorage.getItem('gh_remember')) {
      document.getElementById('rememberToken').checked = true;
    }
    doAuth();
  }
})();

// -----------------------------------------------
// GitHub API
// -----------------------------------------------
async function ghFetch(path, opts = {}) {
  const url = `https://api.github.com/repos/${GH.owner}/${GH.repoName}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GH.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

async function ghGetFile(path) {
  const data = await ghFetch(`/contents/${path}?ref=${GH.branch}`);
  const content = decodeBase64(data.content);
  return { content, sha: data.sha };
}

async function ghPutFile(path, content, sha, message) {
  try {
    return await ghFetch(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encodeBase64(content),
        sha,
        branch: GH.branch,
      }),
    });
  } catch (err) {
    if (err.message && err.message.includes('does not match')) {
      throw new Error(`Conflicte: algú ha modificat "${path}" des que el vas carregar. Prem "Recarregar" al Dashboard i torna a fer els canvis.`);
    }
    throw err;
  }
}

async function ghListDir(path) {
  try {
    return await ghFetch(`/contents/${path}?ref=${GH.branch}`);
  } catch {
    return [];
  }
}

function decodeBase64(str) {
  const bin = atob(str.replace(/\n/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// -----------------------------------------------
// Load Content
// -----------------------------------------------
async function loadContent() {
  try {
    document.getElementById('authError').style.display = 'none';
    showAuthError('');
    const el = document.querySelector('.auth-card .btn');
    el.innerHTML = '<span class="spinner"></span> Connectant...';
    el.disabled = true;

    const [indexData, scriptData, cssData] = await Promise.all([
      ghGetFile('index.html'),
      ghGetFile('script.js'),
      ghGetFile('styles.css').catch(() => ({ content: '' })),
    ]);

    FILES.indexHtml = indexData.content;
    FILES.indexSha = indexData.sha;
    FILES.scriptJs = scriptData.content;
    FILES.scriptSha = scriptData.sha;
    FILES.cssCache = cssData.content;

    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').style.display = 'grid';

    parseAllContent();
    renderDashboard();
    loadImages();

    toast('success', 'Connectat correctament al repositori.');
  } catch (err) {
    showAuthError(`Error de connexió: ${err.message}`);
    const el = document.querySelector('.auth-card .btn');
    el.innerHTML = 'Connectar <span class="arrow" aria-hidden="true">&rarr;</span>';
    el.disabled = false;
  }
}

// -----------------------------------------------
// HTML Parser Helpers
// -----------------------------------------------
function extractBetween(html, startMarker, endMarker) {
  const si = html.indexOf(startMarker);
  if (si === -1) return '';
  const start = si + startMarker.length;
  const end = endMarker ? html.indexOf(endMarker, start) : html.length;
  return end === -1 ? html.slice(start) : html.slice(start, end);
}

function extractTagContent(html, tagRegex) {
  const m = html.match(tagRegex);
  return m ? m[1].trim() : '';
}

function extractInnerHtml(html, startComment, nextComment) {
  const block = extractBetween(html, startComment, nextComment);
  return block;
}

function getTextBetweenTags(html, openTag, closeTag) {
  const si = html.indexOf(openTag);
  if (si === -1) return '';
  const start = si + openTag.length;
  const end = html.indexOf(closeTag, start);
  if (end === -1) return '';
  return html.slice(start, end).trim();
}

function extractAllLi(html) {
  const items = [];
  const re = /<li>(.*?)<\/li>/gs;
  let m;
  while ((m = re.exec(html))) items.push(m[1].trim());
  return items;
}

// -----------------------------------------------
// Parse All Content from HTML/JS
// -----------------------------------------------
function parseAllContent() {
  const h = FILES.indexHtml;
  const s = FILES.scriptJs;

  // Hero
  setVal('hero-eyebrow', extractContent(h, '<!-- ✏️ EDITABLE: subtítol del hero -->', '<span class="eyebrow">', '</span>'));
  setVal('hero-title', extractContent(h, '<!-- ✏️ EDITABLE: titular principal', '<h1 class="hero-title">', '</h1>'));
  setVal('hero-desc', extractContent(h, '<!-- ✏️ EDITABLE: descripció del hero -->', '<p class="hero-sub">', '</p>'));

  const metaBlock = extractBetween(h, '<!-- ✏️ EDITABLE: etiquetes del hero', '</div>');
  const metaSpans = [...metaBlock.matchAll(/<span>(.*?)<\/span>/gs)].map(m => m[1].trim());
  setVal('hero-tag1', stripHtml(metaSpans[0] || ''));
  setVal('hero-tag2', stripHtml(metaSpans[1] || ''));
  setVal('hero-tag3', stripHtml(metaSpans[2] || ''));

  // Context
  setVal('ctx-title', extractContent(h, '<!-- ✏️ EDITABLE: titular de context -->', '<h2 class="section-title"', '</h2>'));
  const ctxParagraphs = extractBetween(h, '<!-- ✏️ EDITABLE: paràgrafs de context', '<!-- ✏️ EDITABLE: 3 mètriques');
  const ctxPs = [...ctxParagraphs.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => m[1].trim());
  setVal('ctx-p1', stripHtml(ctxPs[0] || ''));
  setVal('ctx-p2', stripHtml(ctxPs[1] || ''));

  // Metrics
  const metricsBlock = extractBetween(h, '<!-- ✏️ EDITABLE: 3 mètriques', '</section>');
  const metrics = [...metricsBlock.matchAll(/<div class="metric">\s*<div class="metric-key">([\s\S]*?)<\/div>\s*<div class="metric-body">\s*<div class="metric-label">([\s\S]*?)<\/div>\s*<p>([\s\S]*?)<\/p>\s*<\/div>\s*<\/div>/g)];
  for (let i = 0; i < 3; i++) {
    if (!metrics[i]) continue;
    setVal(`metric${i+1}-key`, metrics[i][1].trim());
    setVal(`metric${i+1}-label`, metrics[i][2].trim());
    setVal(`metric${i+1}-text`, stripHtml(metrics[i][3].trim()));
  }

  // Services
  setVal('svc-title', extractContent(h, '<!-- ✏️ EDITABLE: titular de serveis -->', '<h2 class="section-title">', '</h2>'));
  const svcLead = h.match(/<p class="section-lead">\s*([\s\S]*?)\s*<\/p>\s*<\/div>\s*<\/div>\s*<div class="pillar-grid">/);
  setVal('svc-lead', stripHtml(svcLead ? svcLead[1].trim() : ''));

  // Pillar 1
  const p1Block = extractBetween(h, '<!-- ✏️ EDITABLE: Pilar 1', '<!-- ✏️ EDITABLE: Pilar 2');
  const p1Title = p1Block.match(/<h3>([\s\S]*?)<\/h3>/);
  setVal('p1-title', p1Title ? p1Title[1].trim() : '');
  const p1Desc = p1Block.match(/<p class="pillar-lede">\s*([\s\S]*?)\s*<\/p>/);
  setVal('p1-desc', stripHtml(p1Desc ? p1Desc[1].trim() : ''));
  const p1SvcBlock = extractBetween(p1Block, '<!-- ✏️ EDITABLE: llista de serveis RGPD', '</ul>');
  setVal('p1-services', extractAllLi(p1SvcBlock).join('\n'));
  const p1Foot = p1Block.match(/<div class="pillar-foot">\s*([\s\S]*?)\s*<\/div>/);
  setVal('p1-foot', stripHtml(p1Foot ? p1Foot[1].trim() : ''));

  // Pillar 2
  const p2Block = extractBetween(h, '<!-- ✏️ EDITABLE: Pilar 2', '<!-- ✏️ EDITABLE: servei transversal');
  const p2Title = p2Block.match(/<h3>([\s\S]*?)<\/h3>/);
  setVal('p2-title', p2Title ? p2Title[1].trim() : '');
  const p2Desc = p2Block.match(/<p class="pillar-lede">\s*([\s\S]*?)\s*<\/p>/);
  setVal('p2-desc', stripHtml(p2Desc ? p2Desc[1].trim() : ''));
  const p2SvcBlock = extractBetween(p2Block, '<!-- ✏️ EDITABLE: llista de serveis IA', '</ul>');
  setVal('p2-services', extractAllLi(p2SvcBlock).join('\n'));
  const p2Foot = p2Block.match(/<div class="pillar-foot">\s*([\s\S]*?)\s*<\/div>/);
  setVal('p2-foot', stripHtml(p2Foot ? p2Foot[1].trim() : ''));

  // Crossover
  const crossBlock = extractBetween(h, '<!-- ✏️ EDITABLE: servei transversal', '</section>');
  setVal('cross-label', extractContent(crossBlock, '', '<div class="crossover-label">', '</div>'));
  setVal('cross-title', extractContent(crossBlock, '', '<div class="crossover-title">', '</div>'));
  const crossBody = crossBlock.match(/<p class="crossover-body">\s*([\s\S]*?)\s*<\/p>/);
  setVal('cross-desc', stripHtml(crossBody ? crossBody[1].trim() : ''));

  // Method
  setVal('method-title', extractContent(h, '<!-- ✏️ EDITABLE: titular de mètode -->', '<h2 class="section-title">', '</h2>'));
  const methodLead = h.match(/Com <em>treballem\.<\/em>[\s\S]*?<p class="section-lead">\s*([\s\S]*?)\s*<\/p>/);
  setVal('method-lead', stripHtml(methodLead ? methodLead[1].trim() : ''));

  const stepsBlock = extractBetween(h, '<!-- ✏️ EDITABLE: 4 passos', '</div>\n      </div>\n    </div>\n  </section>');
  STEP_DATA = [];
  const stepMatches = [...stepsBlock.matchAll(/<div class="step">\s*<div class="step-num">(\d+)<\/div>\s*<div class="step-title">([\s\S]*?)<\/div>\s*<div class="step-body">([\s\S]*?)<\/div>\s*<\/div>/g)];
  stepMatches.forEach(m => {
    STEP_DATA.push({ num: m[1], title: m[2].trim(), body: m[3].trim() });
  });
  renderMethodSteps();

  // News
  const newsSection = extractBetween(h, '<!-- ✏️ SECCIÓ: ACTUALITAT', '<!-- ✏️ SECCIÓ: FOOTER');
  setVal('news-title', extractContent(newsSection, '<!-- ✏️ EDITABLE: titular d\'actualitat -->', '<h2 class="section-title">', '</h2>'));
  const newsLead = newsSection.match(/<p class="section-lead">\s*([\s\S]*?)\s*<\/p>/);
  setVal('news-lead', stripHtml(newsLead ? newsLead[1].trim() : ''));

  NEWS_DATA = [];
  const newsCards = [...h.matchAll(/<article class="news-card([^"]*)">\s*([\s\S]*?)\s*<\/article>/g)];
  newsCards.forEach(m => {
    const card = m[2];
    const tagMatch = card.match(/<span class="news-tag ([^"]+)">([^<]+)<\/span>/);
    const dateMatch = card.match(/<span class="news-date">([^<]+)<\/span>/);
    const titleMatch = card.match(/<h3 class="news-title">([^<]+)<\/h3>/);
    const bodyMatch = card.match(/<p class="news-body">\s*([\s\S]*?)\s*<\/p>/);
    const sourceMatch = card.match(/<div class="news-source">([^<]*(?:<[^>]*>[^<]*)*)<\/div>/);
    NEWS_DATA.push({
      tagClass: tagMatch ? tagMatch[1] : 'news-tag-rgpd',
      tagText: tagMatch ? tagMatch[2] : 'RGPD',
      date: dateMatch ? dateMatch[1] : '',
      title: titleMatch ? titleMatch[1] : '',
      body: bodyMatch ? bodyMatch[1].trim() : '',
      source: sourceMatch ? stripHtml(sourceMatch[1].trim()) : '',
      cardClass: m[1].trim(),
    });
  });
  renderNewsCards();

  // FAQ from script.js
  parseFAQFromScript(s);
  renderFAQCards();

  // Contact section texts
  setVal('contact-title', extractContent(h, '<!-- ✏️ EDITABLE: titular de contacte -->', '<h2 class="section-title">', '</h2>'));
  setVal('contact-desc', extractContent(h, '<!-- ✏️ EDITABLE: descripció de contacte -->', '<p class="section-lead">', '</p>'));
  setVal('adeq-title', extractContent(h, '<!-- ✏️ EDITABLE: titular del formulari d\'adequació -->', '<h2 class="section-title">', '</h2>'));
  setVal('adeq-desc', extractContent(h, '<!-- ✏️ EDITABLE: descripció del formulari -->', '<p class="section-lead">', '</p>'));

  // Footer
  setVal('footer-desc', extractContent(h, '<!-- ✏️ EDITABLE: descripció del footer -->', '<p class="footer-desc">', '</p>'));
  const emailMatch = h.match(/<!-- ✏️ EDITABLE: correu de contacte -->\s*<li><a href="mailto:([^"]+)">/);
  setVal('footer-email', emailMatch ? emailMatch[1] : '');
  const copyMatch = h.match(/<!-- ✏️ EDITABLE: copyright i ubicació -->\s*<span>([^<]+)<\/span>/);
  setVal('footer-copy', copyMatch ? copyMatch[1].trim() : '');
  const statusMatch = h.match(/<span class="made"><span class="dot-live"><\/span>\s*(.*?)<\/span>/);
  setVal('footer-status', statusMatch ? statusMatch[1].trim() : '');
}

function extractContent(html, commentStart, openTag, closeTag) {
  let searchFrom = 0;
  if (commentStart) {
    const ci = html.indexOf(commentStart);
    if (ci === -1) return '';
    searchFrom = ci;
  }
  const oi = html.indexOf(openTag, searchFrom);
  if (oi === -1) return '';
  let contentStart = oi + openTag.length;
  if (openTag.endsWith('"') || openTag.endsWith("'")) {
    const gt = html.indexOf('>', contentStart);
    if (gt !== -1) contentStart = gt + 1;
  }
  const ci2 = html.indexOf(closeTag, contentStart);
  if (ci2 === -1) return '';
  return html.slice(contentStart, ci2).trim();
}

function stripHtml(s) {
  return s.replace(/<strong>/g, '').replace(/<\/strong>/g, '').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

// -----------------------------------------------
// Parse FAQ from script.js
// -----------------------------------------------
function parseFAQFromScript(js) {
  FAQ_DATA = [];
  const faqMatch = js.match(/const FAQ_DATA = \[([\s\S]*?)\];/);
  if (!faqMatch) return;
  const itemsStr = faqMatch[1];
  const itemRegex = /\{\s*cat:\s*"([^"]+)",\s*q:\s*"((?:[^"\\]|\\.)*)"\s*,\s*a:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
  let m;
  while ((m = itemRegex.exec(itemsStr))) {
    FAQ_DATA.push({
      cat: m[1],
      q: m[2].replace(/\\"/g, '"').replace(/\\'/g, "'"),
      a: m[3].replace(/\\"/g, '"').replace(/\\'/g, "'"),
    });
  }
}

// -----------------------------------------------
// Render Functions
// -----------------------------------------------
function renderDashboard() {
  const cards = [
    { id: 'hero', icon: 'layers', title: 'Hero', meta: 'Titular, subtítol, descripció' },
    { id: 'context', icon: 'bar-chart', title: 'Context', meta: '3 mètriques, xifres clau' },
    { id: 'services', icon: 'settings', title: 'Serveis', meta: '2 pilars + transversal' },
    { id: 'method', icon: 'list', title: 'Mètode', meta: `${STEP_DATA.length} fases` },
    { id: 'news', icon: 'newspaper', title: 'Actualitat', meta: `${NEWS_DATA.length} notícies` },
    { id: 'faq', icon: 'help-circle', title: 'FAQ', meta: `${FAQ_DATA.length} preguntes` },
    { id: 'contact', icon: 'mail', title: 'Contacte', meta: 'Textos de la secció contacte' },
    { id: 'footer', icon: 'footer', title: 'Footer', meta: 'Copyright, contacte, links' },
    { id: 'images', icon: 'image', title: 'Imatges', meta: 'Puja i gestiona imatges' },
    { id: 'history', icon: 'clock', title: 'Historial', meta: 'Últims commits' },
  ];

  const grid = document.getElementById('dashboardGrid');
  grid.innerHTML = cards.map(c => `
    <div class="dash-card" onclick="navigateTo('${c.id}')">
      <div class="dash-card-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      </div>
      <div class="dash-card-title">${c.title}</div>
      <div class="dash-card-meta">${c.meta}</div>
    </div>
  `).join('');

  document.getElementById('dashboardStatus').innerHTML = `
    <span class="dot-live" style="width:8px;height:8px;border-radius:50%;background:#6cc88a;display:inline-block;flex-shrink:0"></span>
    Repositori: <strong>${GH.repo}</strong> · Branca: <strong>${GH.branch}</strong> · Últim accés: ${new Date().toLocaleTimeString('ca')}
  `;
}

function renderMethodSteps() {
  const container = document.getElementById('method-steps-container');
  if (!container) return;
  container.innerHTML = STEP_DATA.map((s, i) => `
    <div class="step-editor-card" data-idx="${i}">
      <span class="step-editor-num">PAS ${s.num}</span>
      <div class="field">
        <label class="editor-label">Títol</label>
        <input class="input" id="step-${i}-title" value="${escHtml(s.title)}" />
      </div>
      <div class="field">
        <label class="editor-label">Descripció</label>
        <textarea class="textarea" id="step-${i}-body" rows="3">${escHtml(s.body)}</textarea>
      </div>
    </div>
  `).join('');
}

function renderNewsCards() {
  const container = document.getElementById('news-cards-container');
  if (!container) return;
  container.innerHTML = NEWS_DATA.map((n, i) => `
    <div class="news-editor-card" data-idx="${i}" draggable="true" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropNews(event)" ondragend="dragEnd(event)">
      <button class="news-card-remove" onclick="removeNews(${i})" title="Eliminar notícia">&times;</button>
      <div class="editor-row-3">
        <div class="field">
          <label class="editor-label">Tag</label>
          <select class="news-tag-select" id="news-${i}-tag">
            <option value="news-tag-rgpd" ${n.tagClass === 'news-tag-rgpd' ? 'selected' : ''}>RGPD</option>
            <option value="news-tag-ia" ${n.tagClass === 'news-tag-ia' ? 'selected' : ''}>AI Act</option>
            <option value="news-tag-cat" ${n.tagClass === 'news-tag-cat' ? 'selected' : ''}>APDCat</option>
          </select>
        </div>
        <div class="field">
          <label class="editor-label">Text del tag</label>
          <input class="input" id="news-${i}-tagtext" value="${escHtml(n.tagText)}" />
        </div>
        <div class="field">
          <label class="editor-label">Data</label>
          <input class="input" id="news-${i}-date" value="${escHtml(n.date)}" />
        </div>
      </div>
      <div class="field mt-16">
        <label class="editor-label">Titular</label>
        <input class="input" id="news-${i}-title" value="${escHtml(n.title)}" />
      </div>
      <div class="field mt-16">
        <label class="editor-label">Cos</label>
        <textarea class="textarea" id="news-${i}-body" rows="4">${escHtml(n.body)}</textarea>
      </div>
      <div class="field mt-16">
        <label class="editor-label">Font</label>
        <input class="input" id="news-${i}-source" value="${escHtml(n.source)}" />
      </div>
    </div>
  `).join('');
}

function renderFAQCards() {
  const container = document.getElementById('faq-cards-container');
  if (!container) return;
  container.innerHTML = FAQ_DATA.map((f, i) => `
    <div class="faq-editor-card" data-idx="${i}" draggable="true" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropFAQ(event)" ondragend="dragEnd(event)">
      <button class="faq-card-remove" onclick="removeFAQ(${i})" title="Eliminar FAQ">&times;</button>
      <div class="faq-editor-head">
        <span class="faq-cat-badge" data-cat="${f.cat}">${f.cat.toUpperCase()}</span>
      </div>
      <div class="field">
        <label class="editor-label">Categoria</label>
        <select class="news-tag-select" id="faq-${i}-cat">
          <option value="rgpd" ${f.cat === 'rgpd' ? 'selected' : ''}>RGPD</option>
          <option value="ia" ${f.cat === 'ia' ? 'selected' : ''}>IA</option>
          <option value="practic" ${f.cat === 'practic' ? 'selected' : ''}>Pràctic</option>
          <option value="glossari" ${f.cat === 'glossari' ? 'selected' : ''}>Glossari</option>
        </select>
      </div>
      <div class="field mt-16">
        <label class="editor-label">Pregunta</label>
        <input class="input" id="faq-${i}-q" value="${escHtml(f.q)}" />
      </div>
      <div class="field mt-16">
        <label class="editor-label">Resposta</label>
        <textarea class="textarea" id="faq-${i}-a" rows="4">${escHtml(f.a)}</textarea>
      </div>
    </div>
  `).join('');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// -----------------------------------------------
// Add / Remove items
// -----------------------------------------------
function addNews() {
  NEWS_DATA.push({
    tagClass: 'news-tag-rgpd',
    tagText: 'RGPD',
    date: new Date().toLocaleDateString('ca', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()),
    title: 'Nova notícia',
    body: 'Cos de la notícia...',
    source: 'Font: ',
    cardClass: '',
  });
  renderNewsCards();
  navigateTo('news');
  toast('info', 'Nova notícia afegida. Recorda desar els canvis.');
}

function removeNews(idx) {
  NEWS_DATA.splice(idx, 1);
  renderNewsCards();
  toast('info', 'Notícia eliminada. Recorda desar els canvis.');
}

function addFAQ() {
  FAQ_DATA.push({
    cat: 'rgpd',
    q: 'Nova pregunta',
    a: 'Resposta...',
  });
  renderFAQCards();
  navigateTo('faq');
  toast('info', 'Nova FAQ afegida. Recorda desar els canvis.');
}

function removeFAQ(idx) {
  FAQ_DATA.splice(idx, 1);
  renderFAQCards();
  toast('info', 'FAQ eliminada. Recorda desar els canvis.');
}

// -----------------------------------------------
// Save Section — rebuild HTML and commit
// -----------------------------------------------
const SECTION_NAMES = {
  hero: 'Hero',
  context: 'Context',
  services: 'Serveis',
  method: 'Mètode',
  news: 'Actualitat',
  faq: 'FAQ',
  contact: 'Contacte',
  footer: 'Footer',
};

async function saveSection(section) {
  const name = SECTION_NAMES[section] || section;
  const confirmed = await showConfirm(
    `Publicar canvis a "${name}"?`,
    `Això farà un commit al repositori de GitHub amb els canvis de la secció "${name}". Cloudflare Pages desplegarà la web automàticament en 1-2 minuts.`
  );
  if (!confirmed) return;

  try {
    if (section === 'faq') {
      await saveFAQ();
    } else {
      await saveHTML(section);
    }
    clearChanged();
    const name = SECTION_NAMES[section] || section;
    toast('success', `Secció "${name}" publicada correctament. Cloudflare desplegarà en 1-2 min.`);
    if (previewOpen) refreshPreview();
  } catch (err) {
    toast('error', `Error publicant: ${err.message}`);
  }
}

async function saveHTML(section) {
  collectHTMLChanges(section);

  const result = await ghPutFile(
    'index.html',
    FILES.indexHtml,
    FILES.indexSha,
    `Actualitzar secció: ${section}`
  );
  FILES.indexSha = result.content.sha;
}

async function saveFAQ() {
  collectFAQChanges();

  const result = await ghPutFile(
    'script.js',
    FILES.scriptJs,
    FILES.scriptSha,
    'Actualitzar FAQ'
  );
  FILES.scriptSha = result.content.sha;
}

// -----------------------------------------------
// Collect HTML Changes — patch index.html string
// -----------------------------------------------
function collectHTMLChanges(section) {
  let h = FILES.indexHtml;

  if (section === 'hero') {
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: subtítol del hero -->', 'span', getVal('hero-eyebrow'));
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: titular principal', 'h1', getVal('hero-title'));
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: descripció del hero -->', 'p', getVal('hero-desc'));
    const tags = [getVal('hero-tag1'), getVal('hero-tag2'), getVal('hero-tag3')];
    h = replaceMetaTags(h, tags);
  }

  if (section === 'context') {
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: titular de context -->', 'h2', getVal('ctx-title'));
    h = replaceContextParagraphs(h, getVal('ctx-p1'), getVal('ctx-p2'));
    for (let i = 1; i <= 3; i++) {
      h = replaceMetric(h, i, getVal(`metric${i}-key`), getVal(`metric${i}-label`), getVal(`metric${i}-text`));
    }
  }

  if (section === 'services') {
    h = replaceSvcTitle(h, getVal('svc-title'));
    h = replaceSvcLead(h, getVal('svc-lead'));
    h = replacePillarContent(h, 1, getVal('p1-title'), getVal('p1-desc'), getVal('p1-services'), getVal('p1-foot'));
    h = replacePillarContent(h, 2, getVal('p2-title'), getVal('p2-desc'), getVal('p2-services'), getVal('p2-foot'));
    h = replaceCrossover(h, getVal('cross-label'), getVal('cross-title'), getVal('cross-desc'));
  }

  if (section === 'method') {
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: titular de mètode -->', 'h2', getVal('method-title'));
    h = replaceMethodLead(h, getVal('method-lead'));
    for (let i = 0; i < STEP_DATA.length; i++) {
      STEP_DATA[i].title = getVal(`step-${i}-title`);
      STEP_DATA[i].body = getVal(`step-${i}-body`);
    }
    h = rebuildSteps(h);
  }

  if (section === 'news') {
    h = replaceNewsTitle(h, getVal('news-title'));
    h = replaceNewsLead(h, getVal('news-lead'));
    collectNewsData();
    h = rebuildNewsCards(h);
  }

  if (section === 'contact') {
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: titular de contacte -->', 'h2', getVal('contact-title'));
    h = replaceLeadAfterComment(h, '<!-- ✏️ EDITABLE: descripció de contacte -->', getVal('contact-desc'));
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: titular del formulari d\'adequació -->', 'h2', getVal('adeq-title'));
    h = replaceLeadAfterComment(h, '<!-- ✏️ EDITABLE: descripció del formulari -->', getVal('adeq-desc'));
  }

  if (section === 'footer') {
    h = replaceTagAfterComment(h, '<!-- ✏️ EDITABLE: descripció del footer -->', 'p', getVal('footer-desc'));
    h = replaceFooterEmail(h, getVal('footer-email'));
    h = replaceFooterCopy(h, getVal('footer-copy'));
    h = replaceFooterStatus(h, getVal('footer-status'));
  }

  FILES.indexHtml = h;
}

// -----------------------------------------------
// HTML replacement helpers
// -----------------------------------------------
function replaceTagAfterComment(html, comment, tag, newContent) {
  const ci = html.indexOf(comment);
  if (ci === -1) return html;
  const afterComment = html.indexOf('\n', ci) + 1;
  const tagOpen = tag === 'h2' ? `<${tag} class="section-title"` : `<${tag} class=`;
  const simpleOpen = `<${tag}`;

  let tagStart = html.indexOf(tagOpen, afterComment);
  if (tagStart === -1) tagStart = html.indexOf(simpleOpen, afterComment);
  if (tagStart === -1) return html;

  const contentStart = html.indexOf('>', tagStart) + 1;
  const tagClose = `</${tag}>`;
  const contentEnd = html.indexOf(tagClose, contentStart);
  if (contentEnd === -1) return html;

  return html.slice(0, contentStart) + '\n        ' + newContent + '\n      ' + html.slice(contentEnd);
}

function replaceMetaTags(html, tags) {
  const start = html.indexOf('<!-- ✏️ EDITABLE: etiquetes del hero');
  if (start === -1) return html;
  const divEnd = html.indexOf('</div>', start);
  if (divEnd === -1) return html;

  const spanStart = html.indexOf('<span>', start);
  const newSpans = tags.map(t => `      <span>${t}</span>`).join('\n');
  const lastSpanEnd = html.lastIndexOf('</span>', divEnd) + '</span>'.length;

  return html.slice(0, spanStart) + newSpans + '\n    ' + html.slice(lastSpanEnd);
}

function replaceContextParagraphs(html, p1, p2) {
  const marker = '<!-- ✏️ EDITABLE: paràgrafs de context';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const afterMarker = html.indexOf('\n', ci) + 1;
  const endMarker = html.indexOf('<!-- ✏️ EDITABLE: 3 mètriques', afterMarker);
  if (endMarker === -1) return html;

  const firstP = html.indexOf('<p>', afterMarker);
  if (firstP === -1 || firstP > endMarker) return html;

  const newParagraphs = `        <p>\n          ${p1}\n        </p>\n        <p>\n          ${p2}\n        </p>\n      `;
  return html.slice(0, firstP) + newParagraphs + html.slice(endMarker);
}

function replaceMetric(html, idx, key, label, text) {
  const re = /<div class="metric">\s*<div class="metric-key">[\s\S]*?<\/div>\s*<div class="metric-body">\s*<div class="metric-label">[\s\S]*?<\/div>\s*<p>[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/g;
  let count = 0;
  return html.replace(re, (match) => {
    count++;
    if (count === idx) {
      return `<div class="metric">
          <div class="metric-key">${key}</div>
          <div class="metric-body">
            <div class="metric-label">${label}</div>
            <p>${text}</p>
          </div>
        </div>`;
    }
    return match;
  });
}

function replaceSvcTitle(html, title) {
  return replaceTagAfterComment(html, '<!-- ✏️ EDITABLE: titular de serveis -->', 'h2', title);
}

function replaceSvcLead(html, lead) {
  const marker = '<!-- ✏️ EDITABLE: titular de serveis';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const pStart = html.indexOf('<p class="section-lead">', ci);
  if (pStart === -1) return html;
  const contentStart = pStart + '<p class="section-lead">'.length;
  const pEnd = html.indexOf('</p>', contentStart);
  if (pEnd === -1) return html;
  return html.slice(0, contentStart) + '\n            ' + lead + '\n          ' + html.slice(pEnd);
}

function replacePillarContent(html, num, title, desc, services, foot) {
  const marker = num === 1 ? '<!-- ✏️ EDITABLE: Pilar 1' : '<!-- ✏️ EDITABLE: Pilar 2';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;

  // Replace h3
  const h3Start = html.indexOf('<h3>', ci);
  if (h3Start !== -1) {
    const h3End = html.indexOf('</h3>', h3Start) + 5;
    html = html.slice(0, h3Start) + `<h3>${title}</h3>` + html.slice(h3End);
  }

  // Replace pillar-lede
  const ledeStart = html.indexOf('<p class="pillar-lede">', ci);
  if (ledeStart !== -1) {
    const ledeContentStart = ledeStart + '<p class="pillar-lede">'.length;
    const ledeEnd = html.indexOf('</p>', ledeContentStart);
    html = html.slice(0, ledeContentStart) + '\n              ' + desc + '\n            ' + html.slice(ledeEnd);
  }

  // Replace service list
  const svcMarker = num === 1 ? '<!-- ✏️ EDITABLE: llista de serveis RGPD' : '<!-- ✏️ EDITABLE: llista de serveis IA';
  const svcComment = html.indexOf(svcMarker, ci);
  if (svcComment !== -1) {
    const ulStart = html.indexOf('<ul class="svc-list">', svcComment);
    const ulEnd = html.indexOf('</ul>', ulStart) + 5;
    const items = services.split('\n').filter(s => s.trim()).map(s => `              <li>${s.trim()}</li>`).join('\n');
    html = html.slice(0, ulStart) + `<ul class="svc-list">\n${items}\n            </ul>` + html.slice(ulEnd);
  }

  // Replace foot
  const footStart = html.indexOf('<div class="pillar-foot">', ci);
  if (footStart !== -1) {
    const footContentStart = footStart + '<div class="pillar-foot">'.length;
    const footEnd = html.indexOf('</div>', footContentStart);
    html = html.slice(0, footContentStart) + '\n              ' + foot + '\n            ' + html.slice(footEnd);
  }

  return html;
}

function replaceCrossover(html, label, title, desc) {
  const marker = '<!-- ✏️ EDITABLE: servei transversal';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;

  let h = html;
  const labelStart = h.indexOf('<div class="crossover-label">', ci);
  if (labelStart !== -1) {
    const ls = labelStart + '<div class="crossover-label">'.length;
    const le = h.indexOf('</div>', ls);
    h = h.slice(0, ls) + label + h.slice(le);
  }

  const titleStart = h.indexOf('<div class="crossover-title">', ci);
  if (titleStart !== -1) {
    const ts = titleStart + '<div class="crossover-title">'.length;
    const te = h.indexOf('</div>', ts);
    h = h.slice(0, ts) + title + h.slice(te);
  }

  const bodyStart = h.indexOf('<p class="crossover-body">', ci);
  if (bodyStart !== -1) {
    const bs = bodyStart + '<p class="crossover-body">'.length;
    const be = h.indexOf('</p>', bs);
    h = h.slice(0, bs) + '\n          ' + desc + '\n        ' + h.slice(be);
  }

  return h;
}

function replaceMethodLead(html, lead) {
  const marker = 'Com <em>treballem.</em>';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const pStart = html.indexOf('<p class="section-lead">', ci);
  if (pStart === -1) return html;
  const cs = pStart + '<p class="section-lead">'.length;
  const ce = html.indexOf('</p>', cs);
  return html.slice(0, cs) + '\n          ' + lead + '\n        ' + html.slice(ce);
}

function rebuildSteps(html) {
  const marker = '<!-- ✏️ EDITABLE: 4 passos';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const stepsDiv = html.indexOf('<div class="steps">', ci);
  if (stepsDiv === -1) return html;
  const stepsClose = html.indexOf('</div>\n      </div>\n    </div>\n  </section>', stepsDiv);
  if (stepsClose === -1) return html;

  const newSteps = STEP_DATA.map(s => `        <div class="step">
          <div class="step-num">${s.num}</div>
          <div class="step-title">${s.title}</div>
          <div class="step-body">${s.body}</div>
        </div>`).join('\n');

  return html.slice(0, stepsDiv) + `<div class="steps">\n${newSteps}\n      </div>\n      ` + html.slice(stepsClose);
}

function replaceNewsTitle(html, title) {
  return replaceTagAfterComment(html, '<!-- ✏️ EDITABLE: titular d\'actualitat -->', 'h2', title);
}

function replaceNewsLead(html, lead) {
  const marker = '<!-- ✏️ EDITABLE: titular d\'actualitat';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const pStart = html.indexOf('<p class="section-lead">', ci);
  if (pStart === -1) return html;
  const cs = pStart + '<p class="section-lead">'.length;
  const ce = html.indexOf('</p>', cs);
  return html.slice(0, cs) + '\n          ' + lead + '\n        ' + html.slice(ce);
}

function collectNewsData() {
  for (let i = 0; i < NEWS_DATA.length; i++) {
    const tag = document.getElementById(`news-${i}-tag`);
    const tagtext = document.getElementById(`news-${i}-tagtext`);
    const date = document.getElementById(`news-${i}-date`);
    const title = document.getElementById(`news-${i}-title`);
    const body = document.getElementById(`news-${i}-body`);
    const source = document.getElementById(`news-${i}-source`);
    if (tag) NEWS_DATA[i].tagClass = tag.value;
    if (tagtext) NEWS_DATA[i].tagText = tagtext.value;
    if (date) NEWS_DATA[i].date = date.value;
    if (title) NEWS_DATA[i].title = title.value;
    if (body) NEWS_DATA[i].body = body.value;
    if (source) NEWS_DATA[i].source = source.value;
    NEWS_DATA[i].cardClass = tag && tag.value === 'news-tag-ia' ? ' news-card-ia' : '';
  }
}

function rebuildNewsCards(html) {
  const gridStart = html.indexOf('<div class="news-grid">');
  if (gridStart === -1) return html;
  const contentStart = gridStart + '<div class="news-grid">'.length;
  const gridEnd = html.indexOf('</div>\n    </div>\n  </section>', contentStart);

  const cards = NEWS_DATA.map((n, i) => `
        <!-- ✏️ EDITABLE: notícia ${i + 1} -->
        <article class="news-card${n.cardClass}">
          <div class="news-meta">
            <span class="news-tag ${n.tagClass}">${n.tagText}</span>
            <span class="news-date">${n.date}</span>
          </div>
          <h3 class="news-title">${n.title}</h3>
          <p class="news-body">
            ${n.body}
          </p>
          <div class="news-source">Font: ${n.source}</div>
        </article>`).join('\n');

  return html.slice(0, contentStart) + cards + '\n      ' + html.slice(gridEnd);
}

function collectFAQChanges() {
  for (let i = 0; i < FAQ_DATA.length; i++) {
    const cat = document.getElementById(`faq-${i}-cat`);
    const q = document.getElementById(`faq-${i}-q`);
    const a = document.getElementById(`faq-${i}-a`);
    if (cat) FAQ_DATA[i].cat = cat.value;
    if (q) FAQ_DATA[i].q = q.value;
    if (a) FAQ_DATA[i].a = a.value;
  }

  const faqArrayStr = FAQ_DATA.map(f => {
    const qEsc = f.q.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const aEsc = f.a.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `  { cat: "${f.cat}", q: "${qEsc}", a: "${aEsc}" }`;
  }).join(',\n');

  FILES.scriptJs = FILES.scriptJs.replace(
    /const FAQ_DATA = \[[\s\S]*?\];/,
    `const FAQ_DATA = [\n${faqArrayStr},\n];`
  );
}

function replaceFooterEmail(html, email) {
  const marker = '<!-- ✏️ EDITABLE: correu de contacte -->';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const liStart = html.indexOf('<li>', ci);
  const liEnd = html.indexOf('</li>', liStart) + 5;
  return html.slice(0, liStart) + `<li><a href="mailto:${email}">${email}</a></li>` + html.slice(liEnd);
}

function replaceFooterCopy(html, copy) {
  const marker = '<!-- ✏️ EDITABLE: copyright i ubicació -->';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const spanStart = html.indexOf('<span>', ci);
  const spanEnd = html.indexOf('</span>', spanStart) + 7;
  return html.slice(0, spanStart) + `<span>${copy}</span>` + html.slice(spanEnd);
}

function replaceFooterStatus(html, status) {
  const marker = '<span class="made"><span class="dot-live"></span>';
  const ci = html.indexOf(marker);
  if (ci === -1) return html;
  const contentStart = ci + marker.length;
  const spanEnd = html.indexOf('</span>', contentStart);
  return html.slice(0, contentStart) + ' ' + status + html.slice(spanEnd);
}

// -----------------------------------------------
// Navigation
// -----------------------------------------------
function navigateTo(section) {
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(`panel-${section}`);
  if (panel) panel.style.display = 'block';
  document.querySelectorAll('.sidebar-link[data-section]').forEach(l => {
    l.classList.toggle('active', l.dataset.section === section);
  });
  if (section === 'history') loadHistory();
  if (window.innerWidth <= 900) closeSidebar();
}

document.getElementById('sidebarNav').addEventListener('click', e => {
  const link = e.target.closest('.sidebar-link');
  if (!link || !link.dataset.section) return;
  navigateTo(link.dataset.section);
});

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.classList.remove('visible');
}

// -----------------------------------------------
// Image Manager
// -----------------------------------------------
async function loadImages() {
  const gallery = document.getElementById('imgGallery');
  gallery.innerHTML = '<div class="spinner" style="margin:24px auto"></div>';

  try {
    const files = await ghListDir('img');
    if (!Array.isArray(files) || files.length === 0) {
      gallery.innerHTML = '<p style="color:var(--text-faint);font-size:14px;padding:20px">Cap imatge pujada. Puja la primera imatge!</p>';
      return;
    }
    gallery.innerHTML = files
      .filter(f => f.type === 'file' && /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(f.name))
      .map(f => `
        <div class="img-card">
          <img class="img-card-preview" src="${f.download_url}" alt="${f.name}" loading="lazy" />
          <div class="img-card-info">
            <div class="img-card-name">${f.name}</div>
            <div class="img-card-size">${formatSize(f.size)}</div>
            <div class="img-card-actions">
              <button class="img-action-btn" onclick="copyImgTag('${f.name}')">Copiar &lt;img&gt;</button>
              <button class="img-action-btn" onclick="copyImgUrl('${f.name}')">Copiar ruta</button>
              <button class="img-action-btn danger" onclick="deleteImage('${f.name}', '${f.sha}')">Eliminar</button>
            </div>
          </div>
        </div>
      `).join('');
  } catch {
    gallery.innerHTML = '<p style="color:var(--text-faint);font-size:14px;padding:20px">La carpeta <code>img/</code> encara no existeix. Puja la primera imatge per crear-la.</p>';
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function copyImgTag(name) {
  const tag = `<img src="img/${name}" alt="Descripció de la imatge" style="max-width:100%; border-radius:12px;" />`;
  navigator.clipboard.writeText(tag).then(() => {
    toast('success', `Etiqueta <img> per a "${name}" copiada al porta-retalls.`);
  });
}

function copyImgUrl(name) {
  const url = `img/${name}`;
  navigator.clipboard.writeText(url).then(() => {
    toast('success', `Ruta "${url}" copiada al porta-retalls.`);
  });
}

async function deleteImage(name, sha) {
  const confirmed = await showConfirm(
    `Eliminar "${name}"?`,
    'Aquesta acció és irreversible. La imatge s\'eliminarà del repositori.'
  );
  if (!confirmed) return;

  try {
    await ghFetch(`/contents/img/${name}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: `Eliminar imatge: ${name}`,
        sha: sha,
        branch: GH.branch,
      }),
    });
    toast('success', `Imatge "${name}" eliminada.`);
    loadImages();
  } catch (err) {
    toast('error', `Error eliminant: ${err.message}`);
  }
}

// Upload
const dropZone = document.getElementById('imgDropZone');
const fileInput = document.getElementById('imgFileInput');

if (dropZone) {
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));
}

async function handleFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast('error', `"${file.name}" no és una imatge.`);
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('error', `"${file.name}" supera 10 MB.`);
      continue;
    }
    await uploadImage(file);
  }
  loadImages();
}

async function uploadImage(file) {
  const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  toast('info', `Pujant "${name}"...`);

  const reader = new FileReader();
  const base64 = await new Promise((resolve) => {
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  let sha;
  try {
    const existing = await ghFetch(`/contents/img/${name}?ref=${GH.branch}`);
    sha = existing.sha;
  } catch { /* new file */ }

  const body = {
    message: `Pujar imatge: ${name}`,
    content: base64,
    branch: GH.branch,
  };
  if (sha) body.sha = sha;

  await ghFetch(`/contents/img/${name}`, { method: 'PUT', body: JSON.stringify(body) });
  toast('success', `"${name}" pujada correctament.`);
}

// -----------------------------------------------
// Toast & Confirm
// -----------------------------------------------
function toast(type, msg) {
  const container = document.getElementById('toastContainer');
  const icons = { success: '&#10003;', error: '&#10007;', info: '&#9432;' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

function showConfirm(title, desc) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = desc;
    document.getElementById('confirmModal').style.display = 'flex';
  });
}

function closeConfirm(result) {
  document.getElementById('confirmModal').style.display = 'none';
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}

// Close modal on overlay click
document.getElementById('confirmModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeConfirm(false);
});

// -----------------------------------------------
// Drag and drop reorder (news & FAQ)
// -----------------------------------------------
let dragSrcIdx = null;

function dragStart(e) {
  dragSrcIdx = parseInt(e.currentTarget.dataset.idx);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const card = e.currentTarget;
  card.classList.add('drag-over');
}

function dragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function dropNews(e) {
  e.preventDefault();
  const targetIdx = parseInt(e.currentTarget.dataset.idx);
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
  const [item] = NEWS_DATA.splice(dragSrcIdx, 1);
  NEWS_DATA.splice(targetIdx, 0, item);
  renderNewsCards();
  markChanged();
  toast('info', 'Notícia reordenada. Recorda desar els canvis.');
}

function dropFAQ(e) {
  e.preventDefault();
  const targetIdx = parseInt(e.currentTarget.dataset.idx);
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
  const [item] = FAQ_DATA.splice(dragSrcIdx, 1);
  FAQ_DATA.splice(targetIdx, 0, item);
  renderFAQCards();
  markChanged();
  toast('info', 'FAQ reordenada. Recorda desar els canvis.');
}

// -----------------------------------------------
// Reload content from GitHub
// -----------------------------------------------
async function reloadContent() {
  try {
    showLoading('Recarregant contingut des de GitHub...');
    const [indexData, scriptData] = await Promise.all([
      ghGetFile('index.html'),
      ghGetFile('script.js'),
    ]);
    FILES.indexHtml = indexData.content;
    FILES.indexSha = indexData.sha;
    FILES.scriptJs = scriptData.content;
    FILES.scriptSha = scriptData.sha;

    parseAllContent();
    renderDashboard();
    loadImages();
    hideLoading();
    toast('success', 'Contingut recarregat des de GitHub.');
  } catch (err) {
    hideLoading();
    toast('error', `Error recarregant: ${err.message}`);
  }
}

// -----------------------------------------------
// Generic lead paragraph replace helper
// -----------------------------------------------
function replaceLeadAfterComment(html, comment, text) {
  const ci = html.indexOf(comment);
  if (ci === -1) return html;
  const pStart = html.indexOf('<p class="section-lead">', ci);
  if (pStart === -1) return html;
  const cs = pStart + '<p class="section-lead">'.length;
  const ce = html.indexOf('</p>', cs);
  if (ce === -1) return html;
  return html.slice(0, cs) + '\n          ' + text + '\n        ' + html.slice(ce);
}

// -----------------------------------------------
// History
// -----------------------------------------------
async function loadHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = '<div style="padding:24px;text-align:center"><div class="spinner"></div></div>';

  try {
    const commits = await ghFetch(`/commits?sha=${GH.branch}&per_page=20`);
    if (!commits.length) {
      list.innerHTML = '<div class="empty-state"><p>Cap commit trobat.</p></div>';
      return;
    }
    list.innerHTML = commits.map(c => {
      const date = new Date(c.commit.author.date);
      const ago = timeAgo(date);
      return `<div class="history-item">
        <span class="history-sha">${c.sha.slice(0, 7)}</span>
        <span class="history-msg">${escHtml(c.commit.message.split('\n')[0])}</span>
        <span class="history-meta">
          <span class="history-author">${escHtml(c.commit.author.name)}</span><br />
          ${ago}
        </span>
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>Error carregant historial: ${err.message}</p></div>`;
  }
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'ara mateix';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `fa ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `fa ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `fa ${days} dies`;
  return date.toLocaleDateString('ca');
}

// -----------------------------------------------
// Preview
// -----------------------------------------------
let previewOpen = false;

function togglePreview() {
  previewOpen = !previewOpen;
  const container = document.getElementById('previewContainer');
  container.classList.toggle('open', previewOpen);

  if (previewOpen) {
    refreshPreview();
    if (window.innerWidth > 900) {
      document.querySelector('.main').style.marginRight = '50%';
    }
  } else {
    document.querySelector('.main').style.marginRight = '0';
  }
}

function refreshPreview() {
  const frame = document.getElementById('previewFrame');
  let html = FILES.indexHtml;
  if (FILES.cssCache) {
    html = html.replace(
      '<link rel="stylesheet" href="styles.css" />',
      `<style>${FILES.cssCache}</style>`
    );
  }
  html = html.replace('<script src="script.js"></script>', `<script>${FILES.scriptJs}<\/script>`);
  const blob = new Blob([html], { type: 'text/html' });
  frame.src = URL.createObjectURL(blob);
}

// -----------------------------------------------
// FAQ Filter & Search
// -----------------------------------------------
let faqFilterCat = 'tots';

function setFAQFilter(cat, btn) {
  faqFilterCat = cat;
  document.querySelectorAll('#faqFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  filterFAQCards();
}

function filterFAQCards() {
  const search = (document.getElementById('faqSearch')?.value || '').toLowerCase();
  const cards = document.querySelectorAll('.faq-editor-card');
  cards.forEach((card, i) => {
    if (i >= FAQ_DATA.length) return;
    const faq = FAQ_DATA[i];
    const matchesCat = faqFilterCat === 'tots' || faq.cat === faqFilterCat;
    const matchesSearch = !search || faq.q.toLowerCase().includes(search) || faq.a.toLowerCase().includes(search);
    card.style.display = (matchesCat && matchesSearch) ? '' : 'none';
  });
}

// -----------------------------------------------
// Loading overlay
// -----------------------------------------------
function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Carregant...';
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// -----------------------------------------------
// LocalStorage auto-backup
// -----------------------------------------------
let backupTimer = null;

function scheduleBackup() {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    try {
      const backup = {
        timestamp: Date.now(),
        news: collectCurrentNewsData(),
        faq: collectCurrentFAQData(),
      };
      localStorage.setItem('mih_admin_backup', JSON.stringify(backup));
    } catch { /* localStorage full or unavailable */ }
  }, 5000);
}

function collectCurrentNewsData() {
  const data = [];
  for (let i = 0; i < NEWS_DATA.length; i++) {
    data.push({
      tagClass: document.getElementById(`news-${i}-tag`)?.value || NEWS_DATA[i].tagClass,
      tagText: document.getElementById(`news-${i}-tagtext`)?.value || NEWS_DATA[i].tagText,
      date: document.getElementById(`news-${i}-date`)?.value || NEWS_DATA[i].date,
      title: document.getElementById(`news-${i}-title`)?.value || NEWS_DATA[i].title,
      body: document.getElementById(`news-${i}-body`)?.value || NEWS_DATA[i].body,
      source: document.getElementById(`news-${i}-source`)?.value || NEWS_DATA[i].source,
      cardClass: NEWS_DATA[i].cardClass,
    });
  }
  return data;
}

function collectCurrentFAQData() {
  const data = [];
  for (let i = 0; i < FAQ_DATA.length; i++) {
    data.push({
      cat: document.getElementById(`faq-${i}-cat`)?.value || FAQ_DATA[i].cat,
      q: document.getElementById(`faq-${i}-q`)?.value || FAQ_DATA[i].q,
      a: document.getElementById(`faq-${i}-a`)?.value || FAQ_DATA[i].a,
    });
  }
  return data;
}

// Trigger backup on input
document.addEventListener('input', e => {
  if (e.target.closest('.admin-body')) scheduleBackup();
});

// -----------------------------------------------
// Keyboard shortcuts
// -----------------------------------------------
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    togglePreview();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const activePanel = document.querySelector('.panel[style=""]') || document.querySelector('.panel:not([style*="none"])');
    if (activePanel) {
      const section = activePanel.id.replace('panel-', '');
      if (section !== 'dashboard' && section !== 'images' && section !== 'history') {
        saveSection(section);
      }
    }
  }
});

// -----------------------------------------------
// Publish All — batch save
// -----------------------------------------------
async function publishAll() {
  const confirmed = await showConfirm(
    'Publicar tots els canvis?',
    'Això desarà les modificacions a index.html i script.js en un sol commit. Cloudflare desplegarà automàticament.'
  );
  if (!confirmed) return;

  try {
    showLoading('Publicant canvis...');

    // Collect all HTML sections
    ['hero', 'context', 'services', 'method', 'news', 'contact', 'footer'].forEach(section => {
      collectHTMLChanges(section);
    });

    // Collect FAQ
    collectFAQChanges();

    // Commit index.html
    const indexResult = await ghPutFile(
      'index.html',
      FILES.indexHtml,
      FILES.indexSha,
      'Actualització general del contingut'
    );
    FILES.indexSha = indexResult.content.sha;

    // Commit script.js
    const scriptResult = await ghPutFile(
      'script.js',
      FILES.scriptJs,
      FILES.scriptSha,
      'Actualització general (FAQ)'
    );
    FILES.scriptSha = scriptResult.content.sha;

    hideLoading();
    clearChanged();
    hideLoading();
    toast('success', 'Tots els canvis publicats correctament! Cloudflare desplegarà en 1-2 min.');
    if (previewOpen) refreshPreview();
  } catch (err) {
    hideLoading();
    toast('error', `Error publicant: ${err.message}`);
  }
}

// -----------------------------------------------
// Change tracking
// -----------------------------------------------
function markChanged() {
  HAS_CHANGES = true;
  const bar = document.getElementById('publishBar');
  if (bar) bar.classList.add('visible');
}

function clearChanged() {
  HAS_CHANGES = false;
  const bar = document.getElementById('publishBar');
  if (bar) bar.classList.remove('visible');
}

document.addEventListener('input', e => {
  if (e.target.closest('.admin-body') && (e.target.classList.contains('input') || e.target.classList.contains('textarea') || e.target.tagName === 'SELECT')) {
    markChanged();
  }
});

window.addEventListener('beforeunload', e => {
  if (HAS_CHANGES) {
    e.preventDefault();
    e.returnValue = '';
  }
});
