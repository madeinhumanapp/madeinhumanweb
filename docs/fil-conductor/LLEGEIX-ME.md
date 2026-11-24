# Fil conductor de la portada · paquet per a Claude Code

Prototip de codi del fil animat de madeinhuman.cat (v0.1, 24/11/2026), provat sobre `main` (`65b5767`):
`npm run comprovar` en verd, incloses les proves noves de `npm run fil` (41 comprovacions a quatre mides de pantalla).

## Què hi ha

| Fitxer | Què és |
|---|---|
| `PROMPT-CLAUDE-CODE.md` | L'encàrrec per enganxar a Claude Code. Comença per aquí. |
| `fil-conductor.patch` | El canvi complet sobre `main`. S'aplica amb `git apply --3way fil-conductor.patch`. |
| `fitxers/` | `fil.js`, `fil.css` i `proves/fil.mjs` per separat, per si el pedaç no s'aplica net. El CSS ja va dins de `styles.css` al pedaç. |
| `referencia/` | Captures de com s'ha de veure a 1440 px i a mòbil, en sis punts del recorregut. |

## Què canvia a la web

| Fitxer | Canvi |
|---|---|
| `fil.js` (nou) | El motor del fil. Sense dependències ni peticions externes. |
| `plantilles/base.mjs` | Carrega `/fil.js` només a la portada (una línia). |
| `styles.css` | Deu línies al final: la capa del fil va entre els fons de secció i el contingut. |
| `proves/fil.mjs` (nou) | Prova amb navegador: arrencada, maqueta intacta, mai per sobre del text, CSP, «reduir moviment», sempre en moviment i rendiment. |
| `package.json` | Afegeix `npm run fil`, i també a `npm run comprovar`. |

## Provar-ho en dos minuts

```
git switch -c claude/fil-conductor
git apply --3way fil-conductor.patch
npm ci
npm run navegador          # només si Playwright no té el seu navegador
npm run construir
npm run fil                # → «totes les comprovacions del fil correctes»
python3 -m http.server 8080 -d dist    # i obre http://localhost:8080
```

Amb `node proves/fil.mjs --captures` es desen captures a `captures/fil/` per comparar-les amb `referencia/`.

## Decisions preses

- Només a la portada en català. La portada en castellà es genera amb una altra plantilla i queda per a una v2.
- Sempre es mou. S'atura quan la pestanya no es veu o quan no hi ha cap tros de fil a la pantalla.
- Acaba al cursor que hi ha just després de «Parla amb nosaltres.». El formulari, les preguntes freqüents i les notícies no tenen fil.
- Amb «reduir moviment» activat, el fil surt sencer i quiet. Sense JavaScript, la web queda com ara.

## Estat al repositori (24/11/2026)

El pedaç ja està aplicat a la branca `claude/web-testing-madeinhuman-i7rhdv` (`fil.js`, `proves/fil.mjs`, `styles.css`,
`plantilles/base.mjs`, `package.json`): no cal tornar-lo a aplicar. `npm run comprovar` en verd, `npm run fil` inclòs.
Els fitxers solts de `fitxers/` no es copien aquí perquè ja són a l'arrel i a `proves/`. El pedaç es conserva com a
referència del canvi original. **No es fusiona a `main` sense la confirmació de l'Albert.**

## v0.2 «arrodonit» (branca `demo-fil`)

Petició de l'Albert: la v0.1 semblava «cadenes desfilades»; es vol una simbiosi entre dades i IA. Canvis a `fil.js`:

- Un sol traç per fil (abans tres fibres), més gruixut i suau. Sense el tremolor extra dels fils solts de la capçalera.
- La trena gira lenta: una volta cada 320 px a escriptori (abans 130) i 170 px a mòbil (abans 52); radi 10 / 5,5 px.
- Profunditat gradual (quatre nivells en lloc de davant/darrere): ja no fa l'efecte d'anelles.
- Aura compartida: on els fils es trenen, una llum suau del color barrejat (coure + blau) els embolcalla.
- Extrems rectes al nucli del traç: les juntes ja no fan puntets de llum.
- `?fil=v01` a la URL mostra el prototip anterior per comparar. `madeinhumanFil.estil` diu quin estil s'està fent servir.

`npm run comprovar` en verd (inclou `npm run fil` a les quatre mides). Vista prèvia: `demo-fil.madeinhumanweb.pages.dev`.
