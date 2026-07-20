import React, { useState, useEffect } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../context/AppContext";
import { CalendarDays, Plus, X, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const LEAVE_TYPES = [
  { id: "CL", label: "Casual Leave (CL)" },
  { id: "ML", label: "Medical Leave (ML)" },
];

function countDays(from, to) {
  if (!from || !to) return 0;
  const f = new Date(from), t = new Date(to);
  return Math.max(0, Math.round((t - f) / 86400000) + 1);
}

export function LeaveScreen({ emp }) {
  const { applyLeave, fetchLeaves } = useApp();
  const [balance, setBalance] = useState(emp.leaveBalance || {
    total: 12, used: 0, remaining: 12,
    clTotal: 6, clUsed: 0, clRemaining: 6,
    mlTotal: 6, mlUsed: 0, mlRemaining: 6
  });
  const [applications, setApplications] = useState(emp.leaveApplications || []);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    leaveType: "CL",
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  // Refresh from API
  useEffect(() => {
    if (fetchLeaves) {
      fetchLeaves().then(data => {
        if (data?.balance) setBalance(data.balance);
        if (data?.data) setApplications(data.data);
      }).catch(() => {});
    }
  }, []);

  const days = countDays(form.from, form.to);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (days <= 0) { setError("Invalid date range."); return; }
    if (!form.reason.trim()) { setError("Please provide a reason."); return; }
    setSubmitting(true);
    try {
      await applyLeave(form);
      setSuccess("Leave application submitted. Pending manager approval.");
      setShowForm(false);
      setForm({ leaveType: "CL", from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10), reason: "" });
      // Refresh
      if (fetchLeaves) {
        const data = await fetchLeaves();
        if (data?.balance) setBalance(data.balance);
        if (data?.data) setApplications(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit leave.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Yearly Allowance Banner */}
      <Card style={{ background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`, color: "#fff", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9FB0C9", letterSpacing: 0.5 }}>ANNUAL LEAVE ALLOWANCE</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.gold, marginTop: 2 }}>
          12 Days / Year
        </div>
        <div style={{ fontSize: 11.5, color: "#9FB0C9", marginTop: 3 }}>
          6 Casual Leaves (CL) + 6 Medical Leaves (ML)
        </div>
      </Card>

      {/* Balance Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <Card style={{ padding: 12, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.navyDeep }}>
            {balance.clRemaining ?? (6 - (balance.clUsed || 0))}/6
          </div>
          <div style={{ fontSize: 9.5, color: TOKENS.muted, marginTop: 2, fontWeight: 700 }}>CL REMAINING</div>
        </Card>
        <Card style={{ padding: 12, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.navyDeep }}>
            {balance.mlRemaining ?? (6 - (balance.mlUsed || 0))}/6
          </div>
          <div style={{ fontSize: 9.5, color: TOKENS.muted, marginTop: 2, fontWeight: 700 }}>ML REMAINING</div>
        </Card>
        <Card style={{ padding: 12, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.success }}>
            {balance.remaining ?? 12}
          </div>
          <div style={{ fontSize: 9.5, color: TOKENS.muted, marginTop: 2, fontWeight: 700 }}>TOTAL LEFT</div>
        </Card>
      </div>

      {/* Success / Error */}
      {success && (
        <div style={{ background: TOKENS.successBg, border: `1px solid ${TOKENS.success}`, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: TOKENS.success, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={15} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: TOKENS.dangerBg, border: `1px solid ${TOKENS.danger}`, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: TOKENS.danger, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Apply button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{
          width: "100%", background: TOKENS.navyDeep, color: "#fff",
          border: "none", borderRadius: 13, padding: "13px 16px",
          fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, cursor: "pointer", marginBottom: 16,
        }}>
          <Plus size={17} /> Apply for Leave (CL / ML)
        </button>
      )}

      {/* Application Form */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.navyDeep }}>
              Leave Application
            </div>
            <button onClick={() => { setShowForm(false); setError(""); }} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <X size={18} color={TOKENS.muted} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Leave Type */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>LEAVE TYPE</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {LEAVE_TYPES.map(lt => (
                <button key={lt.id} type="button" onClick={() => setForm(f => ({ ...f, leaveType: lt.id }))} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${form.leaveType === lt.id ? TOKENS.navyDeep : TOKENS.border}`,
                  background: form.leaveType === lt.id ? TOKENS.navyDeep : "#fff",
                  color: form.leaveType === lt.id ? "#fff" : TOKENS.ink,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>{lt.label}</button>
              ))}
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              {[["From Date", "from"], ["To Date", "to"]].map(([label, field]) => (
                <div key={field}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</label>
                  <input type="date" value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: `1.5px solid ${TOKENS.border}`, fontSize: 13, color: TOKENS.ink, outline: "none", background: TOKENS.cream }}
                  />
                </div>
              ))}
            </div>

            {days > 0 && (
              <div style={{ background: `${TOKENS.gold}18`, border: `1px solid ${TOKENS.gold}44`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: TOKENS.navyDeep, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} /> {days} day{days > 1 ? "s" : ""} selected
              </div>
            )}

            {/* Reason */}
            <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>REASON</label>
            <textarea
              placeholder="State your reason for leave…"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${TOKENS.border}`, fontSize: 13, color: TOKENS.ink, outline: "none", background: TOKENS.cream, resize: "none", marginBottom: 14 }}
            />

            <button type="submit" disabled={submitting} style={{
              width: "100%", background: TOKENS.navyDeep, color: "#fff",
              border: "none", borderRadius: 12, padding: "12px", fontWeight: 700,
              fontSize: 13, cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? "Submitting…" : "Submit Leave Application"}
            </button>
          </form>
        </Card>
      )}

      {/* History */}
      <SectionLabel>My Leave Applications</SectionLabel>
      {applications.length === 0 && (
        <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 24 }}>
          <CalendarDays size={28} color={TOKENS.border} style={{ margin: "0 auto 8px" }} />
          No leave applications yet.
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {applications.map(a => {
          const days = countDays(a.from, a.to);
          return (
            <Card key={a.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ background: `${TOKENS.navyDeep}12`, color: TOKENS.navyDeep, borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      {a.leave_type || a.leaveType || "CL"}
                    </span>
                    <span style={{ fontSize: 12, color: TOKENS.muted }}>{days} day{days > 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>
                    {a.from} → {a.to}
                  </div>
                  <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 3 }}>{a.reason}</div>
                  {a.rejectReason && (
                    <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 4, fontWeight: 600 }}>
                      Rejection reason: {a.rejectReason}
                    </div>
                  )}
                </div>
                <StatusPill status={a.status} />
              </div>
            </Card>
          );
        })}
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
