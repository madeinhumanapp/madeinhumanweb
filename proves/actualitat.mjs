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
for (const [f, t] of Object.entries(NOTICIES)) fs.writeFileSync(path.join(dir, f), t);

const construir = (env, sortida) => {
  try {
    return { ok: true, sortida: execFileSync('node', ['eines/construir.mjs', '--sortida', sortida], { cwd: ARREL, env: { ...process.env, ...env }, encoding: 'utf8', stdio: 'pipe' }) };
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
};
for (const [nom, [f, t, patro]] of Object.entries(casos)) {
  const d = path.join(TMP, 'cas-' + Object.keys(casos).indexOf(nom));
  fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, f), t);
  const rc = construir({ DIR_ACTUALITAT: d }, path.join(TMP, 'out'));
  ok(`rebutja: ${nom}`, !rc.ok && patro.test(rc.sortida), rc.sortida.slice(0, 300));
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de l\'actualitat correctes');
process.exit(fallades ? 1 : 0);
