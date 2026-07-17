import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../context/AppContext";
import { CheckCircle2, XCircle, Clock, X } from "lucide-react";

const CATEGORY_EMOJI = { Travel: "🚌", Food: "🍽️", Accommodation: "🏨", Other: "📎" };
const FILTERS = ["Pending", "All", "Approved", "Rejected"];

export function ReimbursementApprovals() {
  const { team, updateReimbursement } = useApp();
  const [filter, setFilter] = useState("Pending");
  const [rejectModal, setRejectModal] = useState(null); // { empId, reimId }
  const [rejectReason, setRejectReason] = useState("");

  // Flatten all reimbursements with employee info
  const all = team.flatMap((emp) =>
    (emp.reimbursements || []).map((r) => ({ ...r, empId: emp.id, empName: emp.name, empInitials: emp.initials }))
  );

  const displayed = all.filter((r) => {
    if (filter === "All")      return true;
    if (filter === "Pending")  return r.status === "pending";
    if (filter === "Approved") return r.status === "approved";
    if (filter === "Rejected") return r.status === "rejected";
    return true;
  });

  const pendingCount   = all.filter((r) => r.status === "pending").length;
  const approvedTotal  = all.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0);

  const handleApprove = (empId, reimId) => updateReimbursement(empId, reimId, "approved");

  const handleReject = () => {
    if (rejectModal) {
      updateReimbursement(rejectModal.empId, rejectModal.reimId, "rejected", rejectReason);
      setRejectModal(null);
      setRejectReason("");
    }
  };

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "flex", gap: 10 }}>
        <Card style={{ flex: 1, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.warning }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2, letterSpacing: 0.5 }}>AWAITING APPROVAL</div>
        </Card>
        <Card style={{ flex: 1, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.success }}>
            ₹{approvedTotal.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2, letterSpacing: 0.5 }}>APPROVED THIS MONTH</div>
        </Card>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, margin: "14px 0", overflowX: "auto" }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20,
            background: filter === f ? TOKENS.navyDeep : "#fff",
            color: filter === f ? "#fff" : TOKENS.muted,
            border: `1.5px solid ${filter === f ? TOKENS.navyDeep : TOKENS.border}`,
            fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}>{f}</button>
        ))}
      </div>

      {/* Requests */}
      {displayed.length === 0 && (
        <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 24 }}>
          No {filter.toLowerCase()} requests.
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {displayed.map((r) => (
          <Card key={r.id} style={{ padding: 14 }}>
            {/* Employee tag */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: TOKENS.navyMid,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}>{r.empInitials}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: TOKENS.navyDeep }}>{r.empName}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {CATEGORY_EMOJI[r.category] || "📎"} {r.category}
                </div>
                <div style={{ fontSize: 12, color: TOKENS.muted, marginTop: 2 }}>{r.description}</div>
                <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>{r.date}</div>
                {r.rejectReason && (
                  <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 4, fontWeight: 600 }}>
                    Reason: {r.rejectReason}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: TOKENS.navyDeep }}>
                  ₹{r.amount.toLocaleString("en-IN")}
                </div>
                <StatusPill status={r.status} style={{ marginTop: 4, display: "inline-block" }} />
              </div>
            </div>

            {r.status === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => handleApprove(r.empId, r.id)}
                  style={{
                    flex: 1, background: TOKENS.success, color: "#fff", border: "none",
                    borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 12.5,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <CheckCircle2 size={15} /> Approve
                </button>
                <button
                  onClick={() => { setRejectModal({ empId: r.empId, reimId: r.id }); setRejectReason(""); }}
                  style={{
                    flex: 1, background: "#fff", color: TOKENS.danger,
                    border: `1.5px solid ${TOKENS.danger}`, borderRadius: 10, padding: "9px 0",
                    fontWeight: 700, fontSize: 12.5,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Reject reason modal overlay */}
      {rejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,20,40,0.55)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 100, padding: "0 0 20px",
        }}>
          <div style={{
            background: "#fff", borderRadius: "20px 20px 14px 14px", padding: 20,
            width: "100%", maxWidth: 390, boxShadow: "0 -10px 30px rgba(10,20,40,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.navyDeep }}>
                Reject Reason
              </div>
              <button onClick={() => setRejectModal(null)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <X size={18} color={TOKENS.muted} />
              </button>
            </div>
            <textarea
              placeholder="Explain why this request is being rejected…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13, outline: "none",
                background: TOKENS.cream, resize: "none", marginBottom: 12,
              }}
            />
            <button onClick={handleReject} style={{
              width: "100%", background: TOKENS.danger, color: "#fff",
              border: "none", borderRadius: 12, padding: "12px 16px",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
              Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
