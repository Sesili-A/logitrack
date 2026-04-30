import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { Wallet, Plus, Trash2, X, Check, ChevronDown, IndianRupee } from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const today    = () => new Date().toISOString().split("T")[0];

function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
      background: "#0f172a", color: "white", padding: "13px 18px", borderRadius: "12px",
      fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      borderLeft: `4px solid ${type === "success" ? "#10b981" : "#ef4444"}`,
      animation: "fadeInUp 0.3s ease",
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
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to record advance", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await API.delete(`/advances/${id}`, { headers: hdrs() });
      await fetchAdvances();
      setConfirmId(null);
      showToast("Advance deleted");
    } catch { showToast("Failed to delete", "error"); }
    finally { setSaving(false); }
  };

  const filtered = advances.filter(a =>
    filterEmp === "all" || a.employee?._id === filterEmp
  );

  const totalThisWeek = (() => {
    const mon = new Date(); const day = mon.getDay();
    mon.setDate(mon.getDate() - day + (day === 0 ? -6 : 1)); mon.setHours(0,0,0,0);
    return advances
      .filter(a => new Date(a.date) >= mon)
      .reduce((s, a) => s + a.amount, 0);
  })();

  const totalAll = advances.reduce((s, a) => s + a.amount, 0);
  const inp = {
    width: "100%", padding: "10px 14px", background: "#f8fafc",
    border: "1px solid #e2e8f0", borderRadius: "10px",
    fontSize: "13px", color: "#0f172a", outline: "none",
  };

  return (
    <Layout>
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

        {/* Left — Add form */}
        <div style={{ width: "320px", flexShrink: 0 }}>
          <div style={{
            background: "white", borderRadius: "16px", padding: "22px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
            marginBottom: "16px",
          }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              Record Advance
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "20px" }}>
              Cash given to worker mid-week
            </p>

            <form onSubmit={handleAdd}>
              {/* Worker */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Worker *
                </label>
                <div style={{ position: "relative" }}>
                  <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                    style={{ ...inp, appearance: "none", paddingRight: "32px" }}>
                    <option value="">Select worker…</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Amount (₹) *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontWeight: 600 }}>₹</span>
                  <input type="number" min="1" value={form.amount} required
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="e.g. 500"
                    style={{ ...inp, paddingLeft: "28px" }}
                    onFocus={e => (e.target.style.borderColor = "#6366f1")}
                    onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
                </div>
              </div>

              {/* Date */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Date
                </label>
                <input type="date" value={form.date} max={today()}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={inp}
                  onFocus={e => (e.target.style.borderColor = "#6366f1")}
                  onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
              </div>

              {/* Note */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Note <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(optional)</span>
                </label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. medical emergency"
                  style={inp}
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
          </div>

          {/* Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "This Week's Total",  value: fmtRupee(totalThisWeek), color: "#ef4444" },
              { label: "All-time Total",     value: fmtRupee(totalAll),      color: "#64748b" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", borderRadius: "12px", padding: "16px 18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{s.label}</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Advance list */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "2px" }}>Advance Records</h1>
              <p style={{ color: "#64748b", fontSize: "13px" }}>{advances.length} total advances recorded</p>
            </div>
            {/* Filter */}
            <div style={{ position: "relative" }}>
              <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
                style={{
                  appearance: "none", padding: "8px 32px 8px 14px",
                  background: "white", border: "1px solid #e2e8f0",
                  borderRadius: "10px", fontSize: "13px", color: "#0f172a", cursor: "pointer", outline: "none",
                }}>
                <option value="all">All Workers</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <ChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          <div style={{
            background: "white", borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden",
          }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                <Wallet size={36} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
                <p style={{ fontWeight: 600, fontSize: "14px" }}>No advances recorded</p>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>Use the form to record a cash advance.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Worker", "Date", "Amount", "Note", ""].map(h => (
                      <th key={h} style={{
                        padding: "11px 20px", textAlign: "left",
                        fontSize: "10px", fontWeight: 700, color: "#94a3b8",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a._id}
                      style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "34px", height: "34px", borderRadius: "50%",
                            background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center",
                            justifyContent: "center", color: "#dc2626", fontWeight: 700, fontSize: "13px",
                          }}>
                            {a.employee?.name?.[0] || "?"}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                            {a.employee?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{fmtDate(a.date)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#dc2626" }}>
                          −{fmtRupee(a.amount)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#94a3b8" }}>
                        {a.note || "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {confirmId === a._id ? (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>Delete?</span>
                            <button onClick={() => handleDelete(a._id)} style={{
                              padding: "4px 10px", background: "#ef4444", border: "none",
                              borderRadius: "6px", color: "white", fontSize: "12px", cursor: "pointer", fontWeight: 600,
                            }}>Yes</button>
                            <button onClick={() => setConfirmId(null)} style={{
                              padding: "4px 10px", background: "#f1f5f9", border: "none",
                              borderRadius: "6px", color: "#64748b", fontSize: "12px", cursor: "pointer",
                            }}>No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmId(a._id)} style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            padding: "6px 12px", background: "#f1f5f9", border: "none",
                            borderRadius: "7px", fontSize: "12px", color: "#94a3b8",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#dc2626"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#94a3b8"; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                    <td colSpan={2} style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>
                      Total ({filtered.length} entries)
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "#dc2626" }}>
                        −{fmtRupee(filtered.reduce((s, a) => s + a.amount, 0))}
                      </span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </Layout>
  );
}
