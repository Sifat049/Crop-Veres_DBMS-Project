// client/js/chat.js
// Quick Chat (polling) modal for Buyer <-> Farmer

let __chatThreadId = null;
let __chatAfterId = 0;
let __chatPollTimer = null;
let __chatOtherLabel = "";

const __EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😭",
  "👍","🙏","🔥","🎉","✅","❤️","💬","📸",
  "🌾","🍅","🥔","🧅","🥕","🥬","🍆","🌽"
];

function __escapeHtml(s){
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function __getMeId(){
  try {
    const s = getSession?.();
    return s?.user?.user_id || null;
  } catch {
    return null;
  }
}

function __openChatModal(title){
  const m = document.getElementById("chatModal");
  if (!m) {
    console.warn("chatModal not found in HTML");
    return;
  }
  document.getElementById("chatTitle").textContent = title || "💬 Chat";
  m.classList.remove("hidden");
}

function __closeChatModal(){
  const m = document.getElementById("chatModal");
  if (m) m.classList.add("hidden");
  __chatThreadId = null;
  __chatAfterId = 0;
  __chatOtherLabel = "";
  const box = document.getElementById("chatBox");
  if (box) box.innerHTML = "";
  const input = document.getElementById("chatInput");
  if (input) input.value = "";
  if (__chatPollTimer){
    clearInterval(__chatPollTimer);
    __chatPollTimer = null;
  }
}

async function __ensureChatHandlers(){
  const closeBtn = document.getElementById("chatClose");
  const sendBtn = document.getElementById("chatSend");
  const input = document.getElementById("chatInput");
  const emojiBtn = document.getElementById("chatEmoji");
  const emojiPanel = document.getElementById("emojiPanel");
  const imgBtn = document.getElementById("chatImageBtn");
  const imgInput = document.getElementById("chatImage");
  const modal = document.getElementById("chatModal");

  if (closeBtn && !closeBtn.__bound){
    closeBtn.__bound = true;
    closeBtn.onclick = __closeChatModal;
  }
  if (modal && !modal.__bound){
    modal.__bound = true;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) __closeChatModal();
    });
  }
  if (sendBtn && !sendBtn.__bound){
    sendBtn.__bound = true;
    sendBtn.onclick = () => __sendChatMessage();
  }
  if (input && !input.__bound){
    input.__bound = true;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") __sendChatMessage();
    });
  }

  // Emoji picker
  if (emojiBtn && emojiPanel && !emojiBtn.__bound){
    emojiBtn.__bound = true;
    emojiBtn.onclick = () => {
      emojiPanel.classList.toggle("hidden");
      emojiPanel.innerHTML = __EMOJIS.map(e => `<button class="emojiBtn" type="button">${e}</button>`).join("");
    };
    emojiPanel.addEventListener("click", (e) => {
      const b = e.target.closest("button.emojiBtn");
      if (!b) return;
      if (input) {
        input.value += b.textContent;
        input.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (emojiPanel.classList.contains("hidden")) return;
      if (e.target === emojiBtn || emojiPanel.contains(e.target)) return;
      emojiPanel.classList.add("hidden");
    });
  }

  // Image send
  if (imgBtn && imgInput && !imgBtn.__bound){
    imgBtn.__bound = true;
    imgBtn.onclick = () => imgInput.click();
    imgInput.addEventListener("change", async () => {
      if (!imgInput.files?.[0] || !__chatThreadId) return;
      const hint = document.getElementById("chatHint");
      if (hint) hint.textContent = "";

      const fd = new FormData();
      fd.append("thread_id", String(__chatThreadId));
      fd.append("image", imgInput.files[0]);

      try {
        await apiFetchForm("/api/chat/send-image", fd);
        imgInput.value = "";
        await __pollChat();
      } catch (err) {
        if (hint) hint.textContent = err.message || "Failed to send image";
      }
    });
  }
}

function __renderMessages(items){
  const box = document.getElementById("chatBox");
  if (!box) return;
  const meId = __getMeId();

  for (const m of items){
    __chatAfterId = Math.max(__chatAfterId, Number(m.message_id) || 0);
    const mine = meId && Number(m.sender_id) === Number(meId);

    const row = document.createElement("div");
    row.style.margin = "6px 0";
    row.style.display = "flex";
    row.style.justifyContent = mine ? "flex-end" : "flex-start";

    const bubble = document.createElement("div");
    bubble.className = mine ? "chatBubble mine" : "chatBubble theirs";

    if (m.message_type === "image" && m.image_url) {
      // image message
      const img = document.createElement("img");
      img.className = "chatImg";
      // backend serves on same host/port as apiFetch base
      img.src = `http://127.0.0.1:4000${m.image_url}`;
      img.alt = "image";
      bubble.appendChild(img);
    } else {
      bubble.insertAdjacentHTML("afterbegin", __escapeHtml(m.message));
    }

    const meta = document.createElement("div");
    meta.className = "chatMeta";
    meta.textContent = new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    bubble.appendChild(meta);

    row.appendChild(bubble);
    box.appendChild(row);
  }

  box.scrollTop = box.scrollHeight;
}

async function __pollChat(){
  if (!__chatThreadId) return;
  const data = await apiFetch(`/api/chat/messages?thread_id=${__chatThreadId}&after_id=${__chatAfterId}`, { method: "GET" });
  const items = data.items || [];
  if (items.length) __renderMessages(items);
}

async function __sendChatMessage(){
  const input = document.getElementById("chatInput");
  const hint = document.getElementById("chatHint");
  const text = (input?.value || "").trim();
  if (!text || !__chatThreadId) return;

  input.value = "";
  if (hint) hint.textContent = "";

  try {
    await apiFetch("/api/chat/send", {
      method: "POST",
      body: { thread_id: __chatThreadId, message: text }
    });
    await __pollChat();
  } catch (e){
    if (hint) hint.textContent = e.message || "Failed to send";
  }
}

// multipart helper (image upload)
async function apiFetchForm(path, formData){
  const s = getSession?.();
  const token = s?.token;
  const res = await fetch(`http://127.0.0.1:4000${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

// Buyer: open chat with a farmer
async function __openChatWithFarmer(farmer_id, farmer_name){
  await __ensureChatHandlers();
  __openChatModal(`💬 Chat with ${farmer_name || "Farmer"}`);

  const box = document.getElementById("chatBox");
  if (box) box.innerHTML = "";
  const hint = document.getElementById("chatHint");
  if (hint) hint.textContent = "";

  const resp = await apiFetch("/api/chat/thread", {
    method: "POST",
    body: { farmer_id }
  });

  __chatThreadId = resp?.thread?.thread_id;
  __chatAfterId = 0;
  __chatOtherLabel = farmer_name || "Farmer";

  await __pollChat();
  if (__chatPollTimer) clearInterval(__chatPollTimer);
  __chatPollTimer = setInterval(() => __pollChat().catch(() => {}), 1500);
}

// Farmer: open an existing thread by id (used from My Chats page)
async function __openChatThread(thread_id, other_label){
  await __ensureChatHandlers();
  __openChatModal(`💬 Chat with ${other_label || "Buyer"}`);

  const box = document.getElementById("chatBox");
  if (box) box.innerHTML = "";
  const hint = document.getElementById("chatHint");
  if (hint) hint.textContent = "";

  __chatThreadId = Number(thread_id);
  __chatAfterId = 0;
  __chatOtherLabel = other_label || "Buyer";

  await __pollChat();
  if (__chatPollTimer) clearInterval(__chatPollTimer);
  __chatPollTimer = setInterval(() => __pollChat().catch(() => {}), 1500);
}

// expose
window.__openChatWithFarmer = __openChatWithFarmer;
window.__openChatThread = __openChatThread;
