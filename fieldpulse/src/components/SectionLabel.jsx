import React from "react";
import { TOKENS } from "../tokens";

export function SectionLabel({ children, right, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      margin: "20px 2px 10px",
      ...style,
    }}>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        fontWeight: 700,
        color: TOKENS.navyMid,
        letterSpacing: 1.1,
        textTransform: "uppercase",
      }}>
        {children}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
