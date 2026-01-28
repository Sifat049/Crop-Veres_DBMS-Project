// client/js/farmer_dashboard.js
requireRole("farmer");

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

  const name = user?.name || "Farmer Dashboard";
  nameEl.textContent = name;
  if (meta) meta.textContent = user?.district ? `District: ${user.district}` : "Track your listings, sales, and alerts.";

  if (user?.profile_image) {
    const base = (window.API_BASE || "").replace(/\/+$/, "");
    img.src = user.profile_image.startsWith("http") ? user.profile_image : base + user.profile_image;
  } else {
    img.src = defaultAvatarDataUrl(name);
  }
}

(async function init(){
  const msg = document.getElementById("dashMsg");
  const alertsBox = document.getElementById("alertsBox");
  try{
    renderProfile();
    const s = await apiFetch("/api/farmer/summary", { method:"GET" });
    document.getElementById("totalListings").textContent = s.total_listings ?? 0;
    document.getElementById("activeListings").textContent = s.active_listings ?? 0;
    document.getElementById("earnings").textContent = s.earnings ?? 0;

    const a = await apiFetch("/api/farmer/alerts", { method:"GET" });
    const items = a.items || [];
    if(!items.length){
      alertsBox.innerHTML = `<p class="muted">No alerts yet.</p>`;
    }else{
      alertsBox.innerHTML = items.slice(0,8).map(x => `
        <div class="alertItem">
          <b>${x.alert_type}</b>
          <div class="muted">${x.message}</div>
          <div class="tiny">${new Date(x.created_at).toLocaleString()}</div>
        </div>
      `).join("");
    }
  }catch(e){
    console.error(e);
    if(msg) msg.textContent = e.message || "Failed to load dashboard.";
    if(alertsBox) alertsBox.innerHTML = `<p class="muted">Failed to load alerts.</p>`;
  }
})();
