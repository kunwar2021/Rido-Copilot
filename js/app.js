/**
 * RIDO Copilot - Direct Azure OpenAI Chat (Chat Completions endpoint)
 * Uses gpt-6-astra via standard chat/completions with full RIDO system prompt
 */

const ENDPOINT = "https://kunwar2954beai24-5740-resource.services.ai.azure.com/openai/deployments/gpt-6-astra/chat/completions?api-version=2024-12-01-preview";
const API_KEY  = atob("RDVHbktVOEwzSWRreTc1QmluejBjWnlENFc1VXJRWHNQVm5FTzhvS1JqcFEzQWZJb0tESEpRUUo5OUNJQUNObnM3UlhKM3czQUFBQUFDT0dMRUY0");


const SYSTEM_PROMPT = `You are RIDO Copilot, an intelligent Fleet Intelligence and Logistics Dispatch Assistant powered by Azure AI Foundry.

You help fleet managers and dispatchers with:
- Route optimization (EV vs Diesel vs CNG emissions, distance, cost)
- Cold-chain temperature monitoring and breach alerts
- Driver hours-of-service compliance (4.5h continuous limit, 8.0h daily cap)
- Vehicle fleet status, battery/fuel levels, payload tracking
- Carbon offset and sustainability reporting

Fleet fuel emission constants:
- Diesel HSD: 2.68 kg CO2/L
- CNG: 2.75 kg CO2/kg
- LNG: 2.78 kg CO2/kg
- Commercial EV: 0.00 kg CO2 tailpipe

Key policies:
- Driver: Max 4.5h continuous drive (45min rest), 8.0h daily cap
- Cold-chain: Reefer setpoint <= 4.0°C, breach > 4.0°C for > 15min = DMG-01 e-POD
- EV low battery warning: < 20% SoC

For operational queries: Give structured tables, status badges, and numbered action steps.
For conversational queries: Be warm, helpful, and concise.
Always answer based on what the user actually asked — use the cities, vehicles, and routes they mention.`;

const welcome    = document.getElementById("welcome");
const messages   = document.getElementById("messages");
const userInput  = document.getElementById("userInput");
const sendBtn    = document.getElementById("sendBtn");
const clearBtn   = document.getElementById("clearBtn");
const thoughtLog = document.getElementById("thoughtLog");
const sidebar    = document.getElementById("sidebar");
const toggleBtn  = document.getElementById("toggleThoughtsBtn");

let hasStarted = false;
let conversationHistory = [];

/* ── Sidebar toggle ── */
toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));

/* ── Clear ── */
clearBtn.addEventListener("click", () => {
  messages.innerHTML = "";
  thoughtLog.innerHTML = `<div class="empty-thoughts">API call logs appear here.</div>`;
  hasStarted = false;
  conversationHistory = [];
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
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});
sendBtn.addEventListener("click", handleSend);

/* ── Suggested prompts ── */
document.getElementById("welcome").addEventListener("click", (e) => {
  const btn = e.target.closest(".suggested-btn");
  if (btn?.dataset.prompt) { userInput.value = btn.dataset.prompt; handleSend(); }
});

/* ── Main send handler ── */
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  if (!hasStarted) {
    hasStarted = true;
    welcome.style.display = "none";
    messages.style.display = "flex";
  }

  thoughtLog.innerHTML = "";
  appendMessage("user", text);
  conversationHistory.push({ role: "user", content: text });

  const typingId = "typing_" + Date.now();
  appendTyping(typingId);

  try {
    logThought("Azure OpenAI", "Sending request", `Model: gpt-6-astra · Messages: ${conversationHistory.length}`);
    const t0 = Date.now();

    const body = {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory
      ],
      max_completion_tokens: 1200
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY
      },
      body: JSON.stringify(body)
    });

    const elapsed = Date.now() - t0;

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content || "_(No response)_";
    const tokens = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);

    logThought("Azure OpenAI", `✅ Response (${elapsed}ms)`, `Tokens: ${tokens} · Finish: ${data.choices?.[0]?.finish_reason}`);

    // Keep conversation memory (last 10 turns to stay within token limits)
    conversationHistory.push({ role: "assistant", content: responseText });
    if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

    removeTyping(typingId);
    appendMessage("ai", responseText);

  } catch (err) {
    removeTyping(typingId);
    logThought("Error", err.message, "Check console for details");
    appendMessage("ai", `**Error:** ${err.message}`);
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
  if (role === "ai" && window.marked) {
    bubble.innerHTML = marked.parse(text);
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
  div.className = "msg ai"; div.id = id;
  div.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping(id) { document.getElementById(id)?.remove(); }

function logThought(phase, title, detail) {
  const empty = thoughtLog.querySelector(".empty-thoughts");
  if (empty) empty.remove();
  const div = document.createElement("div");
  div.className = "thought-step";
  div.innerHTML = `<div class="thought-phase">${phase}</div><div class="thought-title">${title}</div><div class="thought-detail">${detail}</div>`;
  thoughtLog.appendChild(div);
  thoughtLog.scrollTop = thoughtLog.scrollHeight;
}
