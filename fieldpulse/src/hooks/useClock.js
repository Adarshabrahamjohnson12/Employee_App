import { useState, useEffect } from "react";

export function useClock(intervalMs = 10000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function fmtTime(d) {
  if (!d) return "—";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return typeof d === "string" ? d : "—";

  const utcMs = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + (5.5 * 3600000));

  let hours = istDate.getHours();
  const minutes = istDate.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours.toString().padStart(2, '0');

  return `${formattedHours}:${minutes} ${ampm}`;
}

export function fmtDate(d) {
  if (!d) return "—";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return typeof d === "string" ? d : "—";

  const utcMs = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + (5.5 * 3600000));

  const day = istDate.getDate().toString().padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[istDate.getMonth()];
  const year = istDate.getFullYear();

  return `${day} ${month} ${year}`;
}

export function getTopClockTime(d = new Date()) {
  return `${fmtTime(d)} (${fmtDate(d)})`;
}

export function formatClientDisplayTime(str) {
  if (!str || typeof str !== "string") return str || "—";
  return str;
}
