# Generador de la web i proves (prototip del pla del panell)

Pla complet: `rgpdtool/docs/panell-web/` (repositori privat).
Encara no es publica així: Cloudflare continua servint els fitxers de l'arrel. Aquestes carpetes
són a `.assetsignore` i no surten a la web.

## Carpetes

| Carpeta | Què hi ha |
|---|---|
| `contingut/` | El text de la web: `lloc.json` (contacte, menú, peu, SEO comú), `pagines/*.json` (blocs de cada pàgina), `actualitat/*.md` (notícies) |
| `esquema/` | Quins blocs hi ha, quins camps tenen i amb quins límits. Valida i genera els formularis del panell |
| `plantilles/` | Disseny: `base.mjs` (cap, menú, peu), `blocs.mjs` (un bloc = una funció), `formularis/` (protegits) |
| `eines/` | `construir.mjs` (contingut → `dist/`), `extreure-portada.mjs` (migració única), `previsualitzacio/` |
| `proves/` | Contractes amb rgpd-tool, paritat amb la web actual i seguretat de la vista prèvia |

## Ordres

```bash
npm ci && npm run navegador      # el primer cop: Playwright i el navegador de proves
npm run construir                # genera dist/ (sense dependències, ~25 ms)
npm run paritat                  # dist/ ha de ser idèntic a la web actual (19/19)
npm run contractes               # els formularis envien a rgpd-tool el mateix que abans (4 «ok»)
npm run previsualitzacio         # vista prèvia: plantilles, injecció, cap lead fals (7/7)
npm run actualitat               # notícies: llistat, pàgines, RSS, programació i validacions (sense navegador)
npm run sense-html               # cap etiqueta HTML dins de contingut/
npm run comprovar                # totes seguides (és el que fa GitHub Actions)
node proves/formularis.cjs --desar   # NOMÉS si un canvi de contracte és volgut (i s'ha fet primer a rgpd-tool)
```

Les proves fan servir Playwright i no surten a internet: tot es serveix en local.
Encàrrecs per a Mistral: `docs/encarrecs/` i `AGENTS.md`.

## Text enriquit al contingut

Només `*cursiva*`, `**negreta**`, salt de línia i `[enllaç](/ruta)`. Cap etiqueta HTML: el validador la rebutja.

## Regles que protegeixen els connectors amb rgpd-tool

- Els formularis són blocs `formulari`: l'HTML és a `plantilles/formularis/` i només se n'editen el titular i l'entradeta.
  Els `name=""` i els valors de les opcions són dades de l'API (`proves/contractes/`).
- A la portada, els enllaços interns són àncores (`#contacte`), no `/#contacte`: si no, es perden els `utm_*`.
- URL que fan servir els correus i no es poden moure: `/#contacte`, `/recollida.html?token=…`,
  `/diagnostic.html?ref=…`, `/politica-privacitat.html` (llista completa a `proves/contractes/urls-estables.json`).

## Notícies (`contingut/actualitat/`)

Un fitxer per notícia: `AAAA-MM-DD-titol-curt.md` (minúscules, sense accents). El títol curt fa l'URL:
`/actualitat/titol-curt/`. És el mateix format dels esborranys de Mistral (rgpdtool, encàrrec WEB-A05).

```
---
titol: "…"                 # fins a 130 caràcters (millor fins a 70)
resum: "…"                 # targeta i meta description (millor fins a 160)
data: 2026-11-20           # no surt a la web abans d'aquest dia (hora de Madrid)
etiqueta: rgpd             # rgpd | ia | apdcat
font_nom: "AEPD"
font_url: "https://…"      # obligatori per publicar una notícia amb cos
data_font: 2026-11-03      # opcional
servei_relacionat: auditoria   # opcional: adequacio | dpo | auditoria | ia | web
estat: publicat            # esborrany | publicat
idioma: ca
---

## Què ha passat
…
---
Notes de revisió: tot el que hi ha després d'aquesta línia no es publica mai.
```

- **Amb cos** (Markdown de `plantilles/markdown.mjs`): pàgina pròpia, i la targeta enllaça a la pàgina.
  **Sense cos** («breu»): només targeta.
- Surten al llistat `/actualitat/`, al canal `/actualitat/rss.xml` i al mapa del lloc. A la portada, el bloc
  `actualitat` amb `"origen": "actualitat"` mostra les 3 últimes; si no n'hi ha cap de publicada, la llista manual.
- Una notícia amb `estat: publicat` i qualsevol `[REVISAR` no deixa construir la web.
- Programació: una notícia publicada amb data futura surt a la primera construcció d'aquell dia
  (`DATA_CONSTRUCCIO=AAAA-MM-DD npm run construir` simula un altre dia). Quan hi hagi panell, un cron reconstruirà
  la web cada matí (WEB-A03).
- `data_text` i `font_text` només serveixen perquè les notícies migrades (WEB-A02) es vegin igual que abans.
- El repositori de la web és públic: els esborranys es preparen a rgpdtool (`docs/panell-web/esborranys/`), no aquí.

## Pàgines que no surten del contingut

- `diagnostic.html`, `necessito-dpo/` i `recollida.html` són aplicacions: el seu text és dins del seu JavaScript
  o de les seves dades, i el diagnòstic i la recollida són connectors amb rgpd-tool. El generador les copia tal
  qual; la paritat i els contractes les vigilen. El panell no les edita (decisió C-09).
- `xarxes/` sí que surt del contingut (`contingut/pagines/xarxes.json`, plantilla `plantilles/xarxes.mjs`).
