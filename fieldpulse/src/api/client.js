import axios from "axios";

export const DEPLOYED_BACKEND_URL = "https://employee-app-8lp0.onrender.com";

// Always use deployed URL — works on both web (Render) and mobile (Capacitor)
const BASE_URL = `${DEPLOYED_BACKEND_URL}/api`;

const api = axios.create({ baseURL: BASE_URL });

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  return `${DEPLOYED_BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

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

export { api };
export default api;
