import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import {
  UserPlus, Pencil, Trash2, Search, X, Check,
  Users, IndianRupee, Phone,
} from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const avatarColors = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
const avatarColor  = name => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];
const initials     = name => name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div style={{
        background: "white", borderRadius: "20px", width: "100%", maxWidth: "440px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.2)", animation: "fadeInUp 0.25s ease",
      }}>
        <div style={{
          padding: "22px 26px 0", display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{
            background: "#f1f5f9", border: "none", borderRadius: "8px",
            width: "30px", height: "30px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} color="#64748b" />
          </button>
        </div>
        <div style={{ padding: "18px 26px 26px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
function EmployeeForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState({ name: "", phone: "", dailyWage: "", ...initial });
  const field = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = {
    width: "100%", padding: "10px 14px",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: "10px", fontSize: "14px", color: "#0f172a", outline: "none",
  };
  const lbl = {
    display: "block", fontSize: "11px", fontWeight: 700,
    color: "#64748b", marginBottom: "6px",
    textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      {/* Name */}
      <div style={{ marginBottom: "16px" }}>
        <label style={lbl}>Worker Name *</label>
        <input style={inp} required value={form.name} placeholder="e.g. Rajan Kumar"
          onChange={e => field("name", e.target.value)}
          onFocus={e => (e.target.style.borderColor = "#6366f1")}
          onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
      </div>

      {/* Daily Wage */}
      <div style={{ marginBottom: "16px" }}>
        <label style={lbl}>Daily Wage (₹ per day) *</label>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
            color: "#64748b", fontSize: "14px", fontWeight: 600,
          }}>₹</span>
          <input style={{ ...inp, paddingLeft: "28px" }}
            type="number" min="0" required
            value={form.dailyWage}
            placeholder="e.g. 600"
            onChange={e => field("dailyWage", e.target.value)}
            onFocus={e => (e.target.style.borderColor = "#6366f1")}
            onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
        </div>
        <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
          This rate is used for weekly payroll calculation.
        </p>
      </div>

      {/* Phone */}
      <div style={{ marginBottom: "22px" }}>
        <label style={lbl}>
          Phone Number
          <span style={{ marginLeft: "6px", fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(optional)</span>
        </label>
        <input style={inp} type="tel" value={form.phone || ""} placeholder="e.g. 98765 43210"
          onChange={e => field("phone", e.target.value)}
          onFocus={e => (e.target.style.borderColor = "#6366f1")}
          onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
      </div>

      <button type="submit" disabled={loading} style={{
        width: "100%", padding: "12px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none", borderRadius: "12px", color: "white",
        fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxShadow: "0 4px 15px rgba(99,102,241,0.3)", transition: "transform 0.15s",
      }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {loading ? "Saving…" : initial?._id ? "Update Worker" : "Add Worker"}
      </button>
    </form>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
      background: "#0f172a", color: "white", padding: "13px 18px",
      borderRadius: "12px", fontSize: "13px", fontWeight: 500,
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      borderLeft: `4px solid ${type === "success" ? "#10b981" : "#ef4444"}`,
      animation: "fadeInUp 0.3s ease",
    }}>
      {type === "success" ? <Check size={15} color="#10b981" /> : <X size={15} color="#ef4444" />}
      {msg}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search,    setSearch]    = useState("");
  const [modal,     setModal]     = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await API.get("/employees", { headers: hdrs() });
      setEmployees(res.data);
    } catch { showToast("Failed to load workers", "error"); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      await API.post("/employees", form, { headers: hdrs() });
      await fetchEmployees(); setModal(null);
      showToast("Worker added successfully");
    } catch (e) { showToast(e.response?.data?.msg || "Failed to add worker", "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await API.put(`/employees/${selected._id}`, form, { headers: hdrs() });
      await fetchEmployees(); setModal(null);
      showToast("Worker updated");
    } catch { showToast("Failed to update", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await API.delete(`/employees/${id}`, { headers: hdrs() });
      await fetchEmployees(); setConfirmId(null);
      showToast("Worker removed");
    } catch { showToast("Failed to delete", "error"); }
    finally { setSaving(false); }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.phone || "").includes(search)
  );

  const totalWagePool = employees.reduce((s, e) => s + (e.dailyWage || 0), 0);

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>Workers</h1>
          <p style={{ color: "#64748b", fontSize: "13px" }}>{employees.length} registered worker{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setModal("add")} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none", borderRadius: "11px", color: "white",
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 15px rgba(99,102,241,0.3)", transition: "transform 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <UserPlus size={16} /> Add Worker
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "22px" }}>
        {[
          { icon: Users,       label: "Total Workers",   value: employees.length,  color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
          { icon: IndianRupee, label: "Max Daily Pool",  value: fmtRupee(totalWagePool), color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { icon: IndianRupee, label: "Avg. Daily Wage", value: fmtRupee(employees.length ? Math.round(totalWagePool / employees.length) : 0), color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        ].map(s => (
          <div key={s.label} style={{
            background: "white", borderRadius: "13px", padding: "18px",
            border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", gap: "13px",
          }}>
            <div style={{
              width: "42px", height: "42px", background: s.bg,
              borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <s.icon size={19} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "white", borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        {/* Search */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "9px",
            background: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: "9px", padding: "8px 13px", flex: 1,
          }}>
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search by name or phone…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", color: "#0f172a", width: "100%" }}
            />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{filtered.length} / {employees.length}</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Worker", "Phone", "Daily Wage (₹/day)", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "11px 20px", textAlign: "left",
                    fontSize: "10px", fontWeight: 700, color: "#94a3b8",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "56px", color: "#94a3b8", fontSize: "14px" }}>
                  <Users size={34} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
                  <p style={{ fontWeight: 600 }}>No workers found</p>
                  <p style={{ fontSize: "12px", marginTop: "4px" }}>Add your first worker using the button above.</p>
                </td></tr>
              ) : filtered.map(emp => (
                <tr key={emp._id}
                  style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Name */}
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                      <div style={{
                        width: "38px", height: "38px", borderRadius: "50%",
                        background: avatarColor(emp.name),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 700, fontSize: "13px",
                      }}>
                        {initials(emp.name)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{emp.name}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td style={{ padding: "13px 20px" }}>
                    {emp.phone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "13px" }}>
                        <Phone size={12} /> {emp.phone}
                      </div>
                    ) : <span style={{ color: "#cbd5e1", fontSize: "13px" }}>—</span>}
                  </td>

                  {/* Wage */}
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{
                      background: "rgba(16,185,129,0.1)", color: "#059669",
                      padding: "4px 12px", borderRadius: "20px",
                      fontSize: "13px", fontWeight: 700,
                    }}>
                      {fmtRupee(emp.dailyWage)} / day
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "13px 20px" }}>
                    {confirmId === emp._id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Delete?</span>
                        <button onClick={() => handleDelete(emp._id)} disabled={saving} style={{
                          padding: "5px 12px", background: "#ef4444", border: "none",
                          borderRadius: "7px", color: "white", fontSize: "12px", cursor: "pointer", fontWeight: 600,
                        }}>Yes</button>
                        <button onClick={() => setConfirmId(null)} style={{
                          padding: "5px 12px", background: "#f1f5f9", border: "none",
                          borderRadius: "7px", color: "#64748b", fontSize: "12px", cursor: "pointer",
                        }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => { setSelected(emp); setModal("edit"); }} style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "6px 13px", background: "#f1f5f9",
                          border: "none", borderRadius: "7px", fontSize: "12px",
                          color: "#475569", cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#e0e7ff"; e.currentTarget.style.color = "#4f46e5"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => setConfirmId(emp._id)} style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "6px 13px", background: "#f1f5f9",
                          border: "none", borderRadius: "7px", fontSize: "12px",
                          color: "#475569", cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#dc2626"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "add" && (
        <Modal title="Add New Worker" onClose={() => setModal(null)}>
          <EmployeeForm onSubmit={handleAdd} loading={saving} />
        </Modal>
      )}
      {modal === "edit" && selected && (
        <Modal title="Edit Worker" onClose={() => setModal(null)}>
          <EmployeeForm initial={selected} onSubmit={handleEdit} loading={saving} />
        </Modal>
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </Layout>
  );
}
