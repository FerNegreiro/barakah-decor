export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function normalizeApiUrl(url) {
  return url?.replace?.("http://127.0.0.1:8000", API_URL) || url;
}

export function resolveImageUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}
