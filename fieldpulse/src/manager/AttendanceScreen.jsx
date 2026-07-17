import React, { useState } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { useApp } from "../context/AppContext";
import { ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  present:  TOKENS.gold,
  od:       TOKENS.blue,
  late:     TOKENS.warning,
  absent:   TOKENS.danger,
  off:      "#CCC",
};

const STATUS_LABELS = {
  present: "P", od: "OD", late: "L", absent: "A", off: "—",
};

function AttendanceDot({ status }) {
  return (
    <div style={{
      width: 10, height: 10, borderRadius: "50%",
      background: STATUS_COLORS[status] || "#CCC",
      title: status,
    }} />
  );
}

export function AttendanceScreen({ onSelectEmp }) {
  const { team } = useApp();
  const [selectedEmp, setSelectedEmp] = useState(null);

  const emp = selectedEmp ? team.find((e) => e.id === selectedEmp) : null;

  // Get last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  // Legend
  const legend = [
    { label: "Present", color: TOKENS.gold },
    { label: "On OD",   color: TOKENS.blue },
    { label: "Late",    color: TOKENS.warning },
    { label: "Absent",  color: TOKENS.danger },
  ];

  if (emp) {
    const attendance = emp.attendance || {};
    const presentCount = days.filter((d) => attendance[d] === "present").length;
    const odCount      = days.filter((d) => attendance[d] === "od").length;
    const lateCount    = days.filter((d) => attendance[d] === "late").length;
    const absentCount  = days.filter((d) => attendance[d] === "absent").length;

    return (
      <div>
        <button onClick={() => setSelectedEmp(null)} style={{
          display: "flex", alignItems: "center", gap: 6, border: "none",
          background: "none", color: TOKENS.navyDeep, cursor: "pointer",
          marginBottom: 14, fontWeight: 700, fontSize: 13,
        }}>
          ← {emp.name}
        </button>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
          {[
            { label: "Present", value: presentCount, color: TOKENS.gold },
            { label: "On OD",   value: odCount,      color: TOKENS.blue },
            { label: "Late",    value: lateCount,     color: TOKENS.warning },
            { label: "Absent",  value: absentCount,   color: TOKENS.danger },
          ].map(({ label, value, color }) => (
            <Card key={label} style={{ padding: 12, textAlign: "center" }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 10.5, color: TOKENS.muted, marginTop: 2 }}>{label}</div>
            </Card>
          ))}
        </div>

        <SectionLabel>Last 30 days</SectionLabel>
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          {legend.map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 11, color: TOKENS.muted }}>{label}</span>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, color: TOKENS.muted, fontWeight: 700 }}>{d}</div>
            ))}
            {/* Offset for first day of 30-day window */}
            {Array.from({ length: new Date(days[0]).getDay() }, (_, i) => (
              <div key={`off-${i}`} />
            ))}
            {days.map((day) => {
              const status = attendance[day] || "absent";
              const dayNum = parseInt(day.slice(8), 10);
              return (
                <div key={day} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}>
                  <div style={{ fontSize: 9.5, color: TOKENS.muted }}>{dayNum}</div>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: STATUS_COLORS[status] || "#EEE",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8.5, fontWeight: 700, color: "#fff",
                  }}>
                    {STATUS_LABELS[status] || ""}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Attendance — all agents</SectionLabel>
      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
        {legend.map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 11, color: TOKENS.muted }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {team.map((emp) => {
          const attendance = emp.attendance || {};
          const last14 = days.slice(-14);
          return (
            <Card key={emp.id} onClick={() => setSelectedEmp(emp.id)} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: TOKENS.navyMid,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>{emp.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: TOKENS.muted }}>{emp.role}</div>
                </div>
                <ChevronRight size={16} color={TOKENS.muted} />
              </div>
              {/* Mini 14-day dot row */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {last14.map((day) => (
                  <div key={day} style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: STATUS_COLORS[attendance[day] || "absent"] || "#EEE",
                    title: day,
                  }} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
