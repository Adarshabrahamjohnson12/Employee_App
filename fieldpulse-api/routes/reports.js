const express = require("express");
const router = express.Router();
const path = require("path");
const auth = require("../middleware/authMiddleware");
const { getDb, run, all, get } = require("../database/db");

// POST /api/reports — Employee submits an Everyday Work Report
router.post("/", auth, async (req, res) => {
  try {
    const { date, work, timeSpent, hours, remarks } = req.body;
    if (!work || !work.trim()) {
      return res.status(400).json({ error: "Work description is required." });
    }
    if (!timeSpent || !timeSpent.trim()) {
      return res.status(400).json({ error: "Time spent is required." });
    }

    const reportId = `REP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const reportDate = date || new Date().toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    if (reportDate > today) {
      return res.status(400).json({ error: "Cannot submit reports for future dates. Please select today or a past date." });
    }
    const numericHours = parseFloat(hours) || 0;
    const db = await getDb();

    run(
      db,
      `INSERT INTO daily_reports (id, employee_id, date, work, time_spent, hours, remarks, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [reportId, req.user.employeeId, reportDate, work.trim(), timeSpent.trim(), numericHours, (remarks || "").trim()]
    );

    const created = get(db, `SELECT * FROM daily_reports WHERE id = ?`, [reportId]);
    res.status(201).json({ success: true, report: created });
  } catch (err) {
    console.error("Submit daily report error:", err);
    res.status(500).json({ error: "Server error submitting daily report." });
  }
});

// GET /api/reports/my — Get logged in employee's submitted reports
router.get("/my", auth, async (req, res) => {
  try {
    const db = await getDb();
    const reports = all(
      db,
      `SELECT * FROM daily_reports WHERE employee_id = ? ORDER BY date DESC, submitted_at DESC`,
      [req.user.employeeId]
    );
    res.json(reports);
  } catch (err) {
    console.error("Fetch my reports error:", err);
    res.status(500).json({ error: "Server error fetching reports." });
  }
});

// GET /api/reports/calendar-summary — Manager summary of report counts per date
router.get("/calendar-summary", auth, async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const db = await getDb();

    const rows = all(
      db,
      `SELECT date, COUNT(DISTINCT employee_id) as count, COUNT(*) as total_reports
       FROM daily_reports
       WHERE date LIKE ?
       GROUP BY date`,
      [`${currentMonth}%`]
    );

    const summary = {};
    rows.forEach((r) => {
      summary[r.date] = { count: r.count, totalReports: r.total_reports };
    });

    res.json({ month: currentMonth, summary });
  } catch (err) {
    console.error("Fetch calendar summary error:", err);
    res.status(500).json({ error: "Server error fetching calendar summary." });
  }
});

// GET /api/reports — Manager fetches reports (filtered by date, month, or employee)
router.get("/", auth, async (req, res) => {
  try {
    const { date, month, employeeId } = req.query;
    const db = await getDb();

    let sql = `
      SELECT r.*, e.name as employee_name, e.initials, e.role, e.team_name, e.selfie_path
      FROM daily_reports r
      JOIN employees e ON (r.employee_id = e.employee_id OR r.employee_id = CAST(e.id AS TEXT))
    `;
    const params = [];
    const conditions = [];

    if (date) {
      conditions.push("r.date = ?");
      params.push(date);
    } else if (month) {
      conditions.push("r.date LIKE ?");
      params.push(`${month}%`);
    }

    if (employeeId) {
      conditions.push("(r.employee_id = ? OR e.employee_id = ?)");
      params.push(employeeId, employeeId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY r.date DESC, r.submitted_at DESC";

    const reports = all(db, sql, params);

    const formatted = reports.map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      initials: r.initials,
      role: r.role,
      teamName: r.team_name,
      selfie: r.selfie_path ? `/uploads/${path.basename(r.selfie_path)}` : null,
      date: r.date,
      work: r.work,
      timeSpent: r.time_spent,
      hours: r.hours,
      remarks: r.remarks,
      submittedAt: r.submitted_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch reports error:", err);
    res.status(500).json({ error: "Server error fetching reports." });
  }
});

module.exports = router;
