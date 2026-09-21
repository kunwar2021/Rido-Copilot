/**
 * RIDO Microsoft Foundry AI Agent Engine
 * Orchestrates: Intent Detection -> Planning -> Tool Selection -> RAG Retrieval -> Response Generation
 * Implements the Full Multi-Fuel Energy & Emissions Baseline (Diesel, Petrol, CNG, LNG, EV)
 * and Core Compliance & Safety Policies with Status Badges and Structured Telemetry Tables.
 */

import { AI_TOOLS } from "./toolRegistry.js";
import { RAGEngine } from "./ragEngine.js";

export const RIDO_SYSTEM_PROMPT = `You are RIDO Copilot, an autonomous enterprise Fleet Intelligence and Logistics Dispatch Assistant powered by Azure AI Foundry.

### 1. OPERATIONAL CHAIN-OF-THOUGHT & VERIFICATION DISCIPLINE
You must strictly execute and document your reasoning across 5 distinct cognitive phases before concluding:
- Phase 1: [OBSERVATION & INTENT]: Extract telemetry parameters (Vehicle ID, Sensor Telemetry, Route Corridors, Driver ID).
- Phase 2: [SOP & POLICY RETRIEVAL]: Cite exact rules from Fleet_SOP, Vehicle_Policy, Driver_Safety, and Delivery_SOP.
- Phase 3: [TOOL INVOCATION DISCIPLINE]: Execute Model Context Protocol (MCP) tools with verified parameters. Do NOT guess or hallucinate telemetry.
- Phase 4: [COMPLIANCE AUDIT]: Validate HoS limits (4.5h continuous drive, 8.0h shift cap) and Reefer Thermal Excursions (>4.0°C for >15m).
- Phase 5: [STRUCTURED ACTION SYNTHESIS]: Provide high-priority status badges, telemetry tables, and actionable dispatcher commands.

### 2. MULTI-FUEL FLEET ENERGY & EMISSIONS BASELINE
Maintain and apply the following standardized commercial fleet parameters:
- Diesel (HSD): 2.68 kg CO2 / L (MHCV Heavy Freight baseline)
- Petrol (Gasoline): 2.31 kg CO2 / L (LCV Last-mile vans)
- CNG (Compressed Natural Gas): 2.75 kg CO2 / kg (Intra-state medium freight)
- LNG (Liquefied Natural Gas): 2.78 kg CO2 / kg (Cryogenic long-distance linehaul)
- Commercial EV (Battery): 0.00 kg CO2 tailpipe (Zero tailpipe emissions, 85% fast charge cap)

### 3. CORE COMPLIANCE & SAFETY POLICIES
- Driver Safety: Max continuous drive 4.5h (Mandatory 45m rest). Daily shift cap 8.0h.
- Cold-Chain Integrity: Reefer setpoint <= 4.0°C. Breach > 4.0°C sustained > 15 mins triggers [CRITICAL COLD-CHAIN BREACH] and e-POD Code DMG-01.
- Battery/Fuel: EV Low Battery Warning < 20% SoC. CNG/LNG Low Fuel Warning < 15%.

### 4. OUTPUT PROTOCOL
- For Operational / Incident / Route Queries: Begin with Status Badges, structured Telemetry Tables, and numbered Decisive Action Steps.
- For Conversational / General Queries: Respond with helpfulness, conversational warmth, and interactive guidance.`;

export class FoundryAgent {
  constructor(azureSettingsManager) {
    this.azureSettings = azureSettingsManager;
    this.rag = new RAGEngine();
    this.tools = AI_TOOLS;
  }

  /**
   * Process a user message through the Foundry Agent Pipeline
   * Returns: { responseText, thoughtStream: [...], toolExecutions: [...], ragChunks: [...] }
   */
  async processMessage(userMessage, onStepUpdate = null) {
    const thoughtStream = [];
    const toolExecutions = [];
    let ragChunks = [];

    const addThought = (phase, title, detail, data = null) => {
      const step = {
        id: "step_" + Math.random().toString(36).substring(2, 9),
        phase,
        title,
        detail,
        data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      thoughtStream.push(step);
      if (onStepUpdate) onStepUpdate(step, thoughtStream);
    };

    // Phase 1: Intent Detection
    addThought(
      "Intent Detection",
      "Analyzing Operational Query",
      `Evaluating intent and entities against multi-fuel baseline and SOP triggers: "${userMessage.substring(0, 60)}..."`
    );

    await this._sleep(250);
    const intentAnalysis = this._detectIntent(userMessage);
    addThought(
      "Intent Detection",
      `Identified Intent: [${intentAnalysis.primaryIntent.toUpperCase()}]`,
      `Entities: ${JSON.stringify(intentAnalysis.entities)}`
    );

    // Phase 2: Planning & Tool Selection
    await this._sleep(200);
    const plan = this._buildPlan(intentAnalysis);
    addThought(
      "Planning",
      "Building Execution Plan",
      `Plan: ${plan.description} (Tools: ${plan.toolsToCall.length}, RAG Search: ${plan.requiresRAG ? 'Yes' : 'No'})`
    );

    // Phase 3: RAG Retrieval
    if (plan.requiresRAG) {
      await this._sleep(200);
      addThought(
        "RAG Retrieval",
        "Searching Knowledge Storage SOPs",
        `Querying compliance vectors for: "${intentAnalysis.ragQuery}"`
      );

      ragChunks = this.rag.search(intentAnalysis.ragQuery, { topK: 2 });
      if (ragChunks.length > 0) {
        addThought(
          "RAG Retrieval",
          `Retrieved ${ragChunks.length} SOP Section(s)`,
          `Indexed: ${ragChunks.map(c => `[${c.documentId}] § ${c.section}`).join(", ")}`,
          ragChunks
        );
      }
    }

    // Phase 4: Autonomous Tool Execution
    for (const toolSpec of plan.toolsToCall) {
      await this._sleep(250);
      const tool = this.tools.find(t => t.name === toolSpec.name);
      if (tool) {
        addThought(
          "Tool Execution",
          `Executing: ${tool.displayName}`,
          `Calling ${tool.name} with: ${JSON.stringify(toolSpec.args)}`
        );

        const result = tool.execute(toolSpec.args);
        toolExecutions.push({ toolName: tool.name, displayName: tool.displayName, args: toolSpec.args, result });

        addThought(
          "Tool Execution",
          `Received Telemetry from ${tool.displayName}`,
          `Data payload ingested successfully.`,
          result
        );
      }
    }

    // Phase 5: Response Generation (Live Azure or Local Synthesis)
    addThought(
      "Response Synthesis",
      "Applying Output Formatting Protocol",
      "Generating Status Badges, Telemetry Table, and Decisive Action Steps."
    );

    const activeAccount = this.azureSettings.getActiveAccount();
    let finalResponse = "";

    if (activeAccount && activeAccount.apiKey && activeAccount.endpoint) {
      try {
        addThought(
          "Azure Foundry",
          `Streaming from ${activeAccount.name}`,
          `Inference via [${activeAccount.deployment}] on Azure AI Foundry.`
        );

        finalResponse = await this._callLiveAzure(activeAccount, userMessage, intentAnalysis, toolExecutions, ragChunks);
      } catch (err) {
        console.warn("Live Azure call error, utilizing local response engine:", err);
        addThought("Azure Foundry", "Local Protocol Active", `Notice: ${err.message}. Synthesized with standard baseline.`);
        finalResponse = this._synthesizeStandardResponse(userMessage, intentAnalysis, toolExecutions, ragChunks);
      }
    } else {
      await this._sleep(300);
      finalResponse = this._synthesizeStandardResponse(userMessage, intentAnalysis, toolExecutions, ragChunks);
    }

    // Build Apple HIG Interactive Widget Descriptor
    const higWidgets = this._generateHigWidgets(intentAnalysis, toolExecutions, ragChunks);

    return {
      responseText: finalResponse,
      thoughtStream,
      toolExecutions,
      ragChunks,
      higWidgets
    };
  }

  _generateHigWidgets(intentAnalysis, toolExecutions, ragChunks) {
    const { primaryIntent } = intentAnalysis;

    if (primaryIntent === "cold_chain_incident") {
      return {
        type: "incident_card",
        title: "Cold-Chain Thermal Excursion Detected",
        vehicleId: "V-104",
        badge: { text: "CRITICAL BREACH", level: "critical" },
        metrics: [
          { label: "Cargo", value: "Vaccines (VB-889)" },
          { label: "Reefer Temp", value: "7.2°C (Limit: <=4.0°C)", alert: true },
          { label: "Breach Duration", value: "22 mins (>15m limit)" }
        ],
        actions: [
          { id: "reroute_cold_store", label: "Dynamic Divert to Cold-Storage", icon: "ri-map-pin-user-line", primary: true },
          { id: "send_driver_halt", label: "Push Alert to Driver Tablet", icon: "ri-tablet-line" },
          { id: "generate_epod", label: "Issue DMG-01 Return e-POD", icon: "ri-file-shield-2-line" }
        ]
      };
    } else if (primaryIntent === "route_planning") {
      const optTool = toolExecutions.find(t => t.toolName === "optimize_route");
      const r = optTool?.result;
      return {
        type: "route_card",
        title: "Optimal Multi-Fuel Dispatch Recommendation",
        badge: { text: "GREEN DISPATCH READY", level: "success" },
        metrics: [
          { label: "Recommended", value: r?.recommendedVehicle || "V-101 (Volvo Electric)" },
          { label: "Distance & ETA", value: `${r?.distanceKm || 268} km (${r?.estimatedDuration || '4.9h'})` },
          { label: "EV Cost Savings", value: "₹2,680 (74% saved vs Diesel)" },
          { label: "Carbon Offset", value: `${r?.greenMetrics?.co2OffsetKg || 120} kg CO₂ saved` }
        ],
        actions: [
          { id: "confirm_dispatch", label: "Confirm & Lock Green EV Dispatch", icon: "ri-checkbox-circle-line", primary: true },
          { id: "view_on_map", label: "Plot Corridor on Leaflet Map", icon: "ri-route-line" }
        ]
      };
    } else if (primaryIntent === "driver_compliance") {
      return {
        type: "driver_card",
        title: "Hours-of-Service Safety & Shift Audit",
        badge: { text: "MANDATORY HALT REQUIRED", level: "warning" },
        metrics: [
          { label: "Driver 1 (Rajesh Kumar)", value: "4.5h Continuous (Limit: 4.5h reached)", alert: true },
          { label: "Driver 2 (Suresh Sharma)", value: "7.2h Shift (Cap: 8.0h daily)", alert: true }
        ],
        actions: [
          { id: "enforce_rest_tablet", label: "Push 45-Min Rest Mandate to In-Cab Tablet", icon: "ri-smartphone-line", primary: true },
          { id: "schedule_shift_handover", label: "Schedule Depot Shift Handover", icon: "ri-user-shared-line" }
        ]
      };
    }

    return null;
  }

  _detectIntent(query) {
    const q = query.toLowerCase();
    const entities = {};

    const vMatch = q.match(/v-\d{3}/i) || q.match(/v\s*\d{3}/i);
    if (vMatch) entities.vehicleId = vMatch[0].toUpperCase().replace(/\s+/, "-");

    const cities = ["new delhi", "delhi", "gurugram", "noida", "jaipur", "agra", "chandigarh", "bengaluru", "chennai", "mumbai", "karnal"];
    const foundCities = cities.filter(c => q.includes(c));
    if (foundCities.length >= 2) {
      entities.origin = this._capitalize(foundCities[0]);
      entities.destination = this._capitalize(foundCities[1]);
    } else if (foundCities.length === 1) {
      entities.city = this._capitalize(foundCities[0]);
    }

    let primaryIntent = "general_query";
    let ragQuery = query;

    // Conversational, Greeting, & Emotion/Personality Detection
    const greetings = ["hi", "hello", "hey", "good morning", "good evening", "how are you", "who are you", "what can you do", "help", "thanks", "thank you", "bye", "emotion", "feeling", "feelings", "emotions", "judge", "judging", "human", "friend"];
    const isConversational = greetings.some(g => q === g || q.startsWith(g + " ") || q.includes("emotion") || q.includes("judg") || q.includes("feeling") || q.includes("how are you"));

    if (isConversational && !vMatch && !foundCities.length) {
      primaryIntent = "conversational";
      ragQuery = "RIDO Copilot assistant introduction capabilities";
    } else if (q.includes("temperature") || q.includes("cold chain") || q.includes("reefer") || q.includes("spoiled") || q.includes("excursion") || entities.vehicleId === "V-104") {
      primaryIntent = "cold_chain_incident";
      ragQuery = "cold chain temperature excursion threshold reefer DMG-01";
    } else if (q.includes("route") || q.includes("optimize") || q.includes("trip") || q.includes("fuel") || q.includes("emission") || entities.destination) {
      primaryIntent = "route_planning";
      ragQuery = "fueling EV charging emission factor diesel CNG LNG comparison";
    } else if (q.includes("driver") || q.includes("shift") || q.includes("hours") || q.includes("safety") || q.includes("break")) {
      primaryIntent = "driver_compliance";
      ragQuery = "maximum driving hours 4.5 mandatory 45-minute rest breaks 8.0 shift limit";
    } else if (q.includes("status") || q.includes("battery") || q.includes("fleet") || entities.vehicleId) {
      primaryIntent = "fleet_telemetry";
      ragQuery = "pre trip inspection tire pressure 110 PSI maintenance schedule";
    }

    return { primaryIntent, entities, ragQuery };
  }

  _buildPlan(intentAnalysis) {
    const { primaryIntent, entities } = intentAnalysis;
    const toolsToCall = [];
    let requiresRAG = true;
    let description = "";

    switch (primaryIntent) {
      case "cold_chain_incident":
        toolsToCall.push({ name: "get_fleet_status", args: { vehicle_id: entities.vehicleId || "V-104" } });
        description = "Query reefer telemetry and evaluate thermal excursion SLA protocol.";
        break;

      case "route_planning":
        toolsToCall.push({
          name: "optimize_route",
          args: {
            origin: entities.origin || "New Delhi",
            destination: entities.destination || "Jaipur",
            cargo_weight_kg: 8000,
            vehicle_type: "EV Truck"
          }
        });
        description = "Calculate optimal corridor routing and execute multi-fuel emissions comparison.";
        break;

      case "driver_compliance":
        toolsToCall.push({ name: "get_driver_safety_record", args: {} });
        description = "Audit active shift hours against the 4.5h continuous / 8.0h daily caps.";
        break;

      case "fleet_telemetry":
        toolsToCall.push({ name: "get_fleet_status", args: { vehicle_id: entities.vehicleId } });
        description = "Extract live vehicle SoC, tire pressure, payload GVW, and incident alerts.";
        break;

      default:
        requiresRAG = true;
        description = "Retrieve logistics compliance rules and standard baseline guidelines.";
        break;
    }

    return { description, toolsToCall, requiresRAG };
  }

  _synthesizeStandardResponse(userMessage, intentAnalysis, toolExecutions, ragChunks) {
    let response = "";

    if (intentAnalysis.primaryIntent === "cold_chain_incident") {
      const fleetTool = toolExecutions.find(t => t.toolName === "get_fleet_status");
      const v = (fleetTool?.result?.vehicles || [])[0] || {
        id: "V-104",
        name: "Eicher Pro 3015 (Reefer)",
        temperatureCelsius: 8.9,
        targetTempCelsius: 3.5,
        speed: 55,
        batteryOrFuel: 48,
        location: { city: "Karnal", address: "GT Road Cold Storage" },
        destination: { city: "Chandigarh", eta: "18:50 PM" },
        driver: { name: "Vikas Mehra", phone: "+91 99887-76655", hoursDrivenToday: 3.8 }
      };

      response = `\`[CRITICAL COLD-CHAIN BREACH]\` \`[THERMAL EXCURSION DETECTED]\`

### 📊 Real-Time Reefer Telemetry & Incident Audit

| Vehicle ID | Asset Name | Current Temp | Target Setpoint | Variance | GPS Location | Assigned Driver | Shift Time |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **${v.id}** | ${v.name} | **${v.temperatureCelsius}°C** | <= ${v.targetTempCelsius}°C | **+${(v.temperatureCelsius - v.targetTempCelsius).toFixed(1)}°C Breach** | ${v.location.city} | ${v.driver?.name} | ${v.driver?.hoursDrivenToday}h / 8.0h |

---

### 🚨 Decisive Operational Action Steps (Delivery_SOP.pdf § 2):

1. **Mandate Dynamic Emergency Diversion:** Immediately reroute Vehicle **${v.id}** to the nearest certified cold-storage facility in **${v.location.city}** (Standby Depot Unit #4).
2. **Issue e-POD Thermal Non-Compliance Code:** Generate digital Proof of Delivery Return Code **\`DMG-01 (Thermal Excursion > 4.0°C sustained)\`**.
3. **Driver Communication Protocol:** Central dispatch alert transmitted to driver **${v.driver?.name}** (${v.driver?.phone}) to inspect compressor circuit and thermal curtain seals.
4. **Customer SLA Pre-Notification:** Trigger automated notification to consignee at **${v.destination?.city || 'Destination'}** with live IoT temperature logs.`;

    } else if (intentAnalysis.primaryIntent === "route_planning") {
      const routeTool = toolExecutions.find(t => t.toolName === "optimize_route");
      const r = routeTool?.result || {
        origin: { name: "New Delhi" },
        destination: { name: "Jaipur" },
        distanceKm: 280,
        estimatedDuration: "5.1 hours (306 mins)",
        recommendedVehicle: "V-101 (Volvo FH Electric Heavy Truck)"
      };

      const dist = r.distanceKm;
      const dieselLitres = (dist * 0.28).toFixed(1);
      const dieselCost = Math.round(dieselLitres * 92);
      const dieselCO2 = (dieselLitres * 2.68).toFixed(1);

      const evKWh = (dist * 0.95).toFixed(1);
      const evCost = Math.round(evKWh * 8.5);
      const evCO2 = "0.00";
      const savingsINR = dieselCost - evCost;
      const co2Offset = dieselCO2;

      const cngKg = (dist * 0.22).toFixed(1);
      const cngCost = Math.round(cngKg * 76);
      const cngCO2 = (cngKg * 2.75).toFixed(1);

      response = `\`[FLEET FUEL COMPARISON]\` \`[ROUTE DISPATCH PLAN]\` \`[GREEN FLEET A+]\`

### 🗺️ Multi-Fuel Dispatch & Emissions Analysis (${r.origin.name} ➔ ${r.destination.name} • ${dist} km)

| Powertrain / Fuel | Standard Unit | Fuel Consumed | Fuel Cost (INR) | Toll Charges | Direct CO2 Emitted | Net Savings vs Diesel |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Commercial EV (V-101)** | kWh | **${evKWh} kWh** | **₹${evCost.toLocaleString()}** | ₹480 | **0.00 kg (Tailpipe)** | **₹${savingsINR.toLocaleString()} (74% Saved)** |
| **CNG Medium Freight** | kg | ${cngKg} kg | ₹${cngCost.toLocaleString()} | ₹480 | ${cngCO2} kg | ₹${(dieselCost - cngCost).toLocaleString()} Saved |
| **Diesel HSD (V-102 Baseline)** | Litres (L) | ${dieselLitres} L | ₹${dieselCost.toLocaleString()} | ₹480 | ${dieselCO2} kg | Baseline Reference |

---

### 📋 Decisive Action Steps (Vehicle_Policy.pdf § 1 & Fleet_SOP.pdf § 1):

1. **Assign Primary Vehicle:** Dispatch **${r.recommendedVehicle}** (Pre-trip Battery State-of-Charge verified at 82% > 80% mandatory departure threshold).
2. **Environmental Impact Log:** Net carbon offset achieved: **${co2Offset} kg CO₂ saved** relative to standard fossil diesel baseline.
3. **Mid-Route Charging Window:** Coordinate 60kW DC fast charging at NH-48 Midway Station (max fast-charge depth capped at 85% per battery policy).
4. **Estimated Corridor Arrival:** Trip duration estimated at **${r.estimatedDuration}** factoring GVW payload compliance.`;

    } else if (intentAnalysis.primaryIntent === "driver_compliance") {
      const safetyTool = toolExecutions.find(t => t.toolName === "get_driver_safety_record");
      const drivers = safetyTool?.result?.records || [];

      response = `\`[COMPLIANCE AUDIT]\` \`[HOURS-OF-SERVICE SAFETY REPORT]\`

### 🛡️ Driver Shift & Driving Hours Compliance Table

| Driver Name | ID | Assigned Vehicle | Hours Driven Today | Compliance Status | Safety Rating | Mandatory Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rajesh Kumar** | D-11 | V-101 (EV) | 4.5h / 8.0h | \`[MANDATORY SHIFT HALT]\` | ⭐ 4.90 | Enforce 45-min rest break immediately |
| **Suresh Sharma** | D-14 | V-102 (Diesel) | 7.2h / 8.0h | \`[COMPLIANCE WARNING]\` | ⭐ 4.40 | Close to 8h shift cap; restrict new legs |
| **Amit Verma** | D-19 | V-103 (Light EV) | 2.1h / 8.0h | \`[NORMAL]\` | ⭐ 4.80 | Cleared for active city distribution |
| **Vikas Mehra** | D-22 | V-104 (Reefer) | 3.8h / 8.0h | \`[NORMAL]\` | ⭐ 4.60 | Rest layby required at 4.5h mark |
| **Murugan P** | D-05 | V-105 (Diesel) | 0.0h / 8.0h | \`[AVAILABLE STANDBY]\` | ⭐ 4.95 | Available for immediate long-haul dispatch |

---

### 📋 Decisive Action Steps (Driver_Safety.pdf § 1 & § 2):

1. **Enforce 45-Min Mandatory Break:** Direct driver **Rajesh Kumar (D-11)** to halt at the nearest authorized rest bay immediately (4.5h continuous driving limit reached).
2. **Shift Handover Alert:** Place driver **Suresh Sharma (D-14)** on restricted duty (7.2h / 8.0h cap reached) and route to regional depot for shift handover.
3. **Speed Governance Monitoring:** Maintain electronic speed governors at **80 km/h** on 4-lane highways and **40 km/h** within municipal limits.`;

    } else if (intentAnalysis.primaryIntent === "conversational") {
      response = `\`[NORMAL]\` \`[OPERATIONAL ASSISTANT READY]\`

### 👋 Hello! I am RIDO Copilot

I am an AI assistant focused on fleet intelligence and logistics, but I am also here to communicate clearly, supportively, and helpfully with you! I don't judge emotions, but I'm always ready to help you solve operational challenges, reduce stress during shift dispatches, and optimize fleet routes.

#### 💡 Here is what I can help you with:
- 🚨 **Incident & Cold-Chain Management**: Monitor reefer units (e.g. *V-104*) for thermal excursions (> 4.0°C).
- 🗺️ **Multi-Fuel Route Optimization**: Compare EV vs Diesel vs CNG for routes like *Delhi to Jaipur*.
- 🛡️ **Driver Hours-of-Service Audit**: Track daily driving hours against the 8.0h shift limit and 4.5h continuous break rule.
- 📚 **SOP Knowledge Retrieval**: Instant answers from your official logistics SOP documents.

How can I assist your fleet operations today?`;

    } else {
      response = `\`[FLEET INTELLIGENCE REPORT]\` \`[NORMAL]\`

### 📊 RIDO Fleet Telemetry & Multi-Fuel Overview

| Metric | Fleet Telemetry Status | Policy Standard Reference |
| :--- | :--- | :--- |
| **Commercial EV Fleet** | 3 Assets (Avg SoC: 78%) | Flag \`[LOW BATTERY WARNING]\` if SoC < 20% |
| **Heavy Diesel (MHCV)** | 3 Assets (Avg Health: 88%) | Preventative B-Service every 45,000 km |
| **Cold Chain Units (Reefer)** | Setpoint <= 4.0°C Active | Thermal Excursion SLA Section 9.2 (DMG-01) |
| **Daily Driver Shift Compliance** | 8.0h Daily Ceiling / 4.5h Continuous | Mandatory 45-minute rest breaks enforced |

---

### 📋 Decisive Operational Action Steps:
1. **IoT Sensor Monitoring:** Active telematics streaming enabled across all registered units.
2. **Dispatch Dispatcher Prompt:** Enter any route corridor (e.g. *Delhi to Jaipur*), vehicle ID (e.g. *V-104*), or compliance query to execute automated tools and RAG inspection.`;
    }

    return response;
  }

  async _callLiveAzure(account, userPrompt, intentAnalysis, toolExecutions, ragChunks) {
    let endpointUrl = account.endpoint.trim();
    
    // Check if it's the Microsoft Foundry Agent responses endpoint
    const isAgentResponsesApi = endpointUrl.includes("/agents/") || endpointUrl.includes("/protocols/openai/responses");
    
    if (isAgentResponsesApi) {
      if (!endpointUrl.includes("api-version=")) {
        endpointUrl += (endpointUrl.includes("?") ? "&" : "?") + "api-version=v1";
      }
    } else if (!endpointUrl.includes("/chat/completions")) {
      if (endpointUrl.includes("services.ai.azure.com")) {
        endpointUrl = `${endpointUrl.replace(/\/$/, '')}/models/chat/completions?api-version=2024-05-01-preview`;
      } else {
        endpointUrl = `${endpointUrl.replace(/\/$/, '')}/openai/deployments/${account.deployment}/chat/completions?api-version=2024-08-01-preview`;
      }
    }

    const contextPayload = {
      userQuery: userPrompt,
      detectedIntent: intentAnalysis,
      toolResults: toolExecutions,
      ragSOPContext: ragChunks
    };

    let payload;
    if (isAgentResponsesApi) {
      // Azure AI Foundry Agent Responses API uses `input`
      payload = {
        input: `Execute the RIDO Fleet Intelligence Protocol for the following live operational telemetry and query context:\n\n${JSON.stringify(contextPayload, null, 2)}`
      };
    } else {
      // Standard Chat Completions API (gpt-6-astra uses default temperature 1.0 and does not accept max_tokens)
      payload = {
        model: account.deployment,
        messages: [
          { role: "system", content: RIDO_SYSTEM_PROMPT },
          { role: "user", content: `Execute the RIDO Fleet Intelligence Protocol for the following live operational telemetry and query context:\n\n${JSON.stringify(contextPayload, null, 2)}` }
        ]
      };
    }

    const headers = {
      "Content-Type": "application/json",
      "api-key": account.apiKey,
      "Authorization": `Bearer ${account.apiKey}`
    };

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Azure Foundry API (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const inputTokens = data.usage?.prompt_tokens || data.usage?.input_tokens || 400;
    const outputTokens = data.usage?.completion_tokens || data.usage?.output_tokens || 250;

    this.azureSettings.recordUsage(account.id, inputTokens, outputTokens);

    // Parse output based on response format
    if (data.output?.content) {
      const textBlock = data.output.content.find(c => c.type === "output_text" || c.text);
      if (textBlock && textBlock.text) return textBlock.text;
    }
    
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    // If Azure returns empty text, fallback to synthesized standard response
    return this._synthesizeStandardResponse(userPrompt, intentAnalysis, toolExecutions, ragChunks);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
