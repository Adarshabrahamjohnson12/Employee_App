import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { useClock, fmtTime } from "../hooks/useClock";
import { useIsMobile } from "../hooks/useIsMobile";
import { useApp } from "../context/AppContext";
import { OverviewScreen } from "./OverviewScreen";
import { TeamScreen } from "./TeamScreen";
import { EmployeeDetailScreen } from "./EmployeeDetailScreen";
import { ReimbursementApprovals } from "./ReimbursementApprovals";
import { ManagerLeaveScreen } from "./ManagerLeaveScreen";
import { AttendanceScreen } from "./AttendanceScreen";
import { ManagerReportsCalendarScreen } from "./ManagerReportsCalendarScreen";
import { BarChart3, Users, CalendarDays, Wallet, Calendar, LogOut, Clock, ChevronLeft, FileText } from "lucide-react";

const TABS = [
  { id: "overview",      label: "Overview",           Icon: BarChart3 },
  { id: "team",          label: "Team",               Icon: Users },
  { id: "reports",       label: "Daily Reports",      Icon: CalendarDays },
  { id: "reimbursement", label: "Expenses",           Icon: Wallet },
  { id: "leaves",        label: "Leave Applications", Icon: FileText },
  { id: "attendance",    label: "Attendance",         Icon: Calendar },
];

export function ManagerApp() {
  const [tab, setTab] = useState("overview");
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const { logout } = useApp();
  const now = useClock();
  const isMobile = useIsMobile();

  const [managerPic, setManagerPic] = useState(() => localStorage.getItem("manager_profile_pic") || "");
  const fileInputRef = React.useRef();

  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      localStorage.setItem("manager_profile_pic", ev.target.result);
      setManagerPic(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTabChange = (newTab) => {
    setSelectedEmpId(null);
    setTab(newTab);
  };

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: TOKENS.bgPage, overflow: "hidden" }}>
        {/* Mobile Top Header */}
        <div style={{
          background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          boxShadow: "0 2px 12px rgba(10,25,50,0.2)",
        }}>
          {/* Back button or Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selectedEmpId ? (
              <button onClick={() => setSelectedEmpId(null)} style={{
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
                padding: "6px 10px", display: "flex", alignItems: "center", gap: 4,
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <>
                <img src="/goldpe-logo.png" alt="Logo" style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", padding: 2 }} />
                <div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>GoldPE WIBIL</div>
                  <div style={{ fontSize: 9, color: TOKENS.goldLight, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>Manager Portal</div>
                </div>
              </>
            )}
          </div>

          {/* Right: clock + sign out */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#C7D2E3", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} color={TOKENS.gold} />
              <span style={{ fontWeight: 700, color: TOKENS.gold }}>{fmtTime(now)}</span>
            </div>
            <button onClick={logout} style={{
              background: "rgba(232,137,111,0.15)", border: "1px solid rgba(232,137,111,0.3)",
              borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4,
              color: "#E8896F", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 80px", WebkitOverflowScrolling: "touch" }}>
          <div key={selectedEmpId || tab} className="screen-enter">
            {selectedEmpId ? (
              <EmployeeDetailScreen empId={selectedEmpId} onBack={() => setSelectedEmpId(null)} />
            ) : (
              <>
                {tab === "overview"      && <OverviewScreen onSelectEmp={(id) => setSelectedEmpId(id)} />}
                {tab === "team"          && <TeamScreen onSelectEmp={(id) => setSelectedEmpId(id)} />}
                {tab === "reports"       && <ManagerReportsCalendarScreen />}
                {tab === "reimbursement" && <ReimbursementApprovals />}
                {tab === "leaves"        && <ManagerLeaveScreen />}
                {tab === "attendance"    && <AttendanceScreen onSelectEmp={(id) => setSelectedEmpId(id)} />}
              </>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderTop: `1px solid ${TOKENS.border}`,
          display: "flex",
          boxShadow: "0 -4px 20px rgba(10,25,50,0.10)",
          zIndex: 100,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id && !selectedEmpId;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "10px 4px 8px",
                  border: "none", background: "none", cursor: "pointer",
                  color: active ? TOKENS.navyDeep : TOKENS.muted,
                  position: "relative",
                }}
              >
                {active && (
                  <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: 28, height: 3, borderRadius: 2, background: TOKENS.navyDeep,
                  }} />
                )}
                <Icon size={20} color={active ? TOKENS.navyDeep : TOKENS.muted} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, marginTop: 3, letterSpacing: 0.2 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT (unchanged) ─────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: TOKENS.cream }}>
      {/* Desktop Sidebar Nav */}
      <div style={{
        width: 280,
        background: `linear-gradient(180deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: `1px solid ${TOKENS.border}15`,
        boxShadow: "4px 0 24px rgba(10,25,50,0.12)",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ padding: "28px 24px", borderBottom: `1px solid ${TOKENS.border}15` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/goldpe-logo.png" alt="GoldPE Logo" className="logo-glow" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain", background: "#fff", padding: 2, boxShadow: `0 4px 12px ${TOKENS.gold}33` }} />
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>GoldPE WIBIL</div>
                <div style={{ fontSize: 9.5, color: TOKENS.goldLight, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2 }}>Manager Portal</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id && !selectedEmpId;
              return (
                <button key={id} onClick={() => handleTabChange(id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: active ? `${TOKENS.gold}18` : "transparent", color: active ? TOKENS.gold : "#9FB0C9", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: active ? 700 : 500, textAlign: "left", cursor: "pointer", transition: "all 0.15s ease" }} className="sidebar-tab-btn">
                  <Icon size={18} color={active ? TOKENS.gold : "#8C9DB5"} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: TOKENS.gold }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "20px 16px", borderTop: `1px solid ${TOKENS.border}15`, background: "rgba(10,21,45,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C7D2E3", fontSize: 12, marginBottom: 14, paddingLeft: 8 }}>
            <Clock size={14} color={TOKENS.gold} />
            <span>Server time: <b>{fmtTime(now)}</b></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingLeft: 4 }}>
            <div onClick={() => fileInputRef.current.click()} style={{ width: 40, height: 40, borderRadius: "50%", background: TOKENS.goldPale, border: `2.5px solid ${TOKENS.gold}`, display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.gold, fontSize: 15, fontWeight: 700, cursor: "pointer", overflow: "hidden" }} title="Click to upload profile photo">
              {managerPic ? <img src={managerPic} alt="Manager Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "VR"}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePicChange} style={{ display: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Vijay Rajagopal</div>
              <div style={{ fontSize: 11, color: "#8C9DB5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Western Region Lead</div>
            </div>
          </div>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "10px 16px", borderRadius: 10, border: `1px solid rgba(255,255,255,0.15)`, background: "rgba(255,255,255,0.05)", color: "#E8896F", fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease" }} className="sidebar-logout">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, height: "100vh", overflowY: "auto", padding: "32px 48px", background: TOKENS.bgPage }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div key={selectedEmpId || tab} className="screen-enter">
            {selectedEmpId ? (
              <EmployeeDetailScreen empId={selectedEmpId} onBack={() => setSelectedEmpId(null)} />
            ) : (
              <>
                {tab === "overview"      && <OverviewScreen onSelectEmp={(id) => setSelectedEmpId(id)} />}
                {tab === "team"          && <TeamScreen onSelectEmp={(id) => setSelectedEmpId(id)} />}
                {tab === "reports"       && <ManagerReportsCalendarScreen />}
                {tab === "reimbursement" && <ReimbursementApprovals />}
                {tab === "leaves"        && <ManagerLeaveScreen />}
                {tab === "attendance"    && <AttendanceScreen onSelectEmp={(id) => setSelectedEmpId(id)} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
