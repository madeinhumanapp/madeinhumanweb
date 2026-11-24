// Proves dels mitjans (WEB-M02), sense navegador: genera la web amb una biblioteca i fitxers falsos
// (amb els bytes inicials correctes, no cal que siguin imatges reals) en una carpeta temporal i comprova
// l'HTML dels blocs «imatge», «galeria» i «video», la construcció amb FITXER_MEDIA/DIR_MEDIA, la còpia
// dels fitxers a dist/, la vista prèvia (ctx.imatges) i les validacions que aturen la construcció.
// Ús: node proves/media.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderBloc } from '../plantilles/blocs.mjs';
import { validarBloc, validarMedia, usosDeMedia } from '../esquema/blocs.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'media-'));
let fallades = 0;
const ok = (nom, cond, detall = '') => { if (!cond) fallades++; console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`); };

// Entrades inventades (contracte de rgpdtool/docs/panell-web/MEDIA.md)
const IMG = { id: '2026-11-prova-oficina-3f9a1c2b', tipus: 'imatge', format: 'webp', mides: [480, 960, 1600], amplada: 1600, alcada: 1067, alt: "Foto de prova de l'oficina", data: '2026-11-24' };
const IMG2 = { id: '2026-11-prova-detall-7b2e9d10', tipus: 'imatge', format: 'jpg', mides: [480], amplada: 480, alcada: 320, alt: 'Detall de prova', credit: 'Foto inventada', data: '2026-11-24' };
const VID = { id: '2026-11-prova-video-1a2b3c4d', tipus: 'video', format: 'mp4', amplada: 1280, alcada: 720, alt: 'Vídeo de prova', poster: IMG.id, data: '2026-11-24' };
const VID2 = { id: '2026-11-prova-curt-9a8b7c6d', tipus: 'video', format: 'mp4', amplada: 640, alcada: 360, alt: 'Vídeo curt de prova', data: '2026-11-24' };
const ENTRADES = [VID, IMG, IMG2, VID2];

// Bytes inicials de cada format (el generador comprova el format pels bytes)
const bytes = {
  webp: () => Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.from('VP8 '), Buffer.alloc(64)]),
  jpg: () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]),
  mp4: () => Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(64)]),
  png: () => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]),
};

// Crea una biblioteca temporal (media.json + media/) i en torna les rutes per a FITXER_MEDIA/DIR_MEDIA
const prepara = (nom, entrades, modifica = () => {}) => {
  const dir = path.join(TMP, nom, 'media');
  fs.mkdirSync(dir, { recursive: true });
  for (const e of entrades) {
    if (e.tipus === 'video') fs.writeFileSync(path.join(dir, `${e.id}.mp4`), bytes.mp4());
    else for (const m of e.mides) fs.writeFileSync(path.join(dir, `${e.id}-${m}.${e.format}`), bytes[e.format]());
  }
  modifica(dir);
  const fitxer = path.join(TMP, nom, 'media.json');
  fs.writeFileSync(fitxer, JSON.stringify(entrades, null, 2));
  return { FITXER_MEDIA: fitxer, DIR_MEDIA: dir };
};

const construir = (cwd, env, sortida) => {
  try {
    return { ok: true, sortida: execFileSync('node', ['eines/construir.mjs', '--sortida', sortida],
      { cwd, env: { ...process.env, ...env }, encoding: 'utf8', stdio: 'pipe' }) };
  } catch (e) { return { ok: false, sortida: String(e.stderr) + String(e.stdout) }; }
};

// Compara dos arbres de fitxers (excloent noms de l'arrel, p. ex. _previsualitzacio i media)
const mateixos = (a, b, exclou = []) => {
  const walk = (d, rel) => {
    const out = [];
    for (const e of fs.readdirSync(path.join(d, rel), { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
      const r = path.join(rel, e.name);
      if (!rel && exclou.includes(e.name)) continue;
      if (e.isDirectory()) out.push(...walk(d, r));
      else out.push(r);
    }
    return out;
  };
  const fa = walk(a, ''), fb = walk(b, '');
  if (JSON.stringify(fa) !== JSON.stringify(fb)) return false;
  return fa.every(r => fs.readFileSync(path.join(a, r)).equals(fs.readFileSync(path.join(b, r))));
};

// 1. HTML dels blocs nous
const ctx = { media: new Map(ENTRADES.map(e => [e.id, e])), imatges: {} };

const h1 = renderBloc({ tipus: 'imatge', media: IMG.id, mida: 'ampla', peu: 'Peu **de prova**' }, ctx);
ok('imatge: figure amb les classes del contracte', h1.includes('<figure class="block media-imatge media-ampla">'));
ok('imatge: src és la mida més gran que no passa de 960', h1.includes(`src="/media/${IMG.id}-960.webp"`));
ok('imatge: srcset amb totes les mides', h1.includes(`srcset="/media/${IMG.id}-480.webp 480w, /media/${IMG.id}-960.webp 960w, /media/${IMG.id}-1600.webp 1600w"`));
ok('imatge: sizes, width, height, alt, lazy i async', h1.includes('sizes="(max-width: 767px) 100vw, 960px"') && h1.includes('width="1600" height="1067"')
  && h1.includes(`alt="${IMG.alt}"`) && h1.includes('loading="lazy" decoding="async"'));
ok('imatge: figcaption només si hi ha peu, amb enriquit', h1.includes('<figcaption>Peu <strong>de prova</strong></figcaption>'));

const h2 = renderBloc({ tipus: 'imatge', media: IMG2.id, alt: 'Alt propi del bloc', mida: 'normal' }, ctx);
ok('imatge: sense peu no hi ha figcaption', !h2.includes('figcaption'));
ok('imatge: l\'alt del bloc substitueix el de l\'entrada', h2.includes('alt="Alt propi del bloc"'));
ok('imatge: mida normal i jpg d\'una sola mida', h2.includes('media-normal') && h2.includes(`src="/media/${IMG2.id}-480.jpg"`)
  && h2.includes(`srcset="/media/${IMG2.id}-480.jpg 480w"`));

const hg = renderBloc({ tipus: 'galeria', titol: 'Galeria *de prova*', elements: [{ media: IMG.id }, { media: IMG2.id, alt: 'Detall ampliat' }] }, ctx);
ok('galeria: section, títol opcional i graella', hg.includes('<section class="block media-galeria">')
  && hg.includes('<h2 class="section-title">Galeria <em>de prova</em></h2>') && hg.includes('<div class="media-galeria-graella">'));
ok('galeria: una figure per element, amb la mateixa img', (hg.match(/<figure class="media-imatge">/g) || []).length === 2
  && hg.includes('sizes="(max-width: 767px) 100vw, 480px"') && hg.includes('alt="Detall ampliat"') && hg.includes(`alt="${IMG.alt}"`));
ok('galeria: sense títol no hi ha h2', !renderBloc({ tipus: 'galeria', elements: [{ media: IMG.id }, { media: IMG2.id }] }, ctx).includes('section-title'));

const hv = renderBloc({ tipus: 'video', media: VID.id, titol: 'Vídeo de prova', peu: 'Peu del vídeo' }, ctx);
ok('vídeo: figure i video amb els atributs del contracte', hv.includes('<figure class="block media-video">')
  && hv.includes(`<video controls preload="none" playsinline width="1280" height="720" poster="/media/${IMG.id}-960.webp" aria-label="Vídeo de prova">`));
ok('vídeo: source mp4', hv.includes(`<source src="/media/${VID.id}.mp4" type="video/mp4" />`));
ok('vídeo: figcaption només si hi ha peu', hv.includes('<figcaption>Peu del vídeo</figcaption>'));
const hv2 = renderBloc({ tipus: 'video', media: VID2.id, titol: 'Vídeo curt' }, ctx);
ok('vídeo: sense pòster no hi ha atribut poster', !hv2.includes('poster=') && hv2.includes('aria-label="Vídeo curt"') && !hv2.includes('figcaption'));

// Vista prèvia del panell: ctx.imatges fa servir la dada com a src, sense srcset ni sizes
const ctxPrev = { media: ctx.media, imatges: { [IMG.id]: 'data:image/webp;base64,PROVA' } };
const hp = renderBloc({ tipus: 'imatge', media: IMG.id, mida: 'normal' }, ctxPrev);
ok('vista prèvia: src és la dada i no hi ha srcset ni sizes', hp.includes('src="data:image/webp;base64,PROVA"') && !hp.includes('srcset') && !hp.includes('sizes='));
const hvp = renderBloc({ tipus: 'video', media: VID.id, titol: 'Vídeo de prova' }, ctxPrev);
ok('vista prèvia: el pòster també pot ser una dada', hvp.includes('poster="data:image/webp;base64,PROVA"'));

// 2. Validació de l'esquema i de la biblioteca
ok('validarBloc accepta els tres blocs nous', !validarBloc({ tipus: 'imatge', media: IMG.id, mida: 'normal' }).length
  && !validarBloc({ tipus: 'galeria', elements: [{ media: IMG.id }, { media: IMG2.id }] }).length
  && !validarBloc({ tipus: 'video', media: VID.id, titol: 'T' }).length);
ok('validarBloc rebutja un id de media mal format', validarBloc({ tipus: 'imatge', media: 'no-valid', mida: 'normal' }).some(e => /id de media/.test(e)));
ok('validarMedia accepta les entrades de prova', !validarMedia(ENTRADES).length, validarMedia(ENTRADES).join(' | '));
ok('usosDeMedia: id inexistent', usosDeMedia([{ blocs: [{ tipus: 'imatge', media: '2026-11-no-existeix-abcdef12', mida: 'normal' }] }], ENTRADES).some(e => /no hi ha cap entrada de media/.test(e)));
ok('usosDeMedia: tipus equivocat (vídeo a imatge, imatge a vídeo, vídeo a galeria)',
  usosDeMedia([{ blocs: [{ tipus: 'imatge', media: VID.id, mida: 'normal' }, { tipus: 'video', media: IMG.id, titol: 'T' },
    { tipus: 'galeria', elements: [{ media: VID.id }, { media: IMG.id }] }] }], ENTRADES).length === 3);

// 3. Construcció amb FITXER_MEDIA/DIR_MEDIA: copia els fitxers i escriu la vista prèvia
const base = prepara('base', ENTRADES);
const OUT = path.join(TMP, 'dist');
const r = construir(ARREL, base, OUT);
ok('construeix amb FITXER_MEDIA i DIR_MEDIA', r.ok, r.sortida);
const fitxers = [...ENTRADES.flatMap(e => (e.tipus === 'video' ? [`${e.id}.mp4`] : e.mides.map(m => `${e.id}-${m}.${e.format}`)))];
ok('copia tots els fitxers a dist/media/', fitxers.every(f => fs.existsSync(path.join(OUT, 'media', f))));
ok('escriu _previsualitzacio/media.json', r.ok && fs.existsSync(path.join(OUT, '_previsualitzacio/media.json'))
  && JSON.parse(fs.readFileSync(path.join(OUT, '_previsualitzacio/media.json'), 'utf8')).length === ENTRADES.length);

// La web actual es genera igual que sense mitjans (els blocs nous no hi són encara)
const r0 = construir(ARREL, {}, path.join(TMP, 'dist-sense'));
ok('la web actual es genera igual que abans', r0.ok && mateixos(OUT, path.join(TMP, 'dist-sense'), ['_previsualitzacio', 'media']));

// 4. Validacions que aturen la construcció
const casos = {
  'fitxer que falta': [prepara('falta', ENTRADES, dir => fs.rmSync(path.join(dir, `${IMG.id}-960.webp`))), /falta el fitxer media\//],
  'format que no coincideix (PNG amb nom .webp)': [prepara('png', ENTRADES, dir => fs.writeFileSync(path.join(dir, `${IMG.id}-960.webp`), bytes.png())), /bytes no corresponen al format webp/],
  'imatge més gran de 2 MB': [prepara('gran', ENTRADES, dir => fs.writeFileSync(path.join(dir, `${IMG.id}-1600.webp`), Buffer.concat([bytes.webp(), Buffer.alloc(2 * 1024 * 1024)]))), /bytes \(màxim 2097152\)/],
  'id repetit': [prepara('repetit', [VID, { ...VID }]), /repetit/],
  'id mal format': [prepara('malid', [{ ...IMG, id: 'prova-1' }]), /AAAA-MM-titol-curt-8hex/],
  'alt buit': [prepara('altbuit', [{ ...IMG, alt: '' }]), /\[0\]\.alt: obligatori/],
  'alt amb HTML': [prepara('althtml', [{ ...IMG, alt: '<b>alt</b>' }]), /no s'hi pot posar HTML/],
  'pòster que no existeix': [prepara('poster', [{ ...VID, poster: '2026-11-no-hi-es-abcdef12' }]), /poster: no hi ha cap entrada/],
  'mides en un vídeo': [prepara('midesvideo', [{ ...VID, mides: [480] }]), /mides: només les imatges/],
  'imatge amb format de vídeo': [prepara('format', [{ ...IMG, format: 'mp4' }]), /una imatge només pot ser webp o jpg/],
};
for (const [nom, [env, patro]] of Object.entries(casos)) {
  const rc = construir(ARREL, env, path.join(TMP, 'out-' + nom.replace(/\W+/g, '-')));
  ok(`rebutja: ${nom}`, !rc.ok && patro.test(rc.sortida), rc.sortida.slice(0, 300));
}

// 5. Un bloc que fa servir un id inexistent o d'un tipus equivocat atura la construcció
//    (es prova en una còpia del repositori, afegint-hi una pàgina de blocs)
const repo = path.join(TMP, 'repo');
fs.cpSync(ARREL, repo, { recursive: true, filter: f => !/(^|\/)(\.git|node_modules|dist|captures)(\/|$)/.test(f) });
const paginaProva = { pagina: 'Prova', idioma: 'ca', ruta: '/prova-media/', fitxer: 'prova-media/index.html',
  cap: { titol: 'Prova de mitjans', descripcio: 'Pàgina de prova', canonica: 'https://madeinhuman.cat/prova-media/' },
  blocs: [{ tipus: 'imatge', media: '2026-11-no-existeix-abcdef12', mida: 'normal' }] };
fs.writeFileSync(path.join(repo, 'contingut/pagines/zz-prova-media.json'), JSON.stringify(paginaProva, null, 2));
let rc = construir(repo, base, path.join(TMP, 'out-repo'));
ok('rebutja: bloc amb un id de media inexistent', !rc.ok && /no hi ha cap entrada de media/.test(rc.sortida), rc.sortida.slice(0, 300));
paginaProva.blocs = [{ tipus: 'video', media: IMG.id, titol: 'T' }];
fs.writeFileSync(path.join(repo, 'contingut/pagines/zz-prova-media.json'), JSON.stringify(paginaProva, null, 2));
rc = construir(repo, base, path.join(TMP, 'out-repo'));
ok('rebutja: bloc amb un media d\'un tipus equivocat', !rc.ok && /és de tipus «imatge», no «video»/.test(rc.sortida), rc.sortida.slice(0, 300));
paginaProva.blocs = [{ tipus: 'imatge', media: IMG.id, mida: 'ampla', peu: 'Peu de prova' }, { tipus: 'video', media: VID.id, titol: 'Vídeo de prova' }];
fs.writeFileSync(path.join(repo, 'contingut/pagines/zz-prova-media.json'), JSON.stringify(paginaProva, null, 2));
rc = construir(repo, base, path.join(TMP, 'out-repo'));
const pagina = rc.ok ? fs.readFileSync(path.join(TMP, 'out-repo/prova-media/index.html'), 'utf8') : '';
ok('pinta els blocs nous a una pàgina de blocs i copia els fitxers', rc.ok
  && pagina.includes('<figure class="block media-imatge media-ampla">') && pagina.includes(`src="/media/${IMG.id}-960.webp"`)
  && pagina.includes('<figure class="block media-video">') && fs.existsSync(path.join(TMP, 'out-repo/media', `${VID.id}.mp4`)), rc.sortida.slice(0, 300));

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de la mèdia correctes');
process.exit(fallades ? 1 : 0);
