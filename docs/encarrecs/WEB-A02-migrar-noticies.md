# WEB-A02 — Migrar les 3 notícies actuals a fitxers

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-A02`

## Objectiu

Les 3 notícies de la portada són ara dins de `contingut/pagines/portada.ca.json` (bloc `actualitat`, camp
`noticies`). Des de WEB-A01 cada notícia pot ser un fitxer a `contingut/actualitat/`, amb llistat propi
(`/actualitat/`) i canal RSS. Cal passar-hi les 3 notícies **sense canviar cap paraula**.

Aquestes 3 són «breus»: només capçalera, sense cos. Per això no tindran pàgina pròpia, només targeta.

## Context (llegeix-ho abans)

- `eines/LLEGEIX-ME.md`, apartat «Notícies»: el format dels fitxers.
- `esquema/blocs.mjs`, `CAMPS_NOTICIA`: els camps admesos i els seus límits.
- `contingut/pagines/portada.ca.json`, bloc `actualitat`: el text de les 3 notícies (no el modifiquis).

## Què has de fer

Crea aquests 3 fitxers, **exactament amb aquests noms**:

| Fitxer | Notícia de la portada |
|---|---|
| `contingut/actualitat/2026-05-01-aepd-memoria-2025.md` | la 1a (tag «RGPD», «Maig 2026») |
| `contingut/actualitat/2026-07-01-omnibus-digital-ia.md` | la 2a (tag «AI Act», «Juliol 2026») |
| `contingut/actualitat/2026-01-01-apdcat-metodologia-ia.md` | la 3a (tag «APDCat», «2026») |

Cada fitxer té només la capçalera, entre dues línies `---`, i res més. Els valors de text, entre cometes dobles.
Si un text té cometes dobles a dins, escriu-les com a `\"` (cap de les tres en té).

| Camp | D'on surt |
|---|---|
| `titol` | el `titol` de la notícia, igual |
| `resum` | el `cos` de la notícia, igual |
| `data` | la data del nom del fitxer (`2026-05-01`, `2026-07-01`, `2026-01-01`). És una convenció per ordenar, no una data real |
| `etiqueta` | `rgpd` per a la 1a, `ia` per a la 2a, `apdcat` per a la 3a |
| `font_nom` | l'organisme de la línia de font: `AEPD`, `Diari Oficial de la UE`, `APDCat` |
| `data_font` | només a la 2a, perquè la font diu la data exacta: `2026-07-24`. A les altres, no posis el camp |
| `estat` | `publicat` |
| `idioma` | `ca` |
| `data_text` | el camp `data` de la notícia, igual (`Maig 2026`, `Juliol 2026`, `2026`) |
| `font_text` | el camp `font` de la notícia, igual (comença per «Font: ») |

No hi posis `font_url` ni `servei_relacionat`: les notícies actuals no en tenen i no es pot inventar.

Exemple de format (amb dades inventades, **no** el copiïs):

```
---
titol: "Títol de la notícia"
resum: "Text de la targeta."
data: 2026-03-01
etiqueta: rgpd
font_nom: "Organisme"
estat: publicat
idioma: ca
data_text: "Març 2026"
font_text: "Font: Organisme · document"
---
```

## Comprova (enganxa la sortida al resum)

```
npm run sense-html     → «cap HTML al contingut»
npm run construir      → «16 pàgines generades, … · notícies: 3 publicades»
npm run actualitat     → «totes les comprovacions de l'actualitat correctes»
npm run paritat        → «19/19 pàgines idèntiques»
npm run contractes     → 4 línies «ok»
```

Si `construir` diu «El contingut no és vàlid», la línia indica el fitxer i el camp: corregeix-lo.

Comprovació manual: obre `dist/actualitat/index.html` amb el navegador (o mira'n el text) i verifica que les 3
targetes diuen exactament el mateix que les de la portada (`dist/index.html`, secció «Actualitat»). L'ordre del
llistat serà diferent (de la més nova a la més antiga): és correcte.

## Lliurament

Només els 3 fitxers nous de `contingut/actualitat/`.
`git add contingut/actualitat/2026-05-01-aepd-memoria-2025.md contingut/actualitat/2026-07-01-omnibus-digital-ia.md contingut/actualitat/2026-01-01-apdcat-metodologia-ia.md`,
commit `WEB-A02: notícies actuals a contingut/actualitat` i push.

## Criteris d'acceptació

- Les cinc ordres donen exactament aquests resultats.
- Cap paraula canviada respecte de la portada (ni tan sols les que el glossari canviaria: és una migració).

## Fora d'abast

Tocar `portada.ca.json` (el canvi de la portada perquè llegeixi els fitxers el fa Claude en integrar-ho), les
plantilles, l'esquema o qualsevol `.html`.
