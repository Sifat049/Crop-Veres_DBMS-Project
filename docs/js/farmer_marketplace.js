// client/js/farmer_marketplace.js
requireRole("farmer");

const cropSelect = document.getElementById("cropSelect");
const qtyEl = document.getElementById("qty");
const priceEl = document.getElementById("price");
const msg = document.getElementById("msg");
const marketList = document.getElementById("marketList");

async function loadCrops(){
  const data = await apiFetch("/api/crops", { method:"GET" });
  const items = data.items || [];
  cropSelect.innerHTML = `<option value="">Select a crop</option>` + items
    .map(c => `<option value="${c.crop_id}">${c.crop_name}</option>`).join("");
  cropSelect.disabled = false;
}

async function createListing(){
  msg.textContent = "";
  const crop_id = Number(cropSelect.value);
  const quantity_kg = Number(qtyEl.value);
  const price_per_kg = Number(priceEl.value);

  if(!crop_id || !quantity_kg || !price_per_kg){
    msg.textContent = "Please select crop, quantity and price.";
    return;
  }

  try{
    const data = await apiFetch("/api/farmer/listings", {
      method:"POST",
      body: { crop_id, quantity_kg, price_per_kg }
    });
    msg.textContent = data.message || "Listing created.";
    qtyEl.value = "";
    priceEl.value = "";
    await loadMarketplace();
  }catch(e){
    msg.textContent = e.message || "Failed to create listing.";
  }
}

async function loadMarketplace(){
  marketList.innerHTML = `<p class="muted">Loading...</p>`;
  const data = await apiFetch("/api/listings", { method:"GET" });
  const items = data.items || [];

  if(!items.length){
    marketList.innerHTML = `<p class="muted">No listings available right now.</p>`;
    return;
  }

  marketList.innerHTML = items.slice(0,12).map(r => `
    <div class="card listing fade">
      <div class="row space">
        <div>
          <h3>${r.crop_name}</h3>
          <div class="muted">by <b>${r.farmer_name}</b> · ${r.district || "-"}</div>
        </div>
        <span class="pill">৳${r.price_per_kg}/kg</span>
      </div>
      <div class="meta">
        <span class="pill">Qty: ${r.quantity_kg} kg</span>
        <span class="pill">${new Date(r.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join("");
}

document.getElementById("btnCreate").onclick = createListing;

(async function init(){
  try{
    await loadCrops();
    await loadMarketplace();
  }catch(e){
    console.error(e);
    msg.textContent = e.message || "Failed to load page.";
  }
})();
