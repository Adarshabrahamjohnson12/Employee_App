import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { fmtTime, getTopClockTime } from "../hooks/useClock";

const AppContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadUser() {
  try { return JSON.parse(localStorage.getItem("fp_user")); } catch { return null; }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(loadUser);
  const [employee, setEmployee] = useState(null);   // Full profile (employee portal)
  const [team, setTeam] = useState([]);             // All employees (manager portal)
  const [tasks, setTasks] = useState([]);           // Tasks for current employee
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (employeeId, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/auth/login", { employeeId, password });
      localStorage.setItem("fp_token", data.token);
      localStorage.setItem("fp_user", JSON.stringify(data.user));
      setCurrentUserState(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed";
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const setupPassword = useCallback(async (employeeId, password) => {
    setLoading(true); setError(null);
    try {
      await api.post("/auth/setup-password", { employeeId, password });
    } catch (err) {
      const msg = err.response?.data?.error || "Setup failed";
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fp_token");
    localStorage.removeItem("fp_user");
    setCurrentUserState(null);
    setEmployee(null); setTeam([]); setTasks([]);
  }, []);

  // ── Load data after login ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "employee") {
      loadEmployeeData(currentUser.employeeId);
    } else {
      loadTeamData();
    }
  }, [currentUser]);

  // ── Periodic Silent Background Sync ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      try {
        if (currentUser.role === "employee") {
          const [empRes, taskRes] = await Promise.all([
            api.get(`/employees/${currentUser.employeeId}`),
            api.get("/tasks"),
          ]);
          setEmployee(empRes.data.data);
          setTasks(taskRes.data.data);
        } else {
          const { data } = await api.get("/employees");
          setTeam(data.data);
        }
      } catch (err) {
        console.error("Background sync error:", err);
      }
    }, 4000); // Sync every 4 seconds silently

    return () => clearInterval(interval);
  }, [currentUser]);

  const loadEmployeeData = useCallback(async (empId) => {
    if (!empId) {
      logout();
      return;
    }
    setLoading(true);
    try {
      const [empRes, taskRes] = await Promise.all([
        api.get(`/employees/${empId}`),
        api.get("/tasks"),
      ]);
      setEmployee(empRes.data.data);
      setTasks(taskRes.data.data);
    } catch (err) {
      console.error("Load employee error:", err);
      if (err.response?.status === 404 || err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    } finally { setLoading(false); }
  }, [logout]);

  const loadTeamData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees");
      setTeam(data.data);
    } catch (err) { console.error("Load team error:", err); }
    finally { setLoading(false); }
  }, []);

  const refreshEmployee = useCallback(() => {
    if (currentUser?.role === "employee") loadEmployeeData(currentUser.employeeId);
  }, [currentUser, loadEmployeeData]);

  const refreshTeam = useCallback(() => { loadTeamData(); }, [loadTeamData]);

  // ── Employee actions ───────────────────────────────────────────────────────
  const getDeviceTime = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const getDeviceFullTime = () => `${getDeviceTime()}, ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;

  const doCheckIn = useCallback(async (location) => {
    const checkInTime = getDeviceTime();
    await api.post("/checkin", {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      city: location.city,
      isRealGps: location.real,
      checkInTime,
      deviceTime: checkInTime
    });
    await loadEmployeeData(currentUser.employeeId);
    await refreshTeam();
  }, [currentUser, loadEmployeeData, refreshTeam]);

  const doCheckOut = useCallback(async () => {
    const checkOutTime = getDeviceTime();
    await api.post("/checkin/out", { checkOutTime, deviceTime: checkOutTime });
    await loadEmployeeData(currentUser.employeeId);
    await refreshTeam();
  }, [currentUser, loadEmployeeData, refreshTeam]);

  const declareOD = useCallback(async (record) => {
    await api.post("/od", record);
    await loadEmployeeData(currentUser.employeeId);
    await refreshTeam();
  }, [currentUser, loadEmployeeData, refreshTeam]);

  const markODArrived = useCallback(async (odId, location) => {
    const deviceTime = getDeviceTime();
    await api.patch(`/od/${odId}/arrive`, { lat: location.lat, lng: location.lng, city: location.city, deviceTime, arrivalTime: deviceTime });
    await loadEmployeeData(currentUser.employeeId);
    await refreshTeam();
  }, [currentUser, loadEmployeeData, refreshTeam]);

  const completeOD = useCallback(async (odId) => {
    const deviceTime = getDeviceFullTime();
    await api.patch(`/od/${odId}/complete`, { deviceTime, completedTime: deviceTime });
    await loadEmployeeData(currentUser.employeeId);
    await refreshTeam();
  }, [currentUser, loadEmployeeData, refreshTeam]);

  const completeTask = useCallback(async (taskId, location, report) => {
    const deviceTime = getDeviceTime();
    await api.patch(`/tasks/${taskId}/complete`, {
      lat: location?.lat,
      lng: location?.lng,
      status: report?.status,
      team: report?.team,
      remarks: report?.remarks,
      deviceTime
    });
    await loadEmployeeData(currentUser.employeeId);
  }, [currentUser, loadEmployeeData]);

  const addReimbursement = useCallback(async (request) => {
    const { receipt, ...body } = request;
    const { data } = await api.post("/reimbursements", body);
    if (receipt) {
      try {
        const res = await fetch(receipt);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append("receipt", blob, "receipt.jpg");
        await api.post(`/reimbursements/${data.data.id}/receipt`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } catch (err) {
        console.error("Receipt upload failed:", err);
      }
    }
    await loadEmployeeData(currentUser.employeeId);
  }, [currentUser, loadEmployeeData]);

  const updateProfile = useCallback(async (field, fileOrValue) => {
    if (typeof field === "object") {
      await api.patch(`/employees/${currentUser.employeeId}`, field);
      await refreshTeam();
    } else if (field === "aadhaarFront" || field === "aadhaarBack") {
      const formData = new FormData();
      let fileObj = fileOrValue;
      if (typeof fileOrValue === "string" && fileOrValue.startsWith("data:")) {
        const res = await fetch(fileOrValue);
        fileObj = await res.blob();
      }
      formData.append("file", fileObj, "aadhaar.jpg");
      formData.append("side", field === "aadhaarFront" ? "front" : "back");
      await api.post(`/employees/${currentUser.employeeId}/aadhaar`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await refreshTeam();
    } else if (field === "selfie") {
      const formData = new FormData();
      let fileObj = fileOrValue;
      if (typeof fileOrValue === "string" && fileOrValue.startsWith("data:")) {
        const res = await fetch(fileOrValue);
        fileObj = await res.blob();
      }
      formData.append("selfie", fileObj, "selfie.jpg");
      await api.post(`/employees/${currentUser.employeeId}/selfie`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await refreshTeam();
    } else {
      await api.patch(`/employees/${currentUser.employeeId}`, { [field]: fileOrValue });
      await refreshTeam();
    }
    await loadEmployeeData(currentUser.employeeId);
  }, [currentUser, loadEmployeeData, refreshTeam]);

  // ── Manager actions ───────────────────────────────────────────────────────
  const assignTask = useCallback(async (taskData) => {
    await api.post("/tasks", taskData);
    await refreshTeam();
  }, [refreshTeam]);

  const addEmployee = useCallback(async (empData) => {
    await api.post("/employees", empData);
    await refreshTeam();
  }, [refreshTeam]);

  const updateReimbursement = useCallback(async (empId, reimId, status, rejectReason) => {
    await api.patch(`/reimbursements/${reimId}`, { status, rejectReason });
    await loadTeamData();
  }, [loadTeamData]);

  const resetEmployeePassword = useCallback(async (empId, password) => {
    await api.patch(`/employees/${empId}/reset-password`, { password });
  }, []);

  // ── Leave actions ────────────────────────────────────────────────────────────
  const applyLeave = useCallback(async (leaveData) => {
    await api.post("/leaves", leaveData);
    if (currentUser?.role === "employee") await loadEmployeeData(currentUser.employeeId);
    await refreshTeam();
  }, [currentUser, loadEmployeeData, refreshTeam]);

  const fetchLeaves = useCallback(async () => {
    const res = await api.get("/leaves");
    return res.data;
  }, []);

  const updateLeave = useCallback(async (leaveId, status, rejectReason) => {
    await api.patch(`/leaves/${leaveId}`, { status, rejectReason });
    await loadTeamData();
  }, [loadTeamData]);

  // ── Daily Work Reports actions ───────────────────────────────────────────
  const submitDailyReport = useCallback(async (reportData) => {
    const res = await api.post("/reports", reportData);
    if (currentUser?.role === "employee") {
      await loadEmployeeData(currentUser.employeeId);
    }
    await refreshTeam();
    return res.data;
  }, [currentUser, loadEmployeeData, refreshTeam]);

  const fetchMyDailyReports = useCallback(async () => {
    const res = await api.get("/reports/my");
    return res.data;
  }, []);

  const fetchAllDailyReports = useCallback(async (params = {}) => {
    const res = await api.get("/reports", { params });
    return res.data;
  }, []);

  const fetchCalendarSummary = useCallback(async (month) => {
    const res = await api.get("/reports/calendar-summary", { params: { month } });
    return res.data;
  }, []);

  const getEmployee = useCallback((id) => team.find(e => e.id === id || e.employee_id === id), [team]);

  const value = {
    currentUser, employee, team, tasks, loading, error,
    login, logout, setupPassword,
    getEmployee,
    doCheckIn, doCheckOut,
    declareOD, markODArrived, completeOD,
    completeTask,
    assignTask, addEmployee,
    addReimbursement, updateReimbursement,
    updateProfile,
    refreshEmployee, refreshTeam,
    resetEmployeePassword,
    submitDailyReport, fetchMyDailyReports, fetchAllDailyReports, fetchCalendarSummary,
    applyLeave, fetchLeaves, updateLeave,
  };


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
