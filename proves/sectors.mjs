// Proves de les pàgines de sector (WEB-G01), sense navegador: validacions de l'esquema,
// comportament dels esborranys (producció vs --esborranys vs CF_PAGES_BRANCH), pàgina publicada
// completa, índex /sectors/, mapa del lloc i bloqueig de marques [REVISAR.
// Ús: node proves/sectors.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validarSector } from '../esquema/sectors.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sectors-'));
let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

const basePublicat = {
  slug: 'cliniques-prova-girona',
  idioma: 'ca',
  estat: 'publicat',
  sector: 'salut',
  titol_seo: 'RGPD per a clíniques a Girona · Madeinhuman',
  descripcio: 'Guia pràctica de protecció de dades per a clíniques i consultes de salut a Girona.',
  h1: 'Protecció de dades per a clíniques a Girona',
  entradeta: 'Com organitzar les dades de pacients, consentiments i proveïdors en una clínica.',
  capsula: 'Les clíniques i consultes de salut tracten dades de categoria especial i necessiten base jurídica clara, registre d\'activitats, contractes amb proveïdors i mesures de seguretat adequades.',
  seccions: [
    { titol: 'Quines dades tracta una clínica?', cos: 'Habitualment històries clíniques, cites i facturació.\n\n1. Revisar el registre d\'activitats.\n2. Regular els encarregats.\n\n> Resum destacat de prova.' },
    { titol: 'Quins proveïdors cal regular?', cos: 'Qualsevol programa de gestió, laboratori o gestoria que accedeixi a dades personals.' },
  ],
  documents: ['Registre d\'activitats de tractament', 'Clàusula informativa per a pacients'],
  faq: [
    { pregunta: 'Cal un DPO en una clínica petita?', resposta: 'Depèn del volum i tipus de tractament. Podeu revisar-ho a [Necessito un DPO?](/necessito-dpo/).' },
    { pregunta: 'Es poden enviar recordatoris per WhatsApp?', resposta: 'Només amb una base jurídica clara i minimitzant les dades.' },
  ],
  servei_relacionat: 'dpo',
  cta_desti: 'servei',
  cta_text: 'Veure el servei de DPO extern',
  data_revisio: '2026-05-10',
  revisat_per: 'Equip jurídic de prova',
  fonts: [
    { nom: 'Reglament (UE) 2016/679 (RGPD)', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
    { nom: 'AEPD · Guia per al sector sanitari', url: 'https://www.aepd.es/' },
  ],
};

const baseEsborrany = {
  ...structuredClone(basePublicat),
  slug: 'esborrany-prova-girona',
  estat: 'esborrany',
  sector: 'educacio',
  titol_seo: 'RGPD per a escoles a Girona · Madeinhuman',
  h1: 'Protecció de dades per a escoles a Girona',
  entradeta: 'Esborrany de prova amb [REVISAR: confirmar criteri].',
  cta_desti: 'diagnostic',
  cta_text: undefined,
  revisat_per: undefined,
};
delete baseEsborrany.cta_text;
delete baseEsborrany.revisat_per;

const construir = (env, sortida, extraArgs = []) => {
  try {
    return {
      ok: true,
      sortida: execFileSync('node', ['eines/construir.mjs', '--sortida', sortida, ...extraArgs], {
        cwd: ARREL, env: { ...process.env, CF_PAGES_BRANCH: '', ...env }, encoding: 'utf8', stdio: 'pipe',
      }),
    };
  } catch (e) {
    return { ok: false, sortida: String(e.stderr) + String(e.stdout) };
  }
};

// 1. Validacions de l'esquema (cada regla de la taula)
ok('esquema accepta una pàgina publicada vàlida', validarSector(basePublicat, `${basePublicat.slug}.json`).length === 0);
ok('esquema accepta un esborrany vàlid amb [REVISAR]', validarSector(baseEsborrany, `${baseEsborrany.slug}.json`).length === 0);

const amb = (canvi, fitxer = `${basePublicat.slug}.json`) => {
  const c = structuredClone(basePublicat);
  canvi(c);
  return validarSector(c, fitxer);
};
const casos = [
  ['slug diferent del nom del fitxer', () => {}, 'un-altre-slug.json', /coincidir amb el nom del fitxer/],
  ['slug amb majúscules o accents', c => { c.slug = 'Clínica'; }, 'Clínica.json', /nom del fitxer|slug/],
  ['idioma diferent de ca', c => { c.idioma = 'es'; }, undefined, /no és cap de/],
  ['estat desconegut', c => { c.estat = 'arxivat'; }, undefined, /no és cap de/],
  ['sector desconegut', c => { c.sector = 'industria'; }, undefined, /no és cap de/],
  ['titol_seo de més de 60 caràcters', c => { c.titol_seo = 'a'.repeat(61); }, undefined, /màxim 60/],
  ['descripcio de més de 155 caràcters', c => { c.descripcio = 'a'.repeat(156); }, undefined, /màxim 155/],
  ['h1 de més de 90 caràcters', c => { c.h1 = 'a'.repeat(91); }, undefined, /màxim 90/],
  ['entradeta de més de 300 caràcters', c => { c.entradeta = 'a'.repeat(301); }, undefined, /màxim 300/],
  ['capsula de més de 420 caràcters', c => { c.capsula = 'a'.repeat(421); }, undefined, /màxim 420/],
  ['menys de 2 seccions', c => { c.seccions = [c.seccions[0]]; }, undefined, /com a mínim 2/],
  ['més de 8 seccions', c => { c.seccions = Array.from({ length: 9 }, () => ({ titol: 'Pregunta?', cos: 'Text.' })); }, undefined, /com a màxim 8/],
  ['títol de secció que no és pregunta', c => { c.seccions[0].titol = 'Títol sense interrogant'; }, undefined, /pregunta/],
  ['HTML dins d\'una secció', c => { c.seccions[0].cos = '<script>x</script>'; }, undefined, /HTML/],
  ['més de 10 documents', c => { c.documents = Array.from({ length: 11 }, (_, i) => `Doc ${i}`); }, undefined, /com a màxim 10/],
  ['més de 6 preguntes de FAQ', c => { c.faq = Array.from({ length: 7 }, (_, i) => ({ pregunta: `P${i}?`, resposta: 'R' })); }, undefined, /com a màxim 6/],
  ['cta_desti servei sense servei_relacionat', c => { delete c.servei_relacionat; c.cta_desti = 'servei'; }, undefined, /servei_relacionat/],
  ['data_revisio invàlida', c => { c.data_revisio = '2026-02-30'; }, undefined, /data AAAA-MM-DD/],
  ['font sense https://', c => { c.fonts = [{ nom: 'Font', url: 'http://exemple.org' }]; }, undefined, /https:\/\//],
  ['camp desconegut', c => { c.preu = '100'; }, undefined, /camp no previst/],
  ['[REVISAR] en una pàgina publicada', c => { c.capsula += ' [REVISAR: dada]'; }, undefined, /\[REVISAR\]/],
];
for (const [nom, canvi, fitxer, patro] of casos) {
  const e = amb(canvi, fitxer);
  ok(`rebutja: ${nom}`, e.some(x => patro.test(x)), e.join('; ') || 'cap error');
}

// 2. Producció vs --esborranys vs CF_PAGES_BRANCH (amb 1 publicada i 1 esborrany)
const dirMixt = path.join(TMP, 'sectors-mixt');
fs.mkdirSync(dirMixt);
fs.writeFileSync(path.join(dirMixt, `${basePublicat.slug}.json`), JSON.stringify(basePublicat, null, 2));
fs.writeFileSync(path.join(dirMixt, `${baseEsborrany.slug}.json`), JSON.stringify(baseEsborrany, null, 2));

const outProd = path.join(TMP, 'dist-prod');
const rProd = construir({ DIR_SECTORS: dirMixt }, outProd);
ok('producció construeix sense errors', rProd.ok, rProd.sortida);
ok('producció genera la pàgina publicada i no l\'esborrany',
  fs.existsSync(path.join(outProd, `sectors/${basePublicat.slug}/index.html`))
  && !fs.existsSync(path.join(outProd, `sectors/${baseEsborrany.slug}/index.html`)));
ok('producció genera l\'índex /sectors/ només amb la publicada',
  fs.existsSync(path.join(outProd, 'sectors/index.html'))
  && fs.readFileSync(path.join(outProd, 'sectors/index.html'), 'utf8').includes(basePublicat.h1)
  && !fs.readFileSync(path.join(outProd, 'sectors/index.html'), 'utf8').includes(baseEsborrany.h1));

// 3. Contingut complet de la pàgina publicada (HTML, JSON-LD, hreflang, mapa del lloc)
const htmlPub = fs.readFileSync(path.join(outProd, `sectors/${basePublicat.slug}/index.html`), 'utf8');
const jsonld = html => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1])['@graph'];
const grafPub = jsonld(htmlPub);
const ldService = grafPub.find(x => x['@type'] === 'Service');
const ldBread = grafPub.find(x => x['@type'] === 'BreadcrumbList');
const ldFaq = grafPub.find(x => x['@type'] === 'FAQPage');
const ldEmpresa = grafPub.find(x => x['@type'] === 'ProfessionalService');
const urlPub = `https://madeinhuman.cat/sectors/${basePublicat.slug}/`;

ok('pàgina publicada: H1 únic, barra de revisió, càpsula destacada i seccions amb Markdown',
  (htmlPub.match(/<h1\b/g) || []).length === 1
  && htmlPub.includes(`>${basePublicat.h1}</h1>`)
  && htmlPub.includes('class="noticia-revisio"')
  && htmlPub.includes('Equip jurídic de prova')
  && htmlPub.includes('class="text-destacat"')
  && htmlPub.includes('<ol>')
  && htmlPub.includes('<h2>Quines dades tracta una clínica?</h2>'));
ok('pàgina publicada: documents, FAQ, servei relacionat, fonts i crida',
  htmlPub.includes('class="pagina-seccio sector-documents"')
  && htmlPub.includes('class="pagina-seccio sector-faq"')
  && htmlPub.includes('href="/serveis/dpo-extern/"')
  && htmlPub.includes('class="noticia-fonts"')
  && htmlPub.includes('href="https://eur-lex.europa.eu/eli/reg/2016/679/oj" target="_blank" rel="noopener"')
  && htmlPub.includes('class="noticia-cta"')
  && htmlPub.includes('Veure el servei de DPO extern</a>'));
ok('pàgina publicada: JSON-LD empresa, Service (amb citation i areaServed), BreadcrumbList i FAQPage',
  Boolean(ldEmpresa) && Boolean(ldService) && ldService.serviceType === 'DPO extern'
  && Array.isArray(ldService.areaServed) && ldService.areaServed.length > 0
  && Array.isArray(ldService.citation) && ldService.citation.length === 2
  && Boolean(ldBread) && ldBread.itemListElement.length === 3
  && Boolean(ldFaq) && ldFaq.mainEntity.length === 2);
ok('pàgina publicada: canònica, hreflang ca + x-default i indexable',
  htmlPub.includes(`<link rel="canonical" href="${urlPub}" />`)
  && htmlPub.includes(`<link rel="alternate" hreflang="ca" href="${urlPub}" />`)
  && htmlPub.includes(`<link rel="alternate" hreflang="x-default" href="${urlPub}" />`)
  && !htmlPub.includes('noindex'));

const mapaProd = fs.readFileSync(path.join(outProd, 'sitemap.xml'), 'utf8');
ok('mapa del lloc inclou la pàgina publicada i l\'índex /sectors/, i no l\'esborrany',
  mapaProd.includes(`<loc>${urlPub}</loc>`)
  && mapaProd.includes('<loc>https://madeinhuman.cat/sectors/</loc>')
  && !mapaProd.includes(baseEsborrany.slug));

// 4. --esborranys i CF_PAGES_BRANCH (vista prèvia)
const outDraft = path.join(TMP, 'dist-draft');
const rDraft = construir({ DIR_SECTORS: dirMixt }, outDraft, ['--esborranys']);
const htmlDraft = fs.readFileSync(path.join(outDraft, `sectors/${baseEsborrany.slug}/index.html`), 'utf8');
const mapaDraft = fs.readFileSync(path.join(outDraft, 'sitemap.xml'), 'utf8');
ok('--esborranys genera l\'esborrany amb noindex, nofollow, franja visible i text de revisió per defecte',
  rDraft.ok
  && htmlDraft.includes('<meta name="robots" content="noindex, nofollow" />')
  && htmlDraft.includes('Esborrany: pendent de validació')
  && htmlDraft.includes('Revisat per un consultor RGPD i DPO extern de madeinhuman')
  && htmlDraft.includes('href="/diagnostic">Fer el diagnòstic gratuït</a>'));
ok('--esborranys no posa l\'esborrany ni al mapa del lloc ni a l\'índex /sectors/',
  !mapaDraft.includes(baseEsborrany.slug)
  && !fs.readFileSync(path.join(outDraft, 'sectors/index.html'), 'utf8').includes(baseEsborrany.slug));

const outCfPrev = path.join(TMP, 'dist-cf-prev');
const rCfPrev = construir({ DIR_SECTORS: dirMixt, CF_PAGES_BRANCH: 'gemini/WEB-G01' }, outCfPrev);
ok('CF_PAGES_BRANCH != main genera esborranys', rCfPrev.ok && fs.existsSync(path.join(outCfPrev, `sectors/${baseEsborrany.slug}/index.html`)));

const outCfMain = path.join(TMP, 'dist-cf-main');
const rCfMain = construir({ DIR_SECTORS: dirMixt, CF_PAGES_BRANCH: 'main' }, outCfMain);
ok('CF_PAGES_BRANCH=main NO genera esborranys', rCfMain.ok && !fs.existsSync(path.join(outCfMain, `sectors/${baseEsborrany.slug}/index.html`)));

// 5. Només esborranys: no es genera l'índex /sectors/ ni entra al mapa
const dirNomesDraft = path.join(TMP, 'sectors-nomes-draft');
fs.mkdirSync(dirNomesDraft);
fs.writeFileSync(path.join(dirNomesDraft, `${baseEsborrany.slug}.json`), JSON.stringify(baseEsborrany, null, 2));
const outNomesDraft = path.join(TMP, 'dist-nomes-draft');
const rNomesDraft = construir({ DIR_SECTORS: dirNomesDraft }, outNomesDraft, ['--esborranys']);
ok('sense cap pàgina publicada, no es genera /sectors/index.html ni entra al mapa del lloc',
  rNomesDraft.ok
  && !fs.existsSync(path.join(outNomesDraft, 'sectors/index.html'))
  && fs.existsSync(path.join(outNomesDraft, `sectors/${baseEsborrany.slug}/index.html`))
  && !fs.readFileSync(path.join(outNomesDraft, 'sitemap.xml'), 'utf8').includes('/sectors/'));

// 6. Construcció falla si una pàgina publicada té [REVISAR
const dirRev = path.join(TMP, 'sectors-revisar');
fs.mkdirSync(dirRev);
const pubRev = structuredClone(basePublicat);
pubRev.entradeta += ' [REVISAR: confirmar]';
fs.writeFileSync(path.join(dirRev, `${pubRev.slug}.json`), JSON.stringify(pubRev, null, 2));
const rRev = construir({ DIR_SECTORS: dirRev }, path.join(TMP, 'dist-rev'));
ok('construir.mjs atura la construcció si una pàgina publicada té [REVISAR', !rRev.ok && /\[REVISAR\]/.test(rRev.sortida), rRev.sortida.slice(0, 200));

// 7. Enllaçat intern des de les pàgines de servei i lastmod dels sectors al mapa del lloc (WEB-G02b)
const dirEnllac = path.join(TMP, 'sectors-enllac');
fs.mkdirSync(dirEnllac);
const pubAdequacio = {
  ...structuredClone(basePublicat),
  slug: 'comerc-prova-girona',
  sector: 'comerc',
  titol_seo: 'RGPD per a comerços a Girona · Madeinhuman',
  h1: 'Protecció de dades per a comerços a Girona',
  servei_relacionat: 'adequacio',
  cta_desti: 'diagnostic',
  data_revisio: '2026-06-20',
};
const pubSenseData = {
  ...structuredClone(basePublicat),
  slug: 'hostaleria-sense-data-girona',
  sector: 'hostaleria',
  titol_seo: 'RGPD per a hostaleria a Girona · Madeinhuman',
  h1: 'Protecció de dades per a hostaleria a Girona',
  servei_relacionat: 'adequacio',
  cta_desti: 'diagnostic',
};
delete pubSenseData.data_revisio;
const draftAdequacio = {
  ...structuredClone(baseEsborrany),
  slug: 'esborrany-adequacio-girona',
  servei_relacionat: 'adequacio',
  data_revisio: '2026-12-31',
};
fs.writeFileSync(path.join(dirEnllac, `${basePublicat.slug}.json`), JSON.stringify(basePublicat, null, 2));
fs.writeFileSync(path.join(dirEnllac, `${pubAdequacio.slug}.json`), JSON.stringify(pubAdequacio, null, 2));
fs.writeFileSync(path.join(dirEnllac, `${pubSenseData.slug}.json`), JSON.stringify(pubSenseData, null, 2));
fs.writeFileSync(path.join(dirEnllac, `${draftAdequacio.slug}.json`), JSON.stringify(draftAdequacio, null, 2));

const outEnllac = path.join(TMP, 'dist-enllac');
const rEnllac = construir({ DIR_SECTORS: dirEnllac }, outEnllac, ['--esborranys']);
ok('construeix amb diversos sectors publicats i esborrany per comprovar enllaçat intern', rEnllac.ok, rEnllac.sortida);

const srvAdequacio = fs.readFileSync(path.join(outEnllac, 'serveis/adequacio-rgpd-girona/index.html'), 'utf8');
const srvDpo = fs.readFileSync(path.join(outEnllac, 'serveis/dpo-extern/index.html'), 'utf8');
const srvAuditoria = fs.readFileSync(path.join(outEnllac, 'serveis/auditoria-proteccio-dades/index.html'), 'utf8');
const srvAdequacioEs = fs.readFileSync(path.join(outEnllac, 'es/servicios/adecuacion-rgpd-girona/index.html'), 'utf8');

ok('servei d\'adequació mostra «Per sectors» amb els seus sectors publicats i cap esborrany',
  srvAdequacio.includes('<h2>Per sectors</h2>')
  && srvAdequacio.includes(`<li><a href="/sectors/${pubAdequacio.slug}/">${pubAdequacio.h1}</a></li>`)
  && srvAdequacio.includes(`<li><a href="/sectors/${pubSenseData.slug}/">${pubSenseData.h1}</a></li>`)
  && !srvAdequacio.includes(basePublicat.slug)
  && !srvAdequacio.includes(draftAdequacio.slug));
ok('servei de DPO només enllaça el sector de DPO; auditoria i castellà no tenen «Per sectors»',
  srvDpo.includes('<h2>Per sectors</h2>')
  && srvDpo.includes(`<li><a href="/sectors/${basePublicat.slug}/">${basePublicat.h1}</a></li>`)
  && !srvDpo.includes(pubAdequacio.slug)
  && !srvAuditoria.includes('Per sectors')
  && !srvAdequacioEs.includes('Per sectors'));

const mapaEnllac = fs.readFileSync(path.join(outEnllac, 'sitemap.xml'), 'utf8');
ok('mapa del lloc posa lastmod = data_revisio a cada sector publicat amb data, i la més recent a /sectors/',
  mapaEnllac.includes(`<loc>https://madeinhuman.cat/sectors/${basePublicat.slug}/</loc>\n    <lastmod>2026-05-10</lastmod>`)
  && mapaEnllac.includes(`<loc>https://madeinhuman.cat/sectors/${pubAdequacio.slug}/</loc>\n    <lastmod>2026-06-20</lastmod>`)
  && mapaEnllac.includes(`<loc>https://madeinhuman.cat/sectors/</loc>\n    <lastmod>2026-06-20</lastmod>`)
  && mapaEnllac.includes(`<loc>https://madeinhuman.cat/sectors/${pubSenseData.slug}/</loc>\n  </url>`)
  && !mapaEnllac.includes(draftAdequacio.slug));

// Sense cap sector publicat, les pàgines de servei no porten «Per sectors» i són idèntiques a una construcció sense sectors
const dirBuit = path.join(TMP, 'sectors-buit');
fs.mkdirSync(dirBuit);
const outSense = path.join(TMP, 'dist-sense-sectors');
const rSense = construir({ DIR_SECTORS: dirBuit }, outSense);
const slugsServeisCa = ['adequacio-rgpd-girona', 'dpo-extern', 'auditoria-proteccio-dades', 'reglament-ia-empreses', 'textos-legals-web'];
const igualsSensePublicats = rSense.ok && slugsServeisCa.every(sl => {
  const a = fs.readFileSync(path.join(outNomesDraft, `serveis/${sl}/index.html`), 'utf8');
  const b = fs.readFileSync(path.join(outSense, `serveis/${sl}/index.html`), 'utf8');
  return a === b && !a.includes('Per sectors');
});
ok('sense sectors publicats, les pàgines de servei no tenen «Per sectors» i són idèntiques', igualsSensePublicats);

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de les pàgines de sector correctes');
process.exit(fallades ? 1 : 0);
