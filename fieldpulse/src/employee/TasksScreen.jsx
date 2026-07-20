import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { captureLocation } from "../hooks/useGPS";
import { fmtTime } from "../hooks/useClock";
import { useApp } from "../context/AppContext";
import { MapPin, Navigation, CheckCircle2, Circle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function TasksScreen({ emp }) {
  const { tasks, completeTask } = useApp();
  const myTasks = tasks || [];
  const [capturing, setCapturing] = useState(null);
  
  // Modal states
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [jobStatus, setJobStatus] = useState("Completed");
  const [selectedTeam, setSelectedTeam] = useState("Software");
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const done = myTasks.filter((t) => t.status === "done").length;
  const pending = myTasks.length - done;

  const dotsData = [
    { name: "Done",    value: done,    color: TOKENS.gold },
    { name: "Pending", value: pending, color: "#D9D2BE" },
  ];

  const handleOpenCompleteModal = (taskId) => {
    setActiveTaskId(taskId);
    setJobStatus("Completed");
    setSelectedTeam("Software");
    setRemarks("");
    setErrorMsg("");
  };

  const handleSubmitCompletion = () => {
    if (!remarks.trim()) {
      setErrorMsg("Please provide details/remarks of completed work.");
      return;
    }
    setErrorMsg("");
    setCapturing(activeTaskId);

    // Capture real device coordinates and dispatch
    captureLocation((loc) => {
      completeTask(activeTaskId, loc, {
        status: jobStatus,
        team: selectedTeam,
        remarks: remarks.trim()
      })
      .then(() => {
        setActiveTaskId(null);
      })
      .finally(() => {
        setCapturing(null);
      });
    });
  };

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: "flex", gap: 12 }}>
        <Card style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie data={dotsData} dataKey="value" innerRadius={30} outerRadius={48} paddingAngle={3}>
                {dotsData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: TOKENS.gold, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>{done} completed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#D9D2BE", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>{pending} pending</span>
          </div>
          <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 4 }}>
            Client: <strong>{emp.clientName}</strong>
          </div>
        </Card>
      </div>

      <SectionLabel>Assigned tasks — geo-verified</SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {myTasks.map((t) => (
          <Card key={t.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: TOKENS.ink }}>{t.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                  <MapPin size={12} color={TOKENS.muted} />
                  <span style={{ fontSize: 12, color: TOKENS.muted }}>{t.location}</span>
                </div>
                <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 3 }}>
                  Ref: {t.clientRef || t.client_ref} · {t.distance}
                </div>
                {(t.client_name || t.clientName || t.project_name || t.projectName) && (
                  <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                    {(t.client_name || t.clientName) && (
                      <span style={{ background: `${TOKENS.navyDeep}10`, color: TOKENS.navyDeep, borderRadius: 6, padding: "2px 8px", fontSize: 10.5, fontWeight: 700 }}>
                        👤 {t.client_name || t.clientName}
                      </span>
                    )}
                    {(t.project_name || t.projectName) && (
                      <span style={{ background: `${TOKENS.gold}18`, color: TOKENS.navyDeep, borderRadius: 6, padding: "2px 8px", fontSize: 10.5, fontWeight: 700 }}>
                        📁 {t.project_name || t.projectName}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <StatusPill status={t.status} />
            </div>

            {/* Completion Report Display */}
            {t.status === "done" && (t.completion_status || t.completion_remarks) && (
              <div style={{
                marginTop: 12,
                padding: "10px 14px",
                background: TOKENS.cream,
                borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`,
                fontSize: 12.5,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>Status: <strong style={{ color: t.completion_status === "Completed" ? TOKENS.success : TOKENS.danger }}>{t.completion_status}</strong></span>
                  <span>Team: <strong>{t.completion_team}</strong></span>
                </div>
                <div style={{ color: TOKENS.ink, lineHeight: 1.4 }}>
                  {t.completion_remarks}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 11.5, color: TOKENS.muted, fontWeight: 500 }}>{t.time}</span>
              {t.status === "pending" && (
                <button
                  onClick={() => handleOpenCompleteModal(t.id)}
                  style={{
                    background: TOKENS.navyDeep, color: "#fff", border: "none",
                    borderRadius: 10, padding: "8px 14px", fontWeight: 700,
                    fontSize: 11.5, display: "flex", alignItems: "center",
                    gap: 5, cursor: "pointer",
                  }}
                >
                  <Navigation size={12} /> Complete Task
                </button>
              )}
              {t.status === "done" && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: TOKENS.success, fontSize: 12, fontWeight: 600 }}>
                  <CheckCircle2 size={14} /> Geo-verified Report Submitted
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Styled Task Completion Modal Dialog */}
      {activeTaskId && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(10,21,45,0.45)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20,
            width: "100%", maxWidth: 440, padding: 24,
            boxShadow: "0 24px 60px rgba(10,25,50,0.22)",
            border: `1.5px solid ${TOKENS.border}`,
          }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: TOKENS.navyDeep, margin: "0 0 16px" }}>
              Submit Task Report
            </h3>

            {/* Job Status Dropdown */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              JOB STATUS
            </label>
            <select
              value={jobStatus}
              onChange={(e) => setJobStatus(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            >
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
              <option value="In Progress">In Progress</option>
            </select>

            {/* Team Picker */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              WHICH TEAM
            </label>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {["Embedded", "Mechanical", "Software", "HR"].map((team) => {
                const selected = selectedTeam === team;
                return (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setSelectedTeam(team)}
                    style={{
                      flex: 1, padding: "6px 8px", borderRadius: 8,
                      border: `1.5px solid ${selected ? TOKENS.navyDeep : TOKENS.border}`,
                      background: selected ? TOKENS.navyDeep : "#fff",
                      color: selected ? "#fff" : TOKENS.ink,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {team}
                  </button>
                );
              })}
            </div>

            {/* Completion Remarks */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              WHAT THINGS YOU COMPLETED
            </label>
            <textarea
              placeholder="Explain the work you completed, blockages encountered, or items remaining..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                resize: "none", marginBottom: 12,
              }}
            />

            {errorMsg && (
              <div style={{ color: TOKENS.danger, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTaskId(null)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: `1.5px solid ${TOKENS.border}`, background: "#fff",
                  color: TOKENS.ink, fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitCompletion}
                disabled={capturing}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: "none", background: TOKENS.navyDeep,
                  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                {capturing
                  ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> GPS Verify…</>
                  : "Submit Report"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
