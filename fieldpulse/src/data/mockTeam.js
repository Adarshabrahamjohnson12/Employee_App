import { TOKENS } from "../tokens";

// ── Helper: generate mock attendance for last 30 days ──────────────────────
function genAttendance(checkedInRate = 0.85) {
  const map = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    if (dow === 0) { map[key] = "off"; continue; }
    const roll = Math.random();
    if (roll < checkedInRate * 0.08) map[key] = "od";
    else if (roll < checkedInRate * 0.15) map[key] = "late";
    else if (roll < checkedInRate) map[key] = "present";
    else map[key] = "absent";
  }
  return map;
}

// ── Helper: generate weekly hours ──────────────────────────────────────────
function genWeeklyHours(base = 8.0) {
  return [
    +(base + (Math.random() - 0.5)).toFixed(1),
    +(base + (Math.random() - 0.5)).toFixed(1),
    +(base + (Math.random() - 0.3)).toFixed(1),
    +(base + (Math.random() - 0.5)).toFixed(1),
    +(base + (Math.random() - 0.4)).toFixed(1),
    +(Math.random() * 3 + 4).toFixed(1),
    0,
  ];
}

export const INITIAL_TEAM = [
  {
    id: 1,
    name: "Arjun Mehta",
    initials: "AM",
    employeeId: "FP-WR-001",
    role: "Field Agent",
    fatherName: "Rajesh Mehta",
    motherName: "Sunita Mehta",
    dob: "1994-08-15",
    bloodGroup: "B+",
    phone: "+91 98765 43210",
    email: "arjun.mehta@goldpe.in",
    emergencyContact: { name: "Rajesh Mehta", relationship: "Father", phone: "+91 98765 43210" },
    aadhaar: { front: null, back: null },
    selfie: null,
    clientName: "BRS Gold Pvt Ltd",
    teamName: "Western Region Alpha",
    joiningDate: "2022-03-01",
    score: 92,
    checkedIn: true,
    checkInTime: "9:14 AM",
    checkInLocation: { city: "Andheri, Mumbai", lat: 19.1197, lng: 72.8468 },
    lastLocation: "Andheri, Mumbai",
    lastSeen: "9:14 AM",
    tasksToday: { done: 4, total: 5 },
    streak: 18,
    onOD: false,
    odCity: null,
    weeklyHours: [8.5, 7.8, 9.1, 8.2, 8.6, 5.5, 0],
    attendance: genAttendance(0.92),
    punctualityTrend: [
      { day: "M", min: -6 }, { day: "T", min: 2 }, { day: "W", min: -10 },
      { day: "T", min: -3 }, { day: "F", min: 4 },  { day: "S", min: -8 },
    ],
    reimbursements: [
      { id: "r1-1", category: "Travel", amount: 1240, description: "Cab fare Mumbai → Pune return", date: "2024-07-10", status: "approved", approvedBy: "Mgr. Sharma" },
      { id: "r1-2", category: "Food", amount: 450, description: "Team lunch at BRS client site", date: "2024-07-12", status: "pending", approvedBy: null },
      { id: "r1-3", category: "Accommodation", amount: 1800, description: "Hotel stay — Nashik OD night", date: "2024-07-05", status: "approved", approvedBy: "Mgr. Sharma" },
    ],
    odHistory: [
      { id: "od1-1", city: "Pune", client: "BRS Gold Pvt Ltd", from: "2024-07-10", to: "2024-07-11", arrived: true, arrivalLocation: "Baner, Pune", arrivalTime: "10:32 AM" },
      { id: "od1-2", city: "Nashik", client: "Malabar Gold — Nashik", from: "2024-07-05", to: "2024-07-06", arrived: true, arrivalLocation: "College Rd, Nashik", arrivalTime: "11:05 AM" },
    ],
  },
  {
    id: 2,
    name: "Priya Nair",
    initials: "PN",
    employeeId: "FP-WR-002",
    role: "Channel Partner Liaison",
    fatherName: "Suresh Nair",
    motherName: "Leela Nair",
    dob: "1996-03-22",
    bloodGroup: "A+",
    phone: "+91 97654 32109",
    email: "priya.nair@goldpe.in",
    emergencyContact: { name: "Suresh Nair", relationship: "Father", phone: "+91 97654 32109" },
    aadhaar: { front: null, back: null },
    selfie: null,
    clientName: "Kalyan Jewellers — Pune Zone",
    teamName: "Western Region Beta",
    joiningDate: "2022-07-15",
    score: 87,
    checkedIn: true,
    checkInTime: "9:02 AM",
    checkInLocation: { city: "Baner, Pune", lat: 18.5590, lng: 73.7868 },
    lastLocation: "Baner, Pune",
    lastSeen: "9:02 AM",
    tasksToday: { done: 3, total: 4 },
    streak: 12,
    onOD: true,
    odCity: "Pune",
    weeklyHours: genWeeklyHours(8.2),
    attendance: genAttendance(0.88),
    punctualityTrend: [
      { day: "M", min: 2 }, { day: "T", min: -4 }, { day: "W", min: 3 },
      { day: "T", min: 1 }, { day: "F", min: -2 }, { day: "S", min: 5 },
    ],
    reimbursements: [
      { id: "r2-1", category: "Travel", amount: 860, description: "Train — Mumbai to Pune (2nd AC)", date: "2024-07-09", status: "approved", approvedBy: "Mgr. Sharma" },
      { id: "r2-2", category: "Accommodation", amount: 2200, description: "Hotel — Pune client visit 2 nights", date: "2024-07-09", status: "pending", approvedBy: null },
    ],
    odHistory: [
      { id: "od2-1", city: "Pune", client: "Kalyan Jewellers", from: "2024-07-09", to: "2024-07-11", arrived: true, arrivalLocation: "Baner, Pune", arrivalTime: "9:45 AM" },
    ],
  },
  {
    id: 3,
    name: "Rohit Deshmukh",
    initials: "RD",
    employeeId: "FP-WR-003",
    role: "Field Agent",
    fatherName: "Anant Deshmukh",
    motherName: "Vimal Deshmukh",
    dob: "1991-11-07",
    bloodGroup: "O+",
    phone: "+91 96543 21098",
    email: "rohit.deshmukh@goldpe.in",
    emergencyContact: { name: "Anant Deshmukh", relationship: "Father", phone: "+91 96543 21098" },
    aadhaar: { front: null, back: null },
    selfie: null,
    clientName: "PC Jeweller — Vadodara",
    teamName: "Western Region Alpha",
    joiningDate: "2021-11-20",
    score: 74,
    checkedIn: false,
    checkInTime: null,
    checkInLocation: null,
    lastLocation: "Vadodara",
    lastSeen: "Yesterday, 6:40 PM",
    tasksToday: { done: 1, total: 5 },
    streak: 2,
    onOD: false,
    odCity: null,
    weeklyHours: genWeeklyHours(7.0),
    attendance: genAttendance(0.72),
    punctualityTrend: [
      { day: "M", min: 12 }, { day: "T", min: 8 }, { day: "W", min: 15 },
      { day: "T", min: -2 }, { day: "F", min: 20 }, { day: "S", min: 10 },
    ],
    reimbursements: [
      { id: "r3-1", category: "Travel", amount: 560, description: "Bus — Surat to Vadodara", date: "2024-07-08", status: "rejected", approvedBy: "Mgr. Sharma", rejectReason: "Receipt not attached" },
      { id: "r3-2", category: "Food", amount: 320, description: "Dinner at site", date: "2024-07-11", status: "pending", approvedBy: null },
    ],
    odHistory: [
      { id: "od3-1", city: "Surat", client: "PC Jeweller", from: "2024-07-07", to: "2024-07-08", arrived: false, arrivalLocation: null, arrivalTime: null },
    ],
  },
  {
    id: 4,
    name: "Sneha Kulkarni",
    initials: "SK",
    employeeId: "FP-WR-004",
    role: "Machine Deployment Lead",
    fatherName: "Prakash Kulkarni",
    motherName: "Rekha Kulkarni",
    dob: "1993-05-30",
    bloodGroup: "AB+",
    phone: "+91 95432 10987",
    email: "sneha.kulkarni@goldpe.in",
    emergencyContact: { name: "Prakash Kulkarni", relationship: "Father", phone: "+91 95432 10987" },
    aadhaar: { front: null, back: null },
    selfie: null,
    clientName: "Reliance Jewels — Nashik",
    teamName: "Machine Ops",
    joiningDate: "2021-06-01",
    score: 95,
    checkedIn: true,
    checkInTime: "8:47 AM",
    checkInLocation: { city: "Nashik", lat: 19.9975, lng: 73.7898 },
    lastLocation: "Nashik",
    lastSeen: "8:47 AM",
    tasksToday: { done: 5, total: 5 },
    streak: 26,
    onOD: true,
    odCity: "Nashik",
    weeklyHours: genWeeklyHours(8.8),
    attendance: genAttendance(0.95),
    punctualityTrend: [
      { day: "M", min: -8 }, { day: "T", min: -12 }, { day: "W", min: -6 },
      { day: "T", min: -10 }, { day: "F", min: -8 }, { day: "S", min: -15 },
    ],
    reimbursements: [
      { id: "r4-1", category: "Travel", amount: 1650, description: "Flight — Mumbai to Nashik + taxi", date: "2024-07-06", status: "approved", approvedBy: "Mgr. Sharma" },
      { id: "r4-2", category: "Accommodation", amount: 2800, description: "Hotel Panchavati — 2 nights", date: "2024-07-06", status: "approved", approvedBy: "Mgr. Sharma" },
      { id: "r4-3", category: "Other", amount: 380, description: "Machine calibration consumables", date: "2024-07-08", status: "pending", approvedBy: null },
    ],
    odHistory: [
      { id: "od4-1", city: "Nashik", client: "Reliance Jewels", from: "2024-07-06", to: "2024-07-09", arrived: true, arrivalLocation: "College Rd, Nashik", arrivalTime: "10:15 AM" },
      { id: "od4-2", city: "Aurangabad", client: "GoldPE Corporate", from: "2024-06-28", to: "2024-06-29", arrived: true, arrivalLocation: "MIDC Aurangabad", arrivalTime: "11:30 AM" },
    ],
  },
  {
    id: 5,
    name: "Vikram Solanki",
    initials: "VS",
    employeeId: "FP-WR-005",
    role: "Field Agent",
    fatherName: "Dinesh Solanki",
    motherName: "Meena Solanki",
    dob: "1995-01-18",
    bloodGroup: "A-",
    phone: "+91 94321 09876",
    email: "vikram.solanki@goldpe.in",
    emergencyContact: { name: "Meena Solanki", relationship: "Mother", phone: "+91 94321 09876" },
    aadhaar: { front: null, back: null },
    selfie: null,
    clientName: "Senco Gold — Surat",
    teamName: "Western Region Beta",
    joiningDate: "2023-01-10",
    score: 81,
    checkedIn: true,
    checkInTime: "9:20 AM",
    checkInLocation: { city: "Surat", lat: 21.1702, lng: 72.8311 },
    lastLocation: "Surat",
    lastSeen: "9:20 AM",
    tasksToday: { done: 2, total: 4 },
    streak: 9,
    onOD: false,
    odCity: null,
    weeklyHours: genWeeklyHours(7.8),
    attendance: genAttendance(0.80),
    punctualityTrend: [
      { day: "M", min: 5 }, { day: "T", min: -3 }, { day: "W", min: 7 },
      { day: "T", min: 2 }, { day: "F", min: -1 }, { day: "S", min: 4 },
    ],
    reimbursements: [
      { id: "r5-1", category: "Travel", amount: 720, description: "Train Surat → Mumbai for training", date: "2024-07-03", status: "approved", approvedBy: "Mgr. Sharma" },
      { id: "r5-2", category: "Food", amount: 280, description: "Client site lunch x2 days", date: "2024-07-11", status: "pending", approvedBy: null },
    ],
    odHistory: [],
  },
];

export const WEEKLY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
