// client/js/buyer_chats.js
requireRole("buyer");

const threadsBox = document.getElementById("threadsBox");
const threadsMsg = document.getElementById("threadsMsg");

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadThreads(){
  threadsMsg.textContent = "";
  threadsBox.innerHTML = `<p class="muted">Loading...</p>`;

  try {
    const data = await apiFetch("/api/chat/threads", { method: "GET" });
    const items = data.items || [];

    if (!items.length){
      threadsBox.innerHTML = `<p class="muted">No chats yet. Start a chat from Marketplace.</p>`;
      return;
    }

    threadsBox.innerHTML = items.map(t => {
      const name = escapeHtml(t.other_name);
      const dist = escapeHtml(t.other_district || "-");
      const last = escapeHtml(t.last_message || "(No messages yet)");
      const when = t.last_message_at ? new Date(t.last_message_at).toLocaleString() : new Date(t.thread_created_at).toLocaleString();

      return `
        <div class="card fade" style="padding:12px; cursor:pointer" onclick="window.__openChatThread(${t.thread_id}, '${name}')">
          <div class="row space">
            <div>
              <b>👨‍🌾 ${name}</b>
              <div class="muted">${dist}</div>
            </div>
            <span class="pill">${when}</span>
          </div>
          <div class="muted" style="margin-top:6px;">${last}</div>
        </div>
      `;
    }).join("");
  } catch (e){
    console.error(e);
    threadsBox.innerHTML = `<p class="muted">Failed to load chats.</p>`;
    threadsMsg.textContent = e.message || "";
  }
}

loadThreads();
