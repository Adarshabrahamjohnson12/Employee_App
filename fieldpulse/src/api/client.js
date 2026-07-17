import axios from "axios";

const BASE_URL = "http://localhost:3001/api";

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
