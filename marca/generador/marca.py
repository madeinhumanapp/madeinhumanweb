"""Tokens de marca de madeinhuman: colors, tipografies i CSS base.

Canvia aquí qualsevol valor i totes les plantilles s'actualitzen.
"""
from pathlib import Path

FONTS_DIR = Path(__file__).parent / "fonts"

# Colors (contrast WCAG calculat respecte al fons on s'han d'usar)
NIT = "#0A0E1A"      # Blau nit: fons fosc i text principal sobre crema (16,8:1)
DAURAT = "#C4956A"   # Daurat: accent NOMÉS sobre blau nit (7,2:1)
CREMA = "#F3EFE8"    # Crema: fons clar i text sobre blau nit
BRONZE = "#7F6044"   # Bronze: accent i text destacat sobre crema (5,0:1)
GRIS = "#5F6675"     # Gris: text secundari sobre crema (5,0:1)
GRIS_FOSC = "#A3AABA"  # Gris clar: text secundari sobre blau nit (8,3:1)

WEB = "madeinhuman.cat"


def font_face_css() -> str:
    f = FONTS_DIR.as_uri()
    faces = [
        ("PF", "normal", 500, "playfair-display-latin-500-normal"),
        ("PF", "italic", 400, "playfair-display-latin-400-italic"),
        ("PF", "italic", 500, "playfair-display-latin-500-italic"),
        ("MONO", "normal", 400, "dm-mono-latin-400-normal"),
        ("MONO", "normal", 500, "dm-mono-latin-500-normal"),
        ("SANS", "normal", 400, "dm-sans-latin-400-normal"),
        ("SANS", "normal", 500, "dm-sans-latin-500-normal"),
        ("SANS", "normal", 700, "dm-sans-latin-700-normal"),
        ("MA", "normal", 600, "caveat-latin-600-normal"),
    ]
    return "".join(
        f"@font-face{{font-family:{n};font-style:{s};font-weight:{w};src:url('{f}/{file}.woff2')}}"
        for n, s, w, file in faces
    )


def tema(fosc: bool) -> dict:
    """Colors segons el fons. L'accent canvia perquè el daurat no es llegeix sobre crema."""
    if fosc:
        return dict(bg=NIT, fg=CREMA, accent=DAURAT, sec=GRIS_FOSC, linia="rgba(243,239,232,.18)")
    return dict(bg=CREMA, fg=NIT, accent=BRONZE, sec=GRIS, linia="rgba(10,14,26,.14)")
