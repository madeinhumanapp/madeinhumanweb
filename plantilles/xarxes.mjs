// Pàgina d'enllaços per als perfils de xarxes socials (/xarxes/, noindex). Contingut: contingut/pagines/xarxes.json.
// El telèfon del botó de WhatsApp surt de contingut/lloc.json (font única). L'script afegeix utm_* propis als
// enllaços marcats segons d'on ve la visita (?o=ig|tt|gbp); no desa res al dispositiu.
import { esc, enriquit } from './text.mjs';

export function paginaXarxes(lloc, p) {
  const c = p.cap, k = lloc.contacte;
  const cursiva = s => enriquit(s).replace(/<(\/?)em>/g, '<$1i>').replace(/<br \/>/g, '<br>');
  const boto = b => `    <a class="btn${b.principal ? ' principal' : ''}"${b.utm ? ' data-utm' : ''} href="${esc(b.href)}">${esc(b.text)}<small>${esc(b.detall)}</small></a>`;
  const botons = [...p.botons, ...(p.ambWhatsapp ? [{ text: 'WhatsApp', detall: k.telefonVisible, href: `https://wa.me/${k.telefon.replace(/^\++/, '')}` }] : [])];
  return `<!doctype html>
<html lang="${p.idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.titol)}</title>
<meta name="description" content="${esc(c.descripcio)}">
<meta name="robots" content="noindex">
<meta property="og:title" content="${esc(c.titol)}">
<meta property="og:description" content="${esc(c.descripcio)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${lloc.web}${p.ruta}">
<meta property="og:locale" content="ca_ES">
<meta property="og:image" content="${lloc.web}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Logo de madeinhuman i el lema «Protegir és avançar.»">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0A0E1A">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<!-- Tipografies i tokens de marca, allotjats al mateix servidor: cap petició a tercers -->
<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/playfair-display-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/playfair-display-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/marca.css">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--nit);color:var(--crema);font-family:var(--font-sans);min-height:100vh;display:flex;justify-content:center}
  main{width:100%;max-width:460px;padding:56px 24px 40px}
  .logo{width:112px;height:112px;background:var(--crema);position:relative}
  .logo .mi{position:absolute;left:11px;top:12px;font-family:var(--font-mono);font-weight:500;font-size:8.5px;letter-spacing:2px;color:var(--nit)}
  .logo .h{position:absolute;left:10px;bottom:7px;font-family:var(--font-serif);font-style:italic;font-size:28px;line-height:1;color:var(--nit);display:flex;align-items:center}
  .logo .h span{display:inline-block;width:10.5px;height:2.7px;background:var(--daurat);margin-left:2px;align-self:flex-end;margin-bottom:5px}
  h1{font-family:var(--font-serif);font-weight:500;font-size:34px;line-height:1.15;margin-top:34px}
  h1 i{color:var(--daurat);font-weight:400}
  p.sub{color:var(--gris-clar);font-size:17px;line-height:1.5;margin-top:14px}
  nav{margin-top:34px;display:flex;flex-direction:column;gap:14px}
  a.btn{display:block;text-decoration:none;color:var(--crema);border:1.5px solid color-mix(in srgb, var(--crema) 22%, transparent);border-radius:16px;padding:18px 20px;font-size:17px;font-weight:700;transition:border-color .15s}
  a.btn small{display:block;font-weight:400;color:var(--gris-clar);font-size:14.5px;margin-top:4px}
  a.btn:hover,a.btn:focus-visible{border-color:var(--daurat);outline:none}
  a.btn.principal{background:var(--daurat);border-color:var(--daurat);color:var(--nit)}
  a.btn.principal small{color:var(--nit);opacity:.8}
  footer{margin-top:40px;font-family:var(--font-mono);font-size:12px;letter-spacing:2px;color:var(--gris-clar)}
  footer a{color:var(--gris-clar)}
</style>
</head>
<body>
<main>
  <div class="logo" role="img" aria-label="Logo de madeinhuman"><div class="mi">MADE IN</div><div class="h">human<span></span></div></div>
  <h1>${cursiva(p.titol)}</h1>
  <p class="sub">${esc(p.subtitol)}</p>
  <nav>
${botons.map(boto).join('\n')}
  </nav>
  <footer>MADEINHUMAN · <a data-utm href="/">MADEINHUMAN.CAT</a> · <a href="/politica-privacitat.html">PRIVACITAT</a></footer>
</main>
<script src="/xarxes/xarxes.js"></script>
</body>
</html>
`;
}
