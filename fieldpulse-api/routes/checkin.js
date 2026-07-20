const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getDb, run, get, all } = require("../database/db");

// POST /api/checkin
router.post("/", auth, async (req, res) => {
  try {
    const { lat, lng, accuracy, city, isRealGps, checkInTime } = req.body || {};
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const time = checkInTime || "Checked In";

    run(db, `INSERT INTO checkins (employee_id, type, lat, lng, accuracy, city, is_real_gps, timestamp, date) VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.user.employeeId, "in", lat, lng, accuracy || null, city || null, isRealGps ? 1 : 0, time, today]);

    run(db, `UPDATE employees SET checked_in=1, check_in_time=?, check_in_lat=?, check_in_lng=?, check_in_city=?, last_location=?, last_seen=? WHERE employee_id=?`,
      [time, lat, lng, city, city || "Unknown", time, req.user.employeeId]);

    // Mark attendance
    run(db, `INSERT OR REPLACE INTO attendance (employee_id, date, status) VALUES (?,?,?)`, [req.user.employeeId, today, "present"]);

    res.json({ message: "Checked in", time, location: { lat, lng, city } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/checkin/out
router.post("/out", auth, async (req, res) => {
  try {
    const { checkOutTime } = req.body || {};
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const time = checkOutTime || "Checked Out";

    run(db, `INSERT INTO checkins (employee_id, type, lat, lng, accuracy, city, is_real_gps, timestamp, date) VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.user.employeeId, "out", null, null, null, null, 0, time, today]);

    try {
      run(db, `ALTER TABLE employees ADD COLUMN check_out_time TEXT`);
    } catch (e) {}

    run(db, `UPDATE employees SET checked_in=0, check_out_time=? WHERE employee_id=?`,
      [time, req.user.employeeId]);

    res.json({ message: "Checked out", time });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// GET /api/checkin/today
router.get("/today", auth, async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const rows = all(db, `SELECT * FROM checkins WHERE employee_id=? AND date=? ORDER BY id ASC`, [req.user.employeeId, today]);
    res.json({ data: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
