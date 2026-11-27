// Pàgina /reserva/ (WEB-G05a): marc interior en català, noindex/nofollow, fora del mapa del lloc.
// Sense token ?t= o amb ACTIVA = false a reserva.js, mostra el missatge d'entrada cap al diagnòstic i contacte.
import { marcInterior } from './serveis.mjs';

export function paginaReserva(lloc, dades) {
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const c = dades.COMU.ca;
  const ruta = '/reserva/';
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      m.empresa_ld(),
      { '@type': 'WebPage', name: 'Reservar una trucada', url: WEB + ruta, inLanguage: 'ca' },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
        { '@type': 'ListItem', position: 2, name: 'Reserva', item: WEB + ruta },
      ] },
    ],
  };

  return ['reserva/index.html',
    m.cap('ca', 'Reservar una trucada · Madeinhuman', 'Reserveu una trucada de 20 minuts amb el nostre equip per revisar el vostre diagnòstic RGPD.', ruta,
      [['ca', ruta], ['x-default', ruta]], ld, { comentari: false, robots: 'noindex, nofollow' })
    + m.nav('ca', '/es/') + `  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="Ruta"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">Reserva</span></nav>
      <span class="eyebrow">Trucada · 20 minuts</span>
      <h1 class="section-title pagina-h1">Reservar una trucada</h1>
      <div id="reserva-pagina" class="reserva-contenidor" data-reserva-pagina data-idioma="ca">
        <p class="pagina-lede">Per reservar una trucada, feu el diagnòstic gratuït o escriviu-nos.</p>
        <div class="reserva-accions">
          <a class="btn btn-primary reserva-accio" href="/diagnostic">Fer el diagnòstic gratuït</a>
          <a class="btn btn-ghost reserva-accio" href="/#contacte">Escriviu-nos</a>
        </div>
      </div>
    </div>
  </main>
` + m.peu('ca').replace('<script src="/menu.js" defer></script>', '<script src="/reserva.js" defer></script>\n<script src="/menu.js" defer></script>')];
}
