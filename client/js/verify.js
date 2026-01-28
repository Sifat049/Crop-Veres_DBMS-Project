// client/js/verify.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("verifyForm");
  if (!form) return;

  const emailEl = document.getElementById("email");
  const codeEl = document.getElementById("code");
  const msg = document.getElementById("msg");

  const saved = localStorage.getItem("pending_email");
  if (saved && emailEl) emailEl.value = saved;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const email = emailEl.value.trim();
    const code = codeEl.value.trim();

    try {
      const data = await apiFetch("/api/auth/verify", {
        method: "POST",
        body: { email, code }
      });
      msg.textContent = data.message || "Verified.";
      setTimeout(() => window.location.href = "./login.html", 800);
    } catch (err) {
      msg.textContent = err.message || "Verify failed";
    }
  });
});
