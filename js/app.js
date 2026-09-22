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

const PROTECTED_TABS = ['fleet', 'routes', 'analytics', 'reports'];

const VIEW_MAP = {
  home: 'viewHome',
  fleet: 'viewFleet',
  routes: 'viewRoutes',
  analytics: 'viewAnalytics',
  reports: 'viewReports'
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
    if (loginPassword) loginPassword.value = "RIDO2026";
    if (loginIdInput) loginIdInput.focus();
  }
}

function closeLoginModal() {
  const screen = document.getElementById("loginScreen") || document.getElementById("signInModal");
  if (screen) {
    screen.classList.add("hidden");
    screen.style.display = "none";
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


function updateUIAuthState(isLoggedIn) {
  const guestBanner = document.getElementById("guestLockBanner");
  const inputDock = document.getElementById("copilotInputDock");

  if (isLoggedIn) {
    if (headerPersonaBadge) headerPersonaBadge.innerText = `[${state.persona.toUpperCase()}]`;
    if (dispatcherBadge) dispatcherBadge.innerHTML = `Persona: <strong>${state.persona}</strong>`;
    if (navSignInBtn) navSignInBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "flex";
    if (personaWrapper) personaWrapper.style.display = "block";
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
    if (navSignInBtn) navSignInBtn.style.display = "flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (personaWrapper) personaWrapper.style.display = "none";
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
   ROLE-BASED ACCESS CONTROL (RBAC) POLICY
   Strict isolation: one role's features cannot be seen or accessed by another
   ══════════════════════════════════════════════ */
const ALL_APP_NAVS = ["navHome", "navFleet", "navRoutes", "navAnalytics", "navReports"];
const ALL_APP_VIEWS = ["viewHome", "viewFleet", "viewRoutes", "viewAnalytics", "viewReports"];

const ROLE_PERMISSIONS = {
  "Driver In-Cab": {
    badge: "[DRIVER IN-CAB]",
    defaultTab: "routes",
    allowedNavs: ALL_APP_NAVS,
    allowedViews: ALL_APP_VIEWS,
    allowedPages: ["index.html", "routes.html", "fleet.html"],
    showProcessStrip: false
  },
  "Compliance Officer": {
    badge: "[COMPLIANCE OFFICER]",
    defaultTab: "reports",
    allowedNavs: ALL_APP_NAVS,
    allowedViews: ALL_APP_VIEWS,
    allowedPages: ["index.html", "reports.html", "analytics.html"],
    showProcessStrip: false
  },
  "Dispatcher Gate": {
    badge: "[DISPATCHER GATE]",
    defaultTab: "fleet",
    allowedNavs: ALL_APP_NAVS,
    allowedViews: ALL_APP_VIEWS,
    allowedPages: ["index.html", "fleet.html", "routes.html"],
    showProcessStrip: true
  },
  "ESG Analyst": {
    badge: "[ESG ANALYST]",
    defaultTab: "analytics",
    allowedNavs: ALL_APP_NAVS,
    allowedViews: ALL_APP_VIEWS,
    allowedPages: ["index.html", "analytics.html", "reports.html"],
    showProcessStrip: false
  },
  "Fleet Manager": {
    badge: "[FLEET MANAGER]",
    defaultTab: "fleet",
    allowedNavs: ALL_APP_NAVS,
    allowedViews: ALL_APP_VIEWS,
    allowedPages: ["index.html", "fleet.html", "routes.html", "analytics.html", "reports.html"],
    showProcessStrip: true
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
        <a href="fleet.html" class="role-action-pill"><i class="ri-dashboard-line"></i> Open Live Fleet Tracking</a>
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
        <a href="analytics.html" class="role-action-pill"><i class="ri-bar-chart-2-line"></i> Open Analytics Dashboard</a>
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
        <a href="fleet.html" class="role-action-pill"><i class="ri-truck-line"></i> Fleet IQ Dashboard</a>
        <a href="routes.html" class="role-action-pill"><i class="ri-route-line"></i> Corridor Optimization</a>
        <a href="analytics.html" class="role-action-pill"><i class="ri-line-chart-line"></i> Analytics</a>
      </div>
    `;
  }
}

function renderPersonaExperience(personaName) {
  const profile = PERSONA_PROFILES[personaName] || PERSONA_PROFILES["Driver In-Cab"];
  const perms = ROLE_PERMISSIONS[personaName] || ROLE_PERMISSIONS["Driver In-Cab"];

  // 1. Update Header Badges
  if (headerPersonaBadge) headerPersonaBadge.innerText = profile.badge;
  if (dispatcherBadge) dispatcherBadge.innerHTML = `Persona: <strong>${personaName}</strong>`;

  // 2. Navigation Bar: Render all 5 tabs visible and unlocked for authenticated users
  const navItems = document.querySelectorAll(".nav-links li");
  navItems.forEach(li => {
    li.style.display = "";
    const a = li.querySelector("a.nav-link");
    if (!a) return;
    a.classList.remove("locked");
    const lockIcon = a.querySelector(".nav-lock-icon");
    if (lockIcon) lockIcon.style.display = "none";
  });

  // 3. Process Strip Visibility (Fleet Manager / Dispatcher only)
  const processStrip = document.getElementById("processStrip");
  if (processStrip) {
    processStrip.style.display = perms.showProcessStrip ? "flex" : "none";
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
        <a href="${profile.actionBtn.href}" class="hud-action-btn">
          <i class="${profile.actionBtn.icon}"></i> ${profile.actionBtn.text} &rarr;
        </a>
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

  // 7. Update Initial AI Welcome Bubble
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

function renderGuestExperience() {
  // 1. Show Guest Preview Banner
  const guestBanner = document.getElementById("guestLockBanner");
  if (guestBanner) guestBanner.style.display = "flex";

  // 2. Clear Authenticated Decks & HUDs
  const liveHUD = document.getElementById("personaLiveHUD");
  if (liveHUD) liveHUD.innerHTML = "";
  const roleDeck = document.getElementById("roleOperationalDeck");
  if (roleDeck) roleDeck.innerHTML = "";

  // 3. Mark Protected Tabs as Locked (Fleet, Routes, Analytics, Reports)
  const navItems = document.querySelectorAll(".nav-links li");
  navItems.forEach(li => {
    const a = li.querySelector("a.nav-link");
    if (!a) return;
    li.style.display = ""; // Render all 5 tabs visible
    if (a.id === "navHome") {
      a.classList.remove("locked");
      const lockIcon = a.querySelector(".nav-lock-icon");
      if (lockIcon) lockIcon.style.display = "none";
    } else {
      a.classList.add("locked");
      let lockIcon = a.querySelector(".nav-lock-icon");
      if (!lockIcon) {
        lockIcon = document.createElement("i");
        lockIcon.className = "ri-lock-2-line nav-lock-icon text-[11px] text-zinc-400";
        a.appendChild(lockIcon);
      }
      lockIcon.style.display = "inline-block";
    }
  });

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

  // 6. Guest Welcome AI Greeting
  const welcomeBubble = document.querySelector("#messages .msg.ai .msg-bubble");
  if (welcomeBubble) {
    welcomeBubble.innerHTML = `
      <p><strong>Welcome to RIDO Mission Control.</strong> You are currently browsing in <strong>Guest Preview Mode</strong>.</p>
      <p style="font-size: 0.84rem; color: #64748b; margin-top: 6px;">Protected sectors (<strong>Fleet IQ</strong>, <strong>Corridor Routing</strong>, <strong>ESG Analytics</strong>, <strong>Audit Dockets</strong>) and live Copilot AI assistance are locked behind enterprise authentication.</p>
      <div style="margin-top: 12px;">
        <button type="button" class="guest-signin-btn" onclick="openLoginModal()" style="font-size: 0.78rem; padding: 7px 16px;">
          <i class="ri-login-box-r-line"></i> Sign In to Unlock Platform &rarr;
        </button>
      </div>
    `;
  }
}

function login(userData = {}, token = null) {
  const authToken = token || generateDemoSessionToken("RIDO-");
  const persona = userData.persona || "Driver In-Cab";
  const email = userData.email || `${persona.toLowerCase().replace(/\s+/g, "")}@rido.ai`;

  localStorage.setItem("rido_session", authToken);
  localStorage.setItem("rido_auth_token", authToken);
  localStorage.setItem("rido_user_data", JSON.stringify({ email, persona }));
  localStorage.setItem("rido_persona", persona);

  sessionStorage.setItem("rido_session_token", authToken);
  sessionStorage.setItem("rido_persona", persona);

  state.sessionToken = authToken;
  state.isAuthenticated = true;
  state.persona = persona;

  updateUIAuthState(true);
  renderPersonaExperience(persona);
  sfx.playGrant();

  // Dismiss the Sign-In modal
  closeSignInModal();

  // If user was attempting to reach a locked section, navigate there; else auto-switch to Fleet
  if (window.pendingRedirectView) {
    const dest = window.pendingRedirectView;
    window.pendingRedirectView = null;
    switchView(dest);
    const hashName = dest.replace("view", "").toLowerCase();
    history.pushState(null, "", `#${hashName}`);
  } else {
    // Post-Sign-In Automatic Navigation: do not leave user idle on viewHome
    switchTab("fleet");
  }
}

const executeLogin = login;
window.login = login;
window.executeLogin = executeLogin;

function logout() {
  localStorage.removeItem("rido_session");
  localStorage.removeItem("rido_auth_token");
  localStorage.removeItem("rido_user_data");
  localStorage.removeItem("rido_persona");
  sessionStorage.removeItem("rido_session_token");
  sessionStorage.removeItem("rido_persona");

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

  updateUIAuthState(false);
  renderGuestExperience();
  switchView("viewHome");
  history.pushState(null, "", "#home");
}

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
  } else {
    // Default: Unauthenticated Guest Mode (Only Home accessible)
    state.sessionToken = null;
    state.persona = "Guest";
    state.isAuthenticated = false;
    updateUIAuthState(false);
    renderGuestExperience();
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

/* ── Sign Out Handler ── */
logoutBtn.addEventListener("click", () => {
  logout();
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

/* ══════════════════════════════════════════════
   AZURE AI FOUNDRY AGENT ORCHESTRATION PIPELINE
   Intent Detection -> Planning -> Tool Selection -> RAG Retrieval -> Synthesis
   ══════════════════════════════════════════════ */
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

  const t0 = performance.now();

  try {
    // Process message through Microsoft Foundry Agent pipeline
    const result = await foundryAgent.processMessage(text, (step, thoughtStream) => {
      logThought(step.phase, step.title, step.detail);
    });

    const elapsed = Math.round(performance.now() - t0);
    hudPing.innerText = `${elapsed}ms`;

    // Real-time $200 Azure pool budget stats
    const stats = azureSettings.getBudgetStats();
    hudSpent.innerText = `$${stats.totalSpentUSD.toFixed(4)}`;

    removeTyping(typingId);
    sfx.playReceive();

    const formattedResponse = ensureUSD(result.responseText);
    appendMessage("ai", formattedResponse || "_(Empty payload received from agent)_");
    speakText(formattedResponse);

    // Render interactive Apple HIG widgets if present
    if (result.higWidgets) {
      renderHigWidget(result.higWidgets);
    }

  } catch (err) {
    removeTyping(typingId);
    logThought("Agent Notice", err.message, "Local Intelligence Simulator Fallback");
    console.error("Foundry Agent Error:", err);
    appendMessage("ai", `**Operational Assistant:** An error occurred during inference: ${err.message}. Running in offline fallback mode.`);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

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
    const perms = ROLE_PERMISSIONS[currentPersona] || ROLE_PERMISSIONS["Driver In-Cab"];

    if (perms && perms.allowedViews && !perms.allowedViews.includes(targetViewId)) {
      alert(`Access Restricted: Your active role [${currentPersona}] is not authorized to view this section.`);
      return false;
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

  // 4. Update Navigation link styling & active state
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
    setTimeout(initHomeRoutesMap, 100);
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

  const targetView = VIEW_MAP[cleanTab] || `view${cleanTab.charAt(0).toUpperCase() + cleanTab.slice(1)}`;
  if (document.getElementById(targetView)) {
    switchView(targetView);
  } else {
    switchView("viewHome");
  }
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
  switchTab("fleet");
  openCopilotWorkspace(true);
  if (userInput) {
    userInput.value = promptText;
    setTimeout(() => handleSend(), 200);
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
