---
id: WEB-T09
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T09
estat: obert
fase: 2 (SEO)
---
# WEB-T09 · Textos legals en castellà publicats

## Objectiu
Publicar l'avís legal, la política de privacitat i la política de galetes en castellà, enllaçats amb les versions
catalanes amb `hreflang`, i fer que la part en castellà de la web enllaci a aquestes versions.
**No es fusiona fins que el propietari validi els textos** (és contingut jurídic): la vista prèvia de la branca serveix per revisar-los.

## Context (llegeix-ho abans)
- `AGENTS.md` (glossari) i `docs/encarrecs/WEB-L04-legal-castella.md`.
- `docs/traduccions/legal/`: esborranys en castellà (`aviso-legal.md`, `politica-privacidad.md`, `politica-cookies.md`).
  Les dues primeres línies de cada esborrany són comentaris amb el títol, l'entradeta i la nota final.
- `contingut/legal/*.md`: els textos catalans **actuals** (font de veritat). Fan servir `{{adreca}}` i `{{correu}}`.
- `contingut/pagines/avis-legal.json`, `politica-privacitat.json`, `politica-cookies.json`: les pàgines catalanes
  (`plantilla: "legal"`, `cos`, `cap`).
- `plantilles/legal.mjs`: la plantilla de les pàgines legals (cap propi: avui no pinta `hreflang`).
- `contingut/lloc.json`: el peu en castellà (`peu.es`) enllaça avui als textos legals catalans.

## Abast
- **Pots crear:** `contingut/legal/aviso-legal.md`, `contingut/legal/politica-privacidad.md`,
  `contingut/legal/politica-cookies-es.md`, `contingut/pagines/aviso-legal.json`, `contingut/pagines/politica-privacidad.json`,
  `contingut/pagines/politica-cookies-es.json`.
- **Pots tocar:** `contingut/pagines/avis-legal.json`, `politica-privacitat.json`, `politica-cookies.json` (només per afegir
  `cap.alternatives`), `plantilles/legal.mjs` (només per pintar `cap.alternatives` com a `<link rel="alternate" hreflang>`,
  igual que `plantilles/base.mjs`), `contingut/lloc.json` (només els enllaços legals de `peu.es`), i una prova nova
  `proves/legal-castella.mjs` (sense navegador).
- **NO pots tocar:** els textos catalans de `contingut/legal/`, `contingut/faq*.json`, `plantilles/formularis/`,
  `proves/contractes/`, `.github/`, `_headers`, `diagnostic.html`, `recollida.html`, `wizard/`.

## Què has de fer
1. Textos (`contingut/legal/*.md` en castellà): parteix de l'esborrany, però el que mana és el **text català actual**.
   Compara'ls apartat per apartat: on el català actual digui una cosa diferent de la que tradueix l'esborrany, tradueix el
   català actual i marca-ho amb `[REVISAR: canviat respecte a l'esborrany]`. Treu els comentaris HTML de l'esborrany
   (cap HTML al contingut). Fes servir `{{adreca}}` i `{{correu}}` als mateixos llocs que el català.
2. Pàgines (`contingut/pagines/*.json` nous): com les catalanes, amb `idioma: "es"`, rutes
   `/es/aviso-legal/`, `/es/politica-privacidad/`, `/es/politica-cookies/` (fitxers `es/…/index.html`), `robots` igual que
   la catalana (`noindex, follow`), títol, descripció (≤ 155), etiqueta, títol, entradeta i nota final en castellà (els de
   la capçalera de l'esborrany).
3. `cap.alternatives` a les sis pàgines: `ca` → catalana, `es` → castellana, `x-default` → catalana. La plantilla legal
   les ha de pintar.
4. `contingut/lloc.json`: al peu en castellà, els enllaços a l'avís legal, la privacitat i les galetes apunten a les
   versions castellanes (i treu «(catalán)» si hi és en aquests tres).
5. `proves/legal-castella.mjs`: comprova a `dist/` que hi ha les tres pàgines `es`, amb `lang="es"`, canònica, `noindex`,
   parell `hreflang` recíproc amb la catalana i sense cap marca `{{…}}` sense substituir; i que el peu de `/es/` enllaça a
   les tres. En acabar: `totes les comprovacions dels textos legals en castellà correctes`.

## Criteris d'acceptació
1. `npm run construir` sense errors (3 pàgines més).
2. `node proves/legal-castella.mjs`, `npm run hreflang`, `npm run domicili` i `npm run sitemap` correctes
   (`domicili`: l'adreça també pot sortir a les versions castellanes de l'avís legal i de la privacitat).
3. `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).
4. Al resum: la llista de totes les marques `[REVISAR]`.

## Restriccions
- Res inventat: només traduir. Castellà jurídic correcte. Sense HTML al contingut.

## Lliurament
Commit `WEB-T09: textos legals en castellà` a `mistral/WEB-T09`, `git push`, i el resum final d'`AGENTS.md`.
