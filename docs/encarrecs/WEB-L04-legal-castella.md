# WEB-L04 — Esborrany en castellà de les pàgines legals

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-L04`
La web en castellà (`es/`) enllaça a les pàgines legals en català. Aquest esborrany servirà per publicar-les també en
castellà quan la responsable l'hagi validat. **No es publica res: només crees els esborranys.**

## Entrades (només lectura)

- `contingut/legal/avis-legal.md`, `contingut/legal/politica-privacitat.md`, `contingut/legal/politica-cookies.md`
- `contingut/pagines/avis-legal.json`, `politica-privacitat.json`, `politica-cookies.json` (títol, entradeta, nota final)
- Per al to i els termes en castellà: `es/index.html`, `es/servicios/*/index.html` i `docs/traduccions/faq.es.md`

## Lliurament

Tres fitxers a `docs/traduccions/legal/`: `aviso-legal.md`, `politica-privacidad.md`, `politica-cookies.md`.
Cadascun comença amb aquesta capçalera i després el text traduït, amb **la mateixa estructura Markdown** que l'original
(mateixos títols, llistes, taules i enllaços, en el mateix ordre):

```
<!-- Esborrany WEB-L04 · Original: contingut/legal/<fitxer>.md · Pendent de validació jurídica -->
<!-- titol: … · entradeta: … · notaFinal: … -->
```

## Normes específiques

- Traducció fidel i jurídicament prudent: no afegeixis, no treguis ni «millores» res. Dates, imports, NIF, adreces,
  articles i noms de lleis, exactament iguals (els noms oficials de lleis i organismes espanyols, en la seva forma
  oficial castellana; per exemple «Ley Orgánica 3/2018, de 5 de diciembre…»).
- Tracte de «tú», com les pàgines `es/`.
- Els comentaris `<!-- … -->` interns de l'original es copien tal qual, en català, al mateix lloc.
- Enllaços: la mateixa URL. Els enllaços a les pàgines legals catalanes es deixen igual (encara no existeixen les
  castellanes).
- Si una frase catalana és ambigua o et sembla incorrecta, tradueix-la igualment i marca-la amb `[REVISAR: motiu]`.

## Comprova abans de lliurar

- Cada fitxer té el mateix nombre de títols `##`/`###`, d'elements de llista i de files de taula que l'original
  (compta'ls i posa les xifres al resum).
- `git status` només mostra els tres fitxers del lliurament.

Després: `git add docs/traduccions/legal/`, commit `WEB-L04: esborrany en castellà de les pàgines legals` i push.

## Fora d'abast

Publicar res, tocar `contingut/`, `es/` o qualsevol `.html`.
