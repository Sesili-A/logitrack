import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { MapPin, TrendingUp, Calendar, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import API from "../services/api";

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day  = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}
function toYMD(d) { return d.toISOString().split("T")[0]; }
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function Sites() {
  const [siteStats,   setSiteStats]   = useState({});
  const [loading,     setLoading]     = useState(true);
  const [weekStart,   setWeekStart]   = useState(getMonday());
  const [weekEnd,     setWeekEnd]     = useState(null);
  const [expanded,    setExpanded]    = useState({}); // { siteName: true }

  const isCurrentWeek = toYMD(weekStart) === toYMD(getMonday());

  useEffect(() => { fetchPayroll(); }, [weekStart]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await API.get(`/attendance/payroll?weekStart=${toYMD(weekStart)}`, { headers: hdrs });
      setSiteStats(res.data.siteStats || {});
      setWeekEnd(res.data.weekEnd);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); if (d <= new Date()) setWeekStart(d); };

  const siteArray = Object.entries(siteStats)
    .map(([site, s]) => ({ site, ...s }))
    .sort((a, b) => b.cost - a.cost);

  const totalCost    = siteArray.reduce((s, x) => s + x.cost, 0);
  // dayWise values are now { count, statuses } objects
  const maxPeak = siteArray.length > 0
    ? Math.max(...siteArray.flatMap(x => Object.values(x.dayWise || {}).map(d => (typeof d === "object" ? d.count : d))))
    : 0;
  const totalWorkers = maxPeak;

  const colours = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#0ea5e9","#ec4899"];

  const toggleExpand = (site) => setExpanded(prev => ({ ...prev, [site]: !prev[site] }));

  return (
    <Layout>
      <style>{`
        .sites-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .sites-week-nav { display:flex; align-items:center; background:white; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
        .sites-week-nav button { padding:9px 13px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; font-size:12px; font-weight:600; color:#475569; }
        .sites-summary { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-bottom:20px; }
        .sites-sum-card { background:white; border:1px solid #f1f5f9; border-radius:14px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .site-row { background:white; border:1px solid #f1f5f9; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .site-row-header { display:flex; align-items:center; gap:14px; padding:18px; cursor:pointer; transition:background 0.15s; }
        .site-row-header:hover { background:#fafbfc; }
        .site-chips { display:flex; gap:10px; flex-wrap:wrap; padding:0 18px 14px; }
        .site-chip { display:flex; flex-direction:column; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 18px; min-width:90px; text-align:center; }
        .progress-bar-bg { height:6px; background:#f1f5f9; border-radius:99px; margin-top:10px; overflow:hidden; }
        .progress-bar-fill { height:100%; border-radius:99px; transition:width 0.5s ease; }
        /* Day-wise dropdown */
        .daywise-table { width:100%; border-collapse:collapse; }
        .daywise-table th { padding:8px 16px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.06em; text-transform:uppercase; background:#f8fafc; }
        .daywise-table td { padding:10px 16px; border-top:1px solid #f1f5f9; font-size:13px; }
        .daywise-row:hover td { background:#fffbf5; }
        @media(max-width:640px){
          .sites-summary { grid-template-columns:1fr 1fr; }
          .site-chips { gap:8px; }
          .site-chip { min-width:70px; padding:8px 10px; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div className="sites-header">
        <div>
          <h1 style={{ fontSize:"22px", fontWeight:800, color:"#0f172a", marginBottom:"3px" }}>Site Wise Payments</h1>
          <p style={{ color:"#64748b", fontSize:"13px" }}>
            {weekEnd ? `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}` : "Loading…"}
            {isCurrentWeek && (
              <span style={{ marginLeft:"10px", background:"rgba(99,102,241,0.1)", color:"#6366f1", padding:"2px 8px", borderRadius:"10px", fontSize:"11px", fontWeight:600 }}>
                Current Week
              </span>
            )}
          </p>
        </div>

        <div className="sites-week-nav">
          <button onClick={prevWeek} style={{ borderRight:"1px solid #e2e8f0" }}>
            <ChevronLeft size={16} color="#475569" />
          </button>
          <button onClick={() => setWeekStart(getMonday())}>This Week</button>
          <button onClick={nextWeek} disabled={isCurrentWeek}
            style={{ borderLeft:"1px solid #e2e8f0", opacity: isCurrentWeek ? 0.4 : 1, cursor: isCurrentWeek ? "not-allowed" : "pointer" }}>
            <ChevronRight size={16} color="#475569" />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:"60px", textAlign:"center", color:"#94a3b8" }}>
          <div style={{ width:"36px", height:"36px", border:"3px solid #e2e8f0", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }} />
          Loading site data…
        </div>
      ) : siteArray.length === 0 ? (
        <div style={{ padding:"60px", textAlign:"center", background:"white", borderRadius:"16px", border:"1px solid #f1f5f9" }}>
          <MapPin size={40} color="#cbd5e1" style={{ margin:"0 auto 12px" }} />
          <h3 style={{ color:"#334155", marginBottom:"6px" }}>No Sites Active</h3>
          <p style={{ color:"#64748b", fontSize:"14px" }}>No attendance with site assignments found for this week.</p>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="sites-summary">
            {[
              { icon: TrendingUp, label: "Total Site Cost",   value: `₹${totalCost.toLocaleString("en-IN")}`, color:"#6366f1", bg:"rgba(99,102,241,0.1)" },
              { icon: Users,      label: "Peak Workers/Day",  value: totalWorkers,                             color:"#10b981", bg:"rgba(16,185,129,0.1)" },
            ].map(s => (
              <div key={s.label} className="sites-sum-card">
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                  <div style={{ width:"38px", height:"38px", background:s.bg, borderRadius:"11px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <s.icon size={18} color={s.color} />
                  </div>
                  <div style={{ fontSize:"12px", color:"#94a3b8" }}>{s.label}</div>
                </div>
                <div style={{ fontSize:"26px", fontWeight:800, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Site Rows ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"14px", paddingBottom:"20px" }}>
            {siteArray.map((s, idx) => {
              const pct  = totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
              const col  = colours[idx % colours.length];
              const isOpen = expanded[s.site];
              const dayWiseEntries = Object.entries(s.dayWise || {}).sort(([a],[b]) => a.localeCompare(b));
              // support both old (number) and new ({ count, statuses }) shape
              const getDayCount = (dv) => typeof dv === "object" ? dv.count : dv;
              const getDayStatuses = (dv) => typeof dv === "object" ? (dv.statuses || {}) : {};
              const peakWorkers = dayWiseEntries.length > 0
                ? Math.max(...dayWiseEntries.map(([,v]) => getDayCount(v)))
                : s.workers;

              return (
                <div key={s.site} className="site-row">
                  {/* Clickable header */}
                  <div className="site-row-header" onClick={() => toggleExpand(s.site)}>
                    {/* Icon */}
                    <div style={{ width:"46px", height:"46px", borderRadius:"13px", background:`${col}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <MapPin size={22} color={col} />
                    </div>

                    {/* Name + bar */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:"16px", color:"#0f172a" }}>{s.site}</div>
                      <div style={{ fontSize:"13px", color:"#64748b", marginTop:"1px" }}>{pct.toFixed(1)}% of total budget</div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width:`${pct}%`, background:col }} />
                      </div>
                    </div>

                    {/* Cost + expand toggle */}
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:"20px", fontWeight:800, color:"#0f172a" }}>₹{s.cost.toLocaleString("en-IN")}</div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"4px", fontSize:"11px", color:"#94a3b8", marginTop:"4px" }}>
                        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isOpen ? "Hide days" : "Day-wise"}
                      </div>
                    </div>
                  </div>

                  {/* Chips: total workers + peak workers */}
                  <div className="site-chips">
                    <div className="site-chip">
                      <Users size={14} color={col} style={{ marginBottom:"4px" }} />
                      <span style={{ fontWeight:800, fontSize:"18px", color:"#0f172a" }}>{s.workers}</span>
                      <span style={{ fontSize:"10px", color:"#94a3b8", marginTop:"1px" }}>Total Workers</span>
                    </div>
                    <div className="site-chip">
                      <TrendingUp size={14} color={col} style={{ marginBottom:"4px" }} />
                      <span style={{ fontWeight:800, fontSize:"18px", color:"#0f172a" }}>{peakWorkers}</span>
                      <span style={{ fontSize:"10px", color:"#94a3b8", marginTop:"1px" }}>Peak/Day</span>
                    </div>
                    <div className="site-chip">
                      <Calendar size={14} color={col} style={{ marginBottom:"4px" }} />
                      <span style={{ fontWeight:800, fontSize:"18px", color:"#0f172a" }}>{dayWiseEntries.length}</span>
                      <span style={{ fontSize:"10px", color:"#94a3b8", marginTop:"1px" }}>Active Days</span>
                    </div>
                    <div className="site-chip">
                      <MapPin size={14} color={col} style={{ marginBottom:"4px" }} />
                      <span style={{ fontWeight:800, fontSize:"14px", color:"#0f172a" }}>
                        ₹{s.workers > 0 ? Math.round(s.cost / s.workers).toLocaleString("en-IN") : 0}
                      </span>
                      <span style={{ fontSize:"10px", color:"#94a3b8", marginTop:"1px" }}>Avg/Worker</span>
                    </div>
                  </div>

                  {/* ── Day-wise dropdown ── */}
                  {isOpen && dayWiseEntries.length > 0 && (
                    <div style={{ borderTop:`1px solid ${col}20`, background:`${col}06` }}>
                      <table className="daywise-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Workers on Site</th>
                            <th>Worker Bar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayWiseEntries.map(([dateStr, dv]) => {
                            const count    = getDayCount(dv);
                            const statuses = getDayStatuses(dv);
                            return (
                            <tr key={dateStr} className="daywise-row">
                              <td style={{ fontWeight:600, color:"#0f172a" }}>{fmtDayLabel(dateStr)}</td>
                              <td>
                                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                                  <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:`${col}18`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:col, fontSize:"14px" }}>
                                    {count}
                                  </div>
                                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                                    {statuses["Present"] > 0 && <span style={{ fontSize:"10px", padding:"2px 6px", background:"rgba(16,185,129,0.1)", color:"#059669", borderRadius:"4px", fontWeight:600 }}>{statuses["Present"]}P</span>}
                                    {statuses["Half-Day"] > 0 && <span style={{ fontSize:"10px", padding:"2px 6px", background:"rgba(245,158,11,0.1)", color:"#d97706", borderRadius:"4px", fontWeight:600 }}>{statuses["Half-Day"]}½</span>}
                                    {statuses["Overtime"] > 0 && <span style={{ fontSize:"10px", padding:"2px 6px", background:"rgba(245,143,124,0.15)", color:"#e07a67", borderRadius:"4px", fontWeight:600 }}>{statuses["Overtime"]}OT</span>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ width:"40%" }}>
                                <div style={{ height:"8px", background:"#f1f5f9", borderRadius:"99px", overflow:"hidden" }}>
                                  <div style={{ height:"100%", borderRadius:"99px", background:col, width:`${peakWorkers > 0 ? (count/peakWorkers)*100 : 0}%`, transition:"width 0.4s" }} />
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
