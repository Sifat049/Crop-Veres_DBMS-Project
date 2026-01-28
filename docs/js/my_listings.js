async function loadMyListings() {
  const box = document.getElementById("box");
  box.innerHTML = "Loading...";
  try {
    const rows = await apiGet("/api/farmer/my-listings");
    if (!rows.length) {
      box.innerHTML = "<p class='small'>You have no listings yet.</p>";
      return;
    }

    box.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Crop</th><th>Qty (kg)</th><th>Price/kg</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.crop_name}</td>
              <td><input id="qty_${r.listing_id}" type="number" step="0.01" value="${r.quantity_kg}" ${r.status !== "Available" ? "disabled" : ""}></td>
              <td><input id="price_${r.listing_id}" type="number" step="0.01" value="${r.price_per_kg}" ${r.status !== "Available" ? "disabled" : ""}></td>
              <td>${r.status}</td>
              <td>
                <button ${r.status !== "Available" ? "disabled" : ""} onclick="save(${r.listing_id})">Save</button>
                <button class="danger" ${r.status !== "Available" ? "disabled" : ""} onclick="del(${r.listing_id})">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    box.innerHTML = `<p class="small">${e.message}</p>`;
  }
}

async function save(id) {
  const msg = document.getElementById("msg");
  msg.textContent = "";
  const quantity_kg = Number(document.getElementById("qty_" + id).value);
  const price_per_kg = Number(document.getElementById("price_" + id).value);

  try {
    const data = await apiPost(`/api/farmer/listings/${id}?_method=PUT`, { quantity_kg, price_per_kg });
    // Note: if you don't use method override, use fetch PUT (see below)
    msg.textContent = data.message;
    await loadMyListings();
  } catch (e) {
    msg.textContent = e.message;
  }
}

async function del(id) {
  const msg = document.getElementById("msg");
  msg.textContent = "";
  if (!confirm("Delete this listing?")) return;

  try {
    // We'll do fetch DELETE directly (since apiPost is POST)
    const res = await fetch("http://localhost:4000/api/farmer/listings/" + id, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + localStorage.getItem("cv_token") }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    msg.textContent = data.message;
    await loadMyListings();
  } catch (e) {
    msg.textContent = e.message;
  }
}

/**
 * IMPORTANT: save() uses PUT. Let's implement proper PUT fetch instead of apiPost hack.
 * Replace save() body with this if you want cleaner.
 */
async function saveClean(id){
  const msg = document.getElementById("msg");
  msg.textContent = "";
  const quantity_kg = Number(document.getElementById("qty_" + id).value);
  const price_per_kg = Number(document.getElementById("price_" + id).value);

  try{
    const res = await fetch("http://localhost:4000/api/farmer/listings/" + id, {
      method: "PUT",
      headers: {
        "Content-Type":"application/json",
        "Authorization":"Bearer " + localStorage.getItem("cv_token")
      },
      body: JSON.stringify({ quantity_kg, price_per_kg })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    msg.textContent = data.message;
    await loadMyListings();
  }catch(e){
    msg.textContent = e.message;
  }
}

// IMPORTANT: use clean PUT
save = saveClean;

loadMyListings();
