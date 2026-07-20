const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "fieldpulse.db");

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  initials TEXT,
  role TEXT,
  father_name TEXT,
  mother_name TEXT,
  dob TEXT,
  blood_group TEXT,
  phone TEXT,
  email TEXT,
  client_name TEXT,
  team_name TEXT,
  joining_date TEXT,
  score INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  checked_in INTEGER DEFAULT 0,
  check_in_time TEXT,
  check_in_lat REAL,
  check_in_lng REAL,
  check_in_city TEXT,
  last_location TEXT,
  last_seen TEXT,
  on_od INTEGER DEFAULT 0,
  od_city TEXT,
  selfie_path TEXT,
  aadhaar_front_path TEXT,
  aadhaar_back_path TEXT
);

CREATE TABLE IF NOT EXISTS employee_passwords (
  employee_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  employee_id TEXT PRIMARY KEY,
  name TEXT,
  relationship TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL,
  type TEXT NOT NULL,
  lat REAL,
  lng REAL,
  accuracy REAL,
  city TEXT,
  is_real_gps INTEGER DEFAULT 0,
  timestamp TEXT DEFAULT (datetime('now')),
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS od_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  city TEXT NOT NULL,
  client TEXT,
  from_date TEXT,
  to_date TEXT,
  arrived INTEGER DEFAULT 0,
  arrival_location TEXT,
  arrival_lat REAL,
  arrival_lng REAL,
  arrival_time TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  location TEXT,
  distance TEXT,
  status TEXT DEFAULT 'pending',
  time TEXT,
  client_ref TEXT,
  client_name TEXT,
  project_name TEXT,
  completion_status TEXT,
  completion_team TEXT,
  completion_remarks TEXT,
  completion_lat REAL,
  completion_lng REAL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS leave_balance (
  employee_id TEXT PRIMARY KEY,
  cl_total INTEGER DEFAULT 6,
  cl_used INTEGER DEFAULT 0,
  ml_total INTEGER DEFAULT 6,
  ml_used INTEGER DEFAULT 0,
  last_reset_year INTEGER
);

CREATE TABLE IF NOT EXISTS leave_applications (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  leave_type TEXT DEFAULT 'CL',
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reject_reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS od_photos (
  id TEXT PRIMARY KEY,
  od_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  caption TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employee_attachments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  caption TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reimbursements (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  date TEXT,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  reject_reason TEXT,
  receipt_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS weekly_hours (
  employee_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  hours REAL DEFAULT 0,
  PRIMARY KEY (employee_id, day_index)
);

CREATE TABLE IF NOT EXISTS punctuality (
  employee_id TEXT NOT NULL,
  day TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  PRIMARY KEY (employee_id, day)
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  date TEXT NOT NULL,
  work TEXT NOT NULL,
  time_spent TEXT NOT NULL,
  hours REAL DEFAULT 0,
  remarks TEXT,
  submitted_at TEXT DEFAULT (datetime('now'))
);
`;

// Persist DB to file
function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Initialize and return db instance
async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(SCHEMA);
  try { db.run("ALTER TABLE tasks ADD COLUMN completion_status TEXT;"); } catch(e){}
  try { db.run("ALTER TABLE tasks ADD COLUMN completion_team TEXT;"); } catch(e){}
  try { db.run("ALTER TABLE tasks ADD COLUMN completion_remarks TEXT;"); } catch(e){}
  try { db.run("ALTER TABLE tasks ADD COLUMN client_name TEXT;"); } catch(e){}
  try { db.run("ALTER TABLE tasks ADD COLUMN project_name TEXT;"); } catch(e){}
  try { db.run("ALTER TABLE employees ADD COLUMN check_out_time TEXT;"); } catch(e){}
  try {
    db.run(`CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      work TEXT NOT NULL,
      time_spent TEXT NOT NULL,
      hours REAL DEFAULT 0,
      remarks TEXT,
      submitted_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch(e){}
  try { db.run("ALTER TABLE leave_balance ADD COLUMN last_reset_month TEXT;"); } catch(e){}
  try { db.run("ALTER TABLE leave_balance ADD COLUMN ml_total INTEGER DEFAULT 6;"); } catch(e){}
  try { db.run("ALTER TABLE leave_balance ADD COLUMN ml_used INTEGER DEFAULT 0;"); } catch(e){}
  try { db.run("ALTER TABLE leave_balance ADD COLUMN last_reset_year INTEGER;"); } catch(e){}
  try { db.run("UPDATE leave_balance SET cl_total = 6 WHERE cl_total = 12 OR cl_total IS NULL;"); } catch(e){}
  try { db.run("ALTER TABLE od_records ADD COLUMN completed INTEGER DEFAULT 0;"); } catch(e){}
  try { db.run("ALTER TABLE od_records ADD COLUMN completed_time TEXT;"); } catch(e){}
  // Ensure leave_balance row exists for all employees
  try {
    const currentYear = new Date().getFullYear();
    const emps = all(db, 'SELECT employee_id FROM employees');
    for (const e of emps) {
      db.run(`INSERT OR IGNORE INTO leave_balance (employee_id, cl_total, cl_used, ml_total, ml_used, last_reset_year) VALUES (?,6,0,6,0,?)`, [e.employee_id, currentYear]);
    }
  } catch(e){}
  saveDb();
  return db;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
function run(database, sql, params = []) {
  try {
    database.run(sql, params);
    saveDb();
  } catch (err) {
    console.error("[DB run error]", sql.slice(0, 80), err.message);
    throw err;
  }
}

// Helper: get one row
function get(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// Helper: get all rows
function all(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

module.exports = { getDb, run, get, all, saveDb };
