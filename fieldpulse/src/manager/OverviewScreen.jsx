import React from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../context/AppContext";
import { AlertTriangle, MapPin, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

export function OverviewScreen({ onSelectEmp }) {
  const { team, tasks } = useApp();

  const checkedInCount = team.filter((e) => e.checkedIn).length;
  const onODCount      = team.filter((e) => e.onOD).length;
  const absentCount    = team.filter((e) => !e.checkedIn && !e.onOD).length;
  const avgScore       = Math.round(team.reduce((s, e) => s + e.score, 0) / team.length);
  const totalTasksDone = team.reduce((s, e) => s + e.tasksToday.done, 0);

  // City distribution
  const cityMap = {};
  team.forEach((e) => {
    const city = (e.onOD ? e.odCity : e.lastLocation?.split(",")[0]) || "Unknown";
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const cityData = Object.entries(cityMap).map(([city, count]) => ({ city, count }));

  // Alerts
  const alerts = [
    ...team.filter((e) => !e.checkedIn && !e.onOD).map((e) => ({
      type: "absent", name: e.name, msg: `Not checked in · Last seen ${e.lastSeen}`,
    })),
    ...team.filter((e) => e.onOD && (e.odHistory || []).some((od) => !od.arrived)).map((e) => ({
      type: "od-pending", name: e.name, msg: `On OD in ${e.odCity} — arrival not confirmed`,
    })),
  ];

  return (
    <div>
      {/* KPI tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Checked In", value: `${checkedInCount}/${team.length}`, color: TOKENS.success },
          { label: "On OD",      value: onODCount,    color: TOKENS.blue },
          { label: "Absent",     value: absentCount,  color: TOKENS.danger },
          { label: "Avg Score",  value: avgScore,     color: TOKENS.gold },
          { label: "Tasks Done", value: totalTasksDone, color: TOKENS.navyDeep },
          { label: "Team Size",  value: team.length,  color: TOKENS.muted },
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 3, letterSpacing: 0.4 }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <>
          <SectionLabel>⚠️ Active alerts</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                background: a.type === "absent" ? TOKENS.dangerBg : TOKENS.warningBg,
                border: `1px solid ${a.type === "absent" ? `${TOKENS.danger}40` : `${TOKENS.warning}40`}`,
                borderRadius: 12, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <AlertTriangle size={15} color={a.type === "absent" ? TOKENS.danger : TOKENS.warning} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>{a.name}</div>
                  <div style={{ fontSize: 11.5, color: TOKENS.muted }}>{a.msg}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* City distribution */}
      <SectionLabel>Agent city distribution</SectionLabel>
      <Card style={{ padding: "16px 8px 8px" }}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={cityData} barSize={28}>
            <CartesianGrid vertical={false} stroke="#F0ECE1" />
            <XAxis dataKey="city" tick={{ fontSize: 10, fill: TOKENS.muted }} axisLine={false} tickLine={false} />
            <YAxis hide allowDecimals={false} />
            <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 10, border: `1px solid ${TOKENS.border}` }} />
            <Bar dataKey="count" radius={[5, 5, 0, 0]} fill={TOKENS.navyMid} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Quick team peek */}
      <SectionLabel>Team snapshot</SectionLabel>
      <Card style={{ padding: 0 }}>
        {[...team].sort((a, b) => b.score - a.score).slice(0, 3).map((emp, i) => (
          <div key={emp.id}
            onClick={() => onSelectEmp(emp.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              borderBottom: i < 2 ? `1px solid ${TOKENS.border}` : "none",
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: TOKENS.navyMid,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>{emp.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>{emp.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: emp.checkedIn ? TOKENS.success : TOKENS.danger, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: TOKENS.muted }}>
                  {emp.checkedIn ? emp.lastLocation : "Not checked in"} · Score {emp.score}
                </span>
              </div>
            </div>
            <ChevronRight size={16} color={TOKENS.muted} />
          </div>
        ))}
      </Card>
    </div>
  );
}
