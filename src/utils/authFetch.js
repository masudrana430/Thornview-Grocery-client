// src/utils/authFetch.js
const API_BASE =  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function authFetch(user, path, options = {}) {
  if (!user) {
    throw new Error("User not authenticated.");
  }

  const token = await user.getIdToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  // If there is a body and content-type is not explicitly multipart/form-data,
  // default to JSON.
  const isJson =
    options.body &&
    !(options.headers && options.headers["content-type"] === "multipart/form-data");

  if (isJson && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore non-JSON body
  }

  if (!res.ok) {
    throw new Error(
      data?.message || `Request failed with status ${res.status}`
    );
  }

  return data;
}
