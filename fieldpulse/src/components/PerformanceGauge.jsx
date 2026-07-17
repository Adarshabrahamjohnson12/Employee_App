import React from "react";
import { TOKENS } from "../tokens";

export function PerformanceGauge({ score = 0, size = 148, label = "Performance" }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const arcFraction = 0.75;
  const dash = c * arcFraction;
  const offset = dash * (1 - pct);

  const color =
    score >= 90 ? TOKENS.success :
    score >= 70 ? TOKENS.gold :
    TOKENS.danger;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(135deg)" }}>
        <defs>
          <linearGradient id="gaugeGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={TOKENS.goldLight} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#E9E3D2" strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="url(#gaugeGold)" strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: size * 0.23,
          fontWeight: 700, color: TOKENS.navyDeep, lineHeight: 1,
        }}>
          {score}
        </div>
        <div style={{
          fontFamily: "Inter, sans-serif", fontSize: 10,
          color: TOKENS.muted, letterSpacing: 0.8,
          textTransform: "uppercase", marginTop: 4,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
