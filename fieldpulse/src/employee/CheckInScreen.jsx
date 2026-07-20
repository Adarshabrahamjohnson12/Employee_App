import React, { useState, useEffect, useCallback } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { GpsPulse } from "../components/GpsPulse";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { captureLocation } from "../hooks/useGPS";
import { useApp } from "../context/AppContext";
import { formatClientDisplayTime } from "../hooks/useClock";
import { LogIn, LogOut, Clock, MapPin, Navigation, AlertCircle, CheckCircle2, X, Upload, Camera } from "lucide-react";
import { api, getImageUrl } from "../api/client";

// ── Sub-tab: Office Check-In ────────────────────────────────────────────────
function OfficeCheckIn({ emp }) {
  const { doCheckIn, doCheckOut } = useApp();
  const [capturing, setCapturing] = useState(false);
  const [verified, setVerified] = useState(!!emp.checkedIn);
  const [location, setLocation] = useState(emp.checkInLocation || null);

  // Sync component state with global employee state when navigated or updated
  useEffect(() => {
    setVerified(!!emp.checkedIn);
    if (emp.checkInLocation) {
      setLocation(emp.checkInLocation);
    }
  }, [emp.checkedIn, emp.checkInLocation]);

  const handleCheckIn = useCallback(() => {
    setCapturing(true);
    captureLocation(async (loc) => {
      setLocation(loc);
      try {
        await doCheckIn(loc);
        setVerified(true);
      } catch (err) {
        console.error("Check in error:", err);
      } finally {
        setCapturing(false);
      }
    });
  }, [doCheckIn]);

  const handleCheckOut = async () => {
    try {
      await doCheckOut();
      setVerified(false);
      setLocation(null);
    } catch (err) {
      console.error("Check out error:", err);
    }
  };

  return (
    <div>
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24, textAlign: "center" }}>
        <GpsPulse capturing={capturing} verified={verified} size={96} />

        <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, color: TOKENS.navyDeep, marginTop: 16 }}>
          {capturing
            ? "Verifying location…"
            : emp.checkedIn
            ? "Checked In ✓"
            : "Ready to check in"}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4, maxWidth: 260 }}>
          {capturing
            ? "Confirming you're at an approved site — hold on."
            : emp.checkedIn
            ? "Your check-in has been geo-tagged and timestamped for your manager."
            : "Tap below to capture your GPS coordinates and log attendance."}
        </div>

        {location && (
          <div style={{
            marginTop: 16, width: "100%", background: TOKENS.cream,
            borderRadius: 12, padding: "12px 14px", textAlign: "left",
          }}>
            {[
              ["Latitude", location.lat?.toFixed(5)],
              ["Longitude", location.lng?.toFixed(5)],
              ["City / Location", location.city || "Live Location"],
              ["Accuracy", location.accuracy ? `±${location.accuracy} m` : "High Precision GPS"],
              ["GPS Source", location.real ? "Live High-Precision GPS ✓" : "Network / Permission Needed"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 5 }}>
                <span style={{ color: TOKENS.muted }}>{k}</span>
                <span style={{
                  fontWeight: 600,
                  color: k === "GPS Source" ? (location.real ? TOKENS.success : TOKENS.warning) : TOKENS.ink,
                }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {!emp.checkedIn ? (
          <button onClick={handleCheckIn} disabled={capturing} style={{
            marginTop: 18, width: "100%", background: TOKENS.navyDeep, color: "#fff",
            border: "none", borderRadius: 13, padding: "13px 16px",
            fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: capturing ? "default" : "pointer", opacity: capturing ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}>
            <LogIn size={17} />
            {capturing ? "Capturing GPS..." : "Check in with GPS"}
          </button>
        ) : (
          <button onClick={handleCheckOut} style={{
            marginTop: 18, width: "100%", background: "#fff", color: TOKENS.danger,
            border: `1.5px solid ${TOKENS.danger}`, borderRadius: 13, padding: "13px 16px",
            fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer",
          }}>
            <LogOut size={17} /> Check out
          </button>
        )}
      </Card>

      <SectionLabel>Today's log</SectionLabel>
      <Card style={{ padding: 0 }}>
        {(() => {
          const checkInRaw = emp.checkInTime || (emp.checkedIn ? "Checked In" : "—");
          const checkInVal = formatClientDisplayTime(checkInRaw);

          const checkOutRaw = emp.checkedIn
            ? "In progress"
            : (emp.checkOutTime || (emp.checkInTime ? "Checked Out" : "—"));
          const checkOutVal = formatClientDisplayTime(checkOutRaw);

          return [
            {
              label: "Checked in",
              time: checkInVal,
              Icon: LogIn,
              color: emp.checkInTime || emp.checkedIn ? TOKENS.success : TOKENS.muted
            },
            {
              label: "Checked out",
              time: checkOutVal,
              Icon: LogOut,
              color: !emp.checkedIn && emp.checkInTime ? TOKENS.danger : TOKENS.muted
            },
          ];
        })().map((row, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "13px 16px",
            borderBottom: i === 0 ? `1px solid ${TOKENS.border}` : "none",
          }}>
            <row.Icon size={16} color={row.color} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>{row.label}</div>
            <div style={{ fontSize: 12, color: row.time === "In progress" ? TOKENS.warning : TOKENS.muted }}>{row.time}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Photo Upload Form ──────────────────────────────────────────────────────
function PhotoUploadForm({ odId, state, onChange, onUpload, onCancel }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onChange({ file, previewUrl: URL.createObjectURL(file) });
  };
  return (
    <div style={{ background: TOKENS.cream, borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: TOKENS.navyDeep }}>📷 Add Project Photo</span>
        <button onClick={onCancel} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={14} color={TOKENS.muted} /></button>
      </div>
      {state.previewUrl && (
        <img src={state.previewUrl} alt="preview" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
      )}
      <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 12, marginBottom: 8 }} />
      <input
        placeholder="Caption (optional)"
        value={state.caption || ""}
        onChange={(e) => onChange({ caption: e.target.value })}
        style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${TOKENS.border}`, fontSize: 12, color: TOKENS.ink, outline: "none", background: "#fff", marginBottom: 8 }}
      />
      <button
        onClick={() => onUpload(state.file, state.caption)}
        disabled={!state.file || state.uploading}
        style={{ width: "100%", background: TOKENS.navyDeep, color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: state.file && !state.uploading ? "pointer" : "not-allowed", opacity: state.file && !state.uploading ? 1 : 0.6 }}
      >
        {state.uploading ? "Uploading…" : <><Upload size={12} /> Upload Photo</>}
      </button>
    </div>
  );
}

// ── Sub-tab: OD Declaration ─────────────────────────────────────────────────
function ODStatus({ emp }) {
  const { declareOD, markODArrived, completeOD } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    city: "",
    client: emp.clientName || "",
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  });
  const [markingId, setMarkingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Photo upload state: { [odId]: { uploading, photos, caption } }
  const [photoStates, setPhotoStates] = useState({});
  const [showPhotoForm, setShowPhotoForm] = useState({});

  const setPhotoState = (odId, patch) =>
    setPhotoStates(prev => ({ ...prev, [odId]: { ...prev[odId], ...patch } }));

  const handleCompleteOD = async (odId) => {
    setCompletingId(odId);
    try {
      await completeOD(odId);
    } catch (err) {
      console.error("Complete OD error:", err);
    } finally {
      setCompletingId(null);
    }
  };

  const handleUploadPhoto = async (odId, file, caption) => {
    if (!file) return;
    setPhotoState(odId, { uploading: true });
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("caption", caption || "");
      await api.post(`/od/${odId}/photos`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowPhotoForm(prev => ({ ...prev, [odId]: false }));
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setPhotoState(odId, { uploading: false, caption: "", file: null });
    }
  };

  const handleDeclare = async (e) => {
    if (e) e.preventDefault();
    if (!form.city || !form.from || !form.to) return;
    const record = {
      id: `od-${Date.now()}`,
      city: form.city,
      client: form.client,
      from: form.from,
      to: form.to,
      arrived: false,
      arrivalLocation: null,
      arrivalTime: null,
    };
    try {
      setSubmitting(true);
      await declareOD(record);
      setShowForm(false);
      setForm({ city: "", client: emp.clientName || "", from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      console.error("Declare OD error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrived = (odId) => {
    setMarkingId(odId);
    setCapturing(true);
    captureLocation(async (loc) => {
      try {
        await markODArrived(odId, loc);
      } catch (err) {
        console.error("Mark OD arrived error:", err);
      } finally {
        setCapturing(false);
        setMarkingId(null);
      }
    });
  };

  return (
    <div>
      {/* OD status banner */}
      <Card style={{
        background: emp.onOD
          ? `linear-gradient(135deg, ${TOKENS.blue}22, ${TOKENS.blue}11)`
          : TOKENS.cream,
        border: `1.5px solid ${emp.onOD ? TOKENS.blue : TOKENS.border}`,
        padding: 16, textAlign: "center",
      }}>
        <div style={{ fontSize: 28 }}>{emp.onOD ? "✈️" : "🏢"}</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600, color: TOKENS.navyDeep, marginTop: 8 }}>
          {emp.onOD ? `Currently on OD — ${emp.odCity || emp.lastLocation}` : "Not on OD today"}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>
          {emp.onOD ? "You can declare additional ODs below." : "Declare an OD trip to track your city visits."}
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          marginTop: 14, background: TOKENS.blue, color: "#fff", border: "none",
          borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 13,
          display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
        }}>
          <Navigation size={15} /> {showForm ? "Cancel" : "Declare New OD Trip"}
        </button>
      </Card>

      {/* OD declaration form */}
      {showForm && (
        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.navyDeep }}>
              New OD Declaration
            </div>
            <button onClick={() => setShowForm(false)} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <X size={18} color={TOKENS.muted} />
            </button>
          </div>

          <form onSubmit={handleDeclare}>
            {[
              { label: "Destination City *", field: "city", placeholder: "e.g. Pune, Nashik…" },
              { label: "Client Name", field: "client", placeholder: "Client name" },
              { label: "From Date *", field: "from", type: "date" },
              { label: "To Date *", field: "to", type: "date" },
            ].map(({ label, field, placeholder, type }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
                  {label}
                </label>
                <input
                  type={type || "text"}
                  placeholder={placeholder}
                  value={form[field]}
                  required={field !== "client"}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: `1.5px solid ${TOKENS.border}`, fontSize: 13, color: TOKENS.ink,
                    outline: "none", background: TOKENS.cream,
                  }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", background: TOKENS.navyDeep, color: "#fff",
                border: "none", borderRadius: 12, padding: "12px 16px",
                fontWeight: 700, fontSize: 13, cursor: submitting ? "wait" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit OD Declaration"}
            </button>
          </form>
        </Card>
      )}

      {/* OD history */}
      <SectionLabel>OD history</SectionLabel>
      {(emp.odHistory || []).length === 0 && (
        <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 20 }}>
          No OD trips recorded yet.
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(emp.odHistory || []).map((od) => {
          const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
          const isCompleted = od.isCompleted || (od.to && todayStr > od.to);
          const statusKey = od.statusKey || (isCompleted ? "od-completed" : od.arrived ? "arrived" : "od-active");

          return (
            <Card key={od.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: TOKENS.ink }}>
                    📍 {od.city}
                  </div>
                  <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 2 }}>
                    {od.client} · {od.from} → {od.to}
                  </div>
                </div>
                <StatusPill status={statusKey} />
              </div>
              {od.completed || isCompleted ? (
                <div style={{
                  marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                  background: TOKENS.successBg, borderRadius: 8, padding: "7px 10px",
                }}>
                  <CheckCircle2 size={14} color={TOKENS.success} />
                  <span style={{ fontSize: 12, color: TOKENS.success, fontWeight: 600 }}>
                    OD Over / Completed at {od.completedTime || od.completed_time || od.to} ✓
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {od.arrived ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: TOKENS.successBg, borderRadius: 8, padding: "7px 10px",
                    }}>
                      <CheckCircle2 size={14} color={TOKENS.success} />
                      <span style={{ fontSize: 12, color: TOKENS.success, fontWeight: 600 }}>
                        Arrived at {od.arrivalLocation} · {od.arrivalTime}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleArrived(od.id)}
                      disabled={capturing && markingId === od.id}
                      style={{
                        width: "100%", background: TOKENS.navyDeep,
                        color: "#fff", border: "none", borderRadius: 9, padding: "9px 12px",
                        fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6, cursor: "pointer",
                        opacity: capturing && markingId === od.id ? 0.7 : 1,
                      }}
                    >
                      {capturing && markingId === od.id
                        ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Capturing GPS…</>
                        : <><Navigation size={13} /> Mark as Arrived</>
                      }
                    </button>
                  )}

                  <button
                    onClick={() => handleCompleteOD(od.id)}
                    disabled={completingId === od.id}
                    style={{
                      width: "100%", background: TOKENS.danger,
                      color: "#fff", border: "none", borderRadius: 9, padding: "9px 12px",
                      fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6, cursor: "pointer",
                      opacity: completingId === od.id ? 0.7 : 1,
                    }}
                  >
                    <CheckCircle2 size={14} /> OD Over / Completed
                  </button>
                </div>
              )}

              {/* Project Photo Upload */}
              <div style={{ marginTop: 10, borderTop: `1px solid ${TOKENS.border}`, paddingTop: 10 }}>
                {showPhotoForm[od.id] ? (
                  <div>
                    <PhotoUploadForm
                      odId={od.id}
                      state={photoStates[od.id] || {}}
                      onChange={(patch) => setPhotoState(od.id, patch)}
                      onUpload={(file, caption) => handleUploadPhoto(od.id, file, caption)}
                      onCancel={() => setShowPhotoForm(prev => ({ ...prev, [od.id]: false }))}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPhotoForm(prev => ({ ...prev, [od.id]: true }))}
                    style={{
                      width: "100%", background: "#fff", color: TOKENS.navyDeep,
                      border: `1.5px solid ${TOKENS.border}`, borderRadius: 9, padding: "8px 12px",
                      fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6, cursor: "pointer",
                    }}
                  >
                    <Camera size={13} /> Add Project Photo
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Main CheckInScreen ──────────────────────────────────────────────────────
export function CheckInScreen({ emp }) {
  const [sub, setSub] = useState("office");

  return (
    <div>
      {/* Sub-tab switcher */}
      <div style={{
        display: "flex", background: "#fff", borderRadius: 14,
        padding: 4, gap: 4, marginBottom: 16,
        border: `1.5px solid ${TOKENS.border}`,
      }}>
        {[
          { id: "office", label: "Office Check-In" },
          { id: "od",     label: "OD Status" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setSub(id)} style={{
            flex: 1, border: "none", borderRadius: 10, padding: "9px 0",
            fontWeight: 700, fontSize: 12.5, cursor: "pointer",
            background: sub === id ? TOKENS.navyDeep : "transparent",
            color: sub === id ? "#fff" : TOKENS.muted,
            transition: "all 0.2s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {sub === "office" ? <OfficeCheckIn emp={emp} /> : <ODStatus emp={emp} />}
    </div>
  );
}
