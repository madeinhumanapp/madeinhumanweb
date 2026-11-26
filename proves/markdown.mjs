// Proves del Markdown mínim (WEB-T11), sense navegador: llistes numerades (<ol>), paràgraf destacat
// (<blockquote class="text-destacat">), escapament d'HTML, línies que comencen per un número normal
// i paritat dels .html de dist/ amb main.
// Ús: node proves/markdown.mjs [--base /ruta/a/dist-de-main]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { markdown } from '../plantilles/markdown.mjs';
import { llegirNoticia } from '../plantilles/actualitat.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ARREL, 'dist');
const args = process.argv.slice(2);
const BASE_ARG = args.includes('--base') ? path.resolve(args[args.indexOf('--base') + 1]) : null;

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

// 1. Llistes numerades
const ol = markdown('1. a\n2. b');
ok('1. a / 2. b genera <ol> amb dos <li>', ol === '<ol>\n<li>a</li>\n<li>b</li>\n</ol>', ol);

const olStart = markdown('3. c');
ok('3. c sol genera <ol start="3">', olStart === '<ol start="3">\n<li>c</li>\n</ol>', olStart);

const olCont = markdown('1. Primer pas\n  que continua sagnat\n  en una tercera línia\n2. Segon pas');
ok('element de llista numerada que continua en línies sagnades amb 2 espais',
  olCont === '<ol>\n<li>Primer pas que continua sagnat en una tercera línia</li>\n<li>Segon pas</li>\n</ol>', olCont);

const olMulti = markdown('10. Desè\n11. Onzè');
ok('llista numerada de més d\'una xifra genera <ol start="10">',
  olMulti === '<ol start="10">\n<li>Desè</li>\n<li>Onzè</li>\n</ol>', olMulti);

// 2. Paràgraf destacat
const cita = markdown('> text amb **negreta** i [enllaç](https://exemple.org)');
ok('paràgraf destacat genera blockquote.text-destacat amb <strong> i enllaç extern segur',
  cita.startsWith('<blockquote class="text-destacat">') && cita.endsWith('</blockquote>')
  && cita.includes('<strong>negreta</strong>')
  && cita.includes('<a href="https://exemple.org" target="_blank" rel="noopener">enllaç</a>'), cita);

const citaMulti = markdown('> Primera frase amb *cursiva* i `codi`.\n> Segona frase.');
ok('paràgraf destacat de diverses línies seguides amb > ',
  (citaMulti.match(/<blockquote class="text-destacat">/g) || []).length === 1
  && citaMulti.includes('<em>cursiva</em>') && citaMulti.includes('<code>codi</code>')
  && citaMulti.includes('Segona frase.'), citaMulti);

// 3. Escapament d'HTML
const escOl = markdown('1. <script>alert(1)</script>');
ok('escapament: 1. <script> no genera cap etiqueta HTML',
  !escOl.includes('<script>') && escOl.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), escOl);

const escCita = markdown('> <b>x</b>');
ok('escapament: > <b>x</b> no genera cap etiqueta <b>',
  !escCita.includes('<b>') && escCita.includes('&lt;b&gt;x&lt;/b&gt;'), escCita);

// 4. Línia normal que comença per un número (sense punt i espai)
const numNormal = markdown('2026 va ser un any clau per a la protecció de dades.');
ok('2026 va ser un any… continua sent un paràgraf',
  numNormal === '<p>2026 va ser un any clau per a la protecció de dades.</p>', numNormal);

const numSenseEspai = markdown('1.sense espai continua sent un paràgraf');
ok('1.sense espai continua sent un paràgraf',
  numSenseEspai === '<p>1.sense espai continua sent un paràgraf</p>', numSenseEspai);

// 5. Paritat amb main: cap .html existent de dist/ no canvia
const rBuild = execFileSync('node', ['eines/construir.mjs'], { cwd: ARREL, encoding: 'utf8', stdio: 'pipe' });
ok('npm run construir genera dist/ sense errors', rBuild.includes('pàgines generades'), rBuild.trim());

function llistarHtml(dir) {
  const res = [];
  (function recorre(rel = '') {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      if (!rel && e.name === '_previsualitzacio') continue;
      const r = path.join(rel, e.name);
      if (e.isDirectory()) recorre(r);
      else if (e.name.endsWith('.html')) res.push(r.split(path.sep).join('/'));
    }
  })();
  return res.sort();
}

if (BASE_ARG) {
  const actuals = llistarHtml(DIST);
  const base = llistarHtml(BASE_ARG);
  const diferents = [];
  if (JSON.stringify(actuals) !== JSON.stringify(base)) diferents.push('llista de fitxers diferent');
  for (const f of actuals) {
    if (!fs.existsSync(path.join(BASE_ARG, f))) continue;
    if (fs.readFileSync(path.join(DIST, f), 'utf8') !== fs.readFileSync(path.join(BASE_ARG, f), 'utf8')) diferents.push(f);
  }
  ok(`paritat: tots els ${actuals.length} .html de dist/ són idèntics a la còpia de main`,
    diferents.length === 0, diferents.join(', '));
} else {
  // Carrega plantilles/markdown.mjs de main en memòria (sense fitxers temporals) i compara tot el Markdown de contingut/
  const codiMain = execFileSync('git', ['show', 'main:plantilles/markdown.mjs'], { cwd: ARREL, encoding: 'utf8', stdio: 'pipe' });
  const textUrl = pathToFileURL(path.join(ARREL, 'plantilles/text.mjs')).href;
  const modUrl = 'data:text/javascript;base64,' + Buffer.from(codiMain.replace('./text.mjs', textUrl)).toString('base64');
  const { markdown: markdownMain } = await import(modUrl);

  const diferents = [];
  let comprovats = 0;
  const comprova = (nom, text, opts) => {
    comprovats++;
    if (markdown(text, opts) !== markdownMain(text, opts)) diferents.push(nom);
  };
  for (const f of fs.readdirSync(path.join(ARREL, 'contingut/legal')).filter(x => x.endsWith('.md')).sort()) {
    comprova(`legal/${f}`, fs.readFileSync(path.join(ARREL, 'contingut/legal', f), 'utf8'), { classeTaula: 'legal-table' });
  }
  for (const f of fs.readdirSync(path.join(ARREL, 'contingut/actualitat')).filter(x => x.endsWith('.md')).sort()) {
    const n = llegirNoticia(fs.readFileSync(path.join(ARREL, 'contingut/actualitat', f), 'utf8'), f);
    if (n.cos) comprova(`actualitat/${f}`, n.cos);
  }
  const serveis = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
  for (const [clau, idiomes] of Object.entries(serveis.PAGINES)) {
    for (const [lang, pag] of Object.entries(idiomes)) {
      (pag.seccions || []).forEach((s, idx) => comprova(`serveis.${clau}.${lang}[${idx}]`, s.cos));
    }
  }
  ok(`paritat amb main: tots els textos en Markdown de contingut/ (${comprovats}) generen exactament el mateix HTML`,
    comprovats > 0 && diferents.length === 0, diferents.join(', '));
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions del Markdown correctes');
process.exit(fallades ? 1 : 0);
