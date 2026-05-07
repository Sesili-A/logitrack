import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import Logo from "../components/Logo";
import API from "../services/api";

// Detect mobile browsers
const isMobile = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

export default function Login() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [name, setName]           = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [mode, setMode]           = useState("login"); // "login" | "register"

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
      return;
    }

    // Handle redirect result after mobile Google sign-in
    const handleRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          const token = await result.user.getIdToken();
          const res = await API.post("/auth/google", { token });
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("adminName", res.data.user?.name || "Admin");
          localStorage.setItem("adminPhone", res.data.user?.phone || "");
          window.location.href = "/dashboard";
        }
      } catch (err) {
        console.error("Redirect result error:", err);
        setError("Google sign-in failed. Please ensure you are authorized.");
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("adminName",  res.data.user?.name  || "Admin");
      localStorage.setItem("adminPhone", res.data.user?.phone || "");
      window.location.href = "/dashboard";
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim()) return setError("Name is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPwd) return setError("Passwords do not match.");
    setLoading(true); setError("");
    try {
      // Register then auto-login
      await API.post("/auth/register", { name, email, password, role: "admin" });
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("adminName",  res.data.user?.name  || name);
      localStorage.setItem("adminPhone", res.data.user?.phone || "");
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Email may already be in use.");
    } finally { setLoading(false); }
  };

  const handleGoogleSuccess = async () => {
    setLoading(true);
    setError("");
    try {
      if (isMobile()) {
        // Mobile: use redirect (popups are blocked on mobile browsers)
        await signInWithRedirect(auth, googleProvider);
        // Page will reload — result is handled in useEffect above
      } else {
        // Desktop: use popup for better UX
        const result = await signInWithPopup(auth, googleProvider);
        const token = await result.user.getIdToken();
        const res = await API.post("/auth/google", { token });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("adminName", res.data.user?.name || "Admin");
        localStorage.setItem("adminPhone", res.data.user?.phone || "");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed. Please ensure you are authorized.");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") mode === "login" ? handleLogin() : handleRegister();
  };

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
          {/* ── Mode tabs ── */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "4px", marginBottom: "24px" }}>
            {[("login"), ("register")].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "9px", border: "none", borderRadius: "9px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  background: mode === m ? "white" : "transparent",
                  color: mode === m ? "#0f172a" : "#94a3b8",
                  boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                  transition: "all .2s",
                }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ color: "white", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              {mode === "login" ? "Sign in to your admin account" : "Set up your LogiTrack admin portal"}
            </p>
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

          {/* ── Register: Name field ── */}
          {mode === "register" && (
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "7px" }}>Full Name</label>
              <input type="text" placeholder="John Admin"
                value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown}
                style={fieldStyle}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "7px" }}>Email Address</label>
            <input type="email" placeholder="admin@company.com"
              value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
              style={fieldStyle}
              onFocus={e => (e.target.style.borderColor = "#6366f1")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: mode === "register" ? "18px" : "26px" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "7px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
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

          {/* Register: Confirm Password */}
          {mode === "register" && (
            <div style={{ marginBottom: "26px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "7px" }}>Confirm Password</label>
              <input type="password" placeholder="Re-enter your password"
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} onKeyDown={handleKeyDown}
                style={fieldStyle}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
            </div>
          )}

          {/* Submit */}
          <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: mode === "login" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "linear-gradient(135deg, #10b981, #059669)",
              border: "none", borderRadius: "12px", color: "white",
              fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? .7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: mode === "login" ? "0 6px 20px rgba(99,102,241,.35)" : "0 6px 20px rgba(16,185,129,.35)",
              transition: "all .2s",
            }}>
            {loading ? (
              <div style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            ) : (
              <><LogIn size={17} /> {mode === "login" ? "Sign In" : "Create Account"}</>
            )}
          </button>

          {/* Google Sign-In — only on login mode */}
          {mode === "login" && (
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 500 }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  onClick={handleGoogleSuccess}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    width: "100%", padding: "12px", background: "white", color: "#0f172a",
                    border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600,
                    cursor: "pointer", transition: "all .2s",
                  }}
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px", height: "20px" }} />
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

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