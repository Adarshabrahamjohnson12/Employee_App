const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getDb, run, get, all } = require("../database/db");

// Ensure leave_balance row exists for an employee and reset YEARLY (12 total: 6 CL + 6 ML)
async function ensureBalance(db, employeeId) {
  const currentYear = new Date().getFullYear();
  const existing = get(db, `SELECT * FROM leave_balance WHERE employee_id=?`, [employeeId]);
  if (!existing) {
    run(db, `INSERT INTO leave_balance (employee_id, cl_total, cl_used, ml_total, ml_used, last_reset_year) VALUES (?,6,0,6,0,?)`, [employeeId, currentYear]);
  } else if (existing.last_reset_year !== currentYear) {
    // Yearly reset: reset cl_used and ml_used to 0 when a new year arrives
    run(db, `UPDATE leave_balance SET cl_used = 0, ml_used = 0, cl_total = 6, ml_total = 6, last_reset_year = ? WHERE employee_id = ?`, [currentYear, employeeId]);
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
        `SELECT la.*, e.name as emp_name, e.initials, lb.cl_total, lb.cl_used, lb.ml_total, lb.ml_used
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

    const clTotal = balance.cl_total ?? 6;
    const clUsed = balance.cl_used ?? 0;
    const mlTotal = balance.ml_total ?? 6;
    const mlUsed = balance.ml_used ?? 0;

    res.json({
      balance: {
        total: clTotal + mlTotal, // 12
        used: clUsed + mlUsed,
        remaining: (clTotal - clUsed) + (mlTotal - mlUsed),
        clTotal, clUsed, clRemaining: clTotal - clUsed,
        mlTotal, mlUsed, mlRemaining: mlTotal - mlUsed,
      },
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

    const typeUpper = (leaveType || "CL").toUpperCase();
    const db = await getDb();
    const empId = req.user.employeeId;
    await ensureBalance(db, empId);
    const balance = get(db, `SELECT * FROM leave_balance WHERE employee_id=?`, [empId]);

    const clTotal = balance.cl_total ?? 6;
    const clUsed = balance.cl_used ?? 0;
    const mlTotal = balance.ml_total ?? 6;
    const mlUsed = balance.ml_used ?? 0;

    if (typeUpper === "ML") {
      const remainingML = mlTotal - mlUsed;
      if (days > remainingML) return res.status(400).json({ error: `Only ${remainingML} Medical Leave (ML) remaining this year` });
    } else {
      const remainingCL = clTotal - clUsed;
      if (days > remainingCL) return res.status(400).json({ error: `Only ${remainingCL} Casual Leave (CL) remaining this year` });
    }

    const id = `lv-${Date.now()}`;
    run(db, `INSERT INTO leave_applications (id, employee_id, leave_type, from_date, to_date, reason) VALUES (?,?,?,?,?,?)`,
      [id, empId, typeUpper, from, to, reason || ""]);
    res.json({ data: { id, leaveType: typeUpper, from, to, reason, status: "pending", days } });
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

    // If approved, deduct from balance for specific type (CL or ML)
    if (status === "approved") {
      const days = countDays(app.from_date, app.to_date);
      const typeUpper = (app.leave_type || "CL").toUpperCase();
      if (typeUpper === "ML") {
        run(db, `UPDATE leave_balance SET ml_used = ml_used + ? WHERE employee_id=?`, [days, app.employee_id]);
      } else {
        run(db, `UPDATE leave_balance SET cl_used = cl_used + ? WHERE employee_id=?`, [days, app.employee_id]);
      }
    }
    res.json({ message: `Leave ${status}` });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
