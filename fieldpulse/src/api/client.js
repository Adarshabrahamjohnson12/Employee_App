import axios from "axios";

// FOR MOBILE APP: Update this to your actual deployed Render backend URL
const DEPLOYED_BACKEND_URL = "https://employee-app.onrender.com";

const isNativeMobile = typeof window !== "undefined" && (
  window.location.protocol === "file:" ||
  window.location.origin.includes("capacitor://") ||
  (window.location.origin.startsWith("http://localhost") && !window.location.port)
);

const BASE_URL = isNativeMobile ? `${DEPLOYED_BACKEND_URL}/api` : "/api";

const api = axios.create({ baseURL: BASE_URL });

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — clear token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fp_token");
      localStorage.removeItem("fp_user");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
