const rawApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://quickshow-backend-plum.vercel.app/api"
    : "http://localhost:8000/api");

const cleanedUrl = rawApiUrl.replace(/\/+$/, "");

export const API_BASE_URL = cleanedUrl.endsWith("/api")
  ? cleanedUrl
  : `${cleanedUrl}/api`;

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL);

export default API_BASE_URL;
