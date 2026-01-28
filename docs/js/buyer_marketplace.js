// client/js/buyer_marketplace.js
requireRole("buyer");

const listBox = document.getElementById("marketList");
const qCrop = document.getElementById("qCrop");
const qFarmer = document.getElementById("qFarmer");
const qDistrict = document.getElementById("qDistrict");

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function apiGet(url) {
  return apiFetch(url, { method: "GET" });
}
async function apiPost(url, body) {
  return apiFetch(url, { method: "POST", body });
}

document.getElementById("btnSearch").onclick = () => loadListings();
document.getElementById("btnClear").onclick = () => {
  qCrop.value = "";
  qFarmer.value = "";
  qDistrict.value = "";
  loadListings();
};

// Modal
const modal = document.getElementById("farmerModal");
const fmClose = document.getElementById("fmClose");
fmClose.onclick = () => modal.classList.add("hidden");
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

async function openFarmer(farmer_id, farmer_name, district) {
  modal.classList.remove("hidden");
  document.getElementById("fmTitle").textContent = `👨‍🌾 ${farmer_name} (${district || "-"})`;
  const body = document.getElementById("fmBody");
  body.innerHTML = "Loading...";

  try {
    const data = await apiGet(`/api/farmers/${farmer_id}/listings`);
    const items = data.items || [];

    if (!items.length) {
      body.innerHTML = `<p class="muted">No active listings from this farmer.</p>`;
      return;
    }

    body.innerHTML = `
      <div class="miniList">
        ${items.map(i => `
          <div class="miniRow">
            <div>
              <b>${i.crop_name}</b>
              <div class="muted">Qty: ${i.quantity_kg} kg · Price: ৳${i.price_per_kg}/kg</div>
            </div>
            <span class="pill">Available</span>
          </div>
        `).join("")}
      </div>
    `;
  } catch (e) {
    body.innerHTML = `<p class="muted">Failed to load farmer listings.</p>`;
  }
}
window.__openFarmer = openFarmer;

async function loadListings() {
  listBox.innerHTML = `<p class="muted">Loading...</p>`;

  const data = await apiGet("/api/listings");
  const items = data.items || [];

  const cropKey = (qCrop.value || "").trim().toLowerCase();
  const farmerKey = (qFarmer.value || "").trim().toLowerCase();
  const distKey = (qDistrict.value || "").trim().toLowerCase();

  const filtered = items.filter(r => {
    const crop = (r.crop_name || "").toLowerCase();
    const farmer = (r.farmer_name || "").toLowerCase();
    const dist = (r.district || "").toLowerCase();

    if (cropKey && !crop.includes(cropKey)) return false;
    if (farmerKey && !farmer.includes(farmerKey)) return false;
    if (distKey && !dist.includes(distKey)) return false;
    return true;
  });

  if (!filtered.length) {
    listBox.innerHTML = `<p class="muted">No listings found.</p>`;
    return;
  }

  listBox.innerHTML = filtered.map(r => `
    <div class="card listing fade">
      <div class="row space">
        <div>
          <h3>${r.crop_name}</h3>
          <div class="muted">by <b>${r.farmer_name}</b> · ${r.district || "-"}</div>
        </div>
        <div class="row" style="gap:8px;">
          <button class="ghost"
            onclick="window.__openFarmer(${r.farmer_id}, '${escapeHtml(r.farmer_name)}', '${escapeHtml(r.district || '')}')">
            Farmer
          </button>
          <button
            onclick="window.__openChatWithFarmer(${r.farmer_id}, '${escapeHtml(r.farmer_name)}')">
            Chat
          </button>
        </div>
      </div>

      <div class="meta">
        <span class="pill">Qty: ${r.quantity_kg} kg</span>
        <span class="pill">৳${r.price_per_kg}/kg</span>
      </div>

      <div class="buyRow">
        <input id="qty_${r.listing_id}" type="number" min="1" placeholder="Buy qty (kg)" />
        <button onclick="buyNow(${r.listing_id})">Buy</button>
      </div>
    </div>
  `).join("");
}

async function buyNow(listing_id) {
  const inp = document.getElementById(`qty_${listing_id}`);
  const qty = Number(inp.value);
  if (!qty || qty <= 0) return alert("Enter quantity");

  try {
    const res = await apiPost("/api/buyer/purchase", { listing_id, quantity_kg: qty });
    alert(res.message + ` (Total: ৳${res.total_price})`);
    await loadListings();
  } catch (e) {
    alert(e.message || "Purchase failed");
  }
}

loadListings().catch(e => {
  console.error(e);
  listBox.innerHTML = `<p class="muted">${e.message || "Failed to load listings."}</p>`;
});
