# WEB-L01 — Lot B: revisió lingüística de la web (pàgines legals i aplicacions)

Encàrrec: `docs/encarrecs/WEB-L01-revisio-linguistica.md` (lot B). Entrades de només lectura: `avis-legal.html`,
`politica-privacitat.html`, `politica-cookies.html`, `diagnostic.html`, els textos visibles de `diagnostic.js`,
`necessito-dpo/index.html`, els textos visibles de `necessito-dpo/src/app.js` i `necessito-dpo/dades/regles.js`,
`xarxes/index.html`. Cap fitxer de la web s'ha modificat: això és només una proposta, la responsable aprova o
descarta cada fila.

## 1. Resum

18 propostes en total: 8 de coherència, 5 de puntuació, 2 de gramàtica, 1 d'estil i 2 `[REVISAR]`. Cap proposta
canvia el registre («tu»/«vosaltres») ni el contingut jurídic (les dues files dubtoses van com a `[REVISAR]`). Les
tres més importants: (1) el peu de les tres pàgines legals posa «Intel·ligència Artificial» amb majúscules — és un
nom comú i va en minúscula com a la resta del web; (2) a la política de privacitat i a la de cookies hi ha cometes
rectes `"..."` on toca les tipogràfiques catalanes «...»; (3) la sigla «LSSICE» de la Llei 34/2002 a
`politica-privacitat.html` (a `avis-legal.html` ja és «LSSI-CE»), marcada com a `[REVISAR]` perquè és una citació
legal. `diagnostic.html`, `diagnostic.js`, `necessito-dpo/` i `xarxes/index.html` no tenen cap proposta: els textos
ja són coherents.

## 2. Propostes

### `avis-legal.html`

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 1 | `avis-legal.html` | Identificació del titular, paràgraf | `Llei 34/2002 de Serveis de la Societat de la Informació i del Comerç Electrònic (LSSI-CE)` | `Llei 34/2002 de serveis de la societat de la informació i del comerç electrònic (LSSI-CE)` | coherència | Als títols oficials en català només la primera paraula va en majúscula (mateix criteri que el lot A amb la LOPDGDD). |
| 2 | `avis-legal.html` | Protecció de dades personals, enllaç | `Política de Privacitat` | `Política de privacitat` | coherència | És el títol del document (així consta al seu h1 i al peu); només la primera paraula en majúscula. |
| 3 | `avis-legal.html` | Peu, descripció | `regulació d'Intel·ligència Artificial per a pymes` | `regulació d'intel·ligència artificial per a pymes` | coherència | Nom comú: en minúscula, com al lot A (`index.html`) i a les meta keywords. |

### `politica-privacitat.html`

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 4 | `politica-privacitat.html` | Apartat 1, compromisos | `més informació de la estrictament necessària` | `més informació que la estrictament necessària` | gramàtica | La construcció és «més ... que», no «més ... de». |
| 5 | `politica-privacitat.html` | Apartat 1, legislació | `Llei Orgànica 3/2018 de Protecció de Dades Personals i Garantia dels Drets Digitals (LOPDGDD)` | `Llei orgànica 3/2018 de protecció de dades personals i garantia dels drets digitals (LOPDGDD)` | coherència | Títol oficial en català en minúscules, igual que la proposta del lot A a `script.js`. |
| 6 | `politica-privacitat.html` | Apartat 1, legislació | `Llei 34/2002 de Serveis de la Societat de la Informació (LSSICE)` | `Llei 34/2002 de serveis de la societat de la informació (LSSI-CE)` | [REVISAR] | «LSSICE» no és la sigla habitual de la Llei 34/2002: a `avis-legal.html` ja s'usa «LSSI-CE» (comerç electrònic). És una citació legal: que ho validi la responsable. |
| 7 | `politica-privacitat.html` | Apartat 1, contacte (assumpte) | `indicant a l'assumpte "PROTECCIÓ DE DADES".` | `indicant a l'assumpte «PROTECCIÓ DE DADES».` | puntuació | Cometes tipogràfiques catalanes, com a la resta del web (p. ex. «No ho sé» al diagnòstic). |
| 8 | `politica-privacitat.html` | Apartat 2.2, revocació | `amb l'assumpte "BAIXA".` | `amb l'assumpte «BAIXA».` | puntuació | Cometes tipogràfiques catalanes. |
| 9 | `politica-privacitat.html` | Apartat 2.3, nota WhatsApp | `l'apartat específic de "WhatsApp" d'aquesta política` | `l'apartat específic de «WhatsApp» d'aquesta política` | puntuació | Cometes tipogràfiques catalanes. |
| 10 | `politica-privacitat.html` | Apartat 2.5, base legal | `art. 21 LSSICE` | `art. 21 LSSI-CE` | [REVISAR] | Mateixa sigla que la fila 6: a `avis-legal.html` la Llei 34/2002 és «LSSI-CE». Citació legal: que ho validi la responsable. |
| 11 | `politica-privacitat.html` | Apartat 5, exercici de drets | `indicant a l'assumpte "PROTECCIÓ DE DADES: EXERCICI DE DRETS".` | `indicant a l'assumpte «PROTECCIÓ DE DADES: EXERCICI DE DRETS».` | puntuació | Cometes tipogràfiques catalanes. |
| 12 | `politica-privacitat.html` | Legislació i jurisdicció | `jurisdicció dels Jutjats i Tribunals de Girona` | `jurisdicció dels jutjats i tribunals de Girona` | coherència | Noms comuns en minúscula, com a `avis-legal.html` («jutjats i tribunals de Girona»). |
| 13 | `politica-privacitat.html` | Peu legal (nota final) | `Última actualització: 15 de juny del 2026` | `Darrera actualització: 15 de juny del 2026` | coherència | A la capçalera d'aquesta mateixa pàgina i a les altres dues pàgines legals es diu «Darrera actualització». |
| 14 | `politica-privacitat.html` | Peu, descripció | `regulació d'Intel·ligència Artificial per a pymes` | `regulació d'intel·ligència artificial per a pymes` | coherència | Nom comú: en minúscula, com al lot A (`index.html`). |

### `politica-cookies.html`

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 15 | `politica-cookies.html` | Tipus de cookies, anàlisi | `(ex: Google Analytics)` | `(p. ex.: Google Analytics)` | estil | «ex:» no és l'abreviatura catalana de «per exemple»; ho és «p. ex.». |
| 16 | `politica-cookies.html` | Gestionar el consentiment, banner | `fent clic a l'enllaç "Configurar cookies" que trobaràs` | `fent clic a l'enllaç «Configurar cookies» que trobaràs` | puntuació | Cometes tipogràfiques catalanes (a la mateixa pàgina ja s'usa «Galetes i dades del lloc web»). |
| 17 | `politica-cookies.html` | Informació Art. 13 RGPD, destinataris | `llevat d'obligació legal o necessitat per complir la finalitat` | `llevat d'obligació legal o de necessitat de complir la finalitat` | gramàtica | «Necessitat de complir», no «necessitat per complir». |
| 18 | `politica-cookies.html` | Peu, descripció | `regulació d'Intel·ligència Artificial per a pymes` | `regulació d'intel·ligència artificial per a pymes` | coherència | Nom comú: en minúscula, com al lot A (`index.html`). |

### `diagnostic.html`

Cap proposta.

### `diagnostic.js` (textos visibles)

Cap proposta.

### `necessito-dpo/index.html`

Cap proposta.

### `necessito-dpo/src/app.js` (textos visibles)

Cap proposta. Els textos visibles venen de `necessito-dpo/dades/regles.js`; aquí només hi ha «Pregunta X de Y», neutre.

### `necessito-dpo/dades/regles.js`

Cap proposta. El contingut és jurídic (ja revisat) i els textos van de «tu», coherents.

### `xarxes/index.html`

Cap proposta.

## 3. Registre

Les pàgines legals i `xarxes/` tracten de «tu»; el diagnòstic (`diagnostic.html` i `diagnostic.js`) és de
«vosaltres»; `necessito-dpo/` és de «tu» (ho diu la capçalera de `regles.js`: «Registre: tu (guia de marca)»). No
s'ha proposat cap canvi de registre: només s'inventaria.

| Fitxer | Formes de «tu» | Formes de «vosaltres» | Exemple literal de «tu» | Exemple literal de «vosaltres» |
|---|---|---|---|---|
| `avis-legal.html` | ~10 | 0 | `Si no hi estàs d'acord, et demanem que no continuïs navegant` | — |
| `politica-privacitat.html` | ~35 | 0 | `quins drets tens en relació amb el seu tractament` | — |
| `politica-cookies.html` | ~17 | 0 | `el teu navegador emmagatzema al dispositiu` | — |
| `diagnostic.html` | 0 | ~10 | — | `Responeu 11 preguntes senzilles i rebreu un informe en PDF` |
| `diagnostic.js` | 4 (només al formulari, en jo) | ~20 | `He llegit la política de privacitat i accepto que tracteu les meves dades per enviar-me l'informe` | `Tracteu alguna d'aquestes dades?` |
| `necessito-dpo/index.html` | 3 | 0 | `sabràs si la normativa t'obliga a tenir un delegat de protecció de dades (DPO)` | — |
| `necessito-dpo/src/app.js` | 0 | 0 | — | — (els textos venen de `regles.js`) |
| `necessito-dpo/dades/regles.js` | ~15 | 0 | `La teva organització és una autoritat o un organisme públic?` | — |
| `xarxes/index.html` | 3 | 0 | `Escriu-nos i et responem en menys de 24 hores laborables` | — |

Notes de registre (inventariades, no proposades): a `politica-privacitat.html` i `politica-cookies.html` també
s'usa la tercera persona «l'usuari/els usuaris» (5 vegades a privacitat) dins d'un text de «tu»; al formulari del
diagnòstic hi ha formes en jo («He llegit…, les meves dades, enviar-me l'informe») dins del registre de «vosaltres».

## 4. Proposta de glossari

| Terme preferit | Variants trobades (i on) | Recomanació | Motiu |
|---|---|---|---|
| pimes | `pymes` (peu de `avis-legal.html`, `politica-privacitat.html` i `politica-cookies.html`); `pimes` (`xarxes/index.html`, meta i text visible) | «pimes» als textos visibles; «pymes» només a meta keywords (SEO, lot A) | «pimes» és la forma normativa en català; «pymes» és un castellanisme, però és un terme de cerca habitual (SEO). |
| DPO | `DPO` (títol i meta de `necessito-dpo/index.html`, `regles.js`, botó de `xarxes/index.html`); «delegat de protecció de dades (DPO)» en minúscules (meta de `necessito-dpo/index.html`, entrada de `regles.js`); `DPD` només en un comentari de `regles.js` (no visible) | «DPO» com a sigla (és el terme més cercat); al text, «delegat de protecció de dades (DPO)» en minúscules | Coherència amb el lot A i SEO. Al lot B ja és coherent. |
| AI Act / Reglament d'IA | `AI Act 2025–2028` (peu de les 3 pàgines legals); `Reglament d'IA` (`xarxes/index.html`); `Reglament europeu d'IA` (lot A) | «AI Act» com a sigla (SEO); al text, «Reglament d'IA» o «Reglament europeu d'IA» | Coherència i SEO (lot A). |
| RGPD / LOPDGDD / LSSI-CE | `RGPD` a tot el lot B; `LOPDGDD` (`politica-privacitat.html`, `regles.js`); `LSSI-CE` (`avis-legal.html`) vs `LSSICE` (`politica-privacitat.html`, ×2) | «RGPD» i «LOPDGDD» són correctes; unificar la sigla de la Llei 34/2002 a «LSSI-CE» (files 6 i 10, `[REVISAR]`) | Evitar variants de la mateixa sigla. |
| IA / intel·ligència artificial | `IA` (meta d'`avis-legal.html`; `xarxes/index.html`); `Intel·ligència Artificial` amb majúscules (peu de les 3 pàgines legals) | «IA» com a sigla; «intel·ligència artificial» en minúscula com a nom comú (files 3, 14 i 18) | Coherència (lot A). |
| AEPD / APDCat | Desplegada a `politica-privacitat.html` («Agència Espanyola de Protecció de Dades», amb l'URL); sense desplegar al peu de les 3 pàgines legals i a `regles.js` («l'AEPD o, si correspon, l'APDCat») | Desplegar a la primera menció visible de cada pàgina | El lector pot no conèixer la sigla. |
| aplicació | `apps` (`regles.js`, sector d: «plataformes, apps, comerç en línia…») | «aplicacions» al text; «app» consta al DIEC, però «apps» és anglicisme marcat | Estil; no s'ha proposat canvi (pot ser intencionat). |
| startup | `startups` (`xarxes/index.html`, meta i text) | Mantenir «startups» (terme establert al sector i possible cerca SEO) | No és un error; «empresa emergent» seria massa culte per a aquest registre. |

## 5. Notes

- Hi ha 2 files `[REVISAR]` (files 6 i 10): la sigla «LSSICE» de la Llei 34/2002 a `politica-privacitat.html`.
  A `avis-legal.html` la mateixa llei ja es cita com a «LSSI-CE». És una citació legal, així que no s'ha proposat
  com a canvi directe: que la responsable ho validi i, si s'aprova, Claude ho aplica als dos llocs de
  `politica-privacitat.html`.
- Comentaris HTML trobats però no tocats (no són text visible): `✏️ REVISAR: esborrany afegit amb el diagnòstic
  gratuït (novembre 2026)` i `✏️ REVISAR: proveïdors de l'aplicació de gestió i del diagnòstic` a
  `politica-privacitat.html`, i `✏️ EDITABLE: …` a `diagnostic.html`. Cal resoldre'ls a la font (Claude).
- El peu de `politica-privacitat.html` diu «Versió generada per RGPD-TOOL»: si s'aprova la fila 13
  («Última» → «Darrera actualització»), cal aplicar el canvi també al generador de rgpdtool perquè no es perdi en
  regenerar la pàgina.
- No s'ha proposat cap canvi de registre: el diagnòstic és de «vosaltres» i la resta del lot B de «tu» (apartat 3,
  només inventariat), segons les instruccions de l'encàrrec.
- El contingut jurídic (dates, articles, terminis, imports, organismes, la clàusula d'idioma en castellà) s'ha deixat
  tal qual perquè l'encàrrec indica que ja està revisat.
- `diagnostic.html`, `diagnostic.js`, `necessito-dpo/` i `xarxes/index.html` no tenen cap proposta: preguntes,
  opcions, missatges d'error i resultat ja són coherents en català normatiu.
