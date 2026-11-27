// Proves de l'esquema de les pàgines de servei (C-10): el contingut actual és vàlid i els errors típics s'aturen.
// Ús: npm run serveis
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarServeis } from '../esquema/serveis.mjs';
import { validarPagina, validarLloc } from '../esquema/blocs.mjs';
import { pagina } from '../plantilles/base.mjs';
import { ambDadesDelLloc } from '../plantilles/legal.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/serveis.json'), 'utf8'));
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };
const amb = canvi => { const d = structuredClone(original); canvi(d); return validarServeis(d); };

const e0 = validarServeis(original);
ok('el contingut actual és vàlid', !e0.length, e0.join('; '));
const casos = [
  ['HTML al cos d\'una secció', d => { d.PAGINES.dpo.ca.seccions[0].cos += '<script>x</script>'; }, /HTML/],
  ['HTML al titular', d => { d.PAGINES.ia.es.h1 = '<em>IA</em>'; }, /HTML/],
  ['canviar una URL de servei', d => { d.SLUG.ca.dpo = 'dpo'; }, /URL/],
  ['treure un servei', d => { d.SERVEIS.pop(); }, /SERVEIS/],
  ['falta una pàgina en castellà', d => { delete d.PAGINES.web.es; }, /PAGINES\.web\.es: falta/],
  ['títol per a Google massa llarg', d => { d.PAGINES.auditoria.ca.titol_seo = 'x'.repeat(91); }, /màxim 90/],
  ['secció sense text', d => { d.PAGINES.adequacio.ca.seccions[1].cos = ''; }, /obligatori/],
  ['camp desconegut', d => { d.PAGINES.adequacio.ca.preu = '10'; }, /camp no previst/],
  ['enllaç de la crida no segur', d => { d.COMU.ca.cta_1[1] = 'javascript:alert(1)'; }, /enllaç vàlid/],
  ['mètode amb 3 passos', d => { d.COMU.es.metode.pop(); }, /com a mínim 4/],
];
for (const [nom, canvi, patro] of casos) {
  const e = amb(canvi);
  ok(`rebutja: ${nom}`, e.some(x => patro.test(x)), e.join('; ') || 'cap error');
}
// Blocs amagats de la portada (WEB-P03): es conserven al contingut però no es pinten; els protegits no es poden amagar
const portada = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/portada.ca.json'), 'utf8'));
const lloc = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/lloc.json'), 'utf8'));
const DIR_F = path.join(ARREL, 'plantilles/formularis');
const formularis = Object.fromEntries(fs.readdirSync(DIR_F).filter(f => f.endsWith('.html')).map(f => [path.basename(f, '.html'), fs.readFileSync(path.join(DIR_F, f), 'utf8')]));
const spot = portada.blocs.findIndex(b => b.tipus === 'spot');
const ambAmagat = structuredClone(portada); ambAmagat.blocs[spot].amagat = true;
ok('un bloc amagat és vàlid i no es pinta', !validarPagina(ambAmagat).length && !pagina(lloc, ambAmagat, formularis).includes(portada.blocs[spot].text.slice(0, 30).replace(/\*/g, '')));
const formAmagat = structuredClone(portada); formAmagat.blocs.find(b => b.tipus === 'formulari').amagat = true;
ok('un formulari no es pot amagar', validarPagina(formAmagat).some(e => /no es pot amagar/.test(e)));

// Portada: notes al llarg del fil, serveis com a Venn (dos àmbits i «Junts») i avantatges de l'adequació
const ambPortada = canvi => { const d = structuredClone(portada); canvi(d); return validarPagina(d); };
const bloc = (d, t) => d.blocs.find(b => b.tipus === t);
const casosPortada = [
  ['nota amb un costat desconegut', d => { bloc(d, 'nota').costat = 'centre'; }, /no és cap de/],
  ['nota sense frase', d => { bloc(d, 'nota').text = ''; }, /obligatori/],
  ['nota amb HTML', d => { bloc(d, 'nota').text = '<b>2018</b>'; }, /HTML/],
  ['servei que no és una pàgina de servei', d => { bloc(d, 'serveis').pilars[0].enllacos[0].href = '/#contacte'; }, /pàgina de servei/],
  ['serveis amb tres àmbits', d => { const s = bloc(d, 'serveis'); s.pilars.push(structuredClone(s.pilars[0])); }, /com a màxim 2/],
  ['serveis sense «Junts»', d => { delete bloc(d, 'serveis').junts; }, /junts: obligatori/],
  ['quatre resultats en un àmbit', d => { bloc(d, 'serveis').pilars[1].resultats.push('Un altre'); }, /com a màxim 3/],
  ['camp antic de serveis (transversal)', d => { bloc(d, 'serveis').transversalTitol = 'Consultoria'; }, /camp no previst/],
  ['quatre avantatges a l\'adequació', d => { d.blocs.find(b => b.formulari === 'adequacio').avantatges.push('Un altre'); }, /com a màxim 3/],
  ['premisses amb una sola premissa', d => { bloc(d, 'premisses').items = ['Només una']; }, /com a mínim 2/],
  ['premissa amb HTML', d => { bloc(d, 'premisses').items[0] = '<b>Disseny</b>'; }, /HTML/],
  ['crida amb un format desconegut', d => { bloc(d, 'crida').variant = 'banner'; }, /no és cap de/],
  ['crida sense botons', d => { bloc(d, 'crida').botons = []; }, /obligatori/],
  ['crida amb un enllaç no segur', d => { bloc(d, 'crida').botons[0].href = 'javascript:alert(1)'; }, /enllaç no permès/],
];
for (const [nom, canvi, patro] of casosPortada) {
  const e = ambPortada(canvi);
  ok(`portada, rebutja: ${nom}`, e.some(x => patro.test(x)), e.join('; ') || 'cap error');
}
// Preguntes freqüents: el servei relacionat ha de ser un dels serveis
const { validarFaq } = await import('../esquema/blocs.mjs');
const faqActual = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/faq.json'), 'utf8'));
const eFaq = validarFaq(faqActual);
ok('les preguntes freqüents actuals són vàlides (amb el servei relacionat)', !eFaq.length, eFaq.join('; '));
const faqMal = structuredClone(faqActual); faqMal[0].servei = 'consultoria';
ok('preguntes freqüents, rebutja: un servei relacionat que no existeix', validarFaq(faqMal).some(e => /no és cap de/.test(e)));
const pf = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/pagines/preguntes-frequents.json'), 'utf8'));
const ePf = validarPagina(pf);
ok('la pàgina de preguntes freqüents és vàlida', !ePf.length, ePf.join('; '));

// Finestres dels serveis: amb serveis.json porten l'entradeta de la pàgina; sense (vista prèvia antiga), només l'enllaç
const ambDades = pagina(lloc, portada, formularis, [], [], [], {}, original);
const senseDades = pagina(lloc, portada, formularis);
const lede = original.PAGINES.dpo.ca.lede;
ok('la finestra del DPO porta l\'entradeta de la seva pàgina i l\'enllaç', ambDades.includes('id="detall-dpo-extern"') && ambDades.includes(lede.slice(0, 40)) && /<dialog[^>]*id="detall-dpo-extern"[\s\S]*?href="\/serveis\/dpo-extern\/"/.test(ambDades));
ok('sense les dades dels serveis, la finestra encara porta l\'enllaç', senseDades.includes('id="detall-dpo-extern"') && !senseDades.includes(lede.slice(0, 40)) && senseDades.includes('Els trobaràs aquí'));
ok('la presentació de les premisses porta la marca amb la lletra del logo i les cursives amb el color de cada àmbit',
  ambDades.includes('<span class="marca-text">Madein<span>human</span></span>') && ambDades.includes('<em class="to-dades">') && ambDades.includes('<em class="to-ia">'));
ok('les notes es pinten amb la seva xifra i els principis ja no porten número', !/class="spot-num/.test(ambDades) && ambDades.includes('<div class="nota-clau">2018</div>'));

// Textos legals: {{adreca}} i {{correu}} surten de lloc.json; una marca desconeguda atura la construcció
const legal = fs.readFileSync(path.join(ARREL, 'contingut/legal/avis-legal.md'), 'utf8');
ok('els textos legals prenen l\'adreça i el correu de les dades del lloc', legal.includes('{{adreca}}') && ambDadesDelLloc(legal, lloc).includes(lloc.contacte.carrer) && !ambDadesDelLloc(legal, lloc).includes('{{'));
let aturat = false; try { ambDadesDelLloc('Hola {{telefon}}', lloc); } catch { aturat = true; }
ok('una marca desconeguda als textos legals atura la construcció', aturat);

// Menú i peu editables (WEB-P06): enllaços amb nom, columnes amb el contacte opcional
const llocAmb = canvi => { const d = structuredClone(lloc); canvi(d); return validarLloc(d); };
const eL = validarLloc(lloc);
ok('les dades actuals del lloc són vàlides', !eL.length, eL.join('; '));
const casosLloc = [
  ['enllaç del menú no segur', d => { d.menu.ca.enllacos[0].href = 'javascript:alert(1)'; }, /enllaç no permès/],
  ['menú sense enllaços', d => { d.menu.es.enllacos = []; }, /obligatori/],
  ['menú amb 8 enllaços', d => { d.menu.ca.enllacos.push(...d.menu.ca.enllacos.slice(0, 2)); }, /com a màxim 7/],
  ['HTML al text d\'un enllaç del peu', d => { d.peu.ca.columnes[0].elements[0].text = '<b>Serveis</b>'; }, /HTML/],
  ['columna buida', d => { d.peu.es.columnes[1].contacte = false; }, /buida/],
  ['4 columnes al peu', d => { d.peu.ca.columnes.push(d.peu.ca.columnes[0]); }, /com a màxim 3/],
];
for (const [nom, canvi, patro] of casosLloc) {
  const e = llocAmb(canvi);
  ok(`rebutja: ${nom}`, e.some(x => patro.test(x)), e.join('; ') || 'cap error');
}
const ambCanvis = structuredClone(lloc);
ambCanvis.menu.ca.enllacos.push({ text: 'Blog & notícies', href: '/actualitat/' });
ambCanvis.peu.ca.columnes[0].elements.push({ text: 'Web externa', href: 'https://example.org/' });
ambCanvis.peu.ca.columnes[0].contacte = true;
const hL = pagina(ambCanvis, portada, formularis);
ok('el menú i el peu pinten els enllaços nous (escapats; els externs, en una pestanya nova)',
  hL.includes('<a href="/actualitat/">Blog &amp; notícies</a>') && hL.includes('<a href="https://example.org/" target="_blank" rel="noopener">Web externa</a>')
  && (hL.match(/href="mailto:/g) || []).length === (pagina(lloc, portada, formularis).match(/href="mailto:/g) || []).length + 1);

// Preguntes freqüents per servei (WEB-G06d)
const { paginesServei } = await import('../plantilles/serveis.mjs');
const { idPreguntaFaq } = await import('../plantilles/blocs.mjs');
const faqEs = JSON.parse(fs.readFileSync(path.join(ARREL, 'contingut/faq.es.json'), 'utf8'));
const ambFaq = Object.fromEntries(paginesServei(lloc, original, [], { ca: faqActual, es: faqEs }));
const senseFaq = Object.fromEntries(paginesServei(lloc, original, []));
const jsonld = h => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));

for (const lang of ['ca', 'es']) {
  const carpeta = lang === 'es' ? 'es/servicios' : 'serveis';
  const rutaFaq = lang === 'es' ? '/es/preguntas-frecuentes/' : '/preguntes-frequents/';
  const titolEsperat = lang === 'es' ? 'Preguntas frecuentes sobre este servicio' : 'Preguntes freqüents sobre aquest servei';
  const llistaFaq = lang === 'es' ? faqEs : faqActual;
  const vistos = new Set();
  const ambIds = llistaFaq.map(f => ({ ...f, _id: idPreguntaFaq(f.pregunta, vistos) }));
  for (const clau of original.SERVEIS) {
    const ruta = `${carpeta}/${original.SLUG[lang][clau]}/index.html`;
    const html = ambFaq[ruta];
    const preguntes = ambIds.filter(f => f.servei === clau);
    if (preguntes.length) {
      ok(`${ruta}: mostra la secció de preguntes freqüents (${preguntes.length}) amb <details> i enllaços a ${rutaFaq}#id`,
        html.includes(titolEsperat)
        && (html.match(/class="servei-faq-item"/g) || []).length === preguntes.length
        && preguntes.every(f => html.includes(`href="${rutaFaq}#${f._id}"`))
        && !jsonld(html).some(j => j['@type'] === 'FAQPage'));
    } else {
      ok(`${ruta}: sense preguntes associades queda idèntica a la versió sense FAQ`,
        !html.includes('servei-faq') && html === senseFaq[ruta]);
    }
  }
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions dels serveis i dels blocs correctes');
process.exit(fallades ? 1 : 0);
