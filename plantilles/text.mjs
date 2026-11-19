// Text enriquit mínim del contingut → HTML.
// Al contingut només s'admet: *cursiva*, **negreta**, salt de línia i [enllaç](/ruta).
// Tot el que no sigui això s'escapa: el panell (i Mistral) no poden injectar HTML.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ESC[c]);
}

// Enllaços permesos: rutes del mateix lloc, àncores, https, mailto i tel
export function urlSegura(u) {
  return /^(\/|#|https:\/\/|mailto:|tel:)/.test(u) || /^[a-z0-9-]+(\.html|\/)/i.test(u);
}

/** Converteix text enriquit en HTML segur. `negreta` permet triar <strong> o <b> (estil existent). */
export function enriquit(s, { negreta = 'strong' } = {}) {
  let h = esc(s);
  h = h.replace(/\*\*(.+?)\*\*/g, `<${negreta}>$1</${negreta}>`);
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => (urlSegura(u) ? `<a href="${u}">${t}</a>` : t));
  h = h.replace(/\n/g, '<br />');
  return h;
}

/** Atribut opcional: ' nom="valor"' o res. */
export function attr(nom, valor) {
  return valor == null || valor === '' ? '' : ` ${nom}="${esc(valor)}"`;
}
