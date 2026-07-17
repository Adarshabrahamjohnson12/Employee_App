const { getDb, run } = require("./database/db");

async function cleanup() {
  try {
    const db = await getDb();
    run(db, "DELETE FROM employees WHERE employee_id = 'FP-WR-006'");
    run(db, "DELETE FROM weekly_hours WHERE employee_id = 'FP-WR-006'");
    run(db, "DELETE FROM employee_passwords WHERE employee_id = 'FP-WR-006'");
    console.log("Database cleaned up successfully for FP-WR-006");
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}
cleanup();
