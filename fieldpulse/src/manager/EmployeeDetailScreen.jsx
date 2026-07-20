import React, { useState, useEffect } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { PerformanceGauge } from "../components/PerformanceGauge";
import { useApp } from "../context/AppContext";
import { getImageUrl, api } from "../api/client";
import { formatClientDisplayTime } from "../hooks/useClock";
import { is18Plus, validatePhone, validateEmail } from "../utils/validation";
import { ArrowLeft, MapPin, Phone, Heart, Briefcase, Calendar, Award, CheckCircle2, Clock, KeyRound, Eye, EyeOff, ExternalLink, Navigation, Compass, Edit3, Save, X, Upload, Camera, FileText, TrendingUp, Star } from "lucide-react";
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

function AttachmentUploadBtn({ empId, onDone }) {
  const [show, setShow] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caption", caption);
      await api.post(`/employees/${empId}/attachments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShow(false); setCaption(""); setFile(null);
      if (onDone) onDone();
    } catch (err) { console.error("Attachment upload error:", err); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ display: "inline-block" }}>
      <button onClick={() => setShow(v => !v)} style={{ border: "none", background: `${TOKENS.navyDeep}12`, color: TOKENS.navyDeep, borderRadius: 12, padding: "4px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
        <Upload size={12} /> Add Attachment
      </button>
      {show && (
        <div style={{ background: TOKENS.cream, borderRadius: 10, padding: 12, marginTop: 8, border: `1px solid ${TOKENS.border}` }}>
          <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 12, marginBottom: 8 }} />
          <input placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${TOKENS.border}`, fontSize: 12, color: TOKENS.ink, outline: "none", background: "#fff", marginBottom: 8 }} />
          <button onClick={handleUpload} disabled={!file || uploading} style={{ width: "100%", background: TOKENS.navyDeep, color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: file && !uploading ? "pointer" : "not-allowed", opacity: file && !uploading ? 1 : 0.6 }}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      )}
    </div>
  );
}

const SUB_TABS = ["Profile", "GPS Location", "OD History", "Performance", "Work Reports", "Reimbursements"];

export function EmployeeDetailScreen({ empId, onBack }) {
  const { getEmployee, tasks, resetEmployeePassword, refreshTeam, fetchLeaves, updateLeave } = useApp();
  const emp = getEmployee(empId);
  const [sub, setSub] = useState("Profile");
  const [workReports, setWorkReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (sub === "Work Reports" && emp) {
      setLoadingReports(true);
      import("../api/client").then(({ api }) =>
        api.get("/reports", { params: { employeeId: emp.employee_id } })
          .then(r => setWorkReports(Array.isArray(r.data) ? r.data : (r.data || [])))
          .catch(() => setWorkReports([]))
          .finally(() => setLoadingReports(false))
      );
    }
  }, [sub, emp?.employee_id]);

  // Edit profile state for Manager
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editForm, setEditForm] = useState({
    fatherName: "",
    motherName: "",
    dob: "",
    bloodGroup: "",
    phone: "",
    email: "",
  });

  const handleOpenEdit = () => {
    if (!emp) return;
    setEditForm({
      fatherName: emp.fatherName || emp.father_name || "",
      motherName: emp.motherName || emp.mother_name || "",
      dob: emp.dob || "",
      bloodGroup: emp.bloodGroup || emp.blood_group || "",
      phone: emp.phone || "",
      email: emp.email || "",
    });
    setEditError("");
    setEditSuccess("");
    setIsEditing(v => !v);
  };

  const handleSaveEmpDetails = async (e) => {
    e.preventDefault();
    setEditError(""); setEditSuccess("");

    if (editForm.dob && !is18Plus(editForm.dob)) {
      setEditError("Date of Birth must indicate age 18 or older.");
      return;
    }
    if (editForm.phone && !validatePhone(editForm.phone)) {
      setEditError("Phone number must be exactly 10 digits.");
      return;
    }
    if (editForm.email && !validateEmail(editForm.email)) {
      setEditError("Email address must be valid and end with .com (e.g. name@gmail.com).");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/employees/${emp.employeeId || emp.employee_id || emp.id}`, editForm);
      await refreshTeam();
      setEditSuccess("Profile details saved successfully!");
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.error || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

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
                {formatClientDisplayTime(emp.checkedIn ? emp.checkInTime : (emp.checkOutTime || emp.lastSeen))}
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
          {editSuccess && (
            <div style={{ margin: "8px 0", padding: "8px 12px", background: TOKENS.successBg, border: `1px solid ${TOKENS.success}`, color: TOKENS.success, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
              ✓ {editSuccess}
            </div>
          )}
          {editError && (
            <div style={{ margin: "8px 0", padding: "8px 12px", background: TOKENS.dangerBg, border: `1px solid ${TOKENS.danger}`, color: TOKENS.danger, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
              ⚠️ {editError}
            </div>
          )}

          <SectionLabel
            right={
              <button
                onClick={handleOpenEdit}
                style={{
                  border: "none", background: isEditing ? TOKENS.dangerBg : `${TOKENS.navyDeep}12`,
                  color: isEditing ? TOKENS.danger : TOKENS.navyDeep,
                  borderRadius: 12, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                }}
              >
                {isEditing ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> Edit Details</>}
              </button>
            }
          >
            Personal Details
          </SectionLabel>

          {isEditing ? (
            <form onSubmit={handleSaveEmpDetails}>
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.navyDeep, marginBottom: 12 }}>
                  ✏️ Edit Employee Personal Details
                </div>
                {[
                  { label: "Father's Name", field: "fatherName", placeholder: "Father's name" },
                  { label: "Mother's Name", field: "motherName", placeholder: "Mother's name" },
                  { label: "Date of Birth", field: "dob", type: "date" },
                  { label: "Blood Group",   field: "bloodGroup", placeholder: "e.g. O+, A+, B+…" },
                  { label: "Phone Number",  field: "phone", placeholder: "+91 9876543210", type: "tel" },
                  { label: "Email Address", field: "email", placeholder: "name@company.com", type: "email" },
                ].map(({ label, field, placeholder, type }) => (
                  <div key={field} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, display: "block", marginBottom: 4 }}>
                      {label}
                    </label>
                    <input
                      type={type || "text"}
                      placeholder={placeholder}
                      value={editForm[field]}
                      onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{
                        width: "100%", padding: "9px 12px", borderRadius: 10,
                        border: `1.5px solid ${TOKENS.border}`, fontSize: 13, color: TOKENS.ink,
                        outline: "none", background: "#fff",
                      }}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    marginTop: 14, width: "100%", background: TOKENS.navyDeep, color: "#fff",
                    border: "none", borderRadius: 12, padding: "12px",
                    fontWeight: 700, fontSize: 13.5, cursor: saving ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving Changes…" : <><Save size={16} /> Save Employee Details</>}
                </button>
              </Card>
            </form>
          ) : (
            <Card style={{ padding: "0 16px" }}>
              <InfoRow label="Full Name"     value={emp.name} />
              <InfoRow label="Father's Name" value={emp.fatherName || emp.father_name} />
              <InfoRow label="Mother's Name" value={emp.motherName || emp.mother_name} />
              <InfoRow label="Date of Birth" value={emp.dob} />
              <InfoRow label="Blood Group"   value={emp.bloodGroup || emp.blood_group} color={TOKENS.danger} />
              <InfoRow label="Phone"         value={emp.phone} />
              <InfoRow label="Email"         value={emp.email} />
            </Card>
          )}

          <SectionLabel>Emergency Contact</SectionLabel>
          <Card style={{ padding: "0 16px" }}>
            <InfoRow label="Name"         value={emp.emergencyContact?.name} />
            <InfoRow label="Relationship" value={emp.emergencyContact?.relationship} />
            <InfoRow label="Phone"        value={emp.emergencyContact?.phone} color={TOKENS.danger} />
          </Card>

          <SectionLabel>Job Details</SectionLabel>
          <Card style={{ padding: "0 16px" }}>
            <InfoRow label="Employee ID" value={emp.employeeId || emp.employee_id} />
            <InfoRow label="Client"      value={emp.clientName || emp.client_name} />
            <InfoRow label="Team"        value={emp.teamName || emp.team_name} />
            <InfoRow label="Joined"      value={emp.joiningDate || emp.joining_date} />
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

          {/* Attachments section */}
          <SectionLabel right={
            <AttachmentUploadBtn empId={emp.employee_id || emp.id} onDone={refreshTeam} />
          }>Attachments</SectionLabel>
          {(emp.attachments || []).length === 0 && (
            <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 12, padding: 16 }}>No attachments yet.</Card>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(emp.attachments || []).map(att => (
              <Card key={att.id} style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={getImageUrl(att.url)} alt="attachment" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, border: `1px solid ${TOKENS.border}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>{att.caption || "Attachment"}</div>
                    <div style={{ fontSize: 11, color: TOKENS.muted }}>{att.created_at?.slice(0, 10)}</div>
                  </div>
                  <a href={getImageUrl(att.url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: TOKENS.navyDeep, display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontWeight: 700 }}>
                    <ExternalLink size={12} /> View
                  </a>
                </div>
              </Card>
            ))}
          </div>

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
                    {emp.checkedIn ? `Checked In (${formatClientDisplayTime(emp.checkInTime || emp.lastSeen)})` : emp.onOD ? `On OD (${emp.odCity})` : `Not Checked In (Last seen ${formatClientDisplayTime(emp.lastSeen)})`}
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
                        {formatClientDisplayTime(c.timestamp || c.date)} {c.lat ? `· ${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}` : ""}
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
            {(emp.odHistory || []).map((od) => {
              const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
              const isCompleted = od.isCompleted || (od.to && todayStr > od.to);
              const statusKey = od.statusKey || (isCompleted ? "od-completed" : od.arrived ? "arrived" : "od-active");

              return (
                <Card key={od.id} style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>📍 {od.city}</div>
                      <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 2 }}>
                        {od.client} · {od.from} → {od.to}
                      </div>
                    </div>
                    <StatusPill status={statusKey} />
                  </div>
                  {isCompleted ? (
                    <div style={{
                      marginTop: 8, display: "flex", alignItems: "center", gap: 6,
                      background: TOKENS.successBg, borderRadius: 8, padding: "6px 10px",
                      fontSize: 12, color: TOKENS.success, fontWeight: 600,
                    }}>
                      <CheckCircle2 size={13} /> OD Completed on {od.to} ✓
                    </div>
                  ) : od.arrived ? (
                    <div style={{
                      marginTop: 8, display: "flex", alignItems: "center", gap: 6,
                      background: TOKENS.successBg, borderRadius: 8, padding: "6px 10px",
                      fontSize: 12, color: TOKENS.success, fontWeight: 600,
                    }}>
                      <CheckCircle2 size={13} /> {od.arrivalLocation} · {formatClientDisplayTime(od.arrivalTime)}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance sub-tab */}
      {sub === "Performance" && (
        <div>
          {/* Performance Index Banner */}
          <Card style={{ background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`, padding: 18, marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9FB0C9", letterSpacing: 0.5 }}>PERFORMANCE INDEX</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 36, fontWeight: 700, color: TOKENS.gold, lineHeight: 1.1 }}>
                  {emp.performanceIndex ?? emp.score ?? "—"}%
                </div>
                <div style={{ fontSize: 12, color: "#9FB0C9", marginTop: 4 }}>Based on hours · tasks · reports · OD</div>
              </div>
              <div style={{ textAlign: "center" }}>
                {(emp.performanceIndex ?? emp.score ?? 0) >= 90 ? (
                  <div style={{ background: TOKENS.successBg, border: `1px solid ${TOKENS.success}`, borderRadius: 12, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: TOKENS.success, display: "flex", alignItems: "center", gap: 6 }}>
                    <Star size={13} /> Benefits Eligible
                  </div>
                ) : (
                  <div style={{ background: `${TOKENS.danger}20`, border: `1px solid ${TOKENS.danger}44`, borderRadius: 12, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: TOKENS.danger }}>
                    Below 90% threshold
                  </div>
                )}
              </div>
            </div>
            {/* Factor breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              {[
                { label: "Hours (9hr/day)", icon: "⏱️" },
                { label: "Tasks Done", icon: "✅" },
                { label: "Daily Reports", icon: "📋" },
                { label: "OD Coverage", icon: "✈️" },
              ].map(({ label, icon }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px" }}>
                  <div style={{ fontSize: 12 }}>{icon}</div>
                  <div style={{ fontSize: 10.5, color: "#9FB0C9", marginTop: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 }}>25% weight</div>
                </div>
              ))}
            </div>
          </Card>
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
                          📍 GPS Verified: Lat {t.completion_lat.toFixed(5)}, Lng {t.completion_lng.toFixed(5)} · Completed: {formatClientDisplayTime(t.completed_at || t.time)}
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

      {/* Work Reports sub-tab */}
      {sub === "Work Reports" && (
        <div>
          <SectionLabel>Daily Work Reports</SectionLabel>
          {loadingReports && <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 20 }}>Loading reports…</Card>}
          {!loadingReports && workReports.length === 0 && (
            <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 20 }}>
              <FileText size={28} color={TOKENS.border} style={{ margin: "0 auto 8px" }} />
              No work reports submitted yet.
            </Card>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {workReports.map((r, idx) => (
              <Card key={r.id || idx} style={{ padding: 14, borderLeft: `4px solid ${TOKENS.gold}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.navyDeep }}>{r.date}</div>
                  <div style={{ background: `${TOKENS.gold}20`, border: `1px solid ${TOKENS.gold}55`, borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: TOKENS.navyDeep, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} /> {r.timeSpent || r.time_spent}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: TOKENS.ink, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.work}</div>
                {r.remarks && (
                  <div style={{ fontSize: 11, color: TOKENS.muted, fontStyle: "italic", marginTop: 8, borderTop: `1px dashed ${TOKENS.border}`, paddingTop: 6 }}>
                    Remarks: {r.remarks}
                  </div>
                )}
              </Card>
            ))}
          </div>
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
                      {r.amount?.toLocaleString("en-IN")}
                    </div>
                    <StatusPill status={r.status} style={{ marginTop: 5, display: "inline-block" }} />
                    {r.receiptUrl && (
                      <a href={getImageUrl(r.receiptUrl)} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 6, fontSize: 11, fontWeight: 700, color: TOKENS.navyDeep, textDecoration: "none" }}>
                        <ExternalLink size={12} /> View Receipt
                      </a>
                    )}
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
