import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import {
  PieChart, Users, CalendarCheck,
  Calculator, Banknote, Sliders, LogOut,
  Bell, Search, ChevronRight, X, Menu, Download
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

// Only show 5 items in the bottom nav (most important)
const bottomNavItems = [
  { label: "Dashboard",  icon: PieChart,      path: "/dashboard" },
  { label: "Attendance", icon: CalendarCheck, path: "/attendance" },
  { label: "Workers",    icon: Users,         path: "/employees" },
  { label: "Advances",   icon: Banknote,      path: "/advances" },
  { label: "Payroll",    icon: Calculator,    path: "/payroll" },
];

export default function Layout({ children }) {
  const location  = useLocation();
  const adminName = localStorage.getItem("adminName") || "Admin";
  const initials  = adminName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "A";

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const hdrs = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    API.get("/notifications", { headers: hdrs })
      .then(res => setNotifications(res.data))
      .catch(() => {});

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // PWA Install Prompt Logic
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="layout-root">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="layout-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <Logo size="md" />
          <div className="sidebar-logo-sub">ATTENDANCE PORTAL</div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {navItems.map(item => {
            const Icon     = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
              >
                <Icon size={16} />
                <span className="sidebar-link-label">{item.label}</span>
                {isActive && <ChevronRight size={12} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom items (Logout) */}
        <div className="sidebar-bottom-actions">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="sidebar-logout-btn" style={{ marginBottom: "12px", background: "#f8fafc", color: "#0f172a", fontWeight: 600 }}>
              <Download size={16} />
              Install App
            </button>
          )}
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ─── */}
      <div className="layout-main">
        {/* Topbar */}
        <header className="top-header">
          {/* Mobile: hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} color="#0f172a" />
          </button>

          {/* Desktop: search */}
          <div className="search-bar">
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search workers, sites…" className="search-input" />
          </div>

          {/* Right side */}
          <div className="topbar-right">
            {/* Notifications */}
            <div className="notif-wrap" ref={dropdownRef}>
              <button
                onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) markAsRead(); }}
                className={`notif-btn ${showDropdown ? "notif-btn--active" : ""}`}
              >
                <Bell size={15} color="#64748b" />
              </button>
              {unreadCount > 0 && <div className="notif-badge" />}

              {showDropdown && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <span>Notifications</span>
                    <button onClick={() => setShowDropdown(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                      <X size={14} color="#64748b" />
                    </button>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No new notifications</div>
                    ) : notifications.map(n => (
                      <div key={n._id} className={`notif-item ${n.read ? "" : "notif-item--unread"}`}>
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">
                          {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <Link to="/settings" className="topbar-profile-link">
              <div className="topbar-avatar">{initials}</div>
              <div className="topbar-profile-info">
                <div className="topbar-profile-name">{adminName}</div>
                <div className="topbar-profile-role">Administrator</div>
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="layout-page-content">
          {children}
        </main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="mobile-bottom-nav">
        {bottomNavItems.map(item => {
          const Icon     = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
            >
              <div className="bottom-nav-icon-wrap">
                <Icon size={20} />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ─── MOBILE SLIDE-OVER MENU ─── */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="mobile-drawer-header">
              <Logo size="sm" />
              <button onClick={() => setMobileMenuOpen(false)} className="mobile-drawer-close">
                <X size={18} />
              </button>
            </div>

            {/* Admin info */}
            <div className="mobile-drawer-profile">
              <div className="sidebar-avatar">{initials}</div>
              <div>
                <div className="sidebar-profile-name">{adminName}</div>
                <div className="sidebar-profile-role">Administrator</div>
              </div>
            </div>

            {/* Nav links */}
            <div className="mobile-drawer-nav">
              {navItems.map(item => {
                const Icon     = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
                    style={{ fontSize: "15px", padding: "13px 16px" }}
                  >
                    <Icon size={18} />
                    <span className="sidebar-link-label">{item.label}</span>
                    {isActive && <ChevronRight size={14} />}
                  </Link>
                );
              })}
            </div>

            {/* Install / Logout */}
            <div style={{ padding: "0 12px 24px" }}>
              {deferredPrompt && (
                <button onClick={handleInstallClick} className="sidebar-logout-btn" style={{ marginBottom: "12px", background: "#f8fafc", color: "#0f172a", fontWeight: 600 }}>
                  <Download size={16} /> Install App
                </button>
              )}
              <button onClick={handleLogout} className="sidebar-logout-btn">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}