import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../context/AppContext";
import { Plus, X, Upload, IndianRupee } from "lucide-react";

const CATEGORIES = ["Travel", "Food", "Accommodation", "Other"];

const CATEGORY_EMOJI = {
  Travel: "🚌", Food: "🍽️", Accommodation: "🏨", Other: "📎",
};

export function ReimbursementScreen({ emp }) {
  const { addReimbursement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "Travel", amount: "", description: "",
    date: new Date().toISOString().slice(0, 10), receipt: null,
  });

  const reimbursements = emp.reimbursements || [];
  const pending = reimbursements.filter((r) => r.status === "pending");
  const approved = reimbursements.filter((r) => r.status === "approved");
  const monthTotal = approved.reduce((s, r) => s + r.amount, 0);

  const handleSubmit = () => {
    if (!form.amount || !form.description) return;
    const req = {
      id: `r-${Date.now()}`,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
      status: "pending",
      approvedBy: null,
      receipt: form.receipt,
    };
    addReimbursement(emp.id, req);
    setShowForm(false);
    setForm({ category: "Travel", amount: "", description: "", date: new Date().toISOString().slice(0, 10), receipt: null });
  };

  const handleReceipt = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, receipt: ev.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "flex", gap: 10 }}>
        <Card style={{ flex: 1, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.navyDeep }}>
            ₹{monthTotal.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2, letterSpacing: 0.5 }}>APPROVED THIS MONTH</div>
        </Card>
        <Card style={{ flex: 1, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.warning }}>
            {pending.length}
          </div>
          <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2, letterSpacing: 0.5 }}>PENDING APPROVAL</div>
        </Card>
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(true)} style={{
        marginTop: 14, width: "100%", background: TOKENS.gold, color: TOKENS.navyDeep,
        border: "none", borderRadius: 13, padding: "13px 16px",
        fontWeight: 700, fontSize: 13.5,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: "pointer",
      }}>
        <Plus size={17} /> Submit new reimbursement
      </button>

      {/* New request form */}
      {showForm && (
        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.navyDeep }}>
              New Request
            </div>
            <button onClick={() => setShowForm(false)} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <X size={18} color={TOKENS.muted} />
            </button>
          </div>

          {/* Category picker */}
          <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
            CATEGORY
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setForm((f) => ({ ...f, category: cat }))} style={{
                padding: "6px 12px", borderRadius: 10, border: `1.5px solid ${form.category === cat ? TOKENS.navyDeep : TOKENS.border}`,
                background: form.category === cat ? TOKENS.navyDeep : "#fff",
                color: form.category === cat ? "#fff" : TOKENS.ink,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {CATEGORY_EMOJI[cat]} {cat}
              </button>
            ))}
          </div>

          {/* Amount */}
          <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
            AMOUNT (₹)
          </label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TOKENS.muted, fontSize: 14 }}>₹</span>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              style={{
                width: "100%", padding: "10px 12px 10px 28px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 14, color: TOKENS.ink,
                outline: "none", background: TOKENS.cream,
              }}
            />
          </div>

          {/* Description */}
          <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
            DESCRIPTION
          </label>
          <textarea
            placeholder="Describe the expense…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: `1.5px solid ${TOKENS.border}`, fontSize: 13, color: TOKENS.ink,
              outline: "none", background: TOKENS.cream, resize: "none", marginBottom: 12,
            }}
          />

          {/* Date */}
          <label style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
            DATE
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: `1.5px solid ${TOKENS.border}`, fontSize: 13, color: TOKENS.ink,
              outline: "none", background: TOKENS.cream, marginBottom: 12,
            }}
          />

          {/* Receipt */}
          <label style={{
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            background: TOKENS.cream, border: `1.5px dashed ${TOKENS.border}`,
            borderRadius: 10, padding: "12px 14px", marginBottom: 14,
          }}>
            <Upload size={16} color={TOKENS.muted} />
            <span style={{ fontSize: 12.5, color: TOKENS.muted }}>
              {form.receipt ? "✓ Receipt uploaded" : "Upload receipt (photo / PDF)"}
            </span>
            <input type="file" accept="image/*,application/pdf" onChange={handleReceipt} style={{ display: "none" }} />
          </label>

          <button onClick={handleSubmit} style={{
            width: "100%", background: TOKENS.navyDeep, color: "#fff",
            border: "none", borderRadius: 12, padding: "12px 16px",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            Submit Request
          </button>
        </Card>
      )}

      <SectionLabel>My requests</SectionLabel>
      {reimbursements.length === 0 && (
        <Card style={{ textAlign: "center", color: TOKENS.muted, fontSize: 13, padding: 20 }}>
          No requests submitted yet.
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reimbursements.map((r) => (
          <Card key={r.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[r.category] || "📎"}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: TOKENS.ink }}>{r.category}</span>
                </div>
                <div style={{ fontSize: 12.5, color: TOKENS.muted }}>{r.description}</div>
                <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 3 }}>{r.date}</div>
                {r.rejectReason && (
                  <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 4, fontWeight: 600 }}>
                    Reason: {r.rejectReason}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, color: TOKENS.navyDeep }}>
                  ₹{r.amount.toLocaleString("en-IN")}
                </div>
                <StatusPill status={r.status} style={{ marginTop: 5, display: "inline-block" }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
