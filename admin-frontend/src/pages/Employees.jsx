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
        <div style={{ padding: "22px 26px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="#64748b" />
          </button>
        </div>
        <div style={{ padding: "18px 26px 26px" }}>{children}</div>
      </div>
    </div>
  );
}

function EmployeeForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState({ name: "", phone: "", dailyWage: "", ...initial });
  const field = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", color: "#0f172a", outline: "none", fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <div style={{ marginBottom: "16px" }}>
        <label style={lbl}>Worker Name *</label>
        <input style={inp} required value={form.name} placeholder="e.g. Rajan Kumar"
          onChange={e => field("name", e.target.value)}
          onFocus={e => (e.target.style.borderColor = "#6366f1")}
          onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={lbl}>Daily Wage (₹ per day) *</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "14px", fontWeight: 600 }}>₹</span>
          <input style={{ ...inp, paddingLeft: "28px" }} type="number" min="0" required value={form.dailyWage} placeholder="e.g. 600"
            onChange={e => field("dailyWage", e.target.value)}
            onFocus={e => (e.target.style.borderColor = "#6366f1")}
            onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
        </div>
      </div>
      <div style={{ marginBottom: "22px" }}>
        <label style={lbl}>Phone <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(optional)</span></label>
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
        opacity: loading ? 0.7 : 1, boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
      }}>
        {loading ? "Saving…" : initial?._id ? "Update Worker" : "Add Worker"}
      </button>
    </form>
  );
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
      <style>{`
        .emp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
        .emp-stats  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }

        /* Mobile worker cards */
        .emp-cards  { display: none; flex-direction: column; gap: 10px; }
        .emp-card   {
          background: white; border-radius: 14px; padding: 16px;
          border: 1px solid #f1f5f9; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: flex; align-items: center; gap: 12px;
        }
        .emp-card-info   { flex: 1; min-width: 0; }
        .emp-card-name   { font-weight: 700; font-size: 14px; color: #0f172a; }
        .emp-card-sub    { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .emp-card-wage   { font-size: 13px; font-weight: 700; color: #059669; background: rgba(16,185,129,0.1); padding: 3px 10px; border-radius: 20px; margin-top: 4px; display: inline-block; }
        .emp-card-actions { display: flex; gap: 8px; flex-shrink: 0; }

        /* Desktop table */
        .emp-table-wrap {
          background: white; border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; overflow: hidden;
        }

        @media (max-width: 768px) {
          .emp-stats { grid-template-columns: 1fr 1fr; }
          .emp-stats > *:last-child { display: none; }
          .emp-table-wrap { display: none; }
          .emp-cards { display: flex; }
          .emp-header h1 { font-size: 20px; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="emp-header">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>Workers</h1>
          <p style={{ color: "#64748b", fontSize: "13px" }}>{employees.length} registered worker{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setModal("add")} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none", borderRadius: "11px", color: "white",
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 15px rgba(99,102,241,0.3)", flexShrink: 0,
        }}>
          <UserPlus size={16} /> <span>Add Worker</span>
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="emp-stats">
        {[
          { icon: Users,       label: "Total Workers",   value: employees.length,  color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
          { icon: IndianRupee, label: "Max Daily Pool",  value: fmtRupee(totalWagePool), color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { icon: IndianRupee, label: "Avg. Daily Wage", value: fmtRupee(employees.length ? Math.round(totalWagePool / employees.length) : 0), color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: "13px", padding: "16px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: s.bg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.icon size={19} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div style={{ background: "white", borderRadius: "12px", padding: "12px 16px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <Search size={15} color="#94a3b8" />
        <input placeholder="Search by name or phone…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", color: "#0f172a", width: "100%", fontFamily: "inherit" }} />
        <span style={{ fontSize: "12px", color: "#94a3b8", flexShrink: 0 }}>{filtered.length}/{employees.length}</span>
      </div>

      {/* ── MOBILE: Card list ── */}
      <div className="emp-cards">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
            <Users size={36} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
            <p style={{ fontWeight: 600 }}>No workers found</p>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>Add your first worker using the button above.</p>
          </div>
        ) : filtered.map(emp => (
          <div key={emp._id} className="emp-card">
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: avatarColor(emp.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
              {initials(emp.name)}
            </div>
            <div className="emp-card-info">
              <div className="emp-card-name">{emp.name}</div>
              {emp.phone && <div className="emp-card-sub"><Phone size={10} style={{ display: "inline", marginRight: "3px" }} />{emp.phone}</div>}
              <div className="emp-card-wage">{fmtRupee(emp.dailyWage)}/day</div>
            </div>
            <div className="emp-card-actions">
              {confirmId === emp._id ? (
                <>
                  <button onClick={() => handleDelete(emp._id)} disabled={saving} style={{ padding: "7px 12px", background: "#ef4444", border: "none", borderRadius: "8px", color: "white", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Yes</button>
                  <button onClick={() => setConfirmId(null)} style={{ padding: "7px 12px", background: "#f1f5f9", border: "none", borderRadius: "8px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}>No</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setSelected(emp); setModal("edit"); }} style={{ width: "34px", height: "34px", background: "#f1f5f9", border: "none", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Pencil size={14} color="#475569" />
                  </button>
                  <button onClick={() => setConfirmId(emp._id)} style={{ width: "34px", height: "34px", background: "rgba(239,68,68,0.08)", border: "none", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Trash2 size={14} color="#dc2626" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="emp-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Worker", "Phone", "Daily Wage (₹/day)", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "56px", color: "#94a3b8", fontSize: "14px" }}>
                  <Users size={34} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
                  <p style={{ fontWeight: 600 }}>No workers found</p>
                </td></tr>
              ) : filtered.map(emp => (
                <tr key={emp._id} style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: avatarColor(emp.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "13px" }}>
                        {initials(emp.name)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    {emp.phone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "13px" }}>
                        <Phone size={12} /> {emp.phone}
                      </div>
                    ) : <span style={{ color: "#cbd5e1", fontSize: "13px" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ background: "rgba(16,185,129,0.1)", color: "#059669", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700 }}>
                      {fmtRupee(emp.dailyWage)} / day
                    </span>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    {confirmId === emp._id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Delete?</span>
                        <button onClick={() => handleDelete(emp._id)} disabled={saving} style={{ padding: "5px 12px", background: "#ef4444", border: "none", borderRadius: "7px", color: "white", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Yes</button>
                        <button onClick={() => setConfirmId(null)} style={{ padding: "5px 12px", background: "#f1f5f9", border: "none", borderRadius: "7px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => { setSelected(emp); setModal("edit"); }} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 13px", background: "#f1f5f9", border: "none", borderRadius: "7px", fontSize: "12px", color: "#475569", cursor: "pointer", fontWeight: 500 }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => setConfirmId(emp._id)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 13px", background: "#f1f5f9", border: "none", borderRadius: "7px", fontSize: "12px", color: "#475569", cursor: "pointer", fontWeight: 500 }}>
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
