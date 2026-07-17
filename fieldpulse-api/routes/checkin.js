const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getDb, run, get, all } = require("../database/db");

// POST /api/checkin
router.post("/", auth, async (req, res) => {
  try {
    const { lat, lng, accuracy, city, isRealGps } = req.body;
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    run(db, `INSERT INTO checkins (employee_id, type, lat, lng, accuracy, city, is_real_gps, date) VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.employeeId, "in", lat, lng, accuracy || null, city || null, isRealGps ? 1 : 0, today]);

    run(db, `UPDATE employees SET checked_in=1, check_in_time=?, check_in_lat=?, check_in_lng=?, check_in_city=?, last_location=?, last_seen=? WHERE employee_id=?`,
      [time, lat, lng, city, city || "Unknown", time, req.user.employeeId]);

    // Mark attendance
    const status = time > "09:15" ? "late" : "present";
    run(db, `INSERT OR REPLACE INTO attendance (employee_id, date, status) VALUES (?,?,?)`, [req.user.employeeId, today, status]);

    res.json({ message: "Checked in", time, location: { lat, lng, city } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/checkin/out
router.post("/out", auth, async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    run(db, `INSERT INTO checkins (employee_id, type, date) VALUES (?,?,?)`, [req.user.employeeId, "out", today]);
    run(db, `UPDATE employees SET checked_in=0 WHERE employee_id=?`, [req.user.employeeId]);
    res.json({ message: "Checked out" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// GET /api/checkin/today
router.get("/today", auth, async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const rows = all(db, `SELECT * FROM checkins WHERE employee_id=? AND date=? ORDER BY timestamp`, [req.user.employeeId, today]);
    res.json({ data: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
