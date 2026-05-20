import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { User, Lock, MapPin, Check, X, Plus, Trash2, Edit2, Shield, Bell } from "lucide-react";

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)",
      zIndex: 999, background: "#0f172a", color: "white", padding: "12px 20px",
      borderRadius: "12px", fontSize: "13px", fontWeight: 500,
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 16px 40px rgba(0,0,0,.3)",
      borderLeft: `4px solid ${type === "success" ? "#10b981" : "#ef4444"}`,
      animation: "fadeInUp .3s ease", whiteSpace: "nowrap", maxWidth: "90vw",
    }}>
      {type === "success" ? <Check size={15} color="#10b981" /> : <X size={15} color="#ef4444" />}
      {msg}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pass, setPass] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPass, setSavingPass] = useState(false);



  const [pushEnabled, setPushEnabled] = useState(Notification.permission === "granted");
  const [enablingPush, setEnablingPush] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const enablePushNotifications = async () => {
    setEnablingPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Notification permission denied", "error");
        setEnablingPush(false);
        return;
      }
      
      // Force register to ensure it exists, especially if app data was cleared
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }
      const reg = await navigator.serviceWorker.ready;
      
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }
      
      const res = await API.get("/notifications/vapid-public-key", { headers: hdrs() });
      
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
        return outputArray;
      };

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(res.data.publicKey)
      });
      
      await API.post("/notifications/subscribe", subscription, { headers: hdrs() });
      setPushEnabled(true);
      showToast("Push notifications enabled!");
    } catch (err) {
      console.error(err);
      const errText = err.response?.data?.msg || err.message || "Unknown error";
      showToast("Err: " + errText, "error");
    } finally {
      setEnablingPush(false);
    }
  };

  const testPushNotification = async () => {
    try {
      await API.post("/notifications/test-push", {}, { headers: hdrs() });
      showToast("Test push sent! Check your device.");
    } catch (err) {
      const errText = err.response?.data?.msg || err.message || "Unknown error";
      showToast("Err: " + errText, "error");
    }
  };

  useEffect(() => {
    API.get("/auth/profile", { headers: hdrs() }).then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const handleProfile = async (e) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const res = await API.put("/auth/profile", profile, { headers: hdrs() });
      localStorage.setItem("adminName", res.data.name);
      localStorage.setItem("adminPhone", res.data.phone || "");
      showToast("Profile updated successfully");
      window.dispatchEvent(new Event("storage"));
    } catch (err) { showToast(err.response?.data?.msg || "Failed to update profile", "error"); }
    finally { setSavingProfile(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pass.newPassword !== pass.confirmPassword) return showToast("Passwords do not match", "error");
    setSavingPass(true);
    try {
      await API.put("/auth/change-password", pass, { headers: hdrs() });
      setPass({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password updated successfully");
    } catch (err) { showToast(err.response?.data?.msg || "Failed to update password", "error"); }
    finally { setSavingPass(false); }
  };



  const inp = { width: "100%", padding: "11px 14px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "14px", color: "#0f172a", outline: "none" };
  const lbl = { display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".05em" };
  const btnPrimary = { width: "100%", padding: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "11px", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,.3)" };

  const tabs = [
    { id: "profile",  label: "Profile",    icon: User },
    { id: "security", label: "Security",   icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <Layout>
      <style>{`
        .set-header { margin-bottom: 20px; }
        .set-layout { display: flex; gap: 20px; align-items: flex-start; }
        .set-tabs {
          width: 200px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 4px;
        }
        .set-tab {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border: none; border-radius: 12px;
          cursor: pointer; font-size: 13px; text-align: left;
          transition: all .15s; background: transparent; color: #64748b; font-weight: 500;
        }
        .set-tab:hover { background: rgba(0,0,0,.03); color: #0f172a; }
        .set-tab--active {
          background: white; color: var(--primary); font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .set-content {
          flex: 1; min-width: 0;
          background: white; border-radius: 16px;
          border: 1px solid var(--border); box-shadow: var(--shadow-sm);
          padding: 32px;
        }
        
        /* Form inputs */
        .set-input {
          width: 100%; padding: 12px 14px; border-radius: 10px;
          border: 1px solid var(--border-light); background: #f8fafc;
          font-size: 14px; color: #0f172a; outline: none; transition: border-color .2s;
        }
        .set-input:focus { border-color: var(--primary); background: white; }
        .set-label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .05em; }
        
        .set-btn {
          padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        }
        .set-btn:hover { box-shadow: 0 4px 12px rgba(99,102,241,.3); transform: translateY(-1px); }
        .set-btn:disabled { opacity: .7; cursor: not-allowed; transform: none; }

        .set-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
        .set-section-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .set-form { max-width: 420px; }

        .set-sites-layout { display: flex; gap: 24px; align-items: flex-start; }
        .set-sites-form { width: 280px; flex-shrink: 0; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid var(--border-light); }
        .set-sites-list { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .set-layout { flex-direction: column; gap: 14px; }
          .set-tabs {
            width: 100%; flex-direction: row;
            overflow-x: auto; gap: 8px;
            padding-bottom: 4px; -webkit-overflow-scrolling: touch;
          }
          .set-tab { 
            white-space: nowrap; padding: 10px 16px; font-size: 13px; border-radius: 10px;
            background: rgba(255,255,255,0.5); border: 1px solid var(--border-light);
          }
          .set-tab--active {
            background: white; border: 1px solid transparent;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .set-content { padding: 20px; }
          .set-sites-layout { flex-direction: column; gap: 16px; }
          .set-sites-form { width: 100%; }
        }
      `}</style>

      {/* Header */}
      <div className="set-header">
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "2px" }}>Settings</h1>
        <p style={{ color: "#64748b", fontSize: "12px" }}>Manage your profile, security, and work sites</p>
      </div>

      <div className="set-layout">
        {/* Tab navigation */}
        <div className="set-tabs">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`set-tab ${activeTab === tab.id ? "set-tab--active" : ""}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="set-content">

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div style={{ animation: "fadeInUp .2s ease" }}>
              <div className="set-section-header">
                <div className="set-section-icon" style={{ background: "rgba(99,102,241,.1)", color: "#6366f1" }}><User size={18} /></div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Admin Profile</h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Update your personal details</p>
                </div>
              </div>
              <form onSubmit={handleProfile} className="set-form">
                <div style={{ marginBottom: "16px" }}>
                  <label style={lbl}>Name *</label>
                  <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={inp} required
                    onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
                </div>
                <div style={{ marginBottom: "22px" }}>
                  <label style={lbl}>Phone Number</label>
                  <input value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} style={inp}
                    onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
                </div>
                <button type="submit" style={{ ...btnPrimary, opacity: savingProfile ? .7 : 1 }}>
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <div style={{ animation: "fadeInUp .2s ease" }}>
              <div className="set-section-header">
                <div className="set-section-icon" style={{ background: "rgba(16,185,129,.1)", color: "#10b981" }}><Shield size={18} /></div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Change Password</h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Update your admin login password</p>
                </div>
              </div>
              <form onSubmit={handlePassword} className="set-form">
                <div style={{ marginBottom: "16px" }}>
                  <label style={lbl}>Current Password</label>
                  <input type="password" value={pass.currentPassword} onChange={e => setPass({...pass, currentPassword: e.target.value})} style={inp} required minLength="6"
                    onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={lbl}>New Password</label>
                  <input type="password" value={pass.newPassword} onChange={e => setPass({...pass, newPassword: e.target.value})} style={inp} required minLength="6"
                    onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
                </div>
                <div style={{ marginBottom: "22px" }}>
                  <label style={lbl}>Confirm New Password</label>
                  <input type="password" value={pass.confirmPassword} onChange={e => setPass({...pass, confirmPassword: e.target.value})} style={inp} required minLength="6"
                    onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
                </div>
                <button type="submit" style={{ ...btnPrimary, opacity: savingPass ? .7 : 1 }}>
                  {savingPass ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>
          )}



          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div style={{ animation: "fadeInUp .2s ease" }}>
              <div className="set-section-header">
                <div className="set-section-icon" style={{ background: "rgba(99,102,241,.1)", color: "#6366f1" }}><Bell size={18} /></div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Push Notifications</h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Get instant alerts on your device</p>
                </div>
              </div>
              
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                  <div style={{
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: pushEnabled ? "#10b981" : "#ef4444",
                    boxShadow: pushEnabled ? "0 0 10px rgba(16,185,129,0.5)" : "none"
                  }}></div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>
                    Status: {pushEnabled ? "Enabled (Receiving Alerts)" : "Disabled"}
                  </div>
                </div>
                
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.5 }}>
                  Enable push notifications to receive daily attendance reminders at 6:00 PM, and alerts when important actions happen. Works on Android and iOS (16.4+).
                </p>
                
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={enablePushNotifications} disabled={enablingPush} style={{ ...btnPrimary, width: "auto", padding: "10px 20px" }}>
                    {enablingPush ? "Setting up..." : pushEnabled ? "Re-configure Push Notifications" : "Enable Push Notifications"}
                  </button>
                  {pushEnabled && (
                    <button onClick={testPushNotification} style={{ padding: "10px 20px", background: "white", border: "1px solid var(--border)", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#475569" }}>
                      Test Popup 🚀
                    </button>
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
