import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { ClipboardCheck, CheckCircle, XCircle, Clock, Calendar, Send, RefreshCw, MapPin, AlertCircle } from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_OPTIONS = [
  { value: "Present",  label: "Present",  color: "#059669", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  icon: CheckCircle },
  { value: "Half-Day", label: "½ Day",    color: "#d97706", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: Clock },
  { value: "Absent",   label: "Absent",   color: "#dc2626", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   icon: XCircle },
  { value: "Overtime", label: "OT",       color: "#e07a67", bg: "rgba(245,143,124,0.12)",  border: "rgba(245,143,124,0.3)",  icon: Clock },
];

const cfg = s => STATUS_OPTIONS.find(o => o.value === s) || { value: "", label: "Not Marked", color: "#64748b", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.3)", icon: AlertCircle };
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().split("T")[0];

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
      {type === "success" ? <CheckCircle size={15} color="#10b981" /> : <XCircle size={15} color="#ef4444" />}
      {msg}
    </div>
  );
}

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  const [records, setRecords] = useState({});
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);
  const [date, setDate] = useState(today());

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [empRes, todayRes, siteRes] = await Promise.all([
        API.get("/employees", { headers: hdrs() }),
        API.get(`/attendance/today?date=${date}`, { headers: hdrs() }),
        API.get("/sites", { headers: hdrs() })
      ]);
      setEmployees(empRes.data);
      setSites(siteRes.data);
      const dbRecords = todayRes.data;
      setAlreadyMarked(Object.keys(dbRecords).length > 0);
      const defaultSite = siteRes.data.length > 0 ? siteRes.data[0].name : "";
      const init = {};
      empRes.data.forEach(emp => {
        init[emp._id] = dbRecords[emp._id] || { status: "", site: defaultSite, overtimeHours: 0 };
      });
      setRecords(init);
    } catch { showToast("Failed to load data", "error"); }
  };

  useEffect(() => { fetchData(); }, [date]);

  const setStatus = (empId, status) => {
    setRecords(r => {
      const old = r[empId] || { status: "", site: "", overtimeHours: 0 };
      // reset OT hours when switching away from Overtime
      const overtimeHours = status === "Overtime" ? (old.overtimeHours || 0) : 0;
      return { ...r, [empId]: { ...old, status, overtimeHours } };
    });
  };

  const setSite = (empId, site) => {
    setRecords(r => {
      const old = r[empId] || { status: "", site: "", overtimeHours: 0 };
      return { ...r, [empId]: { ...old, site } };
    });
  };

  const setOvertimeHours = (empId, hours) => {
    setRecords(r => {
      const old = r[empId] || { status: "Overtime", site: "", overtimeHours: 0 };
      return { ...r, [empId]: { ...old, overtimeHours: Math.max(0, Math.min(24, Number(hours) || 0)) } };
    });
  };

  const markAll = (status) => {
    const updated = {};
    const defaultSite = sites.length > 0 ? sites[0].name : "";
    employees.forEach(emp => {
      const old = records[emp._id];
      const currentSite = typeof old === "string" ? "" : (old?.site || defaultSite);
      updated[emp._id] = { status, site: (status !== "Absent") ? currentSite : "" };
    });
    setRecords(updated);
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    try {
      const recordsArr = employees.map(emp => {
        const r  = records[emp._id] || {};
        const st = r.status || "Present";
        const si = r.site   || null;
        const oh = st === "Overtime" ? (Number(r.overtimeHours) || 0) : 0;
        return { employeeId: emp._id, status: st, site: st !== "Absent" ? si : null, overtimeHours: oh };
      });
      await API.post("/attendance/mark", { records: recordsArr, date }, { headers: hdrs() });
      setSubmitted(true);
      setAlreadyMarked(true);
      showToast("Attendance saved successfully!");
      fetchData();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {
      showToast(e.response?.data?.msg || "Failed to save attendance", "error");
    } finally { setSubmitting(false); }
  };

  const summary = STATUS_OPTIONS.map(s => ({
    ...s, count: Object.values(records).filter(v => {
      const st = typeof v === "string" ? v : v?.status;
      return st === s.value;
    }).length,
  }));

  const calcDayPay = (status, overtimeHours, dailyWage) => {
    const w = dailyWage || 0;
    if (status === "Present")  return w;
    if (status === "Half-Day") return w * 0.5;
    if (status === "Overtime") return w + (w / 8) * (overtimeHours || 0);
    return 0;
  };

  const todayPay = employees.reduce((sum, emp) => {
    const r  = records[emp._id] || {};
    const st = typeof r === "string" ? r : r?.status;
    const oh = typeof r === "string" ? 0 : (r?.overtimeHours || 0);
    return sum + calcDayPay(st, oh, emp.dailyWage);
  }, 0);

  return (
    <Layout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Attendance header ── */
        .att-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
        }
        .att-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .att-save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          border-radius: 11px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        /* ── Summary grid ── */
        .att-summary {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }

        /* ── Mark all bar ── */
        .att-markall {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        /* ── Worker cards (mobile) ── */
        .att-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
        }
        .att-card {
          background: white;
          border-radius: 14px;
          padding: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .att-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .att-card-worker {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .att-card-pay {
          font-size: 15px;
          font-weight: 800;
        }
        .att-status-btns {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 10px;
        }
        .att-status-btn {
          padding: 7px 4px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid;
          text-align: center;
          transition: all 0.15s;
        }
        .att-site-row {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .att-site-row select {
          border: none;
          background: transparent;
          font-size: 12px;
          color: #0f172a;
          outline: none;
          flex: 1;
          font-family: 'Inter', sans-serif;
        }

        /* ── Desktop table ── */
        .att-table-wrap {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid #f1f5f9;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .att-header { flex-direction: column; }
          .att-header-actions { width: 100%; justify-content: space-between; }
          .att-save-btn span { display: none; }
          .att-summary { grid-template-columns: repeat(3, 1fr); }
          .att-summary .att-pay-card { grid-column: span 3; }
          .att-table-wrap { display: none; }
          .att-cards { display: flex; }
          .att-markall { gap: 6px; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="att-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>Mark Attendance</h1>
            {alreadyMarked && (
              <span style={{ padding: "3px 8px", background: "rgba(16,185,129,0.1)", color: "#059669", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle size={12} /> Saved
              </span>
            )}
          </div>
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="att-header-actions">
          <input type="date" value={date} max={today()}
            onChange={e => setDate(e.target.value)}
            style={{ padding: "9px 12px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", color: "#0f172a", outline: "none", cursor: "pointer" }} />

          <button onClick={fetchData} title="Refresh" style={{ width: "38px", height: "38px", borderRadius: "10px", background: "white", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <RefreshCw size={15} color="#64748b" />
          </button>

          <button onClick={submitAttendance} disabled={submitting || !employees.length} className="att-save-btn"
            style={{
              background: submitted ? "linear-gradient(135deg,#10b981,#059669)" : (alreadyMarked ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#F58F7C,#F2C4CE)"),
              boxShadow: alreadyMarked ? "0 4px 15px rgba(245,158,11,0.3)" : "0 4px 15px rgba(245,143,124,0.3)",
              opacity: submitting ? 0.7 : 1,
            }}>
            {submitting ? (
              <div style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : submitted ? <CheckCircle size={15} /> : (alreadyMarked ? <RefreshCw size={15} /> : <Send size={15} />)}
            <span>{submitted ? "Saved!" : submitting ? "Saving…" : (alreadyMarked ? "Update" : "Save")}</span>
          </button>
        </div>
      </div>

      {sites.length === 0 && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", padding: "12px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#d97706", marginBottom: "20px", fontSize: "13px", fontWeight: 500 }}>
          <AlertCircle size={16} /> Please add "Work Sites" in Settings to assign workers to sites.
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="att-summary">
        {summary.map(s => (
          <div key={s.value} style={{ background: "white", borderRadius: "12px", padding: "12px 14px", border: `1px solid ${s.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", background: s.bg, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>{s.label}</div>
            </div>
          </div>
        ))}
        <div className="att-pay-card" style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)", borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>{fmtRupee(todayPay)}</div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>Today's Est. Pay</div>
          </div>
        </div>
      </div>

      {/* ── Mark all bar ── */}
      <div className="att-markall">
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Mark all:</span>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => markAll(s.value)} style={{
            padding: "6px 14px", background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: "20px", fontSize: "12px", color: s.color, fontWeight: 600, cursor: "pointer"
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── MOBILE: Card list ── */}
      <div className="att-cards">
        {employees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
            <ClipboardCheck size={36} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
            <p style={{ fontWeight: 600 }}>No workers found.</p>
            <p style={{ fontSize: "12px" }}>Add workers first.</p>
          </div>
        ) : employees.map(emp => {
          const rec          = records[emp._id] || {};
          const status       = rec.status  || "";
          const recSite      = rec.site    || "";
          const overtimeHours = rec.overtimeHours || 0;
          const c            = cfg(status);
          const dayPay       = calcDayPay(status, overtimeHours, emp.dailyWage);
          const needsSite    = status !== "Absent";

          return (
            <div key={emp._id} className="att-card" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="att-card-top">
                <div className="att-card-worker">
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, fontWeight: 700, fontSize: "14px" }}>
                    {emp.name?.[0] || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{emp.name}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {fmtRupee(emp.dailyWage)}/day
                      {status === "Half-Day" && <span style={{ marginLeft: "6px", background: "rgba(245,158,11,0.15)", color: "#d97706", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>½ Day</span>}
                    </div>
                  </div>
                </div>
                <div className="att-card-pay" style={{ color: dayPay > 0 ? "#059669" : "#cbd5e1" }}>
                  {dayPay > 0 ? fmtRupee(dayPay) : "—"}
                </div>
              </div>

              {/* Status buttons */}
              <div className="att-status-btns">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setStatus(emp._id, opt.value)} className="att-status-btn"
                    style={{
                      background: status === opt.value ? opt.bg : "transparent",
                      color: status === opt.value ? opt.color : "#94a3b8",
                      borderColor: status === opt.value ? opt.border : "#e2e8f0",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* OT hours input */}
              {status === "Overtime" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(245,143,124,0.08)", border: "1px solid rgba(245,143,124,0.3)", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px" }}>
                  <Clock size={13} color="#e07a67" />
                  <span style={{ fontSize: "12px", color: "#64748b", flex: 1 }}>OT Hours</span>
                  <input
                    type="number" min="0" max="24" step="0.5"
                    value={overtimeHours}
                    onChange={e => setOvertimeHours(emp._id, e.target.value)}
                    style={{ width: "54px", padding: "4px 8px", border: "1px solid rgba(245,143,124,0.4)", borderRadius: "6px", fontSize: "13px", fontWeight: 700, color: "#e07a67", background: "white", outline: "none", textAlign: "center" }}
                  />
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>hrs = {fmtRupee(Math.round((emp.dailyWage||0)/8*overtimeHours))} OT pay</span>
                </div>
              )}

              {/* Site selector */}
              {needsSite && sites.length > 0 && (
                <div className="att-site-row">
                  <MapPin size={13} color="#64748b" />
                  <select value={recSite || ""} onChange={e => setSite(emp._id, e.target.value)}>
                    <option value="" disabled>Select site</option>
                    {sites.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="att-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Worker", "Daily Wage", "Status", "Site Deployment", "Est. Pay"].map(h => (
                  <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "56px", color: "#94a3b8" }}>
                  <ClipboardCheck size={32} style={{ margin: "0 auto 10px", opacity: 0.25 }} />
                  <p>No workers found. Add workers first.</p>
                </td></tr>
              ) : employees.map((emp) => {
                const rRaw        = records[emp._id] || {};
                const status      = typeof rRaw === "string" ? rRaw : (rRaw?.status || "Present");
                const recSite     = typeof rRaw === "string" ? "" : (rRaw?.site || "");
                const overtimeHours = typeof rRaw === "string" ? 0 : (rRaw?.overtimeHours || 0);
                const c           = cfg(status);
                const dayPay      = calcDayPay(status, overtimeHours, emp.dailyWage);
                const needsSite   = status !== "Absent";

                return (
                  <tr key={emp._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, fontWeight: 700, fontSize: "13px" }}>
                          {emp.name?.[0] || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{emp.name}</div>
                          {emp.phone && <div style={{ fontSize: "11px", color: "#94a3b8" }}>{emp.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}><span style={{ fontSize: "13px", fontWeight: 600, color: "#059669" }}>{fmtRupee(emp.dailyWage)}/day</span></td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setStatus(emp._id, opt.value)}
                            style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: status === opt.value ? opt.bg : "transparent", color: status === opt.value ? opt.color : "#94a3b8", border: `1px solid ${status === opt.value ? opt.border : "#e2e8f0"}` }}>
                            {opt.label}
                          </button>
                        ))}
                        {/* OT hours inline input */}
                        {status === "Overtime" && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(245,143,124,0.08)", border: "1px solid rgba(245,143,124,0.35)", borderRadius: "8px", padding: "4px 10px", marginTop: "4px" }}>
                            <Clock size={12} color="#e07a67" />
                            <input
                              type="number" min="0" max="24" step="1"
                              value={overtimeHours}
                              onChange={e => setOvertimeHours(emp._id, e.target.value)}
                              style={{ width: "46px", border: "none", background: "transparent", fontSize: "13px", fontWeight: 700, color: "#e07a67", outline: "none", textAlign: "center" }}
                            />
                            <span style={{ fontSize: "10px", color: "#94a3b8", whiteSpace: "nowrap" }}>hrs OT</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {needsSite ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <MapPin size={14} color="#64748b" />
                          <select value={recSite || ""} onChange={e => setSite(emp._id, e.target.value)} style={{ border: "none", background: "transparent", fontSize: "12px", color: "#0f172a", outline: "none", flex: 1 }}>
                            <option value="" disabled>Select site</option>
                            {sites.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                      ) : <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Not Applicable</span>}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: dayPay > 0 ? "#059669" : "#94a3b8" }}>
                          {dayPay > 0 ? fmtRupee(Math.round(dayPay)) : "—"}
                        </span>
                        {status === "Half-Day" && (
                          <div style={{ fontSize: "10px", color: "#d97706", fontWeight: 600, marginTop: "2px" }}>½ Day rate</div>
                        )}
                        {status === "Overtime" && overtimeHours > 0 && (
                          <div style={{ fontSize: "10px", color: "#e07a67", fontWeight: 600, marginTop: "2px" }}>Base + {overtimeHours}h OT</div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </Layout>
  );
}