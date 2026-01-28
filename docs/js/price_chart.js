// client/js/price_chart.js
// Shared by Farmer & Buyer price chart pages (Chart.js required)

let chart = null;

async function renderChart(cropId) {
  const out = document.getElementById("chartMsg");
  if (out) out.textContent = "";

  const data = await apiFetch(`/api/price-trends?crop_id=${encodeURIComponent(cropId)}`, { method: "GET" });
  const items = data.items || [];

  if (!items.length) {
    if (out) out.textContent = "No price trend data yet. Make some purchases to generate trends.";
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  const labels = items.map(d => `${String(d.month).padStart(2,"0")}/${d.year}`);
  const values = items.map(d => Number(d.avg_price));

  const ctx = document.getElementById("priceChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Avg Price (৳/kg)",
        data: values,
        tension: 0.35,
        fill: true,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 900 },
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const sel = document.getElementById("cropSelect");
  const out = document.getElementById("chartMsg");
  if (!sel) return;

  try {
    const data = await apiFetch("/api/crops", { method: "GET" });
    const items = data.items || [];

    sel.innerHTML = `<option value="">Select a crop</option>` + items
      .map(c => `<option value="${c.crop_id}">${c.crop_name}</option>`).join("");

    sel.disabled = false;

    sel.addEventListener("change", async () => {
      const cropId = sel.value;
      if (!cropId) {
        if (out) out.textContent = "Select a crop to view trend.";
        if (chart) { chart.destroy(); chart = null; }
        return;
      }
      await renderChart(cropId);
    });

    if (out) out.textContent = "Select a crop to view trend.";
  } catch (e) {
    console.error(e);
    if (out) out.textContent = "Failed to load crops. Check API_BASE and backend.";
  }
});
