/**
 * Seed script — clean real-time setup
 * Populates DB with clean employee profiles & manager access for GoldPE- Task console.
 */
const bcrypt = require("bcryptjs");
const { getDb, run, get, all } = require("./db");

const EMPLOYEES = [
  {
    employee_id: "FP-WR-001", name: "Arjun Mehta",   initials: "AM",
    role: "Field Agent",           father_name: "Rajesh Mehta",  mother_name: "Sunita Mehta",
    dob: "1994-08-15",            blood_group: "B+",             phone: "+91 98765 43210",
    email: "arjun.mehta@goldpe.in", client_name: "GoldPE Client",
    team_name: "Western Region", joining_date: "2022-03-01",
    score: 0, streak: 0, checked_in: 0, check_in_time: null,
    check_in_lat: null, check_in_lng: null, check_in_city: null,
    last_location: "Off-site", last_seen: "Not checked in today", on_od: 0, od_city: null,
    password: "arjun123",
    emergency: { name: "Rajesh Mehta", relationship: "Father", phone: "+91 98765 43210" },
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    punctuality: [],
  },
  {
    employee_id: "FP-WR-002", name: "Priya Nair",    initials: "PN",
    role: "Channel Partner Liaison", father_name: "Suresh Nair", mother_name: "Leela Nair",
    dob: "1996-03-22",             blood_group: "A+",            phone: "+91 97654 32109",
    email: "priya.nair@goldpe.in", client_name: "GoldPE Client",
    team_name: "Western Region", joining_date: "2022-07-15",
    score: 0, streak: 0, checked_in: 0, check_in_time: null,
    check_in_lat: null, check_in_lng: null, check_in_city: null,
    last_location: "Off-site", last_seen: "Not checked in today", on_od: 0, od_city: null,
    password: "priya123",
    emergency: { name: "Suresh Nair", relationship: "Father", phone: "+91 97654 32109" },
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    punctuality: [],
  },
  {
    employee_id: "FP-WR-003", name: "Rohit Deshmukh", initials: "RD",
    role: "Field Agent",            father_name: "Anant Deshmukh", mother_name: "Vimal Deshmukh",
    dob: "1991-11-07",             blood_group: "O+",              phone: "+91 96543 21098",
    email: "rohit.deshmukh@goldpe.in", client_name: "GoldPE Client",
    team_name: "Western Region", joining_date: "2021-11-20",
    score: 0, streak: 0, checked_in: 0, check_in_time: null,
    check_in_lat: null, check_in_lng: null, check_in_city: null,
    last_location: "Off-site", last_seen: "Not checked in today", on_od: 0, od_city: null,
    password: "rohit123",
    emergency: { name: "Anant Deshmukh", relationship: "Father", phone: "+91 96543 21098" },
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    punctuality: [],
  },
  {
    employee_id: "FP-WR-004", name: "Sneha Kulkarni", initials: "SK",
    role: "Machine Deployment Lead", father_name: "Prakash Kulkarni", mother_name: "Rekha Kulkarni",
    dob: "1993-05-30",              blood_group: "AB+",              phone: "+91 95432 10987",
    email: "sneha.kulkarni@goldpe.in", client_name: "GoldPE Client",
    team_name: "Western Region", joining_date: "2021-06-01",
    score: 0, streak: 0, checked_in: 0, check_in_time: null,
    check_in_lat: null, check_in_lng: null, check_in_city: null,
    last_location: "Off-site", last_seen: "Not checked in today", on_od: 0, od_city: null,
    password: "sneha123",
    emergency: { name: "Prakash Kulkarni", relationship: "Father", phone: "+91 95432 10987" },
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    punctuality: [],
  },
  {
    employee_id: "FP-WR-005", name: "Vikram Solanki", initials: "VS",
    role: "Field Agent",             father_name: "Dinesh Solanki", mother_name: "Meena Solanki",
    dob: "1995-01-18",              blood_group: "A-",              phone: "+91 94321 09876",
    email: "vikram.solanki@goldpe.in", client_name: "GoldPE Client",
    team_name: "Western Region", joining_date: "2023-01-10",
    score: 0, streak: 0, checked_in: 0, check_in_time: null,
    check_in_lat: null, check_in_lng: null, check_in_city: null,
    last_location: "Off-site", last_seen: "Not checked in today", on_od: 0, od_city: null,
    password: "vikram123",
    emergency: { name: "Meena Solanki", relationship: "Mother", phone: "+91 94321 09876" },
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    punctuality: [],
  },
];

async function seed() {
  const db = await getDb();

  console.log("🌱 Seeding GoldPE- Task console database for production…");

  // Manager password
  const mgrHash = bcrypt.hashSync("manager@123", 10);
  run(db, `INSERT OR REPLACE INTO employee_passwords (employee_id, password_hash) VALUES (?, ?)`, ["MANAGER", mgrHash]);

  // Clean mock table data
  run(db, `DELETE FROM reimbursements`);
  run(db, `DELETE FROM tasks`);
  run(db, `DELETE FROM od_records`);
  run(db, `DELETE FROM daily_reports`);
  run(db, `DELETE FROM checkins`);
  run(db, `DELETE FROM attendance`);

  for (const emp of EMPLOYEES) {
    const { password, emergency, weeklyHours, punctuality, ...fields } = emp;

    // Insert/update employee row
    const existing = get(db, `SELECT id FROM employees WHERE employee_id = ?`, [emp.employee_id]);
    if (!existing) {
      run(db, `INSERT INTO employees
        (employee_id, name, initials, role, father_name, mother_name, dob, blood_group, phone, email,
         client_name, team_name, joining_date, score, streak, checked_in, check_in_time,
         check_in_lat, check_in_lng, check_in_city, last_location, last_seen, on_od, od_city)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [fields.employee_id, fields.name, fields.initials, fields.role, fields.father_name, fields.mother_name,
         fields.dob, fields.blood_group, fields.phone, fields.email, fields.client_name, fields.team_name,
         fields.joining_date, fields.score, fields.streak, fields.checked_in, fields.check_in_time,
         fields.check_in_lat, fields.check_in_lng, fields.check_in_city, fields.last_location,
         fields.last_seen, fields.on_od, fields.od_city]);
    } else {
      run(db, `UPDATE employees SET checked_in=0, check_in_time=NULL, check_in_lat=NULL, check_in_lng=NULL, check_in_city=NULL, last_location='Off-site', last_seen='Not checked in today', on_od=0, od_city=NULL WHERE employee_id=?`, [emp.employee_id]);
    }

    // Password
    const hash = bcrypt.hashSync(password, 10);
    run(db, `INSERT OR REPLACE INTO employee_passwords (employee_id, password_hash) VALUES (?, ?)`, [emp.employee_id, hash]);

    // Emergency contact
    if (emergency) {
      run(db, `INSERT OR REPLACE INTO emergency_contacts (employee_id, name, relationship, phone) VALUES (?,?,?,?)`,
        [emp.employee_id, emergency.name, emergency.relationship, emergency.phone]);
    }

    // Weekly hours initialization
    for (let i = 0; i < 7; i++) {
      run(db, `INSERT OR IGNORE INTO weekly_hours (employee_id, day_index, hours) VALUES (?, ?, 0)`, [emp.employee_id, i]);
    }
  }

  console.log("✅ Database successfully seeded for real-time tracking!");
}

seed().catch(console.error);
