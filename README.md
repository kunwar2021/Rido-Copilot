# 🚚 RIDO AI — Enterprise Fleet Intelligence & Autonomous Agent Platform

<div align="center">

[![Azure AI Foundry](https://img.shields.io/badge/Microsoft-Azure_AI_Foundry-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-Model_Context_Protocol_(MCP)-8A2BE2?style=for-the-badge&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io/)
[![Architecture](https://img.shields.io/badge/Architecture-Dual--ID_Load_Balancer-success?style=for-the-badge)](ARCHITECTURE_PLAN.md)
[![Budget](https://img.shields.io/badge/Azure_Pool-$200_Budget_Optimized-00A4EF?style=for-the-badge&logo=azuredevops&logoColor=white)](ARCHITECTURE_PLAN.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**An autonomous, multi-modal fleet operations engine powered by Microsoft Azure AI Foundry, Model Context Protocol (MCP), and Vector RAG for logistics SOP compliance.**

[Architecture Plan](ARCHITECTURE_PLAN.md) • [Features](#-key-features) • [Dual-ID Setup](#-dual-id-azure-setup) • [MCP Server](#-mcp-server-for-ides) • [Quick Start](#-quick-start)

</div>

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RIDO FRONTEND                           │
│                    HTML5 / CSS3 / ES6 Modules                   │
│                                                                 │
│  Fleet Dashboard  │  Route Optimizer  │  RIDO AI Chatbot       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST API / SSE
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RIDO CLIENT / MCP ORCHESTRATION               │
│                                                                 │
│  • Request handling & session state                             │
│  • Dual-Account Key Pool ($200 Budget Balancer & Failover)      │
│  • Azure AI Foundry SDK integration                             │
│  • Standard MCP JSON-RPC 2.0 Tool Execution                     │
│  • Live Token & Cost Telemetry Formatter                        │
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
│ • Fleet_SOP.pdf          │          │ • Live Fleet Telemetry   │
│ • Vehicle_Policy.pdf     │          │ • EV / Diesel Profiles   │
│ • Driver_Safety.pdf      │          │ • Multi-stop Waypoints   │
│ • Delivery_SOP.pdf       │          │ • SLA & Trip Analytics   │
└──────────────────────────┘          └──────────────────────────┘
```

---

## 🌟 Key Features & Engineering Highlights

### 1. 📊 Live Fleet Telemetry & Monitoring Dashboard
- **Real-Time Vehicle Grid**: Track commercial EVs, refrigerated units (reefers), and heavy diesel trucks (V-101 to V-106).
- **Critical Incident Triggers**: Instant alerts for cold-chain temperature excursions, driver shift limit breaches (8h cap), and tire pressure deviations.
- **Dynamic Telematics Gauges**: State of Charge (SoC %), fuel reserves, engine health index, and real-time payload utilization.
- **Analytics Visuals**: Live charts powered by Chart.js displaying fleet energy efficiency (kWh vs Liters) and safety scores.

### 2. 🗺️ Multi-Stop Route Optimizer & Green Fleet Engine
- **Intelligent Dispatch**: Automated vehicle-to-cargo matching factoring in payload weight, driving range, and cargo sensitivity.
- **EV vs Diesel Cost Matrix**: Real-time comparison of electricity vs diesel expenditures, toll passes, and carbon offset calculations ($\text{kg CO}_2\text{ saved}$).
- **Interactive Geospatial Map**: Leaflet.js-powered visualizer showing dynamic route paths, depot waypoints, and charging corridors.

### 3. 🤖 Microsoft Foundry Agent with Visible Thought Stream
- **Chain-of-Thought Inspection**: Visualizes every reasoning phase in real time:
  - `Intent Detection`: Identifies whether the query is telemetry-related, routing-related, or policy-related.
  - `RAG Chunk Retrieval`: Pulls relevant clauses from compliance PDFs.
  - `Autonomous Tool Execution`: Dispatches API calls to `get_fleet_status`, `optimize_route`, or `calculate_operational_cost`.
  - `Response Synthesis`: Formulates structured, actionable recommendations.

### 4. 📚 Vector RAG Knowledge Storage
Four simulated compliance documents indexed for zero-shot semantic retrieval:
- 📑 `Fleet_SOP.pdf` — Pre-trip inspections, preventative maintenance cycles, reefer temperature setpoint locks.
- 📑 `Vehicle_Policy.pdf` — Corporate RFID fueling cards, EV 85% fast-charge cap, accident cone & zero-depreciation insurance SOP.
- 📑 `Driver_Safety.pdf` — Mandatory 4.5h driving limit (45 min break), 80 km/h highway speed governance, low visibility fog SOP.
- 📑 `Delivery_SOP.pdf` — Electronic Proof of Delivery (e-POD with OTP + Geo-tag), cold-chain pharma SLA (+2°C to +8°C), and delay notifications.

### 5. 🔌 Model Context Protocol (MCP) Server for IDEs
- Connects local and remote developer environments (VS Code, Antigravity IDE, Cursor, Claude Desktop) to RIDO's tools.
- Supports both **stdio** (local process) and **SSE / HTTP** (shared over local network for multi-developer collaboration).

### 6. 💰 Dual-ID Azure Balancing Pool ($200 Budget Optimization)
- **Round-Robin Request Routing**: Distributes token consumption 50/50 between Account 1 (Yours) and Account 2 (Friend's).
- **Auto-Failover Resilience**: If one account hits rate limits or quota, traffic immediately routes to the alternate account.
- **Live Real-Time Cost Meter**: Displays exact tokens consumed, estimated expenditure, and remaining balance for both accounts.
- **Zero-Cost Offline Simulator**: 100% functional local mode with \$0 token cost for testing and presentations.

---

## ⚡ Quick Start

### 1. Zero-Cost Offline Mode (Default)
Simply open `index.html` in your browser. All tools, RAG search, dashboard metrics, and route planning run locally with **\$0 cloud cost**.

### 2. Dual-Account Azure Mode ($200 Pool)
1. Click the **Settings (⚙️)** icon in the top navigation bar.
2. Enter your credentials:
   - **Account 1**: Endpoint & Key
   - **Account 2**: Friend's Endpoint & Key
3. Toggle on **Live Dual Azure Pool Mode**.

### 3. Running the MCP Server
```bash
# Install dependencies
npm install

# Start local & SSE MCP server
node mcp-server/server.js --port 3000
```

---

## 💻 Placement & Portfolio Highlights

For interviewers reviewing this repository:
- **Distributed Agentic Architecture**: Implementation of the Anthropic/OpenAI **Model Context Protocol (MCP)** specification.
- **Multi-Tenant Cost Engineering**: Intelligent load balancing across multiple API keys with rate-limit failover and real-time telemetry metering.
- **Retrieval-Augmented Generation (RAG)**: Zero-shot retrieval across dense enterprise logistics SOPs.
- **Full-Stack Interactivity**: Clean modern UI with Leaflet geospatial maps, Chart.js telemetry, and an expandable reasoning stream.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
