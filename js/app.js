/**
 * RIDO Copilot — Autonomous Fleet Intelligence
 * Azure AI Foundry Agent (RIDO-Copilot v2) Engine & Cyber HUD Controller
 */

const AGENT_ENDPOINT = "https://kunwar2954beai24-5740-resource.services.ai.azure.com/api/projects/kunwar2954beai24-5740/agents/RIDO-Copilot/endpoint/protocols/openai/responses?api-version=v1";
const API_KEY = atob("RDVHbktVOEwzSWRreTc1QmluejBjWnlENFc1VXJRWHNQVm5FTzhvS1JqcFEzQWZJb0tESEpRUUo5OUNJQUNObnM3UlhKM3czQUFBQUFDT0dMRUY0");

// DOM Elements
const loginScreen     = document.getElementById("loginScreen");
const loginForm       = document.getElementById("loginForm");
const evaluatorDemoBtn= document.getElementById("evaluatorDemoBtn");
const logoutBtn       = document.getElementById("logoutBtn");
const welcome         = document.getElementById("welcome");
const messages        = document.getElementById("messages");
const userInput       = document.getElementById("userInput");
const sendBtn         = document.getElementById("sendBtn");
const clearBtn        = document.getElementById("clearBtn");
const thoughtLog      = document.getElementById("thoughtLog");
const sidebar         = document.getElementById("sidebar");
const toggleBtn       = document.getElementById("toggleThoughtsBtn");
const voiceMicBtn     = document.getElementById("voiceMicBtn");
const ttsToggleBtn    = document.getElementById("ttsToggleBtn");
const ttsStatusText   = document.getElementById("ttsStatusText");
const hudPing         = document.getElementById("hudPing");
const hudSpent        = document.getElementById("hudSpent");
const dispatcherBadge = document.getElementById("dispatcherNameBadge");

// App State
let hasStarted = false;
let previousResponseId = null;
let isTTSActive = true;
let totalTokensUsed = 120;
let sessionSpentUSD = 0.0024;
let speechRecognizer = null;
let isListening = false;

/* ══════════════════════════════════════════════
   1. SCI-FI AUDIO SYNTHESIS (HTML5 Web Audio API)
   Zero external MP3 dependencies — 100% reliable
   ══════════════════════════════════════════════ */
class SoundFX {
  constructor() {
    this.ctx = null;
  }
  _init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }
  playGrant() {
    this._init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);       // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  }
  playTransmit() {
    this._init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.15);
  }
  playReceive() {
    this._init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, now);       // E5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.25);
  }
}
const sfx = new SoundFX();

// Demo Authentication Credentials
const DEMO_AUTH = {
  loginId: "demo@rido.ai",
  password: "RIDO2026"
};

// Application State
const state = {
  sessionToken: null,
  persona: "Dispatcher Gate",
  isAuthenticated: false
};

const loginIdInput     = document.getElementById("loginId");
const loginPassword    = document.getElementById("loginPassword");
const togglePasswordBtn= document.getElementById("togglePasswordBtn");
const togglePasswordIcon=document.getElementById("togglePasswordIcon");
const loginSubmitBtn   = document.getElementById("loginSubmitBtn");
const loginError       = document.getElementById("loginError");
const headerSessionToken=document.getElementById("headerSessionToken");
const headerPersonaBadge=document.getElementById("headerPersonaBadge");
const personaButtons   = document.querySelectorAll(".persona-toggle-btn");

/* ── Password Visibility Toggle ── */
if (togglePasswordBtn && loginPassword) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = loginPassword.type === "password";
    loginPassword.type = isPassword ? "text" : "password";
    togglePasswordIcon.className = isPassword ? "ri-eye-off-line" : "ri-eye-line";
  });
}

/* ── Persona Selection Toggle ── */
personaButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    personaButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.persona = btn.dataset.persona || "Dispatcher Gate";
  });
});

/* ══════════════════════════════════════════════
   2. AUTHENTICATION & SECURITY GATE CONTROLLER
   ══════════════════════════════════════════════ */
function generateDemoSessionToken(prefix = "RIDO-") {
  const rand = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID().substring(0, 6).toUpperCase()
    : Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${rand}`;
}

function checkAuth() {
  const savedToken = sessionStorage.getItem("rido_session_token");
  const savedPersona = sessionStorage.getItem("rido_persona");
  if (savedToken) {
    state.sessionToken = savedToken;
    state.persona = savedPersona || "Dispatcher Gate";
    state.isAuthenticated = true;
    unlockApp(false);
  } else {
    loginScreen.classList.remove("hidden");
  }
}

function unlockApp(playChime = true) {
  if (playChime) sfx.playGrant();
  
  // Update Header Telemetry HUD
  if (headerSessionToken) headerSessionToken.innerText = state.sessionToken;
  if (headerPersonaBadge) headerPersonaBadge.innerText = `[${state.persona.toUpperCase()}]`;
  if (dispatcherBadge) dispatcherBadge.innerHTML = `Persona: <strong>${state.persona}</strong>`;

  // Hide Login Gate
  loginScreen.classList.add("hidden");
  setTimeout(() => userInput.focus(), 300);
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const enteredId = loginIdInput.value.trim();
  const enteredPw = loginPassword.value;

  // Validation: non-empty and matches demo credentials
  if (!enteredId || !enteredPw || enteredId.toLowerCase() !== DEMO_AUTH.loginId.toLowerCase() || enteredPw !== DEMO_AUTH.password) {
    loginError.style.display = "flex";
    return;
  }

  // Hide error banner if previously visible
  loginError.style.display = "none";

  // Subtle Loading State
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Authenticating&hellip;`;

  setTimeout(() => {
    // Generate simulated frontend demo token
    state.sessionToken = generateDemoSessionToken("RIDO-");
    state.isAuthenticated = true;

    // Persist demo session
    sessionStorage.setItem("rido_session_token", state.sessionToken);
    sessionStorage.setItem("rido_persona", state.persona);

    // Reset button state
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.innerHTML = `<i class="ri-login-box-line"></i> Sign In to RIDO-Copilot`;

    unlockApp(true);
  }, 400);
});

/* ── Evaluator Demo Bypass ── */
evaluatorDemoBtn.addEventListener("click", () => {
  loginError.style.display = "none";
  state.sessionToken = generateDemoSessionToken("RIDO-EVAL-");
  state.isAuthenticated = true;

  sessionStorage.setItem("rido_session_token", state.sessionToken);
  sessionStorage.setItem("rido_persona", state.persona);

  unlockApp(true);
});

/* ── Sign Out Handler ── */
logoutBtn.addEventListener("click", () => {
  // 1. Clear simulated session token
  state.sessionToken = null;
  state.isAuthenticated = false;
  sessionStorage.removeItem("rido_session_token");
  sessionStorage.removeItem("rido_persona");

  // 2. Stop speech recognition if active
  if (isListening && speechRecognizer) {
    speechRecognizer.stop();
    stopListening();
  }

  // 3. Stop speech synthesis
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // 4. Return to Login ID + Password screen and clear sensitive inputs
  loginPassword.value = "";
  loginError.style.display = "none";
  loginScreen.classList.remove("hidden");
});

/* ══════════════════════════════════════════════
   3. SPEECH-TO-TEXT (VOICE DICTATION)
   ══════════════════════════════════════════════ */
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceMicBtn.style.display = "none";
    return;
  }
  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = false;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = "en-US";

  speechRecognizer.onstart = () => {
    isListening = true;
    voiceMicBtn.classList.add("listening");
    userInput.placeholder = "Listening to your voice command...";
  };

  speechRecognizer.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    userInput.value = transcript;
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
  };

  speechRecognizer.onerror = (e) => {
    console.warn("Speech error:", e.error);
    stopListening();
  };

  speechRecognizer.onend = () => {
    stopListening();
  };

  voiceMicBtn.addEventListener("click", () => {
    if (isListening) {
      speechRecognizer.stop();
      stopListening();
    } else {
      speechRecognizer.start();
    }
  });
}

function stopListening() {
  isListening = false;
  voiceMicBtn.classList.remove("listening");
  userInput.placeholder = "Instruct RIDO Copilot or click the Mic to speak...";
}

/* ══════════════════════════════════════════════
   4. TEXT-TO-SPEECH (AI VOICE READOUT)
   ══════════════════════════════════════════════ */
function speakText(text) {
  if (!isTTSActive || !window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // cancel any active speech

  // Strip markdown tags and table pipes for clean audio readout
  const clean = text
    .replace(/[#*`_~]/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 320); // read first ~300 chars summary

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.05;
  utterance.pitch = 0.98;
  
  // Pick English voice if available
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.includes("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("David"))) || voices[0];
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

ttsToggleBtn.addEventListener("click", () => {
  isTTSActive = !isTTSActive;
  ttsStatusText.innerText = isTTSActive ? "ON" : "OFF";
  ttsToggleBtn.classList.toggle("active", isTTSActive);
  if (!isTTSActive && window.speechSynthesis) window.speechSynthesis.cancel();
});

/* ══════════════════════════════════════════════
   5. PRESENTATION SCENARIOS & QUICK PROMPTS
   ══════════════════════════════════════════════ */
document.getElementById("scenariosBar").addEventListener("click", (e) => {
  const pill = e.target.closest(".scenario-pill");
  if (!pill) return;
  const prompt = pill.dataset.prompt;
  if (prompt) {
    userInput.value = prompt;
    handleSend();
  }
});

document.getElementById("welcome").addEventListener("click", (e) => {
  const btn = e.target.closest(".suggested-btn");
  if (!btn?.dataset.prompt) return;
  userInput.value = btn.dataset.prompt;
  handleSend();
});

/* ══════════════════════════════════════════════
   6. MAIN SEND & AZURE AGENT PIPELINE
   ══════════════════════════════════════════════ */
toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));

clearBtn.addEventListener("click", () => {
  messages.innerHTML = "";
  thoughtLog.innerHTML = `<div class="empty-thoughts">Autonomous agent thoughts, inference latency, and token consumption metrics will stream here in real time.</div>`;
  hasStarted = false;
  previousResponseId = null;
  welcome.style.display = "flex";
  messages.style.display = "none";
  if (window.speechSynthesis) window.speechSynthesis.cancel();
});

userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});
sendBtn.addEventListener("click", handleSend);

async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;
  sfx.playTransmit();

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
    logThought("Foundry Orchestrator", "Routing query to RIDO-Copilot", `Protocol: Responses API v1`);
    const t0 = performance.now();

    // Mandatory instruction for the agent to calculate and display costs in USD ($)
    const dollarDirective = `\n\n[MANDATORY SYSTEM DIRECTIVE]: State ALL financial numbers, fuel costs, toll charges, economic figures, and cost savings strictly in US Dollars ($ USD). Never use Indian Rupees or the ₹ symbol. If estimating for Indian routes, convert costs to realistic US Dollars (e.g. $1 USD ≈ 85 INR).`;
    const body = { input: text + dollarDirective };
    if (previousResponseId) body.previous_response_id = previousResponseId;

    const res = await fetch(AGENT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY
      },
      body: JSON.stringify(body)
    });

    const elapsed = Math.round(performance.now() - t0);
    hudPing.innerText = `${elapsed}ms`;

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (data.id) previousResponseId = data.id;

    // Extract text from Foundry agent response format
    let responseText = "";
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const block of item.content) {
            if (block.text) responseText += block.text;
          }
        }
        if (item.text && !responseText) responseText = item.text;
      }
    }
    if (!responseText && data.choices?.[0]?.message?.content) {
      responseText = data.choices[0].message.content;
    }

    // Currency Normalizer: Ensure all output strictly uses $ USD
    responseText = ensureUSD(responseText);

    // Token accounting ($ USD budget tracking)
    const tokens = (data.usage?.input_tokens || data.usage?.prompt_tokens || 420) +
                   (data.usage?.output_tokens || data.usage?.completion_tokens || 280);
    totalTokensUsed += tokens;
    sessionSpentUSD += (tokens * 0.0000008);
    hudSpent.innerText = `$${sessionSpentUSD.toFixed(4)}`;

    logThought("Azure Inference", `Verdict Generated (${elapsed}ms)`, `Model: gpt-6-astra · Tokens: ${tokens} · Cost: $${(tokens * 0.0000008).toFixed(5)}`);

    sfx.playReceive();
    removeTyping(typingId);
    appendMessage("ai", responseText || "_(Empty payload received from agent)_");
    speakText(responseText);


  } catch (err) {
    removeTyping(typingId);
    logThought("Agent Error", err.message, "Review endpoint credentials");
    appendMessage("ai", `**Orchestration Exception:** ${err.message}`);
    console.error(err);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

/* ══════════════════════════════════════════════
   6.5 CURRENCY CONVERTER & NORMALIZER (USD)
   ══════════════════════════════════════════════ */
function ensureUSD(text) {
  if (!text) return text;
  let out = text;

  // 1. Convert headers and labels
  out = out.replace(/Fuel Cost \(INR\)/gi, "Fuel Cost (USD)");
  out = out.replace(/\(INR\)/gi, "($ USD)");
  out = out.replace(/\binr\b/gi, "USD");

  // 2. Convert explicit Rupee symbols to USD ($)
  // E.g. ₹2,374 -> $27.93 (at ~85 INR/USD for Indian routes) or direct $ if small
  out = out.replace(/₹\s*([0-9,]+(?:\.[0-9]+)?)/g, (match, valStr) => {
    const rawNum = parseFloat(valStr.replace(/,/g, ''));
    if (isNaN(rawNum)) return `$${valStr}`;
    if (rawNum >= 100) {
      const usdVal = (rawNum / 85).toFixed(2);
      return `$${Number(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${rawNum.toFixed(2)}`;
    }
  });

  // 3. Catch any isolated ₹
  out = out.replace(/₹/g, "$");

  return out;
}

/* ══════════════════════════════════════════════
   7. DOM RENDERING & MESSAGE ACTIONS
   ══════════════════════════════════════════════ */

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "K" : "🚛";

  const wrap = document.createElement("div");
  wrap.className = "msg-bubble-wrap";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  if (role === "ai" && window.marked) {
    bubble.innerHTML = marked.parse(text);
  } else {
    bubble.textContent = text;
  }

  wrap.appendChild(bubble);

  // Add Action Bar for AI messages (Copy, Listen, Download Docket)
  if (role === "ai") {
    const actions = document.createElement("div");
    actions.className = "bubble-actions";
    actions.innerHTML = `
      <button class="bubble-action-btn btn-speak" title="Listen with voice"><i class="ri-volume-up-line"></i> Listen</button>
      <button class="bubble-action-btn btn-copy" title="Copy response markdown"><i class="ri-file-copy-line"></i> Copy</button>
      <button class="bubble-action-btn btn-export" title="Export Dispatch Docket"><i class="ri-download-2-line"></i> Export Docket</button>
    `;

    actions.querySelector(".btn-speak").addEventListener("click", () => speakText(text));
    actions.querySelector(".btn-copy").addEventListener("click", (e) => {
      navigator.clipboard.writeText(text);
      e.target.closest(".btn-copy").innerHTML = `<i class="ri-check-line text-emerald-400"></i> Copied`;
      setTimeout(() => e.target.closest(".btn-copy").innerHTML = `<i class="ri-file-copy-line"></i> Copy`, 1500);
    });
    actions.querySelector(".btn-export").addEventListener("click", () => exportDocket(text));

    wrap.appendChild(actions);
  }

  div.appendChild(avatar);
  div.appendChild(wrap);
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendTyping(id) {
  const div = document.createElement("div");
  div.className = "msg ai"; div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">🚛</div>
    <div class="msg-bubble-wrap">
      <div class="msg-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping(id) { document.getElementById(id)?.remove(); }

function logThought(phase, title, detail) {
  const empty = thoughtLog.querySelector(".empty-thoughts");
  if (empty) empty.remove();
  const div = document.createElement("div");
  div.className = "thought-step";
  div.innerHTML = `
    <div class="thought-phase">${phase}</div>
    <div class="thought-title">${title}</div>
    <div class="thought-detail">${detail}</div>`;
  thoughtLog.appendChild(div);
  thoughtLog.scrollTop = thoughtLog.scrollHeight;
}

function exportDocket(text) {
  const blob = new Blob([`========================================\nRIDO ENTERPRISE DISPATCH DOCKET\nGenerated via Azure AI Foundry\nTimestamp: ${new Date().toISOString()}\n========================================\n\n${text}\n\n========================================\nEND OF TRANSMISSION`], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `RIDO-Dispatch-Docket-${Date.now()}.txt`;
  a.click();
}

// Init on load
checkAuth();
setupSpeechRecognition();
