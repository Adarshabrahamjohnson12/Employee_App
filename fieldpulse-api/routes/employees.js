const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const upload = require("../middleware/upload");
const { getDb, run, get, all } = require("../database/db");
const { getIST, fixUtcStringToIST } = require("../utils/ist");
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
  const checkins = all(db, `SELECT * FROM checkins WHERE employee_id = ? ORDER BY timestamp DESC LIMIT 20`, [emp.employee_id]);
  const reports = all(db, `SELECT * FROM daily_reports WHERE employee_id = ? ORDER BY date DESC`, [emp.employee_id]);
  const currentYear = new Date().getFullYear();
  let leaveBal = get(db, `SELECT * FROM leave_balance WHERE employee_id = ?`, [emp.employee_id]);
  if (!leaveBal) {
    run(db, `INSERT INTO leave_balance (employee_id, cl_total, cl_used, ml_total, ml_used, last_reset_year) VALUES (?,6,0,6,0,?)`, [emp.employee_id, currentYear]);
    leaveBal = { cl_total: 6, cl_used: 0, ml_total: 6, ml_used: 0, last_reset_year: currentYear };
  } else if (leaveBal.last_reset_year !== currentYear) {
    run(db, `UPDATE leave_balance SET cl_used = 0, ml_used = 0, cl_total = 6, ml_total = 6, last_reset_year = ? WHERE employee_id = ?`, [currentYear, emp.employee_id]);
    leaveBal.cl_used = 0;
    leaveBal.ml_used = 0;
    leaveBal.last_reset_year = currentYear;
  }
  const leaveApps = all(db, `SELECT * FROM leave_applications WHERE employee_id = ? ORDER BY created_at DESC`, [emp.employee_id]);
  const attachments = all(db, `SELECT * FROM employee_attachments WHERE employee_id = ? ORDER BY created_at DESC`, [emp.employee_id]);

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const today = todayStr;
  const hasSubmittedReportToday = reports.some(r => r.date === today);
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const totalTasks = tasks.length;

  // Performance Index (25% each: hours, tasks, reports, OD)
  // Hours factor: use check_in_time and check_out_time from checkins today (max 9h)
  const todayCheckinRows = all(db, `SELECT * FROM checkins WHERE employee_id=? AND date=? ORDER BY id ASC`, [emp.employee_id, todayStr]);
  const lastIn  = [...todayCheckinRows].reverse().find(c => c.type === "in");
  const lastOut = [...todayCheckinRows].reverse().find(c => c.type === "out");
  let hoursFactor = 0;
  if (lastIn && lastOut) {
    const diff = (new Date(lastOut.timestamp) - new Date(lastIn.timestamp)) / 3600000;
    hoursFactor = Math.min(1, diff / 9);
  } else if (lastIn) {
    // Still checked in — count hours so far
    const diff = (Date.now() - new Date(lastIn.timestamp)) / 3600000;
    hoursFactor = Math.min(1, diff / 9);
  }
  // Tasks factor
  const tasksFactor = totalTasks > 0 ? doneTasks / totalTasks : 0;
  // Reports factor: last 30 days
  const workdays = 30;
  const uniqueReportDays = new Set(reports.map(r => r.date)).size;
  const reportsFactor = Math.min(1, uniqueReportDays / workdays);
  // OD factor: days on OD in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const odDays = od.reduce((acc, o) => {
    const from = o.from_date > thirtyDaysAgo ? o.from_date : thirtyDaysAgo;
    const to = o.to_date < todayStr ? o.to_date : todayStr;
    const days = Math.max(0, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
    return acc + days;
  }, 0);
  const odFactor = Math.min(1, odDays / workdays);
  const performanceIndex = Math.round((hoursFactor + tasksFactor + reportsFactor + odFactor) * 25);
  const benefitsEligible = performanceIndex >= 90;

  // Find if employee has an UNCOMPLETED active OD for today
  const activeOd = od.find(o => !o.completed && o.from_date <= todayStr && todayStr <= o.to_date);
  const isCurrentlyOnOD = !!activeOd;
  const currentOdCity = activeOd ? activeOd.city : null;

  // Sync DB on_od column if needed
  try {
    run(db, `UPDATE employees SET on_od = ?, od_city = ? WHERE employee_id = ?`,
      [isCurrentlyOnOD ? 1 : 0, isCurrentlyOnOD ? currentOdCity : null, emp.employee_id]);
  } catch(e){}

  return {
    ...emp,
    employeeId: emp.employee_id,
    fatherName: emp.father_name,
    motherName: emp.mother_name,
    dob: emp.dob,
    bloodGroup: emp.blood_group,
    phone: emp.phone,
    email: emp.email,
    clientName: emp.client_name,
    teamName: emp.team_name,
    joiningDate: emp.joining_date,
    hasSubmittedReportToday,
    reports: reports.map(r => ({
      id: r.id,
      date: r.date,
      work: r.work,
      workDescription: r.work,
      timeSpent: r.time_spent,
      hoursSpent: r.time_spent,
      hours: r.hours,
      remarks: r.remarks,
      submittedAt: r.submitted_at
    })),
    checkedIn: !!emp.checked_in,
    onOD: isCurrentlyOnOD,
    odCity: currentOdCity || emp.od_city,
    checkInTime: emp.check_in_time || (() => {
      const todayCheckins = all(db, `SELECT * FROM checkins WHERE employee_id = ? AND date = ? ORDER BY id ASC`, [emp.employee_id, todayStr]);
      const lastIn = [...todayCheckins].reverse().find(c => c.type === "in");
      return lastIn?.timestamp || null;
    })(),
    checkOutTime: emp.checked_in ? null : (emp.check_out_time || (() => {
      const todayCheckins = all(db, `SELECT * FROM checkins WHERE employee_id = ? AND date = ? ORDER BY id ASC`, [emp.employee_id, todayStr]);
      const lastOut = [...todayCheckins].reverse().find(c => c.type === "out");
      return lastOut?.timestamp || null;
    })()),
    lastLocation: emp.last_location || emp.check_in_city || currentOdCity || emp.od_city || "Off-site",
    lastSeen: emp.last_seen || emp.check_in_time || "Today",
    checkInLocation: emp.check_in_lat ? {
      lat: emp.check_in_lat,
      lng: emp.check_in_lng,
      city: emp.check_in_city,
      time: emp.check_in_time,
      real: true,
    } : null,
    checkinsHistory: checkins.map(c => ({
      id: c.id,
      type: c.type,
      lat: c.lat,
      lng: c.lng,
      accuracy: c.accuracy,
      city: c.city,
      isRealGps: !!c.is_real_gps,
      timestamp: c.timestamp,
      date: c.date
    })),
    tasksToday: { done: doneTasks, total: tasks.length },
    emergencyContact: {
      name: ec?.name || "",
      relationship: ec?.relationship || "",
      phone: ec?.phone || ""
    },
    weeklyHours: wh.map(r => r.hours),
    punctualityTrend: pt.map(r => ({ day: r.day, min: r.minutes })),
    reimbursements: reim.map(r => ({ ...r, approvedBy: r.approved_by, rejectReason: r.reject_reason })),
    odHistory: od.map(o => {
      const isCompleted = todayStr > o.to_date;
      const isActive = o.from_date <= todayStr && todayStr <= o.to_date;
      const isUpcoming = todayStr < o.from_date;
      const statusKey = isCompleted ? "od-completed" : isActive ? (o.arrived ? "arrived" : "od-active") : "od-upcoming";
      const statusLabel = isCompleted ? "OD Completed" : isActive ? (o.arrived ? "Arrived" : "OD Active") : "OD Upcoming";

      return {
        ...o,
        statusKey,
        statusLabel,
        isCompleted,
        isActive,
        isUpcoming,
        arrived: !!o.arrived,
        arrivalLocation: o.arrival_location,
        arrivalLat: o.arrival_lat,
        arrivalLng: o.arrival_lng,
        arrivalTime: o.arrival_time,
        from: o.from_date,
        to: o.to_date
      };
    }),
    attendance: (() => {
      const acc = att.reduce((a, r) => { a[r.date] = r.status; return a; }, {});
      if (isCurrentlyOnOD) {
        acc[today] = "od";
      } else if (emp.checked_in) {
        acc[today] = "present";
      }
      return acc;
    })(),
    tasks: tasks,
    performanceIndex,
    benefitsEligible,
    leaveBalance: (() => {
      const clTotal = leaveBal.cl_total ?? 6;
      const clUsed = leaveBal.cl_used ?? 0;
      const mlTotal = leaveBal.ml_total ?? 6;
      const mlUsed = leaveBal.ml_used ?? 0;
      return {
        total: clTotal + mlTotal, // 12
        used: clUsed + mlUsed,
        remaining: (clTotal - clUsed) + (mlTotal - mlUsed),
        clTotal, clUsed, clRemaining: clTotal - clUsed,
        mlTotal, mlUsed, mlRemaining: mlTotal - mlUsed,
      };
    })(),
    leaveApplications: leaveApps.map(a => ({ ...a, rejectReason: a.reject_reason, from: a.from_date, to: a.to_date })),
    attachments: attachments.map(a => ({ ...a, url: `/uploads/${path.basename(a.file_path)}` })),
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

// Helper validation
function validateEmployeeFields({ dob, phone, email }) {
  if (dob) {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "Invalid Date of Birth format";
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    if (age < 18) return "Date of Birth must indicate age 18 or older";
  }
  if (phone) {
    const cleaned = String(phone).replace(/\D/g, "");
    if (cleaned.length !== 10 && !(cleaned.length === 12 && cleaned.startsWith("91"))) {
      return "Phone number must be exactly 10 digits";
    }
  }
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.com$/i.test(String(email).trim())) {
      return "Email address must be a valid email ending with .com";
    }
  }
  return null;
}

// POST /api/employees — create new employee profile (manager only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    const {
      employeeId, name, role, fatherName, father_name, motherName, mother_name,
      dob, bloodGroup, blood_group, phone, email, clientName, teamName,
      joiningDate, password, emergencyName, emergencyRelationship, emergencyPhone
    } = req.body;

    if (!employeeId || !name || !role || !password) {
      return res.status(400).json({ error: "Employee ID, Name, Role, and Password are required" });
    }

    const valErr = validateEmployeeFields({ dob, phone, email });
    if (valErr) return res.status(400).json({ error: valErr });

    const db = await getDb();
    const existing = get(db, `SELECT id FROM employees WHERE employee_id = ?`, [employeeId.toUpperCase()]);
    if (existing) {
      return res.status(400).json({ error: "Employee ID already exists" });
    }

    const fName = fatherName || father_name || null;
    const mName = motherName || mother_name || null;
    const bGroup = bloodGroup || blood_group || null;

    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    run(db, `INSERT INTO employees (
      employee_id, name, role, father_name, mother_name, dob, blood_group, phone, email,
      client_name, team_name, joining_date, initials, score, streak
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,0)`, [
      employeeId.toUpperCase(), name, role,
      fName, mName, dob || null, bGroup,
      phone || null, email || null,
      clientName || "GoldPE Client", teamName || "Western Region",
      joiningDate || new Date().toISOString().slice(0, 10), initials
    ]);

    // Emergency Contact
    if (emergencyName || emergencyPhone) {
      run(db, `INSERT OR REPLACE INTO emergency_contacts (employee_id, name, relationship, phone) VALUES (?,?,?,?)`,
        [employeeId.toUpperCase(), emergencyName || "", emergencyRelationship || "Family", emergencyPhone || ""]);
    }

    // Insert password hash
    const hash = bcrypt.hashSync(password, 10);
    run(db, `INSERT OR REPLACE INTO employee_passwords (employee_id, password_hash) VALUES (?,?)`, [employeeId.toUpperCase(), hash]);

    // Seed leave balance
    run(db, `INSERT OR IGNORE INTO leave_balance (employee_id, cl_total, cl_used) VALUES (?,12,0)`, [employeeId.toUpperCase()]);

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
    if (req.user.role === "employee" && req.user.employeeId !== emp.employee_id) return res.status(403).json({ error: "Forbidden" });
    res.json({ data: buildEmployee(db, emp) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/employees/:id — update profile fields (manager only)
router.patch("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Only a manager can edit employee profiles" });
    const db = await getDb();
    const emp = get(db, `SELECT * FROM employees WHERE id = ? OR employee_id = ?`, [req.params.id, req.params.id]);
    if (!emp) return res.status(404).json({ error: "Not found" });

    const body = req.body;
    const { emergencyContact, ...fields } = body;

    const valErr = validateEmployeeFields({ dob: fields.dob, phone: fields.phone, email: fields.email });
    if (valErr) return res.status(400).json({ error: valErr });

    const fieldMap = {
      name: "name",
      fatherName: "father_name",
      father_name: "father_name",
      motherName: "mother_name",
      mother_name: "mother_name",
      dob: "dob",
      date_of_birth: "dob",
      bloodGroup: "blood_group",
      blood_group: "blood_group",
      phone: "phone",
      email: "email",
      clientName: "client_name",
      client_name: "client_name",
      teamName: "team_name",
      team_name: "team_name"
    };

    const updates = [];
    const values = [];

    for (const [k, v] of Object.entries(fields)) {
      if (fieldMap[k] && v !== undefined) {
        updates.push(`${fieldMap[k]} = ?`);
        values.push(v);
      }
    }

    if (updates.length > 0) {
      run(db, `UPDATE employees SET ${updates.join(", ")} WHERE employee_id = ?`, [...values, emp.employee_id]);
    }

    if (emergencyContact || body.emergencyName || body.emergencyPhone || body.emergencyRelationship) {
      const name = emergencyContact?.name ?? body.emergencyName ?? "";
      const rel = emergencyContact?.relationship ?? body.emergencyRelationship ?? "Family";
      const phone = emergencyContact?.phone ?? body.emergencyPhone ?? "";
      run(db, `INSERT OR REPLACE INTO emergency_contacts (employee_id, name, relationship, phone) VALUES (?,?,?,?)`,
        [emp.employee_id, name, rel, phone]);
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

// POST /api/employees/:id/attachments — upload attachment with caption
router.post("/:id/attachments", auth, upload.single("file"), async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const db = await getDb();
    const emp = get(db, `SELECT employee_id FROM employees WHERE id = ? OR employee_id = ?`, [req.params.id, req.params.id]);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    const attId = `att-${Date.now()}`;
    const caption = req.body.caption || "";
    run(db, `INSERT INTO employee_attachments (id, employee_id, file_path, caption) VALUES (?,?,?,?)`,
      [attId, emp.employee_id, req.file.path, caption]);
    res.json({ id: attId, url: `/uploads/${req.file.filename}`, caption });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// GET /api/employees/:id/attachments — list attachments
router.get("/:id/attachments", auth, async (req, res) => {
  try {
    const db = await getDb();
    const emp = get(db, `SELECT employee_id FROM employees WHERE id = ? OR employee_id = ?`, [req.params.id, req.params.id]);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    const atts = all(db, `SELECT * FROM employee_attachments WHERE employee_id=? ORDER BY created_at DESC`, [emp.employee_id]);
    res.json({ data: atts.map(a => ({ ...a, url: `/uploads/${path.basename(a.file_path)}` })) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;

