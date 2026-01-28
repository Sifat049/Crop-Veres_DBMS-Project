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

    const avatarInput = document.getElementById("avatar");

    try {
      // Use multipart/form-data so we can send an optional profile photo
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("district", district);
      const file = avatarInput && avatarInput.files && avatarInput.files[0];
      if (file) formData.append("avatar", file);

      const resp = await fetch((window.API_BASE || "http://127.0.0.1:4000").replace(/\/+$/, "") + "/api/auth/signup", {
        method: "POST",
        body: formData
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Signup failed (${resp.status})`);
      msg.textContent = data.message || "Signup submitted.";
      // prefill verify
      localStorage.setItem("pending_email", email);
      setTimeout(() => window.location.href = "./verify.html", 800);
    } catch (err) {
      msg.textContent = err.message || "Signup failed";
    }
  });
});
