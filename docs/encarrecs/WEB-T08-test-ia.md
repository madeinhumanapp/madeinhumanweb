---
id: WEB-T08
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T08
estat: obert
fase: 2 (imants)
---
# WEB-T08 · Esborrany de la mini-eina «Test d'obligacions d'IA»

## Objectiu
Una mini-eina estàtica, com `/necessito-dpo/`, que en 5-7 preguntes digui a una pime quines obligacions del Reglament
d'IA **probablement** l'afecten (art. 4 i art. 50) i la porti a fer el diagnòstic o a contactar-nos.
**És un esborrany**: es queda a la branca (no es fusiona) fins que el propietari validi el contingut jurídic.

## Context (llegeix-ho abans)
- `AGENTS.md` (glossari: «Reglament d'IA», «intel·ligència artificial» en minúscules).
- `necessito-dpo/`: el model que has de seguir (`index.html`, `estils.css`, `src/app.js` interfície, `src/avaluar.js`
  lògica pura, `dades/regles.js` textos i regles). Copia'n l'estructura; **no el modifiquis**.
- Regla del negoci: les mini-eines **diagnostiquen** el problema; mai generen documents ni donen assessorament definitiu.
- Les úniques dades jurídiques que pots fer servir (font: document del negoci, annex D):
  - **Art. 4** (alfabetització en IA), reformulat per l'Òmnibus Digital sobre IA, en vigor des del 27/07/2026: obliga a
    **adoptar mesures** de suport a l'alfabetització en IA del personal que fa servir sistemes d'IA.
  - **Art. 50** (transparència): les obligacions s'apliquen des del 2/08/2026. El marcatge de l'art. 50(2) té un període
    transitori fins al 2/12/2026 per als sistemes que ja eren al mercat.
  Qualsevol altra afirmació jurídica (articles, apartats, dates, excepcions) → `[REVISAR: què cal confirmar]`.

## Abast
- **Pots crear:** la carpeta nova `obligacions-ia/` (`index.html`, `estils.css`, `src/app.js`, `src/avaluar.js`,
  `dades/regles.js`) i una prova nova `proves/obligacions-ia.mjs` (sense navegador: prova `avaluar.js` amb combinacions
  de respostes).
- **NO pots tocar:** cap fitxer existent (tampoc `package.json`, `necessito-dpo/`, `contingut/`, `_headers`, `.github/`).

## Què has de fer
1. Preguntes (una per pantalla, «No ho sé» quan tingui sentit), per exemple:
   fa servir eines d'IA l'equip (xat, IA integrada en programes); té un xat o assistent automàtic que parla amb clients;
   publica imatges, àudio, vídeo o textos generats o modificats amb IA; fa servir reconeixement d'emocions o classificació
   biomètrica; desenvolupa o ven sistemes d'IA a tercers; mida de l'equip.
2. Resultat (pantalla final): llista d'obligacions **«probables, a valorar»** (mai «obligatòries»), cadascuna amb una frase
   de què vol dir a la pràctica i l'article; si cap no aplica, ho diu amb prudència. Botons: «Fer el diagnòstic gratuït»
   (`/diagnostic`) i «Parla amb nosaltres» (`/#contacte`).
3. `index.html`: `<meta name="robots" content="noindex">` (és un esborrany), cap canònica, `lang="ca"`, mateixa CSP que
   la resta (només `'self'`: cap script en línia ni cap tercer), sense formularis ni peticions de xarxa ni emmagatzematge.
4. Registre «vosaltres», com el diagnòstic. Accessible: botons amb text, focus visible, `prefers-reduced-motion`.
5. `proves/obligacions-ia.mjs`: per a 5-6 combinacions de respostes, comprova les obligacions que en surten. En acabar:
   `totes les comprovacions del test d'IA correctes`.

## Criteris d'acceptació
1. `node proves/obligacions-ia.mjs` correcte.
2. `npm run construir` i `npm run csp` sense infraccions (la carpeta es copia a `dist/`).
3. `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).
4. Al resum: la llista de totes les marques `[REVISAR]`.

## Restriccions
- Res inventat. Sense dependències, secrets ni tercers. No enllacis la pàgina des d'enlloc de la web.

## Lliurament
Commit `WEB-T08: esborrany del test d'obligacions d'IA` a `mistral/WEB-T08`, `git push`, i el resum final d'`AGENTS.md`.
