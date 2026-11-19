# Generador de la web i proves (prototip del pla del panell)

Pla complet: `rgpdtool/docs/panell-web/` (repositori privat).
Encara no es publica així: Cloudflare continua servint els fitxers de l'arrel. Aquestes carpetes
són a `.assetsignore` i no surten a la web.

## Carpetes

| Carpeta | Què hi ha |
|---|---|
| `contingut/` | El text de la web: `lloc.json` (contacte, menú, peu, SEO comú) i `pagines/*.json` (blocs de cada pàgina) |
| `esquema/` | Quins blocs hi ha, quins camps tenen i amb quins límits. Valida i genera els formularis del panell |
| `plantilles/` | Disseny: `base.mjs` (cap, menú, peu), `blocs.mjs` (un bloc = una funció), `formularis/` (protegits) |
| `eines/` | `construir.mjs` (contingut → `dist/`), `extreure-portada.mjs` (migració única), `previsualitzacio/` |
| `proves/` | Contractes amb rgpd-tool, paritat amb la web actual i seguretat de la vista prèvia |

## Ordres

```bash
node eines/construir.mjs                          # genera dist/ (sense dependències, ~20 ms)
node proves/paritat.cjs --a . --b dist            # dist/ ha de ser idèntic a la web actual
node proves/formularis.cjs --arrel dist           # els formularis envien a rgpd-tool el mateix que abans
node proves/previsualitzacio.cjs                  # vista prèvia: plantilles, injecció, cap lead fals
node proves/formularis.cjs --desar                # NOMÉS si un canvi de contracte és volgut (i s'ha fet a rgpd-tool)
```

Les proves fan servir Playwright (`require('playwright')`) i no surten a internet: tot es serveix en local.

## Text enriquit al contingut

Només `*cursiva*`, `**negreta**`, salt de línia i `[enllaç](/ruta)`. Cap etiqueta HTML: el validador la rebutja.

## Regles que protegeixen els connectors amb rgpd-tool

- Els formularis són blocs `formulari`: l'HTML és a `plantilles/formularis/` i només se n'editen el titular i l'entradeta.
  Els `name=""` i els valors de les opcions són dades de l'API (`proves/contractes/`).
- A la portada, els enllaços interns són àncores (`#contacte`), no `/#contacte`: si no, es perden els `utm_*`.
- URL que fan servir els correus i no es poden moure: `/#contacte`, `/recollida.html?token=…`,
  `/diagnostic.html?ref=…`, `/politica-privacitat.html` (llista completa a `proves/contractes/urls-estables.json`).
