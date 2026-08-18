const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && path !== "/auth/login" && path !== "/auth/register") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
