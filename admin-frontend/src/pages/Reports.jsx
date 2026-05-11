import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import {
  BarChart2, Download, Filter, ChevronDown, ChevronLeft,
  ChevronRight, TrendingUp, Users, UserCheck, UserX, Clock,
  Calendar, Search,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const token  = () => localStorage.getItem("token");
const hdrs   = () => ({ Authorization: `Bearer ${token()}` });

const STATUS_OPTIONS = ["all", "Present", "Absent", "Half-Day", "Overtime"];

const statusCfg = {
  Present:    { bg: "rgba(16,185,129,0.1)",  color: "#059669", border: "rgba(16,185,129,0.3)" },
  Absent:     { bg: "rgba(239,68,68,0.1)",   color: "#dc2626", border: "rgba(239,68,68,0.3)" },
  "Half-Day": { bg: "rgba(245,158,11,0.1)",  color: "#d97706", border: "rgba(245,158,11,0.3)" },
  Overtime:   { bg: "rgba(245,143,124,0.1)", color: "#e07a67", border: "rgba(245,143,124,0.3)" },
};

const fmt = iso => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const toYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const today = () => toYMD(new Date());
const monthStart = () => { const d = new Date(); d.setDate(1); return toYMD(d); };

// ── Monthly CSV download ──────────────────────────────────────────────────────
async function downloadMonthlyCSV(year, month) {
  const hdrs2 = { Authorization: `Bearer ${token()}` };
  const res = await API.get(`/attendance/monthly?year=${year}&month=${month}`, { headers: hdrs2 });
  const { allDays, report } = res.data;

  // Status abbreviations
  const abbr = s => s === "Present" ? "P" : s === "Half-Day" ? "H" : s === "Overtime" ? "OT" : s === "Absent" ? "A" : "—";

  const header = ["Name", "Phone", "Daily Wage", ...allDays.map(d => d.slice(8)), // day numbers
    "Present", "Half-Day", "Overtime", "Absent", "Gross Pay (₹)"];

  const rows = report.map(emp => [
    emp.name, emp.phone, emp.dailyWage,
    ...allDays.map(d => {
      const rec = emp.dayMap[d];
      return rec ? abbr(rec.status) : "";
    }),
    emp.presentDays, emp.halfDays, emp.overtimeDays, emp.absentDays, emp.grossWage,
  ]);

  const monthName = new Date(year, month-1, 1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const csv = [[`Attendance Report – ${monthName}`], header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `attendance_${year}_${String(month).padStart(2,"0")}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px", padding: "12px 16px",
    }}>
      <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "6px" }}>{label}</p>
      {payload.map(e => (
        <p key={e.dataKey} style={{ color: e.fill, fontSize: "13px", fontWeight: 600 }}>
          {e.dataKey}: {e.value}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [records,  setRecords]  = useState([]);
  const [summary,  setSummary]  = useState([]);
  const [employees, setEmployees] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [activeTab, setActiveTab] = useState("records");
  const [search,   setSearch]   = useState("");

  // Monthly download picker state
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [dlYear,  setDlYear]  = useState(new Date().getFullYear());
  const [dlMonth, setDlMonth] = useState(new Date().getMonth() + 1);
  const [dlLoading, setDlLoading] = useState(false);

  const [filters, setFilters] = useState({
    from:       monthStart(),
    to:         today(),
    employeeId: "all",
    status:     "all",
    page:       1,
  });

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  // Load employees for filter dropdown
  useEffect(() => {
    API.get("/employees", { headers: hdrs() })
      .then(r => setEmployees(r.data))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from:       filters.from,
        to:         filters.to,
        employeeId: filters.employeeId,
        status:     filters.status,
        page:       filters.page,
        limit:      25,
      });
      const res = await API.get(`/attendance/history?${params}`, { headers: hdrs() });
      setRecords(res.data.records  || []);
      setSummary(res.data.summary  || []);
      setTotal(  res.data.total    || 0);
      setPages(  res.data.pages    || 1);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Monthly download handler
  const handleMonthlyDownload = async () => {
    setDlLoading(true);
    try { await downloadMonthlyCSV(dlYear, dlMonth); setShowMonthPicker(false); }
    catch { alert("Failed to download. Please try again."); }
    finally { setDlLoading(false); }
  };

  // Export CSV (existing — filtered records)
  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Department", "Position", "Date", "Status"],
      ...records.map(r => [
        r.name, r.email, r.department, r.position,
        fmt(r.date), r.status,
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${filters.from}_to_${filters.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart data from summary
  const chartData = summary
    .sort((a, b) => b.Present - a.Present)
    .slice(0, 10)
    .map(s => ({ name: s.name.split(" ")[0], Present: s.Present, Absent: s.Absent, Late: s.Late }));

  const filteredSummary = summary.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    padding: "9px 14px", background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: "10px", fontSize: "13px", color: "#0f172a", outline: "none",
  };
  const selectWrap = { position: "relative", display: "inline-block" };
  const selectStyle = { ...inputStyle, appearance: "none", paddingRight: "32px", cursor: "pointer" };

  return (
    <Layout>
      {/* Header */}
      <div className="reports-header">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Reports</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Attendance analytics &amp; history
          </p>
        </div>
        <div className="reports-header-actions">
          {/* Monthly download */}
          <div style={{ position:"relative" }}>
            <button onClick={() => setShowMonthPicker(p => !p)} style={{
              display:"flex", alignItems:"center", gap:"8px",
              padding:"11px 18px", background:"linear-gradient(135deg,#6366f1,#4f46e5)",
              border:"none", borderRadius:"12px", color:"white",
              fontSize:"13px", fontWeight:600, cursor:"pointer",
              boxShadow:"0 4px 15px rgba(99,102,241,0.3)",
            }}>
              <Calendar size={15} /> Monthly ↓
            </button>
            {showMonthPicker && (
              <div style={{ position:"absolute", top:"110%", right:0, background:"white", border:"1px solid #e2e8f0", borderRadius:"14px", padding:"16px", boxShadow:"0 12px 40px rgba(0,0,0,0.15)", zIndex:200, minWidth:"220px" }}>
                <div style={{ fontSize:"12px", fontWeight:700, color:"#94a3b8", marginBottom:"10px", textTransform:"uppercase" }}>Select Month</div>
                <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                  <select value={dlMonth} onChange={e => setDlMonth(Number(e.target.value))}
                    style={{ flex:1, padding:"8px", border:"1px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", outline:"none" }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>(
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <input type="number" value={dlYear} onChange={e => setDlYear(Number(e.target.value))}
                    style={{ width:"72px", padding:"8px", border:"1px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", outline:"none" }} />
                </div>
                <button onClick={handleMonthlyDownload} disabled={dlLoading}
                  style={{ width:"100%", padding:"10px", background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white", border:"none", borderRadius:"9px", fontWeight:700, fontSize:"13px", cursor:dlLoading?"wait":"pointer", opacity:dlLoading?0.7:1 }}>
                  {dlLoading ? "Generating…" : "Download CSV"}
                </button>
              </div>
            )}
          </div>

          {/* Filtered export */}
          <button onClick={exportCSV} style={{
            display:"flex", alignItems:"center", gap:"8px",
            padding:"11px 20px", background:"linear-gradient(135deg, #10b981, #059669)",
            border:"none", borderRadius:"12px", color:"white",
            fontSize:"14px", fontWeight:600, cursor:"pointer",
            boxShadow:"0 4px 15px rgba(16,185,129,0.3)",
            transition:"transform 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <Download size={17} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters-box">
        {/* From date */}
        <div className="filter-item">
          <label>From</label>
          <input type="date" value={filters.from} max={filters.to}
            onChange={e => setF("from", e.target.value)} style={inputStyle} />
        </div>

        {/* To date */}
        <div className="filter-item">
          <label>To</label>
          <input type="date" value={filters.to} min={filters.from}
            onChange={e => setF("to", e.target.value)} style={inputStyle} />
        </div>

        {/* Employee */}
        <div className="filter-item">
          <label>Employee</label>
          <div style={{ ...selectWrap, width: "100%" }}>
            <select value={filters.employeeId} onChange={e => setF("employeeId", e.target.value)} style={{ ...selectStyle, width: "100%" }}>
              <option value="all">All Employees</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Status */}
        <div className="filter-item">
          <label>Status</label>
          <div style={{ ...selectWrap, width: "100%" }}>
            <select value={filters.status} onChange={e => setF("status", e.target.value)} style={{ ...selectStyle, width: "100%" }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Quick ranges */}
        <div className="quick-ranges">
          {[
            { label: "Today",     from: today(),       to: today() },
            { label: "This Week", from: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return toYMD(d); })(), to: today() },
            { label: "This Month", from: monthStart(), to: today() },
          ].map(q => (
            <button key={q.label}
              onClick={() => setFilters(f => ({ ...f, from: q.from, to: q.to, page: 1 }))}
              style={{
                padding: "7px 14px", background: "#f1f5f9", border: "none",
                borderRadius: "8px", fontSize: "12px", color: "#475569", cursor: "pointer", fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#e0e7ff"; e.currentTarget.style.color = "#4f46e5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat tiles */}
      {summary.length > 0 && (
        <div className="reports-stats-grid">
          {[
            { icon: Users,     label: "Total Records",   value: total,                                          color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
            { icon: UserCheck, label: "Total Present",   value: summary.reduce((a, s) => a + s.Present, 0),     color: "#10b981", bg: "rgba(16,185,129,0.1)" },
            { icon: UserX,     label: "Total Absent",    value: summary.reduce((a, s) => a + s.Absent,  0),     color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
            { icon: TrendingUp,label: "Avg. Attend Rate",
              value: summary.length
                ? Math.round(summary.reduce((a, s) => a + s.rate, 0) / summary.length) + "%"
                : "—",
              color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "white", borderRadius: "14px", padding: "20px",
              border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: "44px", height: "44px", background: s.bg,
                borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{
          background: "white", borderRadius: "16px", padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
          marginBottom: "24px",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>Attendance by Employee</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>Top 10 employees in selected period</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Present" fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="Absent"  fill="#ef4444" radius={[6,6,0,0]} />
              <Bar dataKey="Late"    fill="#f59e0b" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        background: "white", borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        {/* Tab bar */}
        <div className="tabs-header">
          {[
            { key: "records", label: `Records (${total})`, icon: Calendar },
            { key: "summary", label: `Per-Employee Summary (${summary.length})`, icon: BarChart2 },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`tab-btn ${active ? "active" : ""}`}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}

          {activeTab === "summary" && (
            <div className="summary-search">
              <Search size={14} color="#94a3b8" />
              <input placeholder="Search employee…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", color: "#0f172a", width: "160px" }}
              />
            </div>
          )}
        </div>

        {/* Records tab */}
        {activeTab === "records" && (
          <>
            <div className="mobile-table-wrap">
              <table className="desktop-table">
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Department", "Date", "Status"].map(h => (
                      <th key={h} style={{
                        padding: "12px 20px", textAlign: "left",
                        fontSize: "11px", fontWeight: 700, color: "#94a3b8",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}>Loading…</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "14px" }}>
                      <BarChart2 size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                      <p style={{ fontWeight: 600 }}>No records found</p>
                      <p style={{ fontSize: "13px", marginTop: "4px" }}>Try adjusting your filters.</p>
                    </td></tr>
                  ) : records.map((r, i) => {
                    const cfg = statusCfg[r.status] || statusCfg.Present;
                    const avatarColors = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
                    const ac = avatarColors[(r.name?.charCodeAt(0) || 0) % avatarColors.length];
                    return (
                      <tr key={r._id || i} style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "36px", height: "36px", borderRadius: "50%",
                              background: ac, display: "flex", alignItems: "center",
                              justifyContent: "center", color: "white",
                              fontWeight: 700, fontSize: "12px", flexShrink: 0,
                            }}>
                              {r.name?.[0] || "?"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{r.name}</div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{r.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{r.department}</td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{fmt(r.date)}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                          }}>
                            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.color }} />
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Records */}
            <div className="mobile-cards">
              {loading ? (
                <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}>Loading…</div>
              ) : records.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "14px" }}>
                  <BarChart2 size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <p style={{ fontWeight: 600 }}>No records found</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}>Try adjusting your filters.</p>
                </div>
              ) : records.map((r, i) => {
                const cfg = statusCfg[r.status] || statusCfg.Present;
                const avatarColors = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
                const ac = avatarColors[(r.name?.charCodeAt(0) || 0) % avatarColors.length];
                return (
                  <div className="report-card" key={r._id || i}>
                    <div className="report-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: ac, display: "flex", alignItems: "center",
                          justifyContent: "center", color: "white",
                          fontWeight: 700, fontSize: "12px", flexShrink: 0,
                        }}>
                          {r.name?.[0] || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{r.name}</div>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>{r.email}</div>
                        </div>
                      </div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      }}>
                        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: cfg.color }} />
                        {r.status}
                      </span>
                    </div>
                    <div className="report-card-body">
                      <div className="report-card-row">
                        <span>Date</span>
                        <strong>{fmt(r.date)}</strong>
                      </div>
                      <div className="report-card-row">
                        <span>Department</span>
                        <strong>{r.department}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{
                padding: "16px 24px", borderTop: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  Page {filters.page} of {pages} ({total} records)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "7px 14px", background: "#f1f5f9", border: "none",
                      borderRadius: "8px", fontSize: "13px", color: "#475569",
                      cursor: filters.page <= 1 ? "not-allowed" : "pointer",
                      opacity: filters.page <= 1 ? 0.4 : 1,
                    }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    disabled={filters.page >= pages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "7px 14px", background: "#f1f5f9", border: "none",
                      borderRadius: "8px", fontSize: "13px", color: "#475569",
                      cursor: filters.page >= pages ? "not-allowed" : "pointer",
                      opacity: filters.page >= pages ? 0.4 : 1,
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Summary tab */}
        {activeTab === "summary" && (
          <>
          <div className="mobile-table-wrap">
            <table className="desktop-table">
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Department", "Present", "Absent", "Late", "Leave", "Total", "Attend Rate"].map(h => (
                    <th key={h} style={{
                      padding: "12px 20px", textAlign: "left",
                      fontSize: "11px", fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>Loading…</td></tr>
                ) : filteredSummary.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "14px" }}>
                    No data for selected filters.
                  </td></tr>
                ) : filteredSummary.map(s => (
                  <tr key={s.id} style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{s.name}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{s.department}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ color: "#059669", fontWeight: 700, fontSize: "14px" }}>{s.Present}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "14px" }}>{s.Absent}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ color: "#d97706", fontWeight: 700, fontSize: "14px" }}>{s.Late}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ color: "#4f46e5", fontWeight: 700, fontSize: "14px" }}>{s.Leave}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{s.total}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ flex: 1, background: "#f1f5f9", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: "4px",
                            width: `${s.rate}%`,
                            background: s.rate >= 80 ? "#10b981" : s.rate >= 60 ? "#f59e0b" : "#ef4444",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                        <span style={{
                          fontSize: "12px", fontWeight: 700,
                          color: s.rate >= 80 ? "#059669" : s.rate >= 60 ? "#d97706" : "#dc2626",
                          minWidth: "36px",
                        }}>
                          {s.rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards for Summary */}
          <div className="mobile-cards">
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}>Loading…</div>
            ) : filteredSummary.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "14px" }}>No data for selected filters.</div>
            ) : filteredSummary.map(s => (
              <div className="report-card" key={s.id}>
                <div className="report-card-header">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{s.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{s.department}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>Rate</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: s.rate >= 80 ? "#059669" : s.rate >= 60 ? "#d97706" : "#dc2626" }}>
                      {s.rate}%
                    </div>
                  </div>
                </div>
                <div className="report-card-body">
                  <div className="report-card-row">
                    <span>Present</span>
                    <strong style={{ color: "#059669" }}>{s.Present}</strong>
                  </div>
                  <div className="report-card-row">
                    <span>Absent</span>
                    <strong style={{ color: "#dc2626" }}>{s.Absent}</strong>
                  </div>
                  <div className="report-card-row">
                    <span>Late / Leave</span>
                    <strong><span style={{color:"#d97706"}}>{s.Late}</span> / <span style={{color:"#4f46e5"}}>{s.Leave}</span></strong>
                  </div>
                  <div className="report-card-row">
                    <span>Total Days</span>
                    <strong>{s.total}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </Layout>
  );
}
