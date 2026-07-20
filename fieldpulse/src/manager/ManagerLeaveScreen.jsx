import React, { useState, useEffect, useCallback } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../context/AppContext";
import { CheckCircle2, XCircle, Clock, X, Calendar, User, FileText } from "lucide-react";

const FILTERS = ["Pending", "All", "Approved", "Rejected"];

function countDays(from, to) {
  if (!from || !to) return 0;
  const f = new Date(from), t = new Date(to);
  if (isNaN(f) || isNaN(t)) return 0;
  return Math.max(0, Math.round((t - f) / 86400000) + 1);
}

export function ManagerLeaveScreen() {
  const { fetchLeaves, updateLeave } = useApp();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const loadLeaves = useCallback(async () => {
    try {
      const res = await fetchLeaves();
      setLeaves(res.data || []);
    } catch (err) {
      console.error("Error fetching leaves:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchLeaves]);

  useEffect(() => {
    loadLeaves();
    const timer = setInterval(loadLeaves, 4000); // sync every 4s
    return () => clearInterval(timer);
  }, [loadLeaves]);

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await updateLeave(id, "approved");
      await loadLeaves();
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActioningId(rejectModal.id);
    try {
      await updateLeave(rejectModal.id, "rejected", rejectReason);
      setRejectModal(null);
      setRejectReason("");
      await loadLeaves();
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const displayed = leaves.filter((l) => {
    if (filter === "All") return true;
    if (filter === "Pending") return l.status === "pending";
    if (filter === "Approved") return l.status === "approved";
    if (filter === "Rejected") return l.status === "rejected";
    return true;
  });

  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;

  return (
    <div>
      {/* Summary Row */}
      <div style={{ display: "flex", gap: 10 }}>
        <Card style={{ flex: 1, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.warning }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2, letterSpacing: 0.5 }}>PENDING LEAVE REQUESTS</div>
        </Card>
        <Card style={{ flex: 1, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.success }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2, letterSpacing: 0.5 }}>APPROVED LEAVES</div>
        </Card>
      </div>

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: 8, margin: "14px 0", overflowX: "auto" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              background: filter === f ? TOKENS.navyDeep : "#fff",
              color: filter === f ? "#fff" : TOKENS.muted,
              border: `1.5px solid ${filter === f ? TOKENS.navyDeep : TOKENS.border}`,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <SectionLabel>Employee Leave Applications</SectionLabel>

      {loading && leaves.length === 0 ? (
        <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 24 }}>
          Loading leave applications…
        </Card>
      ) : displayed.length === 0 ? (
        <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 24 }}>
          No {filter.toLowerCase()} leave applications found.
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.map((l) => {
            const numDays = countDays(l.from_date || l.from, l.to_date || l.to);
            return (
              <Card key={l.id} style={{ padding: 16 }}>
                {/* Header: Employee & Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: TOKENS.navyMid,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {l.initials || l.emp_name?.slice(0, 2)?.toUpperCase() || "EP"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: TOKENS.navyDeep }}>
                        {l.emp_name || l.employee_id}
                      </div>
                      <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 1 }}>
                        Emp ID: {l.employee_id} {l.cl_total ? `· CL Balance: ${l.cl_total - l.cl_used}/${l.cl_total}` : ""}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={l.status} />
                </div>

                {/* Details */}
                <div
                  style={{
                    background: TOKENS.cream,
                    borderRadius: 10,
                    padding: 12,
                    marginTop: 12,
                    border: `1.5px solid ${TOKENS.border}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TOKENS.navyDeep }}>
                      🌴 {l.leave_type || l.leaveType || "Casual Leave (CL)"}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: TOKENS.gold, background: `${TOKENS.navyDeep}12`, padding: "2px 8px", borderRadius: 6 }}>
                      {numDays} {numDays === 1 ? "Day" : "Days"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TOKENS.ink, marginBottom: 6 }}>
                    <Calendar size={13} color={TOKENS.muted} />
                    <span>
                      <strong>{l.from_date || l.from}</strong> to <strong>{l.to_date || l.to}</strong>
                    </span>
                  </div>

                  {l.reason && (
                    <div style={{ fontSize: 12, color: TOKENS.ink, fontStyle: "italic", borderTop: `1px dashed ${TOKENS.border}`, paddingTop: 6, marginTop: 6 }}>
                      "{l.reason}"
                    </div>
                  )}
                </div>

                {l.rejectReason && (
                  <div style={{ fontSize: 11.5, color: TOKENS.danger, marginTop: 8, fontWeight: 600 }}>
                    Rejection Reason: {l.rejectReason}
                  </div>
                )}

                {/* Approve / Reject Actions */}
                {l.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleApprove(l.id)}
                      disabled={actioningId === l.id}
                      style={{
                        flex: 1,
                        background: TOKENS.success,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "9px 0",
                        fontWeight: 700,
                        fontSize: 12.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        cursor: "pointer",
                        opacity: actioningId === l.id ? 0.6 : 1,
                      }}
                    >
                      <CheckCircle2 size={15} /> Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectModal({ id: l.id });
                        setRejectReason("");
                      }}
                      disabled={actioningId === l.id}
                      style={{
                        flex: 1,
                        background: "#fff",
                        color: TOKENS.danger,
                        border: `1.5px solid ${TOKENS.danger}`,
                        borderRadius: 10,
                        padding: "9px 0",
                        fontWeight: 700,
                        fontSize: 12.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        cursor: "pointer",
                        opacity: actioningId === l.id ? 0.6 : 1,
                      }}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,20,40,0.55)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 100,
            padding: "0 0 20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px 20px 14px 14px",
              padding: 20,
              width: "100%",
              maxWidth: 390,
              boxShadow: "0 -10px 30px rgba(10,20,40,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.navyDeep }}>
                Reject Leave Application
              </div>
              <button onClick={() => setRejectModal(null)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <X size={18} color={TOKENS.muted} />
              </button>
            </div>
            <textarea
              placeholder="Provide reason for rejecting leave request…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`,
                fontSize: 13,
                outline: "none",
                background: TOKENS.cream,
                resize: "none",
                marginBottom: 12,
              }}
            />
            <button
              onClick={handleReject}
              style={{
                width: "100%",
                background: TOKENS.danger,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
