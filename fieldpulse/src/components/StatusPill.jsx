import React from "react";
import { TOKENS } from "../tokens";

const STATUS_MAP = {
  done:        { bg: TOKENS.successBg, fg: TOKENS.success,  label: "Completed" },
  pending:     { bg: TOKENS.warningBg, fg: TOKENS.warning,  label: "Pending" },
  approved:    { bg: TOKENS.successBg, fg: TOKENS.success,  label: "Approved" },
  rejected:    { bg: TOKENS.dangerBg,  fg: TOKENS.danger,   label: "Rejected" },
  late:        { bg: TOKENS.dangerBg,  fg: TOKENS.danger,   label: "Late" },
  present:     { bg: TOKENS.successBg, fg: TOKENS.success,  label: "Present" },
  absent:      { bg: TOKENS.dangerBg,  fg: TOKENS.danger,   label: "Absent" },
  od:          { bg: TOKENS.blueBg,    fg: TOKENS.blue,     label: "On OD" },
  arrived:     { bg: TOKENS.successBg, fg: TOKENS.success,  label: "Arrived" },
  "not-arrived":{ bg: TOKENS.dangerBg, fg: TOKENS.danger,   label: "Not Arrived" },
  "on-time":   { bg: TOKENS.successBg, fg: TOKENS.success,  label: "On Time" },
  completed:   { bg: TOKENS.successBg, fg: TOKENS.success,  label: "Completed" },
  report:      { bg: `${TOKENS.gold}22`, fg: TOKENS.gold,     label: "Report Sent" },
  "daily-report": { bg: `${TOKENS.gold}22`, fg: TOKENS.gold,  label: "Report Sent" },
};

export function StatusPill({ status, style }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{
      background: s.bg, color: s.fg,
      fontSize: 11, fontWeight: 700,
      padding: "4px 10px", borderRadius: 20,
      letterSpacing: 0.2, whiteSpace: "nowrap",
      ...style,
    }}>{s.label}</span>
  );
}
