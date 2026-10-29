// Centralized Environment & API Base Configuration
// In development, defaults to local FastAPI server on port 8000
// In production (Vercel), overridden by VITE_API_BASE_URL environment variable

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : "http://localhost:8000");

export default API_BASE_URL;
