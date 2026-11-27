// Proves de les notícies (WEB-A01), sense navegador: genera la web amb notícies inventades en una carpeta
// temporal i comprova llistat, pàgines, RSS, mapa del lloc, portada, programació i validacions.
// Ús: npm run actualitat
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderBloc } from '../plantilles/blocs.mjs';
import { llegirNoticia, targeta, dataLlarga } from '../plantilles/actualitat.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'actualitat-'));
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

const cap = c => `---\n${Object.entries(c).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n`;
const base = { resum: '"Resum inventat per a la prova, amb «cometes» i un & per escapar."', etiqueta: 'rgpd', font_nom: '"Organisme de prova"',
  estat: 'publicat', idioma: 'ca' };
const NOTICIES = {
  // Article amb cos (pàgina pròpia), servei relacionat i notes de revisió al final
  '2026-03-10-article-de-prova.md': cap({ titol: '"Article de prova amb «cometes» & escapada"', ...base, data: '2026-03-10',
    font_url: '"https://exemple.org/font"', data_font: '2026-03-01', servei_relacionat: 'auditoria' })
    + '\n## Què ha passat\n\nUn text **inventat** amb un [enllaç](https://exemple.org/font).\n\n- una acció\n- una altra\n\n---\n\nNOTA INTERNA QUE NO ES PUBLICA\n',
  // Breu: sense cos ni URL (només targeta)
  '2026-02-01-breu-de-prova.md': cap({ titol: '"Breu de prova"', ...base, etiqueta: 'apdcat', data: '2026-02-01', data_text: '2026', font_text: '"Font: text de font antic"' }),
  // Programada: publicada però amb data futura
  '2026-12-31-programada.md': cap({ titol: '"Notícia programada"', ...base, data: '2026-12-31' }),
  // Esborrany: no surt mai
  '2026-01-15-esborrany.md': cap({ titol: '"Esborrany [REVISAR: data]"', ...base, estat: 'esborrany', data: '2026-01-15' }) + '\nText amb [REVISAR].\n',
};
const dir = path.join(TMP, 'actualitat');
fs.mkdirSync(dir);
const dirSectorsBuit = path.join(TMP, 'sectors-buit');
fs.mkdirSync(dirSectorsBuit);
for (const [f, t] of Object.entries(NOTICIES)) fs.writeFileSync(path.join(dir, f), t);

const construir = (env, sortida) => {
  try {
    return { ok: true, sortida: execFileSync('node', ['eines/construir.mjs', '--sortida', sortida], { cwd: ARREL, env: { ...process.env, DIR_SECTORS: dirSectorsBuit, ...env }, encoding: 'utf8', stdio: 'pipe' }) };
  } catch (e) { return { ok: false, sortida: String(e.stderr) + String(e.stdout) }; }
};

// 1. Construcció a una data fixa
const OUT = path.join(TMP, 'dist');
const r = construir({ DIR_ACTUALITAT: dir, DATA_CONSTRUCCIO: '2026-06-01' }, OUT);
ok('construeix amb notícies', r.ok, r.sortida);
ok('compta publicades i programades', /notícies: 2 publicades, 1 programades/.test(r.sortida), r.sortida);
const llegeix = f => fs.readFileSync(path.join(OUT, f), 'utf8');
const llistat = llegeix('actualitat/index.html');
ok('llistat: les 2 publicades, de la més nova a la més antiga',
  llistat.indexOf('Article de prova') > 0 && llistat.indexOf('Breu de prova') > llistat.indexOf('Article de prova'));
ok('llistat: ni la programada ni l\'esborrany', !llistat.includes('programada') && !llistat.includes('Esborrany'));
ok('llistat: la breu no té enllaç; l\'article sí', llistat.includes('<a href="/actualitat/article-de-prova/">') && !llistat.includes('/actualitat/breu-de-prova/'));
ok('llistat: data visible i línia de font de les migrades', llistat.includes('>2026</time>') && llistat.includes('Font: text de font antic'));
const art = llegeix('actualitat/article-de-prova/index.html');
ok('article: el títol s\'escapa', art.includes('amb «cometes» &amp; escapada</h1>'));
ok('article: el cos en Markdown', art.includes('<strong>inventat</strong>') && art.includes('<li>una acció</li>'));
ok('article: les notes de revisió no es publiquen', !art.includes('NOTA INTERNA'));
ok('article: data llarga i servei relacionat', art.includes(dataLlarga('2026-03-10')) && art.includes('/serveis/auditoria-proteccio-dades/'));
ok('article: la font no es repeteix si el cos ja l\'enllaça', !art.includes('class="noticia-font"'));
ok('article: JSON-LD NewsArticle i og:type article', art.includes('"@type": "NewsArticle"') && art.includes('content="article"'));
ok('article: enllaç al canal RSS', art.includes('application/rss+xml'));
ok('cap pàgina per a la breu', !fs.existsSync(path.join(OUT, 'actualitat/breu-de-prova/index.html')));
const rss = llegeix('actualitat/rss.xml');
ok('RSS: 2 elements i caràcters escapats', (rss.match(/<item>/g) || []).length === 2 && rss.includes('«cometes» &amp; escapada'));
const mapa = llegeix('sitemap.xml');
ok('mapa del lloc: llistat i article, no la breu', mapa.includes('/actualitat/</loc>') && mapa.includes('/actualitat/article-de-prova/</loc>') && !mapa.includes('breu-de-prova'));
const portada = llegeix('index.html');
ok('portada: mostra les notícies publicades dels fitxers, amb enllaç si tenen pàgina',
  portada.includes('href="/actualitat/article-de-prova/"') && portada.includes('Breu de prova') && !portada.includes('Notícia programada') && portada.includes('Totes les notícies'));

// 2. La programada surt el dia que toca
const r2 = construir({ DIR_ACTUALITAT: dir, DATA_CONSTRUCCIO: '2026-12-31' }, path.join(TMP, 'dist2'));
ok('la programada surt el seu dia', r2.ok && /notícies: 3 publicades/.test(r2.sortida), r2.sortida);

// 3. Portada amb origen «actualitat»: les 3 últimes, amb enllaç si tenen pàgina
const noticies = Object.entries(NOTICIES).map(([f, t]) => llegirNoticia(t, f)).filter(n => n.cap.estat === 'publicat');
const html = renderBloc({ tipus: 'actualitat', ancora: 'actualitat', etiqueta: 'Actualitat', titol: 'T', entradeta: 'E', origen: 'actualitat' },
  { actualitat: noticies.map(targeta) });
ok('portada: targetes des dels fitxers i enllaç a totes', html.includes('href="/actualitat/article-de-prova/"') && html.includes('Totes les notícies'));
const manual = renderBloc({ tipus: 'actualitat', etiqueta: 'A', titol: 'T', entradeta: 'E', origen: 'actualitat',
  noticies: [{ variant: 'rgpd', tag: 'RGPD', data: 'X', titol: 'Manual', cos: 'C' }] }, { actualitat: [] });
ok('portada: sense publicades, la llista manual', manual.includes('Manual') && !manual.includes('Totes les notícies'));

// 4. Validacions que aturen la construcció
const casos = {
  '[REVISAR] en una publicada': ['2026-01-01-revisar.md', cap({ titol: '"T"', ...base, data: '2026-01-01' }) + '\nText [REVISAR: xifra].\n', /\[REVISAR\]/],
  'HTML al títol': ['2026-01-01-html-titol.md', cap({ ...base, titol: '"Títol <b>x</b>"', data: '2026-01-01' }), /HTML/],
  'HTML al cos': ['2026-01-01-html.md', cap({ titol: '"T"', ...base, data: '2026-01-01', font_url: 'https://exemple.org' }) + '\n<script>x</script>\n', /HTML/],
  'cos sense font_url': ['2026-01-01-sense-url.md', cap({ titol: '"T"', ...base, data: '2026-01-01' }) + '\nText.\n', /font_url/],
  'data impossible': ['2026-01-01-data.md', cap({ titol: '"T"', ...base, data: '2026-02-30' }), /data AAAA-MM-DD/],
  'nom de fitxer': ['Notícia Nova.md', cap({ titol: '"T"', ...base, data: '2026-01-01' }), /nom del fitxer/],
  'camp desconegut': ['2026-01-01-camp.md', cap({ titol: '"T"', ...base, data: '2026-01-01', autor: 'X' }), /camp no previst/],
  'enllaç no https': ['2026-01-01-http.md', cap({ titol: '"T"', ...base, data: '2026-01-01', font_url: 'http://exemple.org' }), /https/],
  'fonts_addicionals sense https': ['2026-01-01-fonts-http.md', cap({ titol: '"T"', ...base, data: '2026-01-01',
    font_url: 'https://exemple.org', fonts_addicionals: '"https://exemple.org/a | http://exemple.org/b"' }), /fonts_addicionals.*https/],
  'cta_desti servei sense servei_relacionat': ['2026-01-01-cta-servei.md', cap({ titol: '"T"', ...base, data: '2026-01-01',
    font_url: 'https://exemple.org', cta_desti: 'servei' }), /servei_relacionat/],
  'meta_descripcio massa llarga': ['2026-01-01-meta-llarga.md', cap({ titol: '"T"', ...base, data: '2026-01-01',
    meta_descripcio: `"${'a'.repeat(156)}"` }), /màxim 155/],
};
for (const [nom, [f, t, patro]] of Object.entries(casos)) {
  const d = path.join(TMP, 'cas-' + Object.keys(casos).indexOf(nom));
  fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, f), t);
  const rc = construir({ DIR_ACTUALITAT: d }, path.join(TMP, 'out'));
  ok(`rebutja: ${nom}`, !rc.ok && patro.test(rc.sortida), rc.sortida.slice(0, 300));
}

// 5. Plantilla d'article per a SEO (WEB-T06): sense camps nous, amb tots els camps nous i valors per defecte
const jsonld = html => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1])['@graph'];
const ldSense = jsonld(art).find(x => x['@type'] === 'NewsArticle');
ok('article sense camps nous: sense barra de revisió, bloc Fonts ni crida pròpia, i dateModified = data',
  !art.includes('class="noticia-revisio"') && !art.includes('class="noticia-fonts"') && !art.includes('class="noticia-cta"')
  && art.includes('class="pagina-cta"') && ldSense && ldSense.dateModified === '2026-03-10' && !('citation' in ldSense));

const dirSeo = path.join(TMP, 'seo');
fs.mkdirSync(dirSeo);
fs.writeFileSync(path.join(dirSeo, '2026-04-01-guia-completa.md'), cap({
  titol: '"Guia completa de prova"',
  ...base,
  meta_descripcio: '"Descripció curta específica per a Google i xarxes."',
  data: '2026-04-01',
  data_revisio: '2026-05-10',
  revisat_per: '"Equip jurídic de prova"',
  ninxol: 'salut',
  tipus_article: 'guia',
  font_url: '"https://exemple.org/font-principal"',
  fonts_addicionals: '"https://exemple.org/reglament | https://exemple.org/guia-apdcat"',
  data_font: '2026-03-20',
  servei_relacionat: 'dpo',
  cta_desti: 'servei',
  cta_text: '"Descobreix el DPO extern"',
}) + '\n## Context\n\nCos de la guia de prova.\n');
fs.writeFileSync(path.join(dirSeo, '2026-04-02-guia-defectes.md'), cap({
  titol: '"Guia amb valors per defecte"',
  ...base,
  data: '2026-04-02',
  data_revisio: '2026-05-12',
  font_url: '"https://exemple.org/font-2"',
  cta_desti: 'diagnostic',
}) + '\n## Resum\n\nCos curt.\n');
fs.writeFileSync(path.join(dirSeo, '2026-04-03-guia-contacte.md'), cap({
  titol: '"Guia amb crida a contacte"',
  ...base,
  data: '2026-04-03',
  font_url: '"https://exemple.org/font-3"',
  cta_desti: 'contacte',
}) + '\n## Resum\n\nCos curt.\n');

const outSeo = path.join(TMP, 'dist-seo');
const rSeo = construir({ DIR_ACTUALITAT: dirSeo, DATA_CONSTRUCCIO: '2026-06-01' }, outSeo);
ok('construeix articles amb els camps nous de WEB-T06', rSeo.ok, rSeo.sortida);
const guia = fs.readFileSync(path.join(outSeo, 'actualitat/guia-completa/index.html'), 'utf8');
const ldGuia = jsonld(guia).find(x => x['@type'] === 'Article');
ok('article complet: meta description i og:description fan servir meta_descripcio',
  guia.includes('<meta name="description" content="Descripció curta específica per a Google i xarxes." />')
  && guia.includes('<meta property="og:description" content="Descripció curta específica per a Google i xarxes." />'));
ok('article complet: barra de revisió sota el H1 amb data llarga i revisat_per',
  guia.includes(`</h1>\n      <p class="noticia-revisio">Darrera revisió jurídica: <time datetime="2026-05-10">${dataLlarga('2026-05-10')}</time> · Equip jurídic de prova</p>`));
ok('article complet: bloc Fonts amb totes les URL i rel="noopener" target="_blank"',
  guia.includes('class="noticia-fonts"')
  && guia.includes('href="https://exemple.org/font-principal" target="_blank" rel="noopener"')
  && guia.includes('href="https://exemple.org/reglament" target="_blank" rel="noopener"')
  && guia.includes('href="https://exemple.org/guia-apdcat" target="_blank" rel="noopener"'));
ok('article complet: crida final amb destí del servei relacionat i text propi',
  guia.includes('class="noticia-cta"') && guia.includes('href="/serveis/dpo-extern/">Descobreix el DPO extern</a>'));
ok('article complet: JSON-LD Article amb dateModified, citation i autor/editor #empresa',
  Boolean(ldGuia) && ldGuia.dateModified === '2026-05-10'
  && Array.isArray(ldGuia.citation) && ldGuia.citation.length === 3
  && ldGuia.citation.includes('https://exemple.org/font-principal')
  && ldGuia.citation.includes('https://exemple.org/reglament')
  && ldGuia.citation.includes('https://exemple.org/guia-apdcat')
  && ldGuia.author?.['@id'] === 'https://madeinhuman.cat/#empresa'
  && ldGuia.publisher?.['@id'] === 'https://madeinhuman.cat/#empresa');

const guiaDef = fs.readFileSync(path.join(outSeo, 'actualitat/guia-defectes/index.html'), 'utf8');
const guiaContacte = fs.readFileSync(path.join(outSeo, 'actualitat/guia-contacte/index.html'), 'utf8');
ok('article amb valors per defecte: text de revisió i botons de diagnòstic i contacte per defecte',
  guiaDef.includes('Revisat per un consultor RGPD i DPO extern de madeinhuman</p>')
  && guiaDef.includes('href="/diagnostic">Fer el diagnòstic gratuït</a>')
  && guiaContacte.includes('href="/#contacte">Parla amb nosaltres</a>'));

// 6. Esborranys d'actualitat a la vista prèvia (WEB-G03a)
const construirAmb = (env, sortida, extraArgs = []) => {
  try {
    return { ok: true, sortida: execFileSync('node', ['eines/construir.mjs', '--sortida', sortida, ...extraArgs],
      { cwd: ARREL, env: { ...process.env, CF_PAGES_BRANCH: '', DIR_SECTORS: dirSectorsBuit, ...env }, encoding: 'utf8', stdio: 'pipe' }) };
  } catch (e) { return { ok: false, sortida: String(e.stderr) + String(e.stdout) }; }
};
ok('producció: no genera ni /actualitat/esborranys/ ni la pàgina de l\'esborrany',
  !fs.existsSync(path.join(OUT, 'actualitat/esborranys/index.html'))
  && !fs.existsSync(path.join(OUT, 'actualitat/esborrany/index.html')));

// Afegeix un esborrany sense cos (no ha de generar pàgina ni sortir a /actualitat/esborranys/)
fs.writeFileSync(path.join(dir, '2026-01-16-esborrany-breu.md'), cap({ titol: '"Esborrany breu"', ...base, estat: 'esborrany', data: '2026-01-16' }));
const outDraft = path.join(TMP, 'dist-draft');
const rDraft = construirAmb({ DIR_ACTUALITAT: dir, DATA_CONSTRUCCIO: '2026-06-01' }, outDraft, ['--esborranys']);
ok('--esborranys construeix amb esborranys d\'actualitat', rDraft.ok, rDraft.sortida);
const idxEsb = fs.readFileSync(path.join(outDraft, 'actualitat/esborranys/index.html'), 'utf8');
const pagEsb = fs.readFileSync(path.join(outDraft, 'actualitat/esborrany/index.html'), 'utf8');
ok('--esborranys genera /actualitat/esborranys/ amb noindex, franja i enllaç només a l\'esborrany amb cos',
  idxEsb.includes('<meta name="robots" content="noindex, nofollow" />')
  && idxEsb.includes('Esborrany: pendent de validació')
  && idxEsb.includes('href="/actualitat/esborrany/"')
  && !idxEsb.includes('esborrany-breu')
  && !fs.existsSync(path.join(outDraft, 'actualitat/esborrany-breu/index.html')));
ok('--esborranys genera la pàgina de l\'esborrany amb noindex, nofollow i franja visible',
  pagEsb.includes('<meta name="robots" content="noindex, nofollow" />')
  && pagEsb.includes('Esborrany: pendent de validació')
  && pagEsb.includes('<mark class="revisar" id="revisar-1">[REVISAR: data]</mark>')
  && pagEsb.includes('Text amb <mark class="revisar" id="revisar-2">[REVISAR]</mark>.'));
ok('--esborranys manté els esborranys fora de /actualitat/, RSS, mapa del lloc i portada',
  !fs.readFileSync(path.join(outDraft, 'actualitat/index.html'), 'utf8').includes('Esborrany')
  && !fs.readFileSync(path.join(outDraft, 'actualitat/rss.xml'), 'utf8').includes('Esborrany')
  && !fs.readFileSync(path.join(outDraft, 'sitemap.xml'), 'utf8').includes('esborrany')
  && !fs.readFileSync(path.join(outDraft, 'index.html'), 'utf8').includes('Esborrany'));

const outCfPrev = path.join(TMP, 'dist-cf-prev');
const rCfPrev = construirAmb({ DIR_ACTUALITAT: dir, DATA_CONSTRUCCIO: '2026-06-01', CF_PAGES_BRANCH: 'gemini/WEB-G03' }, outCfPrev);
ok('CF_PAGES_BRANCH != main genera /actualitat/esborranys/ i l\'esborrany',
  rCfPrev.ok && fs.existsSync(path.join(outCfPrev, 'actualitat/esborranys/index.html'))
  && fs.existsSync(path.join(outCfPrev, 'actualitat/esborrany/index.html')));

const outCfMain = path.join(TMP, 'dist-cf-main');
const rCfMain = construirAmb({ DIR_ACTUALITAT: dir, DATA_CONSTRUCCIO: '2026-06-01', CF_PAGES_BRANCH: 'main' }, outCfMain);
ok('CF_PAGES_BRANCH=main NO genera esborranys d\'actualitat',
  rCfMain.ok && !fs.existsSync(path.join(outCfMain, 'actualitat/esborranys/index.html'))
  && !fs.existsSync(path.join(outCfMain, 'actualitat/esborrany/index.html')));

// 7. Actualitat en castellà, grup_hreflang, índex de continguts i temps de lectura a les guies (WEB-G04b)
const dirBil = path.join(TMP, 'actualitat-bilingue');
fs.mkdirSync(dirBil);
const cosLlarg = (prefix, paraulesExtra = 240) => [
  `## ${prefix} què és`,
  'Text introductori ' + Array.from({ length: paraulesExtra }, () => 'paraula').join(' ') + '.',
  `## ${prefix} què és`,
  'Segona secció amb el mateix títol per comprovar ids únics.',
  `## ${prefix} passos amb accent i l·l`,
  '1. Primer pas.\n2. Segon pas.',
].join('\n\n');

fs.writeFileSync(path.join(dirBil, '2026-05-01-guia-ca.md'), cap({
  titol: '"Guia catalana de prova"',
  resum: '"Resum català."',
  data: '2026-05-01',
  data_revisio: '2026-05-10',
  etiqueta: 'rgpd',
  tipus_article: 'guia',
  font_nom: '"RGPD"',
  font_url: '"https://eur-lex.europa.eu/eli/reg/2016/679/oj"',
  fonts_addicionals: '"https://www.aepd.es/"',
  servei_relacionat: 'dpo',
  cta_desti: 'servei',
  estat: 'publicat',
  idioma: 'ca',
  grup_hreflang: 'guia-prova',
}) + '\n' + cosLlarg('Català', 240) + '\n');

fs.writeFileSync(path.join(dirBil, '2026-05-02-guia-es.md'), cap({
  titol: '"Guía española de prueba"',
  resum: '"Resumen en español."',
  data: '2026-05-02',
  data_revisio: '2026-05-12',
  etiqueta: 'rgpd',
  tipus_article: 'guia',
  font_nom: '"RGPD"',
  font_url: '"https://eur-lex.europa.eu/eli/reg/2016/679/oj"',
  fonts_addicionals: '"https://www.aepd.es/"',
  servei_relacionat: 'dpo',
  cta_desti: 'contacte',
  estat: 'publicat',
  idioma: 'es',
  grup_hreflang: 'guia-prova',
}) + '\n' + cosLlarg('Español', 450) + '\n');

fs.writeFileSync(path.join(dirBil, '2026-05-03-noticia-es.md'), cap({
  titol: '"Noticia en castellano"',
  resum: '"Resumen noticia ES."',
  data: '2026-05-03',
  etiqueta: 'ia',
  tipus_article: 'noticia',
  font_nom: '"AEPD"',
  font_url: '"https://www.aepd.es/"',
  estat: 'publicat',
  idioma: 'es',
}) + '\n## Primera\n\nText.\n\n## Segona\n\nText.\n\n## Tercera\n\nText.\n');

fs.writeFileSync(path.join(dirBil, '2026-05-04-borrador-es.md'), cap({
  titol: '"Borrador en español"',
  resum: '"Resumen borrador ES."',
  data: '2026-05-04',
  etiqueta: 'rgpd',
  tipus_article: 'guia',
  font_nom: '"AEPD"',
  font_url: '"https://www.aepd.es/"',
  estat: 'esborrany',
  idioma: 'es',
  grup_hreflang: 'solo-es-borrador',
}) + '\n## Paso uno\n\nTexto con [REVISAR: confirmar].\n');

const outBil = path.join(TMP, 'dist-bilingue');
const rBil = construirAmb({ DIR_ACTUALITAT: dirBil, DATA_CONSTRUCCIO: '2026-06-01' }, outBil, ['--esborranys']);
ok('actualitat bilingüe (ca + es) construeix sense errors', rBil.ok, rBil.sortida);

const llistatCa = fs.readFileSync(path.join(outBil, 'actualitat/index.html'), 'utf8');
const llistatEs = fs.readFileSync(path.join(outBil, 'es/actualidad/index.html'), 'utf8');
const rssCa = fs.readFileSync(path.join(outBil, 'actualitat/rss.xml'), 'utf8');
const rssEs = fs.readFileSync(path.join(outBil, 'es/actualidad/rss.xml'), 'utf8');
const portadaBil = fs.readFileSync(path.join(outBil, 'index.html'), 'utf8');

ok('llistat i RSS separats per idioma (es no surt a ca ni a portada ca, i viceversa)',
  llistatCa.includes('Guia catalana de prova') && !llistatCa.includes('Guía española de prueba') && !llistatCa.includes('Borrador en español')
  && llistatEs.includes('<html lang="es">') && llistatEs.includes('Guía española de prueba') && llistatEs.includes('Noticia en castellano')
  && !llistatEs.includes('Guia catalana de prova') && !llistatEs.includes('Borrador en español')
  && rssCa.includes('Guia catalana de prova') && !rssCa.includes('Guía española de prueba')
  && rssEs.includes('<language>es</language>') && rssEs.includes('Guía española de prueba') && !rssEs.includes('Guia catalana de prova')
  && portadaBil.includes('Guia catalana de prova') && !portadaBil.includes('Guía española de prueba'));

ok('llistats /actualitat/ i /es/actualidad/ tenen hreflang recíproc',
  llistatCa.includes('<link rel="alternate" hreflang="es" href="https://madeinhuman.cat/es/actualidad/" />')
  && llistatEs.includes('<link rel="alternate" hreflang="ca" href="https://madeinhuman.cat/actualitat/" />')
  && llistatEs.includes('<link rel="alternate" hreflang="x-default" href="https://madeinhuman.cat/actualitat/" />'));

const htmlGuiaCa = fs.readFileSync(path.join(outBil, 'actualitat/guia-ca/index.html'), 'utf8');
const htmlGuiaEs = fs.readFileSync(path.join(outBil, 'es/actualidad/guia-es/index.html'), 'utf8');
const htmlNotEs = fs.readFileSync(path.join(outBil, 'es/actualidad/noticia-es/index.html'), 'utf8');
const htmlBorrEs = fs.readFileSync(path.join(outBil, 'es/actualidad/borrador-es/index.html'), 'utf8');

ok('guia en castellà: lang="es", molles Inicio › Actualidad, textos fixos, /es/servicios/ i /es/#contacto',
  htmlGuiaEs.includes('<html lang="es">')
  && htmlGuiaEs.includes('<a href="/es/">Inicio</a> › <a href="/es/actualidad/">Actualidad</a>')
  && htmlGuiaEs.includes('Última revisión jurídica: <time datetime="2026-05-12">12 de mayo de 2026</time>')
  && htmlGuiaEs.includes('<h2>Fuentes</h2>')
  && htmlGuiaEs.includes('Te puede interesar: <a href="/es/servicios/dpo-externo/">DPO externo</a>')
  && htmlGuiaEs.includes('href="/es/#contacto">Habla con nosotros</a>')
  && htmlGuiaEs.includes('<h2>Más noticias</h2>'));

ok('hreflang recíproc ca ↔ es i x-default → catalana entre guies del mateix grup_hreflang',
  htmlGuiaCa.includes('<link rel="alternate" hreflang="es" href="https://madeinhuman.cat/es/actualidad/guia-es/" />')
  && htmlGuiaCa.includes('<link rel="alternate" hreflang="x-default" href="https://madeinhuman.cat/actualitat/guia-ca/" />')
  && htmlGuiaEs.includes('<link rel="alternate" hreflang="ca" href="https://madeinhuman.cat/actualitat/guia-ca/" />')
  && htmlGuiaEs.includes('<link rel="alternate" hreflang="es" href="https://madeinhuman.cat/es/actualidad/guia-es/" />')
  && htmlGuiaEs.includes('<link rel="alternate" hreflang="x-default" href="https://madeinhuman.cat/actualitat/guia-ca/" />'));

ok('guies mostren temps de lectura, índex («En aquesta guia» / «En esta guía») i ids únics als h2',
  htmlGuiaCa.includes('<p class="guia-lectura">2 min de lectura</p>')
  && htmlGuiaCa.includes('<h2>En aquesta guia</h2>')
  && htmlGuiaCa.includes('<h2 id="catala-que-es">')
  && htmlGuiaCa.includes('<h2 id="catala-que-es-2">')
  && htmlGuiaCa.includes('<h2 id="catala-passos-amb-accent-i-ll">')
  && htmlGuiaEs.includes('<p class="guia-lectura">3 min de lectura</p>')
  && htmlGuiaEs.includes('<h2>En esta guía</h2>')
  && htmlGuiaEs.includes('<h2 id="espanol-que-es">')
  && htmlGuiaEs.includes('<h2 id="espanol-que-es-2">'));

ok('notícia (no guia) NO porta temps de lectura, ni índex de continguts ni ids als h2',
  !htmlNotEs.includes('guia-lectura') && !htmlNotEs.includes('guia-index') && !htmlNotEs.includes('<h2 id='));

ok('esborrany en castellà: franja «Borrador: pendiente de validación», noindex i sense índex (< 3 h2)',
  htmlBorrEs.includes('<meta name="robots" content="noindex, nofollow" />')
  && htmlBorrEs.includes('Borrador: pendiente de validación')
  && !htmlBorrEs.includes('guia-index')
  && htmlBorrEs.includes('<p class="guia-lectura">1 min de lectura</p>')
  && htmlBorrEs.includes('<mark class="revisar" id="revisar-1">[REVISAR: confirmar]</mark>'));

// Validació de grup_hreflang duplicat en el mateix idioma
const dirDupAct = path.join(TMP, 'actualitat-dup');
fs.mkdirSync(dirDupAct);
fs.writeFileSync(path.join(dirDupAct, '2026-05-01-una.md'), cap({ titol: '"Una"', ...base, data: '2026-05-01', grup_hreflang: 'mateix-grup' }) + '\nCos.\n');
fs.writeFileSync(path.join(dirDupAct, '2026-05-02-dues.md'), cap({ titol: '"Dues"', ...base, data: '2026-05-02', grup_hreflang: 'mateix-grup' }) + '\nCos.\n');
const rDupAct = construirAmb({ DIR_ACTUALITAT: dirDupAct, DATA_CONSTRUCCIO: '2026-06-01' }, path.join(TMP, 'dist-dup-act'));
ok('rebutja dues notícies amb el mateix grup_hreflang i idioma', !rDupAct.ok && /grup_hreflang/.test(rDupAct.sortida), rDupAct.sortida.slice(0, 200));

// 8. Reciprocitat guia ↔ sector: «Sectors on s'aplica» / «Sectores donde se aplica» (WEB-G04d)
const dirSecRec = path.join(TMP, 'sectors-reciproc');
fs.mkdirSync(dirSecRec);
const secBaseRec = {
  slug: 'cliniques-rec',
  idioma: 'ca',
  estat: 'publicat',
  sector: 'salut',
  titol_seo: 'RGPD clíniques · Madeinhuman',
  descripcio: 'Descripció.',
  h1: 'Clíniques de prova',
  entradeta: 'Entradeta.',
  capsula: 'Càpsula de prova.',
  seccions: [
    { titol: 'Primera pregunta?', cos: 'Text.' },
    { titol: 'Segona pregunta?', cos: 'Text.' },
  ],
  documents: ['Doc'],
  faq: [{ pregunta: 'P?', resposta: 'R.' }],
  servei_relacionat: 'dpo',
  articles_relacionats: ['guia-ca'],
  cta_desti: 'diagnostic',
  fonts: [{ nom: 'RGPD', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' }],
};
fs.writeFileSync(path.join(dirSecRec, 'cliniques-rec.json'), JSON.stringify(secBaseRec, null, 2));
fs.writeFileSync(path.join(dirSecRec, 'esborrany-rec.json'), JSON.stringify({
  ...structuredClone(secBaseRec), slug: 'esborrany-rec', estat: 'esborrany', h1: 'Sector esborrany',
}, null, 2));
fs.writeFileSync(path.join(dirSecRec, 'clinicas-rec-es.json'), JSON.stringify({
  ...structuredClone(secBaseRec), slug: 'clinicas-rec-es', idioma: 'es', h1: 'Clínicas de prueba', articles_relacionats: ['guia-es'],
}, null, 2));

const outRecProd = path.join(TMP, 'dist-rec-prod');
const rRecProd = construirAmb({ DIR_ACTUALITAT: dirBil, DIR_SECTORS: dirSecRec, DATA_CONSTRUCCIO: '2026-06-01' }, outRecProd);
const gCaRec = fs.readFileSync(path.join(outRecProd, 'actualitat/guia-ca/index.html'), 'utf8');
const gEsRec = fs.readFileSync(path.join(outRecProd, 'es/actualidad/guia-es/index.html'), 'utf8');
const nEsRec = fs.readFileSync(path.join(outRecProd, 'es/actualidad/noticia-es/index.html'), 'utf8');
ok('guies mostren «Sectors on s\'aplica» / «Sectores donde se aplica» només amb sectors visibles del mateix idioma',
  rRecProd.ok
  && gCaRec.includes('<h2>Sectors on s&#x27;aplica</h2>')
  && gCaRec.includes('href="/sectors/cliniques-rec/">Clíniques de prova</a>')
  && !gCaRec.includes('esborrany-rec')
  && !gCaRec.includes('clinicas-rec-es')
  && gEsRec.includes('<h2>Sectores donde se aplica</h2>')
  && gEsRec.includes('href="/es/sectores/clinicas-rec-es/">Clínicas de prueba</a>')
  && !nEsRec.includes('Sectores donde se aplica'));

const outRecDraft = path.join(TMP, 'dist-rec-draft');
const rRecDraft = construirAmb({ DIR_ACTUALITAT: dirBil, DIR_SECTORS: dirSecRec, DATA_CONSTRUCCIO: '2026-06-01' }, outRecDraft, ['--esborranys']);
const gCaRecDraft = fs.readFileSync(path.join(outRecDraft, 'actualitat/guia-ca/index.html'), 'utf8');
ok('--esborranys: «Sectors on s\'aplica» inclou també sectors en esborrany visibles',
  rRecDraft.ok && gCaRecDraft.includes('href="/sectors/esborrany-rec/">Sector esborrany</a>'));

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de l\'actualitat correctes');
process.exit(fallades ? 1 : 0);
