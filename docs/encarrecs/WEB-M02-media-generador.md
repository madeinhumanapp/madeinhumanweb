# WEB-M02 — Imatges i vídeos al generador de la web

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-M02`

## Objectiu

Que la web pugui mostrar imatges, galeries i vídeos curts guardats al mateix repositori (`media/` i
`contingut/media.json`). El panell (encàrrecs WEB-M03 i WEB-M04, a rgpdtool) en farà la pujada; aquí només cal que el
generador els sàpiga validar i pintar.

**Llegeix primer el contracte:** `rgpdtool/docs/panell-web/MEDIA.md`, apartat «Contracte». Si no tens accés a rgpdtool,
el resum és a sota. Respecta'l exactament (noms de camps, d'arxius i classes CSS): els altres encàrrecs en depenen.

## Resum del contracte

- `contingut/media.json`: llista d'entrades `{ id, tipus: "imatge"|"video", format: "webp"|"jpg"|"mp4", mides?, amplada, alcada, alt, credit?, poster?, data }`.
- `id`: `^\d{4}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*-[0-9a-f]{8}$`, màxim 80 caràcters, únic.
- Fitxers: imatge → `media/<id>-<amplada>.<format>` per a cada valor de `mides` (subconjunt ordenat de `[480, 960, 1600]`,
  o una sola amplada < 480 si l'original era més petit); vídeo → `media/<id>.mp4`.
- Límits: mida d'imatge ≤ 2 MB; vídeo ≤ 20 MB. Format pels bytes: WebP = `RIFF` (0–3) i `WEBP` (8–11); JPEG = `FF D8 FF`;
  MP4 = `ftyp` (4–7). Cap altre format.
- `alt` obligatori 1–200 sense HTML; `credit` opcional ≤ 120; `poster` (només vídeo) opcional, `id` d'una imatge que
  existeixi; `data` `AAAA-MM-DD`.
- Camp d'esquema nou: `{ tipus: 'media', etiqueta, filtre: 'imatge'|'video', obligatori? }`; valor = `id`.
- Blocs nous: `imatge` (`media` imatge obligatori · `alt` text ≤ 200 opcional · `peu` enriquit ≤ 200 opcional ·
  `mida` selecció `normal`|`ampla` obligatori), `galeria` (`titol` enriquit ≤ 80 opcional · `elements` llista 2–12 de
  `{ media (imatge, obligatori), alt (text ≤ 200, opcional) }`), `video` (`media` video obligatori · `titol` text ≤ 120
  obligatori · `peu` enriquit ≤ 200 opcional). Tots tres a `BLOCS_AFEGIBLES`.

## Què has de fer

1. **`contingut/media.json`**: crea'l amb `[]`.
2. **`esquema/blocs.mjs`**:
   - `validarCamp`: tipus `media` → ha de ser text que compleixi el patró de l'`id` (l'existència es comprova al pas 4).
   - Els tres blocs a `ESQUEMA` (etiquetes en català; ajudes curtes) i a `BLOCS_AFEGIBLES`.
   - `export const CAMPS_MEDIA` (els camps d'una entrada de `media.json`, amb les regles de la taula) i
     `export function validarMedia(entrades)` → llista d'errors (camps, patró i unicitat de l'`id`, `mides`
     coherents amb el format i el tipus, `poster` existent i de tipus imatge).
   - `export function usosDeMedia(pagines, entrades)` → errors per a cada `media` d'un bloc que no existeixi o que no
     sigui del tipus del `filtre`.
3. **`eines/exportar-esquema.mjs`**: afegeix `media: CAMPS_MEDIA` a l'objecte exportat i regenera
   `esquema/esquema.json` (`npm run exportar-esquema`).
4. **`eines/construir.mjs`**:
   - Llegeix `contingut/media.json` (si no existeix, `[]`). Variables per a les proves: `FITXER_MEDIA` i `DIR_MEDIA`
     (com `DIR_ACTUALITAT`).
   - Valida amb `validarMedia`, comprova que cada fitxer existeix a `media/`, que no passa dels límits i que els bytes
     corresponen al format. Comprova `usosDeMedia` amb totes les pàgines de blocs. Qualsevol error atura la construcció
     (com la resta d'errors de contingut).
   - Passa les entrades a `pagina(...)` (vegeu el pas 5) i escriu `_previsualitzacio/media.json`.
   - `media/` ja es copia sola a `dist/` (és una carpeta de l'arrel): no cal fer res més.
5. **`plantilles/base.mjs`**: `pagina(lloc, p, formularis, faq, actualitat, media = [])`; posa a `ctx.media` un
   `Map` d'`id` → entrada, i `ctx.imatges` (per a la vista prèvia, vegeu el pas 7; per defecte `{}`).
6. **`plantilles/blocs.mjs`**: les funcions `imatge`, `galeria` i `video`, amb **exactament** l'HTML del contracte
   (`rgpdtool/docs/panell-web/MEDIA.md`, apartat «HTML que genera la web»):
   - `<figure class="block media-imatge media-<mida>">`; `src` = la mida més gran ≤ 960; `srcset` amb totes les mides
     (`/media/<id>-<w>.<format> <w>w`); `sizes="(max-width: 767px) 100vw, 960px"` (a la galeria,
     `(max-width: 767px) 100vw, 480px`); `width`/`height` de l'entrada; `alt` del bloc o, si no n'hi ha, el de
     l'entrada; `loading="lazy" decoding="async"`; `figcaption` només si hi ha `peu` (amb `enriquit`).
   - Galeria: `<section class="block media-galeria">` amb el títol opcional (`<h2 class="section-title">`) i una
     `<div class="media-galeria-graella">` de `<figure>` amb la mateixa `img`.
   - Vídeo: `<figure class="block media-video"><video controls preload="none" playsinline width height poster aria-label>`
     amb `<source src="/media/<id>.mp4" type="video/mp4" />`; `poster` = la mida més gran ≤ 960 de la imatge `poster`, si
     n'hi ha.
   - Si `ctx.imatges[id]` existeix, `src` = aquest valor i **sense** `srcset` ni `sizes`.
   - Tot el text, amb `esc` o `enriquit` (cap HTML del contingut).
7. **`eines/previsualitzacio/app.mjs`**: carrega `media.json` (com `faq.json`) i accepta al missatge `media` (llista
   d'entrades, substitueix la carregada) i `imatges` (objecte `id` → URL `data:`), i els passa a `pagina`.
8. **`styles.css`**: estils de `.media-imatge`, `.media-ampla`, `.media-galeria`, `.media-galeria-graella` i
   `.media-video` (imatge i vídeo `max-width: 100%; height: auto;`, cantonades com les targetes, `figcaption` amb
   `var(--text-dim)`; galeria de 3 columnes que passa a 1 a `max-width: 767px`). Només variables de `marca.css`, cap
   color nou.
9. **`proves/media.mjs`** (nou), amb el mateix estil que `proves/actualitat.mjs`: crea en una carpeta temporal un
   `media.json` i fitxers falsos amb els bytes inicials correctes (no cal que siguin imatges reals) i comprova, com a
   mínim:
   - l'HTML de `imatge` (amb i sense `peu`, amb `alt` del bloc i de l'entrada), `galeria` i `video` (amb i sense
     `poster`), i que amb `ctx.imatges` no hi ha `srcset`;
   - que `construir` amb `FITXER_MEDIA`/`DIR_MEDIA` funciona i copia els fitxers;
   - que la construcció s'atura per: fitxer que falta, format que no coincideix (p. ex. un PNG amb nom `.webp`), mida
     d'imatge > 2 MB, `id` repetit o mal format, `alt` buit o amb HTML, bloc que fa servir un `id` inexistent o d'un
     tipus equivocat;
   - que la web actual es genera igual que abans (els blocs nous no hi són encara).
   Ha d'acabar amb `totes les comprovacions de la mèdia correctes` i sortir amb codi 1 si en falla alguna.

## Comprova (enganxa la sortida al resum)

```
npm run construir -- --sortida /tmp/abans        (ABANS de començar, a la branca base)
node proves/media.mjs                            → «totes les comprovacions de la mèdia correctes»
npm run exportar-esquema -- --comprovar          → «esquema.json al dia»
npm run comprovar                                → tot en verd
npm run construir && diff -r /tmp/abans dist -x _previsualitzacio    → cap diferència
```

## Lliurament

Només: `contingut/media.json`, `esquema/blocs.mjs`, `esquema/esquema.json`, `eines/exportar-esquema.mjs`,
`eines/construir.mjs`, `plantilles/base.mjs`, `plantilles/blocs.mjs`, `eines/previsualitzacio/app.mjs`, `styles.css`,
`proves/media.mjs`. Commit `WEB-M02: imatges i vídeos al generador`.

## Fora d'abast

`_headers`, `package.json` i `.github/` (els toca Claude en integrar-ho), les pàgines de servei i les notícies (de
moment, els blocs només a les pàgines de blocs), i qualsevol imatge real.
