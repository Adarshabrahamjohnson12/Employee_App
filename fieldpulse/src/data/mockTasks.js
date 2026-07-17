export const TASK_CATEGORIES = {
  verification: "Verification",
  maintenance:  "Machine Maintenance",
  onboarding:   "Partner Onboarding",
  collection:   "Document Collection",
  audit:        "XRF Audit",
  deployment:   "Machine Deployment",
};

// Tasks per employee id
export const EMPLOYEE_TASKS = {
  1: [
    { id: "t1-1", title: "Verify gold consignment intake", category: "verification", location: "BR Enterprises Warehouse, Andheri", distance: "0.4 km", status: "done", time: "8:32 AM", clientRef: "BRS-IN-0891" },
    { id: "t1-2", title: "Machine health check — APM unit 14", category: "maintenance", location: "Andheri West Branch", distance: "1.1 km", status: "done", time: "9:50 AM", clientRef: "HW-APM-014" },
    { id: "t1-3", title: "Channel partner onboarding visit", category: "onboarding", location: "Silver Tier Partner, Kandivali", distance: "3.2 km", status: "done", time: "11:20 AM", clientRef: "CP-KDV-22" },
    { id: "t1-4", title: "Collect signed MoU documents", category: "collection", location: "GoldPE Regional Office", distance: "0.0 km", status: "done", time: "1:05 PM", clientRef: "MOU-JUL-24" },
    { id: "t1-5", title: "XRF calibration audit", category: "audit", location: "Bandra Kurla Complex outlet", distance: "5.6 km", status: "pending", time: "Due 5:00 PM", clientRef: "XRF-BKC-07" },
  ],
  2: [
    { id: "t2-1", title: "Partner KYC document review", category: "collection", location: "Kalyan Jewellers HQ, Baner", distance: "0.2 km", status: "done", time: "9:30 AM", clientRef: "KYC-KJ-445" },
    { id: "t2-2", title: "Onboarding presentation — Tier 2 partner", category: "onboarding", location: "Tech Park, Hinjawadi", distance: "4.8 km", status: "done", time: "11:00 AM", clientRef: "CP-HNJ-11" },
    { id: "t2-3", title: "Commission structure sign-off", category: "collection", location: "Kalyan Jewellers Baner", distance: "0.2 km", status: "done", time: "1:30 PM", clientRef: "COM-KJ-07" },
    { id: "t2-4", title: "XRF unit demo at partner site", category: "audit", location: "Partner Showroom, Wakad", distance: "6.1 km", status: "pending", time: "Due 4:00 PM", clientRef: "XRF-WKD-03" },
  ],
  3: [
    { id: "t3-1", title: "Machine installation — PC Jeweller unit 3", category: "deployment", location: "PC Jeweller Main Branch, Vadodara", distance: "0.8 km", status: "done", time: "10:15 AM", clientRef: "DEP-VAD-003" },
    { id: "t3-2", title: "Staff training on machine operation", category: "onboarding", location: "PC Jeweller Main Branch", distance: "0.8 km", status: "pending", time: "Due 12:00 PM", clientRef: "TRN-VAD-03" },
    { id: "t3-3", title: "Verify gold intake — afternoon batch", category: "verification", location: "PC Jeweller Warehouse", distance: "1.4 km", status: "pending", time: "Due 2:00 PM", clientRef: "VER-VAD-A2" },
    { id: "t3-4", title: "Collect signed installation receipt", category: "collection", location: "PC Jeweller HQ", distance: "0.8 km", status: "pending", time: "Due 4:00 PM", clientRef: "REC-VAD-03" },
    { id: "t3-5", title: "Snap photos of deployed machine", category: "audit", location: "PC Jeweller Main Branch", distance: "0.8 km", status: "pending", time: "Due 4:30 PM", clientRef: "PHO-VAD-03" },
  ],
  4: [
    { id: "t4-1", title: "APM unit 7 calibration — Nashik", category: "maintenance", location: "Reliance Jewels, College Rd", distance: "0.1 km", status: "done", time: "9:10 AM", clientRef: "CAL-NSK-007" },
    { id: "t4-2", title: "Install replacement sensor module", category: "deployment", location: "Reliance Jewels, College Rd", distance: "0.1 km", status: "done", time: "10:30 AM", clientRef: "SEN-NSK-007" },
    { id: "t4-3", title: "XRF accuracy verification post-calibration", category: "audit", location: "Reliance Jewels, College Rd", distance: "0.1 km", status: "done", time: "11:45 AM", clientRef: "XRF-NSK-P7" },
    { id: "t4-4", title: "Submit calibration report", category: "collection", location: "On-site (Nashik)", distance: "0.0 km", status: "done", time: "1:15 PM", clientRef: "RPT-NSK-007" },
    { id: "t4-5", title: "Client sign-off on deployment certificate", category: "collection", location: "Reliance Jewels Reception", distance: "0.1 km", status: "done", time: "2:00 PM", clientRef: "CERT-NSK-007" },
  ],
  5: [
    { id: "t5-1", title: "Morning gold intake verification", category: "verification", location: "Senco Gold, Surat Ring Rd", distance: "0.3 km", status: "done", time: "9:45 AM", clientRef: "VER-SRT-M1" },
    { id: "t5-2", title: "Partner onboarding follow-up call + visit", category: "onboarding", location: "Senco Gold HQ, Surat", distance: "0.3 km", status: "done", time: "11:00 AM", clientRef: "CP-SRT-09" },
    { id: "t5-3", title: "XRF audit — unit 2 Surat branch", category: "audit", location: "Senco Gold Branch 2, Adajan", distance: "3.7 km", status: "pending", time: "Due 3:00 PM", clientRef: "XRF-SRT-U2" },
    { id: "t5-4", title: "Collect MoU renewal documents", category: "collection", location: "Senco Gold HQ", distance: "0.3 km", status: "pending", time: "Due 5:00 PM", clientRef: "MOU-SRT-R1" },
  ],
};
