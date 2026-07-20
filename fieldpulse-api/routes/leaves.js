const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getDb, run, get, all } = require("../database/db");

// Ensure leave_balance row exists for an employee and reset monthly when new month starts
async function ensureBalance(db, employeeId) {
  const currentMonth = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7);
  const existing = get(db, `SELECT * FROM leave_balance WHERE employee_id=?`, [employeeId]);
  if (!existing) {
    run(db, `INSERT INTO leave_balance (employee_id, cl_total, cl_used, last_reset_month) VALUES (?,12,0,?)`, [employeeId, currentMonth]);
  } else if (existing.last_reset_month !== currentMonth) {
    // Month reset: reset cl_used to 0 when a new month arrives
    run(db, `UPDATE leave_balance SET cl_used = 0, last_reset_month = ? WHERE employee_id = ?`, [currentMonth, employeeId]);
  }
}

// Count leave days (simple calendar day count inclusive)
function countDays(from, to) {
  const f = new Date(from), t = new Date(to);
  if (isNaN(f) || isNaN(t)) return 0;
  return Math.max(0, Math.round((t - f) / 86400000) + 1);
}

// GET /api/leaves — own (employee) or all (manager)
router.get("/", auth, async (req, res) => {
  try {
    const db = await getDb();
    if (req.user.role === "manager") {
      const apps = all(db,
        `SELECT la.*, e.name as emp_name, e.initials, lb.cl_total, lb.cl_used
         FROM leave_applications la
         JOIN employees e ON la.employee_id = e.employee_id
         LEFT JOIN leave_balance lb ON la.employee_id = lb.employee_id
         ORDER BY la.created_at DESC`
      );
      return res.json({ data: apps.map(a => ({ ...a, rejectReason: a.reject_reason, from: a.from_date, to: a.to_date })) });
    }
    // Employee: own applications + balance
    const empId = req.user.employeeId;
    await ensureBalance(db, empId);
    const balance = get(db, `SELECT * FROM leave_balance WHERE employee_id=?`, [empId]);
    const apps = all(db, `SELECT * FROM leave_applications WHERE employee_id=? ORDER BY created_at DESC`, [empId]);
    res.json({
      balance: { total: balance.cl_total, used: balance.cl_used, remaining: balance.cl_total - balance.cl_used },
      data: apps.map(a => ({ ...a, rejectReason: a.reject_reason, from: a.from_date, to: a.to_date })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/leaves — employee submits leave application
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ error: "Employee only" });
    const { leaveType, from, to, reason } = req.body;
    if (!from || !to) return res.status(400).json({ error: "from and to dates required" });
    const days = countDays(from, to);
    if (days <= 0) return res.status(400).json({ error: "Invalid date range" });

    const db = await getDb();
    const empId = req.user.employeeId;
    await ensureBalance(db, empId);
    const balance = get(db, `SELECT * FROM leave_balance WHERE employee_id=?`, [empId]);
    const remaining = balance.cl_total - balance.cl_used;
    if (days > remaining) return res.status(400).json({ error: `Only ${remaining} CL remaining` });

    const id = `lv-${Date.now()}`;
    run(db, `INSERT INTO leave_applications (id, employee_id, leave_type, from_date, to_date, reason) VALUES (?,?,?,?,?,?)`,
      [id, empId, leaveType || "CL", from, to, reason || ""]);
    res.json({ data: { id, leaveType: leaveType || "CL", from, to, reason, status: "pending", days } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/leaves/:id — manager approves or rejects
router.patch("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    const { status, rejectReason } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "status must be approved or rejected" });

    const db = await getDb();
    const app = get(db, `SELECT * FROM leave_applications WHERE id=?`, [req.params.id]);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status !== "pending") return res.status(400).json({ error: "Already reviewed" });

    run(db, `UPDATE leave_applications SET status=?, reviewed_by=?, reject_reason=? WHERE id=?`,
      [status, req.user.employeeId || "manager", rejectReason || null, req.params.id]);

    // If approved, deduct from balance
    if (status === "approved") {
      const days = countDays(app.from_date, app.to_date);
      run(db, `UPDATE leave_balance SET cl_used = cl_used + ? WHERE employee_id=?`, [days, app.employee_id]);
    }
    res.json({ message: `Leave ${status}` });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
