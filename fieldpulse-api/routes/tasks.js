const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getDb, run, all } = require("../database/db");

// GET /api/tasks
router.get("/", auth, async (req, res) => {
  try {
    const db = await getDb();
    const empId = req.user.role === "manager" ? req.query.employeeId : req.user.employeeId;
    const rows = all(db, `SELECT * FROM tasks WHERE employee_id=?`, [empId]);
    res.json({ data: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/tasks — Assign new task (manager only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    const { employeeId, title, category, location, clientRef } = req.body;
    if (!employeeId || !title) return res.status(400).json({ error: "employeeId and title required" });

    const db = await getDb();
    const taskId = `t-${Date.now()}`;
    run(db, `INSERT INTO tasks (id, employee_id, title, category, location, distance, status, client_ref) VALUES (?,?,?,?,?,?,?,?)`,
      [taskId, employeeId, title, category || "general", location || "On-site", "0.0 km", "pending", clientRef || `REF-${Date.now().toString().slice(-4)}`]);

    res.json({ message: "Task assigned successfully", taskId });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/tasks/:id/complete
router.patch("/:id/complete", auth, async (req, res) => {
  try {
    const { lat, lng, status, team, remarks } = req.body;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const db = await getDb();
    
    run(db, `UPDATE tasks SET status='done', time=?, completion_lat=?, completion_lng=?, completion_status=?, completion_team=?, completion_remarks=?, completed_at=datetime('now') WHERE id=? AND employee_id=?`,
      [time, lat || null, lng || null, status || "Completed", team || "general", remarks || "", req.params.id, req.user.employeeId]);

    // Update employee score
    run(db, `UPDATE employees SET score=MIN(100, score+1) WHERE employee_id=?`, [req.user.employeeId]);

    res.json({ message: "Task completed", time });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
