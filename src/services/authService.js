const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

function saveAuth(data) {
  try {
    if (data.token) localStorage.setItem("token", data.token);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    if (data.role) localStorage.setItem("role", data.role);
  } catch (e) {
    // ignore storage errors
  }
}
function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}
export function updateStoredUser(patch) {
  const current = getUser() || {};
  const updated = { ...current, ...patch };
  try {
    localStorage.setItem("user", JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  // notify any mounted components (e.g. Header) to re-read localStorage
  window.dispatchEvent(new CustomEvent("user-updated"));
  return updated;
}

export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.message || "Invalid email or password. Please try again.",
    );
  }

  const data = await response.json().catch(() => null);
  if (!data) throw new Error("Invalid server response");

  saveAuth(data);
  return data;
}

export async function logout() {
  try {
    await authFetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
    });
  } catch (e) {
    // even if call fails, still clear local storage
  }
  clearAuth();
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    return null;
  }
}

export function getRole() {
  return localStorage.getItem("role") || getUser()?.role || null;
}

export function isAuthenticated() {
  return !!getToken();
}

export async function authFetch(input, init = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Don't force Content-Type for FormData — browser sets multipart boundary
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    let message = "Your session has expired. Please sign in again.";

    try {
      const data = await response.clone().json();
      if (data?.message?.toLowerCase().includes("deactivated")) {
        message =
          "Your account has been deactivated. Contact your administrator.";
      }
    } catch {}

    clearAuth();
    sessionStorage.setItem("loginNotice", message);
    window.location.href = "/";
    return;
  }

  return response;
}
