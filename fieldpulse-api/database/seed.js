/**
 * Seed script — 100% Clean Production Setup
 * Clears all mock employees. Only retains Manager login (Vijay Rajagopal).
 * Manager will add employees manually one by one.
 */
const bcrypt = require("bcryptjs");
const { getDb, run } = require("./db");

async function seed() {
  const db = await getDb();

  console.log("🌱 Resetting GoldPE- Task console database to clean Manager-only setup…");

  // Clean all employee & transactional tables
  run(db, `DELETE FROM employees`);
  run(db, `DELETE FROM employee_passwords`);
  run(db, `DELETE FROM emergency_contacts`);
  run(db, `DELETE FROM weekly_hours`);
  run(db, `DELETE FROM punctuality`);
  run(db, `DELETE FROM reimbursements`);
  run(db, `DELETE FROM tasks`);
  run(db, `DELETE FROM od_records`);
  run(db, `DELETE FROM daily_reports`);
  run(db, `DELETE FROM checkins`);
  run(db, `DELETE FROM attendance`);

  // Setup Manager Password
  const mgrHash = bcrypt.hashSync("manager@123", 10);
  run(db, `INSERT OR REPLACE INTO employee_passwords (employee_id, password_hash) VALUES (?, ?)`, ["MANAGER", mgrHash]);

  console.log("✅ Database reset! Only Manager login (MANAGER / manager@123) is retained.");
  console.log("👉 Manager can now add employees manually one by one.");
}

seed().catch(console.error);
