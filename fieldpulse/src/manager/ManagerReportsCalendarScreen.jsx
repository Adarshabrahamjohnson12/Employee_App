import React, { useState, useEffect } from "react";
import { TOKENS } from "../tokens";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { useApp } from "../context/AppContext";
import { getImageUrl } from "../api/client";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
  FileText, User, CheckCircle2, AlertCircle, Search, Sparkles, UserCheck, UserX
} from "lucide-react";

export function ManagerReportsCalendarScreen() {
  const { team, fetchAllDailyReports, fetchCalendarSummary } = useApp();

  // Selected Date state
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // Current Month/Year for calendar view
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed (0=Jan, 6=Jul)

  // Calendar summary counts data map: { "YYYY-MM-DD": { count, totalReports } }
  const [calendarSummary, setCalendarSummary] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Daily reports for selected date
  const [selectedDateReports, setSelectedDateReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Search filter
  const [search, setSearch] = useState("");

  // Format YYYY-MM string
  const getMonthStr = (yr, mo) => `${yr}-${String(mo + 1).padStart(2, "0")}`;

  // Load calendar summary counts for current month
  const loadCalendarData = async () => {
    try {
      setLoadingCalendar(true);
      const monthStr = getMonthStr(currentYear, currentMonth);
      const data = await fetchCalendarSummary(monthStr);
      setCalendarSummary(data.summary || {});
    } catch (err) {
      console.error("Error loading calendar summary:", err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Load daily reports for selected date
  const loadReportsForDate = async (dateStr) => {
    try {
      setLoadingReports(true);
      const reports = await fetchAllDailyReports({ date: dateStr });
      setSelectedDateReports(reports || []);
    } catch (err) {
      console.error("Error loading date reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      loadReportsForDate(selectedDate);
    }
  }, [selectedDate]);

  // Calendar Month Navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Generate calendar days
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay(); // 0 = Sun

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Map employees to reports for selected date
  const teamReportsMap = team.map((emp) => {
    const report = selectedDateReports.find(
      (r) => r.employeeId === emp.employee_id || r.employeeId === emp.id || r.employeeId === String(emp.id)
    );
    return {
      emp,
      report,
    };
  });

  const filteredTeamReportsMap = teamReportsMap.filter(({ emp, report }) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q) ||
      (report && report.work.toLowerCase().includes(q))
    );
  });

  const submittedCount = selectedDateReports.length;
  const totalEmployees = team.length;

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Top Banner */}
      <Card style={{
        background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navySoft})`,
        color: "#fff", marginBottom: 20, position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `${TOKENS.gold}22`, border: `1.5px solid ${TOKENS.gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CalendarIcon size={22} color={TOKENS.gold} />
          </div>
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
              Everyday Reports & Calendar
            </h2>
            <p style={{ fontSize: 12, color: TOKENS.goldLight, margin: 0, fontWeight: 500 }}>
              Click any date on the calendar to view daily task submissions
            </p>
          </div>
        </div>
      </Card>

      {/* Interactive Calendar Grid Card */}
      <Card style={{ marginBottom: 24 }}>
        {/* Month Navigation Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, borderBottom: `1px solid ${TOKENS.border}40`, paddingBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarIcon size={18} color={TOKENS.gold} />
            <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, color: TOKENS.navyDeep }}>
              {monthNames[currentMonth]} {currentYear}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={prevMonth}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${TOKENS.border}`,
                background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: TOKENS.navyDeep,
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => {
                const today = new Date();
                setCurrentYear(today.getFullYear());
                setCurrentMonth(today.getMonth());
                setSelectedDate(getTodayStr());
              }}
              style={{
                padding: "4px 12px", borderRadius: 8, border: `1px solid ${TOKENS.border}`,
                background: "#F8FAFC", fontSize: 11, fontWeight: 700, color: TOKENS.navyDeep,
                cursor: "pointer",
              }}
            >
              Today
            </button>

            <button
              onClick={nextMonth}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${TOKENS.border}`,
                background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: TOKENS.navyDeep,
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", marginBottom: 6 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted, padding: "4px 0" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {/* Blank padding slots for previous month */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`blank-${idx}`} style={{ minHeight: 46, background: "#FAFAFA", borderRadius: 8, opacity: 0.3 }} />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === getTodayStr();

            const summaryData = calendarSummary[dateStr];
            const hasSubmissions = summaryData && summaryData.count > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  minHeight: 52, padding: "6px 4px", borderRadius: 10,
                  border: isSelected
                    ? `2px solid ${TOKENS.gold}`
                    : isToday
                    ? `1.5px solid ${TOKENS.navyDeep}`
                    : `1px solid ${TOKENS.border}66`,
                  background: isSelected
                    ? `${TOKENS.navyDeep}`
                    : isToday
                    ? `#F0F4F8`
                    : hasSubmissions
                    ? `#F4FBF7`
                    : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : TOKENS.navyDeep,
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(10,25,50,0.2)" : "none",
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: isToday || isSelected ? 800 : 600,
                  lineHeight: 1,
                }}>
                  {dayNum}
                </span>

                {/* Submission status badge on date tile */}
                {hasSubmissions ? (
                  <span style={{
                    fontSize: 9, fontWeight: 700, borderRadius: 8, padding: "2px 4px",
                    background: isSelected ? TOKENS.gold : TOKENS.success,
                    color: isSelected ? TOKENS.navyDeep : "#FFF",
                    width: "100%", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {summaryData.count} submitted
                  </span>
                ) : (
                  <span style={{ fontSize: 8, color: isSelected ? "#9FB0C9" : "#CBD5E1" }}>
                    —
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Date Inspection Section */}
      <div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 14, flexWrap: "wrap", gap: 10,
        }}>
          <div>
            <SectionLabel icon={Sparkles} label={`DAILY REPORTS FOR ${selectedDate}`} />
            <div style={{ fontSize: 13, color: TOKENS.muted, fontWeight: 500, marginTop: -6 }}>
              {submittedCount} of {totalEmployees} team members submitted work reports
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${TOKENS.border}`, borderRadius: 20, padding: "4px 12px", minWidth: 200 }}>
            <Search size={14} color={TOKENS.muted} />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: 12, width: "100%", background: "transparent" }}
            />
          </div>
        </div>

        {loadingReports ? (
          <div style={{ padding: 24, textAlign: "center", color: TOKENS.muted, fontSize: 13 }}>
            Loading reports for {selectedDate}...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredTeamReportsMap.map(({ emp, report }) => {
              const hasSubmitted = !!report;
              return (
                <Card
                  key={emp.employee_id}
                  style={{
                    padding: 18,
                    borderLeft: hasSubmitted ? `4px solid ${TOKENS.success}` : `4px solid ${TOKENS.muted}44`,
                    background: hasSubmitted ? "#FFFFFF" : "#FAFAFA",
                  }}
                >
                  {/* Employee Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", overflow: "hidden",
                        border: `2px solid ${hasSubmitted ? TOKENS.gold : TOKENS.border}`,
                        background: TOKENS.navySoft, display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 700, flexShrink: 0,
                      }}>
                        {emp.selfie ? (
                          <img src={getImageUrl(emp.selfie)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          emp.initials
                        )}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: TOKENS.navyDeep }}>
                            {emp.name}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, background: `${TOKENS.navyDeep}12`, color: TOKENS.navyDeep, padding: "2px 8px", borderRadius: 10 }}>
                            {emp.employee_id}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: TOKENS.muted, fontWeight: 500 }}>
                          {emp.role} • {emp.team_name || "Western Region"}
                        </div>
                      </div>
                    </div>

                    {/* Submission status badge */}
                    {hasSubmitted ? (
                      <div style={{
                        background: "#E6F4EA", border: `1px solid ${TOKENS.success}`,
                        borderRadius: 14, padding: "4px 12px", fontSize: 11, fontWeight: 700,
                        color: "#137333", display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <UserCheck size={14} color={TOKENS.success} />
                        Report Submitted
                      </div>
                    ) : (
                      <div style={{
                        background: "#F1F5F9", border: `1px solid ${TOKENS.border}`,
                        borderRadius: 14, padding: "4px 12px", fontSize: 11, fontWeight: 600,
                        color: TOKENS.muted, display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <UserX size={14} color={TOKENS.muted} />
                        Pending Submission
                      </div>
                    )}
                  </div>

                  {/* Report Details Content (if submitted) */}
                  {hasSubmitted ? (
                    <div style={{
                      background: "#F8FAFC", borderRadius: 12, padding: 14,
                      border: `1px solid ${TOKENS.border}66`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TOKENS.navyDeep, display: "flex", alignItems: "center", gap: 6 }}>
                          <FileText size={14} color={TOKENS.gold} />
                          Work Performed:
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            background: `${TOKENS.gold}22`, border: `1px solid ${TOKENS.gold}66`,
                            borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700, color: TOKENS.navyDeep,
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            <Clock size={12} color={TOKENS.navyDeep} />
                            Time Spent: <b>{report.timeSpent}</b>
                          </div>
                          {report.submittedAt && (
                            <span style={{ fontSize: 10, color: TOKENS.muted }}>
                              Sub: {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: TOKENS.navySoft, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {report.work}
                      </div>

                      {report.remarks && (
                        <div style={{
                          marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${TOKENS.border}`,
                          fontSize: 11, color: TOKENS.muted, fontStyle: "italic",
                        }}>
                          <b>Remarks / Follow-up:</b> {report.remarks}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: TOKENS.muted, fontStyle: "italic", padding: "4px 0" }}>
                      No daily work report submitted by this employee for {selectedDate}.
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
