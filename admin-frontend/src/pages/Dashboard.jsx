import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import {
  Users, CheckSquare, XCircle, Clock, Timer,
  Calculator, Banknote, Receipt, ArrowRight, CalendarCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function StatCard({ icon: Icon, label, value, sub, color, bg, onClick }) {
  return (
    <div onClick={onClick} className="card-hover" style={{
      background: "white", borderRadius: "16px", padding: "22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
      cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{
          width: "46px", height: "46px", background: bg,
          borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={22} color={color} />
        </div>
        {onClick && <ArrowRight size={16} color="#cbd5e1" />}
      </div>
      <div style={{ fontSize: "30px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>{label}</div>
      {sub && <div style={{ color: color, fontSize: "12px", fontWeight: 600, marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [time,  setTime]  = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    API.get("/attendance/stats", { headers: hdrs() })
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  const formatTime = d =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = d =>
    d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "26px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>Dashboard</h1>
          <p style={{ color: "#64748b", fontSize: "13px" }}>{formatDate(time)}</p>
        </div>
        <div style={{
          background: "#0f172a", borderRadius: "14px", padding: "11px 18px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <Clock size={16} color="#818cf8" />
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "15px", letterSpacing: "0.5px" }}>{formatTime(time)}</div>
            <div style={{ color: "#64748b", fontSize: "10px" }}>Live</div>
          </div>
        </div>
      </div>

      {/* Today's attendance */}
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
        Today's Attendance
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <StatCard icon={Users}       label="Total Workers"  value={stats?.totalEmployees ?? "—"} color="#6366f1" bg="rgba(99,102,241,0.1)"  onClick={() => navigate("/employees")} />
        <StatCard icon={CheckSquare} label="Present Today"  value={stats?.present ?? "—"}        color="#10b981" bg="rgba(16,185,129,0.1)"  onClick={() => navigate("/attendance")} />
        <StatCard icon={XCircle}     label="Absent Today"   value={stats?.absent ?? "—"}         color="#ef4444" bg="rgba(239,68,68,0.1)"   onClick={() => navigate("/attendance")} />
        <StatCard icon={Clock}       label="Half-Day"       value={stats?.halfDay ?? "—"}        color="#f59e0b" bg="rgba(245,158,11,0.1)"  onClick={() => navigate("/attendance")} />
        <StatCard icon={Timer}       label="Overtime"       value={stats?.overtime ?? "—"}       color="#4f46e5" bg="rgba(99,102,241,0.1)"  onClick={() => navigate("/attendance")} />
      </div>

      {/* This week's payroll */}
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
        This Week's Payroll Summary
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <StatCard icon={Calculator}   label="Gross Wages (this week)"  value={fmtRupee(stats?.weeklyGross)}   color="#6366f1" bg="rgba(99,102,241,0.1)"  onClick={() => navigate("/payroll")} />
        <StatCard icon={Banknote}     label="Total Advances (this week)" value={fmtRupee(stats?.weeklyAdvance)} color="#ef4444" bg="rgba(239,68,68,0.1)"   onClick={() => navigate("/advances")} />
        <StatCard icon={Receipt}      label="Net Payable (this week)"  value={fmtRupee(stats?.weeklyNet)}     color="#10b981" bg="rgba(16,185,129,0.1)"  onClick={() => navigate("/payroll")}
          sub="Gross − Advances" />
      </div>

      {/* Recent advances */}
      <div style={{
        background: "white", borderRadius: "16px", padding: "22px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Recent Advances</h3>
            <p style={{ color: "#94a3b8", fontSize: "12px" }}>Latest mid-week cash given</p>
          </div>
          <button onClick={() => navigate("/advances")} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 14px", background: "#f1f5f9",
            border: "none", borderRadius: "8px", fontSize: "12px",
            color: "#475569", cursor: "pointer", fontWeight: 600,
          }}>
            View All <ArrowRight size={13} />
          </button>
        </div>

        {!stats?.recentAdvances?.length ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: "13px" }}>
            <Banknote size={32} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
            <p>No advances recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {stats.recentAdvances.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: "#f8fafc", borderRadius: "10px",
                border: "1px solid #f1f5f9",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "rgba(239,68,68,0.1)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#dc2626", fontWeight: 700, fontSize: "14px",
                  }}>
                    {a.name?.[0] || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{a.name}</div>
                    {a.note && <div style={{ fontSize: "11px", color: "#94a3b8" }}>{a.note}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#dc2626" }}>−{fmtRupee(a.amount)}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{fmtDate(a.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "18px" }}>
        {[
          { label: "Mark Today's Attendance", desc: "Record who worked today", color: "#6366f1", path: "/attendance", icon: CalendarCheck },
          { label: "View Weekly Payroll",     desc: "See what to pay this weekend", color: "#10b981", path: "/payroll",    icon: Calculator },
        ].map(q => (
          <button key={q.path} onClick={() => navigate(q.path)} style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "18px 20px", background: "white",
            border: `1px solid ${q.color}22`, borderRadius: "14px",
            cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = `${q.color}08`)}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            <div style={{
              width: "44px", height: "44px", background: `${q.color}15`,
              borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <q.icon size={20} color={q.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{q.label}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{q.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </Layout>
  );
}