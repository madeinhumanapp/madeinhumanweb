# WEB-L01 — Lot A: revisió lingüística de la web (portada, FAQ i serveis)

Encàrrec: `docs/encarrecs/WEB-L01-revisio-linguistica.md` (lot A). Entrades de només lectura: `index.html`,
`script.js` i `marca/pagines/contingut.py` (només els textos en català). Cap fitxer de la web s'ha modificat:
això és només una proposta, la responsable aprova o descarta cada fila.

## 1. Resum

18 propostes en total: 10 de coherència, 3 de gramàtica, 2 d'estil, 2 d'ortografia i 1 de puntuació. Cap proposta
canvia el registre («tu»/«vosaltres») ni el contingut jurídic. Les tres més importants: (1) «Intel·ligència
Artificial» i «Delegat de Protecció de Dades» amb majúscules en llocs on són noms comuns — a les pàgines de servei
ja estan en minúscules; (2) articles que faltaven («per a pyme», «no necessiten DPO obligatori»); (3) dues paraules
no catalanes al glossari («biometrics», «obligatoria»).

## 2. Propostes

### `index.html`

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 1 | `index.html` | JSON-LD empresa, descripció | `regulació d'Intel·ligència Artificial (AI Act) per a pymes` | `regulació d'intel·ligència artificial (AI Act) per a pymes` | coherència | Nom comú: en minúscula, com a la resta de la web. |
| 2 | `index.html` | JSON-LD FAQ, resposta 2 | `El Delegat de Protecció de Dades (DPO) és la figura` | `El delegat de protecció de dades (DPO) és la figura` | coherència | Nom comú: en minúscula (a `contingut.py` ja és així). |
| 3 | `index.html` | JSON-LD FAQ, resposta 5 | `Una adequació RGPD per a pyme es completa` | `Una adequació RGPD per a una pyme es completa` | gramàtica | Falta l'article «una» davant de «pyme». |
| 4 | `index.html` | JSON-LD FAQ, resposta 5 | `en 4-8 setmanes` | `en 4–8 setmanes` | coherència | A `script.js` el rang és «4–8»; unifiquem amb guió llarg. |
| 5 | `index.html` | Secció «El context», paràgraf 1 | `L'AEPD i l'APDCat supervisen el seu compliment` | `L'Agència Espanyola de Protecció de Dades (AEPD) i l'Autoritat Catalana de Protecció de Dades (APDCat) supervisen el seu compliment` | estil | Primera menció visible: desplegar les sigles (al glossari de `script.js` ja estan desplegades). |
| 6 | `index.html` | Spot 3, text | `és confiança davant clients i administracions` | `és confiança davant dels clients i les administracions` | estil | Afegim els articles determinats, més normatiu. |
| 7 | `index.html` | Pilar 1, eyebrow | `Protecció de Dades · RGPD` | `Protecció de dades · RGPD` | coherència | A la resta de la web, «protecció de dades» en minúscula. |
| 8 | `index.html` | Pilar 1, llista de serveis | `Delegat de Protecció de Dades (DPO) extern` | `Delegat de protecció de dades (DPO) extern` | coherència | Nom comú: en minúscula, com a `contingut.py`. |
| 9 | `index.html` | Pilar 2, eyebrow | `Reglament d'Intel·ligència Artificial` | `Reglament d'intel·ligència artificial` | coherència | Nom comú: en minúscula (l'eyebrow del servei a `contingut.py` ja és «Intel·ligència artificial · AI Act»). |
| 10 | `index.html` | Notícia 3, cos | `'DPD en xarxa'` | `«DPD en xarxa»` | puntuació | Cometes tipogràfiques catalanes, com a la resta del text («ho estàs fent bé», «adaptar-se a la LOPD»). |
| 11 | `index.html` | Peu, descripció | `regulació d'Intel·ligència Artificial per a pymes` | `regulació d'intel·ligència artificial per a pymes` | coherència | Nom comú: en minúscula, com a la resta de la web. |

### `script.js`

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 12 | `script.js` | FAQ, resposta «Què és un DPO…» | `El Delegat de Protecció de Dades (DPO) és la figura` | `El delegat de protecció de dades (DPO) és la figura` | coherència | Nom comú: en minúscula (a `contingut.py` ja és així). |
| 13 | `script.js` | FAQ, mateixa resposta | `Moltes pymes no necessiten DPO obligatori` | `Moltes pymes no necessiten un DPO obligatori` | gramàtica | Falta l'article «un» davant de «DPO». |
| 14 | `script.js` | FAQ, resposta «Quant temps porta el procés?» | `Una adequació RGPD per a pyme es completa` | `Una adequació RGPD per a una pyme es completa` | gramàtica | Falta l'article «una» davant de «pyme». |
| 15 | `script.js` | FAQ glossari, LOPDGDD | `de Protecció de Dades Personals i Garantia dels Drets Digitals` | `de protecció de dades personals i garantia dels drets digitals` | coherència | Als títols oficials en català només la primera paraula va en majúscula. |
| 16 | `script.js` | FAQ glossari, EIPD | `tractaments biometrics, o sistemes automatitzats` | `tractaments biomètrics, o sistemes automatitzats` | ortografia | «Biomètrics» és la forma catalana. |
| 17 | `script.js` | FAQ glossari, EIPD | `casos en què és obligatoria` | `casos en què és obligatòria` | ortografia | Forma catalana (femení), no castellana. |

### `marca/pagines/contingut.py` (només textos en català)

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 18 | `marca/pagines/contingut.py` | Pàgina «adequacio», secció «Quant costa i quant dura» | `es completa en 4 a 8 setmanes` | `es completa en 4–8 setmanes` | coherència | Unifiquem el rang amb la portada («4–8» a `script.js`, «4-8» al JSON-LD d'`index.html`). |

## 3. Registre

La portada i els serveis tracten de «tu»; el diagnòstic (fora del lot A) i el formulari d'adequació de la portada,
de «vosaltres». No s'ha proposat cap canvi de registre: només s'inventaria.

| Fitxer | Formes de «tu» | Formes de «vosaltres» | Exemple literal de «tu» | Exemple literal de «vosaltres» |
|---|---|---|---|---|
| `index.html` | ~19 (tot el text general) | 9 (només al formulari d'adequació) | `Si tens un dubte, escriu-nos` | `Tracteu dades de salut, ideologia, sindicats o similars?` |
| `script.js` | ~18 (FAQ i missatges dels formularis) | 2 (`Treballeu…`, `la vostra…`) | `Si vols saber si en necessites un` | `Treballeu fora de Catalunya?` |
| `marca/pagines/contingut.py` (ca) | ~22 | 0 | `Analitzem quines dades tractes` | — |

Al formulari d'adequació d'`index.html` les formes de «vosaltres» són: `Tracteu`, `Feu servir` (×2), `Teniu` (×3),
`Envieu`, `Formeu part` i `considereu` (al placeholder). A `script.js`, el missatge d'èxit del formulari d'adequació
diu `amb la vostra proposta`.

## 4. Proposta de glossari

| Terme preferit | Variants trobades (i on) | Recomanació | Motiu |
|---|---|---|---|
| pimes | `pymes` (títol, meta keywords, descripció JSON-LD, secció «El context» i lead de la FAQ d'`index.html`; FAQ Q2 i Q8 de `script.js`); `pyme` (FAQ del JSON-LD d'`index.html`; FAQ Q1, Q5 i Q6 de `script.js`; pàgina «adequacio» de `contingut.py`) | «pimes» als textos visibles; «pymes» només a `meta keywords` | «pimes» és la forma normativa en català; «pymes» és un castellanisme, però és un terme de cerca habitual (SEO). |
| DPO | `DPD` (glossari de la FAQ «DPO / DPD» i notícia 3 «DPD en xarxa» d'`index.html`); «Delegat de Protecció de Dades» amb majúscules (JSON-LD i FAQ d'`index.html`, FAQ de `script.js`, llista del pilar 1) vs «delegat de protecció de dades» en minúscules (`contingut.py`) | «DPO» com a sigla (és el terme més cercat); al text, «delegat de protecció de dades (DPO)» en minúscules | Coherència entre pàgines i SEO. |
| AI Act | «Reglament d'IA», «Reglament europeu d'IA», «Reglament (UE) 2026/1744», «Reglament Intel·ligència Artificial» (`knowsAbout` d'`index.html`) | «AI Act» com a sigla (SEO); al text, «Reglament d'IA» o «Reglament europeu d'IA»; «intel·ligència artificial» sempre en minúscules | Coherència i SEO. |
| RGPD / LOPDGDD | «LOPD» (com a «l'antiga LOPD» i keyword «LOPD Girona») | «RGPD» i «LOPDGDD» són correctes; «LOPD» només per referir-se a l'antiga llei o a les keywords SEO | Evitar confusió amb la llei derogada. |
| IA / intel·ligència artificial | «Intel·ligència Artificial» amb majúscules (descripció JSON-LD, eyebrow del pilar 2 i peu d'`index.html`); «intel·ligència artificial» en minúscules (peu de `contingut.py`, meta keywords) | «IA» com a sigla; «intel·ligència artificial» en minúscules com a nom comú | Coherència. |
| AEPD | Sigla sense desplegar a la primera menció visible d'`index.html` (hero-meta i secció «El context»); desplegada al glossari de `script.js` | Desplegar a la primera menció (proposta 5) | El lector pot no conèixer la sigla. |
| APDCat | Igual que AEPD | Desplegar a la primera menció (proposta 5) | El lector pot no conèixer la sigla. |
| AESIA | Desplegada a la FAQ de `script.js` («Agència Espanyola de Supervisió de la IA») | Correcte tal qual | — |

## 5. Notes

- No hi ha cap fila `[REVISAR]`: el contingut jurídic (dates del Reglament d'IA, xifres de l'AEPD, imports,
  articles) s'ha deixat tal qual perquè l'encàrrec indica que ja està revisat.
- La llista `knowsAbout` del JSON-LD d'`index.html` és de paraules clau SEO: s'hi ha deixat «Reglament
  Intel·ligència Artificial» i «Delegat Protecció Dades» tal qual (poden ser variacions intencionades per a
  cerques); es recullen aquí al glossari.
- No s'ha proposat cap canvi de registre (l'apartat 3 només inventaria) ni de «pymes»/«pimes» (apartat 4), segons
  les instruccions de l'encàrrec.
- Les mètriques i la secció «Actualitat» contenen dates i xifres (2026, 30.931, +64%, 48,1 milions d'euros) que no
  s'han tocat.
