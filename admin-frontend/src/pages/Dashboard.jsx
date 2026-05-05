import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import {
  Users, CheckSquare, XCircle, Clock, Timer,
  Calculator, Banknote, Receipt, ArrowRight, CalendarCheck, MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function StatCard({ icon: Icon, label, value, sub, color, bg, onClick }) {
  return (
    <div onClick={onClick} className="card-hover" style={{
      background: "white", borderRadius: "14px", padding: "18px",
      boxShadow: "var(--shadow-card)", border: "1px solid var(--border-light)",
      cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{
          width: "42px", height: "42px", background: bg,
          borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={20} color={color} />
        </div>
        {onClick && <ArrowRight size={14} color="#cbd5e1" />}
      </div>
      <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>{label}</div>
      {sub && <div style={{ color: color, fontSize: "11px", fontWeight: 600, marginTop: "3px" }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [time,  setTime]  = useState(new Date());
  const [activeSite, setActiveSite] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    API.get("/attendance/stats", { headers: hdrs() })
      .then(r => {
        setStats(r.data);
        if (r.data.siteDeployments) {
          const sites = Object.keys(r.data.siteDeployments);
          if (sites.length > 0) setActiveSite(sites[0]);
        }
      })
      .catch(() => {});
  }, []);

  const formatTime = d =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = d =>
    d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Layout>
      <style>{`
        .dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; gap: 10px; }
        .dash-clock { background: #0f172a; border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dash-section-label { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 10px; }
        .dash-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 22px; }
        .dash-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
        .dash-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        @media (max-width: 768px) {
          .dash-header { flex-wrap: wrap; }
          .dash-clock { order: -1; width: 100%; justify-content: center; }
          .dash-grid-5 { grid-template-columns: 1fr 1fr; gap: 10px; }
          .dash-grid-3 { grid-template-columns: 1fr; gap: 10px; }
          .dash-grid-2 { grid-template-columns: 1fr; gap: 10px; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .dash-grid-5 { grid-template-columns: repeat(3, 1fr); }
        }
        .site-tabs-container { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 12px; }
        .site-tabs-container::-webkit-scrollbar { height: 4px; }
        .site-tabs-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .site-tab { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; border: 1px solid var(--border-light); background: #f8fafc; color: #64748b; }
        .site-tab.active { background: #0f172a; color: white; border-color: #0f172a; box-shadow: 0 4px 6px -1px rgba(15,23,42,0.2); }
      `}</style>

      {/* Header */}
      <div className="dash-header">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "2px" }}>Dashboard</h1>
          <p style={{ color: "#64748b", fontSize: "12px" }}>{formatDate(time)}</p>
        </div>
        <div className="dash-clock">
          <Clock size={14} color="#818cf8" />
          <div style={{ color: "white", fontWeight: 700, fontSize: "14px", letterSpacing: ".5px", fontVariantNumeric: "tabular-nums" }}>{formatTime(time)}</div>
        </div>
      </div>

      {/* Today's attendance */}
      <div className="dash-section-label">Today's Attendance</div>
      <div className="dash-grid-5">
        <StatCard icon={Users}       label="Total Workers"  value={stats?.totalEmployees ?? "—"} color="#6366f1" bg="rgba(99,102,241,0.1)"  onClick={() => navigate("/employees")} />
        <StatCard icon={CheckSquare} label="Present Today"  value={stats?.present ?? "—"}        color="#10b981" bg="rgba(16,185,129,0.1)"  onClick={() => navigate("/attendance")} />
        <StatCard icon={XCircle}     label="Absent Today"   value={stats?.absent ?? "—"}         color="#ef4444" bg="rgba(239,68,68,0.1)"   onClick={() => navigate("/attendance")} />
        <StatCard icon={Clock}       label="Half-Day"       value={stats?.halfDay ?? "—"}        color="#f59e0b" bg="rgba(245,158,11,0.1)"  onClick={() => navigate("/attendance")} />
        <StatCard icon={Timer}       label="Overtime"       value={stats?.overtime ?? "—"}       color="#4f46e5" bg="rgba(99,102,241,0.1)"  onClick={() => navigate("/attendance")} />
      </div>

      {/* Today's Deployments (Site-Wise) */}
      <div className="dash-section-label">Today's Deployments</div>
      <div style={{
        background: "white", borderRadius: "14px", padding: "20px", marginBottom: "22px",
        boxShadow: "var(--shadow-card)", border: "1px solid var(--border-light)",
      }}>
        {!stats?.siteDeployments || Object.keys(stats.siteDeployments).length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
            <MapPin size={28} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
            <p>No workers deployed today.</p>
          </div>
        ) : (
          <>
            <div className="site-tabs-container">
              {Object.keys(stats.siteDeployments).map(site => (
                <div 
                  key={site} 
                  className={`site-tab ${activeSite === site ? "active" : ""}`}
                  onClick={() => setActiveSite(site)}
                >
                  {site} <span style={{ opacity: 0.8, marginLeft: "4px", fontSize: "11px" }}>({stats.siteDeployments[site].length})</span>
                </div>
              ))}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
              {stats.siteDeployments[activeSite]?.map(worker => (
                <div key={worker.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "#f8fafc", borderRadius: "10px",
                  border: "1px solid var(--border-light)"
                }}>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{worker.name}</div>
                  <div style={{ 
                    fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
                    background: worker.status === "Half-Day" ? "rgba(245,158,11,0.1)" : 
                                worker.status === "Overtime" ? "rgba(99,102,241,0.1)" : "rgba(16,185,129,0.1)",
                    color: worker.status === "Half-Day" ? "#d97706" : 
                           worker.status === "Overtime" ? "#4f46e5" : "#059669"
                  }}>
                    {worker.status}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* This week's payroll */}
      <div className="dash-section-label">This Week's Payroll Summary</div>
      <div className="dash-grid-3">
        <StatCard icon={Calculator}   label="Gross Wages (this week)"   value={fmtRupee(stats?.weeklyGross)}   color="#6366f1" bg="rgba(99,102,241,0.1)"  onClick={() => navigate("/payroll")} />
        <StatCard icon={Banknote}     label="Total Advances (this week)" value={fmtRupee(stats?.weeklyAdvance)} color="#ef4444" bg="rgba(239,68,68,0.1)"   onClick={() => navigate("/advances")} />
        <StatCard icon={Receipt}      label="Net Payable (this week)"   value={fmtRupee(stats?.weeklyNet)}     color="#10b981" bg="rgba(16,185,129,0.1)"  onClick={() => navigate("/payroll")} sub="Gross − Advances" />
      </div>

      {/* Recent advances */}
      <div style={{
        background: "white", borderRadius: "14px", padding: "20px",
        boxShadow: "var(--shadow-card)", border: "1px solid var(--border-light)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Recent Advances</h3>
            <p style={{ color: "#94a3b8", fontSize: "11px" }}>Latest mid-week cash given</p>
          </div>
          <button onClick={() => navigate("/advances")} style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "7px 14px", background: "#f1f5f9",
            border: "none", borderRadius: "8px", fontSize: "12px",
            color: "#475569", cursor: "pointer", fontWeight: 600,
          }}>
            View All <ArrowRight size={12} />
          </button>
        </div>

        {!stats?.recentAdvances?.length ? (
          <div style={{ textAlign: "center", padding: "28px", color: "#94a3b8", fontSize: "13px" }}>
            <Banknote size={28} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
            <p>No advances recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats.recentAdvances.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: "#f8fafc", borderRadius: "10px",
                border: "1px solid var(--border-light)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    background: "rgba(239,68,68,0.1)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#dc2626", fontWeight: 700, fontSize: "13px",
                  }}>
                    {a.name?.[0] || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{a.name}</div>
                    {a.note && <div style={{ fontSize: "11px", color: "#94a3b8" }}>{a.note}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#dc2626" }}>−{fmtRupee(a.amount)}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>{fmtDate(a.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="dash-grid-2">
        {[
          { label: "Mark Today's Attendance", desc: "Record who worked today", color: "#6366f1", path: "/attendance", icon: CalendarCheck },
          { label: "View Weekly Payroll",     desc: "See what to pay this weekend", color: "#10b981", path: "/payroll",    icon: Calculator },
        ].map(q => (
          <button key={q.path} onClick={() => navigate(q.path)} style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "16px 18px", background: "white",
            border: `1px solid ${q.color}18`, borderRadius: "14px",
            cursor: "pointer", textAlign: "left", transition: "all .2s",
            boxShadow: "var(--shadow-card)",
          }}>
            <div style={{
              width: "42px", height: "42px", background: `${q.color}12`,
              borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <q.icon size={20} color={q.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{q.label}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{q.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </Layout>
  );
}