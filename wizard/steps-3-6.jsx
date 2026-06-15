/* Steps 3-6 — Entity repeaters (treballadors, encarregats, aplicacions, dispositius) */

// Shared: list manager hook
function useEntityList(data, setData, key) {
  const list = data[key] || [];
  const [openIx, setOpenIx] = React.useState(-1);

  const add = (initial = {}) => {
    const next = [...list, initial];
    setData({ ...data, [key]: next });
    setOpenIx(next.length - 1);
  };
  const remove = (i) => {
    const next = list.filter((_, ix) => ix !== i);
    setData({ ...data, [key]: next });
    if (openIx === i) setOpenIx(-1);
    else if (openIx > i) setOpenIx(openIx - 1);
  };
  const update = (i, patch) => {
    const next = list.map((it, ix) => ix === i ? { ...it, ...patch } : it);
    setData({ ...data, [key]: next });
  };
  return { list, openIx, setOpenIx, add, remove, update };
}

// Toast notification
function showToast(msg) {
  const el = document.createElement("div");
  el.className = "form-success";
  el.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:300;min-width:280px;justify-content:center;max-width:440px;";
  el.innerHTML = `<span>✓</span><span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// API URL (same pattern as script.js)
var WIZARD_API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://api.madeinhuman.cat';

// Download Excel template from rgpd-tool public/templates/
function downloadTemplate(filename) {
  window.open(WIZARD_API_URL + '/templates/' + filename, '_blank');
  showToast('Plantilla ' + filename + ' descarregada');
}

// Upload Excel and parse with SheetJS
function uploadExcel(colMap, onRows) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls,.csv';
  input.onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var wb = XLSX.read(ev.target.result, { type: 'array' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
        var rows = raw.map(function (row) {
          var mapped = {};
          Object.keys(colMap).forEach(function (excelCol) {
            var fieldName = colMap[excelCol];
            if (row[excelCol] !== undefined && row[excelCol] !== '') {
              mapped[fieldName] = row[excelCol];
            }
          });
          return mapped;
        }).filter(function (r) {
          return Object.values(r).some(function (v) { return v !== '' && v !== undefined; });
        });
        onRows(rows);
        showToast('Importats ' + rows.length + ' registres des d\'Excel');
      } catch (err) {
        showToast('Error llegint l\'Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
}

// ============================================
// STEP 3 — Treballadors
// ============================================
function Step3({ data, setData }) {
  const { list, openIx, setOpenIx, add, remove, update } = useEntityList(data, setData, "treballadors");
  const q = data.questionari || {};
  const showWA = !!q.whatsapp_empresa;
  const showVideo = !!q.videovigilancia;

  return (
    <div>
      <EntityTools
        onAdd={() => add({})}
        onTemplate={() => downloadTemplate('plantilla_treballadors.xlsx')}
        onUpload={() => uploadExcel(
          { 'Nom complet': 'nom_complet', 'DNI': 'dni', 'Departament': 'departament' },
          (rows) => setData({ ...data, treballadors: [...(data.treballadors || []), ...rows] })
        )}
      />

      {list.length > 0 && (
        <div className="entity-list">
          {list.map((t, i) => (
            <EntityRow
              key={i}
              index={i}
              title={t.nom_complet}
              meta={[t.dni, t.departament].filter(Boolean).join(" · ")}
              open={openIx === i}
              onToggle={() => setOpenIx(openIx === i ? -1 : i)}
              onDelete={() => remove(i)}
            >
              <Subsection index="3.1" title="Identificació">
                <div className="field-row">
                  <Field label="Nom complet" required>
                    <Input value={t.nom_complet} onChange={(v) => update(i, { nom_complet: v })} placeholder="Nom i cognoms" />
                  </Field>
                  <Field label="DNI / NIE" required>
                    <Input value={t.dni} onChange={(v) => update(i, { dni: v })} placeholder="12345678A" />
                  </Field>
                </div>
                <Field label="Departament">
                  <Input value={t.departament} onChange={(v) => update(i, { departament: v })} list={`dept-list-${i}`} placeholder="Ex: Administració" />
                  <datalist id={`dept-list-${i}`}>{DEPARTAMENTS.map(d => <option key={d} value={d} />)}</datalist>
                </Field>
              </Subsection>

              {showWA && (
                <Subsection index="3.2" title="Permisos WhatsApp corporatiu">
                  <div className="checkboxes" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <Checkbox value={t.wa_crear_grups} onChange={(v) => update(i, { wa_crear_grups: v })} label="Pot crear grups" />
                    <Checkbox value={t.wa_eliminar_membres} onChange={(v) => update(i, { wa_eliminar_membres: v })} label="Pot eliminar membres" />
                    <Checkbox value={t.wa_afegir_contactes} onChange={(v) => update(i, { wa_afegir_contactes: v })} label="Pot afegir contactes" />
                    <Checkbox value={t.wa_consentiment} onChange={(v) => update(i, { wa_consentiment: v })} label="Consentiment d'ús firmat" />
                    <Checkbox value={t.wa_byod} onChange={(v) => update(i, { wa_byod: v })} label="Utilitza dispositiu propi (BYOD)" />
                  </div>
                </Subsection>
              )}

              <Subsection index="3.3" title="Clàusules complementàries">
                <div className="checkboxes">
                  {showVideo && <Checkbox value={t.videovigilancia} onChange={(v) => update(i, { videovigilancia: v })} label="Informat que hi ha videovigilància" />}
                  {showWA && <Checkbox value={t.whatsapp_laboral} onChange={(v) => update(i, { whatsapp_laboral: v })} label="Clàusula d'ús laboral de WhatsApp" />}
                  <Checkbox value={t.drets_responsable} onChange={(v) => update(i, { drets_responsable: v })} label="És la persona que gestiona consultes de protecció de dades" />
                </div>
              </Subsection>

              <Subsection index="3.4" title="Compromís de confidencialitat">
                <Field label="Data en què va signar el compromís" help="Opcional · si no recordeu la data, ja us en facilitarem un nou model">
                  <Input type="date" value={t.data_compromis} onChange={(v) => update(i, { data_compromis: v })} />
                </Field>
              </Subsection>
            </EntityRow>
          ))}
        </div>
      )}

      <button type="button" className="add-entity" onClick={() => add({})}>
        <span className="plus">＋</span>
        Afegir treballador
      </button>
    </div>
  );
}

// ============================================
// STEP 4 — Encarregats de Tractament
// ============================================
function Step4({ data, setData }) {
  const { list, openIx, setOpenIx, add, remove, update } = useEntityList(data, setData, "encarregats");

  return (
    <div>
      <EntityTools
        onAdd={() => add({ acces_fisic: "amb_acces", categories_dades: [] })}
        onTemplate={() => downloadTemplate('plantilla_encarregats.xlsx')}
        onUpload={() => uploadExcel(
          { 'Nom': 'nom', 'NIF': 'nif', 'Servei': 'servei', 'Adreça': 'adreca' },
          (rows) => setData({ ...data, encarregats: [...(data.encarregats || []), ...rows.map(r => ({ ...r, acces_fisic: 'amb_acces', categories_dades: [] }))] })
        )}
        onCatalog={() => showToast("Catàleg de proveïdors habituals — disponible properament")}
        catalogLabel="Catàleg proveïdors"
      />

      {list.length > 0 && (
        <div className="entity-list">
          {list.map((t, i) => (
            <EntityRow
              key={i}
              index={i}
              title={t.nom}
              meta={[t.servei, t.nif].filter(Boolean).join(" · ")}
              open={openIx === i}
              onToggle={() => setOpenIx(openIx === i ? -1 : i)}
              onDelete={() => remove(i)}
            >
              <Subsection index="4.1" title="Identificació">
                <div className="field-row">
                  <Field label="Nom o raó social" required>
                    <Input value={t.nom} onChange={(v) => update(i, { nom: v })} placeholder="Nom del proveïdor" />
                  </Field>
                  <Field label="NIF / CIF" help="Opcional — si no el sabeu, ho cerquem nosaltres">
                    <Input value={t.nif} onChange={(v) => update(i, { nif: v })} placeholder="B12345678" />
                  </Field>
                </div>
              </Subsection>

              <Subsection index="4.2" title="Servei">
                <Field label="Quin servei us presta" required>
                  <Input value={t.servei} onChange={(v) => update(i, { servei: v })} list={`serv-list-${i}`} placeholder="Ex: gestoria, manteniment informàtic, neteja…" />
                  <datalist id={`serv-list-${i}`}>{SERVEIS_HABITUALS.map(s => <option key={s} value={s} />)}</datalist>
                </Field>
              </Subsection>

              <Subsection index="4.3" title="Ubicació i accés">
                <Field label="Adreça" help="Opcional">
                  <Input value={t.adreca} onChange={(v) => update(i, { adreca: v })} placeholder="Adreça del proveïdor" />
                </Field>
                <Field label="Quin accés té a la vostra oficina?">
                  <RadioRow
                    name={`acces-${i}`}
                    value={t.acces_fisic}
                    onChange={(v) => update(i, { acces_fisic: v })}
                    options={[
                      { value: "amb_acces", label: "Ve a l'oficina" },
                      { value: "sense_acces", label: "Treballa des de fora (no ve mai)" },
                      { value: "sense_dades", label: "No sé si tracta dades nostres" },
                    ]}
                  />
                </Field>
              </Subsection>

              <Subsection index="4.4" title="Quines dades tracta">
                <div className="cat-group">
                  <div className="cat-group-title">Dades habituals</div>
                  <ChipSelect value={t.categories_dades} onChange={(v) => update(i, { categories_dades: v })} options={CAT_BASIQUES} />
                </div>
                <div className="cat-group">
                  <div className="cat-group-title sensitive">Dades sensibles</div>
                  <ChipSelect value={t.categories_dades} onChange={(v) => update(i, { categories_dades: v })} options={CAT_SENSIBLES} sensitive />
                </div>
                <div className="cat-group">
                  <div className="cat-group-title">Dades professionals</div>
                  <ChipSelect value={t.categories_dades} onChange={(v) => update(i, { categories_dades: v })} options={CAT_PROFESSIONALS} />
                </div>
                <div className="cat-group">
                  <div className="cat-group-title">Dades econòmiques</div>
                  <ChipSelect value={t.categories_dades} onChange={(v) => update(i, { categories_dades: v })} options={CAT_ECONOMIQUES} />
                </div>
              </Subsection>

              <Subsection index="4.5" title="Contracte">
                <Field>
                  <Toggle value={!!t.contracte_signat} onChange={(v) => update(i, { contracte_signat: v })} label="Tenim contracte signat amb aquest proveïdor" />
                </Field>
                {t.contracte_signat && (
                  <Field label="Data del contracte" help="Opcional — si no la teniu a mà, deixeu-ho en blanc">
                    <Input type="date" value={t.data_contracte} onChange={(v) => update(i, { data_contracte: v })} />
                  </Field>
                )}
              </Subsection>
            </EntityRow>
          ))}
        </div>
      )}

      <button type="button" className="add-entity" onClick={() => add({ acces_fisic: "amb_acces", categories_dades: [] })}>
        <span className="plus">＋</span>
        Afegir encarregat
      </button>
    </div>
  );
}

// ============================================
// STEP 5 — Aplicacions
// ============================================
function Step5({ data, setData }) {
  const { list, openIx, setOpenIx, add, remove, update } = useEntityList(data, setData, "aplicacions");
  const encs = data.encarregats || [];

  return (
    <div>
      <EntityTools
        onAdd={() => add({})}
        onTemplate={() => downloadTemplate('plantilla_aplicacions.xlsx')}
        onUpload={() => uploadExcel(
          { 'Nom': 'nom', 'Finalitat': 'finalitat', 'Accés': 'acces', 'Ubicació dades': 'ubicacio_dades' },
          (rows) => setData({ ...data, aplicacions: [...(data.aplicacions || []), ...rows] })
        )}
      />

      {list.length > 0 && (
        <div className="entity-list">
          {list.map((t, i) => (
            <EntityRow
              key={i}
              index={i}
              title={t.nom}
              meta={[t.finalitat, t.acces].filter(Boolean).join(" · ")}
              open={openIx === i}
              onToggle={() => setOpenIx(openIx === i ? -1 : i)}
              onDelete={() => remove(i)}
            >
              <div className="field-row">
                <Field label="Nom de l'aplicació" required>
                  <Input value={t.nom} onChange={(v) => update(i, { nom: v })} placeholder="Ex: Google Workspace, Holded, Mailchimp…" />
                </Field>
                <Field label="Per a què la feu servir">
                  <Input value={t.finalitat} onChange={(v) => update(i, { finalitat: v })} placeholder="Ex: facturació, correu, nòmines…" />
                </Field>
              </div>
              <div className="field-row">
                <Field label="Com hi accediu">
                  <Select value={t.acces} onChange={(v) => update(i, { acces: v })} options={["Per internet (al núvol)","Instal·lada a l'ordinador","Les dues coses"]} />
                </Field>
                <Field label="On guarda les dades" help="Si no ho sabeu, ja ho cerquem nosaltres a partir del nom">
                  <Select value={t.ubicacio_dades} onChange={(v) => update(i, { ubicacio_dades: v })} options={["A Europa","Fora d'Europa","No ho sé"]} />
                </Field>
              </div>
              <Field label="Proveïdor relacionat" help={encs.length ? `Si l'heu afegit al Pas 4, vinculeu-l’ho aquí` : "Aneu al Pas 4 per afegir proveïdors"}>
                <Select value={t.encarregat_tractament} onChange={(v) => update(i, { encarregat_tractament: v })} options={encs.map(e => e.nom).filter(Boolean)} />
              </Field>
            </EntityRow>
          ))}
        </div>
      )}

      <button type="button" className="add-entity" onClick={() => add({})}>
        <span className="plus">＋</span>
        Afegir aplicació
      </button>
    </div>
  );
}

// ============================================
// STEP 6 — Dispositius
// ============================================
function Step6({ data, setData }) {
  const { list, openIx, setOpenIx, add, remove, update } = useEntityList(data, setData, "dispositius");

  return (
    <div>
      <EntityTools
        onAdd={() => add({})}
        onTemplate={() => downloadTemplate('plantilla_dispositius.xlsx')}
        onUpload={() => uploadExcel(
          { 'Tipus': 'tipus', 'Marca': 'marca', 'Model': 'model', 'Usuari': 'usuari', 'SO': 'so', 'Ubicació': 'ubicacio' },
          (rows) => setData({ ...data, dispositius: [...(data.dispositius || []), ...rows] })
        )}
      />

      {list.length > 0 && (
        <div className="entity-list">
          {list.map((t, i) => (
            <EntityRow
              key={i}
              index={i}
              title={[t.marca, t.model].filter(Boolean).join(" ") || t.tipus}
              meta={[t.tipus, t.usuari, t.ubicacio].filter(Boolean).join(" · ")}
              open={openIx === i}
              onToggle={() => setOpenIx(openIx === i ? -1 : i)}
              onDelete={() => remove(i)}
            >
              <div className="field-row">
                <Field label="Tipus" required>
                  <Select value={t.tipus} onChange={(v) => update(i, { tipus: v })} options={TIPUS_DISPOSITIU} />
                </Field>
                <Field label="Sistema operatiu" help="Si no ho sabeu, mireu “Quant a aquest equip”">
                  <Input value={t.so} onChange={(v) => update(i, { so: v })} list={`so-list-${i}`} placeholder="Ex: Windows 11, macOS…" />
                  <datalist id={`so-list-${i}`}>{SO_LIST.map(s => <option key={s} value={s} />)}</datalist>
                </Field>
              </div>
              <div className="field-row">
                <Field label="Marca" help="Opcional">
                  <Input value={t.marca} onChange={(v) => update(i, { marca: v })} placeholder="Ex: Dell, Apple, HP…" />
                </Field>
                <Field label="Model" help="Opcional">
                  <Input value={t.model} onChange={(v) => update(i, { model: v })} placeholder="Ex: MacBook Pro 14" />
                </Field>
              </div>
              <div className="field-row">
                <Field label="Qui el fa servir">
                  <Input value={t.usuari} onChange={(v) => update(i, { usuari: v })} placeholder="Ex: Maria Garcia, Recepció…" />
                </Field>
                <Field label="On es troba">
                  <Input value={t.ubicacio} onChange={(v) => update(i, { ubicacio: v })} placeholder="Ex: Recepció, sala servidors, mobilitat…" />
                </Field>
              </div>
              <Field label="Notes addicionals" help="Opcional">
                <Textarea value={t.notes} onChange={(v) => update(i, { notes: v })} placeholder="Qualsevol cosa rellevant" rows={2} />
              </Field>
            </EntityRow>
          ))}
        </div>
      )}

      <button type="button" className="add-entity" onClick={() => add({})}>
        <span className="plus">＋</span>
        Afegir dispositiu
      </button>
    </div>
  );
}

Object.assign(window, { Step3, Step4, Step5, Step6, showToast, downloadTemplate, uploadExcel, WIZARD_API_URL });
