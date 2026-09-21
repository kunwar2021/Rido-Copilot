/**
 * RIDO AI — Main Application Entry Point & Controller
 */

import { AzureSettingsManager } from "./modules/azureSettings.js";
import { DashboardModule } from "./modules/dashboard.js";
import { RouteOptimizerModule } from "./modules/routeOptimizer.js";
import { ChatbotModule } from "./modules/chatbot.js";
import { KnowledgeBaseModule } from "./modules/knowledgeBase.js";

class App {
  constructor() {
    this.azureSettings = new AzureSettingsManager();
    this.currentTab = "dashboard";

    this.dashboardModule = new DashboardModule("tabDashboard");
    this.routeOptimizerModule = new RouteOptimizerModule("tabRouteOptimizer");
    this.chatbotModule = new ChatbotModule("tabChatbot", this.azureSettings);
    this.knowledgeBaseModule = new KnowledgeBaseModule("tabKnowledgeBase");
  }

  init() {
    this._attachNavigation();
    this._attachSettingsModal();
    this._updateBudgetHeader();

    // Initial render
    this.dashboardModule.render();
  }

  _attachNavigation() {
    const navButtons = document.querySelectorAll(".nav-tab-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (tab === this.currentTab) return;

        navButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.add("hidden"));
        const targetPane = document.getElementById(`tab${this._capitalize(tab)}`);
        if (targetPane) {
          targetPane.classList.remove("hidden");
        }

        this.currentTab = tab;

        // Render tab content on switch
        if (tab === "dashboard") this.dashboardModule.render();
        else if (tab === "routeOptimizer") this.routeOptimizerModule.render();
        else if (tab === "chatbot") this.chatbotModule.render();
        else if (tab === "knowledgeBase") this.knowledgeBaseModule.render();
      });
    });
  }

  _attachSettingsModal() {
    const openBtn = document.getElementById("openSettingsBtn");
    const closeBtn = document.getElementById("closeSettingsBtn");
    const modal = document.getElementById("settingsModal");
    const saveBtn = document.getElementById("saveSettingsBtn");

    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        this._populateSettingsForm();
        modal.classList.remove("hidden");
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const mode = document.querySelector('input[name="agentModeRadio"]:checked')?.value || "local";
        const ep1 = document.getElementById("acc1EndpointInput")?.value?.trim() || "";
        const key1 = document.getElementById("acc1KeyInput")?.value?.trim() || "";
        const dep1 = document.getElementById("acc1DeploymentInput")?.value?.trim() || "gpt-4o-mini";

        const ep2 = document.getElementById("acc2EndpointInput")?.value?.trim() || "";
        const key2 = document.getElementById("acc2KeyInput")?.value?.trim() || "";
        const dep2 = document.getElementById("acc2DeploymentInput")?.value?.trim() || "gpt-4o-mini";

        this.azureSettings.setMode(mode);
        this.azureSettings.updateAccount1(ep1, key1, dep1);
        this.azureSettings.updateAccount2(ep2, key2, dep2);

        this._updateBudgetHeader();
        modal?.classList.add("hidden");

        // Re-render active tab
        if (this.currentTab === "chatbot") this.chatbotModule.render();
      });
    }
  }

  _populateSettingsForm() {
    const stats = this.azureSettings.getBudgetStats();
    const mode = stats.mode;

    const localRadio = document.getElementById("modeLocalRadio");
    const azureRadio = document.getElementById("modeAzureRadio");
    if (mode === "azure_dual" && azureRadio) azureRadio.checked = true;
    else if (localRadio) localRadio.checked = true;

    // Account 1
    const ep1 = document.getElementById("acc1EndpointInput");
    const key1 = document.getElementById("acc1KeyInput");
    const dep1 = document.getElementById("acc1DeploymentInput");
    if (ep1) ep1.value = stats.account1.endpoint;
    if (key1) key1.value = stats.account1.apiKey;
    if (dep1) dep1.value = stats.account1.deployment;

    // Account 2
    const ep2 = document.getElementById("acc2EndpointInput");
    const key2 = document.getElementById("acc2KeyInput");
    const dep2 = document.getElementById("acc2DeploymentInput");
    if (ep2) ep2.value = stats.account2.endpoint;
    if (key2) key2.value = stats.account2.apiKey;
    if (dep2) dep2.value = stats.account2.deployment;

    // Update modal stats
    const spentText = document.getElementById("modalSpentUSD");
    const remainingText = document.getElementById("modalRemainingUSD");
    if (spentText) spentText.innerText = `$${stats.totalSpentUSD.toFixed(4)}`;
    if (remainingText) remainingText.innerText = `$${stats.remainingBudgetUSD.toFixed(2)}`;
  }

  _updateBudgetHeader() {
    const stats = this.azureSettings.getBudgetStats();
    const budgetBadge = document.getElementById("headerBudgetDisplay");
    const modeBadge = document.getElementById("headerModeDisplay");

    if (budgetBadge) {
      budgetBadge.innerHTML = `
        <i class="ri-wallet-3-line text-emerald-400"></i>
        <span>Pool: <strong>$${stats.remainingBudgetUSD.toFixed(2)}</strong> / $200</span>
      `;
    }

    if (modeBadge) {
      if (stats.mode === "azure_dual") {
        modeBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5";
        modeBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> Azure Dual-Pool`;
      } else {
        modeBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5";
        modeBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Zero-Cost ($0.00)`;
      }
    }
  }

  _capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
