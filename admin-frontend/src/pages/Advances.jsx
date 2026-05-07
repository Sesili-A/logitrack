import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { Wallet, Plus, Trash2, X, Check, ChevronDown, ChevronUp } from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const today    = () => new Date().toISOString().split("T")[0];

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day  = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}
function weekLabel(d) {
  const mon = getMonday(new Date(d));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return `${fmtDate(mon)} – ${fmtDate(sun)}`;
}

function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)",
      zIndex: 999, background: "#0f172a", color: "white", padding: "12px 20px",
      borderRadius: "12px", fontSize: "13px", fontWeight: 500,
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      borderLeft: `4px solid ${type === "success" ? "#10b981" : "#ef4444"}`,
      animation: "fadeInUp 0.3s ease", whiteSpace: "nowrap",
    }}>
      {type === "success" ? <Check size={15} color="#10b981" /> : <X size={15} color="#ef4444" />}
      {msg}
    </div>
  );
}

export default function Advances() {
  const [employees, setEmployees] = useState([]);
  const [advances,  setAdvances]  = useState([]);
  const [form, setForm] = useState({ employeeId: "", amount: "", date: today(), note: "" });
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [filterEmp, setFilterEmp] = useState("all");
  const [showForm,  setShowForm]  = useState(false);
  const [expanded,  setExpanded]  = useState({}); // { "empId-weekKey": true }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await API.get("/employees", { headers: hdrs() });
      setEmployees(res.data);
      if (res.data.length && !form.employeeId)
        setForm(f => ({ ...f, employeeId: res.data[0]._id }));
    } catch {}
  }, []);

  const fetchAdvances = useCallback(async () => {
    try {
      const res = await API.get("/advances", { headers: hdrs() });
      setAdvances(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchEmployees(); fetchAdvances(); }, [fetchEmployees, fetchAdvances]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.amount) return showToast("Worker and amount are required", "error");
    setSaving(true);
    try {
      await API.post("/advances", form, { headers: hdrs() });
      await fetchAdvances();
      setForm(f => ({ ...f, amount: "", note: "", date: today() }));
      showToast("Advance recorded successfully");
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to record advance", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await API.delete(`/advances/${id}`, { headers: hdrs() });
      await fetchAdvances(); setConfirmId(null);
      showToast("Advance deleted");
    } catch { showToast("Failed to delete", "error"); }
    finally { setSaving(false); }
  };

  // Delete all advances in a group (settled)
  const handleDeleteGroup = async (ids) => {
    setSaving(true);
    try {
      await Promise.all(ids.map(id => API.delete(`/advances/${id}`, { headers: hdrs() })));
      await fetchAdvances();
      showToast("Settled records cleared");
    } catch { showToast("Failed to clear", "error"); }
    finally { setSaving(false); }
  };

  // ── Group advances by employee + week ──────────────────────────────────────
  const filtered = advances.filter(a => filterEmp === "all" || a.employee?._id === filterEmp);

  // Build grouped structure: [{ empId, empName, weekKey, weekLabel, records[], total }]
  const groups = (() => {
    const map = {};
    filtered.forEach(a => {
      const empId = a.employee?._id || "unknown";
      const mon   = getMonday(new Date(a.date));
      const key   = `${empId}__${mon.toISOString().split("T")[0]}`;
      if (!map[key]) {
        map[key] = {
          key,
          empId,
          empName:   a.employee?.name || "Unknown",
          weekLabel: weekLabel(a.date),
          records:   [],
          total:     0,
        };
      }
      map[key].records.push(a);
      map[key].total += a.amount;
    });
    return Object.values(map).sort((a, b) => new Date(b.records[0].date) - new Date(a.records[0].date));
  })();

  const totalThisWeek = (() => {
    const mon = getMonday();
    return advances.filter(a => new Date(a.date) >= mon).reduce((s, a) => s + a.amount, 0);
  })();
  const totalAll = advances.reduce((s, a) => s + a.amount, 0);

  const inp = { width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", color: "#0f172a", outline: "none", fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" };

  const AddForm = () => (
    <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={lbl}>Worker *</label>
        <div style={{ position: "relative" }}>
          <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
            style={{ ...inp, appearance: "none", paddingRight: "32px" }}>
            <option value="">Select worker…</option>
            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
          </select>
          <ChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={lbl}>Amount (₹) *</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontWeight: 600 }}>₹</span>
            <input type="number" min="1" value={form.amount} required
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="500" style={{ ...inp, paddingLeft: "28px" }}
              onFocus={e => (e.target.style.borderColor = "#6366f1")}
              onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
          </div>
        </div>
        <div>
          <label style={lbl}>Date</label>
          <input type="date" value={form.date} max={today()}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={inp}
            onFocus={e => (e.target.style.borderColor = "#6366f1")}
            onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
        </div>
      </div>

      <div>
        <label style={lbl}>Note <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(optional)</span></label>
        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
          placeholder="e.g. medical emergency" style={inp}
          onFocus={e => (e.target.style.borderColor = "#6366f1")}
          onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
      </div>

      <button type="submit" disabled={saving} style={{
        width: "100%", padding: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "11px",
        color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 15px rgba(99,102,241,0.3)", opacity: saving ? 0.7 : 1,
      }}>
        <Plus size={15} /> {saving ? "Saving…" : "Record Advance"}
      </button>
    </form>
  );

  // ── Group card (used for both mobile and desktop) ──────────────────────────
  const GroupCard = ({ g }) => {
    const isOpen = expanded[g.key];
    const toggle = () => setExpanded(prev => ({ ...prev, [g.key]: !prev[g.key] }));
    const multiEntry = g.records.length > 1;

    return (
      <div style={{ background: "white", borderRadius: "14px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: multiEntry ? "pointer" : "default" }}
          onClick={multiEntry ? toggle : undefined}>
          {/* Avatar */}
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
            {g.empName[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{g.empName}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
              {g.weekLabel}
              {multiEntry && (
                <span style={{ marginLeft: "8px", background: "rgba(99,102,241,0.1)", color: "#6366f1", padding: "1px 6px", borderRadius: "8px", fontWeight: 600 }}>
                  {g.records.length} entries
                </span>
              )}
            </div>
          </div>

          {/* Total */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#dc2626" }}>−{fmtRupee(g.total)}</div>
            {multiEntry && (
              <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", color: "#94a3b8", fontSize: "11px" }}>
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isOpen ? "collapse" : "expand"}
              </div>
            )}
          </div>

          {/* Single record delete (for single-entry groups) */}
          {!multiEntry && (
            confirmId === g.records[0]._id ? (
              <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(g.records[0]._id); }}
                  style={{ padding: "4px 10px", background: "#ef4444", border: "none", borderRadius: "6px", color: "white", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Yes</button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}
                  style={{ padding: "4px 10px", background: "#f1f5f9", border: "none", borderRadius: "6px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}>No</button>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setConfirmId(g.records[0]._id); }}
                style={{ marginLeft: "8px", background: "rgba(239,68,68,0.08)", border: "none", borderRadius: "7px", width: "30px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Trash2 size={13} color="#dc2626" />
              </button>
            )
          )}
        </div>

        {/* Expanded sub-records */}
        {multiEntry && isOpen && (
          <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px", background: "#fffbf5" }}>
            {g.records.map(a => (
              <div key={a._id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "white", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{fmtDate(a.date)}</div>
                  {a.note && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{a.note}</div>}
                </div>
                <span style={{ fontWeight: 700, color: "#dc2626", fontSize: "14px" }}>−{fmtRupee(a.amount)}</span>
                {confirmId === a._id ? (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => handleDelete(a._id)} style={{ padding: "3px 8px", background: "#ef4444", border: "none", borderRadius: "6px", color: "white", fontSize: "11px", cursor: "pointer" }}>Yes</button>
                    <button onClick={() => setConfirmId(null)} style={{ padding: "3px 8px", background: "#f1f5f9", border: "none", borderRadius: "6px", color: "#64748b", fontSize: "11px", cursor: "pointer" }}>No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(a._id)}
                    style={{ background: "rgba(239,68,68,0.08)", border: "none", borderRadius: "6px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Trash2 size={12} color="#dc2626" />
                  </button>
                )}
              </div>
            ))}

            {/* Clear all button for multi-record groups */}
            <button onClick={() => handleDeleteGroup(g.records.map(r => r._id))}
              disabled={saving}
              style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", background: "rgba(239,68,68,0.08)", border: "1px dashed rgba(239,68,68,0.25)", borderRadius: "8px", color: "#dc2626", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              <Trash2 size={13} /> Clear all {g.records.length} entries for this week
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <style>{`
        .adv-layout { display: flex; gap: 24px; align-items: flex-start; }
        .adv-sidebar { width: 300px; flex-shrink: 0; }
        .adv-main { flex: 1; min-width: 0; }
        .adv-form-card { background: white; border-radius: 16px; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; margin-bottom: 14px; }
        .adv-stat-cards { display: none; flex-direction: column; gap: 10px; margin-bottom: 14px; }
        .adv-stat-card { background: white; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .adv-mobile-add-btn { display: none; width: 100%; padding: 12px; margin-bottom: 14px; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none; border-radius: 12px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
        .adv-mobile-form { display: none; background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; margin-bottom: 16px; }
        .adv-list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 10px; }
        @media (max-width: 768px) {
          .adv-layout { flex-direction: column; }
          .adv-sidebar { display: none; width: 100%; }
          .adv-mobile-add-btn { display: flex; }
          .adv-mobile-form.adv-mobile-form--open { display: block; }
          .adv-stat-cards { display: flex; flex-direction: row; }
          .adv-stat-card { flex: 1; flex-direction: column; text-align: center; gap: 4px; }
          .adv-list-header { flex-wrap: wrap; }
        }
        @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,10px); } to { opacity:1; transform:translate(-50%,0); } }
      `}</style>

      {/* ── Mobile: summary stats on top ── */}
      <div className="adv-stat-cards">
        {[
          { label: "This Week", value: fmtRupee(totalThisWeek), color: "#ef4444" },
          { label: "All-time",  value: fmtRupee(totalAll),      color: "#64748b" },
        ].map(s => (
          <div key={s.label} className="adv-stat-card">
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Mobile: Add button toggle ── */}
      <button className="adv-mobile-add-btn" onClick={() => setShowForm(v => !v)}>
        <Plus size={16} /> {showForm ? "Hide Form" : "Record Advance"}
      </button>

      {/* ── Mobile: expandable form ── */}
      <div className={`adv-mobile-form ${showForm ? "adv-mobile-form--open" : ""}`}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Record Advance</h2>
        <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "16px" }}>Cash given to worker mid-week</p>
        <AddForm />
      </div>

      {/* ── Main layout ── */}
      <div className="adv-layout">

        {/* Desktop sidebar */}
        <div className="adv-sidebar">
          <div className="adv-form-card">
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Record Advance</h2>
            <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "20px" }}>Cash given to worker mid-week</p>
            <AddForm />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "This Week's Total",  value: fmtRupee(totalThisWeek), color: "#ef4444" },
              { label: "All-time Total",     value: fmtRupee(totalAll),      color: "#64748b" },
            ].map(s => (
              <div key={s.label} style={{ background: "white", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{s.label}</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: grouped list */}
        <div className="adv-main">
          <div className="adv-list-header">
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "2px" }}>Advance Records</h1>
              <p style={{ color: "#64748b", fontSize: "13px" }}>{groups.length} worker-week group{groups.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ position: "relative" }}>
              <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
                style={{ appearance: "none", padding: "8px 32px 8px 14px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", color: "#0f172a", cursor: "pointer", outline: "none" }}>
                <option value="all">All Workers</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <ChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {groups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", background: "white", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
              <Wallet size={36} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
              <p style={{ fontWeight: 600, fontSize: "14px" }}>No advances recorded</p>
              <p style={{ fontSize: "12px" }}>Use the form to record a cash advance.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {groups.map(g => <GroupCard key={g.key} g={g} />)}

              {/* Grand total */}
              <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "2px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Total ({filtered.length} entries)</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#dc2626" }}>−{fmtRupee(filtered.reduce((s, a) => s + a.amount, 0))}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </Layout>
  );
}
