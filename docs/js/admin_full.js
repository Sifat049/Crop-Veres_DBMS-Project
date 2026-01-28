async function loadPending() {
  const box = document.getElementById("pendingBox");
  box.innerHTML = "Loading...";
  try {
    const rows = await apiGet("/api/admin/pending-users");
    if (!rows.length) {
      box.innerHTML = "<p class='small'>No pending requests.</p>";
      return;
    }

    box.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>District</th>
            <th>Verified?</th><th>Created</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.name}</td>
              <td>${r.email}</td>
              <td>${r.role}</td>
              <td>${r.district || "-"}</td>
              <td>${r.is_verified ? "Yes" : "No"}</td>
              <td>${new Date(r.created_at).toLocaleString()}</td>
              <td>
                <button onclick="approve('${r.email}')">Approve</button>
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

async function approve(email) {
  const msg = document.getElementById("msg");
  msg.textContent = "";
  try {
    const data = await apiPost("/api/admin/approve", { email });
    msg.textContent = `${data.message} -> ${email}`;
    await loadPending();
    await loadAllUsers();
  } catch (e) {
    msg.textContent = e.message;
  }
}

async function loadAllUsers() {
  const box = document.getElementById("allUsersBox");
  box.innerHTML = "Loading...";
  try {
    const rows = await apiGet("/api/admin/users");
    if (!rows.length) {
      box.innerHTML = "<p class='small'>No users found.</p>";
      return;
    }

    box.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>District</th>
            <th>Verified</th><th>Approved</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.name}</td>
              <td>${r.email}</td>
              <td>${r.role}</td>
              <td>${r.district || "-"}</td>
              <td>${r.is_verified ? "Yes" : "No"}</td>
              <td>${r.is_approved ? "Yes" : "No"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    box.innerHTML = `<p class="small">${e.message}</p>`;
  }
}

loadPending();
loadAllUsers();
