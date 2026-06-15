/* Steps 7-10 — Web/Cookies, Videovigilància, Seguretat, Resum */

// ============================================
// STEP 7 — Web i Cookies
// ============================================
function Step7({ data, setData }) {
  const q = data.questionari || {};
  if (!q.te_web) {
    return (
      <div style={{
        padding: 40, border: "1px dashed var(--border-strong)", borderRadius: 16,
        textAlign: "center", color: "var(--text-dim)", background: "rgba(255,255,255,0.015)"
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, marginBottom: 8, color: "var(--text)" }}>
          Pas no aplicable
        </h3>
        <p style={{ maxWidth: 48 + "ch", margin: "0 auto" }}>
          Heu indicat al Pas 2 que no teniu pàgina web. Aquest pas es saltarà automàticament.
          Si era un error, torneu al qüestionari i marqueu <em>"Teniu pàgina web?"</em>.
        </p>
      </div>
    );
  }

  const llocs = data.llocsWeb || [];
  const upd = (next) => setData({ ...data, llocsWeb: next });
  const addWeb = () => upd([...llocs, { url: "", nom: "", cookies: [] }]);
  const removeWeb = (i) => upd(llocs.filter((_, ix) => ix !== i));
  const updWeb = (i, patch) => upd(llocs.map((l, ix) => ix === i ? { ...l, ...patch } : l));

  const [openWeb, setOpenWeb] = React.useState(0);
  const [openCookie, setOpenCookie] = React.useState({});

  return (
    <div>
      <FormSection num="7.1" title="Llocs web" subtitle="Afegiu cada lloc web amb les seves cookies">
        {llocs.length === 0 && (
          <div style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 12 }}>
            Cap lloc web afegit
          </div>
        )}
        <div className="entity-list">
          {llocs.map((l, i) => (
            <EntityRow
              key={i}
              index={i}
              title={l.nom || l.url || "Sense URL"}
              meta={l.cookies?.length ? `${l.cookies.length} cookies` : "Cap cookie"}
              open={openWeb === i}
              onToggle={() => setOpenWeb(openWeb === i ? -1 : i)}
              onDelete={() => removeWeb(i)}
            >
              <div className="field-row">
                <Field label="URL" required>
                  <Input type="url" value={l.url} onChange={(v) => updWeb(i, { url: v })} placeholder="https://www.empresa.cat" />
                </Field>
                <Field label="Nom identificatiu">
                  <Input value={l.nom} onChange={(v) => updWeb(i, { nom: v })} placeholder="Web corporativa" />
                </Field>
              </div>

              <Subsection index={`7.2.${i + 1}`} title="Cookies del lloc">
                <EntityTools
                  onAdd={() => updWeb(i, { cookies: [...(l.cookies || []), {}] })}
                  onTemplate={() => downloadTemplate('plantilla_cookies.xlsx')}
                  onUpload={() => uploadExcel(
                    { 'Nom': 'nom', 'Domini': 'domini', 'Tipus': 'tipus', 'Caducitat': 'caducitat', 'Descripció': 'descripcio' },
                    (rows) => updWeb(i, { cookies: [...(l.cookies || []), ...rows] })
                  )}
                  onCatalog={() => showToast("Escaneig de cookies — disponible properament")}
                  catalogLabel="Escanejar cookies"
                />
                {(l.cookies || []).map((c, ci) => {
                  const key = `${i}-${ci}`;
                  return (
                    <EntityRow
                      key={ci}
                      index={ci}
                      title={c.nom || "Sense nom"}
                      meta={[c.tipus, c.caducitat].filter(Boolean).join(" · ")}
                      open={openCookie[key]}
                      onToggle={() => setOpenCookie({ ...openCookie, [key]: !openCookie[key] })}
                      onDelete={() => updWeb(i, { cookies: l.cookies.filter((_, x) => x !== ci) })}
                    >
                      <div className="field-row">
                        <Field label="Nom" required>
                          <Input value={c.nom} onChange={(v) => updWeb(i, { cookies: l.cookies.map((cc, x) => x === ci ? { ...cc, nom: v } : cc) })} placeholder="Ex: _ga" />
                        </Field>
                        <Field label="Domini">
                          <Input value={c.domini} onChange={(v) => updWeb(i, { cookies: l.cookies.map((cc, x) => x === ci ? { ...cc, domini: v } : cc) })} placeholder="Ex: .google-analytics.com" />
                        </Field>
                      </div>
                      <div className="field-row">
                        <Field label="Tipus" required>
                          <Select value={c.tipus} onChange={(v) => updWeb(i, { cookies: l.cookies.map((cc, x) => x === ci ? { ...cc, tipus: v } : cc) })} options={TIPUS_COOKIE} />
                        </Field>
                        <Field label="Caducitat">
                          <Input value={c.caducitat} onChange={(v) => updWeb(i, { cookies: l.cookies.map((cc, x) => x === ci ? { ...cc, caducitat: v } : cc) })} placeholder="Ex: 2 anys, Sessió" />
                        </Field>
                      </div>
                      <Field label="Descripció / finalitat">
                        <Textarea value={c.descripcio} onChange={(v) => updWeb(i, { cookies: l.cookies.map((cc, x) => x === ci ? { ...cc, descripcio: v } : cc) })} rows={2} />
                      </Field>
                    </EntityRow>
                  );
                })}
                <button type="button" className="add-entity" onClick={() => updWeb(i, { cookies: [...(l.cookies || []), {}] })} style={{ marginTop: 10 }}>
                  <span className="plus">＋</span>
                  Afegir cookie
                </button>
              </Subsection>
            </EntityRow>
          ))}
        </div>
        <button type="button" className="add-entity" onClick={addWeb} style={{ marginTop: 12 }}>
          <span className="plus">＋</span>
          Afegir lloc web
        </button>
      </FormSection>
    </div>
  );
}

// ============================================
// STEP 8 — Videovigilància
// ============================================
function Step8({ data, setData }) {
  const q = data.questionari || {};
  if (!q.videovigilancia) {
    return (
      <div style={{
        padding: 40, border: "1px dashed var(--border-strong)", borderRadius: 16,
        textAlign: "center", color: "var(--text-dim)", background: "rgba(255,255,255,0.015)"
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📹</div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, marginBottom: 8, color: "var(--text)" }}>
          Pas no aplicable
        </h3>
        <p style={{ maxWidth: 48 + "ch", margin: "0 auto" }}>
          No heu indicat tenir videovigilància al qüestionari. Aquest pas es saltarà automàticament.
        </p>
      </div>
    );
  }

  const vv = data.videovigilancia || { equips: [] };
  const upd = (patch) => setData({ ...data, videovigilancia: { ...vv, ...patch } });
  const [openEq, setOpenEq] = React.useState(0);

  const addEq = () => upd({ equips: [...(vv.equips || []), {}] });
  const removeEq = (i) => upd({ equips: vv.equips.filter((_, ix) => ix !== i) });
  const updEq = (i, patch) => upd({ equips: vv.equips.map((e, ix) => ix === i ? { ...e, ...patch } : e) });

  return (
    <div>
      <FormSection num="8.1" title="Equips de videovigilància" subtitle="Càmeres, gravadors i apps de visualització">
        <div className="entity-list">
          {(vv.equips || []).map((eq, i) => (
            <EntityRow
              key={i}
              index={i}
              title={[eq.marca, eq.model].filter(Boolean).join(" ") || eq.tipus || "Equip"}
              meta={[eq.tipus, eq.ubicacio].filter(Boolean).join(" · ")}
              open={openEq === i}
              onToggle={() => setOpenEq(openEq === i ? -1 : i)}
              onDelete={() => removeEq(i)}
            >
              <div className="field-row">
                <Field label="Tipus" required>
                  <Select value={eq.tipus} onChange={(v) => updEq(i, { tipus: v })} options={TIPUS_EQUIP_VIDEO} />
                </Field>
                <Field label="Ubicació">
                  <Input value={eq.ubicacio} onChange={(v) => updEq(i, { ubicacio: v })} placeholder="Ex: Entrada principal" />
                </Field>
              </div>
              <div className="field-row">
                <Field label="Marca">
                  <Input value={eq.marca} onChange={(v) => updEq(i, { marca: v })} placeholder="Hikvision, Dahua…" />
                </Field>
                <Field label="Model">
                  <Input value={eq.model} onChange={(v) => updEq(i, { model: v })} />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea value={eq.notes} onChange={(v) => updEq(i, { notes: v })} rows={2} />
              </Field>
            </EntityRow>
          ))}
        </div>
        <button type="button" className="add-entity" onClick={addEq}>
          <span className="plus">＋</span>
          Afegir equip
        </button>
      </FormSection>

      <FormSection num="8.2" title="Configuració del sistema" subtitle="Política de gravació i avisos">
        <div className="field-row">
          <Field label="Dies de conservació de gravacions">
            <Select value={vv.dies_conservacio} onChange={(v) => upd({ dies_conservacio: v })} options={["72 hores (estàndard legal)","15 dies","30 dies (màxim legal)","Altre"]} />
          </Field>
          <Field label="Qui té accés a les imatges">
            <Input value={vv.acces_imatges} onChange={(v) => upd({ acces_imatges: v })} placeholder="Ex: Direcció, responsable seguretat" />
          </Field>
        </div>
        <Field>
          <Toggle value={!!vv.cartell_informatiu} onChange={(v) => upd({ cartell_informatiu: v })} label="Cartell informatiu col·locat a l'entrada" />
        </Field>
        <Field help="Important: no es permet enfocar la via pública, excepte una franja mínima d'accés.">
          <Toggle value={!!vv.enfoca_via_publica} onChange={(v) => upd({ enfoca_via_publica: v })} label="Alguna càmera enfoca la via pública" />
        </Field>
      </FormSection>
    </div>
  );
}

// ============================================
// STEP 9 — Esquema de xarxa i Seguretat
// ============================================
function Step9({ data, setData }) {
  const xarxa = data.esquemaXarxa || {};
  const updX = (patch) => setData({ ...data, esquemaXarxa: { ...xarxa, ...patch } });
  const sec = data.mesuresSeguretat || [];
  const updSec = (next) => setData({ ...data, mesuresSeguretat: next });

  const toggle = (item) => {
    if (sec.includes(item)) updSec(sec.filter(s => s !== item));
    else updSec([...sec, item]);
  };

  const totalMarked = sec.length;

  return (
    <div>
      <FormSection num="9.1" title="Esquema de xarxa" subtitle="Descripció breu i diagrama (opcional)">
        <Field label="Descripció de la infraestructura">
          <Textarea value={xarxa.descripcio} onChange={(v) => updX({ descripcio: v })} rows={4} placeholder="Ex: router amb tallafocs, 1 servidor NAS, 8 ordinadors, 4 portàtils, 2 impressores compartides. Wifi WPA3. Sense servidor de domini." />
        </Field>
        <Field label="Diagrama de xarxa" help="PNG, JPG o PDF · opcional · el podem elaborar nosaltres">
          <FileDrop value={xarxa.imagePath} onChange={(v) => updX({ imagePath: v })} hint="PNG · JPG · PDF" />
        </Field>
      </FormSection>

      <FormSection num="9.2" title="Mesures de seguretat actuals" subtitle={`${totalMarked} / ${SEC_TOTAL} mesures marcades`}>
        <div style={{
          padding: 14, marginBottom: 18, borderRadius: 12,
          background: "rgba(196,149,106,0.06)", border: "1px solid rgba(196,149,106,0.20)",
          fontSize: 13.5, color: "var(--text-dim)"
        }}>
          Marqueu només les coses que sabeu segur que es fan a la vostra empresa. Per a la resta, ja ens ho aclarirem en una trucada — forma part de la nostra feina.
        </div>
        <div className="sec-categories">
          {SEC_CATEGORIES.map((cat) => {
            const inCat = cat.items.filter(it => sec.includes(it)).length;
            return (
              <div key={cat.name} className="sec-cat">
                <div className="sec-cat-head">
                  <span className="name">{cat.name}</span>
                  <span className="progress">{inCat} / {cat.items.length}</span>
                </div>
                <ul>
                  {cat.items.map((it) => {
                    const on = sec.includes(it);
                    return (
                      <li key={it} className={on ? "on" : ""} onClick={() => toggle(it)}>
                        <span className="cb">{on ? "✓" : ""}</span>
                        <span>{it}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}

// ============================================
// STEP 10 — Resum i Enviament
// ============================================
function Step10({ data, setData, onGoto, onSend }) {
  const e = data.empresa || {};
  const q = data.questionari || {};
  const tractamentsActius = Object.values(q).filter(Boolean).length;
  const cookies = (data.llocsWeb || []).reduce((acc, l) => acc + (l.cookies?.length || 0), 0);
  const equips = (data.videovigilancia?.equips || []).length;
  const secs = (data.mesuresSeguretat || []).length;

  const cards = [
    {
      step: 1, title: "Empresa", sub: e.rao_social ? `${e.rao_social} · ${e.nif || "—"}` : "Pendent d'omplir",
      count: e.rao_social ? "✓" : "—",
      status: e.rao_social && e.nif && e.email ? "ok" : "warn",
    },
    {
      step: 2, title: "Qüestionari", sub: `${tractamentsActius} tractaments actius`,
      count: tractamentsActius, status: tractamentsActius > 0 ? "ok" : "warn",
    },
    {
      step: 3, title: "Treballadors", sub: "Registres amb permisos i clàusules",
      count: (data.treballadors || []).length, status: (data.treballadors || []).length > 0 ? "ok" : "warn",
    },
    {
      step: 4, title: "Encarregats", sub: "Proveïdors amb accés a dades",
      count: (data.encarregats || []).length, status: (data.encarregats || []).length > 0 ? "ok" : "warn",
    },
    {
      step: 5, title: "Aplicacions", sub: "Software i SaaS",
      count: (data.aplicacions || []).length, status: (data.aplicacions || []).length > 0 ? "ok" : "warn",
    },
    {
      step: 6, title: "Dispositius", sub: "Inventari de hardware",
      count: (data.dispositius || []).length, status: (data.dispositius || []).length > 0 ? "ok" : "warn",
    },
    {
      step: 7, title: "Web i Cookies", sub: q.te_web ? `${(data.llocsWeb || []).length} llocs · ${cookies} cookies` : "No aplicable",
      count: q.te_web ? cookies : "—", status: !q.te_web || cookies > 0 ? "ok" : "warn",
    },
    {
      step: 8, title: "Videovigilància", sub: q.videovigilancia ? `${equips} equips` : "No aplicable",
      count: q.videovigilancia ? equips : "—", status: !q.videovigilancia || equips > 0 ? "ok" : "warn",
    },
    {
      step: 9, title: "Seguretat", sub: `${secs} / ${SEC_TOTAL} mesures implementades`,
      count: secs, status: secs > 10 ? "ok" : "warn",
    },
  ];

  const obs = data.observacions || {};
  const updObs = (patch) => setData({ ...data, observacions: { ...obs, ...patch } });
  const cons = data.consentiments || {};
  const updCons = (patch) => setData({ ...data, consentiments: { ...cons, ...patch } });
  const canSend = cons.accepta_privacitat && cons.accepta_tractament;

  return (
    <div>
      <FormSection num="10.1" title="Resum de les dades" subtitle="Reviseu cada secció abans d'enviar">
        <div className="summary-grid">
          {cards.map((c) => (
            <div key={c.step} className={`summary-card ${c.status}`}>
              <div className="status">{c.status === "ok" ? "✓" : "!"}</div>
              <div className="label">
                <div className="ttl">{c.title}</div>
                <div className="sub">{c.sub}</div>
              </div>
              <div className="count">{c.count}</div>
              <button type="button" className="edit" onClick={() => onGoto(c.step)}>Editar</button>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection num="10.2" title="Observacions finals" subtitle="Notes addicionals i preferències de contacte">
        <Field label="Observacions per Madeinhuman">
          <Textarea value={obs.observacions_client} onChange={(v) => updObs({ observacions_client: v })} rows={4} placeholder="Auditories prèvies, incidents passats, urgència, dubtes concrets…" />
        </Field>
        <div className="field-row">
          <Field label="Prioritat">
            <Select value={obs.prioritat} onChange={(v) => updObs({ prioritat: v })} options={["Normal","Urgent"]} />
          </Field>
          <Field label="Preferència de contacte">
            <Select value={obs.preferencia_contacte} onChange={(v) => updObs({ preferencia_contacte: v })} options={["Email","Telèfon","WhatsApp"]} />
          </Field>
        </div>
        <Field label="Horari de contacte preferit">
          <Input value={obs.horari_contacte} onChange={(v) => updObs({ horari_contacte: v })} placeholder="Ex: Matins de 9 a 14h" />
        </Field>
      </FormSection>

      <FormSection num="10.3" title="Consentiment i enviament" subtitle="Confirmeu i envieu la sol·licitud a Madeinhuman">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label className={`privacy-check ${cons.accepta_privacitat ? "checked" : ""}`} onClick={(e) => { e.preventDefault(); updCons({ accepta_privacitat: !cons.accepta_privacitat }); }}>
            <input type="checkbox" checked={!!cons.accepta_privacitat} readOnly />
            <span className="box" />
            <span>He llegit i accepto la <a href="#">política de privacitat</a>. <span className="req">*</span></span>
          </label>
          <label className={`privacy-check ${cons.accepta_tractament ? "checked" : ""}`} onClick={(e) => { e.preventDefault(); updCons({ accepta_tractament: !cons.accepta_tractament }); }}>
            <input type="checkbox" checked={!!cons.accepta_tractament} readOnly />
            <span className="box" />
            <span>Consento el tractament de les meves dades per a l'elaboració de la documentació RGPD. <span className="req">*</span></span>
          </label>
          <label className={`privacy-check ${cons.accepta_comunicacions ? "checked" : ""}`} onClick={(e) => { e.preventDefault(); updCons({ accepta_comunicacions: !cons.accepta_comunicacions }); }}>
            <input type="checkbox" checked={!!cons.accepta_comunicacions} readOnly />
            <span className="box" />
            <span>Vull rebre comunicacions sobre novetats normatives (opcional)</span>
          </label>
        </div>

        <div className="send-cta">
          <h3>Tot a punt per <em>enviar.</em></h3>
          <p>Un cop enviat rebreu un email de confirmació amb el resum en PDF. Si hi ha cap qüestió que voleu acabar de confirmar, podeu contactar amb Madeinhuman a <a href="mailto:info@madeinhuman.cat" style={{ color: "var(--copper)", borderBottom: "1px solid rgba(196,149,106,0.4)" }}>info@madeinhuman.cat</a> i us atendrem encantats.</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSend}
            onClick={() => canSend && onSend()}
            style={{ minWidth: 280, justifyContent: "center", opacity: canSend ? 1 : 0.5, cursor: canSend ? "pointer" : "not-allowed" }}
          >
            Enviar dades per al RGPD
            <span className="arrow">→</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
}

Object.assign(window, { Step7, Step8, Step9, Step10 });
