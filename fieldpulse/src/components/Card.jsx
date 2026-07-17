import React from "react";
import { TOKENS } from "../tokens";

export function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 1px 4px rgba(10,31,58,0.07), 0 1px 2px rgba(10,31,58,0.04)",
        border: `1px solid ${TOKENS.border}`,
        cursor: onClick ? "pointer" : "default",
        transition: onClick ? "transform 0.15s ease, box-shadow 0.15s ease" : "none",
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(10,31,58,0.1)"; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(10,31,58,0.07)"; } : undefined}
    >
      {children}
    </div>
  );
}
