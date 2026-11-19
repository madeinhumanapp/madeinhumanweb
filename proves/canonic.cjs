// Forma canònica d'un arbre DOM per comparar dues versions d'una pàgina sense que
// compti el format del codi: s'ignoren els comentaris i els espais de més, els
// atributs s'ordenen, els enllaços es resolen a URL absoluta (des d'una URL amb
// utm_*, perquè un «/#seccio» que faria perdre l'origen de la visita es detecti) i
// els JSON-LD es comparen com a dades. Es fa servir dins del navegador (page.evaluate).
function canonic(arrel, base) {
  const out = [];
  const absolut = v => { try { return new URL(v, base).href; } catch { return v; } };
  const camins = new Set(['href', 'src', 'action', 'poster']);
  function recorre(n, nivell) {
    if (n.nodeType === 8) return; // comentari
    if (n.nodeType === 3) {
      const t = n.data.replace(/\s+/g, ' ').trim();
      if (t) out.push('  '.repeat(nivell) + JSON.stringify(t));
      return;
    }
    if (n.nodeType === 11) { for (const c of n.childNodes) recorre(c, nivell); return; } // fragment
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    const atributs = [...n.attributes].map(a => {
      let v = a.value;
      if (camins.has(a.name)) v = absolut(v);
      else if (a.name === 'class') v = v.trim().split(/\s+/).join(' ');
      else if (a.name === 'style') v = v.replace(/\s+/g, '').replace(/;$/, '');
      else v = v.replace(/\s+/g, ' ').trim();
      return `${a.name}=${JSON.stringify(v)}`;
    }).sort();
    out.push('  '.repeat(nivell) + `<${tag}${atributs.length ? ' ' + atributs.join(' ') : ''}>`);
    if (tag === 'script' && n.type === 'application/ld+json') {
      try { out.push('  '.repeat(nivell + 1) + JSON.stringify(JSON.parse(n.textContent))); } catch { out.push('JSON-LD INVÀLID'); }
      return;
    }
    if (tag === 'script' || tag === 'style') {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (t) out.push('  '.repeat(nivell + 1) + t);
      return;
    }
    if (tag === 'template') recorre(n.content, nivell + 1);
    for (const c of n.childNodes) recorre(c, nivell + 1);
  }
  recorre(arrel, 0);
  return out;
}

module.exports = { canonic, canonicSrc: canonic.toString() };
