// client/js/buyer_dashboard.js
requireRole("buyer");

(async function init(){
  const msg = document.getElementById("dashMsg");
  try{
    const d = await apiFetch("/api/buyer/dashboard", { method:"GET" });
    document.getElementById("orders").textContent = d.total_orders ?? 0;
    document.getElementById("kg").textContent = d.total_kg ?? 0;
    document.getElementById("spent").textContent = d.total_spent ?? 0;
  }catch(e){
    console.error(e);
    if(msg) msg.textContent = e.message || "Failed to load dashboard.";
  }
})();
