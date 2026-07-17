const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { getDb, run, get, all } = require("../database/db");
const path = require("path");

// GET /api/reimbursements — own (employee) or all (manager)
router.get("/", auth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = req.user.role === "manager"
      ? all(db, `SELECT r.*, e.name as emp_name, e.initials FROM reimbursements r JOIN employees e ON r.employee_id=e.employee_id ORDER BY r.created_at DESC`)
      : all(db, `SELECT * FROM reimbursements WHERE employee_id=? ORDER BY created_at DESC`, [req.user.employeeId]);
    res.json({ data: rows.map(r => ({ ...r, approvedBy: r.approved_by, rejectReason: r.reject_reason, empName: r.emp_name, empInitials: r.initials })) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/reimbursements — submit new
router.post("/", auth, async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    if (!category || !amount) return res.status(400).json({ error: "category and amount required" });
    const id = `r-${Date.now()}`;
    const db = await getDb();
    run(db, `INSERT INTO reimbursements (id, employee_id, category, amount, description, date) VALUES (?,?,?,?,?,?)`,
      [id, req.user.employeeId, category, parseFloat(amount), description || "", date || new Date().toISOString().slice(0, 10)]);
    res.json({ data: { id, category, amount: parseFloat(amount), description, date, status: "pending" } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/reimbursements/:id/receipt — attach receipt image
router.post("/:id/receipt", auth, upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const db = await getDb();
    run(db, `UPDATE reimbursements SET receipt_path=? WHERE id=?`, [req.file.path, req.params.id]);
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// PATCH /api/reimbursements/:id — approve or reject (manager only)
router.patch("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
    const { status, rejectReason } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "status must be approved or rejected" });
    const db = await getDb();
    run(db, `UPDATE reimbursements SET status=?, approved_by='Mgr. Sharma', reject_reason=? WHERE id=?`,
      [status, rejectReason || null, req.params.id]);
    res.json({ message: `Request ${status}` });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
