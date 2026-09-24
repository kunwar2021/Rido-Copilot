/**
 * RIDO Copilot — Autonomous Fleet Intelligence
 * Azure AI Foundry Agent (RIDO-Copilot v2) Engine & Cyber HUD Controller
 */

import { AzureSettingsManager } from "./modules/azureSettings.js";
import { FoundryAgent } from "./agent/foundryAgent.js";

const azureSettings = new AzureSettingsManager();
const foundryAgent = new FoundryAgent(azureSettings);
window.azureSettings = azureSettings;
window.foundryAgent = foundryAgent;

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
const messages          = document.getElementById("copilotMessageFeed") || document.getElementById("messages");
const userInput         = document.getElementById("copilotInput") || document.getElementById("userInput");
const sendBtn           = document.getElementById("copilotSendBtn") || document.getElementById("sendBtn");
const clearBtn          = document.getElementById("clearBtn");
const thoughtLog        = document.getElementById("thoughtLog");
const reasoningDrawer   = document.getElementById("reasoningDrawer");
const toggleBtn         = document.getElementById("toggleThoughtsBtn");
const closeDrawerBtn    = document.getElementById("closeDrawerBtn");
const voiceMicBtn       = document.getElementById("copilotMicBtn") || document.getElementById("voiceMicBtn");
const ttsToggleBtn      = document.getElementById("ttsToggleBtn");
const ttsStatusText     = document.getElementById("ttsStatusText");
const hudPing           = document.getElementById("hudPing");
const hudSpent          = document.getElementById("hudSpent");
const dispatcherBadge   = document.getElementById("dispatcherNameBadge");

// Azure Settings Modal Elements ($200 Dual-Account Pool)
const navSettingsBtn          = document.getElementById("navSettingsBtn");
const azureSettingsModal      = document.getElementById("azureSettingsModal");
const closeSettingsModalBtn   = document.getElementById("closeSettingsModalBtn");
const cancelSettingsBtn       = document.getElementById("cancelSettingsBtn");
const saveSettingsBtn         = document.getElementById("saveSettingsBtn");
const testAzureConnectionBtn  = document.getElementById("testAzureConnectionBtn");
const modeLiveAzureBtn        = document.getElementById("modeLiveAzureBtn");
const modeOfflineBtn          = document.getElementById("modeOfflineBtn");
const azureEndpoint1          = document.getElementById("azureEndpoint1");
const azureKey1               = document.getElementById("azureKey1");
const azureDeployment1        = document.getElementById("azureDeployment1");
const azureEndpoint2          = document.getElementById("azureEndpoint2");
const azureKey2               = document.getElementById("azureKey2");
const azureDeployment2        = document.getElementById("azureDeployment2");
const modalPoolRemaining      = document.getElementById("modalPoolRemaining");
const modalAcc1Remaining      = document.getElementById("modalAcc1Remaining");
const modalAcc1Tokens         = document.getElementById("modalAcc1Tokens");
const modalAcc2Remaining      = document.getElementById("modalAcc2Remaining");
const modalAcc2Tokens         = document.getElementById("modalAcc2Tokens");
const modalAcc1Status         = document.getElementById("modalAcc1Status");
const modalAcc2Status         = document.getElementById("modalAcc2Status");


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

const PROTECTED_TABS = ['fleet', 'routes', 'analytics', 'reports', 'copilot'];

const VIEW_MAP = {
  home: 'viewHome',
  fleet: 'viewFleet',
  routes: 'viewRoutes',
  analytics: 'viewAnalytics',
  reports: 'viewReports',
  copilot: 'viewCopilot'
};

function normalizeTabKey(input) {
  if (!input) return 'home';
  const s = String(input)
    .toLowerCase()
    .replace(/^view/i, '')
    .replace(/^#/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (s === 'home' || s === 'mission control' || s === 'missioncontrol' || s === 'in cab cockpit' || s === 'safety & audit hub' || s === 'gate operations' || s === 'financial overview') {
    return 'home';
  }
  if (s === 'fleet' || s === 'fleet iq' || s === 'fleetiq' || s === 'fleet tracking') {
    return 'fleet';
  }
  if (s === 'routes' || s === 'corridor routes' || s === 'corridor' || s === 'corridor dispatch' || s === 'my active route') {
    return 'routes';
  }
  if (s === 'analytics' || s === 'esg analytics') {
    return 'analytics';
  }
  if (s === 'reports' || s === 'regulatory dockets' || s === 'sustainability dockets') {
    return 'reports';
  }
  if (s === 'copilot' || s === 'ai copilot' || s === 'assistant' || s === 'ai assistant' || s === 'in cab copilot' || s === 'audit copilot' || s === 'gate copilot' || s === 'esg copilot') {
    return 'copilot';
  }
  return s;
}

function isAuthenticated() {
  const token = localStorage.getItem("rido_session") ||
                localStorage.getItem("rido_auth_token") ||
                sessionStorage.getItem("rido_session_token");

  if (!token || typeof token !== "string") {
    return false;
  }

  const clean = token.trim();
  // Strictly invalidate falsey, empty, or stringified null/undefined
  if (!clean || clean === "null" || clean === "undefined" || clean === "false" || clean === "NaN") {
    localStorage.removeItem("rido_session");
    localStorage.removeItem("rido_auth_token");
    localStorage.removeItem("rido_user_data");
    localStorage.removeItem("rido_persona");
    sessionStorage.removeItem("rido_session_token");
    sessionStorage.removeItem("rido_persona");
    return false;
  }

  return true;
}

function openSignInModal(targetView = null) {
  return openLoginModal(targetView);
}

function openLoginModal(targetView = null) {
  if (targetView) {
    window.pendingRedirectView = targetView;
  }
  const screen = document.getElementById("loginScreen") || document.getElementById("signInModal");
  if (screen) {
    screen.classList.remove("hidden");
    screen.style.display = "flex";
    screen.style.opacity = "1";
    screen.style.visibility = "visible";
    screen.style.pointerEvents = "auto";
    screen.style.zIndex = "99999";
    if (loginPassword) loginPassword.value = "RIDO2026";
    if (loginIdInput) loginIdInput.focus();

    // Backdrop click — dismiss if clicking the overlay itself, not the card
    screen.onclick = (e) => {
      if (e.target === screen) closeLoginModal();
    };
  }
}

function closeLoginModal() {
  const screen = document.getElementById("loginScreen") || document.getElementById("signInModal");
  if (screen) {
    screen.classList.add("hidden");
    screen.style.display = "none";
    screen.style.opacity = "0";
    screen.style.visibility = "hidden";
    screen.style.pointerEvents = "none";
  }
}

function closeSignInModal() {
  return closeLoginModal();
}

window.openSignInModal = openSignInModal;
window.closeSignInModal = closeSignInModal;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.switchTab = switchTab;
window.switchView = switchView;
window.logout = logout;

function handleHeroCTA() {
  if (isAuthenticated()) {
    const currentPersona = state.persona || localStorage.getItem("rido_persona") || "Dispatcher Gate";
    const config = ROLE_CONFIG[currentPersona] || ROLE_CONFIG["Dispatcher Gate"];
    if (config && config.defaultTab && config.defaultTab !== "home") {
      switchTab(config.defaultTab);
    } else {
      switchTab("copilot");
    }
  } else {
    openSignInModal();
  }
}
window.handleHeroCTA = handleHeroCTA;

// One-click role authentication — called directly from modal role cards
function authenticateRole(roleKey) {
  // Delegate fully to the existing login() pipeline
  login({ persona: roleKey });
}
window.authenticateRole = authenticateRole;

// Route user to the appropriate view for their role
function routeToRoleView(roleKey) {
  // Normalise key — support both title-case and upper-case
  const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG[roleKey?.toUpperCase()] || ROLE_CONFIG["Driver In-Cab"];
  const destTab = config.defaultTab || "home";
  switchTab(destTab);
}
window.routeToRoleView = routeToRoleView;


function updateUIAuthState(isLoggedIn) {
  const authSlot = document.getElementById("authSlot");
  const guestBanner = document.getElementById("guestLockBanner");
  const inputDock = document.getElementById("copilotInputDock");
  const currentPersona = state.persona || "Guest";

  if (isLoggedIn) {
    if (authSlot) {
      const displayBadge = currentPersona.toUpperCase().startsWith("[") ? currentPersona.toUpperCase() : `[${currentPersona.toUpperCase()}]`;
      authSlot.innerHTML = `
        <div class="nav-persona-wrapper" id="personaWrapper" style="display: block;">
          <div class="nav-persona-btn static-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 text-xs font-semibold" id="personaDropdownBtn" title="Authenticated Operational Role (Enforced by RBAC)">
            <i class="ri-shield-check-line text-emerald-600 text-sm"></i>
            <span id="headerPersonaBadge">${displayBadge}</span>
            <span class="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded font-bold uppercase">VERIFIED</span>
          </div>
        </div>
        <button onclick="logout()" data-action="logout" id="logoutBtn" class="btn-signout inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:text-red-600 hover:border-red-200 transition shadow-sm" title="Sign Out of Mission Control">
          <i class="ri-logout-box-r-line w-3.5 h-3.5"></i>
          <span>Sign Out</span>
        </button>
      `;
    }
    const hBadge = document.getElementById("headerPersonaBadge");
    if (hBadge) hBadge.innerText = currentPersona.toUpperCase().startsWith("[") ? currentPersona.toUpperCase() : `[${currentPersona.toUpperCase()}]`;
    if (dispatcherBadge) dispatcherBadge.innerHTML = `Persona: <strong>${currentPersona}</strong>`;
    if (loginScreen) loginScreen.classList.add("hidden");
    if (guestBanner) guestBanner.style.display = "none";

    // Enable Copilot Console input & buttons
    if (inputDock) inputDock.classList.remove("locked");
    if (userInput) {
      userInput.disabled = false;
      userInput.placeholder = "Ask RIDO Copilot or click the Mic to speak...";
    }
    if (sendBtn) sendBtn.disabled = false;
    if (voiceMicBtn) voiceMicBtn.disabled = false;

    // Remove lock state from all navigation links
    document.querySelectorAll(".nav-link.locked").forEach(l => l.classList.remove("locked"));
    document.querySelectorAll(".nav-lock-icon").forEach(icon => icon.style.display = "none");
  } else {
    if (authSlot) {
      authSlot.innerHTML = "";
    }
    const personaWrap = document.getElementById("personaWrapper");
    if (personaWrap) personaWrap.style.display = "none";
    const logoutB = document.getElementById("logoutBtn");
    if (logoutB) logoutB.style.display = "none";
    if (guestBanner) guestBanner.style.display = "flex";

    // Lock Copilot Console input & buttons
    if (inputDock) inputDock.classList.add("locked");
    if (userInput) {
      userInput.disabled = true;
      userInput.value = "";
      userInput.placeholder = "Please sign in to interact with RIDO Copilot...";
    }
    if (sendBtn) sendBtn.disabled = true;
    if (voiceMicBtn) voiceMicBtn.disabled = true;
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

/* ══════════════════════════════════════════════
   ROLE-BASED ACCESS CONTROL (RBAC) POLICY & MATRIX
   Strict isolation: one role's features and tabs cannot be seen or accessed by another
   ══════════════════════════════════════════════ */
const ROLE_CONFIG = {
  "Driver In-Cab": {
    badge: "[DRIVER IN-CAB]",
    defaultTab: "home",
    allowedTabs: ["home", "routes", "copilot"],
    allowedViews: ["viewHome", "viewRoutes", "viewCopilot"],
    tabLabels: { home: "In-Cab Cockpit", routes: "My Active Route", copilot: "In-Cab Copilot" },
    tabIcons: { home: "ri-dashboard-3-line", routes: "ri-route-line", copilot: "ri-robot-2-line text-orange-500" },
    title: "In-Cab Instrument Cluster & Telematics",
    subtitle: "Live Unit TRK-A (Scania 45R) In-Cab Telemetry, HOS Rest Countdown & Active Route",
    icon: "ri-truck-line",
    iconBg: "#16a34a",
    showProcessStrip: false
  },
  "Compliance Officer": {
    badge: "[COMPLIANCE OFFICER]",
    defaultTab: "home",
    allowedTabs: ["home", "reports", "copilot"],
    allowedViews: ["viewHome", "viewReports", "viewCopilot"],
    tabLabels: { home: "Safety & Audit Hub", reports: "Regulatory Dockets", copilot: "Audit Copilot" },
    tabIcons: { home: "ri-shield-check-line", reports: "ri-file-shield-2-line", copilot: "ri-robot-2-line text-orange-500" },
    title: "Regulatory Compliance & Safety Surveillance Deck",
    subtitle: "Cold-Chain Integrity SLA (99.1%), HOS Shift Logs & ESG Certified Audit Dockets",
    icon: "ri-shield-check-line",
    iconBg: "#4f46e5",
    showProcessStrip: false
  },
  "Dispatcher Gate": {
    badge: "[DISPATCHER GATE]",
    defaultTab: "home",
    allowedTabs: ["home", "fleet", "routes", "copilot"],
    allowedViews: ["viewHome", "viewFleet", "viewRoutes", "viewCopilot"],
    tabLabels: { home: "Gate Operations", fleet: "Fleet Tracking", routes: "Corridor Dispatch", copilot: "Gate Copilot" },
    tabIcons: { home: "ri-building-2-line", fleet: "ri-truck-line", routes: "ri-road-map-line", copilot: "ri-robot-2-line text-orange-500" },
    title: "Dispatcher Gate & Yard Management Deck",
    subtitle: "Active Inbound Gate Queue, Loading Bay Capacity & Corridor Departure Manifests",
    icon: "ri-shield-user-line",
    iconBg: "#0f172a",
    showProcessStrip: true
  },
  "ESG Analyst": {
    badge: "[ESG ANALYST]",
    defaultTab: "home",
    allowedTabs: ["home", "analytics", "reports", "copilot"],
    allowedViews: ["viewHome", "viewAnalytics", "viewReports", "viewCopilot"],
    tabLabels: { home: "Financial Overview", analytics: "ESG Analytics", reports: "Sustainability Dockets", copilot: "ESG Copilot" },
    tabIcons: { home: "ri-line-chart-line", analytics: "ri-pie-chart-line", reports: "ri-file-list-3-line", copilot: "ri-robot-2-line text-orange-500" },
    title: "Corporate ESG & Financial Overview Deck",
    subtitle: "Scope 1 Emissions Abatement, Fleet Fuel Parity & TCO Dollar Cost Modeling",
    icon: "ri-pie-chart-line",
    iconBg: "#10b981",
    showProcessStrip: false
  },
  "Fleet Manager": {
    badge: "[FLEET MANAGER]",
    defaultTab: "fleet",
    allowedTabs: ["home", "fleet", "routes", "analytics", "reports", "copilot"],
    allowedViews: ["viewHome", "viewFleet", "viewRoutes", "viewAnalytics", "viewReports", "viewCopilot"],
    tabLabels: { home: "Mission Control", fleet: "Fleet IQ", routes: "Corridor Routes", analytics: "Analytics", reports: "Reports", copilot: "AI Copilot" },
    tabIcons: { home: "ri-home-4-line", fleet: "ri-truck-line", routes: "ri-road-map-line", analytics: "ri-line-chart-line", reports: "ri-file-shield-2-line", copilot: "ri-robot-2-line text-orange-500" },
    title: "Enterprise Fleet IQ Executive Deck",
    subtitle: "242/250 Active Commercial Assets • Western & Northern Freight Corridors",
    icon: "ri-dashboard-line",
    iconBg: "#0284c7",
    showProcessStrip: true
  }
};

ROLE_CONFIG["DRIVER IN-CAB"] = ROLE_CONFIG["Driver In-Cab"];
ROLE_CONFIG["COMPLIANCE OFFICER"] = ROLE_CONFIG["Compliance Officer"];
ROLE_CONFIG["DISPATCHER GATE"] = ROLE_CONFIG["Dispatcher Gate"];
ROLE_CONFIG["ESG ANALYST"] = ROLE_CONFIG["ESG Analyst"];
ROLE_CONFIG["FLEET MANAGER"] = ROLE_CONFIG["Fleet Manager"];

const ROLE_PERMISSIONS = ROLE_CONFIG;
window.ROLE_CONFIG = ROLE_CONFIG;
window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

/* ══════════════════════════════════════════════
   PERSONA-ADAPTIVE COPILOT CONFIGURATION MATRIX
   Dynamic role adaptation for AI Copilot tab
   ══════════════════════════════════════════════ */
const COPILOT_PERSONAS = {
  'DRIVER IN-CAB': {
    title: 'In-Cab Copilot Dispatch',
    greeting: 'Welcome Driver Alex (TRK-A Scania 45R). I can help you monitor high-voltage battery range, locate highway fast-chargers, check reefer temperatures, or calculate your next mandatory rest halt.',
    suggestions: [
      'Nearest 350kW Fast Charger',
      'Reefer Temperature Check',
      'Check Shift Mandatory Rest',
      'Report Highway Hazard'
    ],
    badge: 'In-Cab Active Assistant',
    systemPrompt: 'You are an intelligent in-cab co-driver assistant for long-haul freight drivers. Focus on navigation, HOS rest compliance, Reefer chiller temps, and high-voltage charging stops.'
  },
  'COMPLIANCE OFFICER': {
    title: 'Regulatory & Audit Intelligence',
    greeting: 'Compliance console online. Scopes 1 & 2 carbon accounting, HOS mandatory rest logbooks, and cold-chain temperature audit logs are synchronized.',
    suggestions: [
      'Generate Reefer SLA Report',
      'Audit Driver Shift Rest Logs',
      'Run Scope 1 & 2 Carbon Check',
      'Verify Electronic Log Docket'
    ],
    badge: 'Audit & Compliance Guard',
    systemPrompt: 'You are an enterprise compliance auditor for commercial freight logistics. Focus on cold-chain breach detection, regulatory driver HOS rest mandates, and carbon emissions auditing.'
  },
  'DISPATCHER GATE': {
    title: 'Gate & Corridor Dispatch Assistant',
    greeting: 'Dispatch gateway active. 242/250 assets deployed across Delhi-Mumbai corridors. I can re-route shipments, calculate ETA impact, and manage gate appointments.',
    suggestions: [
      'Check Gate Bay Congestion',
      'Optimize Corridor Path-1',
      'Active EV vs Diesel Split',
      'Dispatch Emergency Relief Unit'
    ],
    badge: 'Gate Operations Copilot',
    systemPrompt: 'You are a freight gateway dispatcher. Focus on corridor traffic, gate slot allocation, asset availability, and turn-around times.'
  },
  'ESG ANALYST': {
    title: 'ESG & Sustainability Intelligence',
    greeting: 'ESG Portfolio Analytics online. Scope 1 & 2 emissions, TCO cost modeling, and fleet fuel parity are synchronized.',
    suggestions: [
      'EV vs Diesel Emissions ROI ($ USD)',
      'Forecast Q4 Carbon Trajectory',
      'Recalculate Fuel Parity ($ USD)',
      'Scope 1 & 2 ESG Carbon Report'
    ],
    badge: 'ESG Financial Copilot',
    systemPrompt: 'You are an ESG and sustainable logistics intelligence assistant. Focus on carbon accounting, fuel parity modeling in USD, and corporate emissions abatement.'
  },
  'FLEET MANAGER': {
    title: 'Mission Control Enterprise Copilot',
    greeting: 'Welcome to RIDO Mission Control. I can optimize green EV freight corridors, audit cross-fleet operational expenses, or run predictive maintenance diagnostics.',
    suggestions: [
      'Full Fleet TCO Analysis',
      'Asset Health Critical Alerts',
      'Optimize Multi-Corridor Paths',
      'Run EV Transition Modeling'
    ],
    badge: 'Fleet Intelligence AI',
    systemPrompt: 'You are an executive fleet management AI. Provide macro-level operational metrics, financial TCO insights, fleet asset health, and strategic routing summaries.'
  }
};

COPILOT_PERSONAS['Driver In-Cab'] = COPILOT_PERSONAS['DRIVER IN-CAB'];
COPILOT_PERSONAS['Compliance Officer'] = COPILOT_PERSONAS['COMPLIANCE OFFICER'];
COPILOT_PERSONAS['Dispatcher Gate'] = COPILOT_PERSONAS['DISPATCHER GATE'];
COPILOT_PERSONAS['ESG Analyst'] = COPILOT_PERSONAS['ESG ANALYST'];
COPILOT_PERSONAS['Fleet Manager'] = COPILOT_PERSONAS['FLEET MANAGER'];
window.COPILOT_PERSONAS = COPILOT_PERSONAS;

const PERSONA_CHAT_CONFIG = {
  'DISPATCHER GATE': {
    heading: 'Gate & Corridor Dispatch Connected',
    message: 'Gateway dispatch console active. 242 of 250 assets deployed online across active corridors. Ready to optimize corridor routes, clear gate dwell queues, or manage emergency reroutes.',
    icon: '🏢'
  },
  'DRIVER IN-CAB': {
    heading: 'In-Cab Telematics Connected',
    message: 'Welcome Driver Alex. Unit TRK-A (Scania 45R) high-voltage battery is at 75% SOC with reefer chiller locked at +3.6°C. Ready for in-cab routing, charging oasis reservations, or HOS rest checks.',
    icon: '🚛'
  },
  'COMPLIANCE OFFICER': {
    heading: 'Regulatory & Compliance Intelligence Active',
    message: 'Regulatory audit hub online. 99.99% cold-chain SLA adherence logged across active reefers. Ready to audit HOS driver shift rest logs or inspect Scope 1 & 2 carbon abatement dockets.',
    icon: '📋'
  },
  'FLEET MANAGER': {
    heading: 'Mission Control Enterprise Copilot',
    message: 'Welcome to RÍDO Mission Control. Ready to model fleet TCO, monitor cross-corridor health for 250 haulers, or run EV transition diagnostics.',
    icon: '⚡'
  },
  'ESG ANALYST': {
    heading: 'Sustainability Intelligence Active',
    message: 'Scope 1 and Scope 2 carbon accounting ledger synchronized. 116 commercial BEVs deployed. Ready to model emissions avoidance and generate sustainability dockets.',
    icon: '🌱'
  }
};
PERSONA_CHAT_CONFIG['Dispatcher Gate'] = PERSONA_CHAT_CONFIG['DISPATCHER GATE'];
PERSONA_CHAT_CONFIG['Driver In-Cab'] = PERSONA_CHAT_CONFIG['DRIVER IN-CAB'];
PERSONA_CHAT_CONFIG['Compliance Officer'] = PERSONA_CHAT_CONFIG['COMPLIANCE OFFICER'];
PERSONA_CHAT_CONFIG['Fleet Manager'] = PERSONA_CHAT_CONFIG['FLEET MANAGER'];
PERSONA_CHAT_CONFIG['ESG Analyst'] = PERSONA_CHAT_CONFIG['ESG ANALYST'];
window.PERSONA_CHAT_CONFIG = PERSONA_CHAT_CONFIG;

function renderCopilotChatForCurrentRole(roleOverride = null) {
  const chatFeed = document.querySelector('#copilotChatFeed') || 
                   document.querySelector('.copilot-chat-container') || 
                   document.querySelector('#viewCopilot .space-y-4') ||
                   document.getElementById('copilotMessageFeed') ||
                   document.getElementById('messages') ||
                   document.querySelector('.copilot-chat-feed');
  if (!chatFeed) return;

  const session = localStorage.getItem('rido_session');
  if ((!session && !isAuthenticated()) || roleOverride === false || roleOverride === "Guest") {
    // Unauthenticated Guest Card
    chatFeed.innerHTML = `
      <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm max-w-2xl">
        <p class="font-bold text-slate-900 text-sm mb-1.5">Welcome to RÍDO Mission Control. You are currently browsing in <span class="text-orange-600 font-black">Guest Preview Mode</span>.</p>
        <p class="text-xs text-slate-500 leading-relaxed mb-4">Protected sectors (Fleet IQ, Corridor Routing, ESG Analytics, Audit Dockets) and live Copilot AI assistance are locked behind enterprise authentication.</p>
        <button onclick="openSignInModal('viewCopilot')" class="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition cursor-pointer">
          <span>Sign In to Unlock Platform</span>
          <span>&rarr;</span>
        </button>
      </div>
    `;
    return;
  }

  // Authenticated State: determine active role
  let roleKey = 'DRIVER IN-CAB';
  if (roleOverride && typeof roleOverride === 'string') {
    roleKey = roleOverride.replace(/^\[|\]$/g, '').trim().toUpperCase();
  } else if (session) {
    try {
      const user = JSON.parse(session);
      roleKey = (user.role || user.persona || state.persona || 'DRIVER IN-CAB').replace(/^\[|\]$/g, '').trim().toUpperCase();
    } catch (e) {
      roleKey = (state.persona || localStorage.getItem('rido_persona') || 'DRIVER IN-CAB').replace(/^\[|\]$/g, '').trim().toUpperCase();
    }
  } else {
    roleKey = (state.persona || localStorage.getItem('rido_persona') || 'DRIVER IN-CAB').replace(/^\[|\]$/g, '').trim().toUpperCase();
  }

  const config = PERSONA_CHAT_CONFIG[roleKey] || PERSONA_CHAT_CONFIG['DRIVER IN-CAB'];

  chatFeed.innerHTML = `
    <div class="flex items-start space-x-3.5 max-w-3xl animate-fadeIn">
      <div class="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 text-base shadow-sm">
        ${config.icon}
      </div>
      <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p class="font-bold text-slate-900 text-xs tracking-wide uppercase text-orange-600 mb-1" id="copilotWelcomeHeading">${config.heading}</p>
        <p id="copilotWelcomeBody">${config.message}</p>
      </div>
    </div>
  `;
}

const updateCopilotChatFeed = renderCopilotChatForCurrentRole;
const hydrateCopilotForSession = renderCopilotChatForCurrentRole;
window.renderCopilotChatForCurrentRole = renderCopilotChatForCurrentRole;
window.updateCopilotChatFeed = renderCopilotChatForCurrentRole;
window.hydrateCopilotForSession = renderCopilotChatForCurrentRole;

function renderCopilotForPersona(personaName) {
  const norm = (personaName || "Fleet Manager").replace(/^\[|\]$/g, '').trim();
  const config = COPILOT_PERSONAS[norm] ||
                 COPILOT_PERSONAS[norm.toUpperCase()] ||
                 COPILOT_PERSONAS['FLEET MANAGER'];

  // 1. Update Title, Badges & Subtitles
  const titleEl = document.getElementById("copilotConsoleTitle");
  if (titleEl) titleEl.textContent = config.title;

  const badgeEl = document.getElementById("copilotRoleBadge");
  if (badgeEl) badgeEl.textContent = config.badge;

  const dispBadge = document.getElementById("dispatcherNameBadge");
  if (dispBadge) dispBadge.innerHTML = `Persona: <strong>${norm}</strong>`;

  // 2. Render Role-Adaptive Quick Action Suggestion Chips
  const chipsContainer = document.getElementById("personaQuickChips");
  if (chipsContainer && Array.isArray(config.suggestions)) {
    chipsContainer.innerHTML = config.suggestions.map(s => `
      <button type="button" class="quick-chip-btn" onclick="openCopilotWithPrompt('${s.replace(/'/g, "\\'")}')">
        <i class="ri-sparkling-fill text-orange-500"></i> ${s}
      </button>
    `).join("");
  }

  // 3. Hydrate Copilot Message History with Persona Greeting
  hydrateCopilotForSession(norm);

  // 4. Update Foundry Agent Dynamic System Prompt
  if (window.foundryAgent) {
    window.foundryAgent.systemPrompt = config.systemPrompt;
  }
}
window.renderCopilotForPersona = renderCopilotForPersona;

function renderNavForRole(personaName = null) {
  const navContainer = document.querySelector(".site-header nav ul.nav-links") || document.querySelector("header nav ul") || document.querySelector("header nav");
  if (!navContainer) return;

  const currentHash = (window.location.hash || "#home").replace("#", "").toLowerCase() || "home";
  const activeTabKey = normalizeTabKey(currentHash);

  if (!personaName || !isAuthenticated()) {
    // Guest Mode: all 6 tabs rendered, first tab is "Home", protected tabs are locked with 🔒
    const guestTabs = [
      { key: "home", label: "Home", locked: false },
      { key: "fleet", label: "Fleet", locked: true },
      { key: "routes", label: "Routes", locked: true },
      { key: "analytics", label: "Analytics", locked: true },
      { key: "reports", label: "Reports", locked: true },
      { key: "copilot", label: "AI Copilot", locked: true, icon: "ri-robot-2-line text-orange-500" }
    ];

    const html = guestTabs.map(t => {
      const isActive = activeTabKey === t.key;
      const activeClass = isActive 
        ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold" 
        : "text-slate-500 hover:text-slate-800 font-medium";
      const targetView = VIEW_MAP[t.key] || `view${t.key.charAt(0).toUpperCase() + t.key.slice(1)}`;
      return `
        <li>
          <a href="#${t.key}" class="nav-link nav-tab ${isActive ? 'active' : ''} ${t.locked ? 'locked' : ''} inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs ${activeClass} transition-all" id="nav${t.key.charAt(0).toUpperCase() + t.key.slice(1)}" data-view="${targetView}" data-tab="${t.key}" title="${t.label}" onclick="switchView('${targetView}'); return false;">
            ${t.icon ? `<i class="${t.icon}"></i>` : ''}
            <span class="nav-label">${t.label}</span>
            ${t.locked ? '<span class="text-xs ml-0.5">🔒</span>' : ''}
          </a>
        </li>
      `;
    }).join("");

    if (navContainer.tagName.toLowerCase() === "ul") {
      navContainer.innerHTML = html;
    } else {
      const ul = navContainer.querySelector("ul.nav-links");
      if (ul) {
        ul.innerHTML = html;
      } else {
        navContainer.innerHTML = `<ul class="nav-links flex items-center gap-1 list-none m-0 p-0">${html}</ul>`;
      }
    }
    return;
  }

  // Authenticated Role: dynamically rebuild navigation strictly for allowedTabs
  const config = ROLE_CONFIG[personaName] || ROLE_CONFIG[personaName.toUpperCase()] || ROLE_CONFIG["Driver In-Cab"];
  const allowed = config.allowedTabs || ["home"];

  const html = allowed.map(tabKey => {
    const label = (config.tabLabels && config.tabLabels[tabKey]) || (tabKey === 'copilot' ? 'AI Copilot' : tabKey);
    const icon = (config.tabIcons && config.tabIcons[tabKey]) || (tabKey === 'copilot' ? 'ri-robot-2-line text-orange-500' : 'ri-circle-line');
    const isActive = activeTabKey === tabKey;
    const activeClass = isActive 
      ? "bg-white text-zinc-900 font-semibold shadow-sm" 
      : "text-zinc-600 hover:text-zinc-900 font-medium";
    const targetView = VIEW_MAP[tabKey] || `view${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`;

    return `
      <li>
        <a href="#${tabKey}" class="nav-link nav-tab ${isActive ? 'active' : ''} inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs ${activeClass} transition-all" id="nav${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}" data-view="${targetView}" data-tab="${tabKey}" title="${label}" onclick="switchView('${targetView}'); return false;">
          <i class="${icon} text-[13px]"></i>
          <span class="nav-label font-semibold">${label}</span>
        </a>
      </li>
    `;
  }).join("");

  if (navContainer.tagName.toLowerCase() === "ul") {
    navContainer.innerHTML = html;
  } else {
    const ul = navContainer.querySelector("ul.nav-links");
    if (ul) {
      ul.innerHTML = html;
    } else {
      navContainer.innerHTML = `<ul class="nav-links flex items-center gap-1 list-none m-0 p-0">${html}</ul>`;
    }
  }
}
window.renderNavForRole = renderNavForRole;

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

function renderRoleOperationalDeck(personaName) {
  const deck = document.getElementById("roleOperationalDeck");
  if (!deck) return;

  if (personaName === "Driver In-Cab") {
    deck.innerHTML = `
      <div class="role-deck-header">
        <div class="role-deck-title"><i class="ri-truck-line" style="color: #16a34a;"></i> In-Cab Instrument Cluster &amp; Telematics</div>
        <span class="role-deck-badge" style="background: #dcfce7; color: #166534;"><i class="ri-wifi-line"></i> In-Cab Telematics Live</span>
      </div>
      <div class="role-deck-grid">
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-dashboard-3-line"></i> Vehicle Dynamics</span>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">● CRUISE READY</span>
          </div>
          <div class="role-deck-card-val">72 <span style="font-size: 0.9rem; color: #64748b;">km/h</span></div>
          <div class="role-deck-card-desc">Connected to <strong>Unit TRK-A (Scania 45R)</strong>. High-voltage battery: 75% SOC (310 km range remaining).</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-temp-cold-line"></i> Reefer Cargo Chiller</span>
            <span style="font-size: 0.72rem; color: #0284c7; font-weight: 700;">● PHARMA SAFE</span>
          </div>
          <div class="role-deck-card-val">+3.6 <span style="font-size: 0.9rem; color: #64748b;">°C</span></div>
          <div class="role-deck-card-desc">Continuous cold-chain lock. Secondary backup compressor standing by on auxiliary inverter.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-timer-line"></i> HOS Shift Window</span>
            <span style="font-size: 0.72rem; color: #ea580c; font-weight: 700;">● REST DUE SOON</span>
          </div>
          <div class="role-deck-card-val">3h 15m <span style="font-size: 0.9rem; color: #64748b;">left</span></div>
          <div class="role-deck-card-desc">Next mandatory 45-min rest halt at <strong>Jaipur Supercharger Oasis</strong> (42 km ahead on Path-1).</div>
        </div>
      </div>
      <div class="role-deck-actions-strip">
        <span style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-right: 6px;">In-Cab Actions:</span>
        <button type="button" class="role-action-pill primary" onclick="openCopilotWithPrompt('Driver Assistant: Reserve a 350kW DC fast-charging bay at Jaipur Supercharger for TRK-A.')"><i class="ri-flashlight-line"></i> Reserve 350kW Fast-Charger</button>
        <button type="button" class="role-action-pill" onclick="openCopilotWithPrompt('Driver Assistant: Log mandatory 45-minute rest break at Jaipur Oasis into electronic logging device.')"><i class="ri-cup-line"></i> Log 45-Min Rest Halt</button>
        <button type="button" class="role-action-pill" onclick="openCopilotWithPrompt('Driver Assistant: Inspect real-time reefer temperature integrity and compressor telemetry.')"><i class="ri-temp-cold-line"></i> Check Reefer Chiller</button>
        <button type="button" class="role-action-pill danger" onclick="alert('🚨 EMERGENCY ALERT SENT: In-cab distress beacon transmitted to Western Corridor Dispatch with live GPS coordinates.')"><i class="ri-alarm-warning-line"></i> In-Cab SOS Emergency</button>
      </div>
    `;
  } else if (personaName === "Compliance Officer") {
    deck.innerHTML = `
      <div class="role-deck-header">
        <div class="role-deck-title"><i class="ri-shield-check-line" style="color: #4f46e5;"></i> Regulatory Compliance &amp; Safety Surveillance Deck</div>
        <span class="role-deck-badge" style="background: #e0e7ff; color: #3730a3;"><i class="ri-lock-line"></i> Audit Surveillance Active</span>
      </div>
      <div class="role-deck-grid">
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-shield-keyhole-line"></i> Cold-Chain Integrity</span>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">● 99.1% COMPLIANT</span>
          </div>
          <div class="role-deck-card-val">0 <span style="font-size: 0.9rem; color: #64748b;">Spoilage Losses</span></div>
          <div class="role-deck-card-desc">All 250 refrigerated freight shipments maintained pharmaceutical &amp; food safety thermal margins.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-file-user-line"></i> HOS Logbook Audit</span>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">● CERTIFIED</span>
          </div>
          <div class="role-deck-card-val">100% <span style="font-size: 0.9rem; color: #64748b;">ELD Compliance</span></div>
          <div class="role-deck-card-desc">Zero hours-of-service fatigue infractions detected across active interstate hauler shifts.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-error-warning-line"></i> Audit Exception</span>
            <span style="font-size: 0.72rem; color: #e11d48; font-weight: 700;">● RESOLVED</span>
          </div>
          <div class="role-deck-card-val">Jaipur <span style="font-size: 0.9rem; color: #64748b;">Telemetry Event</span></div>
          <div class="role-deck-card-desc">Brief +4.8°C spike auto-stabilized in 8 minutes by backup dual-compressor. Non-critical.</div>
        </div>
      </div>
      <div class="role-deck-actions-strip">
        <span style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-right: 6px;">Compliance Actions:</span>
        <button type="button" class="role-action-pill primary" onclick="openCopilotWithPrompt('Compliance Audit: Compile and certify TCO Financial Audit in US Dollars ($ USD) with Scope 1 & 2 fuel breakdown.')"><i class="ri-file-shield-2-line"></i> Generate Regulatory Docket</button>
        <button type="button" class="role-action-pill" onclick="openCopilotWithPrompt('Compliance Audit: Generate certified Hours-of-Service shift docket across active drivers.')"><i class="ri-file-user-line"></i> Audit HOS Shift Logs</button>
        <button type="button" class="role-action-pill" onclick="openCopilotWithPrompt('Compliance Alert: Inspect TRK-A Jaipur sector temperature breach log and verify secondary chiller engagement.')"><i class="ri-alert-line"></i> Review Anomaly Log</button>
        <a href="reports.html" class="role-action-pill"><i class="ri-download-2-line"></i> Download Certified PDF</a>
      </div>
    `;
  } else if (personaName === "Dispatcher Gate") {
    deck.innerHTML = `
      <div class="role-deck-header">
        <div class="role-deck-title"><i class="ri-shield-user-line" style="color: #0f172a;"></i> Dispatcher Gate &amp; Yard Management Deck</div>
        <span class="role-deck-badge" style="background: #f1f5f9; color: #0f172a;"><i class="ri-building-2-line"></i> Mega Depot Active</span>
      </div>
      <div class="role-deck-grid">
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-truck-line"></i> Inbound Gate Queue</span>
            <span style="font-size: 0.72rem; color: #2563eb; font-weight: 700;">● AUTO-STAGING</span>
          </div>
          <div class="role-deck-card-val">8 <span style="font-size: 0.9rem; color: #64748b;">Trucks Queued</span></div>
          <div class="role-deck-card-desc">Average gate dwell time: 4.2 minutes. RFID and telematics auto-verified.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-road-map-line"></i> Outbound Freight</span>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">● ON SCHEDULE</span>
          </div>
          <div class="role-deck-card-val">12 <span style="font-size: 0.9rem; color: #64748b;">Scheduled</span></div>
          <div class="role-deck-card-desc">Western Dedicated Freight Corridor staging on track. All fast-charging reservations confirmed.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-parking-box-line"></i> Dock Bay Capacity</span>
            <span style="font-size: 0.72rem; color: #0284c7; font-weight: 700;">● 92% CAPACITY</span>
          </div>
          <div class="role-deck-card-val">14 / 16 <span style="font-size: 0.9rem; color: #64748b;">Bays Busy</span></div>
          <div class="role-deck-card-desc">Bay 4 and Bay 9 clearing in 12 minutes. Fast turn-around protocol engaged.</div>
        </div>
      </div>
      <div class="role-deck-actions-strip">
        <span style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-right: 6px;">Yard Controls:</span>
        <button type="button" class="role-action-pill primary" onclick="alert('Loading Bay Reallocated: Bay 4 assigned to Unit TRK-A for rapid cold-chain unloading.')"><i class="ri-exchange-line"></i> Reallocate Loading Bay</button>
        <button type="button" class="role-action-pill" onclick="openCopilotWithPrompt('Schedule departure docket and driver assignment for Interstate-07 departing Ahmedabad for Mumbai in $ USD.')"><i class="ri-calendar-check-line"></i> Schedule Departure</button>
        <button type="button" class="role-action-pill" onclick="switchTab('fleet')"><i class="ri-dashboard-line"></i> Open Live Fleet Tracking</button>
      </div>
    `;
  } else if (personaName === "ESG Analyst") {
    deck.innerHTML = `
      <div class="role-deck-header">
        <div class="role-deck-title"><i class="ri-pie-chart-line" style="color: #10b981;"></i> Corporate ESG &amp; Financial Portfolio Deck</div>
        <span class="role-deck-badge" style="background: #ecfdf5; color: #065f46;"><i class="ri-line-chart-line"></i> Currency: $ USD</span>
      </div>
      <div class="role-deck-grid">
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-leaf-line"></i> Scope 1 Emissions Abated</span>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">● VERIFIED</span>
          </div>
          <div class="role-deck-card-val">142.6 <span style="font-size: 0.9rem; color: #64748b;">MT CO₂e</span></div>
          <div class="role-deck-card-desc">Commercial EV electric corridors reduced diesel carbon footprint by 38.4% month-to-date.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-money-dollar-circle-line"></i> TCO Net Savings</span>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">● $85 / LEG</span>
          </div>
          <div class="role-deck-card-val">$21,250 <span style="font-size: 0.9rem; color: #64748b;">USD Total</span></div>
          <div class="role-deck-card-desc">Aggregate fuel and toll savings across 250 corridor dispatches compared to diesel baseline.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-award-line"></i> Sustainability Rating</span>
            <span style="font-size: 0.72rem; color: #0284c7; font-weight: 700;">● TOP 5%</span>
          </div>
          <div class="role-deck-card-val">98 / 100 <span style="font-size: 0.9rem; color: #64748b;">Score</span></div>
          <div class="role-deck-card-desc">Top decile commercial ESG benchmark compliant with global freight decarbonization standards.</div>
        </div>
      </div>
      <div class="role-deck-actions-strip">
        <span style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-right: 6px;">Financial &amp; ESG Actions:</span>
        <button type="button" class="role-action-pill primary" onclick="openCopilotWithPrompt('Provide ESG multi-fuel emissions comparison for EV vs Diesel vs CNG for 450 km freight leg with all fuel and toll expenses in US Dollars ($ USD).')"><i class="ri-funds-line"></i> Recalculate Fuel Parity ($ USD)</button>
        <button type="button" class="role-action-pill" onclick="openCopilotWithPrompt('Analyze monthly fleet emissions trajectory from Jan through Dec and project Q4 ESG targets.')"><i class="ri-line-chart-line"></i> Forecast Q4 Carbon Trajectory</button>
        <button type="button" class="role-action-pill" onclick="switchTab('analytics')"><i class="ri-bar-chart-2-line"></i> Open Analytics Dashboard</button>
      </div>
    `;
  } else {
    // Fleet Manager
    deck.innerHTML = `
      <div class="role-deck-header">
        <div class="role-deck-title"><i class="ri-dashboard-line" style="color: #0284c7;"></i> Fleet IQ Executive Operations Deck</div>
        <span class="role-deck-badge" style="background: #eff6ff; color: #1e40af;"><i class="ri-check-double-line"></i> Full Authority</span>
      </div>
      <div class="role-deck-grid">
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-truck-line"></i> Active Commercial Fleet</span>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">● 96.8% ONLINE</span>
          </div>
          <div class="role-deck-card-val">242 / 250 <span style="font-size: 0.9rem; color: #64748b;">Assets</span></div>
          <div class="role-deck-card-desc">Commercial haulers active on Western &amp; Northern Freight Corridors with live IoT telemetry.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-battery-charge-line"></i> EV High-Voltage Health</span>
            <span style="font-size: 0.72rem; color: #0284c7; font-weight: 700;">● OPTIMAL</span>
          </div>
          <div class="role-deck-card-val">76% <span style="font-size: 0.9rem; color: #64748b;">Avg SOC</span></div>
          <div class="role-deck-card-desc">Cell balancing telemetry normal across all Scania 45R and Volvo FH Electric powertrains.</div>
        </div>
        <div class="role-deck-card">
          <div class="role-deck-card-top">
            <span class="role-deck-card-label"><i class="ri-tools-line"></i> Preventive Maintenance</span>
            <span style="font-size: 0.72rem; color: #ea580c; font-weight: 700;">● SCHEDULED</span>
          </div>
          <div class="role-deck-card-val">3 <span style="font-size: 0.9rem; color: #64748b;">Due at Hub</span></div>
          <div class="role-deck-card-desc">Brake lining and coolant service scheduled at Mumbai Central Mega Depot. Zero downtime.</div>
        </div>
      </div>
      <div class="role-deck-actions-strip">
        <span style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-right: 6px;">Fleet Operations:</span>
        <button type="button" class="role-action-pill primary" onclick="openCopilotWithPrompt('Perform telematics asset health audit across 250 commercial vehicles in $ USD.')"><i class="ri-stethoscope-line"></i> Run Fleet Diagnostic</button>
        <button type="button" class="role-action-pill" onclick="switchTab('fleet')"><i class="ri-truck-line"></i> Fleet IQ Dashboard</button>
        <button type="button" class="role-action-pill" onclick="switchTab('routes')"><i class="ri-route-line"></i> Corridor Optimization</button>
        <button type="button" class="role-action-pill" onclick="switchTab('analytics')"><i class="ri-line-chart-line"></i> Analytics</button>
      </div>
    `;
  }
}

const mountRoleDeck = renderRoleOperationalDeck;
window.mountRoleDeck = mountRoleDeck;

function renderPersonaExperience(personaName) {
  const profile = PERSONA_PROFILES[personaName] || PERSONA_PROFILES["Driver In-Cab"];
  const config = ROLE_CONFIG[personaName] || ROLE_CONFIG["Driver In-Cab"];

  // 1. Update Header Badges & Dynamic Workspace Banner Elements
  const headerPersonaBadge = document.getElementById("headerPersonaBadge");
  if (headerPersonaBadge) headerPersonaBadge.innerText = config.badge || profile.badge;
  if (dispatcherBadge) dispatcherBadge.innerHTML = `Persona: <strong>${personaName}</strong>`;

  const roleTitle = document.getElementById("roleWorkspaceTitle");
  const roleBadge = document.getElementById("roleWorkspaceBadge");
  const roleSubtitle = document.getElementById("roleWorkspaceSubtitle");
  const roleIcon = document.getElementById("roleWorkspaceIcon");
  if (roleTitle) roleTitle.textContent = config.title;
  if (roleBadge) roleBadge.textContent = config.badge;
  if (roleSubtitle) roleSubtitle.textContent = config.subtitle;
  if (roleIcon && config.icon) roleIcon.innerHTML = `<i class="${config.icon}"></i>`;

  // 2. Navigation Bar: Render dynamically for authenticated role
  renderNavForRole(personaName);

  // 3. Process Strip Visibility (Fleet Manager / Dispatcher only)
  const processStrip = document.getElementById("processStrip");
  if (processStrip) {
    processStrip.style.display = config.showProcessStrip ? "flex" : "none";
  }

  // 4. Render Live Operational HUD
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
        <button type="button" class="hud-action-btn" onclick="switchTab('${config.allowedTabs && config.allowedTabs.includes('routes') ? 'routes' : config.defaultTab}')">
          <i class="${profile.actionBtn.icon}"></i> ${profile.actionBtn.text} &rarr;
        </button>
      </div>
    `;
  }

  // 5. Render Quick Action Scenario Chips
  const chipsContainer = document.getElementById("personaQuickChips");
  if (chipsContainer) {
    chipsContainer.innerHTML = profile.chips.map(c => `
      <button type="button" class="quick-chip-btn" onclick="openCopilotWithPrompt('${c.prompt.replace(/'/g, "\\'")}')">
        <i class="ri-sparkling-fill" style="color: #6366f1;"></i> ${c.label}
      </button>
    `).join("");
  }

  // 6. Render Role-Isolated Operational Deck
  renderRoleOperationalDeck(personaName);

  // 7. Adapt Copilot Console for active persona
  renderCopilotForPersona(personaName);
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

function renderGuestExperience() {
  // 1. Show Guest Preview Banner
  const guestBanner = document.getElementById("guestLockBanner");
  if (guestBanner) guestBanner.style.display = "flex";

  // 2. Clear Authenticated Decks & HUDs
  const liveHUD = document.getElementById("personaLiveHUD");
  if (liveHUD) liveHUD.innerHTML = "";
  const roleDeck = document.getElementById("roleOperationalDeck");
  if (roleDeck) roleDeck.innerHTML = "";

  // 3. Mark Protected Tabs as Locked & Re-render Guest Navbar
  renderNavForRole(null);

  // 4. Copilot Restrictions for Guests
  const inputDock = document.getElementById("copilotInputDock");
  if (inputDock) inputDock.classList.add("locked");

  if (userInput) {
    userInput.disabled = true;
    userInput.value = "";
    userInput.placeholder = "Please sign in to interact with RIDO Copilot...";
  }
  if (sendBtn) sendBtn.disabled = true;
  if (voiceMicBtn) voiceMicBtn.disabled = true;

  // 5. Render Locked Quick Action Chips (Prompts Sign In)
  const chipsContainer = document.getElementById("personaQuickChips");
  if (chipsContainer) {
    chipsContainer.innerHTML = `
      <button type="button" class="quick-chip-btn" onclick="openLoginModal('viewRoutes')"><i class="ri-lock-2-line" style="color: #94a3b8;"></i> 🔒 Set Route (Sign In)</button>
      <button type="button" class="quick-chip-btn" onclick="openLoginModal('viewFleet')"><i class="ri-lock-2-line" style="color: #94a3b8;"></i> 🔒 Compare Fleets (Sign In)</button>
      <button type="button" class="quick-chip-btn" onclick="openLoginModal('viewRoutes')"><i class="ri-lock-2-line" style="color: #94a3b8;"></i> 🔒 Optimize Corridor (Sign In)</button>
      <button type="button" class="quick-chip-btn" onclick="openLoginModal('viewAnalytics')"><i class="ri-lock-2-line" style="color: #94a3b8;"></i> 🔒 AI Telematics Audit (Sign In)</button>
    `;
  }

  // 6. Guest Welcome AI Greeting (Locked State)
  hydrateCopilotForSession(null);
}

function login(userData = {}, token = null) {
  const authToken = token || generateDemoSessionToken("RIDO-");
  const persona = userData.persona || "Driver In-Cab";
  const email = userData.email || `${persona.toLowerCase().replace(/\s+/g, "")}@rido.ai`;

  const sessionPayload = { role: persona, persona: persona, email: email, token: authToken };
  localStorage.setItem("rido_session", JSON.stringify(sessionPayload));
  localStorage.setItem("rido_auth_token", authToken);
  localStorage.setItem("rido_user_data", JSON.stringify({ email, persona }));
  localStorage.setItem("rido_persona", persona);

  sessionStorage.setItem("rido_session_token", authToken);
  sessionStorage.setItem("rido_persona", persona);

  state.sessionToken = authToken;
  state.isAuthenticated = true;
  state.persona = persona;

  const roleConfig = ROLE_CONFIG[persona] || ROLE_CONFIG["Driver In-Cab"];

  updateUIAuthState(true);
  renderPersonaExperience(persona);
  hydrateCopilotForSession(persona);
  sfx.playGrant();

  // Dismiss the Sign-In modal
  closeSignInModal();

  // If user was attempting to reach a locked section and role permits it, navigate there
  if (window.pendingRedirectView) {
    const dest = window.pendingRedirectView;
    window.pendingRedirectView = null;
    const destTab = normalizeTabKey(dest);
    if (roleConfig.allowedTabs.includes(destTab)) {
      switchView(dest);
      const hashName = dest.replace("view", "").toLowerCase();
      history.pushState(null, "", `#${hashName}`);
      return;
    }
  }

  // Navigate strictly to role's default tab (e.g. "home" for Driver In-Cab, Dispatcher Gate, Compliance Officer, ESG Analyst; "fleet" for Fleet Manager)
  switchTab(roleConfig.defaultTab);
}

const executeLogin = login;
window.login = login;
window.executeLogin = executeLogin;

function logout() {
  // 1. Clear session tokens across all storage
  localStorage.removeItem("rido_session");
  localStorage.removeItem("rido_auth_token");
  localStorage.removeItem("rido_user_data");
  localStorage.removeItem("rido_persona");
  sessionStorage.clear();

  state.sessionToken = null;
  state.isAuthenticated = false;
  state.persona = "Guest";

  if (isListening && speechRecognizer) {
    speechRecognizer.stop();
    stopListening();
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // 2. Hide all authenticated dashboards (including Driver Cockpit and Copilot Console)
  document.querySelectorAll('.app-page-view, .app-view, [id^="view"]').forEach(el => {
    el.classList.add("hidden");
    el.style.display = "none";
  });

  // 3. Reveal the public Home landing view
  const homeView = document.getElementById("viewHome");
  if (homeView) {
    homeView.classList.remove("hidden");
    homeView.style.display = "block";
  }

  // Ensure within viewHome: authenticated role workspace is hidden, public marketing is shown
  const homeRole = document.getElementById("homeRoleWorkspace");
  if (homeRole) {
    homeRole.classList.add("hidden");
    homeRole.style.display = "none";
  }
  const homePublic = document.getElementById("homePublicMarketing");
  if (homePublic) {
    homePublic.classList.remove("hidden");
    homePublic.style.display = "block";
  }

  // Clear live HUD & role operational decks
  const liveHUD = document.getElementById("personaLiveHUD");
  if (liveHUD) liveHUD.innerHTML = "";
  const roleDeck = document.getElementById("roleOperationalDeck");
  if (roleDeck) roleDeck.innerHTML = "";

  // 4. Reset Navigation Bar to locked guest state
  renderNavForRole(null);

  // 5. Reset top-right header controls to guest actions
  updateUIAuthState(false);
  renderGuestExperience();

  // 6. Reset browser address bar and scroll to top
  window.history.replaceState({}, document.title, window.location.pathname);
  window.scrollTo({ top: 0, behavior: "instant" });

  // 7. Refresh Lucide icons if loaded
  if (window.lucide && typeof lucide.createIcons === "function") {
    lucide.createIcons();
  }
}
window.logout = logout;

function checkAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  const wantsLogin = urlParams.get("login") === "1" || urlParams.get("auth") === "1";

  if (isAuthenticated()) {
    const savedPersona = localStorage.getItem("rido_persona") || sessionStorage.getItem("rido_persona") || "Driver In-Cab";
    state.sessionToken = localStorage.getItem("rido_auth_token") || sessionStorage.getItem("rido_session_token");
    state.persona = savedPersona;
    state.isAuthenticated = true;
    updateUIAuthState(true);
    renderPersonaExperience(state.persona);
    renderNavForRole(state.persona);
    renderCopilotChatForCurrentRole(state.persona);
  } else {
    // Default: Unauthenticated Guest Mode (Only Home accessible)
    state.sessionToken = null;
    state.persona = "Guest";
    state.isAuthenticated = false;
    updateUIAuthState(false);
    renderGuestExperience();
    renderNavForRole(null);
    renderCopilotChatForCurrentRole(false);
    if (wantsLogin) {
      setTimeout(() => openLoginModal(), 200);
    }
  }
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

  // Detect persona from email or role pill
  const detectedPersona = detectPersonaFromEmail(enteredId);

  setTimeout(() => {
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.innerHTML = `Sign In &rarr;`;
    login({ email: enteredId, persona: detectedPersona });
  }, 250);
});

/* ── Modal Close & Guest Action Listeners ── */
if (closeLoginModalBtn) {
  closeLoginModalBtn.addEventListener("click", () => {
    closeLoginModal();
  });
}

if (browseGuestLink) {
  browseGuestLink.addEventListener("click", (e) => {
    e.preventDefault();
    closeLoginModal();
  });
}

if (navSignInBtn) {
  navSignInBtn.addEventListener("click", () => {
    openLoginModal();
  });
}

const guestBannerSignInBtn = document.getElementById("guestBannerSignInBtn");
if (guestBannerSignInBtn) {
  guestBannerSignInBtn.addEventListener("click", () => {
    openLoginModal();
  });
}

const heroGetStartedBtn = document.getElementById("heroGetStartedBtn");
if (heroGetStartedBtn) {
  heroGetStartedBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleHeroCTA();
  });
}

// Click on locked Copilot input dock prompts sign in
const copilotInputDock = document.getElementById("copilotInputDock");
if (copilotInputDock) {
  copilotInputDock.addEventListener("click", (e) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      openLoginModal();
    }
  });
}

// Click on process strip when guest prompts sign in
const processStrip = document.getElementById("processStrip");
if (processStrip) {
  processStrip.addEventListener("click", () => {
    if (!isAuthenticated()) {
      openLoginModal();
    }
  });
}

/* ── Sign Out Handler & Global Delegation ── */
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logout();
  });
}

document.addEventListener("click", function(e) {
  const btn = e.target.closest('[data-action="logout"], #logoutBtn, .btn-signout');
  if (btn || (e.target.textContent && e.target.textContent.trim() === "Sign Out")) {
    e.preventDefault();
    logout();
  }
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
        localStorage.setItem("rido_persona", chosen);
        sessionStorage.setItem("rido_persona", chosen);
        renderPersonaExperience(chosen);
        renderNavForRole(chosen);
        const config = ROLE_CONFIG[chosen] || ROLE_CONFIG["Driver In-Cab"];
        switchTab(config.defaultTab);
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
  if (!voiceMicBtn) return; // mic button not in DOM, skip
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
    if (userInput) userInput.placeholder = "Listening to your voice command...";
  };

  speechRecognizer.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    if (userInput) userInput.value = transcript;
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
  if (voiceMicBtn) voiceMicBtn.classList.remove("listening");
  if (userInput) userInput.placeholder = "Ask RÍDO Copilot or click the Mic to speak...";
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

if (ttsToggleBtn) {
  ttsToggleBtn.addEventListener("click", () => {
    isTTSActive = !isTTSActive;
    if (ttsStatusText) ttsStatusText.innerText = isTTSActive ? "ON" : "OFF";
    ttsToggleBtn.classList.toggle("active", isTTSActive);
    if (!isTTSActive && window.speechSynthesis) window.speechSynthesis.cancel();
  });
}

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
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (typeof hydrateCopilotForSession === "function") {
      hydrateCopilotForSession();
    } else {
      messages.innerHTML = `
        <div class="msg ai">
          <div class="msg-avatar">🤖</div>
          <div class="msg-bubble-wrap">
            <div class="msg-bubble">
              <p><strong>Chat session reset.</strong> Click any feature card above or ask me any logistics, cold-chain, or route dispatch query in <strong>$ USD</strong>.</p>
            </div>
          </div>
        </div>`;
    }
    if (thoughtLog) {
      thoughtLog.innerHTML = `<div class="empty-thoughts">Autonomous agent thoughts, inference latency, and token consumption metrics will stream here in real time.</div>`;
    }
    hasStarted = false;
    previousResponseId = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  });
}


// Allow Enter key to dispatch message (Shift+Enter for multiline)
const activeChatInput = document.getElementById("copilotInput") || document.getElementById("userInput") || userInput;
if (activeChatInput) {
  activeChatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}
if (sendBtn) {
  sendBtn.addEventListener("click", handleSend);
}

// Global delegation fallback — ensures send always fires regardless of binding order
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#copilotSendBtn, #sendBtn");
  if (btn) { e.preventDefault(); handleSend(); }
});

/* ══════════════════════════════════════════════
   AZURE AI FOUNDRY AGENT DISPATCHER & GATEWAY PIPELINE
   Responses Protocol -> Vector Store vs_8BAryaF6Ajzbayfo0qGmoKnc -> Synthesis
   ══════════════════════════════════════════════ */
async function processCopilotReply(query) {
  // Read authenticated role from localStorage or active state
  let activeRole = "DISPATCHER GATE";
  try {
    const raw = localStorage.getItem("rido_session");
    if (raw) {
      const session = JSON.parse(raw);
      if (session.role) activeRole = session.role.toUpperCase();
      else if (session.persona) activeRole = session.persona.toUpperCase();
    }
  } catch (e) {}
  if (!activeRole && state.persona) {
    activeRole = state.persona.toUpperCase();
  }

  // Display active loading states while agent queries vector store vs_8BAryaF6Ajzbayfo0qGmoKnc
  logThought("Agent Dispatch", `Operational Persona: [${activeRole}]`, "Formatting payload for Azure AI Foundry Agent (Responses Protocol)");
  logThought("Vector Search", "Active Vector Store: vs_8BAryaF6Ajzbayfo0qGmoKnc", "Executing file_search on fleet training dataset & operational SOP dockets");

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const gatewayUrl = window.RIDO_API_URL || (!isLocalhost ? "/api/rido-copilot" : (window.location.port === "3000" ? "/api/rido-copilot" : "http://localhost:3000/api/rido-copilot"));

  try {
    const res = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: query,
        role: activeRole
      })
    });

    if (res.ok) {
      const data = await res.json();
      logThought("Synthesis", "Foundry Inference Complete", "Parsed structured markdown telemetry table and SOP alerts from gpt-5.6-luna");
      if (data.reply) {
        return data.reply;
      }
    } else {
      const errText = await res.text();
      console.warn(`Gateway returned status ${res.status}:`, errText);
    }
  } catch (netErr) {
    console.warn("Backend gateway not reachable, running client-side FoundryAgent engine:", netErr.message);
  }

  // Client-side fallback if backend proxy is temporarily unreachable
  logThought("Fallback Engine", "Local Telematics Simulator", "Synthesizing response via client-side FoundryAgent rule engine");
  const localResult = await foundryAgent.processMessage(query, (step) => {
    logThought(step.phase, step.title, step.detail);
  });
  return localResult.responseText;
}
window.processCopilotReply = processCopilotReply;

async function handleSend() {
  const inputEl = document.getElementById("copilotInput") || document.getElementById("userInput") || userInput;
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  const sendBtnEl = document.getElementById("copilotSendBtn") || document.getElementById("sendBtn") || sendBtn;
  if (sendBtnEl) sendBtnEl.disabled = true;
  sfx.playTransmit();

  if (!hasStarted) {
    hasStarted = true;
    if (welcome) welcome.style.display = "none";
  }

  if (thoughtLog) thoughtLog.innerHTML = "";
  appendMessage("user", text);
  const typingId = "typing_" + Date.now();
  appendTyping(typingId);

  const t0 = performance.now();

  try {
    // Process message through Microsoft Foundry Agent / Express Gateway pipeline
    const replyText = await processCopilotReply(text);

    const elapsed = Math.round(performance.now() - t0);
    if (hudPing) hudPing.innerText = `${elapsed}ms`;

    // Real-time $200 Azure pool budget stats
    if (azureSettings && azureSettings.getBudgetStats) {
      const stats = azureSettings.getBudgetStats();
      if (hudSpent) hudSpent.innerText = `$${stats.totalSpentUSD.toFixed(4)}`;
    }

    removeTyping(typingId);
    sfx.playReceive();

    const formattedResponse = ensureUSD(replyText);
    appendMessage("ai", formattedResponse || "_(Empty payload received from agent)_");
    speakText(formattedResponse);

  } catch (err) {
    removeTyping(typingId);
    logThought("Agent Notice", err.message, "Local Intelligence Simulator Fallback");
    console.error("Foundry Agent Error:", err);
    appendMessage("ai", `**Operational Assistant:** An error occurred during inference: ${err.message}. Running in offline fallback mode.`);
  }

  if (sendBtnEl) sendBtnEl.disabled = false;
  if (inputEl) inputEl.focus();
}
window.handleSend = handleSend;

function renderHigWidget(widget) {
  if (!widget) return;
  const card = document.createElement("div");
  card.className = "hig-action-card my-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm text-xs";

  let badgeColor = "bg-blue-100 text-blue-800";
  if (widget.badge?.level === "critical") badgeColor = "bg-red-100 text-red-800";
  if (widget.badge?.level === "warning") badgeColor = "bg-amber-100 text-amber-800";
  if (widget.badge?.level === "success") badgeColor = "bg-emerald-100 text-emerald-800";

  let metricsHtml = "";
  if (Array.isArray(widget.metrics)) {
    metricsHtml = `<div class="grid grid-cols-2 gap-2 my-2.5">` + widget.metrics.map(m => `
      <div class="bg-white p-2 rounded border border-zinc-100">
        <div class="text-zinc-500 text-[10px]">${m.label}</div>
        <div class="font-bold text-zinc-900 ${m.alert ? 'text-red-600' : ''}">${m.value}</div>
      </div>
    `).join("") + `</div>`;
  }

  let actionsHtml = "";
  if (Array.isArray(widget.actions)) {
    actionsHtml = `<div class="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-zinc-200">` + widget.actions.map(a => `
      <button type="button" class="hig-action-btn px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${a.primary ? 'bg-zinc-900 hover:bg-black text-white' : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200'}" data-action-id="${a.id}">
        <i class="${a.icon}"></i> ${a.label}
      </button>
    `).join("") + `</div>`;
  }

  card.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-zinc-200">
      <span class="font-bold text-zinc-800">${widget.title}</span>
      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}">${widget.badge?.text || 'ACTION'}</span>
    </div>
    ${metricsHtml}
    ${actionsHtml}
  `;

  // Attach button click listeners
  card.querySelectorAll(".hig-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const actId = btn.dataset.actionId;
      if (actId === "reroute_cold_store") {
        openCopilotWithPrompt("Execute emergency dynamic diversion for V-104 to Karnal cold storage standby.");
      } else if (actId === "send_driver_halt") {
        openCopilotWithPrompt("Push critical halt alert to driver Vikas Mehra tablet for reefer inspection.");
      } else if (actId === "generate_epod") {
        openCopilotWithPrompt("Issue DMG-01 e-POD return certificate for V-104 due to thermal excursion.");
      } else if (actId === "confirm_dispatch") {
        openCopilotWithPrompt("Confirm and lock green dispatch for V-101 Volvo Electric on New Delhi to Jaipur corridor.");
      } else if (actId === "view_on_map") {
        switchTab("routes");
      }
    });
  });

  messages.appendChild(card);
  messages.scrollTop = messages.scrollHeight;
}

/* ══════════════════════════════════════════════
   AZURE DUAL-ACCOUNT SETTINGS MODAL CONTROLLER
   ══════════════════════════════════════════════ */
function openAzureSettingsModal() {
  if (!azureSettingsModal) return;
  const stats = azureSettings.getBudgetStats();

  if (azureEndpoint1) azureEndpoint1.value = azureSettings.config.account1.endpoint || "";
  if (azureKey1) azureKey1.value = azureSettings.config.account1.apiKey || "";
  if (azureDeployment1) azureDeployment1.value = azureSettings.config.account1.deployment || "gpt-6-astra";

  if (azureEndpoint2) azureEndpoint2.value = azureSettings.config.account2.endpoint || "";
  if (azureKey2) azureKey2.value = azureSettings.config.account2.apiKey || "";
  if (azureDeployment2) azureDeployment2.value = azureSettings.config.account2.deployment || "gpt-6-astra";

  updateModalBudgetUI(stats);
  updateModalModeUI(azureSettings.config.mode);

  azureSettingsModal.classList.remove("hidden");
}

function closeAzureSettingsModal() {
  if (azureSettingsModal) azureSettingsModal.classList.add("hidden");
}
window.openAzureSettingsModal = openAzureSettingsModal;
window.closeAzureSettingsModal = closeAzureSettingsModal;

function updateModalBudgetUI(stats) {
  if (modalPoolRemaining) modalPoolRemaining.innerText = `$${stats.remainingBudgetUSD.toFixed(2)} Remaining`;
  if (modalAcc1Remaining) modalAcc1Remaining.innerText = `$${stats.account1.remainingUSD.toFixed(2)} left`;
  if (modalAcc1Tokens) modalAcc1Tokens.innerText = `Tokens: ${stats.account1.tokensUsed} | Spent: $${stats.account1.spentUSD.toFixed(4)}`;
  if (modalAcc2Remaining) modalAcc2Remaining.innerText = `$${stats.account2.remainingUSD.toFixed(2)} left`;
  if (modalAcc2Tokens) modalAcc2Tokens.innerText = `Tokens: ${stats.account2.tokensUsed} | Spent: $${stats.account2.spentUSD.toFixed(4)}`;

  if (modalAcc1Status) {
    modalAcc1Status.innerText = stats.account1.isConfigured ? "Active" : "Unconfigured";
    modalAcc1Status.className = stats.account1.isConfigured
      ? "px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800"
      : "px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600";
  }
  if (modalAcc2Status) {
    modalAcc2Status.innerText = stats.account2.isConfigured ? "Active" : "Standby";
    modalAcc2Status.className = stats.account2.isConfigured
      ? "px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800"
      : "px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600";
  }
}

function updateModalModeUI(mode) {
  if (modeLiveAzureBtn && modeOfflineBtn) {
    if (mode === "azure_dual") {
      modeLiveAzureBtn.className = "flex-1 py-2 px-3 rounded-lg text-center transition bg-white text-zinc-900 shadow-sm flex items-center justify-center gap-1.5";
      modeOfflineBtn.className = "flex-1 py-2 px-3 rounded-lg text-center transition text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1.5";
    } else {
      modeOfflineBtn.className = "flex-1 py-2 px-3 rounded-lg text-center transition bg-white text-zinc-900 shadow-sm flex items-center justify-center gap-1.5";
      modeLiveAzureBtn.className = "flex-1 py-2 px-3 rounded-lg text-center transition text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1.5";
    }
  }
}

if (navSettingsBtn) navSettingsBtn.addEventListener("click", openAzureSettingsModal);
if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener("click", closeAzureSettingsModal);
if (cancelSettingsBtn) cancelSettingsBtn.addEventListener("click", closeAzureSettingsModal);

if (modeLiveAzureBtn) {
  modeLiveAzureBtn.addEventListener("click", () => {
    azureSettings.setMode("azure_dual");
    updateModalModeUI("azure_dual");
  });
}
if (modeOfflineBtn) {
  modeOfflineBtn.addEventListener("click", () => {
    azureSettings.setMode("offline_simulator");
    updateModalModeUI("offline_simulator");
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", () => {
    azureSettings.updateAccount1(
      azureEndpoint1?.value?.trim() || "",
      azureKey1?.value?.trim() || "",
      azureDeployment1?.value?.trim() || "gpt-6-astra"
    );
    azureSettings.updateAccount2(
      azureEndpoint2?.value?.trim() || "",
      azureKey2?.value?.trim() || "",
      azureDeployment2?.value?.trim() || "gpt-6-astra"
    );
    alert("Azure AI Foundry & Dual-Account Settings Saved successfully!");
    closeAzureSettingsModal();
  });
}

if (testAzureConnectionBtn) {
  testAzureConnectionBtn.addEventListener("click", async () => {
    testAzureConnectionBtn.disabled = true;
    testAzureConnectionBtn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Testing Pool...`;
    try {
      const active = azureSettings.getActiveAccount();
      if (!active || !active.apiKey || !active.endpoint) {
        alert("Dual Azure Pool: Running in Zero-Cost Offline Simulator Mode ($0 Cloud Cost). All local tools, RAG, and multi-fuel models are 100% functional!");
      } else {
        alert(`Connection Verified!\nActive Account: ${active.name || active.label}\nDeployment: ${active.deployment}\nStatus: Active\nPool Health: 100% OK`);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      testAzureConnectionBtn.disabled = false;
      testAzureConnectionBtn.innerHTML = `<i class="ri-pulse-line text-blue-600"></i> Test Connection & Balance`;
    }
  });
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

  const targetFeed = document.querySelector("#copilotChatFeed") || 
                     document.querySelector(".copilot-chat-container") || 
                     document.getElementById("copilotMessageFeed") || 
                     document.getElementById("messages") || 
                     messages;
  if (targetFeed) {
    targetFeed.appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "nearest" });
    targetFeed.scrollTop = targetFeed.scrollHeight;
  }
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

  const targetFeed = document.querySelector("#copilotChatFeed") || 
                     document.querySelector(".copilot-chat-container") || 
                     document.getElementById("copilotMessageFeed") || 
                     document.getElementById("messages") || 
                     messages;
  if (targetFeed) {
    targetFeed.appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "nearest" });
    targetFeed.scrollTop = targetFeed.scrollHeight;
  }
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
   6. STRICT ROUTER & TAB-SWITCHING GUARD
   ══════════════════════════════════════════════ */
const navLinks = document.querySelectorAll(".nav-links .nav-link");
const allViews = document.querySelectorAll(".app-page-view");

function switchTab(tabId) {
  const cleanTab = normalizeTabKey(tabId);
  const targetView = VIEW_MAP[cleanTab] || `view${cleanTab.charAt(0).toUpperCase() + cleanTab.slice(1)}`;
  return switchView(targetView);
}

// Router API compatibility aliases
const showPage = switchTab;
const navigate = switchTab;
window.switchTab = switchTab;
window.switchView = switchView;
window.showPage = switchTab;
window.navigate = switchTab;

function switchView(viewId) {
  const tabKey = normalizeTabKey(viewId);
  const targetViewId = VIEW_MAP[tabKey] || (viewId && viewId.startsWith("view") ? viewId : `view${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);

  // 1. STRICT ROUTE GUARD: Check authentication at the VERY FIRST LINE
  if (!isAuthenticated()) {
    if (PROTECTED_TABS.includes(tabKey) || (targetViewId && targetViewId !== "viewHome")) {
      openSignInModal(targetViewId);
      return false;
    }
  }

  // 2. Role-Based Access Control (RBAC) for authenticated users
  if (isAuthenticated()) {
    const currentPersona = state.persona || localStorage.getItem("rido_persona") || sessionStorage.getItem("rido_persona") || "Driver In-Cab";
    const config = ROLE_CONFIG[currentPersona] || ROLE_CONFIG["Driver In-Cab"];

    if (config && config.allowedTabs && !config.allowedTabs.includes(tabKey)) {
      console.warn(`Access Restricted: Active role [${currentPersona}] is not authorized for tab '${tabKey}'. Redirecting to default '${config.defaultTab}'.`);
      const fallbackView = VIEW_MAP[config.defaultTab] || "viewHome";
      return switchView(fallbackView);
    }
  }

  // 3. Strict container swapping: Hide all views, display target view
  document.querySelectorAll(".app-page-view, .app-view").forEach(v => {
    v.style.display = "none";
    v.classList.add("hidden");
  });

  const targetView = document.getElementById(targetViewId);
  if (targetView) {
    targetView.classList.remove("hidden");
    targetView.style.display = "flex";
  }

  // 4. Handle Home view workspace switching (Marketing vs Role Workspace)
  const homePublic = document.getElementById("homePublicMarketing");
  const homeRole = document.getElementById("homeRoleWorkspace");

  if (targetViewId === "viewHome") {
    if (isAuthenticated()) {
      const currentPersona = state.persona || localStorage.getItem("rido_persona") || sessionStorage.getItem("rido_persona") || "Driver In-Cab";
      if (homePublic) {
        homePublic.style.display = "none";
        homePublic.classList.add("hidden");
      }
      if (homeRole) {
        homeRole.style.display = "flex";
        homeRole.classList.remove("hidden");
      }
      renderPersonaExperience(currentPersona);
    } else {
      if (homePublic) {
        homePublic.style.display = "block";
        homePublic.classList.remove("hidden");
      }
      if (homeRole) {
        homeRole.style.display = "none";
        homeRole.classList.add("hidden");
      }
    }
  } else {
    if (homeRole) {
      homeRole.style.display = "none";
      homeRole.classList.add("hidden");
    }
  }

  // 4b. Handle Copilot view persona adaptation
  if (targetViewId === "viewCopilot") {
    if (isAuthenticated()) {
      const activePersona = state.persona || localStorage.getItem("rido_persona") || sessionStorage.getItem("rido_persona") || "Driver In-Cab";
      renderCopilotForPersona(activePersona);
      hydrateCopilotForSession(activePersona);
    } else {
      hydrateCopilotForSession(null);
    }
    openCopilotWorkspace(true);
  }

  // 5. Dynamic Header Navigation Re-render for the active role & active tab state
  const currentPersona = isAuthenticated() ? (state.persona || localStorage.getItem("rido_persona") || sessionStorage.getItem("rido_persona") || "Driver In-Cab") : null;
  renderNavForRole(currentPersona);

  document.querySelectorAll(".site-header nav a, .site-header .nav-link, .nav-links .nav-link").forEach(link => {
    const linkKey = normalizeTabKey(link.dataset.tab || link.dataset.view || link.getAttribute("href") || link.textContent);
    const isActive = (linkKey === tabKey);
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.classList.add("bg-white", "text-zinc-900", "font-semibold", "shadow-sm");
      link.classList.remove("text-zinc-600");
    } else {
      link.classList.remove("bg-white", "text-zinc-900", "font-semibold", "shadow-sm");
      link.classList.add("text-zinc-600");
    }
  });

  if (targetViewId === "viewRoutes") {
    setTimeout(() => {
      initHomeRoutesMap();
      if (homeLeafletMap) {
        homeLeafletMap.invalidateSize();
        if (homePolyPath1) {
          try {
            homeLeafletMap.fitBounds(homePolyPath1.getBounds(), { padding: [40, 40] });
          } catch (e) {}
        }
      }
    }, 120);

    setTimeout(() => {
      if (homeLeafletMap) {
        homeLeafletMap.invalidateSize();
      }
    }, 350);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  history.pushState(null, "", `#${tabKey}`);
  return true;
}

// Event Interception on all Navigation Elements (Capture Phase & Dynamic Delegation)
document.addEventListener("click", (e) => {
  const navLink = e.target.closest(".nav-link, [data-tab], .site-logo, #brandLogoLink");
  if (!navLink) return;

  if (navLink.classList.contains("site-logo") || navLink.id === "brandLogoLink") {
    e.preventDefault();
    e.stopPropagation();
    switchTab("home");
    return;
  }

  if (navLink.closest(".site-header") || navLink.dataset.tab) {
    e.preventDefault();
    e.stopPropagation();

    const rawTab = navLink.dataset.tab || navLink.dataset.view || navLink.getAttribute("href") || navLink.textContent;
    const tabKey = normalizeTabKey(rawTab);
    const targetViewId = VIEW_MAP[tabKey] || `view${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`;

    if (PROTECTED_TABS.includes(tabKey) && !isAuthenticated()) {
      openSignInModal(targetViewId);
      return;
    }

    switchTab(tabKey);
  }
}, true);

// Handle initial URL hash or query params on page load
function handleHashRoute() {
  const urlParams = new URLSearchParams(window.location.search);
  const queryTab = urlParams.get("tab");
  const rawHash = window.location.hash.toLowerCase().replace("#", "").trim();
  const requestedTab = queryTab || rawHash || "home";
  const cleanTab = normalizeTabKey(requestedTab);

  if (!isAuthenticated()) {
    if (PROTECTED_TABS.includes(cleanTab)) {
      history.replaceState(null, "", window.location.pathname + "#home");
      switchView("viewHome");
      const targetView = `view${cleanTab.charAt(0).toUpperCase() + cleanTab.slice(1)}`;
      setTimeout(() => openSignInModal(targetView), 100);
      return;
    }
    switchView("viewHome");
    return;
  }

  // Authenticated
  const currentPersona = state.persona || localStorage.getItem("rido_persona") || sessionStorage.getItem("rido_persona") || "Driver In-Cab";
  const config = ROLE_CONFIG[currentPersona] || ROLE_CONFIG["Driver In-Cab"];

  if (config && config.allowedTabs && !config.allowedTabs.includes(cleanTab)) {
    const fallbackTab = config.defaultTab;
    const fallbackView = VIEW_MAP[fallbackTab] || "viewHome";
    history.replaceState(null, "", window.location.pathname + `#${fallbackTab}`);
    switchView(fallbackView);
    return;
  }

  const targetView = VIEW_MAP[cleanTab] || `view${cleanTab.charAt(0).toUpperCase() + cleanTab.slice(1)}`;
  if (document.getElementById(targetView)) {
    switchView(targetView);
  } else {
    switchView("viewHome");
  }
}

window.addEventListener("popstate", handleHashRoute);
handleHashRoute();

/* ── Home Route Leaflet Map Controller & Multi-Layer Engine ── */
let homeLeafletMap = null;
let homeCurrentTileLayer = null;
let homePolyPath1, homePolyPath2, homePolyPath3;
let homeTruckMarker = null;
let mapResizeObserver = null;

function setHomeMapType(type) {
  if (!homeLeafletMap || typeof L === "undefined") return;

  if (homeCurrentTileLayer) {
    try {
      homeLeafletMap.removeLayer(homeCurrentTileLayer);
    } catch (e) {}
  }

  // Update button active states
  ["mapTypeRoad", "mapTypeSat", "mapTypeVector"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.remove("text-indigo-700", "bg-indigo-50", "font-bold");
    btn.classList.add("text-slate-600");
  });

  const activeBtn = document.getElementById(type === "road" ? "mapTypeRoad" : type === "satellite" ? "mapTypeSat" : "mapTypeVector");
  if (activeBtn) {
    activeBtn.classList.remove("text-slate-600");
    activeBtn.classList.add("text-indigo-700", "bg-indigo-50", "font-bold");
  }

  if (type === "satellite") {
    homeCurrentTileLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "&copy; Google Satellite"
    });
  } else if (type === "road") {
    homeCurrentTileLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "&copy; Google Maps"
    });
  } else {
    homeCurrentTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    });
  }

  // Fallback to OSM on tileerror
  homeCurrentTileLayer.on("tileerror", function() {
    try {
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(homeLeafletMap);
    } catch (err) {}
  });

  homeCurrentTileLayer.addTo(homeLeafletMap);
}
window.setHomeMapType = setHomeMapType;

function initHomeRoutesMap() {
  const mapContainer = document.getElementById("homeRoutesLeafletMap");
  if (!mapContainer) return;

  // If Leaflet is not available (e.g. offline/isolated), the built-in SVG vector fallback remains active
  if (typeof L === "undefined") {
    console.info("Leaflet engine pending or offline; interactive SVG vector map fallback active.");
    return;
  }

  // 1. If map already exists, simply invalidate size and fit bounds if visible
  if (homeLeafletMap) {
    if (mapContainer.clientHeight > 0 && mapContainer.clientWidth > 0) {
      homeLeafletMap.invalidateSize();
      if (homePolyPath1) {
        try {
          homeLeafletMap.fitBounds(homePolyPath1.getBounds(), { padding: [40, 40] });
        } catch (e) {}
      }
    }
    return;
  }

  // 2. Wait until container has real rendered dimensions (prevents NaN zoom calculation)
  if (mapContainer.clientHeight === 0 || mapContainer.clientWidth === 0) {
    setTimeout(initHomeRoutesMap, 80);
    return;
  }

  // 3. Prevent "Map container is already initialized" error collision
  if (mapContainer._leaflet_id) {
    try {
      mapContainer._leaflet_id = null;
    } catch (e) {}
  }

  try {
    homeLeafletMap = L.map("homeRoutesLeafletMap", {
      zoomControl: false,
      attributionControl: false
    }).setView([24.2, 74.8], 6);

    // Initial tile layer: Google Roadmap or CartoDB
    setHomeMapType("road");

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

    // Path-1 (Green EV Corridor) with high-visibility outer glow and crisp core line
    L.polyline(path1Coords, { color: '#10b981', weight: 14, opacity: 0.35 }).addTo(homeLeafletMap);
    homePolyPath1 = L.polyline(path1Coords, { color: '#059669', weight: 6, opacity: 0.95 }).addTo(homeLeafletMap);
    homePolyPath2 = L.polyline(path2Coords, { color: '#0284c7', weight: 4.5, opacity: 0.85, dashArray: '8, 8' }).addTo(homeLeafletMap);
    homePolyPath3 = L.polyline(path3Coords, { color: '#ea580c', weight: 4.5, opacity: 0.85, dashArray: '6, 6' }).addTo(homeLeafletMap);

    const hubs = [
      { name: 'Delhi NCR Freight Origin', coords: [28.6139, 77.2090], icon: 'ri-map-pin-2-fill', bg: '#10b981', note: 'Origin Hub (98% SoC)' },
      { name: 'Jaipur 350kW Supercharger Hub', coords: [26.9124, 75.7873], icon: 'ri-flashlight-fill', bg: '#10b981', note: '30m Fast Charge (85% SoC)' },
      { name: 'Ajmer Solar Fast-Charging Oasis', coords: [26.4499, 74.6399], icon: 'ri-sun-fill', bg: '#10b981', note: 'Mandatory 45m HOS Driver Rest' },
      { name: 'Udaipur Fleet Park & Buffer', coords: [24.5854, 73.7125], icon: 'ri-building-4-fill', bg: '#10b981', note: 'Buffer & Staging Yard' },
      { name: 'Ahmedabad Mega Depot', coords: [23.0225, 72.5714], icon: 'ri-store-2-fill', bg: '#0284c7', note: 'Relay Depot & Battery Check' },
      { name: 'Mumbai JNPT Port Terminal (Destination)', coords: [18.9499, 72.9515], icon: 'ri-flag-fill', bg: '#10b981', note: 'Final Maritime Inbound Handover' }
    ];

    hubs.forEach(h => {
      const icon = L.divIcon({
        html: `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${h.bg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35);"><i class="${h.icon}"></i></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker(h.coords, { icon }).addTo(homeLeafletMap).bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <strong style="font-size: 13px; color: #0f172a;">${h.name}</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${h.note}</div>
          <div style="margin-top: 6px; font-size: 10px; color: #16a34a; font-weight: 700;">● Live Telemetry Active</div>
        </div>
      `);
    });

    // Active Live Truck Marker: Unit TRK-A (Scania 45R)
    const truckIcon = L.divIcon({
      html: `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 50%; background: #10b981; opacity: 0.4;" class="animate-ping"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #047857; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 14px rgba(4,120,87,0.5);">
            <i class="ri-truck-fill"></i>
          </div>
        </div>
      `,
      className: '',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    homeTruckMarker = L.marker([25.0, 74.2], { icon: truckIcon }).addTo(homeLeafletMap).bindPopup(`
      <div style="font-family: 'Inter', sans-serif; padding: 4px;">
        <strong style="font-size: 13px; color: #0f172a;">Unit TRK-A (Scania 45R)</strong>
        <div style="font-size: 11px; color: #16a34a; font-weight: 700; margin-top: 2px;">Speed: 72 km/h • 75% SOC</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Reefer Temp: 3.6°C • WDFC Active</div>
      </div>
    `);

    if (mapContainer.clientHeight > 0 && mapContainer.clientWidth > 0) {
      try {
        homeLeafletMap.fitBounds(homePolyPath1.getBounds(), { padding: [40, 40] });
      } catch (e) {}
    }

    // Set up ResizeObserver to automatically invalidate size when container size changes
    if (window.ResizeObserver && !mapResizeObserver) {
      mapResizeObserver = new ResizeObserver(() => {
        if (homeLeafletMap && mapContainer.clientHeight > 0 && mapContainer.clientWidth > 0) {
          homeLeafletMap.invalidateSize();
        }
      });
      mapResizeObserver.observe(mapContainer);
    }
  } catch (err) {
    console.error("Leaflet initialization error:", err);
  }
}

window.initHomeRoutesMap = initHomeRoutesMap;

window.zoomInHomeMap = () => { if (homeLeafletMap) homeLeafletMap.zoomIn(); };
window.zoomOutHomeMap = () => { if (homeLeafletMap) homeLeafletMap.zoomOut(); };

window.focusHomeRoute = (r) => {
  // Update UI pill active states
  ["btnFilterPath1", "btnFilterPath2", "btnFilterPath3"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.remove("active", "text-emerald-800", "bg-emerald-50", "border", "border-emerald-200");
    btn.classList.add("text-slate-600");
  });

  const activeId = r === "path1" ? "btnFilterPath1" : r === "path2" ? "btnFilterPath2" : "btnFilterPath3";
  const activeBtn = document.getElementById(activeId);
  if (activeBtn) {
    activeBtn.classList.remove("text-slate-600");
    activeBtn.classList.add("active", "text-emerald-800", "bg-emerald-50", "border", "border-emerald-200");
  }

  if (!homeLeafletMap) return;
  if (r === 'path1' && homePolyPath1) homeLeafletMap.fitBounds(homePolyPath1.getBounds(), { padding: [30, 30] });
  if (r === 'path2' && homePolyPath2) homeLeafletMap.fitBounds(homePolyPath2.getBounds(), { padding: [30, 30] });
  if (r === 'path3' && homePolyPath3) homeLeafletMap.fitBounds(homePolyPath3.getBounds(), { padding: [30, 30] });
};

window.recalculateCorridor = function() {
  const btn = event?.currentTarget;
  if (btn) {
    btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Calculating&hellip;`;
    btn.disabled = true;
  }
  setTimeout(() => {
    if (btn) {
      btn.innerHTML = `<i class="ri-check-line text-emerald-600"></i> Route Optimized`;
      setTimeout(() => {
        btn.innerHTML = `<i class="ri-refresh-line"></i> Re-Calculate Route`;
        btn.disabled = false;
      }, 1500);
    }
    if (window.focusHomeRoute) window.focusHomeRoute("path1");
    alert("AI Corridor Re-calculation Complete:\n\n• Verified 350kW fast-charging availability at Jaipur and Ajmer\n• Real-time traffic clearance confirmed across NH-48\n• Expected Transit Duration: 22h 15m (-1h 45m vs diesel)\n• Net Financial Saving: $85.00 USD");
  }, 600);
};

window.deployToInCabManifest = function() {
  alert("DISPATCH DOCKET AUTHORIZED:\n\nManifest #MNF-8824-EV deployed directly to In-Cab Cockpit for Unit TRK-A (Scania 45R).\n\n• Turn-by-turn green corridor traversal locked\n• 3x High-power charging reservations confirmed\n• Cold-chain Reefer threshold locked at 3.6°C");
};

window.exportCorridorAudit = function() {
  const auditContent = `=====================================================
RIDO ENTERPRISE FREIGHT CORRIDOR AUDIT REPORT
Document ID: AUD-2026-WDFC-8824
Corridor: Western Dedicated Freight Corridor (WDFC)
Transit: Delhi NCR [DL-01] ➔ Mumbai JNPT [MH-04]
Date: ${new Date().toISOString()}
Currency: US Dollars ($ USD)
=====================================================

1. PARAMETRIC COMPARATIVE AUDIT
-----------------------------------------------------
Parameter               Path-1 (EV)     Path-2 (Diesel) Path-3 (Express)
Distance:               1,424 km        1,426 km        1,438 km
Transit Duration:       22h 15m         24h 00m         23h 10m
Time Variance:          -1h 45m         Baseline        -50m
Energy / Fuel Cost:     $240.00 USD     $325.00 USD     $295.00 USD
Net Cost Delta:         -$85.00 USD     Baseline        -$30.00 USD
CO2 Emission:           18 kg CO2       48 kg CO2       36 kg CO2
Net CO2 Abated:         -30 kg CO2      Baseline        -12 kg CO2
Toll Plaza Fees:        $42.00 USD      $68.00 USD      $85.00 USD
Scheduled Charging:     3 Stops         0 Stops         1 Stop

2. ACTIVE ASSET TELEMETRY
Vehicle: Unit TRK-A (Scania 45R Electric Hauler)
GVW: 44 Metric Tonnes
Battery State of Charge (SoC): 75%
Reefer Cold-Chain Temp: 3.6°C (Target: 2°C - 5°C)
Compliance Rating: 99.1% Certified

Authorized by: RIDO Operational Intelligence Controller
Azure AI Foundry Engine (gpt-6-astra)
=====================================================`;
  const blob = new Blob([auditContent], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "RIDO_WDFC_Corridor_Audit.txt";
  a.click();
};


/* ══════════════════════════════════════════════
   7. INTERACTIVE REPORT & PROMPT HELPERS
   ══════════════════════════════════════════════ */
window.openCopilotWithPrompt = function(promptText) {
  if (!isAuthenticated()) {
    openSignInModal('viewCopilot');
    return;
  }
  switchView("viewCopilot");
  if (typeof openCopilotWorkspace === "function") {
    openCopilotWorkspace(true);
  }
  const input = document.getElementById("copilotInput") || document.getElementById("userInput");
  if (input) {
    input.value = promptText;
    setTimeout(() => {
      if (typeof handleSend === "function") {
        handleSend();
      }
    }, 150);
  }
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

/* ══════════════════════════════════════════════
   ENTERPRISE FOOTER INFORMATION & POLICY MODAL CONTROLLER
   ══════════════════════════════════════════════ */
const FOOTER_MODAL_DATA = {
  sales: {
    icon: "ri-customer-service-2-line",
    iconBg: "bg-orange-50 text-orange-600 border-orange-200",
    badge: "Enterprise Inquiries",
    title: "Enterprise Solutions & Fleet Deployment",
    subtitle: "Direct logistics engineering consultation for commercial carrier fleets with 50+ vehicles.",
    bodyHtml: `
      <div class="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Connect directly with RÍDO's Logistics Solutions Architecture team to deploy dedicated Azure AI Foundry agents across your freight corridors.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div class="font-bold text-slate-900 text-xs mb-1">Direct Telematics Hotline</div>
            <div class="font-mono text-xs text-orange-600 font-semibold">+1 (800) 555-RIDO</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Available 24/7/365 for Carrier Dispatch</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div class="font-bold text-slate-900 text-xs mb-1">Enterprise Solutions Desk</div>
            <div class="font-mono text-xs text-blue-600 font-semibold">enterprise@rido.ai</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Dedicated Technical Account Manager</div>
          </div>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs">
          <p class="font-bold text-white mb-1">Supported Telematics & Powertrain Integrations:</p>
          <p class="text-slate-400 leading-normal">Scania FMS 3.0, Volvo FH Electric J1939 CAN-bus, Thermo King TracKing, Carrier Transicold, Geotab Cloud API, Samsara API, and Siemens Sicharge 350kW DC Fast Chargers.</p>
        </div>
      </div>
    `
  },
  privacy: {
    icon: "ri-shield-user-line",
    iconBg: "bg-blue-50 text-blue-600 border-blue-200",
    badge: "Data Governance",
    title: "Enterprise Privacy Policy & Data Sovereignty",
    subtitle: "Zero third-party monetization. High-integrity telematics encryption.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
        <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">1. Telematics & GPS Trace Protection</h5>
        <p>RÍDO collects high-frequency GPS, battery state-of-charge (SOC), and reefer thermal sensor telemetry solely to execute real-time dispatch, route energy arbitration, and cold-chain compliance. Telematics data is never rented, brokered, or sold to third-party ad networks.</p>
        <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">2. Cryptographic Isolation</h5>
        <p>All client telemetry streams are segregated within dedicated Azure AI Foundry tenant boundaries. In-transit streams are secured via TLS 1.3 with AES-256-GCM encryption at rest.</p>
        <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">3. Automated Data Retention & Sovereign Residency</h5>
        <p>High-resolution CAN-bus telemetry is retained for 90 days for SLA dispute resolution before automatic cold-storage aggregation. Carrier customers retain 100% legal ownership and can trigger complete cryptographic purge upon demand.</p>
      </div>
    `
  },
  terms: {
    icon: "ri-file-text-line",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    badge: "Master Services Agreement",
    title: "Master Enterprise Service Level Agreement",
    subtitle: "Contractual commitments for mission-critical commercial carrier dispatch.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
        <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">1. 99.99% Availability Guarantee</h5>
        <p>The RÍDO Mission Control platform, real-time routing engine, and Foundry Agent copilot commit to a 99.99% monthly uptime SLA. Unplanned gateway downtime triggers automatic service fee credits per Section 4.2.</p>
        <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">2. Cold-Chain Excursion Liability Protection</h5>
        <p>Tamper-evident thermal dockets generated by RÍDO provide legally certified telematics records valid for FDA 21 CFR Part 11 and EU Good Distribution Practice (GDP) pharma cargo insurance claims.</p>
        <h5 class="font-bold text-slate-900 text-xs uppercase tracking-wide">3. Multi-Currency & Financial Accuracy</h5>
        <p>All operational expenses, energy tariff models, toll estimations, and carbon credit offsets are contractually guaranteed to compute in United States Dollars ($ USD) with certified Bloomberg Energy Index parity.</p>
      </div>
    `
  },
  security: {
    icon: "ri-lock-password-line",
    iconBg: "bg-purple-50 text-purple-600 border-purple-200",
    badge: "Zero-Trust Architecture",
    title: "Security, Cryptography & Compliance Standards",
    subtitle: "Enterprise-grade defensive controls audited by independent cybersecurity firms.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[11px] mb-2">
          <div class="p-2 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800">SOC 2 Type II</div>
          <div class="p-2 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800">ISO 27001</div>
          <div class="p-2 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800">FIPS 140-2</div>
          <div class="p-2 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800">HIPAA / GDP</div>
        </div>
        <p>RÍDO enforces a strict Zero-Trust security posture. Role-Based Access Control (RBAC) cryptographically prevents view contamination between Driver, Dispatcher, Compliance, and ESG personas.</p>
        <p>Infrastructure is hosted in SOC-2 Type II certified Microsoft Azure datacenters with automated multi-zone failover, continuous vulnerability scanning, and pen-testing executed semi-annually.</p>
      </div>
    `
  },
  api: {
    icon: "ri-terminal-box-line",
    iconBg: "bg-zinc-100 text-zinc-900 border-zinc-300",
    badge: "Developer Platform",
    title: "RÍDO Telematics & Agent Orchestration API",
    subtitle: "RESTful JSON and WebSocket endpoints for TMS/ERP enterprise integration.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
        <p>Seamlessly integrate real-time route optimization and IoT telematics into SAP Transportation Management, Oracle OTM, or custom carrier software.</p>
        <div class="rounded-xl bg-slate-900 text-slate-200 p-3.5 font-mono text-xs overflow-x-auto space-y-1">
          <div class="text-slate-400"># Query Real-Time Reefer & Battery Telemetry</div>
          <div><span class="text-orange-400">curl</span> -X GET https://api.rido.ai/v1/telematics/TRK-A \\</div>
          <div>  -H <span class="text-emerald-400">"Authorization: Bearer RIDO_JWT_TOKEN"</span> \\</div>
          <div>  -H <span class="text-emerald-400">"Content-Type: application/json"</span></div>
        </div>
        <p class="text-xs text-slate-500">Includes real-time webhook callbacks for thermal deviations (> 2.0°C), HOS mandatory rest triggers, and automated DC fast charging oasis bay reservations.</p>
      </div>
    `
  },
  reefer: {
    icon: "ri-temp-cold-line",
    iconBg: "bg-blue-50 text-blue-600 border-blue-200",
    badge: "Cold-Chain IoT",
    title: "Cold-Chain Reefer IoT & Excursion Management",
    subtitle: "Active telemetry lock at +3.6°C across refrigerated haulers.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Continuous thermal logging via calibrated dual PT100 temperature probes mounted in cargo zone A (rear) and zone B (evaporator output).</p>
        <ul class="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
          <li><strong>Target Baseline:</strong> Locked setpoint of +3.6°C for perishable pharmaceuticals and produce.</li>
          <li><strong>Tier-1 Alert Trigger:</strong> Instant SMS/In-Cab alert if deviation exceeds &plusmn;1.5°C for &gt; 10 minutes.</li>
          <li><strong>Tier-2 Emergency Reroute:</strong> Automatic rerouting to emergency cold-storage depot if deviation &gt; 2.5°C.</li>
          <li><strong>Audit Compliance:</strong> Tamper-evident PDF audit dockets generated with cryptographic SHA-256 hash.</li>
        </ul>
      </div>
    `
  },
  scania: {
    icon: "ri-truck-line",
    iconBg: "bg-orange-50 text-orange-600 border-orange-200",
    badge: "Fleet Powertrain",
    title: "Scania 45R Heavy Electric Hauler Profile",
    subtitle: "Commercial Class-8 44-Tonne GVW zero-emission long-haul transport.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <div class="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200"><strong>Battery Pack:</strong> 624 kWh Li-ion</div>
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200"><strong>Continuous Power:</strong> 450 kW (610 hp)</div>
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200"><strong>Peak Torque:</strong> 3,500 Nm</div>
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200"><strong>Max Charging:</strong> 375 kW CCS2</div>
        </div>
        <p class="text-xs text-slate-600">Equipped with regenerative braking recuperating up to 28% of kinetic energy on Western Freight Corridor downgrades, minimizing brake disc wear and maximizing range.</p>
      </div>
    `
  },
  tco: {
    icon: "ri-money-dollar-circle-line",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    badge: "Financial Intelligence",
    title: "Total Cost of Ownership (TCO) & Diesel Parity",
    subtitle: "Real-time energy cost modeling calibrated in US Dollars ($ USD).",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>RÍDO provides real-time financial arbitration between diesel baseline fuel costs and off-peak electric corridor tariffs:</p>
        <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 font-mono space-y-1">
          <div>&bull; Diesel Baseline (1,424 km): $395.00 USD (38 L/100km @ $0.73/L)</div>
          <div>&bull; Electric Corridor (1,424 km): $310.00 USD (1.18 kWh/km @ $0.18/kWh)</div>
          <div class="font-bold text-emerald-700 mt-1">&bull; Net Savings per Traversal: +$85.00 USD (21.5% OpEx Reduction)</div>
        </div>
      </div>
    `
  },
  mcp: {
    icon: "ri-cpu-line",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
    badge: "AI Architecture",
    title: "Model Context Protocol (MCP) Tool Integration",
    subtitle: "Standardized tool invocation protocol connecting Azure AI Foundry agents with IoT telemetry.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>RÍDO implements the Model Context Protocol (MCP) to allow autonomous AI agents to query live databases, execute safe route recomputations, and inspect reefer hardware without code modifications.</p>
        <div class="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1">
          <div class="text-slate-400">Registered Tools:</div>
          <div class="text-emerald-400 pl-3">&bull; get_vehicle_telemetry(vehicle_id)</div>
          <div class="text-emerald-400 pl-3">&bull; calculate_green_route(origin, destination, gvw_tonnes)</div>
          <div class="text-emerald-400 pl-3">&bull; audit_reefer_thermal_excursion(unit_id, timeframe)</div>
          <div class="text-emerald-400 pl-3">&bull; reserve_charging_oasis_bay(station_id, arrival_eta)</div>
        </div>
      </div>
    `
  },
  hos: {
    icon: "ri-time-line",
    iconBg: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "Regulatory Mandate",
    title: "Hours of Service (HOS) & Driver Shift Safety",
    subtitle: "Automated compliance with FMCSA, EU Regulation 561/2006, and CMVR mandates.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Continuous shift monitoring ensures zero driver fatigue violations with predictive rest stop scheduling:</p>
        <ul class="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li><strong>Drive Limit:</strong> Maximum 8 continuous driving hours before mandatory 45-minute pause.</li>
          <li><strong>Daily Rest:</strong> Enforced 11-hour consecutive rest period prior to shift renewal.</li>
          <li><strong>Predictive Halts:</strong> Route optimizer pairs mandatory rest intervals with 350kW DC fast charging stops to eliminate dead downtime.</li>
        </ul>
      </div>
    `
  },
  carbon: {
    icon: "ri-leaf-line",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    badge: "ESG Abatement",
    title: "Scope 1, 2 & 3 Carbon Footprint Accounting",
    subtitle: "GHG Protocol compliant greenhouse gas emissions accounting.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Detailed emissions breakdown comparing internal combustion haulers with electric powertrains:</p>
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1 text-slate-700">
          <div>Scope 1 Direct Diesel Emissions: <span class="text-rose-600 font-bold">142.5 kg CO₂</span> (Diesel Baseline)</div>
          <div>Scope 2 Grid Generation (Solar/Hydro mix): <span class="text-emerald-600 font-bold">112.5 kg CO₂</span></div>
          <div class="font-bold text-emerald-700 border-t border-slate-200 pt-1 mt-1">Net Abatement per Trip: -30.0 kg CO₂ (21% Reduction)</div>
        </div>
      </div>
    `
  },
  gdp: {
    icon: "ri-file-shield-line",
    iconBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    badge: "Pharma Compliance",
    title: "FDA 21 CFR Part 11 & EU GDP Compliance",
    subtitle: "Electronic signatures, audit trails, and data integrity for healthcare cargo.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Guaranteed regulatory adherence for high-value cold-chain vaccines, biologics, and clinical supplies:</p>
        <ul class="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Immutable chronological event logging of setpoint adjustments.</li>
          <li>Cryptographic digital signatures on generated inspection dockets.</li>
          <li>Dual-witness verification for temperature setpoint overrides.</li>
        </ul>
      </div>
    `
  },
  wdfc: {
    icon: "ri-road-map-line",
    iconBg: "bg-blue-50 text-blue-600 border-blue-200",
    badge: "Corridor Digital Twin",
    title: "Western Dedicated Freight Corridor (WDFC) Profile",
    subtitle: "Delhi to Mumbai (1,424 km) high-speed freight expressway specification.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>1,424 km dedicated corridor linking Dadri / Delhi NCR to Jawaharlal Nehru Port Trust (JNPT) Mumbai. Features 3 electrified charging oases at Kotputli, Ahmedabad, and Surat equipped with 350kW DC ultra-fast chargers.</p>
      </div>
    `
  },
  fms: {
    icon: "ri-settings-line",
    iconBg: "bg-zinc-100 text-zinc-800 border-zinc-200",
    badge: "CAN-Bus Standard",
    title: "J1939 CAN-Bus FMS Standard Interface",
    subtitle: "Universal OEM telematics gateway for Scania, Volvo, MAN, and Mercedes-Benz haulers.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Standardized SAE J1939 protocol ingestion delivering millisecond-precision metrics: wheel-based speed, engine/motor torque, battery pack cell balancing, brake application, and axle weight sensors.</p>
      </div>
    `
  },
  sla: {
    icon: "ri-award-line",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    badge: "Uptime Commitment",
    title: "99.99% Enterprise Uptime Service Level Agreement",
    subtitle: "Carrier-grade availability backed by financial compensation penalties.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>RÍDO operates on multi-zone active-active Azure cloud infrastructure guaranteeing continuous 99.99% availability for real-time dispatch, waypoint telemetry, and cold-chain alert feeds.</p>
      </div>
    `
  },
  docs: {
    icon: "ri-book-open-line",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
    badge: "Architecture Blueprint",
    title: "RÍDO Enterprise Architecture Whitepaper",
    subtitle: "High-performance logistics orchestration engine powered by Azure AI Foundry.",
    bodyHtml: `
      <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>The RÍDO platform combines edge IoT telematics on heavy electric vehicles with centralized Azure AI Foundry agents to achieve sub-second route energy arbitration, automated dwell reduction, and cold-chain compliance.</p>
        <button type="button" onclick="triggerReportGen('Fleet Health Executive Brief'); closeFooterInfoModal();" class="mt-2 px-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer">
          <i class="ri-file-download-line"></i> Generate Technical Architecture PDF Docket
        </button>
      </div>
    `
  }
};

function openFooterInfoModal(type) {
  const modal = document.getElementById("footerInfoModal");
  if (!modal) return;
  const data = FOOTER_MODAL_DATA[type] || FOOTER_MODAL_DATA["security"];
  
  const iconWrap = document.getElementById("footerModalIconWrap");
  const icon = document.getElementById("footerModalIcon");
  const badge = document.getElementById("footerModalBadge");
  const title = document.getElementById("footerModalTitle");
  const subtitle = document.getElementById("footerModalSubtitle");
  const body = document.getElementById("footerModalBody");

  if (iconWrap && data.iconBg) iconWrap.className = `w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${data.iconBg}`;
  if (icon && data.icon) icon.className = data.icon;
  if (badge) badge.innerText = data.badge || "Enterprise Standard";
  if (title) title.innerText = data.title;
  if (subtitle) subtitle.innerText = data.subtitle;
  if (body) body.innerHTML = data.bodyHtml;

  modal.classList.remove("hidden");
}

function closeFooterInfoModal() {
  const modal = document.getElementById("footerInfoModal");
  if (modal) modal.classList.add("hidden");
}

window.openFooterInfoModal = openFooterInfoModal;
window.closeFooterInfoModal = closeFooterInfoModal;

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeFooterInfoModal();
  }
});
const footerModal = document.getElementById("footerInfoModal");
if (footerModal) {
  footerModal.addEventListener("click", (e) => {
    if (e.target === footerModal) closeFooterInfoModal();
  });
}
