import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { MapPin, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import API from "../services/api";

export default function Sites() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState("");

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await API.get("/attendance/payroll", { headers: hdrs });
      setPayroll(res.data.payroll || []);
      setWeekStart(res.data.weekStart);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Calculate Site-wise costs
  const siteCosts = {};
  let totalCost = 0;

  payroll.forEach(emp => {
    if (!emp.siteDays) return;
    emp.siteDays.forEach(day => {
      let dailyCost = emp.dailyWage || 0;
      if (day.status === "Half-Day") dailyCost *= 0.5;
      if (day.status === "Overtime") dailyCost *= 1.5;

      const siteName = day.site || "Unassigned";
      if (!siteCosts[siteName]) {
        siteCosts[siteName] = 0;
      }
      siteCosts[siteName] += dailyCost;
      totalCost += dailyCost;
    });
  });

  const siteCostArray = Object.keys(siteCosts).map(site => ({
    site,
    cost: siteCosts[site]
  })).sort((a, b) => b.cost - a.cost);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Site Wise Payments</h1>
        <p className="page-subtitle">Payroll distribution across all active sites</p>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <Calendar size={18} color="#64748b" />
        <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
          Week of: {weekStart ? new Date(weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Current Week"}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading site data...</div>
      ) : siteCostArray.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <MapPin size={40} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
          <h3 style={{ margin: "0 0 5px", color: "#334155" }}>No Sites Active</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>There is no attendance marked for any sites this week.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "15px", paddingBottom: "20px" }}>
          {/* Total Summary Card */}
          <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "20px", borderRadius: "12px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
            <div>
              <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "4px" }}>Total Site Expenses</div>
              <div style={{ fontSize: "28px", fontWeight: 700 }}>₹{totalCost.toLocaleString("en-IN")}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "50%" }}>
              <TrendingUp size={24} color="#38bdf8" />
            </div>
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#334155", margin: "10px 0 5px" }}>Site Breakdown</h3>

          {siteCostArray.map((s, idx) => (
            <div key={idx} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <MapPin size={20} color="#6366f1" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>{s.site}</div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                  {((s.cost / totalCost) * 100).toFixed(1)}% of total budget
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                  ₹{s.cost.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
