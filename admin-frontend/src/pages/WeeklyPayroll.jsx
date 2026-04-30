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
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function toYMD(d) { return d.toISOString().split("T")[0]; }

export default function WeeklyPayroll() {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState(null); // employee ID for advance detail

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

  const prevWeek = () => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7);
    if (d <= new Date()) setWeekStart(d);
  };
  const isCurrentWeek = toYMD(weekStart) === toYMD(getMonday());

  // Export CSV
  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Worker", "Phone", "Daily Wage", "Days Present", "Half Days", "Overtime", "Effective Days", "Gross Wage", "Advances", "Net Payable"],
      ...data.payroll.map(p => [
        p.name, p.phone || "", `₹${p.dailyWage}`,
        p.presentDays, p.halfDays, p.overtimeDays, p.effectiveDays,
        `₹${p.grossWage}`, `₹${p.totalAdvance}`, `₹${p.netPayable}`,
      ]),
      [],
      ["", "", "", "", "", "", "TOTALS", `₹${data.totalGross}`, `₹${data.totalAdvance}`, `₹${data.totalNet}`],
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `payroll_${toYMD(weekStart)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (p) => {
    const rate = p.attendanceMarked
      ? Math.round((p.effectiveDays / 7) * 100)
      : null;
    if (!p.attendanceMarked)
      return <span style={{ fontSize: "11px", color: "#94a3b8" }}>No records</span>;
    return null;
  };

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "26px" }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Week nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "0", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
            <button onClick={prevWeek} style={{
              padding: "8px 14px", border: "none", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", borderRight: "1px solid #e2e8f0",
            }}>
              <ChevronLeft size={17} color="#475569" />
            </button>
            <button onClick={() => setWeekStart(getMonday())} style={{
              padding: "8px 14px", border: "none", background: "transparent",
              cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "#475569",
            }}>
              This Week
            </button>
            <button onClick={nextWeek} disabled={isCurrentWeek} style={{
              padding: "8px 14px", border: "none", background: "transparent",
              cursor: isCurrentWeek ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", borderLeft: "1px solid #e2e8f0",
              opacity: isCurrentWeek ? 0.4 : 1,
            }}>
              <ChevronRight size={17} color="#475569" />
            </button>
          </div>

          <button onClick={exportCSV} style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "9px 16px", background: "linear-gradient(135deg,#10b981,#059669)",
            border: "none", borderRadius: "10px", color: "white",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
          }}>
            <Download size={15} /> Export CSV
          </button>

          <button onClick={() => window.print()} style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "9px 16px", background: "#0f172a",
            border: "none", borderRadius: "10px", color: "white",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { icon: TrendingUp, label: "Gross Wages",  value: fmtRupee(data?.totalGross),   sub: "Days worked × daily rate", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
          { icon: Wallet,     label: "Total Advances", value: fmtRupee(data?.totalAdvance), sub: "Deducted from wages",        color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { icon: IndianRupee,label: "Net Payable",  value: fmtRupee(data?.totalNet),     sub: "Gross − Advances",           color: "#10b981", bg: "rgba(16,185,129,0.1)" },
        ].map(s => (
          <div key={s.label} style={{
            background: "white", borderRadius: "14px", padding: "22px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "44px", height: "44px", background: s.bg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{s.label}</div>
                <div style={{ fontSize: "11px", color: "#cbd5e1" }}>{s.sub}</div>
              </div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: s.color }}>{s.value ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* Payroll table */}
      <div style={{
        background: "white", borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
            <div style={{
              width: "36px", height: "36px", border: "3px solid #e2e8f0",
              borderTopColor: "#6366f1", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 14px",
            }} />
            Loading payroll…
          </div>
        ) : !data?.payroll?.length ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
            <UserCheck size={36} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
            <p style={{ fontWeight: 600, fontSize: "14px" }}>No workers found</p>
            <p style={{ fontSize: "12px" }}>Add workers in the Employees section first.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Worker", "Rate/Day", "Present", "½ Day", "Overtime", "Absent", "Effective Days", "Sites Worked", "Gross Wage", "Advances", "Net Payable"].map(h => (
                  <th key={h} style={{
                    padding: "12px 18px", textAlign: h === "Worker" ? "left" : "center",
                    fontSize: "10px", fontWeight: 700, color: "#94a3b8",
                    letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.payroll.map(p => (
                <>
                  <tr key={p._id}
                    style={{
                      borderTop: "1px solid #f1f5f9", transition: "background 0.15s",
                      cursor: p.advanceDetails?.length ? "pointer" : "default",
                    }}
                    onClick={() => p.advanceDetails?.length && setExpanded(expanded === p._id ? null : p._id)}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Worker */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: p.netPayable > 0 ? "rgba(16,185,129,0.15)" : "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: p.netPayable > 0 ? "#059669" : "#94a3b8",
                          fontWeight: 700, fontSize: "13px",
                        }}>
                          {p.name?.[0] || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{p.name}</div>
                          {p.phone && <div style={{ fontSize: "11px", color: "#94a3b8" }}>{p.phone}</div>}
                          {!p.attendanceMarked && (
                            <div style={{ fontSize: "10px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "3px" }}>
                              <AlertCircle size={10} /> Not marked this week
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: "#64748b", fontSize: "13px" }}>{fmtRupee(p.dailyWage)}</span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "#059669", fontSize: "14px" }}>{p.presentDays}</span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "#d97706", fontSize: "14px" }}>{p.halfDays}</span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "#4f46e5", fontSize: "14px" }}>{p.overtimeDays}</span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "#dc2626", fontSize: "14px" }}>{p.absentDays}</span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{p.effectiveDays}</span>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "left" }}>
                      {p.uniqueSites?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {p.uniqueSites.map((site, i) => (
                            <span key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", color: "#475569" }}>
                              {site}
                            </span>
                          ))}
                        </div>
                      ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "center" }}>

                      <span style={{ fontWeight: 700, color: "#6366f1", fontSize: "14px" }}>{fmtRupee(p.grossWage)}</span>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      {p.totalAdvance > 0 ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontWeight: 700, color: "#dc2626", fontSize: "14px",
                          background: "rgba(239,68,68,0.07)", padding: "3px 10px", borderRadius: "20px",
                        }}>
                          −{fmtRupee(p.totalAdvance)}
                        </span>
                      ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>

                    {/* Net Payable */}
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "6px 16px", borderRadius: "20px",
                        fontSize: "15px", fontWeight: 800,
                        background: p.netPayable > 0 ? "rgba(16,185,129,0.12)" : "#f1f5f9",
                        color: p.netPayable > 0 ? "#059669" : "#94a3b8",
                        border: `1px solid ${p.netPayable > 0 ? "rgba(16,185,129,0.3)" : "#e2e8f0"}`,
                      }}>
                        {fmtRupee(p.netPayable)}
                      </span>
                    </td>
                  </tr>

                  {/* Advance detail row */}
                  {expanded === p._id && p.advanceDetails?.length > 0 && (
                    <tr key={`${p._id}-adv`}>
                      <td colSpan={10} style={{ padding: "0 18px 14px 64px", background: "#fffbf5" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Advance Breakdown
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {p.advanceDetails.map((a, i) => (
                            <div key={i} style={{
                              background: "white", border: "1px solid rgba(245,158,11,0.3)",
                              borderRadius: "10px", padding: "8px 14px",
                              display: "flex", flexDirection: "column", gap: "2px",
                            }}>
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

            {/* Footer totals */}
            <tfoot>
              <tr style={{ background: "#0f172a" }}>
                <td style={{ padding: "14px 18px", color: "white", fontWeight: 700, fontSize: "13px" }}>
                  TOTAL ({data.payroll.length} workers)
                </td>
                <td colSpan={6} />
                <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: 800, color: "#818cf8", fontSize: "16px" }}>
                  {fmtRupee(data.totalGross)}
                </td>
                <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: 800, color: "#f87171", fontSize: "16px" }}>
                  −{fmtRupee(data.totalAdvance)}
                </td>
                <td style={{ padding: "14px 18px", textAlign: "center" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "8px 20px", borderRadius: "20px",
                    fontSize: "16px", fontWeight: 800,
                    background: "rgba(16,185,129,0.15)", color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.3)",
                  }}>
                    {fmtRupee(data.totalNet)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          aside, header, button { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </Layout>
  );
}
