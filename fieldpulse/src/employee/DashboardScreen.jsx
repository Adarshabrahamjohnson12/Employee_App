import React from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { PerformanceGauge } from "../components/PerformanceGauge";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../context/AppContext";
import {
  Zap, ListChecks, LogIn, CheckCircle2, Circle, MapPin, Star, AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DashboardScreen({ emp, goTab }) {
  if (!emp) return null;
  const { tasks } = useApp();
  const myTasks = Array.isArray(tasks) ? tasks : [];
  const recentTasks = myTasks.slice(0, 3);

  const weekData = DAYS.map((day, i) => ({
    day,
    hrs: emp.weeklyHours?.[i] ?? 0,
    target: day === "Sat" ? 5 : day === "Sun" ? 0 : 8,
  }));

  const perfIndex = emp.performanceIndex ?? emp.score ?? 0;

  return (
    <div>
      {/* Hero card */}
      <div style={{
        background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
        borderRadius: 20, padding: "20px 18px",
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -28, top: -28,
          width: 130, height: 130, borderRadius: "50%",
          background: "rgba(201,162,39,0.12)",
        }} />
        <div style={{
          position: "absolute", right: 20, bottom: -40,
          width: 90, height: 90, borderRadius: "50%",
          background: "rgba(201,162,39,0.07)",
        }} />
        <div style={{ fontSize: 12, color: "#C7D2E3", letterSpacing: 0.3 }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
        </div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, marginTop: 2 }}>
          {emp.name}
        </div>
        <div style={{ fontSize: 12, color: "#9FB0C9", marginTop: 2 }}>{emp.role} · {emp.teamName}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: emp.checkedIn ? "#5FD68B" : "#E8896F",
            boxShadow: emp.checkedIn ? "0 0 0 3px rgba(95,214,139,0.25)" : "none",
          }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {emp.checkedIn
              ? `Checked in at ${emp.checkInTime}`
              : emp.onOD
              ? `On OD — ${emp.odCity}`
              : "Not checked in yet"}
          </span>
        </div>

        {!emp.checkedIn && (
          <button onClick={() => goTab("checkin")} style={{
            marginTop: 14, background: TOKENS.gold, color: TOKENS.navyDeep,
            border: "none", borderRadius: 12, padding: "10px 16px",
            fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center",
            gap: 6, cursor: "pointer",
          }}>
            <LogIn size={15} /> Check in now
          </button>
        )}

        {emp.onOD && (
          <div style={{
            marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(37,99,235,0.3)", borderRadius: 10,
            padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#93C5FD",
          }}>
            <MapPin size={12} /> On OD in {emp.odCity}
          </div>
        )}
      </div>

      {/* Gauge + stats row */}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Card style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 12 }}>
          <PerformanceGauge score={perfIndex} size={124} label="Performance" />
        </Card>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <Zap size={14} color={TOKENS.gold} />
              <span style={{ fontSize: 10, color: TOKENS.muted, fontWeight: 700, letterSpacing: 0.5 }}>STREAK</span>
            </div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.navyDeep }}>
              {emp.streak} <span style={{ fontSize: 14, fontWeight: 400 }}>days</span>
            </div>
          </Card>
          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <ListChecks size={14} color={TOKENS.gold} />
              <span style={{ fontSize: 10, color: TOKENS.muted, fontWeight: 700, letterSpacing: 0.5 }}>TASKS TODAY</span>
            </div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: TOKENS.navyDeep }}>
              {emp.tasksToday?.done || 0}
              <span style={{ fontSize: 14, color: TOKENS.muted, fontWeight: 400 }}>/{emp.tasksToday?.total || 0}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Benefits Status Banner */}
      <div style={{ marginTop: 12 }}>
        {perfIndex >= 90 ? (
          <div style={{
            background: TOKENS.successBg, border: `1px solid ${TOKENS.success}`,
            borderRadius: 14, padding: "10px 14px", fontSize: 12, fontWeight: 700,
            color: TOKENS.success, display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={16} fill={TOKENS.success} color={TOKENS.success} />
              <span>Performance: {perfIndex}% · Eligible for Benefits</span>
            </div>
            <span style={{ fontSize: 11, background: TOKENS.success, color: "#fff", padding: "2px 8px", borderRadius: 8 }}>≥90% ✓</span>
          </div>
        ) : (
          <div style={{
            background: `${TOKENS.danger}15`, border: `1px solid ${TOKENS.danger}44`,
            borderRadius: 14, padding: "10px 14px", fontSize: 12, fontWeight: 700,
            color: TOKENS.danger, display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} color={TOKENS.danger} />
              <span>Performance: {perfIndex}% · Below 90% Threshold</span>
            </div>
            <span style={{ fontSize: 11, background: TOKENS.danger, color: "#fff", padding: "2px 8px", borderRadius: 8 }}>Need 90%</span>
          </div>
        )}
      </div>

      {/* Weekly hours */}
      <SectionLabel>This week's hours</SectionLabel>
      <Card style={{ padding: "16px 8px 8px" }}>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={weekData} barSize={14}>
            <CartesianGrid vertical={false} stroke="#F0ECE1" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: TOKENS.muted }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(201,162,39,0.08)" }}
              contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 10, border: `1px solid ${TOKENS.border}` }}
            />
            <Bar dataKey="hrs" radius={[5, 5, 0, 0]} fill={TOKENS.gold} />
            <Bar dataKey="target" radius={[5, 5, 0, 0]} fill="#E9E3D2" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent activity */}
      <SectionLabel>Recent activity</SectionLabel>
      <Card style={{ padding: 0 }}>
        {recentTasks.map((t, i) => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 16px",
            borderBottom: i < recentTasks.length - 1 ? `1px solid ${TOKENS.border}` : "none",
          }}>
            {t.status === "done"
              ? <CheckCircle2 size={17} color={TOKENS.success} />
              : <Circle size={17} color={TOKENS.muted} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.title}
              </div>
              <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 1 }}>{t.location}</div>
            </div>
            <StatusPill status={t.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}
