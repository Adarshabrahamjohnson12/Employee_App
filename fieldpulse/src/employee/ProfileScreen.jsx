import React, { useRef, useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { PerformanceGauge } from "../components/PerformanceGauge";
import { useApp } from "../context/AppContext";
import { getImageUrl } from "../api/client";
import { is18Plus, validatePhone, validateEmail } from "../utils/validation";
import { Camera, Upload, Award, Zap, ListChecks, Calendar, Briefcase, Phone, Heart, Edit3, Save, X, Check } from "lucide-react";

function InfoRow({ label, value, color }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "10px 0", borderBottom: `1px solid ${TOKENS.border}`,
    }}>
      <span style={{ fontSize: 12, color: TOKENS.muted, fontWeight: 500, flex: "0 0 120px" }}>{label}</span>
      <span style={{ fontSize: 13, color: color || TOKENS.ink, fontWeight: 600, textAlign: "right", flex: 1 }}>{value || "—"}</span>
    </div>
  );
}

function PhotoUploader({ label, value, onChange, loading, icon: Icon }) {
  const ref = useRef();
  const imgUrl = getImageUrl(value);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div
        onClick={() => !loading && ref.current.click()}
        style={{
          width: "100%", aspectRatio: "3/2", borderRadius: 12,
          border: `2px dashed ${TOKENS.border}`, background: TOKENS.cream,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", cursor: loading ? "default" : "pointer", overflow: "hidden",
          position: "relative", opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
            <span style={{ fontSize: 11, color: TOKENS.navyDeep, fontWeight: 600 }}>Uploading...</span>
          </div>
        ) : imgUrl ? (
          <img src={imgUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <>
            <Icon size={20} color={TOKENS.muted} />
            <span style={{ fontSize: 11, color: TOKENS.muted, marginTop: 5 }}>Tap to upload</span>
          </>
        )}
      </div>
      <input type="file" accept="image/*" ref={ref} onChange={onChange} style={{ display: "none" }} />
    </div>
  );
}

export function ProfileScreen({ emp }) {
  const { updateProfile, currentUser } = useApp();
  const isManager = currentUser?.role === "manager";
  const [uploadingField, setUploadingField] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editForm, setEditForm] = useState({
    fatherName: emp.fatherName || emp.father_name || "",
    motherName: emp.motherName || emp.mother_name || "",
    dob: emp.dob || "",
    bloodGroup: emp.bloodGroup || emp.blood_group || "",
    phone: emp.phone || "",
    email: emp.email || "",
    emergencyName: emp.emergencyContact?.name || "",
    emergencyRelationship: emp.emergencyContact?.relationship || "",
    emergencyPhone: emp.emergencyContact?.phone || "",
  });

  const handleFile = (field) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setUploadError(null);
    try {
      await updateProfile(field, file);
    } catch (err) {
      console.error("Profile image upload failed:", err);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUploadError(null);

    if (editForm.dob && !is18Plus(editForm.dob)) {
      setUploadError("Date of Birth must indicate age 18 or older.");
      return;
    }
    if (editForm.phone && !validatePhone(editForm.phone)) {
      setUploadError("Phone number must be exactly 10 digits.");
      return;
    }
    if (editForm.email && !validateEmail(editForm.email)) {
      setUploadError("Email address must be valid and end with .com (e.g. name@gmail.com).");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        fatherName: editForm.fatherName,
        motherName: editForm.motherName,
        dob: editForm.dob,
        bloodGroup: editForm.bloodGroup,
        phone: editForm.phone,
        email: editForm.email,
        emergencyContact: {
          name: editForm.emergencyName,
          relationship: editForm.emergencyRelationship,
          phone: editForm.emergencyPhone,
        }
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Save profile error:", err);
      setUploadError(err.response?.data?.error || "Failed to save profile details.");
    } finally {
      setSaving(false);
    }
  };

  const selfieRef = useRef();
  const selfieUrl = getImageUrl(emp.selfie);

  return (
    <div>
      {/* Selfie + name hero */}
      <Card style={{
        background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: 24, textAlign: "center",
      }}>
        {/* Selfie avatar */}
        <div
          onClick={() => uploadingField !== "selfie" && selfieRef.current.click()}
          style={{
            width: 88, height: 88, borderRadius: "50%",
            border: `3px solid ${TOKENS.gold}`, overflow: "hidden",
            cursor: uploadingField === "selfie" ? "default" : "pointer", position: "relative",
            background: TOKENS.navyMid, display: "flex",
            alignItems: "center", justifyContent: "center",
            opacity: uploadingField === "selfie" ? 0.7 : 1,
          }}
        >
          {uploadingField === "selfie" ? (
            <span style={{ color: TOKENS.gold, fontSize: 20, animation: "spin 1s linear infinite" }}>⟳</span>
          ) : selfieUrl ? (
            <img src={selfieUrl} alt="selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 700, color: TOKENS.gold }}>
              {emp.initials}
            </span>
          )}
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.2s",
          }} className="selfie-overlay">
            <Camera size={22} color="#fff" />
          </div>
        </div>
        <input type="file" accept="image/*" ref={selfieRef} onChange={handleFile("selfie")} style={{ display: "none" }} />

        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <Camera size={13} color={TOKENS.goldLight} />
          <span style={{ fontSize: 11, color: TOKENS.goldLight }}>
            {uploadingField === "selfie" ? "Uploading selfie..." : "Tap photo to change selfie"}
          </span>
        </div>

        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 10 }}>
          {emp.name}
        </div>
        <div style={{ fontSize: 12, color: "#9FB0C9", marginTop: 2 }}>{emp.role}</div>
        <div style={{
          marginTop: 8, background: `${TOKENS.gold}33`, borderRadius: 20,
          padding: "4px 14px", fontSize: 12, fontWeight: 700, color: TOKENS.goldLight,
        }}>
          {emp.employeeId}
        </div>

        {/* Performance mini-stats */}
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          {[
            { Icon: Award, label: "Score", value: emp.score },
            { Icon: Zap, label: "Streak", value: `${emp.streak}d` },
            { Icon: ListChecks, label: "Done Today", value: `${emp.tasksToday?.done || 0}/${emp.tasksToday?.total || 0}` },
          ].map(({ Icon, label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <Icon size={16} color={TOKENS.gold} style={{ margin: "0 auto" }} />
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 3 }}>{value}</div>
              <div style={{ fontSize: 10, color: "#9FB0C9" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Success banner */}
      {saveSuccess && (
        <div style={{
          margin: "12px 0 4px", background: TOKENS.successBg, border: `1px solid ${TOKENS.success}`,
          borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
          fontSize: 12.5, color: TOKENS.success, fontWeight: 700,
        }}>
          <Check size={16} color={TOKENS.success} /> Profile details saved and synced with manager!
        </div>
      )}

      {/* Personal info section */}
      <SectionLabel
        right={
          isManager ? (
            <button
              onClick={() => {
                setEditForm({
                  fatherName: emp.fatherName || emp.father_name || "",
                  motherName: emp.motherName || emp.mother_name || "",
                  dob: emp.dob || "",
                  bloodGroup: emp.bloodGroup || emp.blood_group || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                  emergencyName: emp.emergencyContact?.name || "",
                  emergencyRelationship: emp.emergencyContact?.relationship || "",
                  emergencyPhone: emp.emergencyContact?.phone || "",
                });
                setIsEditing(v => !v);
              }}
              style={{
                border: "none", background: isEditing ? TOKENS.dangerBg : `${TOKENS.navyDeep}12`,
                color: isEditing ? TOKENS.danger : TOKENS.navyDeep,
                borderRadius: 12, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
              }}
            >
              {isEditing ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> Edit Details</>}
            </button>
          ) : null
        }
      >
        Personal Details
      </SectionLabel>

      {isEditing ? (
        <form onSubmit={handleSaveProfile}>
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.navyDeep, marginBottom: 12 }}>
              ✏️ Update Personal Details
            </div>
            {uploadError && (
              <div style={{ color: TOKENS.danger, fontSize: 12, fontWeight: 600, marginBottom: 10, padding: "8px 12px", background: TOKENS.dangerBg, borderRadius: 8 }}>
                ⚠️ {uploadError}
              </div>
            )}

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

            <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.navyDeep, marginTop: 16, marginBottom: 12 }}>
              🚨 Emergency Contact Details
            </div>

            {[
              { label: "Emergency Contact Name", field: "emergencyName", placeholder: "Contact person name" },
              { label: "Relationship", field: "emergencyRelationship", placeholder: "e.g. Father, Spouse, Brother" },
              { label: "Emergency Phone", field: "emergencyPhone", placeholder: "+91 9876543210", type: "tel" },
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
              {saving ? <><span style={{ animation: "spin 1s linear infinite" }}>⟳</span> Saving Changes…</> : <><Save size={16} /> Save & Sync Profile</>}
            </button>
          </Card>
        </form>
      ) : (
        <>
          <Card style={{ padding: "0 16px" }}>
            <InfoRow label="Full Name"     value={emp.name} />
            <InfoRow label="Father's Name" value={emp.fatherName || emp.father_name} />
            <InfoRow label="Mother's Name" value={emp.motherName || emp.mother_name} />
            <InfoRow label="Date of Birth" value={emp.dob} />
            <InfoRow label="Blood Group"   value={emp.bloodGroup || emp.blood_group} color={TOKENS.danger} />
            <InfoRow label="Phone"         value={emp.phone} />
            <InfoRow label="Email"         value={emp.email} />
          </Card>

          {/* Emergency contact */}
          <SectionLabel>Emergency Contact</SectionLabel>
          <Card style={{ padding: "0 16px" }}>
            <InfoRow label="Contact Name"  value={emp.emergencyContact?.name} />
            <InfoRow label="Relationship"  value={emp.emergencyContact?.relationship} />
            <InfoRow label="Phone"         value={emp.emergencyContact?.phone} color={TOKENS.danger} />
          </Card>
        </>
      )}

      {/* Job details */}
      <SectionLabel>Job Details</SectionLabel>
      <Card style={{ padding: "0 16px" }}>
        <InfoRow label="Employee ID"  value={emp.employeeId || emp.employee_id} />
        <InfoRow label="Role"         value={emp.role} />
        <InfoRow label="Client"       value={emp.clientName || emp.client_name} />
        <InfoRow label="Team"         value={emp.teamName || emp.team_name} />
        <InfoRow label="Joined"       value={emp.joiningDate || emp.joining_date} />
      </Card>

      {/* KYC Documents (Read-Only for Employee, Managed by Manager) */}
      <SectionLabel>KYC Documents — Aadhaar</SectionLabel>
      <Card>
        <div style={{ display: "flex", gap: 12 }}>
          {["front", "back"].map((side) => {
            const imgUrl = getImageUrl(emp.aadhaar?.[side]);
            return (
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
                  {imgUrl ? (
                    <img src={imgUrl} alt={`Aadhaar ${side}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ textAlign: "center", padding: 8 }}>
                      <span style={{ fontSize: 11.5, color: TOKENS.muted, fontWeight: 600 }}>Not uploaded</span>
                      <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2 }}>Managed by Manager</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 10, background: `${TOKENS.navyDeep}0D`, borderRadius: 8,
          padding: "8px 12px", fontSize: 11.5, color: TOKENS.navyDeep, fontWeight: 600,
        }}>
          ℹ️ Aadhaar KYC cards can only be uploaded and managed by your Manager.
        </div>
      </Card>

      <div style={{ height: 20 }} />
    </div>
  );
}
