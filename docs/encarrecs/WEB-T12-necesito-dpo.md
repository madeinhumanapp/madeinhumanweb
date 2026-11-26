---
id: WEB-T12
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T12
estat: obert
fase: 2 (imants)
---
# WEB-T12 · «¿Necesito un DPO?» en castellà

## Objectiu
Publicar la mini-eina `/necessito-dpo/` en castellà a `/es/necesito-dpo/`, amb la mateixa lògica, enllaçada amb la
catalana (`hreflang`) i des del peu en castellà. **No es fusiona fins que el propietari validi la traducció.**

## Context (llegeix-ho abans)
- `AGENTS.md` (glossari: «pymes», «delegado de protección de datos (DPO)»).
- `necessito-dpo/`: `index.html`, `estils.css`, `src/app.js` (interfície), `src/avaluar.js` (lògica pura),
  `dades/regles.js` (preguntes, motius, veredictes i textos). Tot estàtic, sense xarxa ni emmagatzematge.
- `eines/construir.mjs` copia a `dist/` les carpetes de l'arrel: una carpeta nova `es/necesito-dpo/` a l'arrel arriba a
  `dist/es/necesito-dpo/`.
- `contingut/lloc.json`: al peu en castellà hi ha «¿Necesito un DPO? (catalán)» → `/necessito-dpo/`.

## Abast
- **Pots crear:** `es/necesito-dpo/index.html`, `es/necesito-dpo/estils.css`, `es/necesito-dpo/src/app.js`,
  `es/necesito-dpo/src/avaluar.js`, `es/necesito-dpo/dades/regles.js`, i una prova nova `proves/necesito-dpo.mjs` (sense navegador).
- **Pots tocar:** `necessito-dpo/index.html` **només** per afegir les tres línies `<link rel="alternate" hreflang>` al `<head>`;
  `contingut/lloc.json` **només** l'enllaç del peu en castellà (cap a `/es/necesito-dpo/` i sense «(catalán)»).
- **NO pots tocar:** res més de `necessito-dpo/`, cap altre fitxer de `contingut/`, plantilles, `package.json`, `.github/`, `_headers`.

## Què has de fer
1. Copia `necessito-dpo/` a `es/necesito-dpo/`. `src/avaluar.js` ha de ser **idèntic** (la lògica no canvia). A
   `dades/regles.js` tradueix només els textos visibles (preguntes, opcions, motius, veredictes i textos); les claus,
   els identificadors i els valors no canvien. `src/app.js`: només els textos visibles que hi pugui haver.
2. `index.html`: `lang="es"`, títol (≤ 60), descripció (≤ 155), canònica `https://madeinhuman.cat/es/necesito-dpo/`, `og`
   en castellà, rutes dels recursos correctes (els absoluts `/marca.css`, `/fonts/…` igual; els relatius propis de la carpeta),
   enllaços de sortida a les pàgines en castellà (`/es/`, `/es/#contacto`, serveis en `/es/servicios/…`); el diagnòstic,
   que només existeix en català, amb «(en catalán)».
3. `hreflang` a totes dues versions: `ca` → `/necessito-dpo/`, `es` → `/es/necesito-dpo/`, `x-default` → `/necessito-dpo/`.
4. `proves/necesito-dpo.mjs`: `es/necesito-dpo/src/avaluar.js` és idèntic al català; `dades/regles.js` de totes dues
   versions té les mateixes claus i identificadors (mateixes preguntes, opcions i veredictes en el mateix ordre); a `dist/`,
   la pàgina castellana té `lang="es"`, canònica i parell `hreflang` recíproc. En acabar:
   `totes les comprovacions de «Necesito un DPO» correctes`.

## Criteris d'acceptació
1. `node proves/necesito-dpo.mjs` correcte.
2. `npm run construir`, `npm run hreflang`, `npm run sitemap`, `npm run metadades` i `npm run comprovar` en verd (les
   proves amb navegador poden fallar al teu entorn: anota-ho i continua).

## Restriccions
- Només traduir: res inventat ni cap canvi de lògica. Sense dependències, xarxa ni emmagatzematge. CSP: cap script en línia.

## Lliurament
Commit `WEB-T12: «¿Necesito un DPO?» en castellà` a `mistral/WEB-T12`, `git push`, i el resum final d'`AGENTS.md`.
