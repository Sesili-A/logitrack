import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  PieChart, Users, CalendarCheck,
  Calculator, Banknote, Sliders, LogOut,
  Bell, Search, ChevronRight, MapPin, X
} from "lucide-react";
import API from "../services/api";

const navItems = [
  { label: "Dashboard",      icon: PieChart,      path: "/dashboard" },
  { label: "Attendance",     icon: CalendarCheck, path: "/attendance" },
  { label: "Workers",        icon: Users,         path: "/employees" },
  { label: "Advances",       icon: Banknote,      path: "/advances" },
  { label: "Weekly Payroll", icon: Calculator,    path: "/payroll" },
  { label: "Settings",       icon: Sliders,       path: "/settings" },
];

export default function Layout({ children }) {
  const location  = useLocation();
  const adminName = localStorage.getItem("adminName") || "Admin";
  const initials  = adminName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "A";
  
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fetch notifications
    const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    API.get("/notifications", { headers: hdrs })
      .then(res => setNotifications(res.data))
      .catch(() => {});

    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      await API.put("/notifications/read", {}, { headers: hdrs });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside className="layout-sidebar" style={{
        width: "235px", background: "#0f172a",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh",
        zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <img 
              src="/logo.png" 
              alt="logiTrack" 
              style={{ 
                height: "40px", 
                width: "fit-content", 
                objectFit: "contain", 
                background: "white", 
                padding: "6px 12px", 
                borderRadius: "8px" 
              }} 
            />
            <div style={{ color: "#475569", fontSize: "10px", letterSpacing: "0.15em", fontWeight: 700 }}>
              ATTENDANCE PORTAL
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{
            color: "#475569", fontSize: "10px", fontWeight: 700,
            letterSpacing: "0.1em", padding: "8px 8px 4px", textTransform: "uppercase",
          }}>
            Main Menu
          </div>
          {navItems.map(item => {
            const Icon     = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                textDecoration: "none", transition: "all 0.2s ease",
                background: isActive ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                color: isActive ? "white" : "#94a3b8",
                fontWeight: isActive ? 600 : 400, fontSize: "13.5px",
                boxShadow: isActive ? "0 4px 15px rgba(99,102,241,0.35)" : "none",
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "white"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={12} />}
              </Link>
            );
          })}
        </nav>

        {/* Admin profile strip */}
        <div style={{
          margin: "0 8px 8px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px", padding: "12px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: "13px", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ color: "white", fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {adminName}
            </div>
            <div style={{ color: "#475569", fontSize: "10px" }}>Administrator</div>
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: "0 8px 12px" }}>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: "10px",
            width: "100%", padding: "10px 12px", borderRadius: "10px",
            border: "none", background: "rgba(239,68,68,0.1)", color: "#f87171",
            cursor: "pointer", fontSize: "13px", fontWeight: 500, transition: "all 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content" style={{ flex: 1, marginLeft: "235px", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <header className="top-header" style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0", padding: "0 26px", height: "58px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div className="search-bar" style={{
            display: "flex", alignItems: "center", gap: "9px",
            background: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: "10px", padding: "8px 13px", width: "260px",
          }}>
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search workers, sites…" style={{
              border: "none", background: "transparent", outline: "none",
              fontSize: "13px", color: "#0f172a", width: "100%",
            }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button 
                onClick={() => { setShowDropdown(!showDropdown); if(!showDropdown) markAsRead(); }}
                style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: showDropdown ? "#e2e8f0" : "#f8fafc", border: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  transition: "all 0.2s"
                }}>
                <Bell size={15} color="#64748b" />
              </button>
              {unreadCount > 0 && (
                <div style={{
                  position: "absolute", top: "8px", right: "8px",
                  width: "6px", height: "6px", background: "#ef4444",
                  borderRadius: "50%", border: "2px solid white",
                }} />
              )}
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <div style={{
                  position: "absolute", top: "110%", right: 0, width: "320px",
                  background: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)", zIndex: 100,
                  animation: "fadeInUp 0.2s ease"
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Notifications</span>
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        No new notifications
                      </div>
                    ) : notifications.map(n => (
                      <div key={n._id} style={{
                        padding: "14px 16px", borderBottom: "1px solid #f1f5f9",
                        background: n.read ? "transparent" : "#f8fafc"
                      }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{n.title}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>
                          {new Date(n.createdAt).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"})}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link to="/settings" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: "13px",
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{adminName}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Administrator</div>
              </div>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px", animation: "fadeInUp 0.3s ease" }}>
          {children}
        </main>
      </div>
    </div>
  );
}