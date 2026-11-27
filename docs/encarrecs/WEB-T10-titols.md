---
id: WEB-T10
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T10
estat: obert
fase: 2 (SEO)
---
# WEB-T10 · Títols de 60 caràcters i descripcions de 155 com a màxim, amb prova

## Objectiu
Que cap pàgina indexable de la web tingui un `<title>` de més de 60 caràcters ni una `<meta name="description">` de més
de 155, i que una prova ho vigili a cada canvi.

## Context (llegeix-ho abans)
- `AGENTS.md` i `docs/encarrecs/WEB-T04-meta-descripcions.md` (com es van escurçar les descripcions).
- Els títols i descripcions surten de `contingut/serveis.json`, `contingut/pagines/*.json` i les plantilles.
- Avui, almenys `serveis/dpo-extern/` té un títol de 65 caràcters. `diagnostic.html` (fitxer fix) en té un de 77 i una
  descripció llarga: **aquest no el toques**; el corregeix Claude.

## Abast
- **Pots tocar:** els camps de títol i descripció de `contingut/serveis.json` i `contingut/pagines/*.json`, i un fitxer nou
  `proves/metadades.mjs`.
- **NO pots tocar:** `diagnostic.html`, `recollida.html`, `necessito-dpo/`, cap plantilla, `package.json`, `.github/`, ni
  cap altre camp ni fitxer.

## Què has de fer
1. `proves/metadades.mjs` (sense navegador): recorre els `.html` de `dist/` (menys `_previsualitzacio/`) i, per a les
   pàgines **sense** `noindex`, comprova `<title>` ≤ 60 i `<meta name="description">` ≤ 155. Compta caràcters del text
   real (desfés les entitats HTML: `&#x27;` és un sol caràcter, `&amp;` també). Tingues una llista d'excepcions
   `PENDENTS_DE_CLAUDE = ['diagnostic.html']` que surti com a avís (no com a error). Ha de llistar cada pàgina que falla
   amb la llargada. En acabar: `totes les comprovacions de títols i descripcions correctes`.
2. Escurça els títols i descripcions que la prova detecti (llevat de les excepcions): mantén el servei, la zona (Girona)
   quan hi és i «· Madeinhuman» al final si ja hi era; registre de cada pàgina; glossari d'`AGENTS.md`; res inventat.

## Criteris d'acceptació
1. `npm run construir` i `node proves/metadades.mjs` correctes (amb l'avís de `diagnostic.html`).
2. `npm run serveis` i `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).
3. Al resum: taula amb cada text abans i després, i la seva llargada.

## Restriccions
- Només títols i descripcions. Sense dependències noves.

## Lliurament
Commit `WEB-T10: títols i descripcions dins dels límits, amb prova` a `mistral/WEB-T10`, `git push`, i el resum final d'`AGENTS.md`.
