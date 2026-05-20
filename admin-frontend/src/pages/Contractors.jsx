import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { 
  Briefcase, Plus, Edit2, Trash2, ChevronDown, ChevronUp, 
  Search, X, Check, RefreshCw, AlertCircle, Sparkles
} from "lucide-react";
import API from "../services/api";

const SAMPLE_TEMPLATES = [
  {
    title: "Carpenter",
    members: [
      { working: "Carpenter", salary: 800 },
      { working: "Helper", salary: 500 }
    ]
  },
  {
    title: "Bar Bender",
    members: [
      { working: "Main", salary: 850 },
      { working: "Helper", salary: 500 }
    ]
  },
  {
    title: "Painter",
    members: [
      { working: "Putty Painter", salary: 750 },
      { working: "Helper", salary: 450 }
    ]
  },
  {
    title: "Wood Polish",
    members: [
      { working: "Polisher", salary: 800 },
      { working: "Helper", salary: 450 }
    ]
  },
  {
    title: "Tiles",
    members: [
      { working: "Tiles Mason", salary: 900 },
      { working: "Helper", salary: 550 }
    ]
  },
  {
    title: "Electrician",
    members: [
      { working: "Electrician", salary: 850 },
      { working: "Helper", salary: 500 }
    ]
  },
  {
    title: "Plumber",
    members: [
      { working: "Plumber", salary: 850 },
      { working: "Helper", salary: 500 }
    ]
  },
  {
    title: "False Ceiling work",
    members: [
      { working: "Ceiling Technician", salary: 800 },
      { working: "Helper", salary: 450 }
    ]
  },
  {
    title: "Interior Contractor",
    members: [
      { working: "Supervisor", salary: 1200 },
      { working: "Skilled Interior Worker", salary: 950 }
    ]
  }
];

export default function Contractors() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCards, setExpandedCards] = useState({});
  const [toast, setToast] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [editingId, setEditingId] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formMembers, setFormMembers] = useState([{ working: "", salary: "" }]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContractors();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await API.get("/contractors", { headers: hdrs });
      setContractors(res.data || []);
      
      // Auto expand first two contractors if they exist
      if (res.data && res.data.length > 0) {
        const initialExpanded = {};
        res.data.slice(0, 2).forEach(c => {
          initialExpanded[c._id] = true;
        });
        setExpandedCards(initialExpanded);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch contractor tasks", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    setLoading(true);
    try {
      const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      let count = 0;
      for (const t of SAMPLE_TEMPLATES) {
        // Double check it doesn't already exist to prevent duplicate seedings
        const alreadyExists = contractors.some(c => c.title.toLowerCase() === t.title.toLowerCase());
        if (!alreadyExists) {
          await API.post("/contractors", t, { headers: hdrs });
          count++;
        }
      }
      showToast(`Successfully seeded ${count} sample templates!`, "success");
      fetchContractors();
    } catch (err) {
      console.error(err);
      showToast("Error while seeding templates", "danger");
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalType("add");
    setEditingId(null);
    setFormTitle("");
    setFormMembers([{ working: "", salary: "" }]);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setModalType("edit");
    setEditingId(c._id);
    setFormTitle(c.title);
    setFormMembers(c.members.map(m => ({ working: m.working, salary: m.salary })));
    setFormError("");
    setModalOpen(true);
  };

  const handleAddMemberRow = () => {
    setFormMembers([...formMembers, { working: "", salary: "" }]);
  };

  const handleRemoveMemberRow = (idx) => {
    if (formMembers.length === 1) {
      setFormMembers([{ working: "", salary: "" }]);
    } else {
      setFormMembers(formMembers.filter((_, i) => i !== idx));
    }
  };

  const handleMemberChange = (idx, field, value) => {
    const updated = [...formMembers];
    updated[idx][field] = value;
    setFormMembers(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Task Title is required");
      return;
    }

    const filteredMembers = formMembers.filter(m => m.working.trim());
    if (filteredMembers.length === 0) {
      setFormError("At least one member role / designation must be added");
      return;
    }

    for (const m of filteredMembers) {
      if (!m.salary || isNaN(m.salary) || Number(m.salary) < 0) {
        setFormError(`Please enter a valid salary for role: ${m.working}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const payload = {
        title: formTitle,
        members: filteredMembers.map(m => ({ working: m.working, salary: Number(m.salary) }))
      };

      if (modalType === "add") {
        await API.post("/contractors", payload, { headers: hdrs });
        showToast("Contractor task created successfully!");
      } else {
        await API.put(`/contractors/${editingId}`, payload, { headers: hdrs });
        showToast("Contractor task updated successfully!");
      }
      setModalOpen(false);
      fetchContractors();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.msg || "Server error while saving task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the "${title}" task?`)) return;

    try {
      const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      await API.delete(`/contractors/${id}`, { headers: hdrs });
      showToast("Contractor task deleted", "success");
      fetchContractors();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete task", "danger");
    }
  };

  const toggleExpandCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredContractors = contractors.filter(c => {
    const titleMatch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const memberMatch = c.members.some(m => m.working.toLowerCase().includes(searchQuery.toLowerCase()));
    return titleMatch || memberMatch;
  });

  return (
    <Layout>
      <style>{`
        .contractors-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        
        .premium-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white; font-weight: 600; font-size: 13px;
          padding: 10px 18px; border-radius: var(--radius-sm);
          border: none; cursor: pointer; transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(245,143,124,0.35);
        }
        .premium-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(245,143,124,0.45);
        }
        .premium-btn:active { transform: translateY(0); }

        .outline-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; color: var(--text-primary); font-weight: 500; font-size: 13px;
          padding: 10px 18px; border-radius: var(--radius-sm);
          border: 1px solid var(--border); cursor: pointer; transition: all 0.2s ease;
        }
        .outline-btn:hover { background: var(--border-light); border-color: #cbd5e1; }

        .search-container {
          display: flex; align-items: center; gap: 10px;
          background: white; border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 8px 14px;
          width: 320px; box-shadow: var(--shadow-card);
        }
        .search-container input {
          border: none; background: transparent; outline: none;
          font-size: 13px; color: var(--text-primary); width: 100%;
        }

        /* Toast notifications */
        .toast-container {
          position: fixed; top: 20px; right: 20px; z-index: 1000;
          animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .toast {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 20px; border-radius: 12px;
          color: white; font-weight: 500; font-size: 13px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .toast-success { background: var(--success); }
        .toast-danger { background: var(--danger); }

        /* Grid & Cards */
        .contractors-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px; padding-bottom: 30px;
        }
        .contractor-card {
          background: white; border: 1px solid var(--border-light);
          border-radius: var(--radius); overflow: hidden;
          box-shadow: var(--shadow-card); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .contractor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(44,43,48,0.09);
          border-color: var(--border);
        }
        .card-header {
          display: flex; align-items: center; gap: 14px;
          padding: 20px; cursor: pointer; transition: background 0.15s;
        }
        .card-header:hover { background: #fafbfc; }
        .card-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(245,143,124,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--primary);
        }
        .card-title-section { flex: 1; min-width: 0; }
        .card-title { font-weight: 700; font-size: 16px; color: var(--text-primary); margin-bottom: 2px; }
        .card-subtitle { font-size: 12px; color: var(--text-muted); }

        .card-actions { display: flex; align-items: center; gap: 4px; }
        .card-act-btn {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: transparent; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.15s;
          color: var(--text-secondary);
        }
        .card-act-btn:hover { background: #f1f5f9; color: var(--text-primary); }
        .card-act-btn-danger:hover { background: #fee2e2; color: var(--danger); }

        .card-body {
          border-top: 1px solid var(--border-light);
          background: #fafbfc; padding: 4px 0;
          animation: fadeIn 0.2s ease forwards;
        }
        .member-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; border-bottom: 1px solid var(--border-light);
        }
        .member-row:last-child { border-bottom: none; }
        .member-working { font-weight: 600; font-size: 13px; color: var(--text-primary); }
        .member-salary {
          background: rgba(16,185,129,0.08); color: #059669;
          font-weight: 700; font-size: 13px;
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid rgba(16,185,129,0.15);
        }

        /* Glassmorphism Modal */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(44, 43, 48, 0.4);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: fadeIn 0.25s ease;
        }
        .modal-container {
          background: white; border-radius: 20px;
          width: 100%; max-width: 520px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden; animation: fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid var(--border-light);
        }
        .modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); }
        .modal-close {
          border: none; background: #f1f5f9; cursor: pointer;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); transition: all 0.15s;
        }
        .modal-close:hover { background: #e2e8f0; color: var(--text-primary); }
        
        .modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }
        .modal-footer {
          padding: 16px 24px; background: #fafbfc;
          border-top: 1px solid var(--border-light);
          display: flex; align-items: center; justify-content: flex-end; gap: 12px;
        }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-input {
          width: 100%; border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 10px 14px;
          font-size: 14px; color: var(--text-primary); outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus { border-color: var(--primary); }

        .member-inputs-list {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 14px;
        }
        .member-input-row { display: flex; align-items: center; gap: 8px; }
        .row-del-btn {
          width: 38px; height: 38px; border-radius: var(--radius-xs);
          border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.04);
          color: var(--danger); display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
        }
        .row-del-btn:hover { background: rgba(239,68,68,0.1); }

        /* Welcome card */
        .welcome-card {
          background: linear-gradient(135deg, #2c2b30 0%, #4f4f51 100%);
          border-radius: 20px; padding: 40px; text-align: center;
          color: white; box-shadow: var(--shadow-lg);
          max-width: 600px; margin: 40px auto;
        }

        @media(max-width: 640px) {
          .contractors-header { flex-direction: column; align-items: stretch; }
          .search-container { width: 100%; }
          .header-actions { flex-direction: column; align-items: stretch; }
          .header-actions button { width: 100%; justify-content: center; }
          .modal-container { max-height: 100%; border-radius: 0; height: 100%; display: flex; flex-direction: column; }
          .modal-body { flex: 1; }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="contractors-header">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>Contractor Tasks</h1>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Define task categories, active sub-roles, and standard daily salaries</p>
        </div>

        <div className="header-actions">
          <div className="search-container">
            <Search size={14} color="#94a3b8" />
            <input 
              placeholder="Search tasks, roles…" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="contractors-search"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: "#64748b" }}>
                <X size={14} />
              </button>
            )}
          </div>

          <button onClick={openAddModal} className="premium-btn" id="btn-add-contractor">
            <Plus size={16} /> Add Task
          </button>
          
          <button 
            onClick={handleSeedTemplates} 
            className="outline-btn"
            style={{ color: "var(--primary)", borderColor: "rgba(245,143,124,0.4)" }}
            title="Pre-populate with 9 standard construction contractor tasks"
            id="btn-seed-templates"
          >
            <Sparkles size={14} /> Seed Templates
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: "80px", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          <p style={{ fontWeight: 500 }}>Loading contractor registry…</p>
        </div>
      ) : contractors.length === 0 ? (
        /* Empty State */
        <div className="welcome-card animate-fadeInUp">
          <Briefcase size={54} color="var(--primary)" style={{ margin: "0 auto 18px", opacity: 0.9 }} />
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>No Contractor Tasks Set Up</h2>
          <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>
            You haven't defined any contractor tasks yet. Setup contractor profiles to organize workers (e.g. Carpenter, Painter) and preset daily salaries for different designations.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleSeedTemplates} className="premium-btn" style={{ minWidth: "180px" }}>
              <Sparkles size={16} /> Seed Sample Templates
            </button>
            <button onClick={openAddModal} className="outline-btn" style={{ minWidth: "180px", background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
              <Plus size={16} /> Add Custom Task
            </button>
          </div>
        </div>
      ) : (
        /* Cards Grid */
        <div className="contractors-grid animate-fadeIn">
          {filteredContractors.map((c) => {
            const isExpanded = expandedCards[c._id];
            return (
              <div key={c._id} className="contractor-card">
                <div className="card-header" onClick={() => toggleExpandCard(c._id)}>
                  <div className="card-icon">
                    <Briefcase size={20} />
                  </div>
                  <div className="card-title-section">
                    <div className="card-title">{c.title}</div>
                    <div className="card-subtitle">{c.members.length} member roles defined</div>
                  </div>
                  <div className="card-actions" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditModal(c)} className="card-act-btn" title="Edit Task" id={`btn-edit-${c._id}`}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDeleteTask(c._id, c.title)} className="card-act-btn card-act-btn-danger" title="Delete Task" id={`btn-delete-${c._id}`}>
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => toggleExpandCard(c._id)} className="card-act-btn" style={{ marginLeft: "4px" }}>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="card-body">
                    {c.members.map((m, mIdx) => (
                      <div key={m._id || mIdx} className="member-row">
                        <span className="member-working">{m.working}</span>
                        <span className="member-salary">₹{m.salary.toLocaleString("en-IN")} / day</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <span className="modal-title">{modalType === "add" ? "Add Contractor Task" : "Edit Contractor Task"}</span>
              <button onClick={() => setModalOpen(false)} className="modal-close">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fee2e2", color: "var(--danger)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, marginBottom: "18px" }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="task-title">Task Category Title</label>
                  <input 
                    type="text"
                    id="task-title"
                    className="form-input"
                    placeholder="e.g. Carpenter, Painter, Plumber"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sub-Roles (Working & Daily Wages)</label>
                  
                  <div className="member-inputs-list">
                    {formMembers.map((m, idx) => (
                      <div key={idx} className="member-input-row">
                        <input 
                          type="text"
                          className="form-input"
                          placeholder="Role (e.g. Helper, Main)"
                          value={m.working}
                          onChange={(e) => handleMemberChange(idx, "working", e.target.value)}
                          required
                          style={{ flex: 2 }}
                        />
                        <input 
                          type="number"
                          className="form-input"
                          placeholder="Wage (₹)"
                          value={m.salary}
                          onChange={(e) => handleMemberChange(idx, "salary", e.target.value)}
                          required
                          min="0"
                          style={{ flex: 1 }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMemberRow(idx)}
                          className="row-del-btn"
                          title="Remove role"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={handleAddMemberRow}
                    className="outline-btn"
                    style={{ width: "100%", justifyContent: "center", borderStyle: "dashed", borderLevel: "2px", color: "var(--primary)", borderColor: "rgba(245,143,124,0.4)" }}
                  >
                    <Plus size={14} /> Add Sub-Role / Designation
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="outline-btn">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="premium-btn" style={{ minWidth: "100px", justifyContent: "center" }} id="btn-modal-submit">
                  {submitting ? "Saving…" : modalType === "add" ? "Create Task" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
