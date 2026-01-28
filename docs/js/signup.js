// client/js/signup.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const role = document.getElementById("role").value;
    const district = document.getElementById("district").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) {
      msg.textContent = "Passwords do not match";
      return;
    }

    try {
      const data = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: { name, email, password, role, district }
      });
      msg.textContent = data.message || "Signup submitted.";
      // prefill verify
      localStorage.setItem("pending_email", email);
      setTimeout(() => window.location.href = "./verify.html", 800);
    } catch (err) {
      msg.textContent = err.message || "Signup failed";
    }
  });
});
