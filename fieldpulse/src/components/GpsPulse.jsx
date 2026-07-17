import React from "react";
import { TOKENS } from "../tokens";
import { CheckCircle2, MapPin } from "lucide-react";

export function GpsPulse({ capturing, verified, size = 92 }) {
  return (
    <div style={{
      position: "relative", width: size, height: size,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {capturing && [0, 1, 2].map((i) => (
        <span key={i} style={{
          position: "absolute", width: size, height: size, borderRadius: "50%",
          border: `2px solid ${TOKENS.gold}`, opacity: 0,
          animation: `gpsPulse 1.8s ease-out ${i * 0.55}s infinite`,
        }} />
      ))}
      <div style={{
        width: size * 0.58, height: size * 0.58, borderRadius: "50%",
        background: verified ? TOKENS.success : capturing ? TOKENS.gold : TOKENS.navySoft,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
        transition: "background 0.3s ease",
      }}>
        {verified
          ? <CheckCircle2 color="#fff" size={size * 0.28} />
          : <MapPin color="#fff" size={size * 0.28} />
        }
      </div>
    </div>
  );
}
