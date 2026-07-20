const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const path = require("path");
const { getDb, run, get, all } = require("../database/db");

// GET /api/od
router.get("/", auth, async (req, res) => {
  try {
    const db = await getDb();
    const empId = req.user.role === "manager" ? req.query.employeeId : req.user.employeeId;
    const rows = all(db, `SELECT * FROM od_records WHERE employee_id=? ORDER BY created_at DESC`, [empId]);
    res.json({ data: rows.map(o => ({ ...o, arrived: !!o.arrived, arrivalLocation: o.arrival_location, arrivalTime: o.arrival_time, completed: !!o.completed, completedTime: o.completed_time, from: o.from_date, to: o.to_date })) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/od — declare new OD trip (multiple allowed)
router.post("/", auth, async (req, res) => {
  try {
    const { id, city, client, from, to } = req.body;
    if (!city || !from || !to) return res.status(400).json({ error: "city, from, to required" });
    const db = await getDb();
    const odId = id || `od-${Date.now()}`;
    run(db, `INSERT INTO od_records (id, employee_id, city, client, from_date, to_date) VALUES (?,?,?,?,?,?)`,
      [odId, req.user.employeeId, city, client || null, from, to]);
    res.json({ data: { id: odId, city, client, from, to, arrived: false, completed: false } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/od/:id/arrive — mark arrived with GPS
router.patch("/:id/arrive", auth, async (req, res) => {
  try {
    const { lat, lng, city } = req.body;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const db = await getDb();
    run(db, `UPDATE od_records SET arrived=1, arrival_location=?, arrival_lat=?, arrival_lng=?, arrival_time=? WHERE id=? AND employee_id=?`,
      [city || "On location", lat || null, lng || null, time, req.params.id, req.user.employeeId]);
    run(db, `UPDATE employees SET last_location=?, last_seen=? WHERE employee_id=?`, [city || "On location", time, req.user.employeeId]);
    res.json({ message: "Arrival confirmed", arrivalTime: time, arrivalLocation: city });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/od/:id/complete — mark OD over / completed
router.patch("/:id/complete", auth, async (req, res) => {
  try {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const completedTimeStr = `${time}, ${dateStr}`;
    const db = await getDb();
    run(db, `UPDATE od_records SET completed=1, completed_time=? WHERE id=? AND employee_id=?`,
      [completedTimeStr, req.params.id, req.user.employeeId]);
    res.json({ message: "OD completed", completedTime: completedTimeStr });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/od/:id/photos — upload project photo
router.post("/:id/photos", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const db = await getDb();
    const photoId = `odp-${Date.now()}`;
    const caption = req.body.caption || "";
    run(db, `INSERT INTO od_photos (id, od_id, employee_id, file_path, caption) VALUES (?,?,?,?,?)`,
      [photoId, req.params.id, req.user.employeeId, req.file.path, caption]);
    res.json({ id: photoId, url: `/uploads/${req.file.filename}`, caption });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// GET /api/od/:id/photos — list photos for an OD record
router.get("/:id/photos", auth, async (req, res) => {
  try {
    const db = await getDb();
    const photos = all(db, `SELECT * FROM od_photos WHERE od_id=? ORDER BY created_at ASC`, [req.params.id]);
    res.json({ data: photos.map(p => ({ ...p, url: `/uploads/${path.basename(p.file_path)}` })) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
