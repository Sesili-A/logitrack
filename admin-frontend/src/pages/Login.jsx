import { useState } from "react";
import { Eye, EyeOff, LogIn, ClipboardCheck } from "lucide-react";
import API from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("adminName",  res.data.user?.name  || "Admin");
      localStorage.setItem("adminPhone", res.data.user?.phone || "");
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Left panel (branding) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "50px" }}>
          <img 
            src="/logo.png" 
            alt="logiTrack Logo" 
            style={{ 
              height: "56px", 
              width: "fit-content",
              objectFit: "contain", 
              borderRadius: "12px", 
              background: "white", 
              padding: "8px 16px" 
            }} 
          />
          <div style={{ color: "#94a3b8", fontSize: "14px", letterSpacing: "0.05em", fontWeight: 500 }}>
            Attendance Portal
          </div>
        </div>

        <h1
          style={{
            color: "white",
            fontSize: "48px",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-1px",
            marginBottom: "20px",
          }}
        >
          Track attendance
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            effortlessly.
          </span>
        </h1>

        <p style={{ color: "#94a3b8", fontSize: "16px", lineHeight: 1.6, maxWidth: "400px" }}>
          A powerful, intuitive platform for managing your team's attendance, generating reports, and keeping everything organized in one place.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "32px", marginTop: "48px" }}>
          {[
            { value: "10K+", label: "Employees" },
            { value: "99.9%", label: "Uptime" },
            { value: "500+", label: "Companies" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "24px" }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: "13px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel (form) */}
      <div
        style={{
          width: "480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "40px",
            width: "100%",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>
              Welcome back
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Sign in to your admin account
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "#fca5a5",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                color: "white",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%",
                  padding: "12px 48px 12px 16px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 8px 25px rgba(99,102,241,0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>

          <p style={{ textAlign: "center", color: "#475569", fontSize: "13px", marginTop: "24px" }}>
            Forgot your password?{" "}
            <span style={{ color: "#818cf8", cursor: "pointer" }}>Reset it here</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}