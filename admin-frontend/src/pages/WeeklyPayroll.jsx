import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import {
  IndianRupee, ChevronLeft, ChevronRight, Printer,
  Download, TrendingUp, Wallet, UserCheck, AlertCircle,
} from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day  = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff); date.setHours(0,0,0,0);
  return date;
}
function toYMD(d) { return d.toISOString().split("T")[0]; }

export default function WeeklyPayroll() {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState(null);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/attendance/payroll?weekStart=${toYMD(weekStart)}`, { headers: hdrs() });
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayroll(); }, [weekStart]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); if (d <= new Date()) setWeekStart(d); };
  const isCurrentWeek = toYMD(weekStart) === toYMD(getMonday());

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Worker","Phone","Daily Wage","Days Present","Half Days","Overtime","Effective Days","Gross Wage","Advances","Net Payable"],
      ...data.payroll.map(p => [p.name, p.phone||"", `₹${p.dailyWage}`, p.presentDays, p.halfDays, p.overtimeDays, p.effectiveDays, `₹${p.grossWage}`, `₹${p.totalAdvance}`, `₹${p.netPayable}`]),
      [], ["","","","","","","TOTALS",`₹${data.totalGross}`,`₹${data.totalAdvance}`,`₹${data.totalNet}`],
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `payroll_${toYMD(weekStart)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 22px; gap: 12px;
        }
        .pay-header-actions {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;
        }
        .pay-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 14px; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
        }
        .pay-week-nav {
          display: flex; align-items: center; gap: 0;
          background: white; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
        }
        .pay-week-nav button {
          padding: 9px 13px; border: none; background: transparent; cursor: pointer;
          display: flex; align-items: center; font-size: 12px; font-weight: 600; color: #475569;
        }
        .pay-summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 20px; }

        /* Mobile worker cards */
        .pay-cards { display: none; flex-direction: column; gap: 10px; }
        .pay-card {
          background: white; border-radius: 14px; padding: 16px;
          border: 1px solid #f1f5f9; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .pay-card-top {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
        }
        .pay-card-worker { display: flex; align-items: center; gap: 10px; }
        .pay-card-stats {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-bottom: 10px;
        }
        .pay-card-stat {
          background: #f8fafc; border-radius: 8px; padding: 8px 6px; text-align: center;
        }
        .pay-card-stat-val { font-size: 16px; font-weight: 800; }
        .pay-card-stat-lbl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
        .pay-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 10px; border-top: 1px solid #f1f5f9;
        }
        .pay-total-bar {
          background: #0f172a; border-radius: 14px; padding: 16px 20px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin-top: 12px;
        }

        /* Desktop table */
        .pay-table-wrap {
          background: white; border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; overflow: hidden;
        }

        @media (max-width: 768px) {
          .pay-header { flex-direction: column; }
          .pay-header-actions { width: 100%; }
          .pay-summary { grid-template-columns: 1fr 1fr; }
          .pay-summary > *:last-child { grid-column: span 2; }
          .pay-table-wrap { display: none; }
          .pay-cards { display: flex; }
          .pay-btn span { display: none; }
        }

        @media print {
          aside, header, button, .mobile-bottom-nav { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="pay-header">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>Weekly Payroll</h1>
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            {fmtDate(weekStart)} – {fmtDate(weekEnd)}, {weekEnd.getFullYear()}
            {isCurrentWeek && (
              <span style={{ marginLeft: "10px", background: "rgba(99,102,241,0.1)", color: "#6366f1", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
                Current Week
              </span>
            )}
          </p>
        </div>

        <div className="pay-header-actions">
          {/* Week nav */}
          <div className="pay-week-nav">
            <button onClick={prevWeek} style={{ borderRight: "1px solid #e2e8f0" }}>
              <ChevronLeft size={16} color="#475569" />
            </button>
            <button onClick={() => setWeekStart(getMonday())}>This Week</button>
            <button onClick={nextWeek} disabled={isCurrentWeek} style={{ borderLeft: "1px solid #e2e8f0", opacity: isCurrentWeek ? 0.4 : 1, cursor: isCurrentWeek ? "not-allowed" : "pointer" }}>
              <ChevronRight size={16} color="#475569" />
            </button>
          </div>

          <button onClick={exportCSV} className="pay-btn" style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
            <Download size={15} /><span> Export CSV</span>
          </button>
          <button onClick={() => window.print()} className="pay-btn" style={{ background: "#0f172a", color: "white" }}>
            <Printer size={15} /><span> Print</span>
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="pay-summary">
        {[
          { icon: TrendingUp,  label: "Gross Wages",    value: fmtRupee(data?.totalGross),   sub: "Days worked × daily rate", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
          { icon: Wallet,      label: "Total Advances", value: fmtRupee(data?.totalAdvance), sub: "Deducted from wages",       color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { icon: IndianRupee, label: "Net Payable",    value: fmtRupee(data?.totalNet),     sub: "Gross − Advances",          color: "#10b981", bg: "rgba(16,185,129,0.1)" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "38px", height: "38px", background: s.bg, borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{s.label}</div>
                <div style={{ fontSize: "10px", color: "#cbd5e1" }}>{s.sub}</div>
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: s.color }}>{s.value ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          Loading payroll…
        </div>
      )}

      {!loading && !data?.payroll?.length && (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", background: "white", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
          <UserCheck size={36} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
          <p style={{ fontWeight: 600, fontSize: "14px" }}>No workers found</p>
          <p style={{ fontSize: "12px" }}>Add workers in the Employees section first.</p>
        </div>
      )}

      {!loading && !!data?.payroll?.length && (
        <>
          {/* ── MOBILE: Cards ── */}
          <div className="pay-cards">
            {data.payroll.map(p => (
              <div key={p._id} className="pay-card">
                <div className="pay-card-top">
                  <div className="pay-card-worker">
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: p.netPayable > 0 ? "rgba(16,185,129,0.15)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: p.netPayable > 0 ? "#059669" : "#94a3b8", fontWeight: 700, fontSize: "14px" }}>
                      {p.name?.[0] || "?"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{fmtRupee(p.dailyWage)}/day</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>Net Payable</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: p.netPayable > 0 ? "#059669" : "#94a3b8" }}>{fmtRupee(p.netPayable)}</div>
                  </div>
                </div>

                {/* Attendance stats */}
                <div className="pay-card-stats">
                  {[
                    { val: p.presentDays,  lbl: "Present",  col: "#059669" },
                    { val: p.halfDays,     lbl: "½ Day",    col: "#d97706" },
                    { val: p.overtimeDays, lbl: "Overtime", col: "#4f46e5" },
                    { val: p.absentDays,   lbl: "Absent",   col: "#dc2626" },
                  ].map(s => (
                    <div key={s.lbl} className="pay-card-stat">
                      <div className="pay-card-stat-val" style={{ color: s.col }}>{s.val}</div>
                      <div className="pay-card-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                <div className="pay-card-footer">
                  <div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Gross: </span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1" }}>{fmtRupee(p.grossWage)}</span>
                  </div>
                  {p.totalAdvance > 0 && (
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Advance: </span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#dc2626" }}>−{fmtRupee(p.totalAdvance)}</span>
                    </div>
                  )}
                  {!p.attendanceMarked && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontSize: "11px" }}>
                      <AlertCircle size={12} /> Not marked
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Mobile total bar */}
            <div className="pay-total-bar">
              <div style={{ color: "white", fontWeight: 700, fontSize: "13px" }}>TOTAL ({data.payroll.length} workers)</div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Gross</div>
                  <div style={{ fontWeight: 800, color: "#818cf8", fontSize: "16px" }}>{fmtRupee(data.totalGross)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Advances</div>
                  <div style={{ fontWeight: 800, color: "#f87171", fontSize: "16px" }}>−{fmtRupee(data.totalAdvance)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Net</div>
                  <div style={{ fontWeight: 800, color: "#34d399", fontSize: "16px" }}>{fmtRupee(data.totalNet)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── DESKTOP: Table ── */}
          <div className="pay-table-wrap">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Worker","Rate/Day","Present","½ Day","Overtime","Absent","Eff. Days","Sites","Gross","Advances","Net Payable"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: h === "Worker" ? "left" : "center", fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.payroll.map(p => (
                    <>
                      <tr key={p._id}
                        style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.15s", cursor: p.advanceDetails?.length ? "pointer" : "default" }}
                        onClick={() => p.advanceDetails?.length && setExpanded(expanded === p._id ? null : p._id)}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: p.netPayable > 0 ? "rgba(16,185,129,0.15)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: p.netPayable > 0 ? "#059669" : "#94a3b8", fontWeight: 700, fontSize: "13px" }}>
                              {p.name?.[0] || "?"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{p.name}</div>
                              {!p.attendanceMarked && <div style={{ fontSize: "10px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "3px" }}><AlertCircle size={10} /> Not marked</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ fontWeight: 600, color: "#64748b", fontSize: "13px" }}>{fmtRupee(p.dailyWage)}</span></td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#059669", fontSize: "14px" }}>{p.presentDays}</span></td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#d97706", fontSize: "14px" }}>{p.halfDays}</span></td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#4f46e5", fontSize: "14px" }}>{p.overtimeDays}</span></td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#dc2626", fontSize: "14px" }}>{p.absentDays}</span></td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{p.effectiveDays}</span></td>
                        <td style={{ padding: "14px 16px" }}>
                          {p.uniqueSites?.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {p.uniqueSites.map((site, i) => (
                                <span key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", color: "#475569" }}>{site}</span>
                              ))}
                            </div>
                          ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#6366f1", fontSize: "14px" }}>{fmtRupee(p.grossWage)}</span></td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          {p.totalAdvance > 0 ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700, color: "#dc2626", fontSize: "13px", background: "rgba(239,68,68,0.07)", padding: "3px 10px", borderRadius: "20px" }}>
                              −{fmtRupee(p.totalAdvance)}
                            </span>
                          ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: "20px", fontSize: "14px", fontWeight: 800, background: p.netPayable > 0 ? "rgba(16,185,129,0.12)" : "#f1f5f9", color: p.netPayable > 0 ? "#059669" : "#94a3b8", border: `1px solid ${p.netPayable > 0 ? "rgba(16,185,129,0.3)" : "#e2e8f0"}` }}>
                            {fmtRupee(p.netPayable)}
                          </span>
                        </td>
                      </tr>
                      {expanded === p._id && p.advanceDetails?.length > 0 && (
                        <tr key={`${p._id}-adv`}>
                          <td colSpan={11} style={{ padding: "0 16px 14px 60px", background: "#fffbf5" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", marginBottom: "8px", textTransform: "uppercase" }}>Advance Breakdown</div>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              {p.advanceDetails.map((a, i) => (
                                <div key={i} style={{ background: "white", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "8px 14px", display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#dc2626" }}>−{fmtRupee(a.amount)}</span>
                                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{fmtDate(a.date)}</span>
                                  {a.note && <span style={{ fontSize: "11px", color: "#64748b" }}>{a.note}</span>}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#0f172a" }}>
                    <td style={{ padding: "14px 16px", color: "white", fontWeight: 700, fontSize: "13px" }}>TOTAL ({data.payroll.length} workers)</td>
                    <td colSpan={7} />
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800, color: "#818cf8", fontSize: "15px" }}>{fmtRupee(data.totalGross)}</td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800, color: "#f87171", fontSize: "15px" }}>−{fmtRupee(data.totalAdvance)}</td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ display: "inline-block", padding: "7px 18px", borderRadius: "20px", fontSize: "15px", fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                        {fmtRupee(data.totalNet)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
