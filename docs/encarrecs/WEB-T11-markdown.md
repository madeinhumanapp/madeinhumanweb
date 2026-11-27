---
id: WEB-T11
assignat: gemini
zona: verda
base: main (amb WEB-T06 integrat)
branca: gemini/WEB-T11
estat: obert
fase: 2 (base SEO)
---
# WEB-T11 · Llistes numerades i paràgraf destacat al Markdown

## Objectiu
Que el text llarg de la web (notícies i articles, textos legals, pàgines de servei) admeti **llistes numerades** (els
passos dels articles) i un **paràgraf destacat** (el «paràgraf càpsula»: la resposta curta, la norma i l'enllaç oficial).
Avui `1. Primer pas` i `2. Segon pas` surten enganxats en un sol paràgraf. Tot el contingut que ja hi ha ha de quedar **idèntic**.

## Context (llegeix-ho abans)
- `AGENTS.md` i `eines/LLEGEIX-ME.md` (apartat «Notícies» i text enriquit).
- `plantilles/markdown.mjs`: el Markdown mínim (títols, paràgrafs, llistes amb `-`, taules, negreta, cursiva, codi,
  enllaços, comentaris). Tot s'escapa: cap HTML del contingut arriba a la pàgina.
- El fan servir `plantilles/legal.mjs`, `plantilles/serveis.mjs` i `plantilles/actualitat.mjs`. La vista prèvia del panell
  de rgpd-tool fa servir les mateixes plantilles (`_previsualitzacio`).
- Avui cap fitxer de `contingut/` té línies que comencin per `1. ` ni per `> `.

## Abast
- **Pots tocar:** `plantilles/markdown.mjs`, `styles.css` (només una classe nova per al paràgraf destacat, al final),
  `eines/LLEGEIX-ME.md` (documentar la sintaxi nova) i una prova nova `proves/markdown.mjs` (sense navegador).
- **NO pots tocar:** `contingut/`, cap altra plantilla, `package.json`, `.github/`, `_headers`, `diagnostic.html`,
  `recollida.html`, `wizard/`.

## Què has de fer
1. **Llistes numerades:** línies seguides que comencen per `1. `, `2. `… (un o més dígits, punt i espai) formen una
   `<ol>`. Com a les llistes amb `-`, un element pot continuar a les línies següents si van sagnades amb 2 espais. Si la
   primera xifra no és 1, posa `start="N"`. Una línia normal que comenci per un número sense punt i espai no canvia.
2. **Paràgraf destacat:** línies seguides que comencen per `> ` formen un `<blockquote class="text-destacat">` amb el text
   (en línia: negreta, cursiva, codi i enllaços com sempre). Estil: vora esquerra amb `var(--daurat)`, fons `var(--bg-card)`,
   text una mica més gran; només variables de `marca.css`, sense animacions; en mòbil, menys marge.
3. Actualitza el comentari de capçalera de `markdown.mjs` i l'apartat de `eines/LLEGEIX-ME.md` amb la sintaxi nova.
4. **`proves/markdown.mjs`** (importa `markdown()` directament):
   - `1. a` / `2. b` → `<ol>` amb dos `<li>`; `3. c` sol → `<ol start="3">`; element que continua en línia sagnada;
   - `> text amb **negreta** i [enllaç](https://exemple.org)` → `blockquote.text-destacat` amb `<strong>` i l'enllaç
     amb `target="_blank" rel="noopener"`;
   - escapament: `1. <script>` i `> <b>x</b>` no generen cap etiqueta;
   - una línia com `2026 va ser un any…` continua sent un paràgraf;
   - **paritat:** amb `npm run construir`, tots els `.html` de `dist/` són idèntics als de `main` (genera abans una còpia
     amb `node eines/construir.mjs --sortida <carpeta temporal>` des de `main` i compara-hi els fitxers).
   En acabar: `totes les comprovacions del Markdown correctes`.

## Criteris d'acceptació
1. `node proves/markdown.mjs` correcte (inclosa la paritat amb `main`).
2. `npm run construir`, `npm run actualitat` i `npm run comprovar` en verd (les proves amb navegador poden fallar al teu
   entorn: anota-ho i continua).

## Restriccions
- Sense dependències noves (res de `marked` ni altres paquets). Tot escapat. Comentaris en català.

## Lliurament
Commit `WEB-T11: llistes numerades i paràgraf destacat al Markdown` a `gemini/WEB-T11`, `git push`, i el resum final d'`AGENTS.md`.
