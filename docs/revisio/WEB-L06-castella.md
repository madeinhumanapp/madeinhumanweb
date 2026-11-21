# WEB-L06 — Revisió lingüística de les pàgines en castellà

Encàrrec: `docs/encarrecs/WEB-L06-castella.md`. Camps llegits (només lectura): `contingut/serveis.json`
(`PAGINES.<servei>.es` amb tots els camps i `seccions`, `PORTADA_ES` i `COMU.es`) i `contingut/lloc.json`
(`menu.es` i `peu.es`). Cap fitxer de contingut s'ha modificat: això és només una proposta, la responsable aprova o
descarta cada fila. Els camps `titol_seo` i `descripcio` (títols i descripcions per a Google) són fora d'abast (WEB-L05)
i no s'hi proposa cap canvi.

## 1. Resum

4 propostes en total: 3 de traducció (calc del català) i 1 de coherència. Cap proposta canvia el registre («tu»), el
contingut jurídic, xifres o terminis. Les tres més importants: (1) «se completa en 4 a 8 semanas» → «se completa en
4-8 semanas» (rang calc del català «4–8»); (2) «pero sí a que alguien se haga responsable» → afegir-hi «de ello», perquè
el català «se'n faci responsable» porta el pronominal i en castellà «hacerse responsable» exigeix objecte; (3) «qué se
puede introducir y qué no» → «qué se puede poner y qué no», perquè «introducir» és ambigu (poden semblar eines) i el
català diu «posar». Cometes: s'ha triat «» perquè és el que ja fan servir les pàgines en castellà — les úniques cometes
del contingut en castellà són «LOPD» i «adaptarse a la LOPD» a `PAGINES.adequacio.es.seccions[1]`—; no es proposa
canviar-les. El conjunt en castellà està ben escrit: no s'hi ha trobat cap «pimes», «DPD», «vosotros» ni «usted», i la
terminologia («pymes», «DPO», «RGPD», «LOPDGDD», «IA», «AI Act», «LSSI») segueix el glossari.

## 2. Propostes

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 1 | `contingut/serveis.json` | `PAGINES.adequacio.es` · `seccions[2].cos` | `se completa en 4 a 8 semanas` | `se completa en 4-8 semanas` | traducció | En castellà el rang és «4-8» o «de 4 a 8»; «en 4 a 8» és calc del català «en 4–8 setmanes». |
| 2 | `contingut/serveis.json` | `PAGINES.dpo.es` · `lede` | `pero sí a que alguien se haga responsable` | `pero sí a que alguien se haga responsable de ello` | traducció | El català «però sí algú que se'n faci responsable» porta el pronominal «en»; en castellà «hacerse responsable» necessita objecte («de ello»). |
| 3 | `contingut/serveis.json` | `PAGINES.ia.es` · `seccions[1].cos` | `qué se puede introducir y qué no` | `qué se puede poner y qué no` | traducció | «Introducir» és ambigu (poden semblar eines que s'introdueixen); el català diu «posar» i en castellà «poner» és inequívoc per a contingut. |
| 4 | `contingut/serveis.json` | `PAGINES.auditoria.es` · `seccions[0].cos` | `que acceden a los datos (RGPD, art. 28)` | `que acceden a tus datos (RGPD, art. 28)` | coherència | A `PAGINES.adequacio.es` es diu «tus datos»; amb el tractament «tu» que té la web, «tus datos» és més coherent. |

## 3. Notes

- **Registre:** totes les pàgines en castellà tracten de «tu» (tratas, usas, tienes, vendes, puedes); no s'hi ha trobat
  cap «vosotros»/«usted», així que no es proposa res.
- **Terminologia:** «pymes» (mai «pimes»), «DPO», «RGPD», «LOPDGDD», «IA», «AI Act» i «LSSI» coincideixen amb el
  glossari aprovat; tampoc hi ha «DPD» en castellà.
- **«Girona»** es manté també en castellà, com a totes les pàgines `/es/` i a la marca; no es proposa «Gerona».
- **Contingut jurídic** (articles 30, 35, 28, 37.1, 34.3 i 37.7; 25 de mayo de 2018; 2.000–6.000 €; calendari del
  Reglament d'IA) s'ha deixat tal qual, com indica l'encàrrec.
- Els enllaços a eines només en català (`/diagnostic.html`, `/necessito-dpo/`, pàgines legals) ja porten l'avís
  «(catalán)» / «(de momento, en catalán)»; s'ha comprovat que és així i no es proposa cap canvi.
