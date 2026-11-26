---
id: WEB-T13
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T13
estat: obert
fase: 2 (SEO)
---
# WEB-T13 · Pàgina d'error 404 bilingüe

## Objectiu
Cloudflare Pages serveix una sola pàgina `404.html` per a qualsevol adreça que no existeix, també per a les de `/es/`.
Que aquesta pàgina digui el mateix en català i en castellà, i ofereixi els enllaços principals de totes dues versions.

## Context (llegeix-ho abans)
- `AGENTS.md`.
- `plantilles/serveis.mjs`: la funció `pagina_404()` genera `404.html` (avui només en català).

## Abast
- **Pots tocar:** `plantilles/serveis.mjs` (**només** `pagina_404()` i, si cal, una classe nova a `styles.css` al final), i una
  prova nova `proves/pagina-404.mjs` (sense navegador).
- **NO pots tocar:** cap altra funció ni fitxer, `package.json`, `.github/`, `_headers`, `contingut/`.

## Què has de fer
1. Manté el `<html lang="ca">`, el `noindex` i l'estructura. Sota el missatge en català, afegeix el mateix missatge en
   castellà dins d'un element amb `lang="es"` (títol curt, frase i enllaços): «Inicio» → `/es/`, «Servicios» →
   `/es/#servicios`, «Contacto» → `/es/#contacto`, «Preguntas frecuentes» → `/es/preguntas-frecuentes/`. Els enllaços
   catalans que ja hi ha no canvien.
2. Mateix estil que la resta (classes existents; si cal una de nova, només variables de `marca.css`).
3. `proves/pagina-404.mjs`: a `dist/404.html` hi ha `noindex`, el text en català, un element `lang="es"` amb el text en
   castellà i els quatre enllaços en castellà, i cap enllaç trencat cap a pàgines que no existeixen a `dist/`. En acabar:
   `totes les comprovacions de la pàgina 404 correctes`.
4. Captures abans i després: `node proves/captures.cjs abans-t13 --pagines 404.html` i, després dels canvis,
   `node proves/captures.cjs despres-t13 --pagines 404.html` (si el navegador no s'obre al teu entorn, anota-ho).

## Criteris d'acceptació
1. `node proves/pagina-404.mjs` correcte.
2. `npm run construir` i `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).

## Restriccions
- Castellà correcte. Sense dependències noves.

## Lliurament
Commit `WEB-T13: pàgina 404 bilingüe` a `mistral/WEB-T13`, `git push`, i el resum final d'`AGENTS.md`.
