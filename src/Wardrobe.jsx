// My Wardrobe: clothes that fit (or don't), kudos and the leaderboard.
// Talks only to our own /api/* functions; the server checks the Google sign-in.
import { useState, useEffect, useMemo, useCallback } from "react";

export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const GARMENTS = [["tops", "Top / shirt / jumper"], ["bottoms", "Trousers / jeans / skirt"], ["one-piece", "Dress / jumpsuit"], ["outerwear", "Coat / jacket"], ["knitwear", "Knitwear"], ["suit", "Suit / blazer"], ["shoes", "Shoes"], ["other", "Other"]];
const SYSTEMS = [["uk", "UK"], ["letter", "XS–XL"], ["eu", "EU"], ["us", "US"], ["waist-leg", "Waist / leg"], ["other", "Other"]];
const FITS = [["too_small", "Too small"], ["just_right", "Just right"], ["too_big", "Too big"]];
const AREAS = [["chest", "Chest / bust"], ["waist", "Waist"], ["hips", "Hips"], ["length", "Length"]];
const AREA_FITS = [["tight", "Tight"], ["right", "Right"], ["loose", "Loose"]];
const FLAT = [["pit_to_pit", "Pit to pit"], ["length", "Length"], ["waist_flat", "Waist (flat)"], ["inside_leg", "Inside leg"]];
const BOUGHT = [["", "—"], ["vinted", "Vinted"], ["ebay", "eBay"], ["depop", "Depop"], ["charity", "Charity shop"], ["store", "In a shop"], ["online", "Online shop"], ["gift", "Gift"], ["other", "Other"]];
const FIT_LABEL = Object.fromEntries(FITS);
const GARMENT_LABEL = Object.fromEntries(GARMENTS);

const emptyForm = (gender) => ({ gender, brand_name: "", garment_type: "tops", size_label: "", size_system: "uk", overall_fit: "", fit_by_area: {}, bought_year: "", bought_on: "", garment_cm: {}, notes: "" });

export default function Wardrobe({ user, token, onAuthError, onSignIn, onSignOut, brandsByGender, gender, dark, kudos, setKudos }) {
  const [items, setItems] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(() => emptyForm(gender));
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [board, setBoard] = useState({ period: "month", rows: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  const ink = dark ? "#e8f5e9" : "#122318", soft = dark ? "#a8ddb8" : "#555", line = dark ? "#2a4535" : "#e2ded5", panel = dark ? "#16261c" : "white";
  const input = { padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${line}`, fontSize: 14, background: dark ? "#0f1d14" : "white", color: ink, width: "100%", boxSizing: "border-box" };
  const label = { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: soft, display: "block", marginBottom: 6 };

  const fail = useCallback((e) => {
    if (e.status === 401) { onAuthError(); return; }
    setMsg({ kind: "error", text: e.message });
  }, [onAuthError]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [me, w] = await Promise.all([api("/api/me", { token }), api("/api/wardrobe", { token })]);
      setProfile(me.user); setKudos(me.kudos); setItems(w.items);
    } catch (e) { fail(e); setItems([]); }
  }, [token, fail, setKudos]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let live = true;
    api(`/api/leaderboard?period=${board.period}`).then((d) => live && setBoard((b) => ({ ...b, rows: d.rows }))).catch(() => live && setBoard((b) => ({ ...b, rows: [] })));
    return () => { live = false; };
  }, [board.period, kudos?.total]);

  const brandList = useMemo(() => brandsByGender[form.gender] || [], [brandsByGender, form.gender]);
  const matchedBrand = useMemo(() => brandList.find((b) => b.name.toLowerCase() === form.brand_name.trim().toLowerCase()), [brandList, form.brand_name]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setArea = (a, v) => setForm((f) => ({ ...f, fit_by_area: { ...f.fit_by_area, [a]: f.fit_by_area[a] === v ? undefined : v } }));
  const setFlat = (k, v) => setForm((f) => ({ ...f, garment_cm: { ...f.garment_cm, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.brand_name.trim() || !form.size_label.trim()) { setMsg({ kind: "error", text: "Add the brand and the size on the label." }); return; }
    setBusy(true); setMsg(null);
    try {
      const body = { ...form, brand_id: matchedBrand?.id || null, overall_fit: form.overall_fit || null, bought_year: form.bought_year ? +form.bought_year : null, bought_on: form.bought_on || null };
      delete body.gender;
      const r = await api("/api/wardrobe", { method: "POST", token, body });
      setItems((xs) => [r.item, ...(xs || [])]);
      setKudos(r.kudos);
      const pts = r.earned.reduce((s, p) => s + p.points, 0);
      const why = r.earned.map((p) => p.kind === "item" ? "fit verdict" : p.kind === "garment_cm" ? "measurements" : "first report for this size").join(" + ");
      setMsg({ kind: "ok", text: pts ? `Saved. +${pts} kudos (${why}).` : r.capped ? "Saved. You've reached today's kudos limit, but your item still counts." : "Saved. Add a fit verdict or two flat measurements to earn kudos." + (r.dropped?.length ? ` Some measurements looked out of range and weren't saved: ${r.dropped.join(", ")}.` : "") });
      setForm(emptyForm(form.gender)); setMore(false);
    } catch (e2) { fail(e2); }
    setBusy(false);
  };

  const remove = async (id) => {
    try { const r = await api(`/api/wardrobe?id=${id}`, { method: "DELETE", token }); setItems((xs) => xs.filter((x) => x.id !== id)); setKudos(r.kudos); }
    catch (e) { fail(e); }
  };

  const openSettings = () => { setSettings({ display_name: profile?.display_name || "", leaderboard_opt_in: !!profile?.leaderboard_opt_in, measurements: { ...(profile?.measurements || {}) } }); setSettingsOpen(true); };
  const saveSettings = async () => {
    try {
      const r = await api("/api/me", { method: "PATCH", token, body: settings });
      setProfile(r.user); setSettingsOpen(false); setMsg({ kind: "ok", text: "Settings saved." });
      api(`/api/leaderboard?period=${board.period}`).then((d) => setBoard((b) => ({ ...b, rows: d.rows }))).catch(() => {});
    } catch (e) { fail(e); }
  };
  const deleteAccount = async () => {
    if (settings?.confirmDelete !== "DELETE") { setMsg({ kind: "error", text: "Type DELETE in the box to confirm." }); return; }
    try { await api("/api/me", { method: "DELETE", token }); onSignOut(); }
    catch (e) { fail(e); }
  };

  const Pill = ({ on, onClick, children }) => (
    <button type="button" className="btn ins" onClick={onClick} style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1.5px solid ${on ? "#2d7a4a" : line}`, background: on ? "#2d7a4a" : panel, color: on ? "white" : soft }}>{children}</button>
  );

  if (!user || !token) {
    return (
      <div className="card" style={{ padding: "28px", textAlign: "center", background: panel }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, color: ink, margin: "0 0 10px" }}>👕 My Wardrobe</h2>
        <p className="ins" style={{ fontSize: 14, color: soft, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 18px" }}>
          Log clothes you own and how they fit. Your wardrobe works out your size at other brands, and every fit report helps other second-hand shoppers. You earn kudos for each one.
        </p>
        <button className="btn ins" onClick={onSignIn} style={{ padding: "12px 24px", background: "#2d7a4a", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>Sign in to start</button>
        <Leaderboard board={board} setBoard={setBoard} ink={ink} soft={soft} line={line} panel={panel} />
      </div>
    );
  }

  return (
    <div className="stagger">
      {/* Summary */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: 18, background: dark ? "#16261c" : "linear-gradient(135deg,#f0f9f4,#f5f3ee)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 500, color: ink, margin: 0 }}>👕 {profile?.display_name || user.name?.split(" ")[0] || "My"}'s wardrobe</h2>
            <p className="ins" style={{ fontSize: 13, color: soft, margin: "6px 0 0" }}>Each item you log with a fit verdict helps someone else buy the right size second-hand.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[["Kudos", kudos?.total ?? "…"], ["This month", kudos?.month ?? "…"], ["Items", items ? items.length : "…"]].map(([k, v]) => (
              <div key={k} style={{ padding: "10px 16px", background: panel, borderRadius: 10, textAlign: "center", minWidth: 74, border: `1px solid ${line}` }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#2d7a4a" }}>{v}</div>
                <div className="ins" style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: soft }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn ins" onClick={openSettings} style={{ fontSize: 12, color: "#2d7a4a", background: "none", textDecoration: "underline", padding: 0 }}>Settings and leaderboard name</button>
          <button className="btn ins" onClick={onSignOut} style={{ fontSize: 12, color: soft, background: "none", textDecoration: "underline", padding: 0 }}>Sign out</button>
        </div>
      </div>

      {msg && <div className="ins" role="status" style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, background: msg.kind === "ok" ? "#eef6f0" : "#fdecea", color: msg.kind === "ok" ? "#1e5c30" : "#8a2a1a", border: `1px solid ${msg.kind === "ok" ? "#b8d8c0" : "#f0c0b8"}` }}>{msg.text}</div>}

      {settingsOpen && settings && (
        <div className="card" style={{ padding: "20px 24px", marginBottom: 18, background: panel }}>
          <h3 style={{ fontSize: 17, color: ink, margin: "0 0 14px", fontWeight: 600 }}>Settings</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
            <div><label style={label} htmlFor="w-dn">Leaderboard name</label><input id="w-dn" style={input} maxLength={40} value={settings.display_name} onChange={(e) => setSettings({ ...settings, display_name: e.target.value })} placeholder="e.g. VintageAsh" /></div>
            <label className="ins" style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: ink, marginTop: 20 }}><input type="checkbox" checked={settings.leaderboard_opt_in} onChange={(e) => setSettings({ ...settings, leaderboard_opt_in: e.target.checked })} /> Show me on the public leaderboard (name only)</label>
          </div>
          <p className="ins" style={{ fontSize: 12, color: soft, margin: "16px 0 8px" }}>Your body measurements (optional, private, cm). Used only to work out your size; never shown to anyone.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
            {[["bust", "Bust / chest"], ["waist", "Waist"], ["hips", "Hips"], ["height", "Height"], ["inside_leg", "Inside leg"]].map(([k, l]) => (
              <div key={k}><label style={label} htmlFor={`m-${k}`}>{l}</label><input id={`m-${k}`} style={input} inputMode="decimal" value={settings.measurements[k] ?? ""} onChange={(e) => setSettings({ ...settings, measurements: { ...settings.measurements, [k]: e.target.value } })} /></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn ins" onClick={saveSettings} style={{ padding: "10px 20px", background: "#2d7a4a", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Save</button>
            <button className="btn ins" onClick={() => setSettingsOpen(false)} style={{ padding: "10px 16px", background: "none", color: soft, borderRadius: 8, fontSize: 13, border: `1px solid ${line}` }}>Cancel</button>
          </div>
          <details style={{ marginTop: 18 }}>
            <summary className="ins" style={{ fontSize: 12, color: "#8a2a1a", cursor: "pointer" }}>Delete my account</summary>
            <p className="ins" style={{ fontSize: 12, color: soft, lineHeight: 1.6 }}>This permanently deletes your wardrobe, kudos and measurements. Type DELETE to confirm.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input aria-label="Type DELETE to confirm" style={{ ...input, width: 140 }} value={settings.confirmDelete || ""} onChange={(e) => setSettings({ ...settings, confirmDelete: e.target.value })} />
              <button className="btn ins" onClick={deleteAccount} style={{ padding: "10px 16px", background: "#8a2a1a", color: "white", borderRadius: 8, fontSize: 13 }}>Delete everything</button>
            </div>
          </details>
        </div>
      )}

      {/* Add an item */}
      <form className="card" onSubmit={submit} style={{ padding: "20px 24px", marginBottom: 18, background: panel }}>
        <h3 style={{ fontSize: 17, color: ink, margin: "0 0 4px", fontWeight: 600 }}>Add something you own</h3>
        <p className="ins" style={{ fontSize: 12, color: soft, margin: "0 0 14px" }}>Brand, size and a fit verdict take 20 seconds. Flat measurements earn more.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          <div><label style={label} htmlFor="w-g">For</label>
            <select id="w-g" style={input} value={form.gender} onChange={(e) => set("gender", e.target.value)}><option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option></select></div>
          <div style={{ gridColumn: "span 2", minWidth: 0 }}><label style={label} htmlFor="w-brand">Brand</label>
            <input id="w-brand" list="w-brands" style={input} value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} placeholder="Start typing, e.g. Marks & Spencer" autoComplete="off" />
            <datalist id="w-brands">{brandList.map((b) => <option key={b.id} value={b.name} />)}</datalist>
            {form.brand_name && !matchedBrand && <div className="ins" style={{ fontSize: 11, color: soft, marginTop: 4 }}>Not in our list yet. That's fine: we'll save it as typed.</div>}
          </div>
          <div><label style={label} htmlFor="w-type">Garment</label>
            <select id="w-type" style={input} value={form.garment_type} onChange={(e) => set("garment_type", e.target.value)}>{GARMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label style={label} htmlFor="w-size">Size on the label</label>
            <input id="w-size" style={input} maxLength={20} value={form.size_label} onChange={(e) => set("size_label", e.target.value)} placeholder="e.g. 12, M, 32/30" /></div>
          <div><label style={label} htmlFor="w-sys">Size type</label>
            <select id="w-sys" style={input} value={form.size_system} onChange={(e) => set("size_system", e.target.value)}>{SYSTEMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <span style={label}>How does it fit you?</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{FITS.map(([v, l]) => <Pill key={v} on={form.overall_fit === v} onClick={() => set("overall_fit", form.overall_fit === v ? "" : v)}>{l}</Pill>)}</div>
        </div>
        <button type="button" className="btn ins" onClick={() => setMore(!more)} style={{ marginTop: 14, fontSize: 12, color: "#2d7a4a", background: "none", textDecoration: "underline", padding: 0 }}>{more ? "Fewer details" : "More details: fit by area, measurements, when you bought it (+5 kudos)"}</button>
        {more && (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            <div>
              <span style={label}>Fit by area</span>
              {AREAS.map(([a, l]) => (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span className="ins" style={{ fontSize: 13, color: ink, minWidth: 96 }}>{l}</span>
                  {AREA_FITS.map(([v, vl]) => <Pill key={v} on={form.fit_by_area[a] === v} onClick={() => setArea(a, v)}>{vl}</Pill>)}
                </div>
              ))}
            </div>
            <div>
              <span style={label}>Measure the garment flat (cm, optional)</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
                {FLAT.map(([k, l]) => <div key={k}><label className="ins" htmlFor={`f-${k}`} style={{ fontSize: 12, color: soft }}>{l}</label><input id={`f-${k}`} style={input} inputMode="decimal" value={form.garment_cm[k] ?? ""} onChange={(e) => setFlat(k, e.target.value)} /></div>)}
              </div>
              <div className="ins" style={{ fontSize: 11, color: soft, marginTop: 6 }}>Lay it flat. Pit to pit = straight across from armpit to armpit.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              <div><label style={label} htmlFor="w-year">Roughly when bought (year)</label><input id="w-year" style={input} inputMode="numeric" maxLength={4} value={form.bought_year} onChange={(e) => set("bought_year", e.target.value.replace(/\D/g, ""))} placeholder="e.g. 1998" /></div>
              <div><label style={label} htmlFor="w-on">Where from</label><select id="w-on" style={input} value={form.bought_on} onChange={(e) => set("bought_on", e.target.value)}>{BOUGHT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            </div>
            <div><label style={label} htmlFor="w-notes">Notes (optional)</label><input id="w-notes" style={input} maxLength={500} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder='e.g. "Label says to fit bust 34in"' /></div>
          </div>
        )}
        <button type="submit" disabled={busy} className="btn ins" style={{ marginTop: 18, padding: "12px 24px", background: "#2d7a4a", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 600, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Add to wardrobe"}</button>
      </form>

      {/* Items */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: 18, background: panel }}>
        <h3 style={{ fontSize: 17, color: ink, margin: "0 0 12px", fontWeight: 600 }}>Your items</h3>
        {items === null ? <p className="ins" style={{ color: soft, fontSize: 13 }}>Loading…</p> : items.length === 0 ? <p className="ins" style={{ color: soft, fontSize: 13 }}>Nothing yet. Start with something that fits you well.</p> : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: `1px solid ${line}`, borderRadius: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div className="ins" style={{ fontSize: 14, fontWeight: 600, color: ink }}>{it.brand_name} · {it.size_label}</div>
                  <div className="ins" style={{ fontSize: 12, color: soft }}>{GARMENT_LABEL[it.garment_type] || it.garment_type}{it.overall_fit ? ` · ${FIT_LABEL[it.overall_fit]}` : ""}{it.bought_year ? ` · ${it.bought_year}` : ""}{Object.keys(it.garment_cm || {}).length ? ` · ${Object.entries(it.garment_cm).map(([k, v]) => `${k.replace(/_/g, " ")} ${v}cm`).join(", ")}` : ""}</div>
                </div>
                {it.kudos > 0 && <span className="ins" style={{ fontSize: 12, fontWeight: 700, color: "#2d7a4a" }}>+{it.kudos}</span>}
                <button className="btn ins" onClick={() => remove(it.id)} aria-label={`Remove ${it.brand_name} ${it.size_label}`} style={{ fontSize: 12, color: soft, background: "none", border: `1px solid ${line}`, borderRadius: 6, padding: "5px 10px" }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "20px 24px", background: panel }}>
        <Leaderboard board={board} setBoard={setBoard} ink={ink} soft={soft} line={line} panel={panel} optedIn={profile?.leaderboard_opt_in} onJoin={openSettings} />
        <h4 style={{ fontSize: 14, color: ink, margin: "20px 0 8px", fontWeight: 600 }}>How kudos works</h4>
        <table className="ins" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: ink }}>
          <tbody>
            {[["Item with a fit verdict", "2"], ["Two or more flat garment measurements", "5"], ["First fit report anyone has made for that brand and size", "+3"], ["Daily maximum", "40"]].map(([a, b]) => (
              <tr key={a} style={{ borderTop: `1px solid ${line}` }}><td style={{ padding: "7px 0" }}>{a}</td><td style={{ padding: "7px 0", textAlign: "right", fontWeight: 600 }}>{b}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="ins" style={{ fontSize: 11, color: soft, marginTop: 8 }}>Removing an item removes its kudos. Coming soon: kudos for dated label photos and accepted corrections.</p>
      </div>
    </div>
  );
}

function Leaderboard({ board, setBoard, ink, soft, line, optedIn, onJoin }) {
  return (
    <div style={{ marginTop: 18, textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ fontSize: 17, color: ink, margin: 0, fontWeight: 600 }}>🏆 Leaderboard</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {[["month", "This month"], ["all", "All time"]].map(([p, l]) => (
            <button key={p} className="btn ins" onClick={() => board.period !== p && setBoard({ period: p, rows: null })} style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, border: `1px solid ${board.period === p ? "#2d7a4a" : line}`, background: board.period === p ? "#2d7a4a" : "transparent", color: board.period === p ? "white" : soft }}>{l}</button>
          ))}
        </div>
      </div>
      {board.rows === null ? <p className="ins" style={{ fontSize: 13, color: soft }}>Loading…</p> : board.rows.length === 0 ? <p className="ins" style={{ fontSize: 13, color: soft }}>No one on the board yet. Be the first.</p> : (
        <ol className="ins" style={{ margin: "10px 0 0", padding: 0, listStyle: "none" }}>
          {board.rows.map((r, i) => (
            <li key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: `1px solid ${line}`, fontSize: 13, color: ink }}>
              <span style={{ width: 22, fontWeight: 700, color: i < 3 ? "#2d7a4a" : soft }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{r.display_name}</span>
              <span style={{ fontWeight: 600 }}>{r.kudos}</span>
            </li>
          ))}
        </ol>
      )}
      {onJoin && !optedIn && <button className="btn ins" onClick={onJoin} style={{ marginTop: 10, fontSize: 12, color: "#2d7a4a", background: "none", textDecoration: "underline", padding: 0 }}>Join the leaderboard</button>}
    </div>
  );
}
