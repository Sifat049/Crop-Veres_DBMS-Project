// client/js/profile.js
// Profile edit for buyer/farmer

const session = getSession?.();
const role = session?.user?.role;

if (role === "buyer") requireRole("buyer");
else if (role === "farmer") requireRole("farmer");
else requireRole(role || "buyer");

const form = document.getElementById("profileForm");
const msg = document.getElementById("profileMsg");
const img = document.getElementById("profileImg");
const fileInput = document.getElementById("avatar");

function setPreview(url){
  if (!img) return;
  img.src = url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='100%25' height='100%25' rx='18' ry='18' fill='%23333'/%3E%3Ctext x='50%25' y='58%25' font-size='44' text-anchor='middle' fill='%23fff'%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E";
}

async function loadProfile(){
  msg.textContent = "";
  try {
    const data = await apiFetch("/api/profile", { method: "GET" });
    const u = data.user;

    document.getElementById("name").value = u.name || "";
    document.getElementById("email").value = u.email || "";
    document.getElementById("phone").value = u.phone || "";
    document.getElementById("district").value = u.district || "";

    setPreview(u.profile_image ? `http://127.0.0.1:4000${u.profile_image}` : null);
  } catch (e){
    msg.textContent = e.message || "Failed to load profile";
  }
}

fileInput?.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  setPreview(url);
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const district = document.getElementById("district").value.trim();

  try {
    let data;
    if (fileInput?.files?.[0]) {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("district", district);
      fd.append("avatar", fileInput.files[0]);
      data = await apiFetchFormProfile("/api/profile", fd);
    } else {
      data = await apiFetch("/api/profile", { method: "PUT", body: { name, email, phone, district } });
    }

    // update session token/user
    setSession({ token: data.token, user: data.user });
    msg.textContent = data.message || "Updated";
  } catch (err){
    msg.textContent = err.message || "Update failed";
  }
});

async function apiFetchFormProfile(path, formData){
  const s = getSession?.();
  const token = s?.token;
  const res = await fetch(`http://127.0.0.1:4000${path}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

loadProfile();
