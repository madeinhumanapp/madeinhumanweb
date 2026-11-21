// Markdown mínim per al text llarg (pàgines legals, notícies). Sense dependències i sense HTML:
// tot s'escapa. Admet:
//   ## Títol 2 · ### Títol 3 · paràgrafs (una línia que acaba en «\» fa un salt de línia)
//   - llistes (un element pot continuar en línies sagnades amb 2 espais) · taules amb «|» (si la 2a fila és |---|, la 1a és capçalera; si no, totes van al cos)
//   **negreta** · *cursiva* · `codi` · [text](url)
//   <!-- nota interna --> (no es publica; serveix per deixar avisos al text font)
// Els enllaços a altres webs s'obren en una pestanya nova (target="_blank" rel="noopener").
import { esc, urlSegura } from './text.mjs';

const PROPI = /^(\/|#|mailto:|tel:|https:\/\/(www\.)?madeinhuman\.cat)|^[a-z0-9-]+(\.html|\/)/i;

export function enLinia(s) {
  const codis = [];
  let h = esc(s).replace(/`([^`]+)`/g, (m, c) => `\u0000${codis.push(c) - 1}\u0000`);
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const url = u.replace(/&amp;/g, '&');
    if (!urlSegura(url)) return t;
    return `<a href="${esc(url)}"${PROPI.test(url) ? '' : ' target="_blank" rel="noopener"'}>${t}</a>`;
  });
  return h.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${codis[i]}</code>`);
}

const cellesDe = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

export function markdown(text, { classeTaula = '' } = {}) {
  const linies = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  for (let i = 0; i < linies.length;) {
    const l = linies[i];
    if (!l.trim()) { i++; continue; }
    if (l.trim().startsWith('<!--')) { while (i < linies.length && !linies[i].includes('-->')) i++; i++; continue; }
    let m;
    if ((m = l.match(/^(#{2,3}) (.+)$/))) { out.push(`<h${m[1].length}>${enLinia(m[2])}</h${m[1].length}>`); i++; continue; }
    if (/^- /.test(l)) {
      const items = [];
      while (i < linies.length && /^- /.test(linies[i])) {
        // Un element pot continuar a les línies següents si van sagnades (com fa qualsevol editor de Markdown)
        let item = linies[i++].slice(2);
        while (i < linies.length && /^ {2,}\S/.test(linies[i])) item += ' ' + linies[i++].trim();
        items.push(`<li>${enLinia(item)}</li>`);
      }
      out.push(`<ul>\n${items.join('\n')}\n</ul>`);
      continue;
    }
    if (l.trim().startsWith('|')) {
      const files = [];
      while (i < linies.length && linies[i].trim().startsWith('|')) files.push(linies[i++]);
      const ambCap = files.length > 1 && /^\|?\s*:?-{3,}/.test(files[1].trim());
      const fila = (f, t) => `<tr>${cellesDe(f).map(c => `<${t}>${enLinia(c)}</${t}>`).join('')}</tr>`;
      const cap = ambCap ? `<thead>\n${fila(files[0], 'th')}\n</thead>\n` : '';
      const cos = (ambCap ? files.slice(2) : files).map(f => fila(f, 'td')).join('\n');
      out.push(`<table${classeTaula ? ` class="${classeTaula}"` : ''}>\n${cap}<tbody>\n${cos}\n</tbody>\n</table>`);
      continue;
    }
    const para = [];
    while (i < linies.length && linies[i].trim() && !/^(#{2,3} |- |\||<!--)/.test(linies[i].trim())) para.push(linies[i++]);
    out.push(`<p>${para.map(p => enLinia(p.replace(/\\$/, '').trim()) + (p.endsWith('\\') ? '<br />' : '')).join('\n')}</p>`);
  }
  return out.join('\n');
}
