// client/js/api.js
// Global API helpers (no ES modules)

window.API_BASE = localStorage.getItem("API_BASE") || "http://127.0.0.1:4000";

window.getToken = function () {
  return localStorage.getItem("token");
};

window.getUser = function () {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
};

window.setSession = function (token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

window.clearSession = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

window.logout = function () {
  window.clearSession();
  window.location.href = "../login.html";
};

// Theme (dark mode)
window.applyTheme = function () {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
};
window.toggleTheme = function () {
  const cur = localStorage.getItem("theme") || "dark";
  localStorage.setItem("theme", cur === "dark" ? "light" : "dark");
  window.applyTheme();
};

document.addEventListener("DOMContentLoaded", () => {
  window.applyTheme();
  const tbtn = document.getElementById("themeToggle");
  if (tbtn) tbtn.onclick = () => window.toggleTheme();
});

function buildUrl(path) {
  if (path.startsWith("http")) return path;
  return window.API_BASE.replace(/\/+$/, "") + path;
}

async function readAsText(resp) {
  try { return await resp.text(); } catch { return ""; }
}

// apiFetch(path, {method, body, auth})
window.apiFetch = async function (path, options = {}) {
  const url = buildUrl(path);
  const method = (options.method || "GET").toUpperCase();

  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  const token = window.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fetchOptions = { method, headers };
  if (options.body !== undefined) fetchOptions.body = JSON.stringify(options.body);

  const resp = await fetch(url, fetchOptions);
  const contentType = resp.headers.get("content-type") || "";

  if (!resp.ok) {
    const bodyText = await readAsText(resp);
    // try JSON error
    if (contentType.includes("application/json")) {
      try {
        const j = JSON.parse(bodyText);
        throw new Error(j.error || `Request failed (${resp.status})`);
      } catch {
        throw new Error(`Request failed (${resp.status})`);
      }
    }
    // HTML or plain
    throw new Error(`API returned non-JSON (likely HTML). Status=${resp.status}. Body starts: ${bodyText.slice(0, 80)}`);
  }

  if (contentType.includes("application/json")) return resp.json();
  // allow empty 204 etc.
  const t = await readAsText(resp);
  return t ? t : {};
};

// Guard pages that require auth
window.requireRole = function (...roles) {
  const user = window.getUser();
  if (!user || !roles.includes(user.role)) {
    window.location.href = "../login.html";
    return false;
  }
  return true;
};

// Alias for convenience (some scripts call apiFetch directly)
var apiFetch = window.apiFetch;
