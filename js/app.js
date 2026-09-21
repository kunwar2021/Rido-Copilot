/**
 * RIDO Copilot - Azure AI Foundry Agent (RIDO-Copilot v2)
 * Uses the actual Foundry agent endpoint with openai/responses protocol
 */

const AGENT_ENDPOINT = "https://kunwar2954beai24-5740-resource.services.ai.azure.com/api/projects/kunwar2954beai24-5740/agents/RIDO-Copilot/endpoint/protocols/openai/responses?api-version=v1";
const API_KEY = atob("RDVHbktVOEwzSWRreTc1QmluejBjWnlENFc1VXJRWHNQVm5FTzhvS1JqcFEzQWZJb0tESEpRUUo5OUNJQUNObnM3UlhKM3czQUFBQUFDT0dMRUY0");

const welcome    = document.getElementById("welcome");
const messages   = document.getElementById("messages");
const userInput  = document.getElementById("userInput");
const sendBtn    = document.getElementById("sendBtn");
const clearBtn   = document.getElementById("clearBtn");
const thoughtLog = document.getElementById("thoughtLog");
const sidebar    = document.getElementById("sidebar");
const toggleBtn  = document.getElementById("toggleThoughtsBtn");

let hasStarted = false;
let previousResponseId = null; // multi-turn via Foundry agent

/* ── Sidebar toggle ── */
toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));

/* ── Clear ── */
clearBtn.addEventListener("click", () => {
  messages.innerHTML = "";
  thoughtLog.innerHTML = `<div class="empty-thoughts">Agent call logs appear here.</div>`;
  hasStarted = false;
  previousResponseId = null;
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
  const typingId = "typing_" + Date.now();
  appendTyping(typingId);

  try {
    logThought("RIDO-Copilot Agent", "Calling Azure AI Foundry agent", `v2 · Responses protocol`);
    const t0 = Date.now();

    const body = { input: text };
    if (previousResponseId) body.previous_response_id = previousResponseId;

    const res = await fetch(AGENT_ENDPOINT, {
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

    // Store response ID for multi-turn memory
    if (data.id) previousResponseId = data.id;

    // Extract text from Foundry agent response format
    let responseText = "";

    // Primary: data.output[].content[].text
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const block of item.content) {
            if (block.text) responseText += block.text;
          }
        }
        // Also handle direct text property
        if (item.text && !responseText) responseText = item.text;
      }
    }

    // Fallback: choices format
    if (!responseText && data.choices?.[0]?.message?.content) {
      responseText = data.choices[0].message.content;
    }

    const tokens = (data.usage?.input_tokens || data.usage?.prompt_tokens || 0) +
                   (data.usage?.output_tokens || data.usage?.completion_tokens || 0);

    logThought("RIDO-Copilot Agent", `✅ Response (${elapsed}ms)`, `Tokens: ${tokens} · ID: ${(data.id||'').substring(0,16)}...`);

    removeTyping(typingId);
    appendMessage("ai", responseText || "_(Empty response from agent — check agent configuration in Foundry portal)_");

  } catch (err) {
    removeTyping(typingId);
    logThought("Error", err.message, "Check console");
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
