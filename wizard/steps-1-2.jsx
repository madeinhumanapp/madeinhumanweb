/* Step 1 — Dades de l'empresa, Step 2 — Qüestionari */
const { useState: useState_1_2 } = React;

// ============================================
// STEP 1 — Dades de l'empresa
// ============================================
function Step1({ data, setData }) {
  const e = data.empresa || {};
  const upd = (patch) => setData({ ...data, empresa: { ...e, ...patch } });

  return (
    <div className="step-body-wide">
      <FormSection num="1.1" title="Identificació" subtitle="Dades fiscals de l'organització">
        <div className="field-row">
          <Field label="Raó social" required>
            <Input value={e.rao_social} onChange={(v) => upd({ rao_social: v })} placeholder="Ex: Empresa Example SL" />
          </Field>
          <Field label="NIF / CIF" required>
            <Input value={e.nif} onChange={(v) => upd({ nif: v })} placeholder="Ex: B12345678" />
          </Field>
        </div>
        <Field label="Activitat (CNAE)" help="Comenceu a escriure el codi o l'activitat">
          <Input value={e.activitat} onChange={(v) => upd({ activitat: v })} placeholder="Ex: 6201 — Programació informàtica" list="cnae-list" />
          <datalist id="cnae-list">
            <option value="6201 — Programació informàtica" />
            <option value="6202 — Consultoria informàtica" />
            <option value="6920 — Activitats comptables i auditoria" />
            <option value="7022 — Consultoria de gestió empresarial" />
            <option value="8610 — Activitats hospitalàries" />
            <option value="8690 — Altres activitats sanitàries" />
            <option value="4711 — Comerç al detall en establiments no especialitzats" />
            <option value="5610 — Restaurants i llocs de menjar" />
          </datalist>
        </Field>
      </FormSection>

      <FormSection num="1.2" title="Adreça" subtitle="Domicili social">
        <Field label="Adreça" required>
          <Input value={e.adreca} onChange={(v) => upd({ adreca: v })} placeholder="Ex: Carrer Major 12, 1r 2a" />
        </Field>
        <div className="field-trio">
          <Field label="Codi postal" required>
            <Input value={e.cp} onChange={(v) => upd({ cp: v })} placeholder="08001" />
          </Field>
          <Field label="Població" required>
            <Input value={e.poblacio} onChange={(v) => upd({ poblacio: v })} placeholder="Barcelona" />
          </Field>
          <Field label="Província" required>
            <Select value={e.provincia} onChange={(v) => upd({ provincia: v })} options={PROVINCIES} />
          </Field>
        </div>
      </FormSection>

      <FormSection num="1.3" title="Contacte" subtitle="Canals de comunicació de l'empresa">
        <div className="field-row">
          <Field label="Telèfon">
            <Input type="tel" value={e.telefon} onChange={(v) => upd({ telefon: v })} placeholder="931234567" />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={e.email} onChange={(v) => upd({ email: v })} placeholder="info@empresa.cat" />
          </Field>
        </div>
        <Field label="Pàgina web">
          <Input type="url" value={e.web} onChange={(v) => upd({ web: v })} placeholder="https://www.empresa.cat" />
        </Field>
      </FormSection>

      <FormSection num="1.4" title="Representant legal" subtitle="Persona signant dels documents">
        <div className="field-row">
          <Field label="Nom complet" required>
            <Input value={e.representant_nom} onChange={(v) => upd({ representant_nom: v })} placeholder="Nom i cognoms" />
          </Field>
          <Field label="DNI / NIE" required>
            <Input value={e.representant_dni} onChange={(v) => upd({ representant_dni: v })} placeholder="12345678A" />
          </Field>
        </div>
      </FormSection>

      <FormSection num="1.5" title="Branding corporatiu" subtitle="Per personalitzar la documentació generada">
        <Field label="Logotip de l'empresa" help="PNG, JPG o GIF · max 2MB">
          <FileDrop value={e.logo} onChange={(v) => upd({ logo: v })} accept="image/png,image/jpeg,image/gif" />
        </Field>
        <div className="field-row">
          <Field label="Color primari">
            <ColorField value={e.color_primari} onChange={(v) => upd({ color_primari: v })} defaultValue="#1F3864" />
          </Field>
          <Field label="Color d'accent">
            <ColorField value={e.color_accent} onChange={(v) => upd({ color_accent: v })} defaultValue="#309BB1" />
          </Field>
        </div>
      </FormSection>

      <FormSection num="1.6" title="Delegat de Protecció de Dades" subtitle="Només si en teniu designat un">
        <Field>
          <Toggle value={!!e.te_dpd} onChange={(v) => upd({ te_dpd: v })} label="Tenim DPD designat" />
        </Field>
        {e.te_dpd && (
          <div className="field-row" style={{ marginTop: 8 }}>
            <Field label="Nom del DPD" required>
              <Input value={e.dpd_nom} onChange={(v) => upd({ dpd_nom: v })} placeholder="Nom i cognoms" />
            </Field>
            <Field label="Email del DPD" required>
              <Input type="email" value={e.dpd_email} onChange={(v) => upd({ dpd_email: v })} placeholder="dpd@empresa.cat" />
            </Field>
          </div>
        )}
      </FormSection>

      <FormSection num="1.7" title="Transferències internacionals" subtitle="Si treballeu amb serveis fora de la UE (Google, Microsoft, etc.) ho marquem aquí — si no ho sabeu, ho podem revisar nosaltres">
        <Field>
          <Toggle value={!!e.transferencies_int} onChange={(v) => upd({ transferencies_int: v })} label="Algun proveïdor allotja dades fora de la Unió Europea" />
        </Field>
        {e.transferencies_int && (
          <Field label="Països de destinació (si ho sabeu)" help="Opcional — ja ho revisarem nosaltres amb cada proveïdor">
            <Input value={e.paisos_transferencia} onChange={(v) => upd({ paisos_transferencia: v })} placeholder="Ex: EUA, Regne Unit" />
          </Field>
        )}
      </FormSection>

      <FormSection num="1.8" title="Responsable intern" subtitle="Persona de l'empresa que serà el contacte amb Madeinhuman">
        <div className="field-row">
          <Field label="Nom del responsable">
            <Input value={e.responsable_seguretat_nom} onChange={(v) => upd({ responsable_seguretat_nom: v })} placeholder="Nom i cognoms" />
          </Field>
          <Field label="Càrrec a l'empresa">
            <Input value={e.responsable_seguretat_carrec} onChange={(v) => upd({ responsable_seguretat_carrec: v })} placeholder="Ex: Gerent, administratiu, recursos humans…" />
          </Field>
        </div>
      </FormSection>
    </div>
  );
}

// ============================================
// STEP 2 — Qüestionari (toggle cards)
// ============================================
function Step2({ data, setData }) {
  const q = data.questionari || {};
  const upd = (k, v) => setData({ ...data, questionari: { ...q, [k]: v } });
  const totalActius = Object.values(q).filter(Boolean).length;

  return (
    <div>
      <div style={{
        display: "flex", gap: 16, alignItems: "center", marginBottom: 28,
        padding: 18, border: "1px solid var(--border)", borderRadius: 14,
        background: "var(--bg-card)",
      }}>
        <div style={{
          fontFamily: "var(--font-serif)", fontSize: 36, fontStyle: "italic",
          color: "var(--copper)", fontWeight: 500, lineHeight: 1,
        }}>{totalActius}</div>
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 500 }}>tractaments actius</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em", marginTop: 4 }}>
            Cada activitat marcada generarà un Registre d'Activitat de Tractament (RAT).
          </div>
        </div>
      </div>

      {Q_BLOCS.map((bloc) => {
        const counts = bloc.items.filter(it => q[it.k]).length;
        return (
          <div key={bloc.code} className="q-bloc">
            <div className="q-bloc-head">
              <span className="num">Bloc {bloc.code}</span>
              <h3>{bloc.title}</h3>
              <span className="count">{counts} / {bloc.items.length}</span>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)",
              letterSpacing: "0.08em", marginBottom: 14, marginLeft: 2
            }}>{bloc.subtitle}</div>
            <div className="q-grid">
              {bloc.items.map((it) => (
                <QCard
                  key={it.k}
                  icon={it.i}
                  label={it.q}
                  tooltip={it.t}
                  value={!!q[it.k]}
                  onChange={(v) => upd(it.k, v)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Step1, Step2 });
