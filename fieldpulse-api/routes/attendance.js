const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getDb, all } = require("../database/db");

// GET /api/attendance/:employeeId — 30-day calendar
router.get("/:employeeId", auth, async (req, res) => {
  try {
    if (req.user.role === "employee" && req.user.employeeId !== req.params.employeeId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const db = await getDb();
    const rows = all(db, `SELECT date, status FROM attendance WHERE employee_id=? ORDER BY date`, [req.params.employeeId]);
    const map = {};
    rows.forEach(r => { map[r.date] = r.status; });
    res.json({ data: map });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
