---
id: WEB-T02
assignat: gemini
zona: verda
base: main (després que WEB-T01 estigui integrat)
branca: gemini/WEB-T02
estat: obert
fase: 0 (prova de l'equip)
---
# WEB-T02 · Hreflang coherent a actualitat i comprovació global

## Objectiu
Que totes les pàgines amb etiquetes `hreflang` les tinguin completes i coherents, començant per `/actualitat/`, i que
una prova ho vigili a tota la web.

## Context (llegeix-ho abans)
- `AGENTS.md` i `eines/LLEGEIX-ME.md`.
- `plantilles/base.mjs` (pinta els `<link rel="alternate" hreflang>`), `plantilles/actualitat.mjs` (llistat i notícies),
  `plantilles/serveis.mjs` (portada en castellà i pàgines de servei, que ja tenen `ca`, `es` i `x-default`).
- Avui `/actualitat/` declara només `hreflang="ca"` (una sola llengua, sense `x-default`): Google el considera incomplet.
  No hi ha versió en castellà d'actualitat.

## Abast
- **Pots tocar:** `plantilles/actualitat.mjs`, `plantilles/base.mjs` (només la part dels `alternate`, si cal),
  un fitxer nou `proves/hreflang.mjs`, `package.json` (només per afegir l'ordre `hreflang` i posar-la dins de `comprovar`).
- **NO pots tocar:** `contingut/`, `diagnostic.html`, `recollida.html`, `necessito-dpo/`, `wizard/`, `_headers`, `.github/`,
  `plantilles/formularis/`, `proves/contractes/`, ni cap altre fitxer.

## Què has de fer
1. Llistat `/actualitat/` i pàgines de notícia: declarar `hreflang="ca"` i `hreflang="x-default"`, tots dos cap a la
   pròpia canònica. Cap `hreflang="es"` mentre no hi hagi versió en castellà.
2. Prova nova `proves/hreflang.mjs` (sense navegador) que recorri tots els `.html` de `dist/` (menys `_previsualitzacio/`)
   i, per a cada pàgina que tingui algun `<link rel="alternate" hreflang>`, comprovi:
   - que hi ha una entrada per a la llengua de la pròpia pàgina (atribut `lang` de `<html>`) que apunta a la seva canònica;
   - que hi ha `x-default`;
   - que cada adreça alternativa correspon a una pàgina que existeix a `dist/`;
   - reciprocitat: si A apunta a B com a alternativa, B apunta a A.
   En acabar, ha d'escriure exactament: `totes les comprovacions de hreflang correctes`.
3. Afegeix `"hreflang": "node proves/hreflang.mjs"` a `package.json` i posa `npm run hreflang` dins de `comprovar`.
4. Si la prova detecta problemes en pàgines que **no** són d'actualitat, no les arreglis: anota-les al resum per a Claude.

## Criteris d'acceptació
1. `npm run construir` sense errors.
2. `node proves/hreflang.mjs` → `totes les comprovacions de hreflang correctes` (o la llista exacta del que falla
   fora d'actualitat, anotada al resum).
3. `npm run actualitat` i `npm run comprovar` en verd.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers. Comentaris i missatges en català.

## Lliurament
Commit `WEB-T02: hreflang coherent a actualitat i prova global` a `gemini/WEB-T02`, `git push`, i el resum final d'`AGENTS.md`.
