import React from "react";
import { TOKENS } from "../tokens";

export function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card-interactive"
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 1px 4px rgba(10,31,58,0.07), 0 1px 2px rgba(10,31,58,0.04)",
        border: `1px solid ${TOKENS.border}`,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
