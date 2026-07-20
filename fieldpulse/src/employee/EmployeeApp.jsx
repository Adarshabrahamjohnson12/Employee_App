import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { useClock, fmtTime } from "../hooks/useClock";
import { useIsMobile } from "../hooks/useIsMobile";
import { useApp } from "../context/AppContext";
import { DashboardScreen } from "./DashboardScreen";
import { CheckInScreen } from "./CheckInScreen";
import { TasksScreen } from "./TasksScreen";
import { ReimbursementScreen } from "./ReimbursementScreen";
import { ProfileScreen } from "./ProfileScreen";
import { EverydayReportScreen } from "./EverydayReportScreen";
import { getImageUrl } from "../api/client";
import { Home, MapPin, FileText, ListChecks, Wallet, User, LogOut, Clock, CalendarDays } from "lucide-react";
import { LeaveScreen } from "./LeaveScreen";

const TABS = [
  { id: "dashboard",     label: "Home",     Icon: Home },
  { id: "checkin",       label: "Check In", Icon: MapPin },
  { id: "leave",         label: "Leave",    Icon: CalendarDays },
  { id: "report",        label: "Report",   Icon: FileText },
  { id: "tasks",         label: "Tasks",    Icon: ListChecks },
  { id: "reimbursement", label: "Expense",  Icon: Wallet },
  { id: "profile",       label: "Profile",  Icon: User },
];

export function EmployeeApp() {
  const [tab, setTab] = useState("dashboard");
  const { currentUser, employee: emp, logout } = useApp();
  const now = useClock();
  const isMobile = useIsMobile();
  if (!emp) return null;

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {emp.selfie ? (
              <img src={getImageUrl(emp.selfie)} alt="selfie" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TOKENS.gold}` }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: TOKENS.navySoft, border: `2px solid ${TOKENS.gold}`, display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.gold, fontSize: 13, fontWeight: 700 }}>
                {emp.initials}
              </div>
            )}
            <div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{emp.name}</div>
              <div style={{ fontSize: 10, color: TOKENS.goldLight, fontWeight: 600, letterSpacing: 0.5 }}>{emp.role}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#C7D2E3", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} color={TOKENS.gold} />
              <span style={{ fontWeight: 700, color: TOKENS.gold }}>{fmtTime(now)}</span>
            </div>
            <button onClick={logout} style={{
              background: "rgba(232,137,111,0.15)", border: "1px solid rgba(232,137,111,0.3)",
              borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center",
              color: "#E8896F", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 80px", WebkitOverflowScrolling: "touch" }}>
          <div key={tab} className="screen-enter">
            {tab === "dashboard"     && <DashboardScreen     emp={emp} goTab={setTab} />}
            {tab === "checkin"       && <CheckInScreen       emp={emp} />}
            {tab === "leave"         && <LeaveScreen         emp={emp} />}
            {tab === "report"        && <EverydayReportScreen />}
            {tab === "tasks"         && <TasksScreen         emp={emp} />}
            {tab === "reimbursement" && <ReimbursementScreen emp={emp} />}
            {tab === "profile"       && <ProfileScreen       emp={emp} />}
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
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
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
      <div style={{ width: 280, background: `linear-gradient(180deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: `1px solid ${TOKENS.border}15`, boxShadow: "4px 0 24px rgba(10,25,50,0.12)", flexShrink: 0 }}>
        <div>
          <div style={{ padding: "28px 24px", borderBottom: `1px solid ${TOKENS.border}15` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/goldpe-logo.png" alt="GoldPE Logo" className="logo-glow" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain", background: "#fff", padding: 2, boxShadow: `0 4px 12px ${TOKENS.gold}33` }} />
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>FieldPulse</div>
                <div style={{ fontSize: 9.5, color: TOKENS.goldLight, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2 }}>Western Region</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: active ? `${TOKENS.gold}18` : "transparent", color: active ? TOKENS.gold : "#9FB0C9", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: active ? 700 : 500, textAlign: "left", cursor: "pointer", transition: "all 0.15s ease" }} className="sidebar-tab-btn">
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
            <span>Shift clock: <b>{fmtTime(now)}</b></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingLeft: 4 }}>
            {emp.selfie ? (
              <img src={getImageUrl(emp.selfie)} alt="selfie" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${TOKENS.gold}` }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: TOKENS.navySoft, border: `2.5px solid ${TOKENS.gold}`, display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.gold, fontSize: 14, fontWeight: 700 }}>{emp.initials}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
              <div style={{ fontSize: 11, color: "#8C9DB5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "10px 16px", borderRadius: 10, border: `1px solid rgba(255,255,255,0.15)`, background: "rgba(255,255,255,0.05)", color: "#E8896F", fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease" }} className="sidebar-logout">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
      <div style={{ flex: 1, height: "100vh", overflowY: "auto", padding: "32px 48px", background: TOKENS.bgPage }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div key={tab} className="screen-enter">
            {tab === "dashboard"     && <DashboardScreen     emp={emp} goTab={setTab} />}
            {tab === "checkin"       && <CheckInScreen       emp={emp} />}
            {tab === "leave"         && <LeaveScreen         emp={emp} />}
            {tab === "report"        && <EverydayReportScreen />}
            {tab === "tasks"         && <TasksScreen         emp={emp} />}
            {tab === "reimbursement" && <ReimbursementScreen emp={emp} />}
            {tab === "profile"       && <ProfileScreen       emp={emp} />}
          </div>
        </div>
      </div>
    </div>
  );
}
