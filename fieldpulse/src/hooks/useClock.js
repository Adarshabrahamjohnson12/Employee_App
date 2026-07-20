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
  if (!str || typeof str !== "string") return str;

  const match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)(.*)$/i);
  if (!match) return str;

  let [_, hStr, mStr, ampm, rest] = match;
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);

  if (ampm.toLowerCase() === "pm" && h < 12) h += 12;
  if (ampm.toLowerCase() === "am" && h === 12) h = 0;

  if (h >= 12 && h <= 19) {
    h = h + 5;
    m = m + 30;
    if (m >= 60) {
      h += 1;
      m -= 60;
    }
    h = h % 24;
    const newAmpm = h >= 12 ? "pm" : "am";
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    const finalH = displayH.toString().padStart(2, "0");
    const finalM = m.toString().padStart(2, "0");
    return `${finalH}:${finalM} ${newAmpm}${rest || ""}`;
  }

  return str;
}
