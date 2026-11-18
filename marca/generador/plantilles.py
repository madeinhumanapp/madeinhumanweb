"""Plantilles de diapositiva de madeinhuman (HTML que després es renderitza a PNG).

Marcatge dins dels textos:
  *text*     cursiva destacada (color d'accent)
  **text**   negreta
  ==text==   subratllat fet a mà
  ((text))   cercle fet a mà
  ~~text~~   ratllat fet a mà
"""
import hashlib
import html
import math
import random
import re

from marca import WEB, font_face_css, tema

W, H = 1080, 1350          # carrusel 4:5
SW, SH = 1080, 1920        # story / portada de vídeo 9:16


# ---------- traços fets a mà -------------------------------------------------
def _rng(seed: str) -> random.Random:
    return random.Random(int(hashlib.md5(seed.encode()).hexdigest()[:8], 16))


def _smooth(pts):
    """Catmull-Rom -> Bézier cúbica, per a traços orgànics."""
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d


def _svg(path, color, w, box_css):
    return (f"<svg viewBox='0 0 100 100' preserveAspectRatio='none' style='position:absolute;{box_css};overflow:visible;pointer-events:none'>"
            f"<path d='{path}' fill='none' stroke='{color}' stroke-width='{w}' stroke-linecap='round' stroke-linejoin='round' "
            f"vector-effect='non-scaling-stroke'/></svg>")


def subratllat(seed, color, w):
    r = _rng(seed)
    pts = [(1, 55 + r.uniform(-8, 8)), (35, 45 + r.uniform(-10, 10)), (70, 58 + r.uniform(-10, 10)), (99, 40 + r.uniform(-8, 8))]
    return _svg(_smooth(pts), color, w, "left:-3%;width:106%;bottom:-0.22em;height:0.32em")


def ratllat(seed, color, w):
    r = _rng(seed)
    pts = [(0, 60 + r.uniform(-6, 6)), (50, 45 + r.uniform(-8, 8)), (100, 52 + r.uniform(-6, 6))]
    return _svg(_smooth(pts), color, w, "left:-3%;width:106%;top:38%;height:0.3em")


def cercle(seed, color, w):
    r = _rng(seed)
    a0 = math.radians(-160 + r.uniform(-15, 15))
    n = 16
    pts = []
    for i in range(n + 1):
        a = a0 + i * math.radians(395) / n
        k = r.uniform(0.95, 1.04)
        pts.append((50 + 50 * k * math.cos(a), 50 + 50 * k * math.sin(a)))
    return _svg(_smooth(pts), color, w, "left:-4%;top:-14%;width:108%;height:128%")


def fletxa(color, w=5, rot=0):
    return (f"<svg viewBox='0 0 120 90' width='120' height='90' style='transform:rotate({rot}deg);overflow:visible'>"
            f"<path d='M8,10 C40,6 80,24 98,66' fill='none' stroke='{color}' stroke-width='{w}' stroke-linecap='round'/>"
            f"<path d='M78,58 L99,69 L102,45' fill='none' stroke='{color}' stroke-width='{w}' stroke-linecap='round' stroke-linejoin='round'/></svg>")


def tic(color, size=44, w=6):
    return (f"<svg viewBox='0 0 50 50' width='{size}' height='{size}' style='flex:none;overflow:visible'>"
            f"<path d='M6,27 C12,31 16,36 20,42 C27,27 36,15 46,7' fill='none' stroke='{color}' stroke-width='{w}' "
            f"stroke-linecap='round' stroke-linejoin='round'/></svg>")


# ---------- marcatge ---------------------------------------------------------
def md(text: str, t: dict, serif: bool, stroke: int = 6) -> str:
    s = html.escape(str(text)).replace("\n", "<br>")
    acc = t["accent"]

    def wrap(kind):
        def f(m):
            inner = m.group(1)
            fn = {"u": subratllat, "c": cercle, "x": ratllat}[kind]
            marge = "margin:0 .14em;" if kind == "c" else ""
            return f"<span style='position:relative;white-space:nowrap;{marge}'>{inner}{fn(inner + kind, acc, stroke)}</span>"
        return f

    s = re.sub(r"==(.+?)==", wrap("u"), s)
    s = re.sub(r"\(\((.+?)\)\)", wrap("c"), s)
    def ratlla_paraules(m):
        # una ratlla per paraula perquè el text pugui saltar de línia
        return " ".join(wrap("x")(re.match(r"(.+)", w)) for w in m.group(1).split(" "))
    s = re.sub(r"~~(.+?)~~", ratlla_paraules, s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b style='font-weight:700'>\1</b>", s)
    ital = (f"<i style='font-family:PF;font-style:italic;font-weight:400;color:{acc}'>\\1</i>" if serif
            else f"<span style='color:{acc};font-weight:500'>\\1</span>")
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", ital, s)
    return s


# ---------- peces comunes ----------------------------------------------------
def logo_mini(s, t):
    return (f"<div style='width:{s}px;height:{s}px;background:{t['fg'] if t['bg'] != '#0A0E1A' else '#F3EFE8'};"
            f"position:relative;flex:none'><div style='position:absolute;left:{s*0.2:.1f}px;bottom:{s*0.1:.1f}px;display:flex;"
            f"align-items:center;font-family:PF;font-style:italic;font-size:{s*0.78:.1f}px;line-height:1;"
            f"color:{t['bg']}'>h<span style='display:inline-block;width:{s*0.22:.1f}px;height:{s*0.06:.1f}px;"
            f"background:#C4956A;margin-left:{s*0.03:.1f}px;align-self:flex-end;margin-bottom:{s*0.13:.1f}px'></span></div></div>")


def logo_bloc(s, bg, fg, acc):
    return (f"<div style='width:{s}px;height:{s}px;background:{bg};position:relative;flex:none'>"
            f"<div style='position:absolute;left:{s*0.1:.1f}px;top:{s*0.11:.1f}px;font-family:MONO;font-weight:500;font-size:{s*0.075:.1f}px;letter-spacing:{s*0.02:.1f}px;color:{fg}'>MADE IN</div>"
            f"<div style='position:absolute;left:{s*0.085:.1f}px;bottom:{s*0.06:.1f}px;display:flex;align-items:center;font-family:PF;font-style:italic;font-size:{s*0.25:.1f}px;line-height:1;color:{fg};letter-spacing:{-s*0.009:.1f}px'>human"
            f"<span style='display:inline-block;width:{s*0.095:.1f}px;height:{s*0.024:.1f}px;background:{acc};margin-left:{s*0.02:.1f}px;align-self:flex-end;margin-bottom:{s*0.045:.1f}px'></span></div></div>")


def nota_ma(text, t, right=90, bottom=170, rot=-5, fletxa_rot=205):
    return (f"<div style='position:absolute;right:{right}px;bottom:{bottom}px;display:flex;align-items:center;gap:6px;"
            f"transform:rotate({rot}deg)'>{fletxa(t['accent'], 5, fletxa_rot)}"
            f"<span style='font-family:MA;font-weight:600;font-size:52px;color:{t['accent']};line-height:1'>{html.escape(text)}</span></div>")


def marc(cos, t, etiqueta="", n=None, total=None, w=W, h=H, peu=True, extra="", pista=False):
    comptador = f"{n:02d} / {total:02d}" if n and total else ""
    peu_html = ""
    if peu:
        dreta = (f"<span style='font-family:MONO;font-size:22px;letter-spacing:3px;color:{t['accent']}'>LLISCA →</span>"
                 if pista else "")
        peu_html = (f"<div style='position:absolute;left:90px;right:90px;bottom:64px;display:flex;align-items:center;justify-content:space-between'>"
                    f"<div style='display:flex;align-items:center;gap:18px'>{logo_mini(44, t)}"
                    f"<span style='font-family:MONO;font-size:21px;letter-spacing:2px;color:{t['sec']}'>{WEB}</span></div>{dreta}</div>")
    cap = (f"<div style='position:absolute;left:90px;right:90px;top:80px;display:flex;justify-content:space-between;"
           f"font-family:MONO;font-size:22px;letter-spacing:5px'>"
           f"<span style='color:{t['accent']}'>{html.escape(etiqueta.upper())}</span>"
           f"<span style='color:{t['sec']}'>{comptador}</span></div>") if (etiqueta or comptador) else ""
    return f"""<!doctype html><html><head><meta charset=utf-8><style>{font_face_css()}
      *{{margin:0;padding:0;box-sizing:border-box}} body{{width:{w}px;height:{h}px;overflow:hidden;background:{t['bg']};color:{t['fg']}}}
      </style></head><body><div style="position:relative;width:{w}px;height:{h}px">{cap}{cos}{peu_html}{extra}</div></body></html>"""


# ---------- tipus de diapositiva ----------------------------------------------
def centre(inner, top=170, bottom=170):
    return (f"<div style='position:absolute;left:90px;right:90px;top:{top}px;bottom:{bottom}px;display:flex;"
            f"flex-direction:column;justify-content:center'><div>{inner}</div></div>")


def portada(d, n, total, etiqueta):
    t = tema(True)
    cos = centre(f"<div style='font-family:PF;font-weight:500;font-size:{d.get('mida', 112)}px;line-height:1.08;letter-spacing:-1px'>{md(d['titol'], t, True, 8)}</div>"
           + (f"<div style='font-family:SANS;font-size:42px;line-height:1.45;color:{t['sec']};margin-top:56px;max-width:860px'>{md(d['subtitol'], t, False, 5)}</div>" if d.get("subtitol") else ""),
           150, 300)
    extra = nota_ma(d["nota"], t) if d.get("nota") else ""
    return marc(cos, t, etiqueta, n, total, extra=extra, pista=True)


def punt(d, n, total, etiqueta):
    t = tema(d.get("fosc", False))
    num = d.get("num")
    cos = centre((f"<div style='font-family:PF;font-style:italic;font-size:160px;line-height:1;color:{t['accent']}'>{int(num):02d}</div>" if num else "")
           + f"<div style='font-family:PF;font-weight:500;font-size:{d.get('mida', 74)}px;line-height:1.12;margin-top:30px'>{md(d['titol'], t, True, 7)}</div>"
           f"<div style='font-family:SANS;font-size:41px;line-height:1.5;margin-top:44px;max-width:890px'>{md(d.get('text', ''), t, False, 5)}</div>")
    extra = nota_ma(d["nota"], t) if d.get("nota") else ""
    return marc(cos, t, etiqueta, n, total, extra=extra)


def dada(d, n, total, etiqueta):
    t = tema(d.get("fosc", False))
    cos = centre(f"<div style='font-family:PF;font-weight:500;font-size:{d.get('mida', 210)}px;line-height:1;letter-spacing:-4px'>{md(d['xifra'], t, True, 9)}</div>"
           f"<div style='font-family:PF;font-style:italic;font-size:56px;color:{t['accent']};margin-top:22px'>{html.escape(d.get('etiqueta', ''))}</div>"
           f"<div style='font-family:SANS;font-size:41px;line-height:1.5;margin-top:46px;max-width:890px'>{md(d.get('text', ''), t, False, 5)}</div>"
           f"<div style='font-family:MONO;font-size:22px;letter-spacing:1px;color:{t['sec']};margin-top:48px'>FONT: {html.escape(d.get('font', ''))}</div>")
    return marc(cos, t, etiqueta, n, total)


def llista(d, n, total, etiqueta):
    t = tema(d.get("fosc", False))
    items = "".join(
        f"<div style='display:flex;gap:26px;align-items:flex-start;margin-top:40px'>{tic(t['accent'], 48)}"
        f"<div style='font-family:SANS;font-size:40px;line-height:1.42'>{md(it, t, False, 5)}</div></div>"
        for it in d["items"])
    cos = centre(f"<div style='font-family:PF;font-weight:500;font-size:{d.get('mida', 74)}px;line-height:1.12'>{md(d['titol'], t, True, 7)}</div>"
           f"<div style='margin-top:26px'>{items}</div>")
    extra = nota_ma(d["nota"], t) if d.get("nota") else ""
    return marc(cos, t, etiqueta, n, total, extra=extra)


def mite(d, n, total, etiqueta):
    t = tema(False)
    cos = centre(
        f"<div style='font-family:MONO;font-size:24px;letter-spacing:6px;color:{t['sec']}'>MITE</div>"
        f"<div style='font-family:PF;font-weight:500;font-size:60px;line-height:1.2;margin-top:22px;color:{t['sec']}'>{md('~~' + d['mite'] + '~~', t, True, 6)}</div>"
        f"<div style='height:2px;background:{t['linia']};margin:64px 0'></div>"
        f"<div style='font-family:MONO;font-size:24px;letter-spacing:6px;color:{t['accent']}'>REALITAT</div>"
        f"<div style='font-family:SANS;font-size:41px;line-height:1.5;margin-top:22px'>{md(d['realitat'], t, False, 5)}</div>")
    return marc(cos, t, etiqueta, n, total)


def tancament(d, n, total, etiqueta):
    t = tema(True)
    cos = centre(f"{logo_bloc(260, '#F3EFE8', '#0A0E1A', '#C4956A')}"
           f"<div style='font-family:PF;font-weight:500;font-size:76px;line-height:1.12;margin-top:80px'>{md(d['titol'], t, True, 7)}</div>"
           f"<div style='font-family:SANS;font-size:41px;line-height:1.5;color:{t['sec']};margin-top:34px;max-width:880px'>{md(d.get('text', ''), t, False, 5)}</div>"
           f"<div style='display:inline-flex;align-items:center;gap:16px;margin-top:56px;background:{t['accent']};color:{t['bg']};"
           f"font-family:SANS;font-weight:700;font-size:34px;padding:24px 40px;border-radius:999px'>{html.escape(d.get('boto', 'Diagnòstic gratuït · 4 min'))} →</div>"
           f"<div style='font-family:MONO;font-size:24px;letter-spacing:3px;color:{t['sec']};margin-top:30px'>{html.escape(d.get('peu', 'ENLLAÇ AL PERFIL'))}</div>", 120, 120)
    return marc(cos, t, etiqueta, n, total, peu=False)


def story(d):
    t = tema(True)
    cos = (f"<div style='position:absolute;left:90px;right:90px;top:300px'>"
           f"<div style='font-family:MONO;font-size:26px;letter-spacing:6px;color:{t['accent']}'>{html.escape(d.get('etiqueta', 'NOU CARRUSEL').upper())}</div>"
           f"<div style='font-family:PF;font-weight:500;font-size:96px;line-height:1.08;margin-top:40px'>{md(d['titol'], t, True, 8)}</div>"
           f"<div style='font-family:SANS;font-size:40px;line-height:1.45;color:{t['sec']};margin-top:44px'>{md(d.get('text', ''), t, False, 5)}</div></div>"
           f"<div style='position:absolute;left:190px;right:190px;bottom:520px;height:150px;border:3px dashed {t['linia']};border-radius:30px;"
           f"display:flex;align-items:center;justify-content:center;font-family:MONO;font-size:22px;letter-spacing:4px;color:{t['sec']}'>ESPAI PER A L'ADHESIU D'ENLLAÇ</div>"
           f"<div style='position:absolute;left:90px;bottom:200px;display:flex;align-items:center;gap:20px'>{logo_mini(64, t)}"
           f"<span style='font-family:MONO;font-size:26px;letter-spacing:2px;color:{t['sec']}'>{WEB}</span></div>")
    return marc(cos, t, w=SW, h=SH, peu=False)


def portada_video(d):
    t = tema(True)
    cos = (f"<div style='position:absolute;left:110px;right:110px;top:560px'>"
           f"<div style='font-family:MONO;font-size:28px;letter-spacing:6px;color:{t['accent']}'>{html.escape(d.get('etiqueta', '').upper())}</div>"
           f"<div style='font-family:PF;font-weight:500;font-size:104px;line-height:1.06;margin-top:36px'>{md(d['titol'], t, True, 9)}</div></div>"
           f"<div style='position:absolute;left:110px;bottom:420px;display:flex;align-items:center;gap:20px'>{logo_mini(70, t)}"
           f"<span style='font-family:MONO;font-size:28px;letter-spacing:2px;color:{t['sec']}'>{WEB}</span></div>")
    return marc(cos, t, w=SW, h=SH, peu=False)


TIPUS = dict(portada=portada, punt=punt, dada=dada, llista=llista, mite=mite, tancament=tancament)
