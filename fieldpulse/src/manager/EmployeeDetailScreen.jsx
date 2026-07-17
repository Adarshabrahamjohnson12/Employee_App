import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { PerformanceGauge } from "../components/PerformanceGauge";
import { useApp } from "../context/AppContext";
import { getImageUrl } from "../api/client";
import { ArrowLeft, MapPin, Phone, Heart, Briefcase, Calendar, Award, CheckCircle2, Clock, KeyRound, Eye, EyeOff, ExternalLink, Navigation, Compass } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";


function InfoRow({ label, value, color }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "10px 0", borderBottom: `1px solid ${TOKENS.border}`,
    }}>
      <span style={{ fontSize: 12, color: TOKENS.muted, flex: "0 0 120px" }}>{label}</span>
      <span style={{ fontSize: 13, color: color || TOKENS.ink, fontWeight: 600, textAlign: "right", flex: 1 }}>{value || "—"}</span>
    </div>
  );
}

const SUB_TABS = ["Profile", "GPS Location", "OD History", "Performance", "Reimbursements"];

export function EmployeeDetailScreen({ empId, onBack }) {
  const { getEmployee, tasks, resetEmployeePassword } = useApp();
  const emp = getEmployee(empId);
  const [sub, setSub] = useState("Profile");

  // Reset password state
  const [showPwReset, setShowPwReset] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    if (newPw.length < 4) { setPwErr("Password must be at least 4 characters."); return; }
    setPwLoading(true);
    try {
      await resetEmployeePassword(emp.employee_id, newPw);
      setPwMsg("Password updated successfully!");
      setNewPw("");
      setTimeout(() => { setPwMsg(""); setShowPwReset(false); }, 2500);
    } catch (err) {
      setPwErr(err.response?.data?.error || "Failed to update password.");
    } finally { setPwLoading(false); }
  };

  if (!emp) return null;


  const myTasks = emp.tasks || [];
  const CATEGORY_EMOJI = { Travel: "🚌", Food: "🍽️", Accommodation: "🏨", Other: "📎" };

  return (
    <div>
      {/* Back header */}
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 8, border: "none",
        background: "none", color: TOKENS.navyDeep, cursor: "pointer",
        marginBottom: 14, fontWeight: 700, fontSize: 13,
      }}>
        <ArrowLeft size={18} /> Back to team
      </button>

      {/* Employee hero */}
      <Card style={{
        background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
        padding: "20px 18px",
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            border: `2.5px solid ${TOKENS.gold}`,
            background: TOKENS.navyMid, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: TOKENS.gold, flexShrink: 0,
          }}>
            {emp.selfie
              ? <img src={getImageUrl(emp.selfie)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : emp.initials
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>{emp.name}</div>
            <div style={{ fontSize: 12, color: "#9FB0C9", marginTop: 2 }}>{emp.role} · {emp.teamName}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <StatusPill status={emp.onOD ? "od" : emp.checkedIn ? "present" : "absent"} />
              <span style={{ fontSize: 12, color: "#9FB0C9", alignSelf: "center" }}>
                {emp.checkedIn ? emp.checkInTime : emp.lastSeen}
              </span>
            </div>
          </div>
          <PerformanceGauge score={emp.score} size={72} label="Score" />
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 14, background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: 3 }}>
          {SUB_TABS.map((t) => (
            <button key={t} onClick={() => setSub(t)} style={{
              flex: 1, border: "none", borderRadius: 6, padding: "6px 4px",
              fontSize: 10.5, fontWeight: 700, cursor: "pointer",
              background: sub === t ? TOKENS.gold : "transparent",
              color: sub === t ? TOKENS.navyDeep : "#9FB0C9",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{t}</button>
          ))}
        </div>
      </Card>

      {/* Profile sub-tab */}
      {sub === "Profile" && (
        <div>
          <SectionLabel>Personal Details</SectionLabel>
          <Card style={{ padding: "0 16px" }}>
            <InfoRow label="Full Name"     value={emp.name} />
            <InfoRow label="Father's Name" value={emp.fatherName} />
            <InfoRow label="Mother's Name" value={emp.motherName} />
            <InfoRow label="Date of Birth" value={emp.dob} />
            <InfoRow label="Blood Group"   value={emp.bloodGroup} color={TOKENS.danger} />
            <InfoRow label="Phone"         value={emp.phone} />
            <InfoRow label="Email"         value={emp.email} />
          </Card>

          <SectionLabel>Emergency Contact</SectionLabel>
          <Card style={{ padding: "0 16px" }}>
            <InfoRow label="Name"         value={emp.emergencyContact?.name} />
            <InfoRow label="Relationship" value={emp.emergencyContact?.relationship} />
            <InfoRow label="Phone"        value={emp.emergencyContact?.phone} color={TOKENS.danger} />
          </Card>

          <SectionLabel>Job Details</SectionLabel>
          <Card style={{ padding: "0 16px" }}>
            <InfoRow label="Employee ID" value={emp.employeeId} />
            <InfoRow label="Client"      value={emp.clientName} />
            <InfoRow label="Team"        value={emp.teamName} />
            <InfoRow label="Joined"      value={emp.joiningDate} />
          </Card>

          {/* Aadhaar KYC */}
          <SectionLabel>KYC Documents</SectionLabel>
          <Card>
            <div style={{ display: "flex", gap: 12 }}>
              {["front", "back"].map((side) => (
                <div key={side} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, marginBottom: 6 }}>
                    AADHAAR {side.toUpperCase()}
                  </div>
                  <div style={{
                    width: "100%", aspectRatio: "3/2", borderRadius: 12,
                    border: `2px dashed ${TOKENS.border}`, background: TOKENS.cream,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", overflow: "hidden",
                  }}>
                    {emp.aadhaar?.[side]
                      ? <img src={getImageUrl(emp.aadhaar[side])} alt={`Aadhaar ${side}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 12, color: TOKENS.muted }}>Not uploaded</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reset Password */}
          <SectionLabel>Login Access</SectionLabel>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: `${TOKENS.navyDeep}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <KeyRound size={16} color={TOKENS.navyDeep} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>Login Password</div>
                  <div style={{ fontSize: 11, color: TOKENS.muted }}>Set or reset employee portal access</div>
                </div>
              </div>
              <button
                onClick={() => { setShowPwReset(v => !v); setPwErr(""); setPwMsg(""); setNewPw(""); }}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${TOKENS.navyDeep}`,
                  background: showPwReset ? TOKENS.navyDeep : "#fff",
                  color: showPwReset ? "#fff" : TOKENS.navyDeep,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                {showPwReset ? "Cancel" : "Set Password"}
              </button>
            </div>

            {showPwReset && (
              <form onSubmit={handleResetPassword} style={{ marginTop: 14, borderTop: `1px solid ${TOKENS.border}`, paddingTop: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                  NEW PASSWORD FOR {emp.name.toUpperCase()}
                </label>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Enter new password (min. 4 chars)"
                    style={{
                      width: "100%", padding: "10px 40px 10px 12px", borderRadius: 10,
                      border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                      outline: "none", color: TOKENS.ink, background: TOKENS.cream,
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    border: "none", background: "none", cursor: "pointer", padding: 0,
                  }}>
                    {showPw ? <EyeOff size={16} color={TOKENS.muted} /> : <Eye size={16} color={TOKENS.muted} />}
                  </button>
                </div>

                {pwErr && <div style={{ fontSize: 12, color: TOKENS.danger, fontWeight: 600, marginBottom: 10 }}>⚠️ {pwErr}</div>}
                {pwMsg && <div style={{ fontSize: 12, color: TOKENS.success, fontWeight: 600, marginBottom: 10 }}>✓ {pwMsg}</div>}

                <button
                  type="submit"
                  disabled={pwLoading}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "none", background: TOKENS.navyDeep, color: "#fff",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    opacity: pwLoading ? 0.7 : 1,
                  }}
                >
                  {pwLoading ? "Updating…" : "Confirm Password"}
                </button>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* GPS Location sub-tab */}
      {sub === "GPS Location" && (
        <div>
          <SectionLabel>Live Employee Location</SectionLabel>
          <Card style={{ padding: 18, background: TOKENS.cream }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={20} color={emp.checkedIn ? TOKENS.success : TOKENS.navyDeep} />
                  <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, color: TOKENS.navyDeep }}>
                    {emp.checkInLocation?.city || emp.lastLocation || "Unknown Location"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>
                  Status: <strong style={{ color: emp.checkedIn ? TOKENS.success : TOKENS.danger }}>
                    {emp.checkedIn ? `Checked In (${emp.checkInTime || emp.lastSeen})` : emp.onOD ? `On OD (${emp.odCity})` : `Not Checked In (Last seen ${emp.lastSeen})`}
                  </strong>
                </div>
              </div>
              <StatusPill status={emp.onOD ? "od" : emp.checkedIn ? "present" : "absent"} />
            </div>

            {/* Coordinates display */}
            {(emp.checkInLocation?.lat || emp.check_in_lat) ? (
              <div style={{
                marginTop: 14, background: "#fff", borderRadius: 12, padding: "12px 14px",
                border: `1px solid ${TOKENS.border}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: TOKENS.muted }}>Latitude</span>
                  <span style={{ fontWeight: 700, color: TOKENS.ink, fontFamily: "monospace" }}>
                    {(emp.checkInLocation?.lat || emp.check_in_lat).toFixed(6)}° N
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: TOKENS.muted }}>Longitude</span>
                  <span style={{ fontWeight: 700, color: TOKENS.ink, fontFamily: "monospace" }}>
                    {(emp.checkInLocation?.lng || emp.check_in_lng).toFixed(6)}° E
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: TOKENS.muted }}>GPS Source</span>
                  <span style={{ fontWeight: 700, color: TOKENS.success }}>Real-time Device GPS</span>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12, fontSize: 12, color: TOKENS.muted }}>
                📍 Location Region: {emp.lastLocation || "Western Region"}
              </div>
            )}

            {/* Map Link Button */}
            <a
              href={
                (emp.checkInLocation?.lat || emp.check_in_lat)
                  ? `https://www.google.com/maps?q=${emp.checkInLocation?.lat || emp.check_in_lat},${emp.checkInLocation?.lng || emp.check_in_lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((emp.lastLocation || "Mumbai") + ", India")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 14, width: "100%", background: TOKENS.navyDeep, color: "#fff",
                borderRadius: 12, padding: "12px 16px", textDecoration: "none",
                fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8, boxShadow: `0 4px 12px ${TOKENS.navyDeep}25`
              }}
            >
              <ExternalLink size={16} /> Track on Google Maps
            </a>
          </Card>

          {/* Location History Log */}
          <SectionLabel>Check-In Location History</SectionLabel>
          {(emp.checkinsHistory || []).length === 0 ? (
            <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 12, padding: 16 }}>
              No check-in logs recorded today.
            </Card>
          ) : (
            <Card style={{ padding: 0 }}>
              {(emp.checkinsHistory || []).map((c, idx) => (
                <div key={c.id || idx} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderBottom: idx < (emp.checkinsHistory || []).length - 1 ? `1px solid ${TOKENS.border}` : "none"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: c.type === "in" ? TOKENS.successBg : TOKENS.dangerBg,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <MapPin size={16} color={c.type === "in" ? TOKENS.success : TOKENS.danger} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>
                        {c.type === "in" ? "Check In" : "Check Out"} · {c.city || "Live GPS"}
                      </div>
                      <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>
                        {c.timestamp || c.date} {c.lat ? `· ${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}` : ""}
                      </div>
                    </div>
                  </div>
                  {c.lat && (
                    <a
                      href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "5px 10px", borderRadius: 8, background: TOKENS.cream,
                        border: `1px solid ${TOKENS.border}`, color: TOKENS.navyDeep,
                        fontSize: 11, fontWeight: 700, textDecoration: "none",
                        display: "flex", alignItems: "center", gap: 4
                      }}
                    >
                      <ExternalLink size={12} /> Map
                    </a>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* OD History sub-tab */}
      {sub === "OD History" && (
        <div>
          <SectionLabel>OD trips</SectionLabel>
          {(emp.odHistory || []).length === 0 && (
            <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 20 }}>No OD trips yet.</Card>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {(emp.odHistory || []).map((od) => (
              <Card key={od.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>📍 {od.city}</div>
                    <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 2 }}>
                      {od.client} · {od.from} → {od.to}
                    </div>
                  </div>
                  <StatusPill status={od.arrived ? "arrived" : "not-arrived"} />
                </div>
                {od.arrived && (
                  <div style={{
                    marginTop: 8, display: "flex", alignItems: "center", gap: 6,
                    background: TOKENS.successBg, borderRadius: 8, padding: "6px 10px",
                    fontSize: 12, color: TOKENS.success, fontWeight: 600,
                  }}>
                    <CheckCircle2 size={13} /> {od.arrivalLocation} · {od.arrivalTime}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Performance sub-tab */}
      {sub === "Performance" && (
        <div>
          <SectionLabel>Punctuality trend</SectionLabel>
          <Card style={{ padding: "16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={emp.punctualityTrend || []}>
                <CartesianGrid vertical={false} stroke="#F0ECE1" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: TOKENS.muted }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 10, border: `1px solid ${TOKENS.border}` }} />
                <Line type="monotone" dataKey="min" stroke={TOKENS.gold} strokeWidth={2.5} dot={{ r: 4, fill: TOKENS.navyDeep }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: TOKENS.muted, textAlign: "center", marginTop: 4 }}>
              Minutes early (–) / late (+) relative to 9:00 AM shift
            </div>
          </Card>

          <SectionLabel>Tasks breakdown</SectionLabel>
          <Card style={{ padding: 8 }}>
            {myTasks.length === 0 ? (
              <div style={{ textAlign: "center", color: TOKENS.muted, fontSize: 12, padding: 14 }}>No tasks assigned.</div>
            ) : (
              myTasks.map((t, i) => (
                <div key={t.id} style={{
                  padding: "14px 12px",
                  borderBottom: i < myTasks.length - 1 ? `1px solid ${TOKENS.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {t.status === "done"
                        ? <CheckCircle2 size={16} color={TOKENS.success} />
                        : <Clock size={16} color={TOKENS.muted} />
                      }
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: TOKENS.ink }}>{t.title}</div>
                        <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 2 }}>{t.location}</div>
                      </div>
                    </div>
                    <StatusPill status={t.status} />
                  </div>

                  {/* Completion Report Display */}
                  {t.status === "done" && (t.completion_status || t.completion_remarks) && (
                    <div style={{
                      marginTop: 10,
                      padding: "10px 14px",
                      background: TOKENS.cream,
                      borderRadius: 10,
                      border: `1.5px solid ${TOKENS.border}`,
                      fontSize: 12,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontWeight: 600 }}>
                        <span>Report Status: <strong style={{ color: t.completion_status === "Completed" ? TOKENS.success : TOKENS.danger }}>{t.completion_status}</strong></span>
                        <span>Reporting Team: <strong>{t.completion_team}</strong></span>
                      </div>
                      <div style={{ color: TOKENS.ink, lineHeight: 1.4, marginBottom: 6 }}>
                        <strong>Completed Items:</strong> {t.completion_remarks}
                      </div>
                      {t.completion_lat && (
                        <div style={{ fontSize: 10.5, color: TOKENS.muted }}>
                          📍 GPS Verified: Lat {t.completion_lat.toFixed(5)}, Lng {t.completion_lng.toFixed(5)} · Completed: {t.completed_at || t.time}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* Reimbursements sub-tab */}
      {sub === "Reimbursements" && (
        <div>
          <SectionLabel>All reimbursements</SectionLabel>
          {(emp.reimbursements || []).length === 0 && (
            <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 20 }}>None submitted.</Card>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {(emp.reimbursements || []).map((r) => (
              <Card key={r.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {CATEGORY_EMOJI[r.category] || "📎"} {r.category}
                    </div>
                    <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 2 }}>{r.description}</div>
                    <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>{r.date}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: TOKENS.navyDeep }}>
                      ₹{r.amount.toLocaleString("en-IN")}
                    </div>
                    <StatusPill status={r.status} style={{ marginTop: 5, display: "inline-block" }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
