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

## v0.3 «premium» (branca `demo-fil`)

Petició de l'Albert: un toc més premium i detallat, que el fil no quedi mai sota cap capa de la web i espurnes elegants.

**Capes.** Una prova per píxels va trobar que la quadrícula de la capçalera (`.grid-lines`) pintava per sobre del fil i
que les vores de les targetes del mètode i de la «crossover» (mòbil) en tallaven les resplendors. Ara:

- La capa del fil va per sobre de tot el contingut (`z-index: 30`) i per sota de les capes fixes (navegació 50, barra
  de progrés 100, botons flotants 998-999, bàner de galetes). Les regles `.amb-fil … > .container` ja no calen.
- Màscara suau: el fil no pinta mai res sobre el text, els controls (botons, camps) ni la imatgeria (img, svg, vídeo).
  Abans es veia a un 10 % sota el text i el cursor final deixava llum sobre «nosaltres.»; ara s'esvaeix del tot.
- S'esvaeix abans d'arribar a la navegació, als botons flotants (inclosa l'ona del de WhatsApp) i al bàner de galetes:
  no sembla mai que passi per sota de res. Aquestes capes es mesuren a cada fotograma.

**Detall.** Reflex de fibra òptica a la cara de davant de cada fil, que s'encén a poc a poc en girar; profunditat
contínua en 8 nivells i halo d'un sol traç (sense taques ni esglaons); òrbita amb satèl·lit als nusos dels principis
i una ona que s'eixampla a les xifres.

**Espurnes.** Destells d'intercanvi (estrella de quatre puntes) on els fils es creuen, amb espurnetes que se'n
desprenen; cap de cometa amb rastre als polsos de llum; pols d'or que llisca dins l'aura; estrella amb tres motes a la
punta. Cap no surt prop d'un text. Amb «reduir moviment» no n'hi ha cap. Paràmetres a `C.esp` (`construir`).

**Rendiment.** Espurnes amb sprites precalculats i preparades un cop per fotograma, camins creats només si es fan servir,
polsos de llum agrupats per intensitat i estils de les rajoles escrits només quan canvien. Mòbil 390 px amb la CPU ×4:
5–8 ms per fotograma (la v0.2 sense optimitzar en feia 6–7). La qualitat adaptativa treu primer la pols i les
espurnetes (qualitat 1) i després totes les espurnes i els halos (qualitat 0).

**Proves noves a `npm run fil`** (58 comprovacions): per píxels a les quatre mides, cap capa tapa el fil (es pinta de
magenta i es comprova a la captura), cap llum sobre el text, els controls ni la imatgeria, res sota la navegació ni els
botons flotants; hi ha espurnes; cap espurna amb «reduir moviment»; res sota el bàner de galetes. La prova de capes es
va validar en negatiu: amb la capa antiga (`z-index: 1`) falla.

`?fil=v02` i `?fil=v01` mostren les versions anteriors (amb les capes i màscares noves). `madeinhumanFil.estil` diu
quina s'està fent servir.

## Portada més visual i lleugera (branca `demo-fil`, 25/11/2026)

Petició de l'Albert després de provar la v0.3 a l'iPhone: menys text, més visual, transicions fluides i llenguatge
planer. Pla aprovat: menys blocs, notes al fil, Venn als serveis, finestres de resum i adequació destacada.

**Contingut (`contingut/pagines/portada.ca.json`, editable des del panell):**
- Fora el bloc de context: les 3 dades clau són ara **notes** (bloc nou `nota`: `clau`, `text`, `font`, `costat`,
  `to`) al llarg del fil: «2018», «30.931» i «2026».
- Principis sense número (`spot.num` és opcional). El 04 i el 05 estan **amagats** (`amagat: true`), no esborrats.
- Serveis: bloc `serveis` nou, amb 2 àmbits (`insignia`, `subtitol`, `titol`, `promesa`, `resultats` [1-3] i `enllacos`
  [pàgines /serveis/…/]) i `junts` (el que tenen en comú). Fora la consultoria transversal i «En detall».
- Formulari d'adequació: camp opcional `avantatges` (marcador `{{avantatges}}` a `plantilles/formularis/adequacio.html`;
  cap `name=""` tocat).
- Textos reescrits més curts (pendents de la revisió de l'Albert a la vista prèvia).

**Comportament (`portada.js`, nou):**
- Venn: `--fusio` (0 → 1) segons el scroll. A l'escriptori, els àmbits creixen l'un cap a l'altre fins a
  superposar-se. Al mòbil i a la tauleta, l'àmbit d'IA puja fins a la juntura amb «Junts». Sense JavaScript o amb
  «reduir moviment», es veu fusionat.
- Ítems dels serveis amb vora de llum (`conic-gradient` amb `@property`, només gira a la pantalla). En fer-hi clic,
  finestra (`<dialog>`) amb l'entradeta de la pàgina del servei (`serveis.json`), la X, Esc i clic fora per tancar, i
  «Vols més detalls? Els trobaràs aquí». Sense JavaScript, són enllaços.
- `pagina()` (`plantilles/base.mjs`) rep `serveis.json` com a 8è paràmetre. El generador i la vista prèvia del panell
  l'hi passen.

**Fil:** recorregut per estacions (notes, principis, context si n'hi ha) amb un costat cadascuna. A cada nota, un
punt i una línia de llum cap a la xifra. Als serveis, el coure baixa per l'àmbit de RGPD i el blau pel d'IA, i es
retroben al mig, sota «Junts».

**Proves:**
- `npm run portada` (nova, a `comprovar`): fusió progressiva sense retrocessos; quan el fil arriba a la juntura, la
  fusió és completa; cap text tapat; finestres (contingut, tancament i focus); zones de toc; sense desbordament; sense
  JavaScript; «reduir moviment».
- `npm run serveis`: validació dels blocs nous.

**Pendent:** revisió dels textos per l'Albert, prova a l'iPhone, portada en castellà (segona fase) i, abans de
fusionar, comprovar que la branca `esborrany` del panell no tingui canvis a `portada.ca.json`.
