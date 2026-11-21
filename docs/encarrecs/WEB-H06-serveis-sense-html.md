# WEB-H06 — Pàgines de servei sense HTML al contingut

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-H06`

## Objectiu

`contingut/serveis.json` encara té HTML dins dels textos (33 llocs). El panell no pot permetre HTML al contingut
(és la via per injectar codi), així que cal passar-lo al format de la resta de la web **sense canviar res del que es
veu**: Markdown al text llarg i text enriquit mínim als títols.

Per veure els 33 llocs: `npm run sense-html`. Són de dos tipus:

| Camp | Quants | Format nou | Com es pinta a `plantilles/serveis.mjs` |
|---|---|---|---|
| `PAGINES.<servei>.<ca|es>.seccions[n][1]` (cos de cada secció) | 22 | Markdown | `markdown(text)` de `plantilles/markdown.mjs` |
| `PAGINES.<servei>.<ca|es>.h1` i `PORTADA_ES.h1` (titulars amb `<br>` i `<em>`) | 11 | text enriquit: `*cursiva*` i salt de línia `\n` | `enriquit(text)` de `plantilles/text.mjs` |

## Context (llegeix-ho abans)

- `plantilles/markdown.mjs` — el Markdown que s'admet (comentari del principi). Les llistes `<ul><li>` són línies
  `- …`; cada `<p>` és un paràgraf separat per una línia en blanc; `<br>` dins d'un paràgraf és una línia acabada en
  `\`; `<em>` és `*…*`; `<a href="…">text</a>` és `[text](…)`.
- `plantilles/text.mjs` — `enriquit()`: `*cursiva*`, `**negreta**`, `\n` (salt de línia) i `[text](/ruta)`.
- `plantilles/serveis.mjs` — on es pinten aquests camps. Hi hauràs de canviar només com es pinten els camps de la
  taula (importa `markdown` i `enriquit`). Ara els escriu tal qual, perquè contenen HTML.
- Exemple del mateix canvi ja fet: les pàgines legals (`contingut/legal/*.md` i `plantilles/legal.mjs`).

## Què has de fer

1. A `contingut/serveis.json`, converteix els 33 textos al format nou (sense canviar cap paraula).
2. A `plantilles/serveis.mjs`, pinta els cossos de secció amb `markdown(…)` i els `h1` amb `enriquit(…)`.
   Si el resultat de `markdown()` no coincideix amb l'HTML original (per exemple, un enllaç extern que hauria de
   portar o no `target="_blank"`), la paritat t'ho dirà: ajusta el contingut, no `markdown.mjs`.
3. **Comprova** (enganxa la sortida al resum):
   ```
   npm run sense-html     → «cap HTML al contingut»
   npm run construir      → «15 pàgines generades»
   npm run paritat        → «19/19 pàgines idèntiques»
   npm run contractes     → 4 línies «ok»
   ```
   Si una pàgina de servei surt diferent: `git diff --no-index serveis/dpo-extern/index.html dist/serveis/dpo-extern/index.html`
   et diu exactament què canvia (els espais i salts de línia no compten per a la paritat; les etiquetes i el text, sí).
4. `git add contingut/serveis.json plantilles/serveis.mjs`, commit `WEB-H06: serveis sense HTML al contingut` i push.

## Lliurament

Només `contingut/serveis.json` i `plantilles/serveis.mjs`.

## Criteris d'acceptació

- Les quatre ordres del pas 3 donen exactament aquests resultats.
- Cap paraula canviada (les pàgines castellanes continuen amb «pymes» i les catalanes amb «pimes»).

## Fora d'abast

Tocar `plantilles/markdown.mjs`, `plantilles/text.mjs`, qualsevol `.html` o els altres camps de `serveis.json`.
