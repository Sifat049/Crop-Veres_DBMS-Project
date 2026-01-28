// client/js/disease_report.js
requireRole("farmer");

const cropSelect = document.getElementById("cropSelect");
const severityInput = document.getElementById("severity");
const notesInput = document.getElementById("notes");
const msg = document.getElementById("msg");

async function loadCrops() {
  const data = await apiFetch("/api/crops", { method:"GET" });
  const items = data.items || [];
  cropSelect.innerHTML = `<option value="">Select crop</option>` + items
    .map(c => `<option value="${c.crop_id}">${c.crop_name}</option>`).join("");
  cropSelect.disabled = false;
}

async function submitDisease() {
  msg.textContent = "";
  const crop_id = Number(cropSelect.value);
  const severity = Number(severityInput.value);
  const notes = notesInput.value;

  if (!crop_id) { msg.textContent = "Select a crop"; return; }
  if (!(severity >= 1 && severity <= 10)) { msg.textContent = "Severity must be 1-10"; return; }

  try {
    const r = await apiFetch("/api/farmer/disease-report", {
      method: "POST",
      body: { crop_id, severity, notes }
    });
    msg.textContent = r.message || "Report submitted.";
    notesInput.value = "";
  } catch (e) {
    msg.textContent = e.message || "Submit failed";
  }
}

document.getElementById("btnReport").onclick = submitDisease;

loadCrops().catch(e => {
  console.error(e);
  msg.textContent = e.message || "Failed to load crops.";
});
