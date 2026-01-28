// client/js/auth.js
// Login for Admin/Farmer/Buyer
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const roleEl = document.getElementById("role");
  const roleEL = roleEl; // alias to avoid ReferenceError due to casing
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const email = (emailEl.value || "").trim();
    const password = passEl.value || "";
    const role = (roleEl.value || "").toLowerCase();

    try {
      const data = await window.apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password, role }
      });

      setSession(data.token, data.user);

      if (role === "admin") window.location.href = "./admin/dashboard.html";
      else if (role === "farmer") window.location.href = "./farmer/dashboard.html";
      else window.location.href = "./buyer/dashboard.html";
    } catch (err) {
      msg.textContent = err.message || "Login failed";
    }
  });
});