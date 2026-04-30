import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { User, Lock, MapPin, Check, X, Plus, Trash2, Edit2, Shield } from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
      background: "#0f172a", color: "white", padding: "13px 18px", borderRadius: "12px",
      fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      borderLeft: `4px solid ${type === "success" ? "#10b981" : "#ef4444"}`,
      animation: "fadeInUp 0.3s ease",
    }}>
      {type === "success" ? <Check size={15} color="#10b981" /> : <X size={15} color="#ef4444" />}
      {msg}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);

  // Profile
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [pass, setPass] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPass, setSavingPass] = useState(false);

  // Sites
  const [sites, setSites] = useState([]);
  const [siteForm, setSiteForm] = useState({ name: "", description: "" });
  const [editingSite, setEditingSite] = useState(null);
  const [savingSite, setSavingSite] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    API.get("/auth/profile", { headers: hdrs() }).then(r => setProfile(r.data)).catch(() => {});
    fetchSites();
  }, []);

  const fetchSites = () => {
    API.get("/sites/all", { headers: hdrs() }).then(r => setSites(r.data)).catch(() => {});
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await API.put("/auth/profile", profile, { headers: hdrs() });
      localStorage.setItem("adminName", res.data.name);
      localStorage.setItem("adminPhone", res.data.phone || "");
      showToast("Profile updated successfully");
      window.dispatchEvent(new Event("storage")); // force layout to update
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to update profile", "error");
    } finally { setSavingProfile(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pass.newPassword !== pass.confirmPassword) return showToast("Passwords do not match", "error");
    setSavingPass(true);
    try {
      await API.put("/auth/change-password", pass, { headers: hdrs() });
      setPass({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password updated successfully");
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to update password", "error");
    } finally { setSavingPass(false); }
  };

  const handleSite = async (e) => {
    e.preventDefault();
    if (!siteForm.name) return showToast("Site name is required", "error");
    setSavingSite(true);
    try {
      if (editingSite) {
        await API.put(`/sites/${editingSite}`, siteForm, { headers: hdrs() });
        showToast("Site updated");
      } else {
        await API.post("/sites", siteForm, { headers: hdrs() });
        showToast("Site added");
      }
      setSiteForm({ name: "", description: "" });
      setEditingSite(null);
      fetchSites();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to save site", "error");
    } finally { setSavingSite(false); }
  };

  const deleteSite = async (id) => {
    if (!window.confirm("Delete this site?")) return;
    try {
      await API.delete(`/sites/${id}`, { headers: hdrs() });
      showToast("Site deleted");
      fetchSites();
    } catch { showToast("Failed to delete site", "error"); }
  };

  const inp = {
    width: "100%", padding: "10px 14px", background: "#f8fafc",
    border: "1px solid #e2e8f0", borderRadius: "10px",
    fontSize: "13px", color: "#0f172a", outline: "none",
  };
  const lbl = {
    display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b",
    marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em",
  };
  const btn = {
    padding: "10px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 600,
    cursor: "pointer", boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
  };

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "26px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>Settings</h1>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Manage your profile, security, and work sites</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        {/* Left Nav */}
        <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            { id: "profile", label: "Admin Profile", icon: User },
            { id: "security", label: "Security", icon: Lock },
            { id: "sites", label: "Work Sites", icon: MapPin },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
              background: activeTab === tab.id ? "white" : "transparent",
              border: "none", borderRadius: "12px", cursor: "pointer",
              color: activeTab === tab.id ? "#6366f1" : "#64748b",
              fontWeight: activeTab === tab.id ? 700 : 500, fontSize: "13px",
              boxShadow: activeTab === tab.id ? "0 2px 10px rgba(0,0,0,0.05)" : "none",
              textAlign: "left", transition: "all 0.2s",
            }}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, background: "white", borderRadius: "16px", padding: "30px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          
          {/* PROFILE */}
          {activeTab === "profile" && (
            <div style={{ maxWidth: "460px", animation: "fadeInUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                  <User size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Admin Profile</h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Update your personal details</p>
                </div>
              </div>
              <form onSubmit={handleProfile}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={lbl}>Name *</label>
                  <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={inp} required />
                </div>
                <div style={{ marginBottom: "24px" }}>
                  <label style={lbl}>Phone Number</label>
                  <input value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} style={inp} />
                </div>
                <button type="submit" style={{ ...btn, opacity: savingProfile ? 0.7 : 1 }}>
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <div style={{ maxWidth: "460px", animation: "fadeInUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Change Password</h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Update your admin login password</p>
                </div>
              </div>
              <form onSubmit={handlePassword}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={lbl}>Current Password</label>
                  <input type="password" value={pass.currentPassword} onChange={e => setPass({...pass, currentPassword: e.target.value})} style={inp} required minLength="6" />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={lbl}>New Password</label>
                  <input type="password" value={pass.newPassword} onChange={e => setPass({...pass, newPassword: e.target.value})} style={inp} required minLength="6" />
                </div>
                <div style={{ marginBottom: "24px" }}>
                  <label style={lbl}>Confirm New Password</label>
                  <input type="password" value={pass.confirmPassword} onChange={e => setPass({...pass, confirmPassword: e.target.value})} style={inp} required minLength="6" />
                </div>
                <button type="submit" style={{ ...btn, opacity: savingPass ? 0.7 : 1 }}>
                  {savingPass ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* SITES */}
          {activeTab === "sites" && (
            <div style={{ animation: "fadeInUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Work Sites</h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Manage construction/work sites for deployment</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
                {/* Site Form */}
                <form onSubmit={handleSite} style={{ width: "320px", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>{editingSite ? "Edit Site" : "Add New Site"}</h3>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={lbl}>Site Name *</label>
                    <input value={siteForm.name} onChange={e => setSiteForm({...siteForm, name: e.target.value})} style={{...inp, background: "white"}} required placeholder="e.g. Site 1 (Downtown)" />
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={lbl}>Description</label>
                    <input value={siteForm.description} onChange={e => setSiteForm({...siteForm, description: e.target.value})} style={{...inp, background: "white"}} placeholder="Optional details" />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ ...btn, flex: 1, padding: "8px", opacity: savingSite ? 0.7 : 1 }}>
                      {savingSite ? "Saving…" : editingSite ? "Update" : "Add Site"}
                    </button>
                    {editingSite && (
                      <button type="button" onClick={() => { setEditingSite(null); setSiteForm({ name: "", description: "" }); }} style={{ padding: "8px 14px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Cancel</button>
                    )}
                  </div>
                </form>

                {/* Site List */}
                <div style={{ flex: 1 }}>
                  {sites.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No sites added yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {sites.map(s => (
                        <div key={s._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                              <MapPin size={13} color="#6366f1" /> {s.name}
                            </div>
                            {s.description && <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", paddingLeft: "19px" }}>{s.description}</div>}
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => { setEditingSite(s._id); setSiteForm({ name: s.name, description: s.description }); }} style={{ padding: "6px", background: "#f8fafc", border: "none", borderRadius: "6px", cursor: "pointer", color: "#64748b" }}><Edit2 size={14} /></button>
                            <button onClick={() => deleteSite(s._id)} style={{ padding: "6px", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "6px", cursor: "pointer", color: "#ef4444" }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </Layout>
  );
}
