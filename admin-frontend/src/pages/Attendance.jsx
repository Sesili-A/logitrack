import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { ClipboardCheck, CheckCircle, XCircle, Clock, Calendar, Send, RefreshCw, MapPin, AlertCircle } from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_OPTIONS = [
  { value: "Present",  label: "Present",  color: "#059669", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)",  icon: CheckCircle },
  { value: "Half-Day", label: "Half-Day", color: "#d97706", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  icon: Clock },
  { value: "Absent",   label: "Absent",   color: "#dc2626", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   icon: XCircle },
  { value: "Overtime", label: "Overtime", color: "#4f46e5", bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.3)",  icon: Clock },
];

const cfg = s => STATUS_OPTIONS.find(o => o.value === s) || STATUS_OPTIONS[0];
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().split("T")[0];

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
      {type === "success" ? <CheckCircle size={15} color="#10b981" /> : <XCircle size={15} color="#ef4444" />}
      {msg}
    </div>
  );
}

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  
  // records: { empId: { status, site } }
  const [records, setRecords] = useState({});
  const [alreadyMarked, setAlreadyMarked] = useState(false); // if any records were already saved for this date

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
      const isMarked = Object.keys(dbRecords).length > 0;
      setAlreadyMarked(isMarked);

      // Initialize UI state
      const init = {};
      const defaultSite = siteRes.data.length > 0 ? siteRes.data[0].name : "";
      
      empRes.data.forEach(emp => {
        if (dbRecords[emp._id]) {
          init[emp._id] = dbRecords[emp._id]; // { status, site }
        } else {
          init[emp._id] = { status: "Present", site: defaultSite };
        }
      });
      setRecords(init);
    } catch { showToast("Failed to load data", "error"); }
  };

  useEffect(() => { fetchData(); }, [date]);

  const setStatus = (empId, status) => {
    setRecords(r => {
      const old = r[empId];
      const safeOld = typeof old === "string" ? { status: old, site: "" } : (old || { status: "Present", site: "" });
      return { ...r, [empId]: { ...safeOld, status } };
    });
  };

  const setSite = (empId, site) => {
    setRecords(r => {
      const old = r[empId];
      const safeOld = typeof old === "string" ? { status: old, site: "" } : (old || { status: "Present", site: "" });
      return { ...r, [empId]: { ...safeOld, site } };
    });
  };

  const markAll = (status) => {
    const updated = {};
    const defaultSite = sites.length > 0 ? sites[0].name : "";
    employees.forEach(emp => { 
      const old = records[emp._id];
      const currentSite = typeof old === "string" ? "" : (old?.site || defaultSite);
      updated[emp._id] = { 
        status, 
        site: (status === "Present" || status === "Half-Day" || status === "Overtime") ? currentSite : "" 
      }; 
    });
    setRecords(updated);
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    try {
      const recordsArr = employees.map(emp => {
        const r = records[emp._id];
        const st = typeof r === "string" ? r : (r?.status || "Present");
        const si = typeof r === "string" ? null : (r?.site || null);
        return {
          employeeId: emp._id,
          status:     st,
          site:       (st === "Present" || st === "Half-Day" || st === "Overtime") ? si : null
        };
      });
      await API.post("/attendance/mark", { records: recordsArr, date }, { headers: hdrs() });
      setSubmitted(true);
      setAlreadyMarked(true);
      showToast("Attendance saved successfully!");
      fetchData(); // re-fetch to ensure sync
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {
      showToast(e.response?.data?.msg || "Failed to save attendance", "error");
    } finally { setSubmitting(false); }
  };

  // Count summary
  const summary = STATUS_OPTIONS.map(s => ({
    ...s, count: Object.values(records).filter(v => {
      const st = typeof v === "string" ? v : v?.status;
      return st === s.value;
    }).length,
  }));

  // Estimated pay for today
  const todayPay = employees.reduce((sum, emp) => {
    const r = records[emp._id];
    const st = typeof r === "string" ? r : r?.status;
    if (st === "Present")  return sum + (emp.dailyWage || 0);
    if (st === "Half-Day") return sum + (emp.dailyWage || 0) * 0.5;
    if (st === "Overtime") return sum + (emp.dailyWage || 0) * 1.5;
    return sum;
  }, 0);

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>Mark Attendance</h1>
            {alreadyMarked && (
              <span style={{ padding: "3px 8px", background: "rgba(16,185,129,0.1)", color: "#059669", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle size={12} /> Already Saved
              </span>
            )}
          </div>
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input type="date" value={date} max={today()}
            onChange={e => setDate(e.target.value)}
            style={{
              padding: "9px 14px", background: "white", border: "1px solid #e2e8f0",
              borderRadius: "10px", fontSize: "13px", color: "#0f172a",
              outline: "none", cursor: "pointer",
            }} />

          <button onClick={fetchData} title="Refresh" style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "white", border: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <RefreshCw size={15} color="#64748b" />
          </button>

          <button onClick={submitAttendance} disabled={submitting || !employees.length}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px",
              background: submitted
                ? "linear-gradient(135deg,#10b981,#059669)"
                : (alreadyMarked ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#6366f1,#8b5cf6)"),
              border: "none", borderRadius: "11px", color: "white",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              boxShadow: alreadyMarked ? "0 4px 15px rgba(245,158,11,0.3)" : "0 4px 15px rgba(99,102,241,0.3)",
              opacity: submitting ? 0.7 : 1, transition: "all 0.3s",
            }}
          >
            {submitting ? (
              <div style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : submitted ? <CheckCircle size={15} /> : (alreadyMarked ? <RefreshCw size={15} /> : <Send size={15} />)}
            {submitted ? "Saved!" : submitting ? "Saving…" : (alreadyMarked ? "Update Records" : "Save Attendance")}
          </button>
        </div>
      </div>

      {sites.length === 0 && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", padding: "12px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#d97706", marginBottom: "20px", fontSize: "13px", fontWeight: 500 }}>
          <AlertCircle size={16} /> Please add "Work Sites" in Settings so you can assign workers to sites.
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {summary.map(s => (
          <div key={s.value} style={{
            background: "white", borderRadius: "12px", padding: "14px 16px",
            border: `1px solid ${s.border}`, display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ width: "36px", height: "36px", background: s.bg, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{s.count}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{s.value}</div>
            </div>
          </div>
        ))}
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>{fmtRupee(todayPay)}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Today's Est. Pay</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8", alignSelf: "center", marginRight: "4px" }}>Mark all as:</span>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => markAll(s.value)} style={{
            padding: "6px 14px", background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: "20px", fontSize: "12px", color: s.color, fontWeight: 600, cursor: "pointer"
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
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
              ) : employees.map((emp, i) => {
                const rRaw    = records[emp._id];
                const status  = typeof rRaw === "string" ? rRaw : (rRaw?.status || "Present");
                const recSite = typeof rRaw === "string" ? "" : (rRaw?.site || "");
                const c       = cfg(status);
                const dayPay  = status === "Present" ? emp.dailyWage : status === "Half-Day" ? (emp.dailyWage || 0) * 0.5 : status === "Overtime" ? (emp.dailyWage || 0) * 1.5 : 0;
                const needsSite = status === "Present" || status === "Half-Day" || status === "Overtime";

                return (
                  <tr key={emp._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    {/* Worker */}
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

                    {/* Wage */}
                    <td style={{ padding: "14px 20px" }}><span style={{ fontSize: "13px", fontWeight: 600, color: "#059669" }}>{fmtRupee(emp.dailyWage)}/day</span></td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setStatus(emp._id, opt.value)}
                            style={{
                              padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              background: status === opt.value ? opt.bg : "transparent",
                              color: status === opt.value ? opt.color : "#94a3b8",
                              border: `1px solid ${status === opt.value ? opt.border : "#e2e8f0"}`,
                            }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Site */}
                    <td style={{ padding: "14px 20px" }}>
                      {needsSite ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <MapPin size={14} color="#64748b" />
                          <select value={recSite || ""} onChange={e => setSite(emp._id, e.target.value)} style={{ border: "none", background: "transparent", fontSize: "12px", color: "#0f172a", outline: "none", flex: 1 }}>
                            <option value="" disabled>Select site</option>
                            {sites.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Not Applicable</span>
                      )}
                    </td>

                    {/* Est Pay */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: dayPay > 0 ? "#059669" : "#94a3b8" }}>
                        {dayPay > 0 ? fmtRupee(dayPay) : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </Layout>
  );
}