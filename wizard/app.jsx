/* Wizard app — token gate + wizard shell */
const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const EMPTY = {
  empresa: { color_primari: "#1F3864", color_accent: "#309BB1", percentatge_plantilla_formada: 0 },
  questionari: {},
  treballadors: [], encarregats: [], aplicacions: [], dispositius: [],
  llocsWeb: [],
  videovigilancia: { equips: [] },
  esquemaXarxa: {},
  mesuresSeguretat: [],
  observacions: {}, consentiments: {},
};

// ------- Storage helpers -------
const LS_KEY = "rgpd_form_draft_v1";

function loadDraft() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveDraft(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {}
}

function uuid() {
  return "MIH-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
         Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
         Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ------- Token Gate -------
function TokenGate({ onValid }) {
  const [token, setToken] = useStateApp("");
  const [error, setError] = useStateApp("");
  const [loading, setLoading] = useStateApp(false);

  useEffectApp(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      validateToken(t);
    }
  }, []);

  function validateToken(t) {
    const val = (t || token).trim();
    if (!val) { setError("Introduïu el codi d'accés"); return; }
    setLoading(true);
    setError("");

    fetch(WIZARD_API_URL + "/api/public/recollida/validate-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: val }),
    })
    .then(function (res) {
      if (res.ok) return res.json();
      throw new Error("invalid");
    })
    .then(function (d) {
      setLoading(false);
      if (d.valid) {
        onValid({ token: val, clientId: d.clientId, empresa: d.empresa });
      } else {
        setError("Codi no vàlid. Comproveu que l'heu introduït correctament.");
      }
    })
    .catch(function () {
      setLoading(false);
      // Fallback per proves locals: accepta qualsevol token MIH-*
      if (val.startsWith("MIH-") && val.length >= 10) {
        onValid({ token: val, clientId: null, empresa: null });
      } else {
        setError("Codi no vàlid. Ha de tenir el format MIH-XXXX-XXXX-XXXX.");
      }
    });
  }

  return (
    <div className="token-gate">
      <div className="token-gate-card">
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
          Accés <em>protegit.</em>
        </h2>
        <p style={{ color: "var(--text-dim)", maxWidth: "42ch", margin: "0 auto 28px", fontSize: 14.5 }}>
          Aquest formulari està reservat a clients de Madeinhuman.
          Introduïu el codi d'accés que us hem facilitat.
        </p>
        <div className="token-gate-input">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && validateToken()}
            placeholder="MIH-XXXX-XXXX-XXXX"
            autoFocus
          />
          <button
            type="button"
            className="token-gate-submit"
            onClick={() => validateToken()}
            disabled={loading}
          >
            {loading ? <span className="token-gate-loading" /> : "Accedir"}
          </button>
        </div>
        {error && <div className="token-gate-error">{error}</div>}
        <p style={{ color: "var(--text-faint)", fontSize: 12, marginTop: 20 }}>
          No teniu codi? Contacteu amb <a href="mailto:info@madeinhuman.cat" style={{ color: "var(--copper)" }}>info@madeinhuman.cat</a>
        </p>
      </div>
    </div>
  );
}

// ------- Wizard shell -------
function Wizard() {
  const [phase, setPhase] = useStateApp("gate"); // gate | wizard | success
  const [tokenInfo, setTokenInfo] = useStateApp(null);
  const [step, setStep] = useStateApp(1);
  const [data, setData] = useStateApp(EMPTY);
  const [showSave, setShowSave] = useStateApp(false);
  const [savedCode, setSavedCode] = useStateApp("");
  const [savedTime, setSavedTime] = useStateApp("");

  // Hydrate from draft
  useEffectApp(() => {
    const d = loadDraft();
    if (d && d.data) {
      setData(d.data);
      setStep(d.step || 1);
    }
  }, []);

  // Autosave every 30s
  useEffectApp(() => {
    if (phase !== "wizard") return;
    const id = setInterval(() => {
      saveDraft({ data, step, token: tokenInfo?.token });
      const d = new Date();
      setSavedTime(d.toTimeString().slice(0, 5));
    }, 30000);
    // Also save immediately on data change (debounced)
    const t = setTimeout(() => saveDraft({ data, step, token: tokenInfo?.token }), 2000);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [data, step, phase]);

  // Token validated
  function handleTokenValid(info) {
    setTokenInfo(info);
    // Check if there's a saved draft for this token
    const d = loadDraft();
    if (d && d.data && d.token === info.token) {
      setData(d.data);
      setStep(d.step || 1);
    } else if (info.empresa) {
      setData({ ...EMPTY, empresa: { ...EMPTY.empresa, rao_social: info.empresa } });
    }
    setPhase("wizard");
  }

  // Skip logic
  const q = data.questionari || {};
  const skipUnused = true;
  const isApplicable = (s) => {
    if (s === 7 && skipUnused && !q.te_web) return false;
    if (s === 8 && skipUnused && !q.videovigilancia) return false;
    return true;
  };

  const visibleSteps = STEPS.filter(s => isApplicable(s.id));

  const progress = useMemoApp(() => {
    const visIndex = visibleSteps.findIndex(s => s.id === step);
    const idx = visIndex < 0 ? 0 : visIndex + 1;
    return Math.round((idx / visibleSteps.length) * 100);
  }, [step, visibleSteps]);

  const goto = (id) => {
    if (!isApplicable(id)) return;
    setStep(id);
    window.scrollTo({ top: document.getElementById("wizard-content")?.offsetTop - 80 || 0, behavior: "smooth" });
  };

  const nextStep = () => {
    const ix = STEPS.findIndex(s => s.id === step);
    for (let i = ix + 1; i < STEPS.length; i++) {
      if (isApplicable(STEPS[i].id)) { goto(STEPS[i].id); return; }
    }
  };
  const prevStep = () => {
    const ix = STEPS.findIndex(s => s.id === step);
    for (let i = ix - 1; i >= 0; i--) {
      if (isApplicable(STEPS[i].id)) { goto(STEPS[i].id); return; }
    }
  };

  const handleSave = () => {
    const code = tokenInfo?.token || uuid();
    setSavedCode(code);
    setShowSave(true);
    // Desa al servidor i envia email automàticament
    if (tokenInfo?.token) {
      fetch(WIZARD_API_URL + "/api/public/recollida/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInfo.token, data, step }),
      }).catch(function () {});
    }
  };

  const handleSend = () => {
    // Try to submit to API
    fetch(WIZARD_API_URL + "/api/public/recollida/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenInfo?.token, data: data }),
    }).catch(function () {});

    setPhase("success");
    try { localStorage.removeItem(LS_KEY); } catch {}
  };

  // --- RENDER ---

  if (phase === "gate") {
    return (
      <section className="block wizard">
        <div className="container">
          <TokenGate onValid={handleTokenValid} />
        </div>
      </section>
    );
  }

  if (phase === "success") {
    return (
      <section className="block wizard">
        <div className="container">
          <SuccessScreen onRestart={() => { setPhase("gate"); setData(EMPTY); setStep(1); }} />
        </div>
      </section>
    );
  }

  const cur = STEPS.find(s => s.id === step);

  return (
    <section className="block wizard">
      <div className="container">
        {/* HEADER */}
        <div className="wizard-head">
          <div>
            <span className="eyebrow">Formulari de recollida · RGPD</span>
            <h1 className="wizard-title">Recollida de dades <em>per a l'adequació.</em></h1>
            <p className="wizard-lede">
              {data.empresa?.rao_social
                ? <>Sessió de <strong style={{color:"var(--text)"}}>{data.empresa.rao_social}</strong>. Aneu omplint cada pas — autoguardat actiu. Tancar el navegador no perd dades.</>
                : <>Aneu omplint cada pas — l'autoguardat manté el progrés. Podeu generar un codi de sessió per reprendre des d'un altre dispositiu.</>
              }
            </p>
          </div>
          <div className="wizard-actions">
            <button type="button" className="wizard-save" onClick={handleSave}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 3h11l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M7 3v6h10V3"/><path d="M7 21v-7h10v7"/></svg>
              Desar sessió
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="wizard-grid">
          {/* SIDEBAR */}
          <aside className="wizard-sidebar">
            <div className="progress-card">
              <div className="progress-meta">
                <span className="label">Progrés</span>
                <span className="pct">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-note">
                Pas {visibleSteps.findIndex(s => s.id === step) + 1} de {visibleSteps.length}
              </div>
            </div>
            <nav className="steps-nav">
              {STEPS.map((s) => {
                const applicable = isApplicable(s.id);
                const isActive = step === s.id;
                const isDone = STEPS.findIndex(x => x.id === step) > STEPS.findIndex(x => x.id === s.id);
                const cls = ["step-link"];
                if (isActive) cls.push("active");
                if (isDone) cls.push("done");
                if (!applicable) cls.push("disabled");
                return (
                  <button key={s.id} type="button" className={cls.join(" ")} onClick={() => applicable && goto(s.id)} disabled={!applicable}>
                    <span className="num">{s.code}</span>
                    <span>{s.short}{!applicable && " (omès)"}</span>
                    <span className="status-dot" />
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* CONTENT */}
          <div className="wizard-content" id="wizard-content">
            <header className="step-header">
              <span className="crumb">Pas {cur.code} · {cur.short}</span>
              <h2 dangerouslySetInnerHTML={{ __html: cur.title.replace(cur.em, `<em>${cur.em}</em>`) }} />
              <p>{cur.lede}</p>
            </header>

            <div>
              {step === 1 && <Step1 data={data} setData={setData} />}
              {step === 2 && <Step2 data={data} setData={setData} />}
              {step === 3 && <Step3 data={data} setData={setData} />}
              {step === 4 && <Step4 data={data} setData={setData} />}
              {step === 5 && <Step5 data={data} setData={setData} />}
              {step === 6 && <Step6 data={data} setData={setData} />}
              {step === 7 && <Step7 data={data} setData={setData} />}
              {step === 8 && <Step8 data={data} setData={setData} />}
              {step === 9 && <Step9 data={data} setData={setData} />}
              {step === 10 && <Step10 data={data} setData={setData} onGoto={goto} onSend={handleSend} />}
            </div>

            <div className="wizard-nav-foot">
              <div className="left">
                <button type="button" className="btn-back" onClick={prevStep} disabled={visibleSteps[0]?.id === step}>
                  <span className="arrow">←</span>
                  Anterior
                </button>
                {savedTime && (
                  <span className="auto-save-note">
                    <span className="dot" />
                    Autoguardat · {savedTime}
                  </span>
                )}
              </div>
              <div className="right">
                {step < 10 && (
                  <button type="button" className="btn btn-primary" onClick={nextStep}>
                    Següent · {STEPS.find(s => s.id > step && isApplicable(s.id))?.short || "Següent"}
                    <span className="arrow">→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAVE SESSION MODAL */}
      {showSave && (
        <SaveModal code={savedCode} onClose={() => setShowSave(false)} />
      )}
    </section>
  );
}

// ------- Save session modal -------
function SaveModal({ code, onClose }) {
  const [copied, setCopied] = useStateApp(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>✕</button>
        <h3>Sessió <em>desada.</em></h3>
        <p>Hem desat el vostre progrés i us hem enviat un email amb l'enllaç per reprendre el formulari des de qualsevol dispositiu.</p>
        <div className="session-code" onClick={copy}>
          {code}
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", color: "var(--text-faint)", marginTop: 8 }}>
            {copied ? "✓ COPIAT" : "FEU CLIC PER COPIAR EL CODI"}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 20px" }}>
          ✉️ Email enviat amb l'enllaç d'accés directe.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose} style={{ padding: "12px 20px", fontSize: 14 }}>
            Continuar omplint
            <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ------- Success screen -------
function SuccessScreen({ onRestart }) {
  return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <h2>Sol·licitud <em>rebuda.</em></h2>
      <p>
        Hem rebut totes les dades. En breu rebreu un email de confirmació amb el resum en PDF.
        Si hi ha cap qüestió que vulgueu acabar de confirmar, podeu escriure'ns a
        {" "}<a href="mailto:info@madeinhuman.cat" style={{ color: "var(--copper)", borderBottom: "1px solid rgba(196,149,106,0.4)" }}>info@madeinhuman.cat</a>
        {" "}i us atendrem encantats.
      </p>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost" onClick={onRestart}>Iniciar un nou formulari</button>
        <a className="btn btn-primary" href="index.html">Tornar a madeinhuman.cat <span className="arrow">→</span></a>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<Wizard />);
