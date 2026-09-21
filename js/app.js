/**
 * RIDO Copilot - Chat-only app entry point
 * Connects directly to Azure AI Foundry Agent (RIDO-Copilot / gpt-6-astra)
 */
import { AzureSettingsManager } from "./modules/azureSettings.js";
import { FoundryAgent } from "./agent/foundryAgent.js";

const azureSettings = new AzureSettingsManager();
const agent = new FoundryAgent(azureSettings);

const welcome   = document.getElementById("welcome");
const messages  = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn   = document.getElementById("sendBtn");
const thoughtLog = document.getElementById("thoughtLog");
const sidebar   = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleThoughtsBtn");
const clearBtn  = document.getElementById("clearBtn");

let hasStarted = false;

/* ── Sidebar toggle ── */
toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));

/* ── Clear chat ── */
clearBtn.addEventListener("click", () => {
  messages.innerHTML = "";
  thoughtLog.innerHTML = `<div class="empty-thoughts">Agent reasoning steps appear here as RIDO processes your query.</div>`;
  hasStarted = false;
  welcome.style.display = "flex";
  messages.style.display = "none";
});

/* ── Auto-resize textarea ── */
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

/* ── Enter to send ── */
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

sendBtn.addEventListener("click", handleSend);

/* ── Suggested prompts ── */
document.getElementById("welcome").addEventListener("click", (e) => {
  const btn = e.target.closest(".suggested-btn");
  if (!btn) return;
  const prompt = btn.dataset.prompt;
  if (prompt) {
    userInput.value = prompt;
    handleSend();
  }
});

/* ── Main send handler ── */
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  /* Show chat area, hide welcome */
  if (!hasStarted) {
    hasStarted = true;
    welcome.style.display = "none";
    messages.style.display = "flex";
  }

  /* Clear thoughts for new turn */
  thoughtLog.innerHTML = "";

  /* User bubble */
  appendMessage("user", text);

  /* Typing indicator */
  const typingId = "typing_" + Date.now();
  appendTyping(typingId);

  try {
    const result = await agent.processMessage(text, (step) => {
      appendThought(step);
    });

    removeTyping(typingId);
    appendMessage("ai", result.responseText);
  } catch (err) {
    removeTyping(typingId);
    appendMessage("ai", `**Error:** ${err.message}\n\nPlease check your Azure connection and try again.`);
    console.error(err);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

/* ── DOM helpers ── */
function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "K" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  if (role === "ai" && typeof marked !== "undefined") {
    bubble.innerHTML = marked.parse(text || "");
  } else {
    bubble.textContent = text;
  }

  div.appendChild(avatar);
  div.appendChild(bubble);
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendTyping(id) {
  const div = document.createElement("div");
  div.className = "msg ai";
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function appendThought(step) {
  /* Remove placeholder */
  const empty = thoughtLog.querySelector(".empty-thoughts");
  if (empty) empty.remove();

  const div = document.createElement("div");
  div.className = "thought-step";
  div.innerHTML = `
    <div class="thought-phase">${step.phase}</div>
    <div class="thought-title">${step.title}</div>
    <div class="thought-detail">${step.detail || ""}</div>`;
  thoughtLog.appendChild(div);
  thoughtLog.scrollTop = thoughtLog.scrollHeight;
}
