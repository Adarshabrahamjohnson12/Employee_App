export function is18Plus(dobStr) {
  if (!dobStr) return false;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18;
}

export function validatePhone(phoneStr) {
  if (!phoneStr) return false;
  const cleaned = String(phoneStr).replace(/\D/g, "");
  if (cleaned.length === 10) return true;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return true;
  return false;
}

export function validateEmail(emailStr) {
  if (!emailStr) return false;
  return /^[^\s@]+@[^\s@]+\.com$/i.test(String(emailStr).trim());
}
