# Llibreries de tercers allotjades a la web

Les fa servir només `recollida.html` (l'assistent de recollida de dades). Abans es
carregaven des d'unpkg.com i cdn.sheetjs.com; ara se serveixen des del mateix
domini perquè els visitants no facin cap petició a tercers i perquè les versions
quedin fixades (abans Babel no tenia versió i canviava tot sol).

| Fitxer | Paquet i versió | Origen | Llicència |
|---|---|---|---|
| `react-18.3.1.production.min.js` | react 18.3.1 (`umd/`) | registre npm | MIT |
| `react-dom-18.3.1.production.min.js` | react-dom 18.3.1 (`umd/`) | registre npm | MIT |
| `babel-standalone-8.1.2.min.js` | @babel/standalone 8.1.2 | registre npm | MIT |
| `xlsx-0.20.2.full.min.js` | SheetJS xlsx 0.20.2 (`dist/`) | cdn.sheetjs.com | Apache-2.0 |

Els textos de les llicències són a `llicencies/`.

SHA-256 (per comprovar que no s'han modificat):

```
d949f1c3687aedadcedac85261865f29b17cd273997e7f6b2bfc53b2f9d4c4dd  react-18.3.1.production.min.js
35f4f974f4b2bcd44da73963347f8952e341f83909e4498227d4e26b98f66f0d  react-dom-18.3.1.production.min.js
c8a2d62549b6221b23f2555e2316e4fe64e716149545785ee3281fde2a5b90e1  babel-standalone-8.1.2.min.js
0dcbc967984de297bd4233cbb77febad8a396c72d8ac0cfab09094d6d7f6e805  xlsx-0.20.2.full.min.js
```

## Com actualitzar-ne una

1. Baixa la versió nova (`npm pack react@18.x.y` i copia el fitxer de `umd/`, o el
   `dist/` de SheetJS des de cdn.sheetjs.com).
2. Desa-la amb la versió al nom, canvia el `<script>` de `recollida.html` i esborra
   la versió vella.
3. Actualitza aquesta taula i els SHA-256 (`sha256sum vendor/*.js`).
4. Prova l'assistent sencer, també la càrrega d'un fitxer Excel.
