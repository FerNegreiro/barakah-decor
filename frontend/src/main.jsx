import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import App from "./App";
import "./index.css";
import { clearAuthSession, getAuthToken } from "./utils/auth";
import { normalizeApiUrl } from "./utils/api";

axios.interceptors.request.use((config) => {
  config.url = normalizeApiUrl(config.url);
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      clearAuthSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
