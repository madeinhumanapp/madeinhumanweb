# WEB-H03 — Convertir un bloc de la portada de HTML a dades (encàrrec reutilitzable)

Un encàrrec per bloc. **Fes només el subencàrrec que t'han indicat.**

| Subencàrrec | Bloc a `index.html` | Tipus nou | Branca de treball | Estat |
|---|---|---|---|---|
| WEB-H03a | `section.block.statement` (context i 3 xifres) | `context` | — | ☑ fet per Claude: **és l'exemple** |
| WEB-H03b | `section.block.actualitat` (notícies) | `actualitat` | `mistral/WEB-H03b` | ☑ integrat: segon exemple |
| WEB-H03c | `section.block.faq` | `faq` | — | Claude (el text és a `script.js`) |
| WEB-H03d | `section.block.services` (2 pilars, transversal i enllaços) | `serveis` | `mistral/WEB-H03d` | ☑ integrat |

**Branca base:** `claude/website-control-panel-iz6s7h`.

## Objectiu

Que el bloc deixi de ser HTML tal qual (`{"tipus": "html", …}` a `contingut/pagines/portada.ca.json`) i passi a
ser un bloc amb dades i plantilla, **sense canviar res del que es veu**.

## Context (llegeix-ho abans)

- **L'exemple:** `git show 1451c3a` (commit «WEB-H03a: bloc context amb dades»). Fes-ho exactament igual.
- `plantilles/blocs.mjs` — mira `context`, `spot` i `metode`.
- `esquema/blocs.mjs` — mira `context`: camps, etiquetes en català i límits.
- `eines/extreure-portada.mjs` — mira la regla de `section.block.statement`.
- Per veure l'HTML original del bloc: busca'l a `index.html` (o al camp `html` del bloc a `portada.ca.json`).

## Què has de fer

1. **Plantilla** a `plantilles/blocs.mjs`: una funció nova `<tipus>: d => \`…\`` que reprodueixi exactament
   l'HTML del bloc (mateixes etiquetes, classes, atributs —també `style` i `id`— i el mateix ordre).
   Text d'una línia amb `esc()`; text que pot portar cursiva, negreta o salt de línia amb `enriquit()`.
   Llistes amb `.map(…).join('\n')`. Atributs opcionals amb `attr('nom', valor)`.
2. **Esquema** a `esquema/blocs.mjs`: el tipus nou amb `nom` en català i, per a cada camp, `etiqueta` en català,
   `tipus` i `max` (la longitud més llarga actual + un 30 %, arrodonida a la desena). Camps opcionals sense `obligatori`.
3. **Regla d'extracció** a `eines/extreure-portada.mjs`: un `else if (el.matches('<selector>'))` abans de la regla de
   `section.method`, que llegeixi les dades del DOM amb `mini()` (text enriquit) i `.textContent.trim()` (text pla).
4. **Comprova, en aquest ordre** (enganxa les sortides al resum):
   ```
   npm run extreure-portada                  → el teu bloc ha de dir «<tipus> ✓ idèntic»
                                               i «encara en html» ha de baixar en 1
   npm run construir
   npm run paritat -- --pagines index.html   → «1/1 pàgines idèntiques»
   npm run contractes                        → 4 línies «ok»
   ```
5. `git add plantilles/blocs.mjs esquema/blocs.mjs eines/extreure-portada.mjs contingut/pagines/portada.ca.json`,
   commit `WEB-H03x: bloc <tipus> amb dades` i `git push -u origin mistral/WEB-H03x`.

## Si l'extractor diu «✗ diferent a la línia N»

Et mostra `<línia original> ≠ <línia generada>`. Causes habituals: un atribut o una classe de menys o de més, un
`style` diferent, un element que no sempre hi és (fes-lo opcional), un enllaç amb més d'un atribut (va a la
plantilla, no al text), o un text amb etiquetes que `mini()` no admet. Corregeix la **plantilla** o la **regla**,
mai `index.html`. Si `mini()` dona «etiqueta no admesa», no la modifiquis: explica-ho al resum.

## Lliurament

Només els quatre fitxers del pas 5. Res més.

## Criteris d'acceptació

- L'extractor diu `✓ idèntic` per al bloc i hi ha un bloc «encara en html» menys.
- `npm run paritat -- --pagines index.html`: 1/1. `npm run contractes`: 4 `ok`.
- L'esquema té etiquetes en català i límits a tots els camps de text.

## Fora d'abast

Canviar el disseny, el text o l'HTML original; tocar `plantilles/base.mjs`, `plantilles/text.mjs`,
`plantilles/formularis/`, `proves/` o qualsevol `.html`.
