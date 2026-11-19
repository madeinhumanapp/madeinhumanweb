"""Exporta les dades de les pàgines de servei a contingut/serveis.json (encàrrec WEB-H04).

Ús, des de l'arrel del repositori:
    py eines/exportar-serveis.py         (Windows)
    python3 eines/exportar-serveis.py    (macOS / Linux)

Llegeix marca/pagines/contingut.py tal qual. NAP (dades de contacte) no s'exporta:
el generador de Node les agafa de contingut/lloc.json, que és la font única.
"""
import json
import sys
from pathlib import Path

ARREL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ARREL / "marca" / "pagines"))
import contingut as c  # noqa: E402

CLAUS = ["COMU", "ZONA", "SERVEIS", "SLUG", "PAGINES", "PORTADA_ES"]
dades = {k: getattr(c, k) for k in CLAUS}
desti = ARREL / "contingut" / "serveis.json"
desti.write_text(json.dumps(dades, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("contingut/serveis.json escrit (" + ", ".join(CLAUS) + ")")
