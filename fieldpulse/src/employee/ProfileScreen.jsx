import React, { useRef, useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { PerformanceGauge } from "../components/PerformanceGauge";
import { useApp } from "../context/AppContext";
import { getImageUrl } from "../api/client";
import { Camera, Upload, Award, Zap, ListChecks, Calendar, Briefcase, Phone, Heart, Loader2 } from "lucide-react";

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
  const { updateProfile } = useApp();
  const [uploadingField, setUploadingField] = useState(null);
  const [uploadError, setUploadError] = useState(null);

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
            { Icon: ListChecks, label: "Done Today", value: `${emp.tasksToday.done}/${emp.tasksToday.total}` },
          ].map(({ Icon, label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <Icon size={16} color={TOKENS.gold} style={{ margin: "0 auto" }} />
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 3 }}>{value}</div>
              <div style={{ fontSize: 10, color: "#9FB0C9" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Personal info */}
      <SectionLabel right={<span style={{ fontSize: 11, color: TOKENS.muted }}>DOB: {emp.dob}</span>}>
        Personal Details
      </SectionLabel>
      <Card style={{ padding: "0 16px" }}>
        <InfoRow label="Full Name"     value={emp.name} />
        <InfoRow label="Father's Name" value={emp.fatherName} />
        <InfoRow label="Mother's Name" value={emp.motherName} />
        <InfoRow label="Date of Birth" value={emp.dob} />
        <InfoRow label="Blood Group"   value={emp.bloodGroup} color={TOKENS.danger} />
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

      {/* Job details */}
      <SectionLabel>Job Details</SectionLabel>
      <Card style={{ padding: "0 16px" }}>
        <InfoRow label="Employee ID"  value={emp.employeeId} />
        <InfoRow label="Role"         value={emp.role} />
        <InfoRow label="Client"       value={emp.clientName} />
        <InfoRow label="Team"         value={emp.teamName} />
        <InfoRow label="Joined"       value={emp.joiningDate} />
      </Card>

      {/* KYC Documents */}
      <SectionLabel>KYC Documents — Aadhaar</SectionLabel>
      {uploadError && (
        <div style={{ color: TOKENS.danger, fontSize: 12, fontWeight: 600, marginBottom: 10, padding: "8px 12px", background: TOKENS.dangerBg, borderRadius: 8 }}>
          ⚠️ {uploadError}
        </div>
      )}
      <Card>
        <div style={{ display: "flex", gap: 12 }}>
          <PhotoUploader
            label="AADHAAR FRONT"
            value={emp.aadhaar?.front}
            onChange={handleFile("aadhaarFront")}
            loading={uploadingField === "aadhaarFront"}
            icon={Upload}
          />
          <PhotoUploader
            label="AADHAAR BACK"
            value={emp.aadhaar?.back}
            onChange={handleFile("aadhaarBack")}
            loading={uploadingField === "aadhaarBack"}
            icon={Upload}
          />
        </div>
        <div style={{
          marginTop: 10, background: `${TOKENS.success}18`, borderRadius: 8,
          padding: "8px 12px", fontSize: 11.5, color: TOKENS.success, fontWeight: 600,
        }}>
          ✓ KYC documents are synced securely to the FieldPulse regional server.
        </div>
      </Card>

      <div style={{ height: 20 }} />
    </div>
  );
}
