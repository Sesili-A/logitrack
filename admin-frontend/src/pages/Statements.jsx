import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { Download, ChevronDown, ChevronUp, User, MapPin, FolderOpen } from "lucide-react";

const token  = () => localStorage.getItem("token");
const hdrs   = () => ({ Authorization: `Bearer ${token()}` });

const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Statements() {
  const [tab, setTab] = useState("employee"); // "employee", "site", "project"
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("all");
  const [showDetails, setShowDetails] = useState(false);
  
  // Data for dropdowns
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);

  // Selected targets
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  // Ledger state
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/employees", { headers: hdrs() }).then(res => setEmployees(res.data)).catch(() => {});
    API.get("/sites", { headers: hdrs() }).then(res => setSites(res.data)).catch(() => {});
    API.get("/projects", { headers: hdrs() }).then(res => setProjects(res.data)).catch(() => {});
  }, []);

  const fetchLedger = useCallback(async () => {
    setLedgerData(null);
    setShowDetails(false);
    if (tab === "employee" && !selectedEmp) return;
    if (tab === "site" && !selectedSite) return;
    if (tab === "project" && !selectedProject) return;

    setLoading(true);
    try {
      let res;
      if (tab === "employee") {
        res = await API.get(`/reports/employee-ledger/${encodeURIComponent(selectedEmp)}?year=${year}&month=${month}`, { headers: hdrs() });
      } else if (tab === "site") {
        res = await API.get(`/reports/site-ledger/${encodeURIComponent(selectedSite)}?year=${year}&month=${month}`, { headers: hdrs() });
      } else if (tab === "project") {
        res = await API.get(`/reports/project-ledger/${encodeURIComponent(selectedProject)}?year=${year}&month=${month}`, { headers: hdrs() });
      }
      setLedgerData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedEmp, selectedSite, selectedProject, year, month]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <style>{`
        .stmt-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
        
        /* Swipeable tabs for mobile */
        .stmt-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .stmt-tabs::-webkit-scrollbar { display: none; }
        .stmt-tab { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
        .stmt-tab.active { background: #0f172a; color: white; }
        .stmt-tab:not(.active) { background: #f8fafc; color: #64748b; }
        .stmt-tab:not(.active):hover { background: #f1f5f9; color: #0f172a; }
        
        .inp-wrap { position: relative; flex: 1; min-width: 140px; }
        .inp { width: 100%; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; appearance: none; }
        .inp:focus { border-color: #6366f1; }
        
        .ledger-table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
        .ledger-table th { background: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
        .ledger-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
        .ledger-table tr:hover td { background: #f8fafc; }
        
        .table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        
        .stmt-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 20px; }
        
        @media (max-width: 600px) {
          .stmt-header { flex-direction: column; align-items: stretch; }
          .stmt-header h1 { font-size: 20px !important; text-align: center; }
          .stmt-header button { width: 100%; justify-content: center; }
          .inp-wrap { min-width: 100%; }
        }
        
        @media print {
          body * { visibility: hidden; }
          .stmt-printable, .stmt-printable * { visibility: visible; }
          .stmt-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .ledger-details { display: block !important; }
          .summary-card { break-inside: avoid; }
        }
        .ledger-details { display: none; }
        .ledger-details.expanded { display: block; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="stmt-card">
        <div className="no-print stmt-header">
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Statements</h1>
          <button onClick={handlePrint} disabled={!ledgerData} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "#f8fafc",
            border: "1px solid #e2e8f0", borderRadius: "10px", color: "#0f172a", fontSize: "14px", fontWeight: 600, cursor: ledgerData ? "pointer" : "not-allowed", opacity: ledgerData ? 1 : 0.5
          }}>
            <Download size={16} /> Print Statement
          </button>
        </div>

        <div className="no-print stmt-tabs">
          <div className={`stmt-tab ${tab === "employee" ? "active" : ""}`} onClick={() => setTab("employee")}>
            <User size={16} /> Employee Ledger
          </div>
          <div className={`stmt-tab ${tab === "site" ? "active" : ""}`} onClick={() => setTab("site")}>
            <MapPin size={16} /> Site Ledger
          </div>
          <div className={`stmt-tab ${tab === "project" ? "active" : ""}`} onClick={() => setTab("project")}>
            <FolderOpen size={16} /> Project Ledger
          </div>
        </div>

        <div className="no-print" style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "30px" }}>
          {tab === "employee" && (
            <div className="inp-wrap">
              <select className="inp" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                <option value="">Select Employee...</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          )}
          {tab === "site" && (
            <div className="inp-wrap">
              <select className="inp" value={selectedSite} onChange={e => setSelectedSite(e.target.value)}>
                <option value="">Select Site...</option>
                {sites.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
              <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          )}
          {tab === "project" && (
            <div className="inp-wrap">
              <select className="inp" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                <option value="">Select Project...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.siteName})</option>)}
              </select>
              <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          )}

          <div className="inp-wrap" style={{ maxWidth: "150px" }}>
            <select className="inp" value={month} onChange={e => setMonth(e.target.value)}>
              <option value="all">All Months</option>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>

          <div className="inp-wrap" style={{ maxWidth: "150px" }}>
            <select className="inp" value={year} onChange={e => setYear(e.target.value)}>
              {[0,1,2,3,4].map(y => {
                const yr = new Date().getFullYear() - y;
                return <option key={yr} value={yr}>{yr}</option>;
              })}
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="stmt-printable">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading statement...</div>
          ) : !ledgerData ? (
            <div className="no-print" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Select criteria to view statement</div>
          ) : (
            <>
              {/* Summary Card */}
              <div 
                className="summary-card"
                onClick={() => setShowDetails(!showDetails)}
                style={{ 
                  background: "linear-gradient(135deg, #1e293b, #0f172a)", 
                  borderRadius: "16px", 
                  padding: "24px", 
                  color: "white", 
                  marginBottom: "24px",
                  cursor: "pointer",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.15)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 30px rgba(15,23,42,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(15,23,42,0.15)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "white" }}>
                      {tab === "employee" && ledgerData.employee?.name}
                      {tab === "site" && ledgerData.siteName}
                      {tab === "project" && ledgerData.project?.name}
                    </h2>
                    <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.1)", borderRadius: "10px" }}>
                        {tab === "employee" && "Employee"}
                        {tab === "site" && "Site"}
                        {tab === "project" && "Project"}
                      </span>
                      {month !== "all" && <span>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month-1]}</span>}
                      <span>{ledgerData.year}</span>
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: ledgerData.summary?.closingBalance < 0 ? "#f87171" : "#34d399" }}>
                      {fmtRupee(ledgerData.summary?.closingBalance)}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Closing Balance</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
                  {tab === "employee" && (
                    <>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>DAYS WORKED</div>
                        <div style={{ fontSize: "16px", fontWeight: 600 }}>{ledgerData.summary?.effectiveDays}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>GROSS SALARY</div>
                        <div style={{ fontSize: "16px", fontWeight: 600 }}>{fmtRupee(ledgerData.summary?.grossSalary)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>TOTAL ADVANCE</div>
                        <div style={{ fontSize: "16px", fontWeight: 600 }}>{fmtRupee(ledgerData.summary?.totalAdvances)}</div>
                      </div>
                    </>
                  )}
                  {tab === "site" && (
                    <>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>TOTAL WAGES</div>
                        <div style={{ fontSize: "16px", fontWeight: 600 }}>{fmtRupee(ledgerData.summary?.totalWages)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>TOTAL ADVANCE</div>
                        <div style={{ fontSize: "16px", fontWeight: 600 }}>{fmtRupee(ledgerData.summary?.totalAdvances)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>PROJECT INCOME</div>
                        <div style={{ fontSize: "16px", fontWeight: 600 }}>{fmtRupee(ledgerData.summary?.totalIncome)}</div>
                      </div>
                    </>
                  )}
                  {tab === "project" && (
                    <>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>TOTAL INCOME</div>
                        <div style={{ fontSize: "16px", fontWeight: 600 }}>{fmtRupee(ledgerData.summary?.totalIncome)}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="no-print" style={{ marginTop: "20px", display: "flex", justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                     {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                     {showDetails ? "Hide Details" : "View Detailed Ledger"}
                   </div>
                </div>
              </div>

              <div className={`ledger-details ${showDetails ? "expanded" : ""}`}>
                {ledgerData.ledger.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No transactions found for the selected period.</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th style={{ width: "120px" }}>Date</th>
                          <th>Particulars</th>
                          <th style={{ textAlign: "right" }}>Debit (-)</th>
                          <th style={{ textAlign: "right" }}>Credit (+)</th>
                          <th style={{ textAlign: "right" }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerData.ledger.map((entry, idx) => (
                          <tr key={idx}>
                            <td>{fmtDate(entry.date)}</td>
                            <td>{entry.particulars}</td>
                            <td style={{ textAlign: "right", color: entry.debit > 0 ? "#dc2626" : "inherit" }}>
                              {entry.debit > 0 ? fmtRupee(entry.debit) : ""}
                            </td>
                            <td style={{ textAlign: "right", color: entry.credit > 0 ? "#10b981" : "inherit" }}>
                              {entry.credit > 0 ? fmtRupee(entry.credit) : ""}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>
                              {fmtRupee(entry.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
