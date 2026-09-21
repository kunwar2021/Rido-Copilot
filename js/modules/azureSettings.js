/**
 * RIDO Dual Azure ID Manager & $200 Budget Meter Module
 */

const STORAGE_KEY = "rido_azure_dual_config";

export class AzureSettingsManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved Azure settings", e);
      }
    }

    return {
      mode: "local", // "local" ($0.00 free mode) or "azure_dual" (Live Azure $200 pool)
      account1: {
        id: "account_1",
        label: "Account 1 (Kunwar - Primary)",
        endpoint: "https://kunwar2954beai24-9211-resource.openai.azure.com/",
        apiKey: "",
        deployment: "gpt-4o-mini",
        allocatedBudget: 100.0,
        tokensUsed: 0,
        spentUSD: 0.0,
        status: "ready"
      },
      account2: {
        id: "account_2",
        label: "Account 2 (Friend - Secondary)",
        endpoint: "",
        apiKey: "",
        deployment: "gpt-4o-mini",
        allocatedBudget: 100.0,
        tokensUsed: 0,
        spentUSD: 0.0,
        status: "idle"
      },
      totalPoolBudgetUSD: 200.0,
      activeAccountIndex: 0
    };
  }

  saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
  }

  setMode(mode) {
    this.config.mode = mode;
    this.saveConfig();
  }

  updateAccount1(endpoint, apiKey, deployment) {
    this.config.account1.endpoint = endpoint;
    this.config.account1.apiKey = apiKey;
    this.config.account1.deployment = deployment || "gpt-4o-mini";
    this.saveConfig();
  }

  updateAccount2(endpoint, apiKey, deployment) {
    this.config.account2.endpoint = endpoint;
    this.config.account2.apiKey = apiKey;
    this.config.account2.deployment = deployment || "gpt-4o-mini";
    this.saveConfig();
  }

  recordUsage(accountId, inputTokens = 0, outputTokens = 0) {
    const acc = accountId === "account_2" ? this.config.account2 : this.config.account1;
    const tokens = inputTokens + outputTokens;
    const cost = (inputTokens * 0.00000015) + (outputTokens * 0.00000060);

    acc.tokensUsed += tokens;
    acc.spentUSD += cost;
    this.saveConfig();
  }

  getActiveAccount() {
    if (this.config.mode !== "azure_dual") return null;

    const acc1Valid = Boolean(this.config.account1.apiKey && this.config.account1.endpoint);
    const acc2Valid = Boolean(this.config.account2.apiKey && this.config.account2.endpoint);

    if (acc1Valid && acc2Valid) {
      // Round-robin
      const selected = this.config.activeAccountIndex % 2 === 0 ? this.config.account1 : this.config.account2;
      this.config.activeAccountIndex++;
      this.saveConfig();
      return selected;
    } else if (acc1Valid) {
      return this.config.account1;
    } else if (acc2Valid) {
      return this.config.account2;
    }
    return null;
  }

  getBudgetStats() {
    const totalSpent = this.config.account1.spentUSD + this.config.account2.spentUSD;
    const totalTokens = this.config.account1.tokensUsed + this.config.account2.tokensUsed;
    const remaining = Math.max(0, this.config.totalPoolBudgetUSD - totalSpent);

    return {
      mode: this.config.mode,
      totalPoolBudget: this.config.totalPoolBudgetUSD,
      totalSpentUSD: parseFloat(totalSpent.toFixed(4)),
      remainingBudgetUSD: parseFloat(remaining.toFixed(2)),
      totalTokens,
      account1: {
        ...this.config.account1,
        remainingUSD: parseFloat(Math.max(0, this.config.account1.allocatedBudget - this.config.account1.spentUSD).toFixed(2)),
        isConfigured: Boolean(this.config.account1.apiKey && this.config.account1.endpoint)
      },
      account2: {
        ...this.config.account2,
        remainingUSD: parseFloat(Math.max(0, this.config.account2.allocatedBudget - this.config.account2.spentUSD).toFixed(2)),
        isConfigured: Boolean(this.config.account2.apiKey && this.config.account2.endpoint)
      }
    };
  }
}
