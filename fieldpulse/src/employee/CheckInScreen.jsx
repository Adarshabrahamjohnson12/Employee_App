import React, { useState, useCallback } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { GpsPulse } from "../components/GpsPulse";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { captureLocation } from "../hooks/useGPS";
import { fmtTime } from "../hooks/useClock";
import { useApp } from "../context/AppContext";
import { LogIn, LogOut, Clock, MapPin, Navigation, AlertCircle, CheckCircle2, X } from "lucide-react";

// ── Sub-tab: Office Check-In ────────────────────────────────────────────────
function OfficeCheckIn({ emp }) {
  const { doCheckIn, doCheckOut } = useApp();
  const [capturing, setCapturing] = useState(false);
  const [verified, setVerified] = useState(emp.checkedIn);
  const [location, setLocation] = useState(emp.checkInLocation || null);

  const handleCheckIn = useCallback(() => {
    setCapturing(true);
    setVerified(false);
    captureLocation((loc) => {
      setLocation(loc);
      setCapturing(false);
      setVerified(true);
      doCheckIn(emp.id, loc);
    });
  }, [emp.id, doCheckIn]);

  const handleCheckOut = () => {
    doCheckOut(emp.id);
    setVerified(false);
  };

  return (
    <div>
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24, textAlign: "center" }}>
        <GpsPulse capturing={capturing} verified={verified} size={96} />

        <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, color: TOKENS.navyDeep, marginTop: 16 }}>
          {capturing ? "Verifying location…" : verified ? "Location verified ✓" : "Ready to check in"}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4, maxWidth: 260 }}>
          {capturing
            ? "Confirming you're at an approved site — hold on."
            : verified
            ? "Your check-in has been geo-tagged and timestamped."
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
              ["Accuracy", location.accuracy ? `±${location.accuracy} m` : "Approximate"],
              ["Source", location.real ? "Live GPS" : "Fallback (permission denied)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 5 }}>
                <span style={{ color: TOKENS.muted }}>{k}</span>
                <span style={{
                  fontWeight: 600,
                  color: k === "Source" ? (location.real ? TOKENS.success : TOKENS.danger) : TOKENS.ink,
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
            {capturing ? "Capturing…" : "Check in with GPS"}
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
        {[
          { label: "Checked in", time: emp.checkInTime || "—", Icon: LogIn, color: emp.checkedIn ? TOKENS.success : TOKENS.muted },
          { label: "Lunch break", time: "1:02 PM – 1:38 PM", Icon: Clock, color: TOKENS.muted },
          { label: "Checked out", time: emp.checkedIn ? "In progress" : "—", Icon: LogOut, color: TOKENS.muted },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "13px 16px",
            borderBottom: i < 2 ? `1px solid ${TOKENS.border}` : "none",
          }}>
            <row.Icon size={16} color={row.color} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>{row.label}</div>
            <div style={{ fontSize: 12, color: TOKENS.muted }}>{row.time}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Sub-tab: OD Declaration ─────────────────────────────────────────────────
function ODStatus({ emp }) {
  const { declareOD, markODArrived } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ city: "", client: emp.clientName, from: "", to: "" });
  const [markingId, setMarkingId] = useState(null);
  const [capturing, setCapturing] = useState(false);

  const handleDeclare = () => {
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
    declareOD(emp.id, record);
    setShowForm(false);
    setForm({ city: "", client: emp.clientName, from: "", to: "" });
  };

  const handleArrived = (odId) => {
    setMarkingId(odId);
    setCapturing(true);
    captureLocation((loc) => {
      markODArrived(emp.id, odId, loc);
      setCapturing(false);
      setMarkingId(null);
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
          {emp.onOD ? `Currently on OD — ${emp.odCity}` : "Not on OD today"}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 4 }}>
          {emp.onOD ? "Tap an OD record below to mark arrival with GPS." : "Declare an OD trip to track your city visits."}
        </div>
        {!emp.onOD && (
          <button onClick={() => setShowForm(true)} style={{
            marginTop: 14, background: TOKENS.blue, color: "#fff", border: "none",
            borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 13,
            display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
          }}>
            <Navigation size={15} /> Declare OD trip
          </button>
        )}
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
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: `1.5px solid ${TOKENS.border}`, fontSize: 13, color: TOKENS.ink,
                  outline: "none", background: TOKENS.cream,
                }}
              />
            </div>
          ))}
          <button onClick={handleDeclare} style={{
            width: "100%", background: TOKENS.navyDeep, color: "#fff",
            border: "none", borderRadius: 12, padding: "12px 16px",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            Submit OD Declaration
          </button>
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
        {(emp.odHistory || []).map((od) => (
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
              <StatusPill status={od.arrived ? "arrived" : "not-arrived"} />
            </div>
            {od.arrived ? (
              <div style={{
                marginTop: 10, display: "flex", alignItems: "center", gap: 6,
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
                  marginTop: 10, width: "100%", background: TOKENS.navyDeep,
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
          </Card>
        ))}
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
        border: `1px solid ${TOKENS.border}`,
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
