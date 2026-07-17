const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const upload = require("../middleware/upload");
const { getDb, run, get, all } = require("../database/db");
const path = require("path");

// Build full employee object from DB rows
function buildEmployee(db, emp) {
  const ec = get(db, `SELECT name, relationship, phone FROM emergency_contacts WHERE employee_id = ?`, [emp.employee_id]);
  const wh = all(db, `SELECT day_index, hours FROM weekly_hours WHERE employee_id = ? ORDER BY day_index`, [emp.employee_id]);
  const pt = all(db, `SELECT day, minutes FROM punctuality WHERE employee_id = ?`, [emp.employee_id]);
  const reim = all(db, `SELECT * FROM reimbursements WHERE employee_id = ? ORDER BY created_at DESC`, [emp.employee_id]);
  const od = all(db, `SELECT * FROM od_records WHERE employee_id = ? ORDER BY created_at DESC`, [emp.employee_id]);
  const att = all(db, `SELECT date, status FROM attendance WHERE employee_id = ?`, [emp.employee_id]);
  const tasks = all(db, `SELECT * FROM tasks WHERE employee_id = ?`, [emp.employee_id]);

  const doneTasks = tasks.filter(t => t.status === "done").length;

  return {
    ...emp,
    checkedIn: !!emp.checked_in,
    onOD: !!emp.on_od,
    checkInLocation: emp.check_in_lat ? { lat: emp.check_in_lat, lng: emp.check_in_lng, city: emp.check_in_city } : null,
    tasksToday: { done: doneTasks, total: tasks.length },
    emergencyContact: ec || {},
    weeklyHours: wh.map(r => r.hours),
    punctualityTrend: pt.map(r => ({ day: r.day, min: r.minutes })),
    reimbursements: reim.map(r => ({ ...r, approvedBy: r.approved_by, rejectReason: r.reject_reason })),
    odHistory: od.map(o => ({ ...o, arrived: !!o.arrived, arrivalLocation: o.arrival_location, arrivalTime: o.arrival_time, from: o.from_date, to: o.to_date })),
    attendance: att.reduce((acc, r) => { acc[r.date] = r.status; return acc; }, {}),
    tasks: tasks,
    aadhaar: { front: emp.aadhaar_front_path ? `/uploads/${path.basename(emp.aadhaar_front_path)}` : null, back: emp.aadhaar_back_path ? `/uploads/${path.basename(emp.aadhaar_back_path)}` : null },
    selfie: emp.selfie_path ? `/uploads/${path.basename(emp.selfie_path)}` : null,
  };
}

// GET /api/employees — all employees (manager only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    const db = await getDb();
    const emps = all(db, `SELECT * FROM employees ORDER BY score DESC`);
    res.json({ data: emps.map(e => buildEmployee(db, e)) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/employees — create new employee profile (manager only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    const { employeeId, name, role, clientName, teamName, joiningDate, password } = req.body;
    if (!employeeId || !name || !role || !password) {
      return res.status(400).json({ error: "Employee ID, Name, Role, and Password are required" });
    }

    const db = await getDb();
    const existing = get(db, `SELECT id FROM employees WHERE employee_id = ?`, [employeeId.toUpperCase()]);
    if (existing) {
      return res.status(400).json({ error: "Employee ID already exists" });
    }

    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    run(db, `INSERT INTO employees (employee_id, name, role, client_name, team_name, joining_date, initials, score, streak) VALUES (?,?,?,?,?,?,?,0,0)`,
      [employeeId.toUpperCase(), name, role, clientName || "GoldPE Client", teamName || "Western Region", joiningDate || new Date().toISOString().slice(0, 10), initials]);

    // Insert password hash
    const hash = bcrypt.hashSync(password, 10);
    run(db, `INSERT OR REPLACE INTO employee_passwords (employee_id, password_hash) VALUES (?,?)`, [employeeId.toUpperCase(), hash]);

    for (let i = 0; i < 7; i++) {
      run(db, `INSERT OR IGNORE INTO weekly_hours (employee_id, day_index, hours) VALUES (?,?,0)`, [employeeId.toUpperCase(), i]);
    }

    const newEmp = get(db, `SELECT * FROM employees WHERE employee_id = ?`, [employeeId.toUpperCase()]);
    res.json({ data: buildEmployee(db, newEmp) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/employees/:id — single employee
router.get("/:id", auth, async (req, res) => {
  try {
    const db = await getDb();
    const emp = get(db, `SELECT * FROM employees WHERE id = ? OR employee_id = ?`, [req.params.id, req.params.id]);
    if (!emp) return res.status(404).json({ error: "Not found" });
    // Employee can only see their own
    if (req.user.role === "employee" && req.user.employeeId !== emp.employee_id) return res.status(403).json({ error: "Forbidden" });
    res.json({ data: buildEmployee(db, emp) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/employees/:id — update profile fields
router.patch("/:id", auth, async (req, res) => {
  try {
    const db = await getDb();
    const emp = get(db, `SELECT * FROM employees WHERE id = ? OR employee_id = ?`, [req.params.id, req.params.id]);
    if (!emp) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "employee" && req.user.employeeId !== emp.employee_id) return res.status(403).json({ error: "Forbidden" });

    const { emergencyContact, ...fields } = req.body;
    const allowed = ["father_name","mother_name","dob","blood_group","phone","email","client_name","team_name"];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (updates.length) {
      const cols = updates.map(([k]) => `${k} = ?`).join(", ");
      run(db, `UPDATE employees SET ${cols} WHERE employee_id = ?`, [...updates.map(([,v]) => v), emp.employee_id]);
    }
    if (emergencyContact) {
      run(db, `INSERT OR REPLACE INTO emergency_contacts (employee_id, name, relationship, phone) VALUES (?,?,?,?)`,
        [emp.employee_id, emergencyContact.name, emergencyContact.relationship, emergencyContact.phone]);
    }
    res.json({ data: buildEmployee(db, get(db, `SELECT * FROM employees WHERE employee_id = ?`, [emp.employee_id])) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/employees/:id/selfie
router.post("/:id/selfie", auth, upload.single("selfie"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const db = await getDb();
    run(db, `UPDATE employees SET selfie_path = ? WHERE id = ? OR employee_id = ?`, [req.file.path, req.params.id, req.params.id]);
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/employees/:id/aadhaar  (field: front or back)
router.post("/:id/aadhaar", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { side } = req.body; // 'front' or 'back'
    const col = side === "back" ? "aadhaar_back_path" : "aadhaar_front_path";
    const db = await getDb();
    run(db, `UPDATE employees SET ${col} = ? WHERE id = ? OR employee_id = ?`, [req.file.path, req.params.id, req.params.id]);
    res.json({ url: `/uploads/${req.file.filename}`, side });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/employees/:id/reset-password — manager sets/resets password
router.patch("/:id/reset-password", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    const { password } = req.body;
    if (!password || password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
    const db = await getDb();
    const emp = get(db, `SELECT employee_id FROM employees WHERE id = ? OR employee_id = ?`, [req.params.id, req.params.id]);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    const hash = bcrypt.hashSync(password, 10);
    run(db, `INSERT OR REPLACE INTO employee_passwords (employee_id, password_hash) VALUES (?,?)`, [emp.employee_id, hash]);
    res.json({ message: "Password updated successfully" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;

