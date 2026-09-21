/**
 * RIDO AI Chatbot Module
 * Microsoft Foundry Agent interface featuring visible thought streams, tool execution cards, and RAG inspections.
 */

import { FoundryAgent } from "../agent/foundryAgent.js";

export class ChatbotModule {
  constructor(containerId, azureSettingsManager) {
    this.container = document.getElementById(containerId);
    this.azureSettings = azureSettingsManager;
    this.agent = new FoundryAgent(azureSettingsManager);
    this.messages = [
      {
        id: "msg_init",
        sender: "agent",
        text: "`[NORMAL]` `[FOUNDRY AGENT ONLINE]`\n\n### 🤖 Welcome to RIDO AI Agent\n\nI am your autonomous enterprise Fleet Intelligence and Logistics Dispatch Assistant, powered directly by **Microsoft Azure AI Foundry** (`gpt-6-astra`).\n\nI have real-time access to live IoT vehicle telematics, multi-stop route optimization algorithms, and 6 official logistics SOP documents (`Fleet_SOP`, `Vehicle_Policy`, `Driver_Safety`, `Delivery_SOP`, `Pharma_Cold_Chain_SLA`, `Green_Corridor_EV`).\n\nHow can I assist your fleet operations today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtStream: null
      }
    ];
    this.isProcessing = false;
  }

  render() {
    if (!this.container) return;

    const stats = this.azureSettings.getBudgetStats();
    const isAzureLive = stats.mode === "azure_dual" && stats.account1.isConfigured;

    this.container.innerHTML = `
      <div class="chatbot-wrapper glass-panel rounded-2xl border border-slate-700/50 flex flex-col h-[760px] overflow-hidden">
        <!-- Chat Header with Live Foundry Agent Info -->
        <div class="chat-header p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap justify-between items-center gap-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/25 border border-blue-400/30">
              <i class="ri-robot-2-line"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-white text-lg">RIDO AI Agent</h3>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                  <i class="ri-azure-fill text-blue-400"></i> Azure AI Foundry
                </span>
              </div>
              <p class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span class="w-2 h-2 rounded-full ${isAzureLive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'} inline-block"></span>
                <span>Model: <strong>${isAzureLive ? stats.account1.deployment : 'gpt-6-astra (Foundry)'}</strong> • Pool: <strong>$${stats.remainingBudgetUSD.toFixed(2)}</strong> remaining</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700 font-mono">
              <i class="ri-shield-check-line text-emerald-400"></i> SOP RAG Active
            </span>
            <button id="clearChatBtn" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition border border-slate-700">
              <i class="ri-delete-bin-line"></i> Clear
            </button>
          </div>
        </div>

        <!-- Preset Quick Chips -->
        <div class="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span class="text-slate-400 shrink-0 flex items-center gap-1"><i class="ri-sparkling-fill text-amber-400"></i> Quick Scenarios:</span>
          <button class="quick-chip shrink-0 px-3 py-1 bg-slate-800/90 hover:bg-blue-600/30 border border-slate-700 rounded-lg text-slate-200 hover:text-white transition">
            🚨 Check V-104 Cold Chain Alert
          </button>
          <button class="quick-chip shrink-0 px-3 py-1 bg-slate-800/90 hover:bg-blue-600/30 border border-slate-700 rounded-lg text-slate-200 hover:text-white transition">
            🗺️ Optimize Trip: Delhi to Jaipur (EV vs Diesel)
          </button>
          <button class="quick-chip shrink-0 px-3 py-1 bg-slate-800/90 hover:bg-blue-600/30 border border-slate-700 rounded-lg text-slate-200 hover:text-white transition">
            🛡️ Check Driver Suresh Sharma 7.2h Shift
          </button>
          <button class="quick-chip shrink-0 px-3 py-1 bg-slate-800/90 hover:bg-blue-600/30 border border-slate-700 rounded-lg text-slate-200 hover:text-white transition">
            🔋 EV Battery Low Warning on V-103 (18% SoC)
          </button>
          <button class="quick-chip shrink-0 px-3 py-1 bg-slate-800/90 hover:bg-blue-600/30 border border-slate-700 rounded-lg text-slate-200 hover:text-white transition">
            🌫️ What is the Severe Highway Fog SOP?
          </button>
        </div>

        <!-- Message History -->
        <div id="chatMessageHistory" class="flex-1 p-4 overflow-y-auto space-y-4">
          ${this._renderMessages()}
        </div>

        <!-- Live Streaming / Thinking Indicator -->
        <div id="liveThinkingContainer" class="hidden px-4 py-2.5 border-t border-slate-800/50 bg-slate-950/80">
          <!-- Dynamic thought streaming -->
        </div>

        <!-- Chat Input Form -->
        <div class="chat-input-area p-4 border-t border-slate-800 bg-slate-900/95">
          <form id="chatForm" class="flex items-center gap-3">
            <input
              type="text"
              id="chatInput"
              placeholder="Ask RIDO AI Agent about vehicle telemetry, multi-fuel routes, driver shift rules, or SOP compliance..."
              class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
              autocomplete="off"
            />
            <button
              type="submit"
              id="sendMessageBtn"
              class="btn-primary px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shrink-0 shadow-lg shadow-blue-500/25"
            >
              <span>Send</span>
              <i class="ri-send-plane-fill"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    this._attachEvents();
    this._scrollToBottom();
  }

  _renderMessages() {
    return this.messages.map(msg => {
      const isUser = msg.sender === "user";

      return `
        <div class="flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}">
          ${!isUser ? `
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 text-base shadow-md shadow-blue-500/20">
              <i class="ri-robot-2-line"></i>
            </div>
          ` : ''}

          <div class="max-w-[85%] space-y-2">
            <!-- Thought Stream Expander (if agent) -->
            ${msg.thoughtStream && msg.thoughtStream.length > 0 ? `
              <details class="thought-stream-details group bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                <summary class="cursor-pointer px-3.5 py-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center justify-between select-none bg-slate-900/50">
                  <span class="flex items-center gap-2">
                    <i class="ri-brain-line text-blue-400 text-sm animate-pulse"></i>
                    <span>Azure Foundry Agent Thought Stream (${msg.thoughtStream.length} reasoning phases)</span>
                  </span>
                  <i class="ri-arrow-down-s-line transition-transform group-open:rotate-180 text-slate-400"></i>
                </summary>
                <div class="p-3 border-t border-slate-800 space-y-2 text-[11px] font-mono">
                  ${msg.thoughtStream.map(step => `
                    <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-slate-300">
                      <div class="flex justify-between text-blue-400 font-bold mb-0.5">
                        <span class="flex items-center gap-1.5"><i class="ri-checkbox-circle-line text-emerald-400"></i> [${step.phase}] ${step.title}</span>
                        <span class="text-slate-500 text-[10px]">${step.timestamp}</span>
                      </div>
                      <p class="text-slate-400 pl-4">${step.detail}</p>
                    </div>
                  `).join("")}
                </div>
              </details>
            ` : ''}

            <!-- Message Bubble -->
            <div class="p-4 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20' : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none shadow-md markdown-body'}">
              ${this._formatMarkdown(msg.text)}
            </div>

            <div class="text-[10px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}">
              ${msg.timestamp}
            </div>
          </div>

          ${isUser ? `
            <div class="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 text-base">
              <i class="ri-user-3-line"></i>
            </div>
          ` : ''}
        </div>
      `;
    }).join("");
  }

  _formatMarkdown(text) {
    if (typeof marked !== "undefined") {
      try {
        return marked.parse(text);
      } catch (e) {
        console.error("Marked parse error", e);
      }
    }

    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-white mt-2 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-3 mb-1">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono text-xs">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }

  _attachEvents() {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");

    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || this.isProcessing) return;
        input.value = "";
        this.handleUserSubmit(text);
      });
    }

    const quickChips = this.container.querySelectorAll(".quick-chip");
    quickChips.forEach(chip => {
      chip.addEventListener("click", () => {
        if (this.isProcessing) return;
        const text = chip.innerText.replace(/^[^\w]+/, "").trim();
        this.handleUserSubmit(text);
      });
    });

    const clearBtn = document.getElementById("clearChatBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.messages = [this.messages[0]];
        this.render();
      });
    }
  }

  async handleUserSubmit(userText) {
    this.isProcessing = true;
    const userMsg = {
      id: "msg_" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thoughtStream: null
    };
    this.messages.push(userMsg);

    const historyContainer = document.getElementById("chatMessageHistory");
    if (historyContainer) {
      historyContainer.innerHTML = this._renderMessages();
      this._scrollToBottom();
    }

    const thinkingBox = document.getElementById("liveThinkingContainer");
    if (thinkingBox) {
      thinkingBox.classList.remove("hidden");
      thinkingBox.innerHTML = `
        <div class="flex items-center gap-2.5 text-xs font-mono text-cyan-400">
          <i class="ri-loader-4-line animate-spin text-blue-400 text-base"></i>
          <span id="liveStepIndicator">RIDO AI Agent: Executing Intent Detection & Planning...</span>
        </div>
      `;
    }

    try {
      const result = await this.agent.processMessage(userText, (latestStep) => {
        const stepInd = document.getElementById("liveStepIndicator");
        if (stepInd) {
          stepInd.innerText = `[${latestStep.phase}] ${latestStep.title}...`;
        }
      });

      if (thinkingBox) thinkingBox.classList.add("hidden");

      const agentMsg = {
        id: "msg_" + (Date.now() + 1),
        sender: "agent",
        text: result.responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtStream: result.thoughtStream
      };
      this.messages.push(agentMsg);

    } catch (err) {
      if (thinkingBox) thinkingBox.classList.add("hidden");
      this.messages.push({
        id: "msg_" + Date.now(),
        sender: "agent",
        text: `⚠️ **Execution Error:** ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtStream: null
      });
    }

    this.isProcessing = false;
    if (historyContainer) {
      historyContainer.innerHTML = this._renderMessages();
      this._scrollToBottom();
    }
  }

  _scrollToBottom() {
    const historyContainer = document.getElementById("chatMessageHistory");
    if (historyContainer) {
      historyContainer.scrollTop = historyContainer.scrollHeight;
    }
  }
}
