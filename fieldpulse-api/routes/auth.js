const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb, get } = require("../database/db");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    if (!employeeId || !password) return res.status(400).json({ error: "Employee ID and password required" });

    const db = await getDb();

    // Manager login
    if (employeeId.toUpperCase() === "MANAGER") {
      const row = get(db, `SELECT password_hash FROM employee_passwords WHERE employee_id = 'MANAGER'`);
      if (!row || !bcrypt.compareSync(password, row.password_hash)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ id: 0, employeeId: "MANAGER", name: "Mgr. Sharma", role: "manager" }, process.env.JWT_SECRET, { expiresIn: "24h" });
      return res.json({ token, user: { id: 0, employeeId: "MANAGER", name: "Mgr. Sharma", role: "manager" } });
    }

    // Employee login
    const emp = get(db, `SELECT id, employee_id, name FROM employees WHERE employee_id = ?`, [employeeId.toUpperCase()]);
    if (!emp) return res.status(401).json({ error: "Invalid credentials" });

    const pwRow = get(db, `SELECT password_hash FROM employee_passwords WHERE employee_id = ?`, [emp.employee_id]);
    if (!pwRow || !bcrypt.compareSync(password, pwRow.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: emp.id, employeeId: emp.employee_id, name: emp.name, role: "employee" }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: emp.id, employeeId: emp.employee_id, name: emp.name, role: "employee" } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
