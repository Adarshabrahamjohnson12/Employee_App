import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { fmtTime } from "../hooks/useClock";

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
    setLoading(true);
    try {
      const [empRes, taskRes] = await Promise.all([
        api.get(`/employees/${empId}`),
        api.get("/tasks"),
      ]);
      setEmployee(empRes.data.data);
      setTasks(taskRes.data.data);
    } catch (err) { console.error("Load employee error:", err); }
    finally { setLoading(false); }
  }, []);

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
  const doCheckIn = useCallback(async (location) => {
    await api.post("/checkin", { lat: location.lat, lng: location.lng, accuracy: location.accuracy, city: location.city, isRealGps: location.real });
    await loadEmployeeData(currentUser.employeeId);
  }, [currentUser, loadEmployeeData]);

  const doCheckOut = useCallback(async () => {
    await api.post("/checkin/out");
    setEmployee(prev => prev ? { ...prev, checkedIn: false } : prev);
  }, []);

  const declareOD = useCallback(async (record) => {
    const { data } = await api.post("/od", record);
    setEmployee(prev => prev ? { ...prev, onOD: true, odCity: record.city, odHistory: [{ ...data.data, arrived: false }, ...(prev.odHistory || [])] } : prev);
  }, []);

  const markODArrived = useCallback(async (odId, location) => {
    const { data } = await api.patch(`/od/${odId}/arrive`, { lat: location.lat, lng: location.lng, city: location.city });
    setEmployee(prev => {
      if (!prev) return prev;
      return { ...prev, odHistory: prev.odHistory.map(od => od.id === odId ? { ...od, arrived: true, arrivalLocation: data.arrivalLocation, arrivalTime: data.arrivalTime } : od) };
    });
  }, []);

  const completeTask = useCallback(async (taskId, location, report) => {
    await api.patch(`/tasks/${taskId}/complete`, {
      lat: location?.lat,
      lng: location?.lng,
      status: report?.status,
      team: report?.team,
      remarks: report?.remarks
    });
    const time = fmtTime(new Date());
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done", time, completion_status: report?.status, completion_team: report?.team, completion_remarks: report?.remarks } : t));
    setEmployee(prev => {
      if (!prev) return prev;
      const done = (tasks.filter(t => t.status === "done").length) + 1;
      return { ...prev, tasksToday: { done, total: tasks.length } };
    });
  }, [tasks]);

  const addReimbursement = useCallback(async (request) => {
    const { receipt, ...body } = request;
    const { data } = await api.post("/reimbursements", body);
    let receiptPath = null;
    if (receipt) {
      try {
        const res = await fetch(receipt);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append("receipt", blob, "receipt.jpg");
        const uploadRes = await api.post(`/reimbursements/${data.data.id}/receipt`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        receiptPath = uploadRes.data.url;
      } catch (err) {
        console.error("Receipt upload failed:", err);
      }
    }
    setEmployee(prev => prev ? {
      ...prev,
      reimbursements: [{ ...data.data, receipt_path: receiptPath, approvedBy: null, rejectReason: null }, ...(prev.reimbursements || [])]
    } : prev);
  }, []);

  const updateProfile = useCallback(async (field, value) => {
    if (field === "aadhaarFront" || field === "aadhaarBack") {
      const formData = new FormData();
      // value is base64 — convert to blob
      const res = await fetch(value);
      const blob = await res.blob();
      formData.append("file", blob, "aadhaar.jpg");
      formData.append("side", field === "aadhaarFront" ? "front" : "back");
      await api.post(`/employees/${currentUser.employeeId}/aadhaar`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    } else if (field === "selfie") {
      const res = await fetch(value);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("selfie", blob, "selfie.jpg");
      await api.post(`/employees/${currentUser.employeeId}/selfie`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    } else {
      await api.patch(`/employees/${currentUser.employeeId}`, { [field]: value });
    }
    await loadEmployeeData(currentUser.employeeId);
  }, [currentUser, loadEmployeeData]);

  // ── Manager actions ───────────────────────────────────────────────────────
  const assignTask = useCallback(async (taskData) => {
    await api.post("/tasks", taskData);
    await refreshTeam();
  }, [refreshTeam]);

  const updateReimbursement = useCallback(async (empId, reimId, status, rejectReason) => {
    await api.patch(`/reimbursements/${reimId}`, { status, rejectReason });
    setTeam(prev => prev.map(emp => {
      if (emp.employee_id !== empId && emp.employeeId !== empId) return emp;
      return { ...emp, reimbursements: (emp.reimbursements || []).map(r => r.id === reimId ? { ...r, status, approvedBy: "Mgr. Sharma", rejectReason: rejectReason || null } : r) };
    }));
  }, []);

  const getEmployee = useCallback((id) => team.find(e => e.id === id || e.employee_id === id), [team]);

  const value = {
    currentUser, employee, team, tasks, loading, error,
    login, logout,
    getEmployee,
    doCheckIn, doCheckOut,
    declareOD, markODArrived,
    completeTask,
    assignTask,
    addReimbursement, updateReimbursement,
    updateProfile,
    refreshEmployee, refreshTeam,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
