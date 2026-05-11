import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import {
  MapPin, Plus, Trash2, ChevronDown, ChevronUp,
  Calendar, IndianRupee, CheckCircle, PauseCircle, X, StickyNote,
} from "lucide-react";

const hdrs     = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n  => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate  = d  => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "Ongoing";
const toYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const todayStr = () => toYMD(new Date());

const STATUS_COLORS = {
  active:    { color:"#059669", bg:"rgba(16,185,129,0.1)"  },
  paused:    { color:"#d97706", bg:"rgba(245,158,11,0.1)"  },
  completed: { color:"#6366f1", bg:"rgba(99,102,241,0.1)"  },
};

/* ─── Small reusable modal ─────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000,
        display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ background:"white", borderRadius:"20px", width:"100%", maxWidth:"400px",
          maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"18px 22px", borderBottom:"1px solid #f1f5f9" }}>
          <h2 style={{ fontWeight:800, fontSize:"16px", color:"#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ border:"none", background:"#f1f5f9", borderRadius:"8px",
              width:"30px", height:"30px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding:"18px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Form helpers ──────────────────────────────────────────────────────────── */
const FL = ({ children }) => (
  <label style={{ fontSize:"11px", fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
      letterSpacing:"0.04em", display:"block", marginBottom:"5px" }}>{children}</label>
);
const FI = (props) => (
  <input {...props} style={{ width:"100%", padding:"10px 13px", border:"1px solid #e2e8f0",
      borderRadius:"10px", fontSize:"13px", color:"#0f172a", outline:"none",
      boxSizing:"border-box", fontFamily:"inherit", ...props.style }} />
);
const FSel = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange} style={{ width:"100%", padding:"10px 13px",
      border:"1px solid #e2e8f0", borderRadius:"10px", fontSize:"13px", color:"#0f172a",
      outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}>
    {children}
  </select>
);

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function Projects() {
  const [projects,   setProjects]   = useState([]);
  const [sites,      setSites]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState({});
  const [detail,     setDetail]     = useState({});   // { id: { expenses, totalReceived } }
  const [detailLoad, setDetailLoad] = useState({});
  const [showNew,    setShowNew]    = useState(false);
  const [showPay,    setShowPay]    = useState(null); // projectId
  const [toast,      setToast]      = useState(null);

  const [form,    setForm]    = useState({ siteName:"", description:"", startDate:todayStr(), endDate:"", status:"active" });
  const [payForm, setPayForm] = useState({ amount:"", note:"", date:todayStr() });

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  /* fetch */
  useEffect(() => {
    load();
    API.get("/sites", { headers:hdrs() }).then(r => setSites(r.data)).catch(()=>{});
  }, []);

  const load = async () => {
    setLoading(true);
    try { const r = await API.get("/projects", { headers:hdrs() }); setProjects(r.data); }
    catch { showToast("Failed to load","error"); }
    finally { setLoading(false); }
  };

  const loadDetail = async (id) => {
    setDetailLoad(p => ({...p,[id]:true}));
    try {
      const r = await API.get(`/projects/${id}`, { headers:hdrs() });
      setDetail(p => ({...p,[id]: r.data}));
    } catch { showToast("Failed to load detail","error"); }
    finally { setDetailLoad(p => ({...p,[id]:false})); }
  };

  const toggle = (id) => {
    const next = !expanded[id];
    setExpanded(p => ({...p,[id]:next}));
    if (next && !detail[id]) loadDetail(id);
  };

  /* CRUD */
  const createProject = async () => {
    if (!form.siteName || !form.startDate) return showToast("Site and start date required","error");
    try {
      await API.post("/projects", { ...form, endDate: form.endDate || null }, { headers:hdrs() });
      setShowNew(false);
      setForm({ siteName:"", description:"", startDate:todayStr(), endDate:"", status:"active" });
      load();
      showToast("Project created!");
    } catch { showToast("Failed to create","error"); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project and all its payment notes?")) return;
    try { await API.delete(`/projects/${id}`, { headers:hdrs() }); load(); showToast("Deleted"); }
    catch { showToast("Failed to delete","error"); }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/projects/${id}`, { status }, { headers:hdrs() });
      setProjects(p => p.map(x => x._id===id ? {...x,status} : x));
    } catch { showToast("Failed","error"); }
  };

  const addPayment = async () => {
    if (!payForm.amount || !payForm.date) return showToast("Amount and date required","error");
    try {
      await API.post(`/projects/${showPay}/expenses`,
        { amount:Number(payForm.amount), note:payForm.note, date:payForm.date },
        { headers:hdrs() });
      const id = showPay;
      setShowPay(null);
      setPayForm({ amount:"", note:"", date:todayStr() });
      loadDetail(id);          // refresh detail only
      showToast("Payment saved!");
    } catch { showToast("Failed to save","error"); }
  };

  const deletePayment = async (projId, expId) => {
    try {
      await API.delete(`/projects/${projId}/expenses/${expId}`, { headers:hdrs() });
      loadDetail(projId);
      showToast("Removed");
    } catch { showToast("Failed","error"); }
  };

  /* colour palette for cards */
  const colours = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#0ea5e9","#ec4899"];

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <Layout>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .pc { background:white; border:1px solid #f1f5f9; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:12px; }
        .ph { display:flex; align-items:center; gap:14px; padding:16px 18px; cursor:pointer; transition:background 0.15s; }
        .ph:hover { background:#fafbfc; }
        .pd { padding:4px 18px 18px; border-top:1px solid #f1f5f9; }
        .pay-row { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:8px; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", gap:"12px", flexWrap:"wrap" }}>
        <div>
          <h1 style={{ fontSize:"22px", fontWeight:800, color:"#0f172a", marginBottom:"3px" }}>Projects</h1>
          <p style={{ color:"#64748b", fontSize:"13px" }}>Track site projects and log payments received</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ display:"flex", alignItems:"center", gap:"7px",
            padding:"10px 18px", background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white",
            border:"none", borderRadius:"11px", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding:"60px", textAlign:"center", color:"#94a3b8" }}>
          <div style={{ width:"34px", height:"34px", border:"3px solid #e2e8f0", borderTopColor:"#6366f1",
              borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          Loading…
        </div>
      ) : projects.length === 0 ? (
        <div style={{ padding:"60px", textAlign:"center", background:"white", borderRadius:"16px", border:"1px solid #f1f5f9" }}>
          <MapPin size={40} color="#cbd5e1" style={{ margin:"0 auto 12px" }} />
          <h3 style={{ color:"#334155", marginBottom:"6px" }}>No projects yet</h3>
          <p style={{ color:"#64748b", fontSize:"14px" }}>Create a project to track a site and log payments received over time.</p>
        </div>
      ) : projects.map((proj, idx) => {
        const sc     = STATUS_COLORS[proj.status] || STATUS_COLORS.active;
        const col    = colours[idx % colours.length];
        const d      = detail[proj._id];
        const isOpen = expanded[proj._id];

        return (
          <div key={proj._id} className="pc">
            {/* Card header — click to expand */}
            <div className="ph" onClick={() => toggle(proj._id)}>
              {/* Icon */}
              <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:`${col}18`,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <MapPin size={20} color={col} />
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, fontSize:"15px", color:"#0f172a" }}>{proj.siteName}</span>
                  <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"20px",
                      background:sc.bg, color:sc.color, fontWeight:700 }}>{proj.status}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"3px",
                    fontSize:"12px", color:"#64748b", flexWrap:"wrap" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                    <Calendar size={11} />{fmtDate(proj.startDate)} → {fmtDate(proj.endDate)}
                  </span>
                  {proj.description && <span style={{ color:"#94a3b8" }}>{proj.description}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
                <button onClick={e => { e.stopPropagation(); deleteProject(proj._id); }}
                  style={{ border:"none", background:"rgba(239,68,68,0.08)", borderRadius:"8px",
                    width:"30px", height:"30px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Trash2 size={13} color="#ef4444" />
                </button>
                {isOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
              </div>
            </div>

            {/* Expanded body */}
            {isOpen && (
              <div className="pd">
                {detailLoad[proj._id] ? (
                  <div style={{ padding:"24px", textAlign:"center", color:"#94a3b8" }}>Loading…</div>
                ) : d ? (
                  <>
                    {/* Status switcher */}
                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", margin:"12px 0 14px" }}>
                      <span style={{ fontSize:"12px", color:"#94a3b8", alignSelf:"center" }}>Status:</span>
                      {["active","paused","completed"].map(s => (
                        <button key={s} onClick={() => updateStatus(proj._id, s)}
                          style={{ padding:"4px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:700,
                            cursor:"pointer", transition:"all 0.15s",
                            background: proj.status===s ? STATUS_COLORS[s].bg : "transparent",
                            color:      proj.status===s ? STATUS_COLORS[s].color : "#94a3b8",
                            border: `1px solid ${proj.status===s ? STATUS_COLORS[s].color+"55" : "#e2e8f0"}` }}>
                          {s[0].toUpperCase()+s.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Payment Notes section */}
                    <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:"14px" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                          <StickyNote size={14} color="#6366f1" />
                          <span style={{ fontSize:"12px", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                            Payments Received
                            {d.expenses.length > 0 && <span style={{ marginLeft:"6px", fontWeight:800, color:"#6366f1" }}>({d.expenses.length})</span>}
                          </span>
                        </div>
                        <button onClick={() => { setShowPay(proj._id); setPayForm({ amount:"", note:"", date:todayStr() }); }}
                          style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px",
                            background:"rgba(99,102,241,0.1)", color:"#6366f1", border:"none",
                            borderRadius:"8px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                          <Plus size={12} /> Add
                        </button>
                      </div>

                      {d.expenses.length === 0 ? (
                        <div style={{ padding:"20px", textAlign:"center", background:"#f8fafc",
                            borderRadius:"10px", color:"#94a3b8", fontSize:"13px" }}>
                          No payments logged yet — tap <strong>Add</strong> to record an amount received.
                        </div>
                      ) : (
                        <>
                          {d.expenses.map(e => (
                            <div key={e._id} className="pay-row">
                              <div style={{ width:"34px", height:"34px", borderRadius:"9px",
                                  background:"rgba(99,102,241,0.1)", display:"flex",
                                  alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <IndianRupee size={15} color="#6366f1" />
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:800, fontSize:"15px", color:"#0f172a" }}>
                                  {fmtRupee(e.amount)}
                                </div>
                                <div style={{ fontSize:"11px", color:"#94a3b8", marginTop:"1px" }}>
                                  {fmtDate(e.date)}{e.note ? ` · ${e.note}` : ""}
                                </div>
                              </div>
                              <button onClick={() => deletePayment(proj._id, e._id)}
                                style={{ border:"none", background:"transparent", cursor:"pointer", padding:"4px", flexShrink:0 }}>
                                <Trash2 size={13} color="#ef4444" />
                              </button>
                            </div>
                          ))}

                          {/* Total */}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                              marginTop:"10px", padding:"10px 14px", background:"rgba(99,102,241,0.06)",
                              borderRadius:"10px", border:"1px solid rgba(99,102,241,0.15)" }}>
                            <span style={{ fontSize:"13px", color:"#64748b", fontWeight:600 }}>Total received</span>
                            <span style={{ fontSize:"17px", fontWeight:800, color:"#6366f1" }}>{fmtRupee(d.totalReceived)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        );
      })}

      {/* ── New Project Modal ─────────────────────────────────────────────── */}
      {showNew && (
        <Modal title="New Project" onClose={() => setShowNew(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div>
              <FL>Site *</FL>
              <FSel value={form.siteName} onChange={e => setForm(p => ({...p, siteName:e.target.value}))}>
                <option value="">Select site…</option>
                {sites.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </FSel>
            </div>

            <div>
              <FL>Description (optional)</FL>
              <FI type="text" placeholder="Short note" value={form.description}
                onChange={e => setForm(p => ({...p, description:e.target.value}))} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div>
                <FL>Start Date *</FL>
                <FI type="date" value={form.startDate}
                  onChange={e => setForm(p => ({...p, startDate:e.target.value}))} />
              </div>
              <div>
                <FL>End Date</FL>
                <FI type="date" value={form.endDate}
                  onChange={e => setForm(p => ({...p, endDate:e.target.value}))} />
              </div>
            </div>

            <div>
              <FL>Status</FL>
              <FSel value={form.status} onChange={e => setForm(p => ({...p, status:e.target.value}))}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </FSel>
            </div>

            <button onClick={createProject} style={{ width:"100%", padding:"13px",
                background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white",
                border:"none", borderRadius:"12px", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
              Create Project
            </button>
          </div>
        </Modal>
      )}

      {/* ── Log Payment Modal ─────────────────────────────────────────────── */}
      {showPay && (
        <Modal title="Log Payment Received" onClose={() => setShowPay(null)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div>
              <FL>Amount Received ₹ *</FL>
              <FI type="number" min="0" placeholder="e.g. 50000" value={payForm.amount}
                onChange={e => setPayForm(p => ({...p, amount:e.target.value}))}
                style={{ fontSize:"18px", fontWeight:700 }} />
            </div>
            <div>
              <FL>Date *</FL>
              <FI type="date" value={payForm.date}
                onChange={e => setPayForm(p => ({...p, date:e.target.value}))} />
            </div>
            <div>
              <FL>Note (optional)</FL>
              <FI type="text" placeholder="e.g. Advance for April, Final payment…" value={payForm.note}
                onChange={e => setPayForm(p => ({...p, note:e.target.value}))} />
            </div>
            <button onClick={addPayment} style={{ width:"100%", padding:"13px",
                background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white",
                border:"none", borderRadius:"12px", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
              Save Payment Note
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"80px", left:"50%", transform:"translateX(-50%)", zIndex:999,
            background:"#0f172a", color:"white", padding:"11px 20px", borderRadius:"12px",
            fontSize:"13px", fontWeight:500, display:"flex", alignItems:"center", gap:"10px",
            boxShadow:"0 20px 40px rgba(0,0,0,0.3)",
            borderLeft:`4px solid ${toast.type==="success"?"#10b981":"#ef4444"}`, whiteSpace:"nowrap" }}>
          {toast.type==="success" ? <CheckCircle size={14} color="#10b981" /> : <X size={14} color="#ef4444" />}
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}
