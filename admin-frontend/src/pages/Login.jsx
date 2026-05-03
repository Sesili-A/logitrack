import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import Logo from "../components/Logo";
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
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/google", { token: credentialResponse.credential });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("adminName",  res.data.user?.name  || "Admin");
      localStorage.setItem("adminPhone", res.data.user?.phone || "");
      window.location.href = "/dashboard";
    } catch {
      setError("Google sign-in failed. Please ensure you are authorized.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  const fieldStyle = {
    width: "100%", padding: "13px 16px",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px", color: "white", fontSize: "14px", outline: "none",
    transition: "border-color .2s",
  };

  return (
    <div className="login-wrapper">
      {/* Background blobs */}
      <div className="login-bg-blob" style={{ top: "-20%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)" }} />
      <div className="login-bg-blob" style={{ bottom: "-20%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,.1) 0%, transparent 70%)" }} />

      {/* Left: Branding */}
      <div className="login-left">
        <div className="login-left-logo">
          <Logo size="lg" />
          <div style={{ color: "#94a3b8", fontSize: "14px", letterSpacing: ".04em", fontWeight: 500, paddingLeft: "6px" }}>
            Attendance Portal
          </div>
        </div>

        <h1>
          Track attendance<br />
          <span>effortlessly.</span>
        </h1>

        <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: 1.6, maxWidth: "380px" }}>
          A powerful, intuitive platform for managing your team's attendance, generating reports, and keeping everything organized in one place.
        </p>

        <div className="login-stats">
          {[
            { value: "10K+", label: "Employees" },
            { value: "99.9%", label: "Uptime" },
            { value: "500+", label: "Companies" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "22px" }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="login-right">
        <div className="login-box">
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "white", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>Welcome back</h2>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>Sign in to your admin account</p>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)",
              borderRadius: "10px", padding: "12px 16px", color: "#fca5a5",
              fontSize: "13px", marginBottom: "18px",
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "7px" }}>
              Email Address
            </label>
            <input type="email" placeholder="admin@company.com"
              value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
              style={fieldStyle}
              onFocus={e => (e.target.style.borderColor = "#6366f1")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "26px" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "7px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                style={{ ...fieldStyle, paddingRight: "48px" }}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", padding: "4px" }}>
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleLogin} disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: "12px", color: "white",
              fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? .7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: "0 6px 20px rgba(99,102,241,.35)", transition: "all .2s",
            }}>
            {loading ? (
              <div style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            ) : (
              <><LogIn size={17} /> Sign In</>
            )}
          </button>

          {/* Google Sign-In */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 500 }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            </div>
            
            <div style={{ display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in failed.")}
                theme="filled_black"
                shape="rectangular"
                text="signin_with"
                size="large"
              />
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#475569", fontSize: "13px", marginTop: "22px" }}>
            Forgot your password?{" "}
            <span style={{ color: "#818cf8", cursor: "pointer" }}>Reset it here</span>
          </p>
        </div>
      </div>

      <style>{`input::placeholder { color: #475569; }`}</style>
    </div>
  );
}