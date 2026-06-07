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
  headers.set("Content-Type", "application/json");

  const response = await fetch(input, { ...init, headers });

  // token expired → force re-login
  if (response.status === 401) {
    clearAuth();
    window.location.href = "/login";
    return;
  }

  return response;
}
