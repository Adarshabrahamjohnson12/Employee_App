// Absolute IST Time Utility (UTC + 5:30)

function getIST() {
  const d = new Date();
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + (5.5 * 3600000));

  let hours = istDate.getHours();
  const minutes = istDate.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours.toString().padStart(2, '0');

  const day = istDate.getDate().toString().padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[istDate.getMonth()];
  const year = istDate.getFullYear();

  const timeStr = `${formattedHours}:${minutes} ${ampm}`;
  const dateStr = `${day} ${month} ${year}`;
  const todayStr = `${year}-${(istDate.getMonth() + 1).toString().padStart(2, '0')}-${day}`;

  return {
    timeStr,
    dateStr,
    full: `${timeStr} (${dateStr})`,
    todayStr
  };
}

function fixUtcStringToIST(str) {
  if (!str || typeof str !== "string") return str;

  const match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)(.*)$/i);
  if (!match) return str;

  let [_, hStr, mStr, ampm, rest] = match;
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (ampm.toLowerCase() === "pm" && h < 12) h += 12;
  if (ampm.toLowerCase() === "am" && h === 12) h = 0;

  // 12:00 UTC to 19:30 UTC corresponds to 17:30 IST to 01:00 IST next day
  // If h is between 12 and 19 (e.g., 05:xx pm or 06:xx pm in UTC), add 5h 30m to get real IST
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

module.exports = { getIST, fixUtcStringToIST };
