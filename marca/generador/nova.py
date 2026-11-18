"""Crea una publicació nova a partir d'una plantilla YAML.

Ús:
    python nova.py p10 "El formulari de contacte: 4 errors"
    python nova.py p10 "Títol" --pilar "Errors habituals" --enllac diagnostic

Crea contingut/<id>-<títol-en-minúscules>.yaml amb una portada, tres punts i el
tancament. Omple'l i genera'n les imatges amb:
    python generar.py contingut/<fitxer>.yaml
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

import yaml

# A Windows la consola pot no ser UTF-8: evita errors en imprimir accents i «✓»
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARREL = Path(__file__).parent
CONTINGUT = ARREL / "contingut"
ENLLACOS = ["diagnostic", "adequacio", "contacte", "serveis", "web"]

PLANTILLA = """\
id: {id}
pilar: {pilar}          # surt a dalt a l'esquerra
quan: Setmana ? · dia
enllac: {enllac}               # diagnostic | adequacio | contacte | serveis | web
fonts: []                      # p. ex. ["AEPD, Memòria anual 2025"]: surten a text.txt
# Tipus de diapositiva i marcatge (*cursiva*, ==subratllat==...): vegeu LLEGEIX-ME.md
slides:
  - tipus: portada
    titol: {titol}
    subtitol: "Text curt de context: què s'endurà qui el llegeixi."
  - tipus: punt
    num: 1
    titol: "Primer punt"
    text: "Explicació en dues o tres frases."
  - tipus: punt
    num: 2
    titol: "Segon punt"
    text: "Explicació en dues o tres frases."
  - tipus: punt
    num: 3
    titol: "Tercer punt"
    text: "Explicació en dues o tres frases."
  - tipus: tancament
    titol: "Vols que *ho revisem*?"
    text: "Una frase que convidi a fer el pas."
    boto: "Diagnòstic gratuït · 4 min"
peu: |
  Peu de foto en català.

  👉 Enllaç al perfil.

  #RGPD #IA #Girona #pimes
"""


def slug(text: str, maxim: int = 40) -> str:
    """«El formulari: 4 errors» -> «el-formulari-4-errors» (sense accents)."""
    pla = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-z0-9]+", "-", pla.lower()).strip("-")
    return s[:maxim].rstrip("-") or "publicacio"


def main() -> int:
    ap = argparse.ArgumentParser(description="Crea una publicació nova a contingut/.")
    ap.add_argument("id", help="identificador de la publicació, p. ex. p10")
    ap.add_argument("titol", help="títol de la portada")
    ap.add_argument("--pilar", default="Pilar del contingut", help="etiqueta de dalt a l'esquerra")
    ap.add_argument("--enllac", default="diagnostic", choices=ENLLACOS, help="destí de l'enllaç amb UTM")
    a = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,29}", a.id):
        print(f"L'identificador «{a.id}» no és vàlid: fes servir minúscules, xifres i guions (p. ex. p10).")
        return 1
    existents = sorted(CONTINGUT.glob(f"{a.id}-*.yaml")) + sorted(CONTINGUT.glob(f"{a.id}.yaml"))
    if existents:
        print(f"Ja hi ha una publicació amb l'identificador {a.id}: {existents[0].name}")
        return 1

    # json.dumps dona una cadena entre cometes que també és YAML vàlid
    text = PLANTILLA.format(
        id=a.id,
        pilar=json.dumps(a.pilar, ensure_ascii=False),
        enllac=a.enllac,
        titol=json.dumps(a.titol, ensure_ascii=False),
    )
    yaml.safe_load(text)  # comprovació: si la plantilla no és YAML vàlid, no s'escriu res

    CONTINGUT.mkdir(exist_ok=True)
    desti = CONTINGUT / f"{a.id}-{slug(a.titol)}.yaml"
    desti.write_text(text, encoding="utf-8")
    print(f"✓ Creada {desti.relative_to(ARREL).as_posix()}")
    print(f"  Omple-la i genera les imatges amb: python generar.py {desti.relative_to(ARREL).as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
