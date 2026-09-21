/**
 * RIDO Dual-Account Azure Pool Manager
 * Balances requests between Account 1 (Yours) and Account 2 (Friend's)
 * Automatically tracks $200 total budget pool with failover resilience.
 */

export class DualAccountManager {
  constructor(config = {}) {
    this.accounts = [
      {
        id: "account_1",
        name: "Account 1 (Primary - Kunwar)",
        endpoint: config.endpoint1 || process.env.AZURE_OPENAI_ENDPOINT_1 || "https://kunwar2954beai24-9211-resource.openai.azure.com/",
        apiKey: config.key1 || process.env.AZURE_OPENAI_KEY_1 || "",
        deployment: config.deployment1 || process.env.AZURE_OPENAI_DEPLOYMENT_1 || "gpt-4o-mini",
        allocatedBudget: 100.0,
        tokensUsed: 0,
        estimatedCost: 0.0,
        requestsCount: 0,
        status: "active",
        lastError: null
      },
      {
        id: "account_2",
        name: "Account 2 (Secondary - Friend)",
        endpoint: config.endpoint2 || process.env.AZURE_OPENAI_ENDPOINT_2 || "",
        apiKey: config.key2 || process.env.AZURE_OPENAI_KEY_2 || "",
        deployment: config.deployment2 || process.env.AZURE_OPENAI_DEPLOYMENT_2 || "gpt-4o-mini",
        allocatedBudget: 100.0,
        tokensUsed: 0,
        estimatedCost: 0.0,
        requestsCount: 0,
        status: "idle",
        lastError: null
      }
    ];

    this.currentIndex = 0;
    this.totalBudget = 200.0;
  }

  get activePoolSize() {
    return this.accounts.filter(acc => acc.apiKey && acc.endpoint).length;
  }

  /**
   * Selects next available account with Round-Robin & Failover logic
   */
  getNextAccount() {
    const validAccounts = this.accounts.filter(
      acc => acc.apiKey && acc.endpoint && acc.status !== "rate_limited" && acc.estimatedCost < acc.allocatedBudget
    );

    if (validAccounts.length === 0) {
      // Fall back to any configured account
      const configured = this.accounts.filter(acc => acc.apiKey && acc.endpoint);
      if (configured.length > 0) return configured[0];
      return null;
    }

    // Round-robin selection
    const selected = validAccounts[this.currentIndex % validAccounts.length];
    this.currentIndex++;
    return selected;
  }

  /**
   * Logs token usage and calculates estimated cost ($0.15/1M input, $0.60/1M output approx $0.0000004/token)
   */
  recordUsage(accountId, inputTokens = 0, outputTokens = 0) {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return;

    const totalTokens = inputTokens + outputTokens;
    const cost = (inputTokens * 0.00000015) + (outputTokens * 0.00000060);

    account.tokensUsed += totalTokens;
    account.estimatedCost += cost;
    account.requestsCount += 1;
    account.status = "active";
  }

  getBudgetSummary() {
    const totalSpent = this.accounts.reduce((sum, a) => sum + a.estimatedCost, 0);
    const totalTokens = this.accounts.reduce((sum, a) => sum + a.tokensUsed, 0);
    const remaining = Math.max(0, this.totalBudget - totalSpent);

    return {
      totalBudget: this.totalBudget,
      totalSpent: parseFloat(totalSpent.toFixed(4)),
      remainingBudget: parseFloat(remaining.toFixed(2)),
      totalTokens,
      accounts: this.accounts.map(a => ({
        id: a.id,
        name: a.name,
        isConfigured: Boolean(a.apiKey && a.endpoint),
        tokensUsed: a.tokensUsed,
        estimatedCost: parseFloat(a.estimatedCost.toFixed(4)),
        remaining: parseFloat(Math.max(0, a.allocatedBudget - a.estimatedCost).toFixed(2)),
        requestsCount: a.requestsCount,
        status: a.status
      }))
    };
  }
}
