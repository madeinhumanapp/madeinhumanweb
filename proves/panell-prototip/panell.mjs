// Formularis generats a partir de l'esquema (dades) i vista prèvia per postMessage.
// A rgpd-tool: el contingut i l'esquema els llegeix el servidor (GitHub App); aquí, per fetch.
const WEB = 'https://madeinhuman.cat';
const [esquema, pagina] = await Promise.all([
  fetch(`${WEB}/_previsualitzacio/esquema.json`).then(r => r.json()),
  fetch('portada.ca.json').then(r => r.json()),
]);
const previa = document.getElementById('previa');
const llista = document.getElementById('blocs');
const form = document.getElementById('formulari');
let actiu = pagina.blocs.findIndex(b => b.tipus === 'hero');
window.registre = []; // missatges rebuts de la vista prèvia (per a les proves)

function envia() { previa.contentWindow.postMessage({ tipus: 'previsualitzar', pagina }, WEB); }
let temporitzador;
const enviaAviat = () => { clearTimeout(temporitzador); temporitzador = setTimeout(envia, 150); };
window.addEventListener('message', e => {
  if (e.origin !== WEB) return;
  window.registre.push(e.data);
  if (e.data?.tipus === 'preparat') envia();
});

function camp(def, valor, onCanvi, nom) {
  const el = document.createElement('label');
  el.innerHTML = `<span>${def.etiqueta || nom}</span>`;
  let control;
  if (def.tipus === 'enriquit') { control = document.createElement('textarea'); control.rows = 3; control.value = valor ?? ''; }
  else if (def.tipus === 'bool') { control = document.createElement('input'); control.type = 'checkbox'; control.checked = !!valor; }
  else if (def.tipus === 'seleccio') {
    control = document.createElement('select');
    control.innerHTML = def.opcions.map(o => `<option${o === valor ? ' selected' : ''}>${o}</option>`).join('');
  } else { control = document.createElement('input'); control.type = 'text'; control.value = valor ?? ''; }
  control.name = nom;
  if (def.bloquejat) control.disabled = true;
  control.addEventListener('input', () => onCanvi(def.tipus === 'bool' ? control.checked : control.value));
  control.addEventListener('change', () => onCanvi(def.tipus === 'bool' ? control.checked : control.value));
  el.append(control);
  if (def.ajuda) el.insertAdjacentHTML('beforeend', `<span class="ajuda">${def.ajuda}</span>`);
  return el;
}

function pintaFormulari() {
  const bloc = pagina.blocs[actiu];
  const def = esquema[bloc.tipus];
  form.innerHTML = `<h2>${def.nom}</h2>`;
  for (const [nom, d] of Object.entries(def.camps)) {
    if (d.tipus === 'llista') {
      const fs = document.createElement('fieldset');
      fs.innerHTML = `<legend>${d.etiqueta}</legend>`;
      (bloc[nom] || []).forEach((el, i) => {
        if (typeof d.element.tipus === 'string') fs.append(camp(d.element, el, v => { bloc[nom][i] = v; enviaAviat(); }, `${nom}.${i}`));
        else for (const [k, dk] of Object.entries(d.element)) fs.append(camp(dk, el[k], v => { el[k] = v; enviaAviat(); }, `${nom}.${i}.${k}`));
      });
      form.append(fs);
    } else form.append(camp(d, bloc[nom], v => { bloc[nom] = v; enviaAviat(); }, nom));
  }
}

function pintaLlista() {
  llista.innerHTML = '';
  pagina.blocs.forEach((b, i) => {
    const boto = document.createElement('button');
    boto.type = 'button';
    boto.textContent = esquema[b.tipus].nom;
    if (esquema[b.tipus].bloquejat || b.tipus === 'separador') boto.disabled = true;
    if (i === actiu) boto.setAttribute('aria-current', 'true');
    boto.onclick = () => { actiu = i; pintaLlista(); pintaFormulari(); };
    llista.append(boto);
  });
}
pintaLlista();
pintaFormulari();
