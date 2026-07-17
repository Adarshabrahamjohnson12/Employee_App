/**
 * Seed script — run once: node database/seed.js
 * Populates DB with the 5 Western Region field agents + all related data.
 */
const bcrypt = require("bcryptjs");
const { getDb, run, get, all } = require("./db");

const EMPLOYEES = [
  {
    employee_id: "FP-WR-001", name: "Arjun Mehta",   initials: "AM",
    role: "Field Agent",           father_name: "Rajesh Mehta",  mother_name: "Sunita Mehta",
    dob: "1994-08-15",            blood_group: "B+",             phone: "+91 98765 43210",
    email: "arjun.mehta@goldpe.in", client_name: "BRS Gold Pvt Ltd",
    team_name: "Western Region Alpha", joining_date: "2022-03-01",
    score: 92, streak: 18, checked_in: 1, check_in_time: "9:14 AM",
    check_in_lat: 19.1197, check_in_lng: 72.8468, check_in_city: "Andheri, Mumbai",
    last_location: "Andheri, Mumbai", last_seen: "9:14 AM", on_od: 0, od_city: null,
    password: "arjun123",
    emergency: { name: "Rajesh Mehta", relationship: "Father", phone: "+91 98765 43210" },
    weeklyHours: [8.5, 7.8, 9.1, 8.2, 8.6, 5.5, 0],
    punctuality: [{ day: "M", min: -6 }, { day: "T", min: 2 }, { day: "W", min: -10 }, { day: "T2", min: -3 }, { day: "F", min: 4 }, { day: "S", min: -8 }],
  },
  {
    employee_id: "FP-WR-002", name: "Priya Nair",    initials: "PN",
    role: "Channel Partner Liaison", father_name: "Suresh Nair", mother_name: "Leela Nair",
    dob: "1996-03-22",             blood_group: "A+",            phone: "+91 97654 32109",
    email: "priya.nair@goldpe.in", client_name: "Kalyan Jewellers — Pune Zone",
    team_name: "Western Region Beta", joining_date: "2022-07-15",
    score: 87, streak: 12, checked_in: 1, check_in_time: "9:02 AM",
    check_in_lat: 18.5590, check_in_lng: 73.7868, check_in_city: "Baner, Pune",
    last_location: "Baner, Pune", last_seen: "9:02 AM", on_od: 1, od_city: "Pune",
    password: "priya123",
    emergency: { name: "Suresh Nair", relationship: "Father", phone: "+91 97654 32109" },
    weeklyHours: [8.2, 7.9, 8.4, 8.1, 8.3, 5.2, 0],
    punctuality: [{ day: "M", min: 2 }, { day: "T", min: -4 }, { day: "W", min: 3 }, { day: "T2", min: 1 }, { day: "F", min: -2 }, { day: "S", min: 5 }],
  },
  {
    employee_id: "FP-WR-003", name: "Rohit Deshmukh", initials: "RD",
    role: "Field Agent",            father_name: "Anant Deshmukh", mother_name: "Vimal Deshmukh",
    dob: "1991-11-07",             blood_group: "O+",              phone: "+91 96543 21098",
    email: "rohit.deshmukh@goldpe.in", client_name: "PC Jeweller — Vadodara",
    team_name: "Western Region Alpha", joining_date: "2021-11-20",
    score: 74, streak: 2, checked_in: 0, check_in_time: null,
    check_in_lat: null, check_in_lng: null, check_in_city: null,
    last_location: "Vadodara", last_seen: "Yesterday, 6:40 PM", on_od: 0, od_city: null,
    password: "rohit123",
    emergency: { name: "Anant Deshmukh", relationship: "Father", phone: "+91 96543 21098" },
    weeklyHours: [7.0, 6.8, 7.2, 6.5, 7.1, 4.5, 0],
    punctuality: [{ day: "M", min: 12 }, { day: "T", min: 8 }, { day: "W", min: 15 }, { day: "T2", min: -2 }, { day: "F", min: 20 }, { day: "S", min: 10 }],
  },
  {
    employee_id: "FP-WR-004", name: "Sneha Kulkarni", initials: "SK",
    role: "Machine Deployment Lead", father_name: "Prakash Kulkarni", mother_name: "Rekha Kulkarni",
    dob: "1993-05-30",              blood_group: "AB+",              phone: "+91 95432 10987",
    email: "sneha.kulkarni@goldpe.in", client_name: "Reliance Jewels — Nashik",
    team_name: "Machine Ops", joining_date: "2021-06-01",
    score: 95, streak: 26, checked_in: 1, check_in_time: "8:47 AM",
    check_in_lat: 19.9975, check_in_lng: 73.7898, check_in_city: "Nashik",
    last_location: "Nashik", last_seen: "8:47 AM", on_od: 1, od_city: "Nashik",
    password: "sneha123",
    emergency: { name: "Prakash Kulkarni", relationship: "Father", phone: "+91 95432 10987" },
    weeklyHours: [8.8, 9.1, 8.7, 9.0, 8.9, 5.8, 0],
    punctuality: [{ day: "M", min: -8 }, { day: "T", min: -12 }, { day: "W", min: -6 }, { day: "T2", min: -10 }, { day: "F", min: -8 }, { day: "S", min: -15 }],
  },
  {
    employee_id: "FP-WR-005", name: "Vikram Solanki", initials: "VS",
    role: "Field Agent",             father_name: "Dinesh Solanki", mother_name: "Meena Solanki",
    dob: "1995-01-18",              blood_group: "A-",              phone: "+91 94321 09876",
    email: "vikram.solanki@goldpe.in", client_name: "Senco Gold — Surat",
    team_name: "Western Region Beta", joining_date: "2023-01-10",
    score: 81, streak: 9, checked_in: 1, check_in_time: "9:20 AM",
    check_in_lat: 21.1702, check_in_lng: 72.8311, check_in_city: "Surat",
    last_location: "Surat", last_seen: "9:20 AM", on_od: 0, od_city: null,
    password: "vikram123",
    emergency: { name: "Meena Solanki", relationship: "Mother", phone: "+91 94321 09876" },
    weeklyHours: [7.8, 7.5, 8.0, 7.7, 7.9, 5.0, 0],
    punctuality: [{ day: "M", min: 5 }, { day: "T", min: -3 }, { day: "W", min: 7 }, { day: "T2", min: 2 }, { day: "F", min: -1 }, { day: "S", min: 4 }],
  },
];

const TASKS = {
  "FP-WR-001": [
    { id:"t1-1", title:"Verify gold consignment intake",       category:"verification", location:"BR Enterprises Warehouse, Andheri", distance:"0.4 km", status:"done",    time:"8:32 AM",    client_ref:"BRS-IN-0891" },
    { id:"t1-2", title:"Machine health check — APM unit 14",  category:"maintenance",  location:"Andheri West Branch",                distance:"1.1 km", status:"done",    time:"9:50 AM",    client_ref:"HW-APM-014" },
    { id:"t1-3", title:"Channel partner onboarding visit",     category:"onboarding",   location:"Silver Tier Partner, Kandivali",      distance:"3.2 km", status:"done",    time:"11:20 AM",   client_ref:"CP-KDV-22" },
    { id:"t1-4", title:"Collect signed MoU documents",        category:"collection",   location:"GoldPE Regional Office",              distance:"0.0 km", status:"done",    time:"1:05 PM",    client_ref:"MOU-JUL-24" },
    { id:"t1-5", title:"XRF calibration audit",               category:"audit",        location:"Bandra Kurla Complex outlet",          distance:"5.6 km", status:"pending", time:"Due 5:00 PM", client_ref:"XRF-BKC-07" },
  ],
  "FP-WR-002": [
    { id:"t2-1", title:"Partner KYC document review",         category:"collection",   location:"Kalyan Jewellers HQ, Baner",          distance:"0.2 km", status:"done",    time:"9:30 AM",    client_ref:"KYC-KJ-445" },
    { id:"t2-2", title:"Onboarding presentation",             category:"onboarding",   location:"Tech Park, Hinjawadi",                distance:"4.8 km", status:"done",    time:"11:00 AM",   client_ref:"CP-HNJ-11" },
    { id:"t2-3", title:"Commission structure sign-off",       category:"collection",   location:"Kalyan Jewellers Baner",              distance:"0.2 km", status:"done",    time:"1:30 PM",    client_ref:"COM-KJ-07" },
    { id:"t2-4", title:"XRF unit demo at partner site",       category:"audit",        location:"Partner Showroom, Wakad",             distance:"6.1 km", status:"pending", time:"Due 4:00 PM", client_ref:"XRF-WKD-03" },
  ],
  "FP-WR-003": [
    { id:"t3-1", title:"Machine installation — PC Jeweller",  category:"deployment",   location:"PC Jeweller Main Branch, Vadodara",   distance:"0.8 km", status:"done",    time:"10:15 AM",   client_ref:"DEP-VAD-003" },
    { id:"t3-2", title:"Staff training on machine operation", category:"onboarding",   location:"PC Jeweller Main Branch",             distance:"0.8 km", status:"pending", time:"Due 12:00 PM",client_ref:"TRN-VAD-03" },
    { id:"t3-3", title:"Verify gold intake — afternoon",      category:"verification", location:"PC Jeweller Warehouse",               distance:"1.4 km", status:"pending", time:"Due 2:00 PM", client_ref:"VER-VAD-A2" },
    { id:"t3-4", title:"Collect signed installation receipt", category:"collection",   location:"PC Jeweller HQ",                      distance:"0.8 km", status:"pending", time:"Due 4:00 PM", client_ref:"REC-VAD-03" },
    { id:"t3-5", title:"Snap photos of deployed machine",     category:"audit",        location:"PC Jeweller Main Branch",             distance:"0.8 km", status:"pending", time:"Due 4:30 PM", client_ref:"PHO-VAD-03" },
  ],
  "FP-WR-004": [
    { id:"t4-1", title:"APM unit 7 calibration — Nashik",     category:"maintenance",  location:"Reliance Jewels, College Rd",         distance:"0.1 km", status:"done",    time:"9:10 AM",    client_ref:"CAL-NSK-007" },
    { id:"t4-2", title:"Install replacement sensor module",   category:"deployment",   location:"Reliance Jewels, College Rd",         distance:"0.1 km", status:"done",    time:"10:30 AM",   client_ref:"SEN-NSK-007" },
    { id:"t4-3", title:"XRF accuracy verification",           category:"audit",        location:"Reliance Jewels, College Rd",         distance:"0.1 km", status:"done",    time:"11:45 AM",   client_ref:"XRF-NSK-P7" },
    { id:"t4-4", title:"Submit calibration report",           category:"collection",   location:"On-site (Nashik)",                    distance:"0.0 km", status:"done",    time:"1:15 PM",    client_ref:"RPT-NSK-007" },
    { id:"t4-5", title:"Client sign-off on deployment cert",  category:"collection",   location:"Reliance Jewels Reception",           distance:"0.1 km", status:"done",    time:"2:00 PM",    client_ref:"CERT-NSK-007" },
  ],
  "FP-WR-005": [
    { id:"t5-1", title:"Morning gold intake verification",    category:"verification", location:"Senco Gold, Surat Ring Rd",           distance:"0.3 km", status:"done",    time:"9:45 AM",    client_ref:"VER-SRT-M1" },
    { id:"t5-2", title:"Partner onboarding follow-up",        category:"onboarding",   location:"Senco Gold HQ, Surat",               distance:"0.3 km", status:"done",    time:"11:00 AM",   client_ref:"CP-SRT-09" },
    { id:"t5-3", title:"XRF audit — unit 2 Surat branch",    category:"audit",        location:"Senco Gold Branch 2, Adajan",         distance:"3.7 km", status:"pending", time:"Due 3:00 PM", client_ref:"XRF-SRT-U2" },
    { id:"t5-4", title:"Collect MoU renewal documents",       category:"collection",   location:"Senco Gold HQ",                      distance:"0.3 km", status:"pending", time:"Due 5:00 PM", client_ref:"MOU-SRT-R1" },
  ],
};

const REIMBURSEMENTS = [
  { id:"r1-1", employee_id:"FP-WR-001", category:"Travel",        amount:1240, description:"Cab fare Mumbai → Pune return",          date:"2024-07-10", status:"approved", approved_by:"Mgr. Sharma" },
  { id:"r1-2", employee_id:"FP-WR-001", category:"Food",          amount:450,  description:"Team lunch at BRS client site",          date:"2024-07-12", status:"pending",  approved_by:null },
  { id:"r1-3", employee_id:"FP-WR-001", category:"Accommodation", amount:1800, description:"Hotel stay — Nashik OD night",           date:"2024-07-05", status:"approved", approved_by:"Mgr. Sharma" },
  { id:"r2-1", employee_id:"FP-WR-002", category:"Travel",        amount:860,  description:"Train — Mumbai to Pune (2nd AC)",         date:"2024-07-09", status:"approved", approved_by:"Mgr. Sharma" },
  { id:"r2-2", employee_id:"FP-WR-002", category:"Accommodation", amount:2200, description:"Hotel — Pune client visit 2 nights",      date:"2024-07-09", status:"pending",  approved_by:null },
  { id:"r3-1", employee_id:"FP-WR-003", category:"Travel",        amount:560,  description:"Bus — Surat to Vadodara",                 date:"2024-07-08", status:"rejected", approved_by:"Mgr. Sharma", reject_reason:"Receipt not attached" },
  { id:"r3-2", employee_id:"FP-WR-003", category:"Food",          amount:320,  description:"Dinner at site",                         date:"2024-07-11", status:"pending",  approved_by:null },
  { id:"r4-1", employee_id:"FP-WR-004", category:"Travel",        amount:1650, description:"Flight — Mumbai to Nashik + taxi",        date:"2024-07-06", status:"approved", approved_by:"Mgr. Sharma" },
  { id:"r4-2", employee_id:"FP-WR-004", category:"Accommodation", amount:2800, description:"Hotel Panchavati — 2 nights",             date:"2024-07-06", status:"approved", approved_by:"Mgr. Sharma" },
  { id:"r4-3", employee_id:"FP-WR-004", category:"Other",         amount:380,  description:"Machine calibration consumables",         date:"2024-07-08", status:"pending",  approved_by:null },
  { id:"r5-1", employee_id:"FP-WR-005", category:"Travel",        amount:720,  description:"Train Surat → Mumbai for training",       date:"2024-07-03", status:"approved", approved_by:"Mgr. Sharma" },
  { id:"r5-2", employee_id:"FP-WR-005", category:"Food",          amount:280,  description:"Client site lunch x2 days",              date:"2024-07-11", status:"pending",  approved_by:null },
];

const OD_RECORDS = [
  { id:"od1-1", employee_id:"FP-WR-001", city:"Pune",       client:"BRS Gold Pvt Ltd",     from_date:"2024-07-10", to_date:"2024-07-11", arrived:1, arrival_location:"Baner, Pune",        arrival_time:"10:32 AM" },
  { id:"od1-2", employee_id:"FP-WR-001", city:"Nashik",     client:"Malabar Gold — Nashik", from_date:"2024-07-05", to_date:"2024-07-06", arrived:1, arrival_location:"College Rd, Nashik", arrival_time:"11:05 AM" },
  { id:"od2-1", employee_id:"FP-WR-002", city:"Pune",       client:"Kalyan Jewellers",      from_date:"2024-07-09", to_date:"2024-07-11", arrived:1, arrival_location:"Baner, Pune",        arrival_time:"9:45 AM" },
  { id:"od3-1", employee_id:"FP-WR-003", city:"Surat",      client:"PC Jeweller",           from_date:"2024-07-07", to_date:"2024-07-08", arrived:0, arrival_location:null,                 arrival_time:null },
  { id:"od4-1", employee_id:"FP-WR-004", city:"Nashik",     client:"Reliance Jewels",       from_date:"2024-07-06", to_date:"2024-07-09", arrived:1, arrival_location:"College Rd, Nashik", arrival_time:"10:15 AM" },
  { id:"od4-2", employee_id:"FP-WR-004", city:"Aurangabad", client:"GoldPE Corporate",      from_date:"2024-06-28", to_date:"2024-06-29", arrived:1, arrival_location:"MIDC Aurangabad",    arrival_time:"11:30 AM" },
];

// Attendance rates per employee
const ATTEND_RATES = { "FP-WR-001": 0.92, "FP-WR-002": 0.88, "FP-WR-003": 0.72, "FP-WR-004": 0.95, "FP-WR-005": 0.80 };

function genAttendance(empId) {
  const rate = ATTEND_RATES[empId] || 0.8;
  const rows = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    let status;
    if (dow === 0) status = "off";
    else {
      const r = Math.random();
      if      (r < rate * 0.08) status = "od";
      else if (r < rate * 0.15) status = "late";
      else if (r < rate)        status = "present";
      else                      status = "absent";
    }
    rows.push({ employee_id: empId, date, status });
  }
  return rows;
}

async function seed() {
  const { getDb, run, get } = require("./db");
  const db = await getDb();

  console.log("🌱 Seeding FieldPulse database…");

  // Manager password
  const mgrHash = bcrypt.hashSync("manager@123", 10);
  run(db, `INSERT OR IGNORE INTO employee_passwords (employee_id, password_hash) VALUES (?, ?)`, ["MANAGER", mgrHash]);

  for (const emp of EMPLOYEES) {
    const { password, emergency, weeklyHours, punctuality, ...fields } = emp;

    // Employee row
    run(db, `INSERT OR IGNORE INTO employees
      (employee_id, name, initials, role, father_name, mother_name, dob, blood_group, phone, email,
       client_name, team_name, joining_date, score, streak, checked_in, check_in_time,
       check_in_lat, check_in_lng, check_in_city, last_location, last_seen, on_od, od_city)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [fields.employee_id, fields.name, fields.initials, fields.role,
       fields.father_name, fields.mother_name, fields.dob, fields.blood_group,
       fields.phone, fields.email, fields.client_name, fields.team_name,
       fields.joining_date, fields.score, fields.streak, fields.checked_in,
       fields.check_in_time, fields.check_in_lat, fields.check_in_lng,
       fields.check_in_city, fields.last_location, fields.last_seen,
       fields.on_od, fields.od_city]);

    // Password
    const hash = bcrypt.hashSync(password, 10);
    run(db, `INSERT OR IGNORE INTO employee_passwords (employee_id, password_hash) VALUES (?,?)`, [fields.employee_id, hash]);

    // Emergency contact
    run(db, `INSERT OR REPLACE INTO emergency_contacts (employee_id, name, relationship, phone) VALUES (?,?,?,?)`,
      [fields.employee_id, emergency.name, emergency.relationship, emergency.phone]);

    // Weekly hours
    weeklyHours.forEach((hrs, i) => {
      run(db, `INSERT OR REPLACE INTO weekly_hours (employee_id, day_index, hours) VALUES (?,?,?)`, [fields.employee_id, i, hrs]);
    });

    // Punctuality
    punctuality.forEach(({ day, min }) => {
      run(db, `INSERT OR REPLACE INTO punctuality (employee_id, day, minutes) VALUES (?,?,?)`, [fields.employee_id, day, min]);
    });

    // Attendance
    for (const row of genAttendance(fields.employee_id)) {
      run(db, `INSERT OR IGNORE INTO attendance (employee_id, date, status) VALUES (?,?,?)`, [row.employee_id, row.date, row.status]);
    }

    // Tasks
    const myTasks = TASKS[fields.employee_id] || [];
    for (const t of myTasks) {
      run(db, `INSERT OR IGNORE INTO tasks (id, employee_id, title, category, location, distance, status, time, client_ref) VALUES (?,?,?,?,?,?,?,?,?)`,
        [t.id, fields.employee_id, t.title, t.category, t.location, t.distance, t.status, t.time, t.client_ref]);
    }

    console.log(`  ✓ ${fields.name} (${fields.employee_id})`);
  }

  // Reimbursements
  for (const r of REIMBURSEMENTS) {
    run(db, `INSERT OR IGNORE INTO reimbursements (id, employee_id, category, amount, description, date, status, approved_by, reject_reason) VALUES (?,?,?,?,?,?,?,?,?)`,
      [r.id, r.employee_id, r.category, r.amount, r.description, r.date, r.status, r.approved_by || null, r.reject_reason || null]);
  }

  // OD records
  for (const od of OD_RECORDS) {
    run(db, `INSERT OR IGNORE INTO od_records (id, employee_id, city, client, from_date, to_date, arrived, arrival_location, arrival_time) VALUES (?,?,?,?,?,?,?,?,?)`,
      [od.id, od.employee_id, od.city, od.client, od.from_date, od.to_date, od.arrived, od.arrival_location || null, od.arrival_time || null]);
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
