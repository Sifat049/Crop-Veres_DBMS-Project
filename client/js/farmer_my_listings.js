// client/js/farmer_my_listings.js
requireRole("farmer");

const box = document.getElementById("myList");
const msg = document.getElementById("msg");

async function load(){
  msg.textContent = "";
  box.innerHTML = `<p class="muted">Loading...</p>`;
  const data = await apiFetch("/api/farmer/my-listings", { method:"GET" });
  const items = data.items || [];

  if(!items.length){
    box.innerHTML = `<p class="muted">No listings yet. Create one from "Create Listing".</p>`;
    return;
  }

  box.innerHTML = items.map(r => `
    <div class="listingRow fade">
      <div class="listingLeft">
        <b>${r.crop_name}</b>
        <div class="muted">Qty: <span id="qtyTxt_${r.listing_id}">${r.quantity_kg}</span> kg · Price: ৳<span id="priceTxt_${r.listing_id}">${r.price_per_kg}</span>/kg</div>
        <div class="tiny">${new Date(r.created_at).toLocaleString()} · <span class="pill">${r.status}</span></div>
      </div>

      <div class="listingRight">
        <input class="smallInput" id="qty_${r.listing_id}" type="number" step="0.01" placeholder="Qty" />
        <input class="smallInput" id="price_${r.listing_id}" type="number" step="0.01" placeholder="Price" />
        <button class="ghost" onclick="updateListing(${r.listing_id})">Update</button>
        <button class="danger" onclick="deleteListing(${r.listing_id})">Delete</button>
      </div>
    </div>
  `).join("");
}

window.updateListing = async function(listing_id){
  msg.textContent = "";
  const qty = document.getElementById(`qty_${listing_id}`).value;
  const price = document.getElementById(`price_${listing_id}`).value;

  const body = {};
  if(qty) body.quantity_kg = Number(qty);
  if(price) body.price_per_kg = Number(price);

  if(!Object.keys(body).length){
    msg.textContent = "Enter qty or price to update.";
    return;
  }

  try{
    const r = await apiFetch(`/api/farmer/listings/${listing_id}`, { method:"PUT", body });
    msg.textContent = r.message || "Updated";
    await load();
  }catch(e){
    msg.textContent = e.message || "Update failed";
  }
}

window.deleteListing = async function(listing_id){
  if(!confirm("Delete this listing?")) return;
  msg.textContent = "";
  try{
    const r = await apiFetch(`/api/farmer/listings/${listing_id}`, { method:"DELETE" });
    msg.textContent = r.message || "Deleted";
    await load();
  }catch(e){
    msg.textContent = e.message || "Delete failed";
  }
}

load().catch(e => {
  console.error(e);
  box.innerHTML = `<p class="muted">${e.message || "Failed to load."}</p>`;
});
