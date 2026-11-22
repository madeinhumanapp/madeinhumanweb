# WEB-L03 — Esborrany en castellà de la FAQ

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-L03`
Independent de la resta d'encàrrecs. La versió castellana de la web (`es/`) encara no té FAQ; aquest esborrany
servirà per afegir-la quan la FAQ passi a contingut (WEB-H03c).

## Objectiu

Traduir al castellà les 16 preguntes i respostes de la FAQ, fidelment i amb el to de les pàgines `es/`.
**No modifiquis cap fitxer de la web: només crees l'esborrany.**

## Entrades (només lectura)

- `script.js`: l'array `FAQ_DATA` (cada element té `cat`, `q` i `a`).
- `es/index.html` i `es/servicios/*/index.html`: per veure el to i els termes que ja fa servir la web en castellà
  (tracte de «tú», «pymes», «RGPD», «Reglamento de IA», «DPO»…). Fes servir els mateixos termes.

## Lliurament

Un fitxer: `docs/traduccions/faq.es.md`, amb aquesta estructura per a cada pregunta, en el mateix ordre que `FAQ_DATA`:

```
## 1. <pregunta en castellà>
- Categoria: <valor de cat, sense traduir>
- Original: <pregunta en català, copiada exactament>

<resposta en castellà>
```

Al final, un apartat `## Notes` amb els termes que has decidit i qualsevol `[REVISAR]`.

## Normes específiques

- Traducció fidel: no afegeixis ni treguis informació. Dates, xifres, articles i noms d'organismes, exactament igual.
- Els noms propis d'organismes catalans (APDCat, AEPD) es mantenen; si l'original desplega un nom, desplega'l en castellà
  (p. ex. «Autoritat Catalana de Protecció de Dades» → «Autoridad Catalana de Protección de Datos»).
- Si una frase catalana és ambigua o et sembla incorrecta, tradueix-la igualment i marca-la amb `[REVISAR: motiu]`.
- El valor de `cat` no es tradueix (és una dada, no un text).

## Comprova abans de lliurar

- Hi ha exactament tantes preguntes com elements té `FAQ_DATA` (compta'ls).
- Cada «Original» es troba literalment a `script.js` (cerca-ho).
- `git status` només mostra `docs/traduccions/faq.es.md`.

Després: `git add docs/traduccions/faq.es.md`, commit `WEB-L03: esborrany en castellà de la FAQ` i push.

## Fora d'abast

Canviar `script.js`, afegir la FAQ a `es/`, traduir altres pàgines.
