// client/js/admin.js
requireRole("admin");

const pendingBox = document.getElementById("pendingBox");
const pendingMsg = document.getElementById("pendingMsg");
const usersBox = document.getElementById("usersBox");
const usersMsg = document.getElementById("usersMsg");

document.getElementById("btnRefresh").onclick = () => loadPending();
document.getElementById("btnLoadAll").onclick = () => loadAllUsers();

function fmtDate(d){
  try { return new Date(d).toLocaleString(); } catch { return ""; }
}

async function loadPending() {
  pendingMsg.textContent = "";
  pendingBox.innerHTML = `<p class="muted">Loading...</p>`;
  try {
    const data = await apiFetch("/api/admin/pending", { method:"GET" });
    const items = data.items || [];
    if(!items.length){
      pendingBox.innerHTML = `<p class="muted">No pending users.</p>`;
      return;
    }
    pendingBox.innerHTML = items.map(u => `
      <div class="userRow fade">
        <div>
          <b>${u.name}</b> <span class="pill">${u.role}</span>
          <div class="muted">${u.email} · ${u.district || "-"}</div>
          <div class="tiny">Verified: ${u.is_verified ? "Yes" : "No"} · Created: ${fmtDate(u.created_at)}</div>
        </div>
        <div class="actions">
          <button onclick="approve('${u.email}')">Approve</button>
        </div>
      </div>
    `).join("");
  } catch (e) {
    pendingBox.innerHTML = "";
    pendingMsg.textContent = e.message || "Failed to load pending users.";
  }
}

window.approve = async function(email){
  pendingMsg.textContent = "";
  try{
    const r = await apiFetch("/api/admin/approve", { method:"POST", body:{ email }});
    pendingMsg.textContent = r.message || "Approved.";
    await loadPending();
  }catch(e){
    pendingMsg.textContent = e.message || "Approve failed.";
  }
}

async function loadAllUsers(){
  usersMsg.textContent = "";
  usersBox.innerHTML = `<p class="muted">Loading...</p>`;
  try{
    const data = await apiFetch("/api/admin/users", { method:"GET" });
    const items = data.items || [];
    if(!items.length){
      usersBox.innerHTML = `<p class="muted">No users found.</p>`;
      return;
    }
    usersBox.innerHTML = items.slice(0,30).map(u => `
      <div class="userRow fade">
        <div>
          <b>${u.name}</b> <span class="pill">${u.role}</span>
          <div class="muted">${u.email} · ${u.district || "-"}</div>
          <div class="tiny">Verified: ${u.is_verified ? "Yes" : "No"} · Approved: ${u.is_approved ? "Yes" : "No"}</div>
        </div>
      </div>
    `).join("");
  }catch(e){
    usersBox.innerHTML = "";
    usersMsg.textContent = e.message || "Failed to load users.";
  }
}

loadPending();
