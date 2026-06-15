/* Shared form components for the RGPD wizard */
const { useState, useEffect, useRef, useMemo } = React;

// ============ FIELD primitives ============
function Field({ label, required, help, children, full }) {
  return (
    <div className="field" style={full ? { gridColumn: "1 / -1" } : null}>
      {label && (
        <label>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {help && <div className="field-help">{help}</div>}
    </div>
  );
}

function Input({ value = "", onChange, placeholder, type = "text", list, ...rest }) {
  return (
    <input
      className="input"
      type={type}
      value={value}
      placeholder={placeholder}
      list={list}
      onChange={(e) => onChange && onChange(e.target.value)}
      {...rest}
    />
  );
}

function Textarea({ value = "", onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      className="textarea"
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  );
}

function Select({ value = "", onChange, options, placeholder = "Seleccioneu…" }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange && onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <label className={`toggle ${value ? "on" : ""}`} onClick={(e) => { e.preventDefault(); onChange(!value); }}>
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

function RadioRow({ name, value, onChange, options }) {
  return (
    <div className="radio-row">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        const sel = value === v;
        return (
          <label key={v} className={`radio ${sel ? "checked" : ""}`} onClick={() => onChange(v)}>
            <input type="radio" name={name} checked={sel} readOnly />
            <span className="dot" />
            <span>{l}</span>
          </label>
        );
      })}
    </div>
  );
}

function Checkbox({ value, onChange, label }) {
  return (
    <label className={`check ${value ? "checked" : ""}`} onClick={(e) => { e.preventDefault(); onChange(!value); }}>
      <input type="checkbox" checked={!!value} readOnly />
      <span className="box" />
      <span>{label}</span>
    </label>
  );
}

function Slider({ value, onChange, min = 0, max = 100, step = 1, suffix = "%" }) {
  return (
    <div className="slider-field">
      <input type="range" min={min} max={max} step={step} value={value || 0} onChange={(e) => onChange(parseInt(e.target.value))} />
      <div className="slider-val">{value || 0}{suffix}</div>
    </div>
  );
}

function ColorField({ value, onChange, defaultValue = "#1F3864" }) {
  const v = value || defaultValue;
  return (
    <div className="color-field">
      <input type="color" value={v} onChange={(e) => onChange(e.target.value)} />
      <input className="input" type="text" value={v} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FileDrop({ value, onChange, accept, hint = "PNG, JPG, GIF · max 2MB" }) {
  const ref = useRef();
  return (
    <div className={`file-drop ${value ? "has-file" : ""}`} onClick={() => ref.current?.click()}>
      <div className="icon">{value ? "✓" : "↑"}</div>
      <div className="label">{value || "Arrossegueu un fitxer o feu clic per pujar"}</div>
      <div className="hint">{hint}</div>
      <input ref={ref} type="file" accept={accept} onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onChange(f.name);
      }} />
    </div>
  );
}

// ============ Section frame (numbered card like the existing site) ============
function FormSection({ num, title, subtitle, children }) {
  return (
    <div className="form-section">
      <div className="form-section-header">
        <div className="form-section-num">{num}</div>
        <div>
          <div className="form-section-title">{title}</div>
          {subtitle && <div className="form-section-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="form-section-body">{children}</div>
    </div>
  );
}

function Subsection({ index, title, children }) {
  return (
    <div className="subsection">
      <div className="subsection-title">
        {index && <span className="index">{index}</span>}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ============ Q card (toggle card for Step 2) ============
function QCard({ icon, label, value, onChange, tooltip }) {
  return (
    <button
      type="button"
      className={`q-card ${value ? "on" : ""}`}
      onClick={() => onChange(!value)}
      title={tooltip || ""}
    >
      <span className="ico">{icon}</span>
      <span className="q-label">{label}</span>
      <span className="q-check">✓</span>
    </button>
  );
}

// ============ Chip selector ============
function ChipSelect({ value = [], onChange, options, sensitive }) {
  const set = new Set(value);
  return (
    <div className="chips">
      {options.map((o) => {
        const on = set.has(o);
        return (
          <button
            type="button"
            key={o}
            className={`chip ${sensitive ? "sensitive" : ""} ${on ? "on" : ""}`}
            onClick={() => {
              const next = new Set(set);
              if (on) next.delete(o); else next.add(o);
              onChange([...next]);
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ============ Repeatable entity row (accordion) ============
function EntityRow({ index, title, meta, open, onToggle, onDelete, children }) {
  return (
    <div className={`entity-row ${open ? "open" : ""}`}>
      <div className="entity-row-head" onClick={onToggle}>
        <div className="ix">#{String(index + 1).padStart(2, "0")}</div>
        <div className="ttl">
          <div className="name">{title || <span style={{ color: "var(--text-faint)" }}>Sense nom</span>}</div>
          {meta && <div className="meta">{meta}</div>}
        </div>
        <button type="button" className="del" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Eliminar">✕</button>
        <div className="chev">▾</div>
      </div>
      {open && <div className="entity-row-body" onClick={(e) => e.stopPropagation()}>{children}</div>}
    </div>
  );
}

// ============ Entity entry toolbar ============
function EntityTools({ onAdd, onTemplate, onUpload, onCatalog, catalogLabel }) {
  return (
    <div className="entity-tools">
      <button type="button" className="entity-tool-btn" onClick={onAdd}>
        <span className="icon">＋</span>
        <span className="ttl">Manualment</span>
        <span className="desc">Afegir un per un</span>
      </button>
      <button type="button" className="entity-tool-btn" onClick={onTemplate}>
        <span className="icon">↓</span>
        <span className="ttl">Plantilla Excel</span>
        <span className="desc">Descarregar .xlsx</span>
      </button>
      <button type="button" className="entity-tool-btn" onClick={onUpload}>
        <span className="icon">↑</span>
        <span className="ttl">Pujar Excel</span>
        <span className="desc">Importar dades</span>
      </button>
      {onCatalog && (
        <button type="button" className="entity-tool-btn" onClick={onCatalog}>
          <span className="icon">⌕</span>
          <span className="ttl">{catalogLabel || "Catàleg"}</span>
          <span className="desc">Proveïdors habituals</span>
        </button>
      )}
    </div>
  );
}

// expose
Object.assign(window, {
  Field, Input, Textarea, Select, Toggle, RadioRow, Checkbox, Slider,
  ColorField, FileDrop, FormSection, Subsection, QCard, ChipSelect,
  EntityRow, EntityTools,
});
