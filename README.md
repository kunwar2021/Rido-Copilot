# RIDO AI — Smart Fleet Intelligence & Routing Platform

[![Architecture](https://img.shields.io/badge/Architecture-Microsoft%20Foundry%20%2B%20MCP-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Budget](https://img.shields.io/badge/Azure%20Budget-$200%20Dual--ID%20Pool-blue?style=for-the-badge)](ARCHITECTURE_PLAN.md)

> **RIDO AI** is an intelligent fleet management, telemetry analytics, route optimization, and SOP-compliance platform powered by **Microsoft Foundry**, **Azure OpenAI**, and **Model Context Protocol (MCP)**.

---

## 🏛️ Engineering Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RIDO FRONTEND                           │
│                    HTML / CSS / JavaScript                      │
│                                                                 │
│  Fleet Dashboard  │  Route Optimizer  │  RIDO AI Chatbot       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API / BACKEND                           │
│                                                                 │
│  • Request handling                                             │
│  • Session / authentication                                     │
│  • Foundry API integration                                      │
│  • Tool execution                                               │
│  • Response formatting                                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MICROSOFT FOUNDRY                          │
│                                                                 │
│                    ┌───────────────────┐                        │
│                    │   RIDO AI AGENT   │                        │
│                    │                   │                        │
│                    │ Intent Detection  │                        │
│                    │ Planning          │                        │
│                    │ Tool Selection    │                        │
│                    │ Response Gen.     │                        │
│                    └─────────┬─────────┘                        │
│                              │                                  │
│             ┌────────────────┼────────────────┐                 │
│             ▼                ▼                ▼                 │
│       ┌───────────┐   ┌──────────────┐   ┌───────────────┐     │
│       │    RAG    │   │ AI MODEL     │   │  AI TOOLS     │     │
│       │           │   │              │   │               │     │
│       │ SOPs      │   │ Reasoning    │   │ Fleet API     │     │
│       │ Policies  │   │ Language     │   │ Route API     │     │
│       │ Manuals   │   │ Generation   │   │ Cost API      │     │
│       └─────┬─────┘   └──────────────┘   └───────┬───────┘     │
└─────────────┼────────────────────────────────────┼─────────────┘
              │                                    │
              ▼                                    ▼
┌──────────────────────────┐          ┌──────────────────────────┐
│   KNOWLEDGE STORAGE      │          │   RIDO DATA SERVICES     │
│                          │          │                          │
│ Fleet_SOP.pdf            │          │ Fleet Data               │
│ Vehicle_Policy.pdf       │          │ Vehicle Data             │
│ Driver_Safety.pdf        │          │ Route Data               │
│ Delivery_SOP.pdf         │          │ Delivery Data            │
└──────────────────────────┘          └──────────────────────────┘
```

---

## 🚀 Key Features

- 📊 **Fleet Dashboard**: Live telematics tracking, battery/fuel monitoring, cold-chain cargo temp sensors, and critical incident alerts.
- 🗺️ **Route Optimizer**: Interactive multi-stop routing with EV vs Diesel comparison, Leaflet map visualizer, toll/operational cost estimation, and carbon emission analytics.
- 🤖 **Foundry AI Agent & Thought Stream**: Multi-turn chat with step-by-step reasoning (`Intent Detection` $\rightarrow$ `Planning` $\rightarrow$ `RAG Retrieval` $\rightarrow$ `Tool Execution`).
- 📚 **RAG Knowledge Storage**: Built-in searchable SOP manuals (`Fleet_SOP.pdf`, `Vehicle_Policy.pdf`, `Driver_Safety.pdf`, `Delivery_SOP.pdf`).
- 🔌 **Model Context Protocol (MCP)**: Shared MCP server allowing both collaborators to connect their IDEs (VS Code, Antigravity, Cursor) and laptops over local network/SSE.
- 💰 **Dual-Azure ID Pool ($200 Budget)**: Load balancing and automatic failover across two \$100 Azure accounts with a real-time live cost meter and $0 offline fallback mode.

---

## 🛠️ Quick Start

### 1. Zero-Cost Offline Simulation Mode ($0.00)
Open `index.html` directly in any web browser. All tools, RAG search, dashboard metrics, and route planning run locally with zero cloud charges.

### 2. Live Azure Dual-Account Mode ($200 Pool)
1. Open the **Settings (⚙️)** in the top navigation bar.
2. Enter **Account 1** (Your Key & Endpoint) and **Account 2** (Friend's Key & Endpoint).
3. Toggle on **Live Dual Azure Pool Mode**.

### 3. MCP Server for IDEs
```bash
# Start MCP server
node mcp-server/server.js --port 3000
```
Connect your IDE (VS Code / Antigravity / Cursor) using the provided configuration templates in `mcp-configs/`.

---

## 📖 Documentation
- [Detailed Engineering Plan & $200 Budget Allocation](ARCHITECTURE_PLAN.md)
