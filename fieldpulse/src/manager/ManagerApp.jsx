import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { useClock, fmtTime } from "../hooks/useClock";
import { useApp } from "../context/AppContext";
import { OverviewScreen } from "./OverviewScreen";
import { TeamScreen } from "./TeamScreen";
import { EmployeeDetailScreen } from "./EmployeeDetailScreen";
import { ReimbursementApprovals } from "./ReimbursementApprovals";
import { AttendanceScreen } from "./AttendanceScreen";
import { BarChart3, Users, DollarSign, Calendar, LogOut, Clock } from "lucide-react";

const TABS = [
  { id: "overview",       label: "Dashboard Overview", Icon: BarChart3 },
  { id: "team",           label: "Team Leaderboard",  Icon: Users },
  { id: "reimbursement",  label: "Funds & Expenses",  Icon: DollarSign },
  { id: "attendance",     label: "Daily Attendance",  Icon: Calendar },
];

export function ManagerApp() {
  const [tab, setTab] = useState("overview");
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const { logout } = useApp();
  const now = useClock();

  // Helper to handle switching tabs and resetting selection
  const handleTabChange = (newTab) => {
    setSelectedEmpId(null);
    setTab(newTab);
  };

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
          {/* Logo Brand Header */}
          <div style={{ padding: "28px 24px", borderBottom: `1px solid ${TOKENS.border}15` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src="/goldpe-logo.png"
                alt="GoldPE Logo"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  objectFit: "contain",
                  background: "#fff",
                  padding: 2,
                  boxShadow: `0 4px 12px ${TOKENS.gold}33`,
                }}
              />
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
                  FieldPulse
                </div>
                <div style={{ fontSize: 9.5, color: TOKENS.goldLight, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2 }}>
                  Manager Portal
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id && !selectedEmpId;
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: active ? `${TOKENS.gold}18` : "transparent",
                    color: active ? TOKENS.gold : "#9FB0C9",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="sidebar-tab-btn"
                >
                  <Icon size={18} color={active ? TOKENS.gold : "#8C9DB5"} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && (
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%", background: TOKENS.gold
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manager Card & Signout at Bottom */}
        <div style={{
          padding: "20px 16px",
          borderTop: `1px solid ${TOKENS.border}15`,
          background: "rgba(10,21,45,0.25)"
        }}>
          {/* Clock */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C7D2E3", fontSize: 12, marginBottom: 14, paddingLeft: 8 }}>
            <Clock size={14} color={TOKENS.gold} />
            <span>Server time: <b>{fmtTime(now)}</b></span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingLeft: 4 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: TOKENS.goldPale,
              border: `2.5px solid ${TOKENS.gold}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: TOKENS.gold, fontSize: 15, fontWeight: 700,
            }}>
              MS
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Mgr. Sharma
              </div>
              <div style={{ fontSize: 11, color: "#8C9DB5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Western Region Lead
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid rgba(255,255,255,0.15)`,
              background: "rgba(255,255,255,0.05)",
              color: "#E8896F",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="sidebar-logout"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Workspace Display Content */}
      <div style={{
        flex: 1,
        height: "100vh",
        overflowY: "auto",
        padding: "32px 48px",
        background: TOKENS.bgPage,
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          {selectedEmpId ? (
            <EmployeeDetailScreen
              empId={selectedEmpId}
              onBack={() => setSelectedEmpId(null)}
            />
          ) : (
            <>
              {tab === "overview"      && <OverviewScreen onSelectEmp={(id) => { setSelectedEmpId(id); }} />}
              {tab === "team"          && <TeamScreen     onSelectEmp={(id) => { setSelectedEmpId(id); }} />}
              {tab === "reimbursement" && <ReimbursementApprovals />}
              {tab === "attendance"    && <AttendanceScreen onSelectEmp={(id) => { setSelectedEmpId(id); }} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
