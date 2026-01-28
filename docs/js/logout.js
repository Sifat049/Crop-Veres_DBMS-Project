// client/js/logout.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login.html"; // farmer/ folder থেকে বের হয়ে login
  });
});
