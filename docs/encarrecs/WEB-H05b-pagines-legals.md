# WEB-H05b — Pàgines legals a Markdown (avís legal i política de privacitat)

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-H05b`

## Objectiu

Que `avis-legal.html` i `politica-privacitat.html` es generin des d'un fitxer Markdown més una fitxa JSON, com ja
passa amb `politica-cookies.html`, **idèntiques per a la paritat**. No es canvia cap text.

## Context (llegeix-ho abans)

- **L'exemple resolt és la política de cookies:** `contingut/pagines/politica-cookies.json` (fitxa) i
  `contingut/legal/politica-cookies.md` (text). Fes les dues pàgines exactament igual.
- `plantilles/markdown.mjs` — el Markdown que s'admet (llegeix el comentari del principi):
  `## Títol 2`, `### Títol 3`, paràgrafs, `- llistes`, `**negreta**`, `*cursiva*`, `` `codi` ``, `[text](url)`,
  taules amb `|` i notes internes `<!-- … -->`.
  - Un **salt de línia** dins d'un paràgraf (`<br />` a l'HTML) s'escriu acabant la línia amb `\`.
  - Una **taula sense capçalera** (només `<tbody>`, com la de «Responsable / Finalitat / …») s'escriu sense la fila
    `|---|`; una amb `<thead>` porta la fila `|---|` després de la capçalera.
  - Els enllaços externs reben sols `target="_blank" rel="noopener"`; els de madeinhuman.cat, `mailto:` i els
    relatius (`politica-privacitat.html`), no. No ho escriguis tu.
- `plantilles/legal.mjs` — el marc (capçal, menú, peu). **No el toquis.**

## Què has de fer (per a cada pàgina)

1. **Fitxa** `contingut/pagines/<pàgina>.json`, amb els mateixos camps que la de cookies: `pagina`, `idioma`,
   `ruta`, `fitxer`, `plantilla: "legal"`, `cap` (`titol`, `descripcio`, `robots`, `canonica`, copiats exactament del
   `<head>`), `etiqueta`, `titol` (el `<h1>`), `entradeta` (el `<p class="section-lead">`, sencer: a la de privacitat
   comença per «El teu dret a saber…»), `notaFinal` (el `<p class="legal-footer-note">`, en Markdown) i `cos`.
2. **Text** `contingut/legal/<pàgina>.md`: tot el que hi ha dins de `<div class="legal-content">` fins abans de la
   nota final, passat a Markdown en el mateix ordre.
3. **Comentaris interns:** els `<!-- … -->` que hi ha dins del text (a la de privacitat, per exemple
   `✏️ REVISAR: …`) es copien al Markdown **al mateix lloc**, tal qual. Són avisos de la responsable: no es poden perdre.
4. **Comprova** (enganxa la sortida al resum):
   ```
   npm run construir                                                        → «15 pàgines generades»
   npm run paritat -- --pagines avis-legal.html,politica-privacitat.html    → «2/2 pàgines idèntiques»
   npm run comprovar                                                        → 19/19, 4 «ok», 7/7
   ```
   Si la paritat diu que un bloc és diferent, et mostra la primera línia que no coincideix: sol ser un salt de línia
   (`\`), una taula amb o sense capçalera, una negreta o un espai. Corregeix el Markdown o la fitxa, mai l'HTML.
5. `git add` de les quatre fitxers del lliurament, commit `WEB-H05b: pàgines legals a Markdown` i push.

## Lliurament

Només: `contingut/pagines/avis-legal.json`, `contingut/pagines/politica-privacitat.json`,
`contingut/legal/avis-legal.md`, `contingut/legal/politica-privacitat.md`.

## Criteris d'acceptació

- Les ordres del pas 4 donen exactament aquests resultats.
- Cap text canviat (tampoc errades: les correccions lingüístiques s'aplicaran després, a WEB-L02).
- Els comentaris `<!-- … -->` del text original són al Markdown.

## Si alguna cosa no encaixa

Si una pàgina té alguna cosa que el Markdown no pot expressar (una etiqueta o un atribut que no surt a
`plantilles/markdown.mjs`), o si la paritat diu que el `<head>`, el menú o el peu són diferents (és cosa de la
plantilla), no ho forcis: lliura el que tinguis i explica-ho al resum.

## Fora d'abast

Tocar `plantilles/`, `eines/`, `proves/`, els `.html` o el text legal.
