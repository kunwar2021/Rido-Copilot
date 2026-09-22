/**
 * RIDO Copilot — Autonomous Fleet Intelligence
 * Azure AI Foundry Agent (RIDO-Copilot v2) Engine & Cyber HUD Controller
 */

const AGENT_ENDPOINT = "https://kunwar2954beai24-5740-resource.services.ai.azure.com/api/projects/kunwar2954beai24-5740/agents/RIDO-Copilot/endpoint/protocols/openai/responses?api-version=v1";
const API_KEY = atob("RDVHbktVOEwzSWRreTc1QmluejBjWnlENFc1VXJRWHNQVm5FTzhvS1JqcFEzQWZJb0tESEpRUUo5OUNJQUNObnM3UlhKM3czQUFBQUFDT0dMRUY0");

// DOM Elements
const loginScreen       = document.getElementById("loginScreen");
const closeLoginModalBtn= document.getElementById("closeLoginModalBtn");
const browseGuestLink   = document.getElementById("browseGuestLink");
const navSignInBtn      = document.getElementById("navSignInBtn");
const logoutBtn         = document.getElementById("logoutBtn");
const personaWrapper    = document.getElementById("personaWrapper");
const personaDropdownBtn= document.getElementById("personaDropdownBtn");
const personaDropdownMenu=document.getElementById("personaDropdownMenu");
const personaMenuItems  = document.querySelectorAll(".persona-menu-item");
const heroOpenCopilotBtn= document.getElementById("heroOpenCopilotBtn");
const closeCopilotBtn   = document.getElementById("closeCopilotBtn");
const copilotWorkspace  = document.getElementById("copilotWorkspace");
const loginForm         = document.getElementById("loginForm");
const evaluatorDemoBtn  = document.getElementById("evaluatorDemoBtn");
const welcome           = document.getElementById("welcome");
const messages          = document.getElementById("messages");
const userInput         = document.getElementById("userInput");
const sendBtn           = document.getElementById("sendBtn");
const clearBtn          = document.getElementById("clearBtn");
const thoughtLog        = document.getElementById("thoughtLog");
const reasoningDrawer   = document.getElementById("reasoningDrawer");
const toggleBtn         = document.getElementById("toggleThoughtsBtn");
const closeDrawerBtn    = document.getElementById("closeDrawerBtn");
const voiceMicBtn       = document.getElementById("voiceMicBtn");
const ttsToggleBtn      = document.getElementById("ttsToggleBtn");
const ttsStatusText     = document.getElementById("ttsStatusText");
const hudPing           = document.getElementById("hudPing");
const hudSpent          = document.getElementById("hudSpent");
const dispatcherBadge   = document.getElementById("dispatcherNameBadge");


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

/* ══════════════════════════════════════════════
   2. AUTHENTICATION & SECURITY GATE CONTROLLER
   ══════════════════════════════════════════════ */
function generateDemoSessionToken(prefix = "RIDO-") {
  const rand = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID().substring(0, 6).toUpperCase()
    : Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${rand}`;
}

function updateUIAuthState(isLoggedIn) {
  if (isLoggedIn) {
    if (headerPersonaBadge) headerPersonaBadge.innerText = `[${state.persona.toUpperCase()}]`;
    if (dispatcherBadge) dispatcherBadge.innerHTML = `Persona: <strong>${state.persona}</strong>`;
    if (navSignInBtn) navSignInBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "flex";
    if (personaWrapper) personaWrapper.style.display = "block";
    loginScreen.classList.add("hidden");
  } else {
    if (navSignInBtn) navSignInBtn.style.display = "flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (personaWrapper) personaWrapper.style.display = "none";
  }
}

/* ══════════════════════════════════════════════
   2. OPERATIONAL PERSONA PROFILES & ARCHITECTURE
   (Driver In-Cab, Compliance Officer, Dispatcher, Analyst, Fleet Mgr)
   ══════════════════════════════════════════════ */
const PERSONA_PROFILES = {
  "Driver In-Cab": {
    title: "In-Cab Cockpit Telematics",
    subtitle: "Connected Vehicle: Scania 45R (TRK-A) &bull; Driver: Alex Vance",
    icon: "ri-truck-line",
    iconBg: "#16a34a",
    badge: "[DRIVER IN-CAB]",
    metrics: [
      { label: "⚡ SOC", value: "75%", color: "#16a34a" },
      { label: "🌡️ Reefer", value: "3.6°C", color: "#0284c7" },
      { label: "⏱️ HOS Left", value: "4h 18m", color: "#64748b" },
      { label: "📍 Next Halt", value: "Jaipur Supercharger (42 km)", color: "#ea580c" }
    ],
    actionBtn: { text: "Open Corridor Map", href: "routes.html", icon: "ri-map-2-line" },
    welcome: "<strong>👋 Welcome, Driver Alex.</strong> Connected to Cab <strong>TRK-A (Scania 45R)</strong>. High-voltage battery is at <strong>75% SOC</strong> and cargo chiller is stable at <strong>3.6°C</strong>. Your AI-optimized Green Corridor to Mumbai is active with a 15-minute DC fast-charging reservation at Jaipur Supercharger Oasis. How can I assist your shift?",
    chips: [
      { label: "⚡ Nearest 350kW Fast Charger", prompt: "Driver Assistant: Find the nearest 350kW DC fast-charging hub along Path-1 Green EV Corridor and reserve a bay." },
      { label: "🌡️ Reefer Temperature Check", prompt: "Driver Assistant: Audit Reefer Chiller telemetry on TRK-A and report temperature stability." },
      { label: "⏱️ Check Shift Mandatory Rest", prompt: "Driver Assistant: Calculate remaining driving hours before mandatory 45-min rest break under HOS regulations." },
      { label: "🚨 Report Highway Hazard", prompt: "Driver Assistant: Check traffic congestion or road hazard advisories between Jaipur and Udaipur." }
    ]
  },
  "Compliance Officer": {
    title: "Regulatory & Safety Surveillance",
    subtitle: "Auditing: 250 Commercial Vehicles &bull; Authority: Azure AI Foundry",
    icon: "ri-shield-check-line",
    iconBg: "#4f46e5",
    badge: "[COMPLIANCE OFFICER]",
    metrics: [
      { label: "📋 Cold-Chain SLA", value: "99.1%", color: "#16a34a" },
      { label: "⚖️ HOS Adherence", value: "100% Verified", color: "#16a34a" },
      { label: "⚠️ Active Warning", value: "1 Chiller Warning (Jaipur)", color: "#e11d48" }
    ],
    actionBtn: { text: "Open Audit Hub", href: "reports.html", icon: "ri-file-shield-2-line" },
    welcome: "<strong>🛡️ Welcome, Compliance Officer.</strong> Autonomous regulatory surveillance is active across all <strong>250 commercial assets</strong>. Cold-Chain integrity is at <strong>99.1%</strong>, driver rest adherence is certified, and Scope 1 & 2 carbon accounting is verified in <strong>$ USD</strong>. Which compliance docket or audit trail would you like to review?",
    chips: [
      { label: "📋 Certify TCO Financial Audit ($ USD)", prompt: "Compliance Audit: Compile and certify TCO Financial Audit in US Dollars ($ USD) with Scope 1 & 2 fuel breakdown." },
      { label: "🚨 Inspect Jaipur Temp Breach Alert", prompt: "Compliance Alert: Inspect TRK-A Jaipur sector temperature breach log and verify secondary chiller engagement." },
      { label: "⚖️ Generate Regulatory HOS Docket", prompt: "Compliance Audit: Generate certified Hours-of-Service shift docket across active drivers." },
      { label: "🌱 Scope 1 & 2 ESG Carbon Report", prompt: "Compliance Audit: Generate certified ESG emissions reduction docket comparing electric vs diesel corridors." }
    ]
  },
  "Dispatcher Gate": {
    title: "Dispatcher Mission Control",
    subtitle: "Network: Western Dedicated Freight Corridor &bull; Gate: Active",
    icon: "ri-shield-user-line",
    iconBg: "#0f172a",
    badge: "[DISPATCHER GATE]",
    metrics: [
      { label: "🛰️ Active Assets", value: "242 / 250 Online", color: "#16a34a" },
      { label: "⚡ Energy Mix", value: "48% EV / 52% Diesel", color: "#0284c7" },
      { label: "💰 Corridor Savings", value: "$85 USD / leg", color: "#ea580c" }
    ],
    actionBtn: { text: "Open Fleet IQ", href: "fleet.html", icon: "ri-dashboard-line" },
    welcome: "<strong>🛰️ Dispatcher Mission Control online.</strong> 242 of 250 commercial freight assets are active on the Western Corridor. Multi-modal EV route solver and fast-charger reservations are synced. How can I optimize dispatch operations?",
    chips: [
      { label: "Optimize Ludhiana-Jaipur Leg in $ USD", prompt: "Optimize logistics corridor from Ludhiana to Jaipur for Commercial EV Truck with 8500 kg payload. Provide full fuel, toll, and cost comparison in US Dollars ($ USD)." },
      { label: "Run 250-Asset Fleet Diagnostics", prompt: "Perform telematics asset health audit across 250 commercial vehicles in $ USD." },
      { label: "Schedule Departure: Interstate-07", prompt: "Schedule departure docket and driver assignment for Interstate-07 departing Ahmedabad for Mumbai in $ USD." },
      { label: "Export Active Fleet CSV Telematics", prompt: "Export full fleet telemetry CSV data breakdown with fuel vs EV kWh charging in $ USD." }
    ]
  },
  "Fleet Manager": {
    title: "Asset Health & Fleet Management",
    subtitle: "Fleet Status: 250 Commercial Units &bull; Depot: All Hubs",
    icon: "ri-dashboard-line",
    iconBg: "#0284c7",
    badge: "[FLEET MANAGER]",
    metrics: [
      { label: "⚡ Battery Health", value: "76% Avg SOC", color: "#16a34a" },
      { label: "🔧 Maintenance Due", value: "3 Scheduled", color: "#ea580c" },
      { label: "🚛 Deployed Assets", value: "242 Units", color: "#0f172a" }
    ],
    actionBtn: { text: "Manage Assets", href: "fleet.html", icon: "ri-truck-line" },
    welcome: "<strong>⚡ Welcome, Fleet Operations Manager.</strong> 242 commercial haulers deployed. Battery degradation telemetry indicates optimal cell balancing across all Scania 45R electric packs. What fleet asset diagnostic would you like to run?",
    chips: [
      { label: "Powertrain Diagnostic: Scania 45R", prompt: "Perform telemetry health audit on Scania 45R electric powertrain and high-voltage battery cell balance in $ USD." },
      { label: "Fast-Charging Bay Availability", prompt: "Audit charging bay availability and average dwell times across Delhi-Mumbai corridor hubs." },
      { label: "Reefer Chiller Fleet Health", prompt: "Inspect cold-chain chiller compressor status and refrigerant pressure across all 250 reefers." }
    ]
  },
  "ESG Analyst": {
    title: "Intelligence & ESG Analytics",
    subtitle: "Sustainability Rating: Top Decile &bull; Currency: $ USD",
    icon: "ri-pie-chart-line",
    iconBg: "#10b981",
    badge: "[ESG ANALYST]",
    metrics: [
      { label: "🌱 ESG Score", value: "98% (Index 95)", color: "#10b981" },
      { label: "💵 Monthly Power", value: "$19.1K USD", color: "#0284c7" },
      { label: "📉 Scope 1 Abatement", value: "-30 kg CO2 / leg", color: "#10b981" }
    ],
    actionBtn: { text: "Open Analytics", href: "analytics.html", icon: "ri-line-chart-line" },
    welcome: "<strong>📊 Welcome, ESG & Operations Financial Analyst.</strong> Fleet sustainability score is at <strong>98%</strong> with <strong>$19.1K USD</strong> monthly power expense. EV parity reached 48%. Which carbon accounting, emissions trend, or TCO model should we analyze?",
    chips: [
      { label: "EV vs Diesel Emissions ROI ($ USD)", prompt: "Provide ESG multi-fuel emissions comparison for EV vs Diesel vs CNG for 450 km freight leg with all fuel and toll expenses in US Dollars ($ USD)." },
      { label: "Emissions Trend Analysis (Jan-Dec)", prompt: "Analyze monthly fleet emissions trajectory from Jan through Dec and project Q4 ESG targets." },
      { label: "Driver Safety Score Breakdown", prompt: "Audit driver safety compliance radar metrics (hard braking, speeding, rest periods) and calculate risk factor." }
    ]
  }
};

function detectPersonaFromEmail(email) {
  const em = (email || "").toLowerCase().trim();
  if (em.includes("driver") || em.includes("cab") || em.includes("hauler")) {
    return "Driver In-Cab";
  } else if (em.includes("officer") || em.includes("compliance") || em.includes("safety") || em.includes("audit")) {
    return "Compliance Officer";
  } else if (em.includes("analyst") || em.includes("esg") || em.includes("finance") || em.includes("roi")) {
    return "ESG Analyst";
  } else if (em.includes("fleet") || em.includes("manager")) {
    return "Fleet Manager";
  } else if (em.includes("dispatcher") || em.includes("dispatch")) {
    return "Dispatcher Gate";
  }
  return "Driver In-Cab"; // Default friendly role
}

function renderPersonaExperience(personaName) {
  const profile = PERSONA_PROFILES[personaName] || PERSONA_PROFILES["Driver In-Cab"];

  // 1. Update Header Badges
  if (headerPersonaBadge) headerPersonaBadge.innerText = profile.badge;
  if (dispatcherBadge) dispatcherBadge.innerHTML = `Persona: <strong>${personaName}</strong>`;

  // 2. Render Live Operational HUD
  const hudContainer = document.getElementById("personaLiveHUD");
  if (hudContainer) {
    const metricsHtml = profile.metrics.map(m => `
      <div class="hud-metric-pill">
        <span>${m.label}:</span>
        <strong style="color: ${m.color};">${m.value}</strong>
      </div>
    `).join("");

    hudContainer.innerHTML = `
      <div class="hud-left">
        <div class="hud-role-icon" style="background: ${profile.iconBg};">
          <i class="${profile.icon}"></i>
        </div>
        <div>
          <div class="hud-role-title">
            <span>${profile.title}</span>
            <span style="font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-weight: 700;">ACTIVE</span>
          </div>
          <div class="hud-role-subtitle">${profile.subtitle}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="hud-metrics-row">
          ${metricsHtml}
        </div>
        <a href="${profile.actionBtn.href}" class="hud-action-btn">
          <i class="${profile.actionBtn.icon}"></i> ${profile.actionBtn.text} &rarr;
        </a>
      </div>
    `;
  }

  // 3. Render Quick Action Scenario Chips
  const chipsContainer = document.getElementById("personaQuickChips");
  if (chipsContainer) {
    chipsContainer.innerHTML = profile.chips.map(c => `
      <button type="button" class="quick-chip-btn" onclick="openCopilotWithPrompt('${c.prompt.replace(/'/g, "\\'")}')">
        <i class="ri-sparkling-fill" style="color: #6366f1;"></i> ${c.label}
      </button>
    `).join("");
  }

  // 4. Update Initial AI Welcome Bubble
  const welcomeBubble = document.querySelector("#messages .msg.ai .msg-bubble");
  if (welcomeBubble) {
    welcomeBubble.innerHTML = `
      <p>${profile.welcome}</p>
      <p style="font-size: 0.8rem; color: #64748b; margin-top: 6px;">All financial logistics projections verified in <strong>$ USD</strong> via Azure AI Foundry.</p>
    `;
  }
}

// Wire up Role Pill buttons on login card
document.querySelectorAll(".role-pill-btn").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".role-pill-btn").forEach(p => {
      p.classList.remove("active");
      p.style.border = "1px solid #e2e8f0";
      p.style.background = "#f8fafc";
      p.style.color = "#334155";
    });
    pill.classList.add("active");
    pill.style.border = "1.5px solid #2563eb";
    pill.style.background = "#eff6ff";
    pill.style.color = "#1d4ed8";

    if (loginIdInput && pill.dataset.email) {
      loginIdInput.value = pill.dataset.email;
    }
    if (loginPassword) {
      loginPassword.value = "RIDO2026";
    }
  });
});

function checkAuth() {
  const savedToken = sessionStorage.getItem("rido_session_token");
  const savedPersona = sessionStorage.getItem("rido_persona");
  if (savedToken) {
    state.sessionToken = savedToken;
    state.persona = savedPersona || "Driver In-Cab";
    state.isAuthenticated = true;
    updateUIAuthState(true);
    renderPersonaExperience(state.persona);
  } else {
    // Default to Driver In-Cab to give immediate active driver cockpit view
    state.sessionToken = generateDemoSessionToken("RIDO-");
    state.persona = "Driver In-Cab";
    state.isAuthenticated = true;
    sessionStorage.setItem("rido_session_token", state.sessionToken);
    sessionStorage.setItem("rido_persona", state.persona);
    updateUIAuthState(true);
    renderPersonaExperience(state.persona);
  }
}

function unlockApp(playChime = true) {
  if (playChime) sfx.playGrant();
  state.isAuthenticated = true;
  updateUIAuthState(true);
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const enteredId = loginIdInput.value.trim();
  const enteredPw = loginPassword.value;

  // Validation: non-empty
  if (!enteredId || !enteredPw) {
    loginError.style.display = "flex";
    return;
  }

  loginError.style.display = "none";
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Signing in&hellip;`;

  // Detect persona from email or role button
  const detectedPersona = detectPersonaFromEmail(enteredId);

  setTimeout(() => {
    state.sessionToken = generateDemoSessionToken("RIDO-");
    state.isAuthenticated = true;
    state.persona = detectedPersona;

    sessionStorage.setItem("rido_session_token", state.sessionToken);
    sessionStorage.setItem("rido_persona", state.persona);

    loginSubmitBtn.disabled = false;
    loginSubmitBtn.innerHTML = `Sign In &rarr;`;

    unlockApp(true);
    renderPersonaExperience(state.persona);
  }, 300);
});

/* ── Modal Close & Guest Links (Login on Home Page) ── */
if (closeLoginModalBtn) {
  closeLoginModalBtn.addEventListener("click", () => {
    loginScreen.classList.add("hidden");
  });
}

if (browseGuestLink) {
  browseGuestLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginScreen.classList.add("hidden");
  });
}

if (navSignInBtn) {
  navSignInBtn.addEventListener("click", () => {
    loginScreen.classList.remove("hidden");
    if (loginPassword) loginPassword.focus();
  });
}

/* ── Sign Out Handler ── */
logoutBtn.addEventListener("click", () => {
  state.sessionToken = null;
  state.isAuthenticated = false;
  sessionStorage.removeItem("rido_session_token");
  sessionStorage.removeItem("rido_persona");

  if (isListening && speechRecognizer) {
    speechRecognizer.stop();
    stopListening();
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  updateUIAuthState(false);
  loginPassword.value = "";
  loginError.style.display = "none";
  loginScreen.classList.remove("hidden");
});

/* ── Persona Dropdown Toggle ── */
if (personaDropdownBtn && personaDropdownMenu) {
  personaDropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    personaDropdownMenu.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    personaDropdownMenu.classList.remove("show");
  });

  personaMenuItems.forEach(item => {
    item.addEventListener("click", () => {
      const chosen = item.dataset.persona;
      if (chosen) {
        state.persona = chosen;
        sessionStorage.setItem("rido_persona", chosen);
        renderPersonaExperience(chosen);
        personaMenuItems.forEach(m => m.classList.remove("active"));
        item.classList.add("active");
        personaDropdownMenu.classList.remove("show");
      }
    });
  });
}

/* ── Copilot Workspace Open / Focus Controller ── */
function openCopilotWorkspace(focusInput = true) {
  if (copilotWorkspace) {
    copilotWorkspace.classList.remove("copilot-workspace-hidden");
    copilotWorkspace.classList.add("copilot-workspace-visible");
    if (focusInput && userInput) {
      setTimeout(() => userInput.focus(), 100);
    }
  }
}

function closeCopilotWorkspace() {
  // In pure copilot mode, keep workspace ready
  if (userInput) userInput.blur();
}

if (closeCopilotBtn) {
  closeCopilotBtn.addEventListener("click", () => {
    closeCopilotWorkspace();
  });
}

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
   5. FEATURE CARDS & ACTION PROMPTS
   ══════════════════════════════════════════════ */
document.querySelectorAll(".feature-card").forEach(card => {
  card.addEventListener("click", () => {
    const prompt = card.dataset.prompt;
    if (prompt) {
      openCopilotWorkspace(false);
      userInput.value = prompt;
      setTimeout(() => handleSend(), 200);
    }
  });
});

/* ── Reasoning Drawer Toggle ── */
if (toggleBtn && reasoningDrawer) {
  toggleBtn.addEventListener("click", () => reasoningDrawer.classList.toggle("collapsed"));
}
if (closeDrawerBtn && reasoningDrawer) {
  closeDrawerBtn.addEventListener("click", () => reasoningDrawer.classList.add("collapsed"));
}

/* ── Reset / Clear Chat ── */
clearBtn.addEventListener("click", () => {
  messages.innerHTML = `
    <div class="msg ai">
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble-wrap">
        <div class="msg-bubble">
          <p><strong>Chat session reset.</strong> Click any feature card above or ask me any logistics, cold-chain, or route dispatch query in <strong>$ USD</strong>.</p>
        </div>
      </div>
    </div>`;
  thoughtLog.innerHTML = `<div class="empty-thoughts">Autonomous agent thoughts, inference latency, and token consumption metrics will stream here in real time.</div>`;
  hasStarted = false;
  previousResponseId = null;
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
    if (welcome) welcome.style.display = "none";
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

/* ══════════════════════════════════════════════
   6. SPA VIEW ROUTER (Home, Fleet, Routes, Analytics, Reports)
   ══════════════════════════════════════════════ */
const navLinks = document.querySelectorAll(".nav-links .nav-link");
const allViews = document.querySelectorAll(".app-page-view");

function switchView(viewId) {
  allViews.forEach(v => v.style.display = "none");
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.style.display = "flex";
  }

  navLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.view === viewId);
  });

  if (viewId === "viewRoutes") {
    setTimeout(initHomeRoutesMap, 80);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    const target = link.dataset.view;
    if (target && document.getElementById(target)) {
      e.preventDefault();
      switchView(target);
      const hashName = target.replace("view", "").toLowerCase();
      history.pushState(null, "", `#${hashName}`);
    }
  });
});

// Logo clicks return to Home
document.querySelectorAll(".site-logo").forEach(logo => {
  logo.addEventListener("click", (e) => {
    e.preventDefault();
    switchView("viewHome");
    history.pushState(null, "", "#home");
  });
});

// Handle initial URL hash on page load
function handleHashRoute() {
  const hash = window.location.hash.toLowerCase().replace("#", "");
  if (hash === "fleet") switchView("viewFleet");
  else if (hash === "routes") switchView("viewRoutes");
  else if (hash === "analytics") switchView("viewAnalytics");
  else if (hash === "reports") switchView("viewReports");
  else switchView("viewHome");
}

window.addEventListener("popstate", handleHashRoute);
handleHashRoute();

/* ── Home Route Leaflet Map Controller ── */
let homeLeafletMap = null;
let homePolyPath1, homePolyPath2, homePolyPath3;

function initHomeRoutesMap() {
  const mapContainer = document.getElementById("homeRoutesLeafletMap");
  if (!mapContainer || typeof L === "undefined") return;
  if (homeLeafletMap) {
    setTimeout(() => homeLeafletMap.invalidateSize(), 150);
    return;
  }

  homeLeafletMap = L.map('homeRoutesLeafletMap', {
    zoomControl: false,
    attributionControl: false
  }).setView([24.2, 74.8], 6);

  // Official Google Maps Roadmap layer (Zero watermark, No API key needed)
  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  }).addTo(homeLeafletMap);

  const path1Coords = [
    [28.6139, 77.2090], [28.4595, 77.0266], [27.8864, 76.2811],
    [26.9124, 75.7873], [26.5750, 74.8639], [26.4499, 74.6399],
    [25.3407, 74.6313], [24.5854, 73.7125], [23.5977, 72.9667],
    [23.0225, 72.5714], [22.3072, 73.1812], [21.7051, 72.9959],
    [21.1702, 72.8311], [20.3893, 72.9106], [19.2183, 72.9781],
    [18.9499, 72.9515]
  ];

  const path2Coords = [
    [28.6139, 77.2090], [27.1767, 78.0081], [26.2183, 78.1828],
    [24.5362, 77.7289], [22.7196, 75.8577], [21.8314, 75.6179],
    [20.9042, 74.7749], [19.9975, 73.7898], [19.0760, 72.8777]
  ];

  const path3Coords = [
    [28.6139, 77.2090], [27.5706, 76.6433], [25.2138, 75.8648],
    [23.3315, 75.0367], [22.7758, 73.6149], [22.3072, 73.1812],
    [19.0760, 72.8777]
  ];

  L.polyline(path1Coords, { color: '#10b981', weight: 12, opacity: 0.35 }).addTo(homeLeafletMap);
  homePolyPath1 = L.polyline(path1Coords, { color: '#059669', weight: 6, opacity: 0.95 }).addTo(homeLeafletMap);
  homePolyPath2 = L.polyline(path2Coords, { color: '#0284c7', weight: 4.5, opacity: 0.8, dashArray: '8, 8' }).addTo(homeLeafletMap);
  homePolyPath3 = L.polyline(path3Coords, { color: '#ea580c', weight: 4.5, opacity: 0.8, dashArray: '6, 6' }).addTo(homeLeafletMap);

  const hubs = [
    { name: 'Delhi NCR Freight Origin', coords: [28.6139, 77.2090], icon: 'ri-map-pin-2-fill', bg: '#10b981' },
    { name: 'Jaipur 350kW Supercharger Hub', coords: [26.9124, 75.7873], icon: 'ri-flashlight-fill', bg: '#10b981' },
    { name: 'Ajmer Solar Fast-Charging Oasis', coords: [26.4499, 74.6399], icon: 'ri-sun-fill', bg: '#10b981' },
    { name: 'Udaipur Fleet Park & Buffer', coords: [24.5854, 73.7125], icon: 'ri-building-4-fill', bg: '#10b981' },
    { name: 'Ahmedabad Mega Depot', coords: [23.0225, 72.5714], icon: 'ri-store-2-fill', bg: '#0284c7' },
    { name: 'Mumbai JNPT Port Terminal (Destination)', coords: [18.9499, 72.9515], icon: 'ri-flag-fill', bg: '#10b981' }
  ];

  hubs.forEach(h => {
    const icon = L.divIcon({
      html: `<div style="width: 30px; height: 30px; border-radius: 50%; background: ${h.bg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><i class="${h.icon}"></i></div>`,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker(h.coords, { icon }).addTo(homeLeafletMap).bindPopup(`<strong>${h.name}</strong><br>Status: Active Telemetry Streaming`);
  });

  homeLeafletMap.fitBounds(homePolyPath1.getBounds(), { padding: [40, 40] });
}

window.zoomInHomeMap = () => { if (homeLeafletMap) homeLeafletMap.zoomIn(); };
window.zoomOutHomeMap = () => { if (homeLeafletMap) homeLeafletMap.zoomOut(); };
window.focusHomeRoute = (r) => {
  if (!homeLeafletMap) return;
  if (r === 'path1' && homePolyPath1) homeLeafletMap.fitBounds(homePolyPath1.getBounds(), { padding: [30, 30] });
  if (r === 'path2' && homePolyPath2) homeLeafletMap.fitBounds(homePolyPath2.getBounds(), { padding: [30, 30] });
  if (r === 'path3' && homePolyPath3) homeLeafletMap.fitBounds(homePolyPath3.getBounds(), { padding: [30, 30] });
};

/* ══════════════════════════════════════════════
   7. INTERACTIVE REPORT & PROMPT HELPERS
   ══════════════════════════════════════════════ */
window.openCopilotWithPrompt = function(promptText) {
  switchView("viewHome");
  openCopilotWorkspace(false);
  userInput.value = promptText;
  setTimeout(() => handleSend(), 200);
};

window.filterReports = function(category, element) {
  document.querySelectorAll(".folder-item").forEach(f => f.classList.remove("active"));
  if (element) element.classList.add("active");

  const rows = document.querySelectorAll("#reportsTable tbody tr");
  rows.forEach(row => {
    if (category === "all" || row.dataset.cat === category) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
};

window.handleReportSearch = function(query) {
  const q = query.toLowerCase().trim();
  const rows = document.querySelectorAll("#reportsTable tbody tr");
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(q) ? "" : "none";
  });
};

window.previewReport = function(title) {
  alert(`RIDO Enterprise Audit Docket:\n\nDocument: ${title}\nAudit Authority: Azure AI Foundry & Scania Fleet Operations\nStatus: Certified & Signed\nAll financial values verified in $ USD.`);
};

window.downloadSampleReport = function(filename) {
  const docketText = `=====================================================
RIDO ENTERPRISE AUDIT & COMPLIANCE DOCKET
File: ${filename}
Generated: ${new Date().toISOString()}
System: Azure AI Foundry (gpt-6-astra)
Corridor: Western Dedicated Freight Corridor
Currency Protocol: US Dollars ($ USD)
=====================================================

1. EXECUTIVE AUDIT SUMMARY
All cold-chain telematics, EV battery lifecycle telemetry, and Hours-of-Service
logs have been audited under autonomous AI surveillance protocols.

2. COMPLIANCE METRICS
- Cold Chain SLA: 99.1% Compliance (No critical cargo loss)
- Driver Rest Compliance: 45-min mandatory halts verified
- Electric Corridor TCO: $85 Saved per 450 km compared to diesel baseline
- Carbon Emissions: Scope 1 reduction verified

Certified by: RIDO Operational AI Controller
=====================================================`;
  const blob = new Blob([docketText], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

window.triggerReportGen = function(reportName) {
  openCopilotWithPrompt(`Generate and certify formal ${reportName} docket with full line-item costs in US Dollars ($ USD) and driver telematics.`);
};
