---
id: WEB-T03
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T03
estat: obert
fase: 0 (prova de l'equip)
---
# WEB-T03 · Títol principal (H1) a la pàgina de preguntes freqüents

## Objectiu
Que `/preguntes-frequents/` tingui exactament un `<h1>` (el titular del bloc de preguntes), sense canviar com es veu.

## Context (llegeix-ho abans)
- `AGENTS.md`.
- `plantilles/blocs.mjs`, funció `faq`: el titular es pinta com `<h2 class="section-title" …>`.
- `esquema/blocs.mjs`, bloc `faq`: els camps que el panell deixa editar. Els camps sí/no fan servir `tipus: 'bool'`
  (exemple: `alternat: { tipus: 'bool', etiqueta: 'Fons alternat' }`).
- `contingut/pagines/preguntes-frequents.json`: la pàgina, amb el bloc `faq`.
- `proves/pagina-faq.mjs`: les proves de la pàgina.

## Abast
- **Pots tocar:** `esquema/blocs.mjs` (només el bloc `faq`), `esquema/esquema.json` (regenerat amb l'ordre, mai a mà),
  `plantilles/blocs.mjs` (només la funció `faq`), `contingut/pagines/preguntes-frequents.json` (només el camp nou del bloc
  `faq`), `proves/pagina-faq.mjs` (només per afegir comprovacions).
- **NO pots tocar:** cap altre fitxer. En concret, ni `styles.css` ni altres blocs.

## Què has de fer
1. Al bloc `faq` de l'esquema, afegeix un camp opcional `titolPrincipal: { tipus: 'bool', etiqueta: 'Títol principal de la
   pàgina (H1)', ajuda: 'Marca-ho només si aquest bloc és el títol de la pàgina' }`.
2. A la funció `faq` de `plantilles/blocs.mjs`: si `d.titolPrincipal` és cert, pinta el titular com
   `<h1 class="section-title" style="margin-top:18px">`; si no, com ara (`<h2 …>`). Mateixa classe i mateix estil.
3. A `contingut/pagines/preguntes-frequents.json`, al bloc `faq`, afegeix `"titolPrincipal": true`.
4. Executa `npm run exportar-esquema` i afegeix `esquema/esquema.json` al lliurament.
5. A `proves/pagina-faq.mjs`, afegeix una comprovació: la pàgina té exactament un `<h1` i conté el titular del bloc `faq`.
6. Captures abans i després, per veure que no canvia l'aspecte:
   - abans de tocar res: `npm run construir && node proves/captures.cjs abans-t03 --pagines preguntes-frequents/index.html`
   - després dels canvis: `npm run construir && node proves/captures.cjs despres-t03 --pagines preguntes-frequents/index.html`
   Compara-les tu mateix i digues al resum si veus alguna diferència (les captures no es pugen al repositori).

## Criteris d'acceptació
1. `npm run construir` sense errors.
2. `node proves/pagina-faq.mjs` → totes les comprovacions amb ✓, inclosa la nova.
3. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`.
4. `npm run comprovar` en verd.
5. Al resum: «captures idèntiques» o la diferència exacta que has vist.

## Restriccions
- Sense dependències noves. Textos de l'esquema en català (glossari d'`AGENTS.md`).

## Lliurament
Commit `WEB-T03: H1 a la pàgina de preguntes freqüents` a `mistral/WEB-T03`, `git push`, i el resum final d'`AGENTS.md`.
