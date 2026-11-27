---
id: WEB-T14
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T14
estat: obert
fase: 2 (SEO): preparar la validació
---
# WEB-T14 · Revisió lingüística i de to dels 25 esborranys (sectors i guies)

## Objectiu
Que els 25 esborranys arribin al propietari **nets de llengua i de to**, perquè només hagi de revisar el contingut jurídic
(les marques `[REVISAR`). No es canvia cap contingut jurídic ni cap dada: només la llengua.

## Context (llegeix-ho abans)
- `AGENTS.md` (glossari i registre) i `docs/encarrecs/WEB-L01-revisio-linguistica.md` (com es va fer la revisió de la web).
- Els esborranys: `contingut/sectors/*.json` (15: 10 en català i 5 en castellà) i les 10 guies
  `contingut/actualitat/2026-12-0N-*.md` (5 en català i 5 en castellà). Tots tenen `estat: esborrany`.
- Per veure'ls: `node eines/construir.mjs --esborranys` i obre `dist/esborranys/index.html` (taula de tots els esborranys).

## Abast
- **Pots tocar:** el **text** d'aquests 25 fitxers (camps de text i cos Markdown).
- **NO pots tocar:** cap altre fitxer; en aquests 25, cap camp que no sigui text (`slug`, `estat`, `idioma`, `sector`,
  `grup_hreflang`, `servei_relacionat`, `cta_desti`, `articles_relacionats`, `fonts`, `font_url`, `fonts_addicionals`, `data`,
  `etiqueta`, `ninxol`, `tipus_article`); cap marca `[REVISAR: …]` (ni treure-la, ni moure-la, ni canviar-ne el text); cap
  article de llei, termini, xifra, nom d'organisme ni enllaç.

## Què has de revisar
1. **Català normatiu** (ortografia, concordances, apòstrofs, guionets, majúscules dels organismes) i **castellà correcte**.
2. **Registre:** «vosaltres» / «vosotros» per al lector; «nosaltres» / «nosotros» per a la marca. Cap «tu», cap «usted».
3. **Glossari d'`AGENTS.md`** (p. ex. el terme que hi digui per a DPO, encarregat del tractament, galetes…) i **coherència**
   entre les versions ca i es d'un mateix `grup_hreflang` (que diguin el mateix).
4. **To:** frases clares i curtes, sense repeticions ni farciment; prudència («normalment», «a valorar», «depèn de…») on ja hi és.
   No afegeixis promeses, xifres ni afirmacions noves.
5. **Límits** que ja vigila la construcció: `titol_seo` ≤ 60, `descripcio` / `meta_descripcio` ≤ 155, `capsula` 40-60 paraules,
   títols de secció acabats en `?`.

## Criteris d'acceptació
1. `node eines/construir.mjs --esborranys`, `node proves/sectors.mjs`, `node proves/actualitat.mjs`, `node proves/esborranys.mjs`,
   `npm run metadades` i `npm run sense-html` correctes; `npm run construir`: `dist/` de producció idèntic a `main` (no hi surt cap
   esborrany).
2. El nombre de marques `[REVISAR` de cada fitxer és el mateix que abans (posa'l al resum: abans → després).
3. Al resum: per fitxer, els canvis més importants (no cal cada coma) i qualsevol dubte jurídic que hagis vist, com a nota
   per a Claude (sense canviar-lo al text).

## Restriccions
- Només llengua i to. Sense dependències. No t'aturis a preguntar: si dubtes, deixa el text com era i anota-ho.

## Lliurament
Un commit per tipus: `WEB-T14a: revisió dels esborranys de sector` i `WEB-T14b: revisió de les guies`, a `mistral/WEB-T14`,
`git push`, i el resum final d'`AGENTS.md`.
