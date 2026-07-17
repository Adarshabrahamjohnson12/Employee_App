import React, { useState } from "react";
import { TOKENS } from "./tokens";
import { AppProvider, useApp } from "./context/AppContext";
import { EmployeeApp } from "./employee/EmployeeApp";
import { ManagerApp } from "./manager/ManagerApp";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";

// ── Phone frame ────────────────────────────────────────────────────────────
function PhoneFrame({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: TOKENS.bgPage, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "28px 12px 40px" }}>
      <div style={{ width: 390, background: TOKENS.cream, borderRadius: 38, overflow: "hidden", boxShadow: "0 40px 80px rgba(10,20,40,0.32)", border: "8px solid #16233A", position: "relative", minHeight: 780, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// ── Login screen ───────────────────────────────────────────────────────────
function LoginScreen() {
  const { login, loading, error } = useApp();
  
  // Login states
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr("");
    if (!empId.trim() || !password) { setLocalErr("Please enter both Employee ID and password."); return; }
    try { await login(empId.trim().toUpperCase(), password); }
    catch (err) { setLocalErr(err.message); }
  };

  // Quick-fill demo credentials
  const DEMOS = [
    { label: "Arjun (Field Agent)", id: "FP-WR-001", pw: "arjun123" },
    { label: "Sneha (Mach. Lead)",  id: "FP-WR-004", pw: "sneha123" },
    { label: "Manager",             id: "MANAGER",    pw: "manager@123" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexWrap: "wrap", background: TOKENS.cream }}>
      {/* Left side: Premium Branding panel */}
      <div style={{
        flex: "1 1 450px",
        background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px 40px", color: "#fff", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(201,162,39,0.08)" }} />
        <div style={{ position: "absolute", left: -30, bottom: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(201,162,39,0.05)" }} />

        <div style={{ maxWidth: 460, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <img
            src="/goldpe-logo.png"
            alt="GoldPE Logo"
            className="logo-glow"
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              objectFit: "contain",
              background: "#fff",
              padding: 6,
              marginBottom: 28,
              boxShadow: `0 8px 30px ${TOKENS.gold}44`,
            }}
          />
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 40, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            FieldPulse
          </h1>
          <p style={{ fontSize: 16, color: "#93A4C0", marginTop: 8, lineHeight: 1.5 }}>
            Enterprise field agent tracking, real-time geo-validation, and performance analytics for GoldPE Western Region.
          </p>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TOKENS.gold }} />
              <span style={{ fontSize: 14, color: "#C7D2E3" }}>Live GPS coordinates & shift logging</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TOKENS.gold }} />
              <span style={{ fontSize: 14, color: "#C7D2E3" }}>Interactive, team-based task manager</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TOKENS.gold }} />
              <span style={{ fontSize: 14, color: "#C7D2E3" }}>Reimbursements tracking with secure receipt attachments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login form */}
      <div style={{
        flex: "1 1 450px",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", background: TOKENS.cream
      }}>
        <div style={{ width: "100%", maxWidth: 400 }} className="screen-enter">
          <div style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Welcome back</div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 700, color: TOKENS.navyDeep, margin: "0 0 24px" }}>Sign In to Portal</h2>

          <form onSubmit={handleSubmit}>
            {/* Employee ID */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>EMPLOYEE ID / USERNAME</label>
            <input
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              placeholder="e.g. FP-WR-001 or MANAGER"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${TOKENS.border}`, fontSize: 14, color: TOKENS.ink, outline: "none", background: "#fff", marginBottom: 16 }}
            />

            {/* Password */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>PASSWORD</label>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: "100%", padding: "14px 44px 14px 16px", borderRadius: 12, border: `1.5px solid ${TOKENS.border}`, fontSize: 14, color: TOKENS.ink, outline: "none", background: "#fff" }}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer" }}>
                {showPw ? <EyeOff size={18} color={TOKENS.muted} /> : <Eye size={18} color={TOKENS.muted} />}
              </button>
            </div>

            {/* Error */}
            {(localErr || error) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: TOKENS.dangerBg, border: `1px solid ${TOKENS.danger}30`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <AlertCircle size={17} color={TOKENS.danger} />
                <span style={{ fontSize: 13, color: TOKENS.danger, fontWeight: 600 }}>{localErr || error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? TOKENS.muted : TOKENS.navyDeep, color: "#fff", border: "none", borderRadius: 13, padding: "14px 18px", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: loading ? "default" : "pointer", marginTop: 8, transition: "background 0.2s" }}>
              {loading ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Authenticating…</> : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          {/* Quick demo selection */}
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>Quick demo profiles</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMOS.map(d => (
                <button key={d.id} type="button" onClick={() => { setEmpId(d.id); setPassword(d.pw); setLocalErr(""); }} style={{ background: "#fff", border: `1.5px solid ${TOKENS.border}`, borderRadius: 12, padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "all 0.15s ease", outline: "none" }} className="demo-login-btn">
                  <span style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>{d.label}</span>
                  <span style={{ fontSize: 11, color: TOKENS.muted, fontFamily: "monospace" }}>{d.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading screen ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: TOKENS.cream }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${TOKENS.goldPale}`, borderTop: `4px solid ${TOKENS.gold}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <div style={{ fontSize: 14, color: TOKENS.muted, fontWeight: 500 }}>Synchronizing data…</div>
    </div>
  );
}

// ── Root app ───────────────────────────────────────────────────────────────
function AppInner() {
  const { currentUser, loading, employee, team } = useApp();
  if (!currentUser) return <LoginScreen />;
  if (loading && !employee && team.length === 0) return <LoadingScreen />;
  if (currentUser.role === "manager") return <ManagerApp />;
  return <EmployeeApp />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
