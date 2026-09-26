// Determine "who am I" on this page — set this per page before loading chat.js
// On dashboard.html (patient): window.CHAT_ME = "Isha Sharma";
// On caregiver-dashboard.html: window.CHAT_ME = "Pari Verma";

function getChatKey(personA, personB) {
  return "pillsync_chat_" + [personA, personB].sort().join("_");
}

let currentChatWith = null;

function openChat(otherPerson) {
  currentChatWith = otherPerson;
  document.getElementById("chatWithName").textContent = "Chat with " + otherPerson;
  document.getElementById("chatModal").style.display = "flex";
  renderMessages();
  markAsRead(otherPerson);
}

function closeChat() {
  document.getElementById("chatModal").style.display = "none";
}

function renderMessages() {
  const key = getChatKey(window.CHAT_ME, currentChatWith);
  const messages = JSON.parse(localStorage.getItem(key) || "[]");
  const container = document.getElementById("chatMessages");

  container.innerHTML = messages.map(msg => {
    const isSent = msg.sender === window.CHAT_ME;
    return `
      <div class="chat-bubble ${isSent ? "sent" : "received"}">
        ${msg.text}
        <span class="chat-time">${msg.time}</span>
      </div>
    `;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text || !currentChatWith) return;

  const key = getChatKey(window.CHAT_ME, currentChatWith);
  const messages = JSON.parse(localStorage.getItem(key) || "[]");

    messages.push({
    sender: window.CHAT_ME,
    text: text,
    time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    timestamp: Date.now()
  });

  localStorage.setItem(key, JSON.stringify(messages));
  input.value = "";
  renderMessages();
}

// Live update if the other person sends a message in another tab
window.addEventListener("storage", function (e) {
  if (currentChatWith && e.key === getChatKey(window.CHAT_ME, currentChatWith)) {
    renderMessages();
  }
  updateUnreadBadge(document.getElementById("chatWithName") ? "Pari Verma" : null);
});
function getUnreadCount(otherPerson) {
  const key = getChatKey(window.CHAT_ME, otherPerson);
  const messages = JSON.parse(localStorage.getItem(key) || "[]");
  const lastReadKey = "pillsync_lastread_" + key;
  const lastRead = parseInt(localStorage.getItem(lastReadKey) || "0");

  return messages.filter(m => m.sender !== window.CHAT_ME && m.timestamp > lastRead).length;
}

function markAsRead(otherPerson) {
  const key = getChatKey(window.CHAT_ME, otherPerson);
  const lastReadKey = "pillsync_lastread_" + key;
  localStorage.setItem(lastReadKey, Date.now().toString());
  updateUnreadBadge(otherPerson);
}

function updateUnreadBadge(otherPerson) {
  const badge = document.getElementById("chatBadge");
  if (!badge) return;

  const count = getUnreadCount(otherPerson);
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = "inline-flex";
  } else {
    badge.style.display = "none";
  }
}