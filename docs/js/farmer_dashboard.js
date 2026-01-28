// client/js/farmer_dashboard.js
requireRole("farmer");

(async function init(){
  const msg = document.getElementById("dashMsg");
  const alertsBox = document.getElementById("alertsBox");
  try{
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
