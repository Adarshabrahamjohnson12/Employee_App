import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../context/AppContext";
import { getImageUrl } from "../api/client";
import { MapPin, ChevronRight, Search, FileText, Clock, UserCheck, UserX } from "lucide-react";

const FILTERS = ["All", "Checked In", "On OD", "Daily Report", "Absent"];

export function TeamScreen({ onSelectEmp }) {
  const { team, assignTask, addEmployee } = useApp();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  
  // Assign task modal states
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Calibration");
  const [taskLocation, setTaskLocation] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Add Employee modal states
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [newEmpId, setNewEmpId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Field Agent");
  const [newClient, setNewClient] = useState("GoldPE Client");
  const [newTeam, setNewTeam] = useState("Western Region");
  const [newJoiningDate, setNewJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [newPassword, setNewPassword] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorAdd, setErrorAdd] = useState("");

  const handleOpenAddEmpModal = () => {
    setIsAddEmpOpen(true);
    setNewEmpId(`FP-WR-00${team.length + 1}`);
    setNewName("");
    setNewRole("Field Agent");
    setNewClient("GoldPE Client");
    setNewTeam("Western Region");
    setNewJoiningDate(new Date().toISOString().slice(0, 10));
    setNewPassword("");
    setErrorAdd("");
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpId.trim() || !newName.trim() || !newRole.trim() || !newPassword.trim()) {
      setErrorAdd("Employee ID, Name, Role, and Password are required.");
      return;
    }
    setErrorAdd("");
    setLoadingAdd(true);
    try {
      await addEmployee({
        employeeId: newEmpId.trim(),
        name: newName.trim(),
        role: newRole.trim(),
        clientName: newClient.trim(),
        teamName: newTeam.trim(),
        joiningDate: newJoiningDate,
        password: newPassword.trim(),
      });
      setIsAddEmpOpen(false);
    } catch (err) {
      setErrorAdd(err.response?.data?.error || "Failed to add employee.");
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleOpenAssignModal = () => {
    setIsAssignOpen(true);
    setSelectedEmpId(team[0]?.employee_id || "");
    setTaskTitle("");
    setTaskCategory("Calibration");
    setTaskLocation("");
    setClientRef(`REF-${Date.now().toString().slice(-4)}`);
    setErrorMsg("");
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskLocation.trim()) {
      setErrorMsg("Please fill in both Task Title and Location.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      await assignTask({
        employeeId: selectedEmpId,
        title: taskTitle.trim(),
        category: taskCategory,
        location: taskLocation.trim(),
        clientRef: clientRef.trim()
      });
      setIsAssignOpen(false);
    } catch (err) {
      setErrorMsg("Failed to assign task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const filtered = team.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.lastLocation || "").toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "All") return true;
    if (filter === "Checked In")   return emp.checkedIn && !emp.onOD;
    if (filter === "On OD")        return emp.onOD;
    if (filter === "Daily Report") return emp.hasSubmittedReportToday || (emp.reports && emp.reports.some(r => r.date === today));
    if (filter === "Absent")       return !emp.checkedIn && !emp.onOD;
    return true;
  }).sort((a, b) => b.score - a.score);

  return (
    <div>
      {/* Header with Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: TOKENS.navyDeep, margin: 0 }}>
          Regional Employees
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleOpenAddEmpModal}
            style={{
              background: "#fff", color: TOKENS.navyDeep, border: `1.5px solid ${TOKENS.navyDeep}`,
              borderRadius: 12, padding: "9px 16px", fontWeight: 700,
              fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ✦ Add Employee
          </button>
          <button
            onClick={handleOpenAssignModal}
            style={{
              background: TOKENS.navyDeep, color: "#fff", border: "none",
              borderRadius: 12, padding: "10px 18px", fontWeight: 700,
              fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              boxShadow: `0 4px 14px ${TOKENS.navyDeep}22`
            }}
          >
            ✦ Assign New Task
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} color={TOKENS.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 12px 12px 38px", borderRadius: 12,
            border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5, outline: "none",
            background: "#fff", color: TOKENS.ink,
          }}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20,
            background: filter === f ? TOKENS.navyDeep : "#fff",
            color: filter === f ? "#fff" : TOKENS.muted,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            border: `1.5px solid ${filter === f ? TOKENS.navyDeep : TOKENS.border}`,
            whiteSpace: "nowrap",
          }}>{f}</button>
        ))}
      </div>

      {/* Leaderboard */}
      <SectionLabel right={<span style={{ fontSize: 11, color: TOKENS.muted }}>{filtered.length} agents</span>}>
        Team Leaderboard — Score Rank
      </SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((emp, rank) => (
          <div key={emp.id} className="stagger-item" style={{ animationDelay: `${rank * 0.04}s` }}>
            <Card onClick={() => onSelectEmp(emp.id)} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Rank */}
                <div style={{
                  width: 24, textAlign: "center",
                  fontFamily: "Fraunces, serif", fontWeight: 700,
                  fontSize: 14, color: rank === 0 ? TOKENS.gold : TOKENS.muted,
                  flexShrink: 0,
                }}>
                  {rank + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: emp.checkedIn ? TOKENS.navyMid : "#CCC",
                  color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0,
                  border: `2px solid ${emp.onOD ? TOKENS.blue : emp.checkedIn ? TOKENS.success : TOKENS.border}`,
                }}>
                  {emp.selfie
                    ? <img src={getImageUrl(emp.selfie)} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : emp.initials
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: TOKENS.ink }}>{emp.name}</div>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: TOKENS.navyDeep }}>{emp.score}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{emp.role}</div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={11} color={TOKENS.muted} />
                      <span style={{ fontSize: 11, color: TOKENS.muted }}>{emp.lastLocation}</span>
                      {(emp.checkInLocation?.lat || emp.check_in_lat) && (
                        <a
                          href={`https://www.google.com/maps?q=${emp.checkInLocation?.lat || emp.check_in_lat},${emp.checkInLocation?.lng || emp.check_in_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 10, fontWeight: 700, color: TOKENS.blue, textDecoration: "none",
                            background: `${TOKENS.blue}15`, padding: "2px 6px", borderRadius: 6,
                            display: "inline-flex", alignItems: "center", gap: 2
                          }}
                        >
                          🗺️ Map
                        </a>
                      )}
                    </div>
                    <StatusPill status={emp.onOD ? "od" : emp.checkedIn ? "present" : "absent"} />
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: TOKENS.muted }}>
                      Tasks: <strong style={{ color: TOKENS.ink }}>{emp.tasksToday?.done || 0}/{emp.tasksToday?.total || 0}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: TOKENS.muted }}>
                      Streak: <strong style={{ color: TOKENS.ink }}>{emp.streak || 0}d</strong>
                    </span>
                    <span style={{ fontSize: 11, color: TOKENS.muted }}>
                      {emp.lastSeen}
                    </span>
                  </div>

                  {/* Daily report details card */}
                  {(() => {
                    const report = (emp.reports || []).find(r => r.date === today) || emp.reports?.[0];
                    if (!report && filter !== "Daily Report") return null;

                    return (
                      <div style={{
                        marginTop: 10, background: "#F8FAFC", borderRadius: 10, padding: 12,
                        border: `1px solid ${report ? `${TOKENS.gold}66` : TOKENS.border}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: TOKENS.navyDeep, display: "flex", alignItems: "center", gap: 5 }}>
                            <FileText size={13} color={TOKENS.gold} />
                            Daily Work Report ({report?.date || today}):
                          </div>
                          {report ? (
                            <div style={{
                              background: `${TOKENS.gold}22`, border: `1px solid ${TOKENS.gold}66`,
                              borderRadius: 10, padding: "2px 8px", fontSize: 10.5, fontWeight: 700, color: TOKENS.navyDeep,
                              display: "flex", alignItems: "center", gap: 4,
                            }}>
                              <Clock size={11} color={TOKENS.navyDeep} />
                              Time: <b>{report.timeSpent || report.hoursSpent}</b>
                            </div>
                          ) : (
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: TOKENS.muted }}>Pending</span>
                          )}
                        </div>

                        {report ? (
                          <>
                            <div style={{ fontSize: 12, color: TOKENS.navySoft, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                              {report.work || report.workDescription}
                            </div>
                            {report.remarks && (
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${TOKENS.border}`, fontSize: 11, color: TOKENS.muted, fontStyle: "italic" }}>
                                <b>Remarks:</b> {report.remarks}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize: 11, color: TOKENS.muted, fontStyle: "italic" }}>
                            No daily report submitted for today.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <ChevronRight size={16} color={TOKENS.muted} style={{ flexShrink: 0 }} />
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Assign Task Modal overlay */}
      {isAssignOpen && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(10,21,45,0.45)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16,
        }}>
          <form onSubmit={handleAssignTask} style={{
            background: "#fff", borderRadius: 20,
            width: "100%", maxWidth: 440, padding: 24,
            boxShadow: "0 24px 60px rgba(10,25,50,0.22)",
            border: `1.5px solid ${TOKENS.border}`,
          }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: TOKENS.navyDeep, margin: "0 0 16px" }}>
              Assign Task to Agent
            </h3>

            {/* Select Employee */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              SELECT FIELD AGENT
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            >
              {team.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>

            {/* Task Title */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              TASK TITLE / DESCRIPTION
            </label>
            <input
              placeholder="e.g. Calibrate XRF Spectrometer"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Category Dropdown */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              CATEGORY
            </label>
            <select
              value={taskCategory}
              onChange={(e) => setTaskCategory(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            >
              <option value="Calibration">Calibration</option>
              <option value="Site Visit">Site Visit</option>
              <option value="MoU Pickup">MoU Pickup</option>
              <option value="Client Meeting">Client Meeting</option>
            </select>

            {/* Location */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              TARGET LOCATION
            </label>
            <input
              placeholder="e.g. Western Vault, Mumbai"
              value={taskLocation}
              onChange={(e) => setTaskLocation(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Client Ref */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              CLIENT REFERENCE ID
            </label>
            <input
              value={clientRef}
              onChange={(e) => setClientRef(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
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
                onClick={() => setIsAssignOpen(false)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: `1.5px solid ${TOKENS.border}`, background: "#fff",
                  color: TOKENS.ink, fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: "none", background: TOKENS.navyDeep,
                  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                {loading ? "Assigning..." : "Assign Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Employee Modal overlay */}
      {isAddEmpOpen && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(10,21,45,0.45)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16,
        }}>
          <form onSubmit={handleAddEmployee} style={{
            background: "#fff", borderRadius: 20,
            width: "100%", maxWidth: 440, padding: 24,
            boxShadow: "0 24px 60px rgba(10,25,50,0.22)",
            border: `1.5px solid ${TOKENS.border}`,
          }} className="screen-enter">
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: TOKENS.navyDeep, margin: "0 0 16px" }}>
              Add New Employee Profile
            </h3>

            {/* Employee ID */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              EMPLOYEE ID / USERNAME
            </label>
            <input
              placeholder="e.g. FP-WR-005"
              value={newEmpId}
              onChange={(e) => setNewEmpId(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Full Name */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              FULL NAME
            </label>
            <input
              placeholder="e.g. Arjun Mehta"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Role */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              JOB ROLE / DESIGNATION
            </label>
            <input
              placeholder="e.g. Field Agent"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Client Name */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              CLIENT PARTNER
            </label>
            <input
              placeholder="e.g. GoldPE Client"
              value={newClient}
              onChange={(e) => setNewClient(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Team Name */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              ASSIGNED TEAM
            </label>
            <input
              placeholder="e.g. Western Region"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Joining Date */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              JOINING DATE
            </label>
            <input
              type="date"
              value={newJoiningDate}
              onChange={(e) => setNewJoiningDate(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {/* Password */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              PASSWORD (SET BY MANAGER)
            </label>
            <input
              type="password"
              placeholder="e.g. arjun123"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                background: TOKENS.cream, outline: "none", color: TOKENS.ink,
                marginBottom: 16,
              }}
            />

            {errorAdd && (
              <div style={{ color: TOKENS.danger, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                ⚠️ {errorAdd}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsAddEmpOpen(false)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: `1.5px solid ${TOKENS.border}`, background: "#fff",
                  color: TOKENS.ink, fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingAdd}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: "none", background: TOKENS.navyDeep,
                  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                {loadingAdd ? "Creating..." : "Create Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
