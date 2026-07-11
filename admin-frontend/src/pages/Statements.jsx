import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { Download, ChevronDown, User, MapPin, FolderOpen } from "lucide-react";

const token  = () => localStorage.getItem("token");
const hdrs   = () => ({ Authorization: `Bearer ${token()}` });

const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Statements() {
  const [tab, setTab] = useState("employee"); // "employee", "site", "project"
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
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
    if (tab === "employee" && !selectedEmp) return;
    if (tab === "site" && !selectedSite) return;
    if (tab === "project" && !selectedProject) return;

    setLoading(true);
    try {
      let res;
      if (tab === "employee") {
        res = await API.get(`/reports/employee-ledger/${selectedEmp}?year=${year}`, { headers: hdrs() });
      } else if (tab === "site") {
        res = await API.get(`/reports/site-ledger/${selectedSite}?year=${year}`, { headers: hdrs() });
      } else if (tab === "project") {
        res = await API.get(`/reports/project-ledger/${selectedProject}?year=${year}`, { headers: hdrs() });
      }
      setLedgerData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedEmp, selectedSite, selectedProject, year]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <style>{`
        .stmt-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
        .stmt-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
        .stmt-tab { display: flex; alignItems: center; gap: 8px; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
        .stmt-tab.active { background: #0f172a; color: white; }
        .stmt-tab:not(.active) { background: #f8fafc; color: #64748b; }
        .stmt-tab:not(.active):hover { background: #f1f5f9; color: #0f172a; }
        
        .inp-wrap { position: relative; flex: 1; min-width: 200px; }
        .inp { width: 100%; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; appearance: none; }
        .inp:focus { border-color: #6366f1; }
        
        .ledger-table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
        .ledger-table th { background: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        .ledger-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
        .ledger-table tr:hover td { background: #f8fafc; }
        .ledger-table tr:hover td { background: #f8fafc; }
        
        .table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .stmt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        
        @media (max-width: 768px) {
          .stmt-tabs { flex-wrap: wrap; }
          .stmt-tab { flex: 1; justify-content: center; text-align: center; font-size: 13px; padding: 10px; }
          .stmt-header { flex-direction: column; align-items: stretch; gap: 14px; }
          .stmt-header button { width: 100%; justify-content: center; }
          .inp-wrap { min-width: 100%; }
        }
        
        @media print {
          body * { visibility: hidden; }
          .stmt-printable, .stmt-printable * { visibility: visible; }
          .stmt-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="stmt-card">
        <div className="no-print stmt-header">
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Statements / Ledgers</h1>
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
              {/* Header */}
              <div style={{ marginBottom: "30px", borderBottom: "2px solid #0f172a", paddingBottom: "16px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {tab === "employee" && `Statement for ${ledgerData.employee?.name}`}
                  {tab === "site" && `Statement for Site: ${ledgerData.siteName}`}
                  {tab === "project" && `Statement for Project: ${ledgerData.project?.name}`}
                </h2>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", color: "#64748b", fontSize: "14px" }}>
                  <span>Year: <strong>{ledgerData.year}</strong></span>
                  <span>Generated on: {fmtDate(new Date())}</span>
                </div>
              </div>

              {ledgerData.ledger.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No transactions found for {ledgerData.year}.</div>
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
                      {/* Summary Row */}
                      <tr style={{ background: "#f8fafc", fontWeight: 800 }}>
                        <td colSpan={2} style={{ textAlign: "right" }}>Closing Balance:</td>
                        <td colSpan={3} style={{ textAlign: "right", fontSize: "16px" }}>
                          {fmtRupee(ledgerData.ledger[ledgerData.ledger.length - 1].balance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
