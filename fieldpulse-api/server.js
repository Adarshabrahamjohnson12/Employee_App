require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { getDb, get } = require("./database/db");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors()); // Allow all origins (mobile app + web)

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",           require("./routes/auth"));
app.use("/api/employees",      require("./routes/employees"));
app.use("/api/checkin",        require("./routes/checkin"));
app.use("/api/od",             require("./routes/od"));
app.use("/api/tasks",          require("./routes/tasks"));
app.use("/api/reimbursements", require("./routes/reimbursements"));
app.use("/api/attendance",     require("./routes/attendance"));

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "fieldpulse", "dist")));

// Fallback to React app for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "fieldpulse", "dist", "index.html"));
});

// ── Error handler ───────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    const db = await getDb(); // Initialize DB + schema

    // Auto-seed database if empty
    try {
      const countRow = get(db, "SELECT COUNT(*) as count FROM employees");
      if (!countRow || countRow.count === 0) {
        console.log("🌱 Database is empty. Running auto-seed...");
        const { seed } = require("./database/seed");
        await seed();
      }
    } catch (seedErr) {
      console.error("⚠️ Auto-seeding failed:", seedErr);
    }

    app.listen(PORT, () => {
      console.log(`\n✅  FieldPulse API  →  http://localhost:${PORT}`);
      console.log(`   Health check  →  http://localhost:${PORT}/api/health`);
      console.log(`   First time?   →  node database/seed.js\n`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();
