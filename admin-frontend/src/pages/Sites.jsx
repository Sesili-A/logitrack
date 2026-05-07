import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { MapPin, TrendingUp, Calendar, Users, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function Sites() {
  const [siteStats, setSiteStats] = useState({});
  const [loading,   setLoading]   = useState(true);
  const [weekStart, setWeekStart] = useState(getMonday());
  const [weekEnd,   setWeekEnd]   = useState(null);

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
  const totalWorkers = siteArray.reduce((s, x) => s + x.workers, 0);
  const totalDays    = siteArray.reduce((s, x) => s + x.days, 0);

  // colour palette for site cards
  const colours = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#0ea5e9","#ec4899"];

  return (
    <Layout>
      <style>{`
        .sites-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .sites-week-nav { display:flex; align-items:center; background:white; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
        .sites-week-nav button { padding:9px 13px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; font-size:12px; font-weight:600; color:#475569; }
        .sites-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
        .sites-card { background:white; border:1px solid #f1f5f9; border-radius:14px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .site-row { background:white; border:1px solid #f1f5f9; border-radius:14px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .site-row-top { display:flex; align-items:center; gap:14px; margin-bottom:14px; }
        .site-chips { display:flex; gap:10px; flex-wrap:wrap; }
        .site-chip { display:flex; flex-direction:column; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 16px; min-width:80px; text-align:center; }
        .progress-bar-bg { height:6px; background:#f1f5f9; border-radius:99px; margin-top:10px; overflow:hidden; }
        .progress-bar-fill { height:100%; border-radius:99px; transition:width 0.4s ease; }
        @media(max-width:640px){
          .sites-summary { grid-template-columns:1fr 1fr; }
          .sites-summary > *:last-child { grid-column:span 2; }
          .site-chips { gap:8px; }
          .site-chip { min-width:70px; padding:8px 10px; }
        }
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
              { icon: TrendingUp, label: "Total Site Cost",    value: `₹${totalCost.toLocaleString("en-IN")}`, color:"#6366f1", bg:"rgba(99,102,241,0.1)" },
              { icon: Users,      label: "Unique Workers",     value: totalWorkers,                            color:"#10b981", bg:"rgba(16,185,129,0.1)" },
              { icon: CalendarDays,label:"Total Days Worked",  value: totalDays,                              color:"#f59e0b", bg:"rgba(245,158,11,0.1)"  },
            ].map(s => (
              <div key={s.label} className="sites-card">
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
              const pct = totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
              const col = colours[idx % colours.length];
              return (
                <div key={s.site} className="site-row">
                  <div className="site-row-top">
                    {/* Icon */}
                    <div style={{ width:"46px", height:"46px", borderRadius:"13px", background:`${col}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <MapPin size={22} color={col} />
                    </div>

                    {/* Name + bar */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:"16px", color:"#0f172a" }}>{s.site}</div>
                      <div style={{ fontSize:"13px", color:"#64748b", marginTop:"1px" }}>{pct.toFixed(1)}% of total site budget</div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width:`${pct}%`, background:col }} />
                      </div>
                    </div>

                    {/* Cost */}
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:"20px", fontWeight:800, color:"#0f172a" }}>₹{s.cost.toLocaleString("en-IN")}</div>
                    </div>
                  </div>

                  {/* Chips: workers + days */}
                  <div className="site-chips">
                    <div className="site-chip">
                      <Users size={14} color={col} style={{ marginBottom:"4px" }} />
                      <span style={{ fontWeight:800, fontSize:"18px", color:"#0f172a" }}>{s.workers}</span>
                      <span style={{ fontSize:"10px", color:"#94a3b8", marginTop:"1px" }}>Workers</span>
                    </div>
                    <div className="site-chip">
                      <CalendarDays size={14} color={col} style={{ marginBottom:"4px" }} />
                      <span style={{ fontWeight:800, fontSize:"18px", color:"#0f172a" }}>{s.days}</span>
                      <span style={{ fontSize:"10px", color:"#94a3b8", marginTop:"1px" }}>Man-Days</span>
                    </div>
                    <div className="site-chip">
                      <TrendingUp size={14} color={col} style={{ marginBottom:"4px" }} />
                      <span style={{ fontWeight:800, fontSize:"18px", color:"#0f172a" }}>
                        ₹{s.days > 0 ? Math.round(s.cost / s.days).toLocaleString("en-IN") : 0}
                      </span>
                      <span style={{ fontSize:"10px", color:"#94a3b8", marginTop:"1px" }}>Avg/Day</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </Layout>
  );
}
