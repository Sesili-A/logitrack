import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { 
  Briefcase, Plus, Edit2, Trash2, ChevronDown, ChevronUp, 
  Search, X, Check, RefreshCw, AlertCircle, Sparkles,
  Calendar, MapPin, IndianRupee, Users, CheckCircle, Clock,
  ArrowLeft, ArrowRight, ClipboardList
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

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmtRupee = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const toYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const todayStr = () => toYMD(new Date());

const getSunday = (d) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday
  const diff = date.getDate() - day;
  const sun = new Date(date.setDate(diff));
  sun.setHours(0,0,0,0);
  return sun;
};

export default function Contractors() {
  // Navigation & General states
  const [activeTab, setActiveTab] = useState("mark"); // "mark", "sheets", "payroll", "setup"
  const [contractors, setContractors] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Tab 1: Mark Attendance states
  const [attDate, setAttDate] = useState(todayStr());
  const [attSite, setAttSite] = useState("");
  const [attContractorId, setAttContractorId] = useState("");
  const [attCounts, setAttCounts] = useState({}); // { [workingRole]: number }
  const [submittingAtt, setSubmittingAtt] = useState(false);
  const [activeSheetsForDate, setActiveSheetsForDate] = useState([]);

  // Tab 2: Daily Sheets states
  const [sheetDate, setSheetDate] = useState(todayStr());
  const [dailySheets, setDailySheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Tab 3: Weekly Payroll states
  const [payrollWeekStart, setPayrollWeekStart] = useState(getSunday(new Date()));
  const [payrollData, setPayrollData] = useState(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [expandedPayrollGroups, setExpandedPayrollGroups] = useState({});

  // Tab 4: Template CRUD states (original screen)
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCards, setExpandedCards] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [editingId, setEditingId] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formMembers, setFormMembers] = useState([{ working: "", salary: "" }]);
  const [formError, setFormError] = useState("");
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch initial registry data
  useEffect(() => {
    fetchCoreData();
  }, []);

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const hd = hdrs();
      const [cRes, sRes] = await Promise.all([
        API.get("/contractors", { headers: hd }),
        API.get("/sites", { headers: hd })
      ]);
      setContractors(cRes.data || []);
      setSites(sRes.data || []);

      // Auto expand first two templates if they exist
      if (cRes.data && cRes.data.length > 0) {
        const initialExpanded = {};
        cRes.data.slice(0, 2).forEach(c => {
          initialExpanded[c._id] = true;
        });
        setExpandedCards(initialExpanded);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch contractor registry", "danger");
    } finally {
      setLoading(false);
    }
  };

  // ── Tab 1: MARK ATTENDANCE LOGIC ──

  // Fetch all attendance sheets for the selected date to allow auto-population
  const fetchSheetsForAttDate = useCallback(async (date) => {
    try {
      const res = await API.get(`/contractor-attendance?date=${date}`, { headers: hdrs() });
      setActiveSheetsForDate(res.data || []);
    } catch (err) {
      console.error("Failed to load existing attendance sheets", err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "mark" && attDate) {
      fetchSheetsForAttDate(attDate);
    }
  }, [activeTab, attDate, fetchSheetsForAttDate]);

  // Check and pre-fill counts if attendance was already logged for selected site & contractor task
  useEffect(() => {
    if (attContractorId && attSite) {
      const matchedSheet = activeSheetsForDate.find(
        s => s.contractor && s.contractor._id === attContractorId && s.site.toLowerCase() === attSite.toLowerCase()
      );
      
      const selectedContractor = contractors.find(c => c._id === attContractorId);
      if (selectedContractor) {
        const initialCounts = {};
        selectedContractor.members.forEach(m => {
          if (matchedSheet) {
            const loggedRole = matchedSheet.details.find(d => d.working.toLowerCase() === m.working.toLowerCase());
            initialCounts[m.working] = loggedRole ? loggedRole.count : 0;
          } else {
            initialCounts[m.working] = 0;
          }
        });
        setAttCounts(initialCounts);
      }
    } else {
      setAttCounts({});
    }
  }, [attContractorId, attSite, activeSheetsForDate, contractors]);

  const handleCountChange = (role, value) => {
    const num = Math.max(0, parseInt(value) || 0);
    setAttCounts(prev => ({ ...prev, [role]: num }));
  };

  const adjustCount = (role, diff) => {
    setAttCounts(prev => {
      const current = prev[role] || 0;
      return { ...prev, [role]: Math.max(0, current + diff) };
    });
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!attDate) return showToast("Please select a date", "danger");
    if (!attSite) return showToast("Please select a work site", "danger");
    if (!attContractorId) return showToast("Please select a contractor task", "danger");

    const selectedContractor = contractors.find(c => c._id === attContractorId);
    if (!selectedContractor) return showToast("Contractor task not found", "danger");

    // Map counts back to details array format
    const details = selectedContractor.members.map(m => ({
      working: m.working,
      count: Number(attCounts[m.working] || 0),
      salary: Number(m.salary)
    }));

    const totalWorkers = details.reduce((sum, item) => sum + item.count, 0);
    if (totalWorkers === 0) {
      if (!window.confirm("You are saving attendance with 0 workers. This will clear the deployed worker count for this contractor task today. Proceed?")) {
        return;
      }
    }

    setSubmittingAtt(true);
    try {
      const payload = {
        date: attDate,
        site: attSite,
        contractorId: attContractorId,
        details
      };
      await API.post("/contractor-attendance", payload, { headers: hdrs() });
      showToast("Contractor deployment attendance saved successfully!");
      
      // Refresh current sheets list
      fetchSheetsForAttDate(attDate);
      
      // Auto redirect to Daily Sheets tab
      setSheetDate(attDate);
      setActiveTab("sheets");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || "Failed to save contractor attendance", "danger");
    } finally {
      setSubmittingAtt(false);
    }
  };


  // ── Tab 2: DAILY SHEETS LOGIC ──

  const fetchDailySheets = useCallback(async (date) => {
    setLoadingSheets(true);
    try {
      const res = await API.get(`/contractor-attendance?date=${date}`, { headers: hdrs() });
      setDailySheets(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch daily attendance records", "danger");
    } finally {
      setLoadingSheets(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "sheets" && sheetDate) {
      fetchDailySheets(sheetDate);
    }
  }, [activeTab, sheetDate, fetchDailySheets]);

  const handleEditDailySheet = (sheet) => {
    if (!sheet.contractor) {
      showToast("Cannot edit: associated contractor task has been deleted", "danger");
      return;
    }
    setAttDate(toYMD(new Date(sheet.date)));
    setAttSite(sheet.site);
    setAttContractorId(sheet.contractor._id);
    
    // Set counts in attCounts state directly
    const counts = {};
    sheet.details.forEach(d => {
      counts[d.working] = d.count;
    });
    setAttCounts(counts);

    showToast("Loaded sheet parameters into entry form!");
    setActiveTab("mark");
  };


  // ── Tab 3: WEEKLY PAYROLL LOGIC ──

  const fetchWeeklyPayroll = useCallback(async (weekStart) => {
    setLoadingPayroll(true);
    try {
      const wsStr = toYMD(weekStart);
      const res = await API.get(`/contractor-attendance/payroll?weekStart=${wsStr}`, { headers: hdrs() });
      setPayrollData(res.data || null);
    } catch (err) {
      console.error(err);
      showToast("Failed to load payroll calculations", "danger");
    } finally {
      setLoadingPayroll(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "payroll" && payrollWeekStart) {
      fetchWeeklyPayroll(payrollWeekStart);
    }
  }, [activeTab, payrollWeekStart, fetchWeeklyPayroll]);

  const shiftWeek = (direction) => {
    setPayrollWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction * 7));
      return next;
    });
  };

  const togglePayrollGroup = (id) => {
    setExpandedPayrollGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };


  // ── Tab 4: TEMPLATE CRUD LOGIC (ORIGINAL SCREEN) ──

  const fetchTemplatesOnly = async () => {
    try {
      const res = await API.get("/contractors", { headers: hdrs() });
      setContractors(res.data || []);
    } catch {}
  };

  const handleSeedTemplates = async () => {
    setLoading(true);
    try {
      const hd = hdrs();
      let count = 0;
      for (const t of SAMPLE_TEMPLATES) {
        const alreadyExists = contractors.some(c => c.title.toLowerCase() === t.title.toLowerCase());
        if (!alreadyExists) {
          await API.post("/contractors", t, { headers: hd });
          count++;
        }
      }
      showToast(`Successfully seeded ${count} sample templates!`, "success");
      fetchTemplatesOnly();
    } catch (err) {
      console.error(err);
      showToast("Error while seeding templates", "danger");
    } finally {
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
      setFormError("Task Category Title is required");
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

    setSubmittingTemplate(true);
    try {
      const hd = hdrs();
      const payload = {
        title: formTitle,
        members: filteredMembers.map(m => ({ working: m.working, salary: Number(m.salary) }))
      };

      if (modalType === "add") {
        await API.post("/contractors", payload, { headers: hd });
        showToast("Contractor task created successfully!");
      } else {
        await API.put(`/contractors/${editingId}`, payload, { headers: hd });
        showToast("Contractor task updated successfully!");
      }
      setModalOpen(false);
      fetchTemplatesOnly();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.msg || "Server error while saving task");
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the "${title}" task template?`)) return;

    try {
      await API.delete(`/contractors/${id}`, { headers: hdrs() });
      showToast("Contractor task deleted", "success");
      fetchTemplatesOnly();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete task template", "danger");
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
        /* Core Branding Integration */
        .premium-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white; font-weight: 600; font-size: 13.5px;
          padding: 10px 20px; border-radius: var(--radius-sm);
          border: none; cursor: pointer; transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(245,143,124,0.35);
        }
        .premium-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(245,143,124,0.45);
        }
        .premium-btn:active:not(:disabled) { transform: translateY(0); }
        .premium-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .outline-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: white; color: var(--text-primary); font-weight: 600; font-size: 13px;
          padding: 10px 18px; border-radius: var(--radius-sm);
          border: 1px solid var(--border); cursor: pointer; transition: all 0.2s ease;
        }
        .outline-btn:hover { background: var(--border-light); border-color: #cbd5e1; }

        /* Premium Nav Tabs styling */
        .tabs-header-premium {
          display: flex; border-bottom: 2px solid var(--border-light);
          margin-bottom: 24px; gap: 4px; overflow-x: auto;
          scrollbar-width: none;
        }
        .tabs-header-premium::-webkit-scrollbar { display: none; }
        
        .tab-premium-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; border: none; cursor: pointer;
          background: transparent; font-size: 13.5px; font-weight: 500;
          color: var(--text-secondary); border-bottom: 3px solid transparent;
          transition: all 0.2s; white-space: nowrap;
          border-radius: var(--radius-xs) var(--radius-xs) 0 0;
        }
        .tab-premium-btn:hover { color: var(--text-primary); background: rgba(0,0,0,0.02); }
        .tab-premium-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
          font-weight: 700;
        }

        /* Glassmorphic Panel container */
        .premium-panel {
          background: white; border-radius: var(--radius);
          box-shadow: var(--shadow-card); border: 1px solid var(--border-light);
          padding: 24px; animation: fadeInUp 0.3s ease;
        }

        .search-container {
          display: flex; align-items: center; gap: 10px;
          background: white; border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 8px 14px;
          width: 300px; box-shadow: var(--shadow-card);
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

        /* Setup templates grid */
        .contractors-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .contractor-card {
          background: white; border: 1px solid var(--border-light);
          border-radius: var(--radius); overflow: hidden;
          box-shadow: var(--shadow-card); transition: all 0.25s ease;
        }
        .contractor-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border);
        }
        .card-header-setup {
          display: flex; align-items: center; gap: 12px;
          padding: 18px; cursor: pointer; transition: background 0.15s;
        }
        .card-header-setup:hover { background: #fafbfc; }
        .card-icon-setup {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(245,143,124,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--primary);
        }
        .card-title { font-weight: 700; font-size: 15px; color: var(--text-primary); margin-bottom: 2px; }
        .card-subtitle { font-size: 11.5px; color: var(--text-muted); }

        .card-actions { display: flex; align-items: center; gap: 2px; }
        .card-act-btn {
          width: 30px; height: 30px; border-radius: 8px; border: none;
          background: transparent; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.15s;
          color: var(--text-secondary);
        }
        .card-act-btn:hover { background: #f1f5f9; color: var(--text-primary); }
        .card-act-btn-danger:hover { background: #fee2e2; color: var(--danger); }

        .card-body-setup {
          border-top: 1px solid var(--border-light);
          background: #fafbfc; padding: 2px 0;
          animation: fadeIn 0.2s ease forwards;
        }
        .member-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 18px; border-bottom: 1px solid var(--border-light);
        }
        .member-row:last-child { border-bottom: none; }
        .member-working { font-weight: 600; font-size: 12.5px; color: var(--text-primary); }
        .member-salary {
          background: rgba(16,185,129,0.08); color: #059669;
          font-weight: 700; font-size: 12px;
          padding: 2px 8px; border-radius: 12px;
          border: 1px solid rgba(16,185,129,0.15);
        }

        /* Glassmorphism Modals */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(44, 43, 48, 0.4);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; animation: fadeIn 0.25s ease;
        }
        .modal-container {
          background: white; border-radius: 20px;
          width: 100%; max-width: 500px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden; animation: fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px; border-bottom: 1px solid var(--border-light);
        }
        .modal-title { font-size: 16.5px; font-weight: 800; color: var(--text-primary); }
        .modal-close {
          border: none; background: #f1f5f9; cursor: pointer;
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); transition: all 0.15s;
        }
        .modal-close:hover { background: #e2e8f0; color: var(--text-primary); }
        
        .modal-body { padding: 20px 24px; max-height: 65vh; overflow-y: auto; }
        .modal-footer {
          padding: 14px 24px; background: #fafbfc;
          border-top: 1px solid var(--border-light);
          display: flex; align-items: center; justify-content: flex-end; gap: 10px;
        }

        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-input {
          width: 100%; border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 9px 12px;
          font-size: 13.5px; color: var(--text-primary); outline: none;
          transition: border-color 0.2s; background: #f8fafc;
        }
        .form-input:focus { border-color: var(--primary); background: white; }

        .member-inputs-list {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 12px;
        }
        .member-input-row { display: flex; align-items: center; gap: 8px; }
        .row-del-btn {
          width: 36px; height: 36px; border-radius: var(--radius-xs);
          border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.04);
          color: var(--danger); display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
        }
        .row-del-btn:hover { background: rgba(239,68,68,0.1); }

        /* Counter input UI (Mark attendance) */
        .counter-container {
          display: flex; align-items: center; gap: 4px;
        }
        .counter-btn {
          width: 36px; height: 36px; border-radius: var(--radius-xs);
          border: 1px solid var(--border); background: white;
          color: var(--text-primary); display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.15s;
          font-size: 16px; font-weight: 600;
        }
        .counter-btn:hover { background: var(--border-light); border-color: #cbd5e1; }
        .counter-btn:active { background: #e2e8f0; }

        /* Sheet Card elements */
        .sheet-card {
          background: white; border: 1px solid var(--border-light);
          border-radius: var(--radius); padding: 20px;
          box-shadow: var(--shadow-card); transition: all 0.2s ease;
          display: flex; flex-direction: column; gap: 14px;
        }
        .sheet-card:hover { border-color: var(--border); box-shadow: var(--shadow-lg); }
        .sheet-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
        }
        .sheet-details-list {
          display: flex; flex-direction: column; gap: 8px;
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 12px 0;
        }
        .sheet-detail-item {
          display: flex; justify-content: space-between; font-size: 13px;
        }
        
        /* Stats Grid */
        .stats-summary-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px; margin-bottom: 24px;
        }
        .stats-summary-card {
          background: #fafbfc; border: 1px solid var(--border-light);
          border-radius: var(--radius); padding: 18px;
          display: flex; align-items: center; gap: 14px;
        }
        .stats-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Payroll Table stylings */
        .payroll-table {
          width: 100%; border-collapse: collapse; text-align: left;
        }
        .payroll-table th {
          padding: 12px 16px; font-size: 10.5px; font-weight: 700;
          color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.08em; border-bottom: 2px solid var(--border-light);
        }
        .payroll-table td {
          padding: 14px 16px; font-size: 13.5px; border-bottom: 1px solid var(--border-light);
        }
        .payroll-sub-row {
          background: #fafbfc; border-left: 3px solid var(--primary);
        }

        /* Welcome card */
        .welcome-card {
          background: linear-gradient(135deg, #2c2b30 0%, #4f4f51 100%);
          border-radius: 20px; padding: 40px; text-align: center;
          color: white; box-shadow: var(--shadow-lg);
          max-width: 600px; margin: 40px auto;
        }

        @media(max-width: 768px) {
          .stats-summary-grid { grid-template-columns: 1fr; }
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
      <div style={{ display: "flex", alignSelf: "stretch", justifyContent: "space-between", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>Contractors</h1>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Manage task designations, daily salaries, and record deployment attendance</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="tabs-header-premium">
        <button 
          onClick={() => setActiveTab("mark")} 
          className={`tab-premium-btn ${activeTab === "mark" ? "active" : ""}`}
        >
          <Calendar size={15} /> Mark Attendance
        </button>
        <button 
          onClick={() => setActiveTab("sheets")} 
          className={`tab-premium-btn ${activeTab === "sheets" ? "active" : ""}`}
        >
          <ClipboardList size={15} /> Daily Sheets
        </button>
        <button 
          onClick={() => setActiveTab("payroll")} 
          className={`tab-premium-btn ${activeTab === "payroll" ? "active" : ""}`}
        >
          <IndianRupee size={15} /> Weekly Payroll
        </button>
        <button 
          onClick={() => setActiveTab("setup")} 
          className={`tab-premium-btn ${activeTab === "setup" ? "active" : ""}`}
        >
          <Briefcase size={15} /> Setup Templates
        </button>
      </div>

      {/* Loading root state */}
      {loading ? (
        <div className="premium-panel" style={{ padding: "80px", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          <p style={{ fontWeight: 500 }}>Syncing contractor database…</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MARK ATTENDANCE */}
          {activeTab === "mark" && (
            <div className="premium-panel">
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} color="var(--primary)" /> Record Daily Site Deployment
              </h2>

              <form onSubmit={handleSaveAttendance} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Deployment Date *</label>
                    <div style={{ position: "relative" }}>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={attDate} 
                        onChange={(e) => setAttDate(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Work Site Location *</label>
                    <select 
                      className="form-input" 
                      style={{ background: "white" }} 
                      value={attSite} 
                      onChange={(e) => setAttSite(e.target.value)}
                      required
                    >
                      <option value="">Select deployment site…</option>
                      {sites.map(s => (
                        <option key={s._id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contractor Task / Team *</label>
                    <select 
                      className="form-input" 
                      style={{ background: "white" }} 
                      value={attContractorId} 
                      onChange={(e) => setAttContractorId(e.target.value)}
                      required
                    >
                      <option value="">Select task template…</option>
                      {contractors.map(c => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-Roles Deployment Input Panel */}
                {attContractorId && attSite ? (
                  <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid var(--border-light)", marginTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Designation / Role
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Deployed Count (Present)
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {contractors.find(c => c._id === attContractorId)?.members.map(m => (
                        <div key={m.working} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", padding: "6px 0" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-primary)" }}>{m.working}</div>
                            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>preset daily rate: ₹{m.salary.toLocaleString("en-IN")}</div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="counter-container">
                              <button 
                                type="button" 
                                className="counter-btn" 
                                onClick={() => adjustCount(m.working, -1)}
                              >
                                -
                              </button>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ width: "64px", textAlign: "center", padding: "8px", background: "white" }} 
                                value={attCounts[m.working] ?? 0}
                                min="0"
                                onChange={(e) => handleCountChange(m.working, e.target.value)}
                              />
                              <button 
                                type="button" 
                                className="counter-btn" 
                                onClick={() => adjustCount(m.working, 1)}
                              >
                                +
                              </button>
                            </div>
                            
                            <div style={{ width: "100px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: "#059669" }}>
                              {fmtRupee((attCounts[m.working] || 0) * m.salary)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Sum */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>Estimated Daily Cost:</span>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--primary)" }}>
                        {(() => {
                          const cTask = contractors.find(c => c._id === attContractorId);
                          if (!cTask) return "₹0";
                          const sum = cTask.members.reduce((acc, m) => acc + ((attCounts[m.working] || 0) * m.salary), 0);
                          return fmtRupee(sum);
                        })()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--text-muted)", background: "#fafbfc" }}>
                    <MapPin size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                    <p style={{ fontSize: "13.5px" }}>Please select date, work site, and contractor task above to load entry controls.</p>
                  </div>
                )}

                {attContractorId && attSite && (
                  <button 
                    type="submit" 
                    className="premium-btn" 
                    style={{ alignSelf: "flex-end", minWidth: "180px", marginTop: "10px" }}
                    disabled={submittingAtt}
                  >
                    {submittingAtt ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Save Deployed Workers
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: DAILY SHEETS LIST */}
          {activeTab === "sheets" && (
            <div className="premium-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ClipboardList size={18} color="var(--primary)" /> Recorded Contractor Sheets
                </h2>
                
                {/* Date select */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 500 }}>Select Date:</span>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ width: "160px", background: "white" }} 
                    value={sheetDate} 
                    onChange={(e) => setSheetDate(e.target.value)}
                  />
                </div>
              </div>

              {loadingSheets ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px", animation: "spin 1s linear infinite", color: "var(--primary)" }} />
                  <p style={{ fontSize: "13px" }}>Loading daily sheets…</p>
                </div>
              ) : dailySheets.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--text-muted)", background: "#fafbfc" }}>
                  <Calendar size={28} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                  <p style={{ fontSize: "13.5px", fontWeight: 600 }}>No contractor attendance logged for today.</p>
                  <p style={{ fontSize: "12px", marginTop: "3px" }}>Use the "Mark Attendance" tab to record today's site deployment counts.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                  {dailySheets.map((sheet) => {
                    const dailyCost = sheet.details.reduce((sum, d) => sum + (d.count * d.salary), 0);
                    const totalCount = sheet.details.reduce((sum, d) => sum + d.count, 0);

                    return (
                      <div key={sheet._id} className="sheet-card animate-fadeIn">
                        <div className="sheet-header">
                          <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Briefcase size={14} color="var(--primary)" /> {sheet.contractor ? sheet.contractor.title : "Deleted Task Template"}
                            </h3>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                              <MapPin size={11} /> Deployed at {sheet.site}
                            </div>
                          </div>

                          <button 
                            onClick={() => handleEditDailySheet(sheet)} 
                            className="card-act-btn" 
                            style={{ background: "#f1f5f9", borderRadius: "6px" }}
                            title="Edit Attendance Sheet"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>

                        <div className="sheet-details-list">
                          {sheet.details.filter(d => d.count > 0).length === 0 ? (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "6px" }}>
                              No workers deployed (0 counts)
                            </div>
                          ) : (
                            sheet.details.filter(d => d.count > 0).map((d, dIdx) => (
                              <div key={dIdx} className="sheet-detail-item">
                                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{d.working}</span>
                                <span style={{ color: "var(--text-secondary)" }}>
                                  {d.count} deployed · <span style={{ fontWeight: 600 }}>{fmtRupee(d.count * d.salary)}</span>
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{totalCount} total workers</span>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Total Cost</span>
                            <span style={{ fontSize: "15px", fontWeight: 800, color: "#059669" }}>{fmtRupee(dailyCost)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEEKLY PAYROLL CALCULATION */}
          {activeTab === "payroll" && (
            <div className="premium-panel">
              {/* Date pick / shift */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <IndianRupee size={18} color="var(--primary)" /> Contractor Weekly Gross Payroll
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button onClick={() => shiftWeek(-1)} className="outline-btn" style={{ padding: "8px 12px" }}>
                    <ArrowLeft size={14} />
                  </button>

                  <div style={{ background: "#f8fafc", padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Week starting Sunday: {payrollWeekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>

                  <button onClick={() => shiftWeek(1)} className="outline-btn" style={{ padding: "8px 12px" }}>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {loadingPayroll ? (
                <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 10px", animation: "spin 1s linear infinite", color: "var(--primary)" }} />
                  <p style={{ fontSize: "13px" }}>Computing payroll aggregates…</p>
                </div>
              ) : payrollData ? (
                <>
                  {/* Summary Cards */}
                  <div className="stats-summary-grid">
                    <div className="stats-summary-card">
                      <div className="stats-icon-wrap" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                        <IndianRupee size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>{fmtRupee(payrollData.totalWeeklyCost)}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Total Contractor Expenditure</div>
                      </div>
                    </div>

                    <div className="stats-summary-card">
                      <div className="stats-icon-wrap" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                        <Users size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          {payrollData.payroll.reduce((sum, c) => sum + c.days.reduce((dSum, d) => dSum + d.details.reduce((itemSum, item) => itemSum + item.count, 0), 0), 0)}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Total Weekly Deployments</div>
                      </div>
                    </div>
                  </div>

                  {/* List / Payroll tables */}
                  {payrollData.payroll.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                      <AlertCircle size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ fontSize: "13.5px" }}>No active contractor registries found.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {payrollData.payroll.map((c) => {
                        const isExpanded = expandedPayrollGroups[c._id];
                        
                        return (
                          <div key={c._id} style={{ border: "1px solid var(--border-light)", borderRadius: "14px", overflow: "hidden", background: "white" }}>
                            {/* Accordion header */}
                            <div 
                              onClick={() => togglePayrollGroup(c._id)} 
                              style={{ display: "flex", alignItems: "center", justifySpace: "between", padding: "16px 20px", cursor: "pointer", background: isExpanded ? "#fafbfc" : "white", transition: "background 0.2s" }}
                            >
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                                  <Briefcase size={14} color="var(--primary)" /> {c.title}
                                </h3>
                                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                                  {c.days.length} active deployment day{c.days.length !== 1 ? "s" : ""} recorded this week
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div style={{ textAlign: "right" }}>
                                  <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Weekly Wages</span>
                                  <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#059669" }}>{fmtRupee(c.totalGross)}</span>
                                </div>
                                {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                              </div>
                            </div>

                            {/* Accordion content */}
                            {isExpanded && (
                              <div style={{ borderTop: "1px solid var(--border-light)", overflowX: "auto" }}>
                                {c.days.length === 0 ? (
                                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12.5px" }}>
                                    No deployments recorded for this contractor team this week.
                                  </div>
                                ) : (
                                  <table className="payroll-table">
                                    <thead>
                                      <tr>
                                        <th>Date</th>
                                        <th>Work Site</th>
                                        <th>Deployed Trades</th>
                                        <th style={{ textAlign: "right" }}>Daily Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {c.days.map((day) => (
                                        <tr key={day._id}>
                                          <td style={{ fontWeight: 600 }}>
                                            {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                          </td>
                                          <td>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                              <MapPin size={11} /> {day.site}
                                            </span>
                                          </td>
                                          <td>
                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                              {day.details.filter(d => d.count > 0).map((d, dIdx) => (
                                                <span key={dIdx} style={{ fontSize: "11px", padding: "1px 6px", background: "rgba(0,0,0,0.04)", borderRadius: "8px", color: "var(--text-secondary)" }}>
                                                  {d.working}: {d.count}
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>
                                            {fmtRupee(day.dailyTotal)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  <AlertCircle size={28} />
                  <p style={{ marginTop: "8px" }}>No payroll summaries calculated.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TEMPLATE CRUD (ORIGINAL SETUP SCREEN) */}
          {activeTab === "setup" && (
            <div className="premium-panel animate-fadeIn">
              {/* Toolbar */}
              <div style={{ display: "flex", alignSelf: "stretch", justifyContent: "space-between", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
                <div className="search-container">
                  <Search size={14} color="#94a3b8" />
                  <input 
                    placeholder="Search templates, designations…" 
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

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={openAddModal} className="premium-btn" id="btn-add-contractor">
                    <Plus size={16} /> Add Task Template
                  </button>
                  
                  <button 
                    onClick={handleSeedTemplates} 
                    className="outline-btn"
                    style={{ color: "var(--primary)", borderColor: "rgba(245,143,124,0.4)" }}
                    title="Pre-populate with 9 standard construction contractor templates"
                    id="btn-seed-templates"
                  >
                    <Sparkles size={14} /> Seed Templates
                  </button>
                </div>
              </div>

              {contractors.length === 0 ? (
                /* Empty State */
                <div className="welcome-card animate-fadeInUp">
                  <Briefcase size={54} color="var(--primary)" style={{ margin: "0 auto 18px", opacity: 0.9 }} />
                  <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "12px" }}>No Task Templates Defined</h2>
                  <p style={{ color: "#cbd5e1", fontSize: "13.5px", lineHeight: "1.6", marginBottom: "28px" }}>
                    Configure standard team classifications (e.g. Carpenter, Painter, Tiles Mason) and define standard daily salaries for their respective roles before marking site attendance.
                  </p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={handleSeedTemplates} className="premium-btn" style={{ minWidth: "180px" }}>
                      <Sparkles size={16} /> Seed Sample Templates
                    </button>
                    <button onClick={openAddModal} className="outline-btn" style={{ minWidth: "180px", background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
                      <Plus size={16} /> Add Custom Template
                    </button>
                  </div>
                </div>
              ) : (
                /* Cards Grid */
                <div className="contractors-grid">
                  {filteredContractors.map((c) => {
                    const isExpanded = expandedCards[c._id];
                    return (
                      <div key={c._id} className="contractor-card">
                        <div className="card-header-setup" onClick={() => toggleExpandCard(c._id)}>
                          <div className="card-icon-setup">
                            <Briefcase size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="card-title">{c.title}</div>
                            <div className="card-subtitle">{c.members.length} sub-role{c.members.length !== 1 ? "s" : ""} preset</div>
                          </div>
                          <div className="card-actions" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEditModal(c)} className="card-act-btn" title="Edit Template" id={`btn-edit-${c._id}`}>
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => handleDeleteTask(c._id, c.title)} className="card-act-btn card-act-btn-danger" title="Delete Template" id={`btn-delete-${c._id}`}>
                              <Trash2 size={12} />
                            </button>
                            <button onClick={() => toggleExpandCard(c._id)} className="card-act-btn" style={{ marginLeft: "2px" }}>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="card-body-setup">
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
            </div>
          )}
        </>
      )}

      {/* Dynamic Add / Edit Template Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <span className="modal-title">{modalType === "add" ? "Create Task Template" : "Edit Task Template"}</span>
              <button onClick={() => setModalOpen(false)} className="modal-close">
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fee2e2", color: "var(--danger)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, marginBottom: "18px" }}>
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="task-title">Task Category / Team Title</label>
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
                  <label className="form-label">Sub-Roles (Designation & Daily Rate)</label>
                  
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
                          style={{ flex: 2, background: "white" }}
                        />
                        <input 
                          type="number"
                          className="form-input"
                          placeholder="Rate (₹)"
                          value={m.salary}
                          onChange={(e) => handleMemberChange(idx, "salary", e.target.value)}
                          required
                          min="0"
                          style={{ flex: 1, background: "white" }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMemberRow(idx)}
                          className="row-del-btn"
                          title="Remove role"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={handleAddMemberRow}
                    className="outline-btn"
                    style={{ width: "100%", justifyContent: "center", borderStyle: "dashed", color: "var(--primary)", borderColor: "rgba(245,143,124,0.4)", fontSize: "12.5px" }}
                  >
                    <Plus size={13} /> Add Sub-Role / Designation
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="outline-btn">
                  Cancel
                </button>
                <button type="submit" disabled={submittingTemplate} className="premium-btn" style={{ minWidth: "120px" }} id="btn-modal-submit">
                  {submittingTemplate ? "Saving…" : modalType === "add" ? "Create Template" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
