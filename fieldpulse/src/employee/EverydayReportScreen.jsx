import React, { useState, useEffect } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { useApp } from "../context/AppContext";
import { Calendar, Clock, FileText, CheckCircle2, Send, AlertCircle, Sparkles, History } from "lucide-react";

export function EverydayReportScreen() {
  const { submitDailyReport, fetchMyDailyReports } = useApp();

  const getTodayDateStr = () => new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(getTodayDateStr());
  const [work, setWork] = useState("");
  const [timeSpent, setTimeSpent] = useState("8 hrs");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await fetchMyDailyReports();
      setHistory(data || []);
    } catch (err) {
      console.error("Failed to load report history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const todayStr = getTodayDateStr();
    if (date > todayStr) {
      setErrorMsg("Cannot submit reports for future dates. Please select today or a past date.");
      return;
    }
    if (!work.trim()) {
      setErrorMsg("Please describe the work completed today.");
      return;
    }
    if (!timeSpent.trim()) {
      setErrorMsg("Please specify the time spent.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      // Extract numeric hours from timeSpent string if possible
      const match = timeSpent.match(/(\d+(\.\d+)?)/);
      const numericHours = match ? parseFloat(match[1]) : 8;

      await submitDailyReport({
        date,
        work,
        timeSpent,
        hours: numericHours,
        remarks,
      });

      setSuccessMsg("Everyday report submitted successfully! Reflecting on Manager section.");
      setWork("");
      setRemarks("");
      await loadHistory();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setPresetDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split("T")[0]);
  };

  const TIME_PRESETS = ["2 hrs", "4 hrs", "6 hrs", "7.5 hrs", "8 hrs", "9 hrs"];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header Banner */}
      <Card style={{
        background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
        color: "#fff",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${TOKENS.gold}22`, border: `1.5px solid ${TOKENS.gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={22} color={TOKENS.gold} />
          </div>
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
              Everyday Work Report
            </h2>
            <p style={{ fontSize: 12, color: TOKENS.goldLight, margin: 0, fontWeight: 500 }}>
              Submit daily work summary & hours spent for your manager
            </p>
          </div>
        </div>
      </Card>

      {/* Form Card */}
      <Card style={{ marginBottom: 24 }}>
        <SectionLabel icon={Sparkles} label="NEW DAILY SUBMISSION" />

        {successMsg && (
          <div style={{
            background: "#E6F4EA", border: `1px solid ${TOKENS.success}`,
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8, color: "#137333", fontSize: 13, fontWeight: 600,
          }}>
            <CheckCircle2 size={18} color={TOKENS.success} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: "#FCE8E6", border: `1px solid ${TOKENS.danger}`,
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8, color: "#C5221F", fontSize: 13, fontWeight: 600,
          }}>
            <AlertCircle size={18} color={TOKENS.danger} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Date Picker */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: TOKENS.navyDeep, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} color={TOKENS.gold} />
                Select Date *
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setPresetDate(0)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    border: date === getTodayDateStr() ? `1px solid ${TOKENS.gold}` : `1px solid ${TOKENS.border}`,
                    background: date === getTodayDateStr() ? `${TOKENS.gold}22` : "#F5F7FA",
                    color: date === getTodayDateStr() ? TOKENS.navyDeep : TOKENS.muted, cursor: "pointer",
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(1)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    border: `1px solid ${TOKENS.border}`, background: "#F5F7FA",
                    color: TOKENS.muted, cursor: "pointer",
                  }}
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              value={date}
              max={getTodayDateStr()}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 14,
                fontFamily: "Inter, sans-serif", outline: "none", background: "#F8FAFC",
              }}
            />
          </div>

          {/* Work Done Textarea */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: TOKENS.navyDeep, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <FileText size={14} color={TOKENS.gold} />
              Work Performed Today *
            </label>
            <textarea
              rows={4}
              value={work}
              onChange={(e) => setWork(e.target.value)}
              placeholder="Describe tasks completed, client visits, machine installations, gold audits, or meetings..."
              required
              style={{
                width: "100%", padding: "12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 13.5,
                fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical",
                lineHeight: 1.5, background: "#F8FAFC",
              }}
            />
          </div>

          {/* Time Spent */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: TOKENS.navyDeep, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Clock size={14} color={TOKENS.gold} />
              Time Spent *
            </label>

            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTimeSpent(preset)}
                  style={{
                    padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700,
                    border: timeSpent === preset ? `1.5px solid ${TOKENS.gold}` : `1px solid ${TOKENS.border}`,
                    background: timeSpent === preset ? `${TOKENS.gold}22` : "#F1F5F9",
                    color: timeSpent === preset ? TOKENS.navyDeep : TOKENS.navySoft, cursor: "pointer",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="e.g. 8 hrs or 4 hrs 30 mins"
              required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${TOKENS.border}`, fontSize: 14,
                fontFamily: "Inter, sans-serif", outline: "none", background: "#F8FAFC",
              }}
            />
          </div>

          {/* Remarks */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: TOKENS.muted, marginBottom: 4, display: "block" }}>
              Additional Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any pending items or follow-ups for tomorrow..."
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 10,
                border: `1px solid ${TOKENS.border}`, fontSize: 13,
                fontFamily: "Inter, sans-serif", outline: "none", background: "#F8FAFC",
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6, padding: "14px", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${TOKENS.gold}, #D4AF37)`,
              color: TOKENS.navyDeep, fontFamily: "Inter, sans-serif", fontSize: 14,
              fontWeight: 800, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 4px 14px ${TOKENS.gold}40`, transition: "all 0.15s ease",
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: "spin 1s linear infinite" }}>⟳</span>
                Submitting Report...
              </>
            ) : (
              <>
                <Send size={16} color={TOKENS.navyDeep} />
                Submit Everyday Report
              </>
            )}
          </button>
        </form>
      </Card>

      {/* My Submitted Reports History */}
      <div>
        <SectionLabel icon={History} label="SUBMISSION HISTORY" />

        {loadingHistory ? (
          <div style={{ padding: 20, textAlign: "center", color: TOKENS.muted, fontSize: 13 }}>
            Loading previous report submissions...
          </div>
        ) : history.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 24, color: TOKENS.muted }}>
            <FileText size={32} color={TOKENS.border} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.navySoft }}>No report submissions yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Fill out the form above to submit your first report!</div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((rep) => (
              <Card key={rep.id} style={{ padding: 16, borderLeft: `4px solid ${TOKENS.gold}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TOKENS.navyDeep }}>
                      📅 {rep.date}
                    </span>
                    {rep.submitted_at && (
                      <span style={{ fontSize: 10, color: TOKENS.muted, marginLeft: 8 }}>
                        Submitted at {new Date(rep.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div style={{
                    background: `${TOKENS.gold}22`, border: `1px solid ${TOKENS.gold}66`,
                    borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: TOKENS.navyDeep,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Clock size={12} color={TOKENS.navyDeep} />
                    {rep.time_spent}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: TOKENS.navySoft, lineHeight: 1.5, marginBottom: rep.remarks ? 6 : 0, whiteSpace: "pre-wrap" }}>
                  {rep.work}
                </div>

                {rep.remarks && (
                  <div style={{ fontSize: 11, color: TOKENS.muted, fontStyle: "italic", background: "#F8FAFC", padding: "6px 10px", borderRadius: 6, marginTop: 6 }}>
                    Note: {rep.remarks}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
