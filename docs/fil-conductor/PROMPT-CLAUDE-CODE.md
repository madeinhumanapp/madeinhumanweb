# Prompt per a Claude Code · Fil conductor animat a la portada de madeinhuman.cat

> Copia aquest text a Claude Code, obert al repositori de la web, i adjunta-hi la carpeta del paquet
> (o digue-li on l'has descomprimida).

---

## Context

Sóc l'Albert, de madeinhuman. A la portada de la web vull un fil animat que faci de fil conductor. Són dos fils de llum: el de coure representa les dades i les persones, i el blau, la IA. Neixen solts a la capçalera, es trenen al cursor daurat del logo i acompanyen el scroll fins al contacte.

Ja tenim un prototip validat en vídeo, i aquest paquet en conté el codi. Està provat sobre `main` (`65b5767`): `npm run comprovar` surt en verd, incloses les proves noves de `npm run fil`.

## Decisions preses (no les canviïs sense preguntar-me)

- **Abast:** només a la portada en català (`/`). La portada en castellà (`/es/`) es genera amb `plantilles/serveis.mjs` i queda per a una v2.
- **Moviment:** sempre es mou (trena, polsos de llum i cursor). S'atura quan la pestanya no es veu o quan no hi ha cap tros de fil a la pantalla.
- **Recorregut:**
  - A la capçalera: fils solts → cursor → trena.
  - Context: un punt a cada xifra.
  - Principis 01–04: esses d'un costat a l'altre, amb un nus a cada principi.
  - Serveis: el fil de coure acompanya el pilar d'RGPD i el blau, el d'IA. Es retroben a sota.
  - Mètode: línia de temps amb un cursor a cada fase.
  - Contacte: el fil acaba en un cursor just després de «Parla amb nosaltres.».
  - El formulari, les preguntes freqüents i les notícies no tenen fil.
- **Accessibilitat:** amb «reduir moviment» activat, el fil surt sencer i quiet. Sense JavaScript, la web queda exactament com ara.
- **Privacitat i seguretat:** cap llibreria ni petició externa. Els colors surten de `marca.css` i la CSP actual no s'ha de tocar.

## Què hi ha al paquet

| Fitxer | Què és |
|---|---|
| `fil-conductor.patch` | El canvi complet: `fil.js` (nou), `proves/fil.mjs` (nou), deu línies al final de `styles.css`, la càrrega de `/fil.js` a `plantilles/base.mjs` (només la portada) i `npm run fil` a `package.json`. |
| `fitxers/` | Els mateixos fitxers per separat, per si `main` ha canviat i el pedaç no s'aplica net. |
| `referencia/` | Captures de com s'ha de veure a 1440 px i a mòbil. |

## Tasques, en aquest ordre

1. Llegeix el `CLAUDE.md` del repositori i respecta'l.
2. Actualitza `main` i crea la branca `claude/fil-conductor`.
3. Aplica el pedaç amb `git apply --3way fil-conductor.patch`. Si no s'aplica net, integra-ho a mà amb els fitxers de `fitxers/`. Els canvis als fitxers existents són petits.
4. Executa `npm ci`, `npm run navegador` (si cal), `npm run construir` i `npm run fil`. Ha d'acabar amb «totes les comprovacions del fil correctes». Després executa `npm run comprovar` sencer, que ha de sortir tot en verd, CSP inclosa.
5. Revisió visual:
   - Executa `node proves/fil.mjs --captures` i compara `captures/fil/` amb `referencia/`.
   - Fes les captures d'abans i després que demana el `CLAUDE.md`: `npm run captures -- abans` a `main` i `npm run captures -- despres` a la branca.
6. Prova manual en local amb `python3 -m http.server 8080 -d dist`:
   - Fes scroll amunt i avall: el fil avança i recula, no passa mai per sobre de cap text i no queda endarrerit respecte al text.
   - Activa «reduir moviment» al sistema: el fil ha de sortir sencer i quiet.
   - A la consola, `madeinhumanFil.estat()` mostra els mil·lisegons per fotograma, la qualitat i els punts esvaïts.
7. Fes commit, puja la branca i obre la vista prèvia de Cloudflare Pages (`<branca>.madeinhumanweb.pages.dev`) en un Android de gamma mitjana i en un iPhone. Si va just, ajusta `CONFIG.msObjectiu` o fes que el mòbil arrenqui amb `qualitat = 1`.
8. **No ho fusionis a `main`.** Envia'm un resum amb el resultat de les proves, les captures, com va als dos mòbils i qualsevol canvi que hagis fet al codi.

## Criteris d'acceptació

- `npm run comprovar` en verd, amb `npm run fil` inclòs.
- El fil no es veu mai per sobre d'un text o d'un botó. Ho comprova `npm run fil` a 1280, 1440, 1920 i 390 px.
- La maqueta no canvia: la pàgina té la mateixa alçada i les seccions són a les mateixes posicions amb el fil i sense.
- Cap error de consola ni infracció de CSP.
- Va fluid en un mòbil de gamma mitjana, sense salts visibles. Si no, la qualitat adaptativa s'ha d'activar sola.
- Amb «reduir moviment» i sense JavaScript, es comporta com diuen les decisions.

## Com funciona `fil.js` (per si cal ajustar-lo)

- **`CONFIG.sel`:** els selectors de cada secció. Primer busca `data-fil="…"` i, si no el troba, les classes actuals. Si les plantilles canvien de classes, afegeix `data-fil` als blocs en lloc de tocar el motor.
- **Recorregut:** es calcula amb les posicions reals de les seccions (marges laterals i espais entre blocs). Es recalcula sol quan canvia la maqueta: mida de finestra, tipografies o `ResizeObserver`.
- **Rajoles:** es pinta en rajoles de canvas de 512 px posades dins de la pàgina, no en un canvas fix. Així es desplacen amb el text de manera nativa i el fil no queda endarrerit en fer scroll ràpid. A l'iPhone el scroll va en un fil a part, i un canvas fix hi quedaria uns píxels enrere. **No ho canviïs per un canvas fix.**
- **Sota el text:** si en alguna mida de pantalla el fil passa per sota d'un text o d'un botó, s'hi esvaeix. `npm run fil` diu quants punts s'esvaeixen a cada mida.
- **Qualitat adaptativa:** si un fotograma supera `CONFIG.msObjectiu`, primer treu detall, després baixa la resolució i, al final, passa a 30 fotogrames per segon.
- **Proves:** si `window.FIL_MANUAL = true` es defineix abans de carregar-lo, el fil no s'anima sol, i `madeinhumanFil.render(t, scrollY)` dibuixa un fotograma.

## Regles

- Treballa només a la branca. Res a producció sense la meva confirmació explícita.
- No toquis `contingut/` (és del panell), `wizard/`, `fonts/`, `plantilles/formularis/` ni `proves/contractes/`.
- Cap eina, servei ni tipografia de tercers.
- Tots els textos i comentaris en català.

## Per a una v2 (no ho facis ara)

- La portada en castellà.
- Un interruptor al panell (`lloc.json`) per activar o desactivar el fil.
- Una versió més senzilla per a les pàgines de servei.
- Marcar els blocs amb `data-fil` a `plantilles/blocs.mjs`.
