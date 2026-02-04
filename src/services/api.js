// src/services/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TOKEN_KEY = "accessToken";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `Refresh failed (${res.status})`);
  }

  const newToken = json?.data?.accessToken;
  if (newToken) setToken(newToken);
  return newToken;
}

async function request(path, options = {}, _retry = false) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      // only set content-type for JSON bodies
      ...(options.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));

  // ✅ Auto-refresh once on 401, then retry original request
  if (res.status === 401 && !_retry) {
    try {
      await refreshAccessToken();
      return request(path, options, true);
    } catch (e) {
      // refresh failed => fallthrough to error below
    }
  }

  if (!res.ok) {
    throw new Error(json?.error?.message || `Request failed (${res.status})`);
  }

  return json;
}

export const apiGet = (path, opts) => request(path, { method: "GET", ...(opts || {}) });

export const apiPost = (path, body, opts) =>
  request(path, {
    method: "POST",
    body: JSON.stringify(body || {}),
    ...(opts || {}),
  });

export const apiPatch = (path, body, opts) =>
  request(path, {
    method: "PATCH",
    body: JSON.stringify(body || {}),
    ...(opts || {}),
  });

export const apiDelete = (path, opts) => request(path, { method: "DELETE", ...(opts || {}) });
