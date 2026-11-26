---
id: WEB-T06
assignat: gemini
zona: verda
base: main
branca: gemini/WEB-T06
estat: obert
fase: 2 (base SEO)
---
# WEB-T06 · Plantilla d'article per a SEO

## Objectiu
Que una notícia de `contingut/actualitat/*.md` pugui ser un **article** complet per a Google: descripció pròpia,
data de revisió jurídica visible, bloc de fonts, crida a l'acció i dades estructurades `Article`. Tots els camps nous
són opcionals: les notícies que ja hi ha han de quedar **idèntiques**.

## Context (llegeix-ho abans)
- `AGENTS.md` i `eines/LLEGEIX-ME.md` (apartat «Notícies»: format del frontmatter).
- `esquema/blocs.mjs`: `CAMPS_NOTICIA` i `validarNoticia`. El panell de rgpd-tool llegeix aquests camps de l'esquema
  exportat: un camp nou apareix sol al formulari del panell (per això cal `npm run exportar-esquema`).
- `plantilles/actualitat.mjs`: `llegirNoticia` (frontmatter de línies `clau: valor`), pàgina de notícia (H1, font,
  servei relacionat, JSON-LD `NewsArticle`), llistat i RSS.
- `proves/actualitat.mjs`: proves amb notícies de prova (fitxers temporals).

## Abast
- **Pots tocar:** `esquema/blocs.mjs` (només `CAMPS_NOTICIA`, `validarNoticia` i constants noves al costat),
  `esquema/esquema.json` (regenerat amb l'ordre), `plantilles/actualitat.mjs`, `styles.css` (només classes noves per a
  la barra de revisió, el bloc de fonts i la crida), `proves/actualitat.mjs`, `eines/LLEGEIX-ME.md` (apartat «Notícies»).
- **NO pots tocar:** `contingut/` (cap notícia), `plantilles/formularis/`, `proves/contractes/`, `.github/`, `_headers`,
  `diagnostic.html`, `recollida.html`, `wizard/`, ni cap altre fitxer.

## Camps nous (tots opcionals, frontmatter d'una sola línia cadascun)
| Camp | Tipus | Què fa |
|---|---|---|
| `meta_descripcio` | text, màx. 155 | Si hi és, substitueix `resum` a `<meta name="description">` i a `og:description` |
| `data_revisio` | data | Mostra sota el H1 la barra «Darrera revisió jurídica: {data llarga} · {revisat_per}» i és el `dateModified` del JSON-LD (si no hi és, `dateModified` = `data`) |
| `revisat_per` | text, màx. 120 | Text de la barra. Si hi ha `data_revisio` i aquest camp és buit, s'hi posa exactament: «Revisat per un consultor RGPD i DPO extern de madeinhuman» |
| `ninxol` | selecció: `general`, `salut`, `educacio`, `comerc`, `serveis`, `hostaleria`, `social`, `saas` | Metadada per filtrar més endavant; no canvia res visible |
| `tipus_article` | selecció: `noticia`, `guia` (per defecte `noticia`) | `noticia` → JSON-LD `NewsArticle` (com ara); `guia` → `Article` |
| `fonts_addicionals` | text, màx. 600: URL separades per ` \| ` | Totes han de començar per `https://`. Amb `font_url`, formen el bloc «Fonts» al final i el `citation` del JSON-LD |
| `cta_desti` | selecció: `diagnostic`, `contacte`, `servei` | Caixa final amb un botó: `/diagnostic`, `/#contacte` o la pàgina de `servei_relacionat` (amb `servei`, `servei_relacionat` és obligatori) |
| `cta_text` | text, màx. 80 | Text del botó. Si és buit: «Fer el diagnòstic gratuït», «Parla amb nosaltres» o «Veure el servei» |

**No** facis ara `idioma: es` ni `grup_hreflang` (vindran en un altre encàrrec).

## Què has de fer
1. Afegeix els camps a `CAMPS_NOTICIA` amb etiquetes i ajudes en català, i les validacions de la taula a `validarNoticia`
   (URL `https://`, `servei` sense `servei_relacionat`, llargades). Executa `npm run exportar-esquema`.
2. A la pàgina de notícia: barra de revisió sota el H1 (només si hi ha `data_revisio`), bloc «Fonts» (llista d'enllaços
   amb `rel="noopener"` i `target="_blank"`; si només hi ha `font_url`, es manté la línia «Font: …» d'ara), caixa de
   crida a l'acció (només si hi ha `cta_desti`), `meta_descripcio` i JSON-LD (`@type`, `dateModified`, `citation`).
   Autor i editor continuen sent `#empresa` (`m.empresa_ld()`).
3. Estils: classes noves, colors només de `marca.css` (cap color nou), sense animacions.
4. Proves a `proves/actualitat.mjs` amb una notícia de prova que tingui **tots** els camps nous i una altra **sense cap**:
   - la sense camps nous genera exactament el mateix HTML que abans (compara-ho amb el resultat de `main`);
   - la completa té la barra, el bloc de fonts amb totes les URL, la crida amb el destí correcte, `meta description` =
     `meta_descripcio`, i JSON-LD `Article` amb `dateModified` i `citation`;
   - es rebutgen: URL sense `https://`, `cta_desti: servei` sense `servei_relacionat`, `meta_descripcio` de més de 155.
5. Documenta els camps nous a `eines/LLEGEIX-ME.md` (exemple de frontmatter).

## Criteris d'acceptació
1. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`.
2. `npm run actualitat` → `totes les comprovacions de l'actualitat correctes` (amb les noves).
3. `npm run construir` sense errors i les 3 notícies actuals sense cap canvi a `dist/`.
4. `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).

## Restriccions
- Sense dependències noves, secrets ni tercers. Textos visibles en català. Res inventat.

## Lliurament
Commit `WEB-T06: plantilla d'article per a SEO` a `gemini/WEB-T06`, `git push`, i el resum final d'`AGENTS.md`.
