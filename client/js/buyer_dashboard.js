// client/js/buyer_dashboard.js
requireRole("buyer");

function defaultAvatarDataUrl(name) {
  const initials = (name || "U").trim().split(/\s+/).slice(0,2).map(s => s[0]?.toUpperCase() || "").join("") || "U";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7c5cff"/>
        <stop offset="100%" stop-color="#19c37d"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#g)"/>
    <text x="64" y="74" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="44" fill="white" font-weight="700">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function renderProfile() {
  const user = window.getUser?.() || null;
  const img = document.getElementById("profileImg");
  const nameEl = document.getElementById("profileName");
  const meta = document.getElementById("profileMeta");
  if (!img || !nameEl) return;

  const name = user?.name || "Buyer Dashboard";
  nameEl.textContent = name;
  if (meta) meta.textContent = user?.district ? `District: ${user.district}` : "Track your purchases and spending.";

  if (user?.profile_image) {
    const base = (window.API_BASE || "").replace(/\/+$/, "");
    img.src = user.profile_image.startsWith("http") ? user.profile_image : base + user.profile_image;
  } else {
    img.src = defaultAvatarDataUrl(name);
  }
}

(async function init(){
  const msg = document.getElementById("dashMsg");
  try{
    renderProfile();
    const d = await apiFetch("/api/buyer/dashboard", { method:"GET" });
    document.getElementById("orders").textContent = d.total_orders ?? 0;
    document.getElementById("kg").textContent = d.total_kg ?? 0;
    document.getElementById("spent").textContent = d.total_spent ?? 0;
  }catch(e){
    console.error(e);
    if(msg) msg.textContent = e.message || "Failed to load dashboard.";
  }
})();
