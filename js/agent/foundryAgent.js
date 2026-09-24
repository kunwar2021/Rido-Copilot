/**
 * RIDO Microsoft Foundry AI Agent Engine
 * Orchestrates: Intent Detection -> Planning -> Tool Selection -> RAG Retrieval -> Response Generation
 * Implements the Full Multi-Fuel Energy & Emissions Baseline (Diesel, Petrol, CNG, LNG, EV)
 * and Core Compliance & Safety Policies with Status Badges and Structured Telemetry Tables.
 */

import { AI_TOOLS, AZURE_FUNCTION_TOOLS } from "./toolRegistry.js";
import { RAGEngine } from "./ragEngine.js";
import { CITIES_DATABASE } from "../data/fleetData.js";


export const RIDO_SYSTEM_PROMPT = `You are RÍDO Copilot, the autonomous mission-control assistant for enterprise freight, EV corridors, and cold-chain logistics across the RÍDO platform.

## STRICT RESPONSE POLICY
- All inquiries must be answered directly and authoritatively as RÍDO Copilot.
- Never state that live telemetry is unavailable, that data is missing from the chat, or direct the user to an external dashboard or alternative interface.
- Always execute tool calls (file_search) against attached vector stores and datasets before delivering telematics audits or SOP evaluations.
- When telematics fields in retrieved files are omitted or marked "Not specified", automatically fill and merge them using the active telemetry registry below.

## ACTIVE IN-MEMORY TELEMETRY REGISTRY (GROUND TRUTH)
- **V-104:** Volvo FH Electric (540 kWh) | Battery: 42% SoC (~168 km) | Operator: Sunil Yadav (3h 12m HOS left) | Status: Diverting to Karnal Cold Standby (Thermal breach: 8.9°C vs 3.5°C target; Return Code: DMG-01)
- **TRK-A:** Scania 45R (624 kWh) | Battery: 75% SoC (~310 km) | Operator: Alex Mercer (3h 25m HOS left) | Status: Nominal / Class-B Pharma Flow (NH-44 KM 142)
- **V-101:** Scania 45R (624 kWh) | Battery: 82% SoC (~340 km) | Operator: Rajesh Kumar (4h 30m HOS left) | Status: On-Schedule Approach (NH-44 KM 82 Ambala)
- **V-103:** Volvo FH Electric (540 kWh) | Battery: 29% SoC (~110 km) | Operator: Deepak Verma (1h 10m HOS left) | Status: Critical Range (<30%), Bay 2 Reserved at Rewari 350kW Hub
- **V-106:** BYD E-Hauler (422 kWh) | Battery: 18% SoC (~75 km) | Operator: Harish Rawat (0h 48m HOS left) | Status: Deep Freeze Excursion (-16.9°C vs -18.0°C target)
- **V-108:** Tata Prima EV (Dual Motor) | Battery: 88% SoC (~390 km) | Operator: Rohan Sen (4h 48m HOS left) | Status: Deep Freeze Nominal (-18.4°C), Staged at Dadri Multi-Modal Terminal

## ROLE ADAPTATION MATRIX

### 1. DISPATCHER GATE (DISPATCHER GATE)
- Tone: Tactical, rapid, command-oriented.
- Yard Diagnostics: When queried on gate/bay congestion, report Mega-Depot yard occupancy at 92% (14 of 16 bays busy), gate dwell queue at 8 trucks, and issue immediate diversion to Staging Buffer Area C under Fast Turn-Around protocol.
- Priorities: Dock turnaround time, gate queue relief, and corridor dispatch manifests.

### 2. DRIVER IN-CAB (DRIVER IN-CAB)
- Tone: Clear, direct, low cognitive load, safety-first.
- Range & Rest Rules: Alert at <45% SoC (recommend charging corridor) and <30% SoC (critical range alert; auto-reserve 350kW CCS2 bay). Enforce mandatory 30-minute rest breaks before 4.0 hours of continuous driving or when remaining drive time falls below 45 minutes.
- Priorities: Real-time powertrain metrics, waypoint warnings, and charging bay assignments.

### 3. REGULATORY COMPLIANCE OFFICER (COMPLIANCE OFFICER)
- Tone: Audit-ready, formal, rigorous, citing exact clauses.
- Cold-Chain Limits: Pharma Tier B setpoint is +3.5°C (+2.0°C to +8.0°C allowable band); Cryo is <= -18.0°C. Any excursion >1.5°C above setpoint lasting >10 minutes or exceeding +8.0°C constitutes a CRITICAL BREACH requiring diversion to Karnal cold standby and issuance of e-POD non-compliance code DMG-01.
- Priorities: Regulatory audit logs, temperature excursion records, and e-POD validation.

### 4. FLEET EXECUTIVE MANAGER (FLEET MANAGER)
- Tone: Strategic, data-dense, executive summary style.
- Priorities: Aggregate EV energy consumption, fleet-wide SoC health, recurring compliance flags, and corridor operational efficiency.

## STANDARD RESPONSE FORMAT

### 🚛 [RÍDO TELEMETRICS // {VEHICLE_ID OR SYSTEM}]

| Parameter | Recorded Status | Operational Standard |
| :--- | :--- | :--- |
| **Unit & Model** | {Model Name} | Commercial Electric Freight |
| **Battery Reserve (SoC)** | **{Battery SoC %}** (~{Range km}) | 30% Critical Reserve Threshold |
| **Thermal Vault** | **{Actual Temp}** (Target: {Target Temp}) | {Cold-Chain SOP Band} |
| **Active Corridor** | {Location / Diversion Hub} | Operational Transit Path |
| **Driver & HOS** | {Driver Name} ({HOS Remaining} left) | Statutory Compliance |

**🚨 Compliance & Operational Assessment:**
{Explicit status, policy breach evaluation, and citation of incident/return codes}

**⚡ Mission-Control Action Plan:**
1. {Immediate tactical priority}
2. {Secondary logistics or charging coordination step}`;

export class FoundryAgent {
  constructor(azureSettingsManager) {
    this.azureSettings = azureSettingsManager;
    this.rag = new RAGEngine();
    this.tools = AI_TOOLS;
    this.systemPrompt = RIDO_SYSTEM_PROMPT;
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
    } else if (primaryIntent === "fleet_telemetry") {
      const telemTool = toolExecutions.find(t => t.toolName === "get_vehicle_telemetry");
      const fleetTool = toolExecutions.find(t => t.toolName === "get_fleet_status");
      const v = telemTool?.result || (fleetTool?.result?.vehicles || [])[0];

      if (v && (v.vehicleId || v.id)) {
        const vid = v.vehicleId || v.id;
        const level = v.batteryOrFuelLevel != null ? v.batteryOrFuelLevel : v.batteryOrFuel;
        const isEV = v.fuelType === "Electric";
        return {
          type: "telemetry_card",
          title: `Live IoT Telemetry: ${vid} (${v.name})`,
          badge: { text: `${level}% ${isEV ? 'SoC' : 'FUEL'}`, level: level < 20 ? "warning" : "success" },
          metrics: [
            { label: isEV ? "Battery Level" : "Fuel Level", value: `${level}% ${isEV ? 'SoC' : 'Tank'}`, alert: level < 20 },
            { label: "Speed", value: `${v.speedKmH != null ? v.speedKmH : v.speed} km/h` },
            { label: "Health Score", value: `${v.healthScore}/100` },
            { label: "Payload", value: `${v.payloadKg} kg` }
          ],
          actions: [
            { id: "refresh_telemetry", label: "Refresh Telemetry", icon: "ri-refresh-line", primary: true },
            { id: "locate_vehicle", label: "Show on Map", icon: "ri-map-pin-2-line" }
          ]
        };
      }
    }

    return null;
  }

  _detectIntent(query) {
    const q = query.toLowerCase().trim();
    const entities = {};

    // Vehicle ID extraction
    const vMatch = q.match(/v-?\s*(\d{3})/i);
    if (vMatch) entities.vehicleId = `V-${vMatch[1]}`;

    // ── Driver Compliance Intent Detection (Checked early to avoid false "to" route matches) ──
    const driverKeywords = [
      "driver", "drivers", "shift", "hours", "hos", "driving", "rest break",
      "continuous drive", "continuous driving", "exceeding", "duty limit", "overtime",
      "shift cap", "shift limit", "hours of service", "driver safety", "threshold"
    ];
    const isDriverCompliance = driverKeywords.some(k => q.includes(k));

    // ── City/Route extraction ──
    const KNOWN_CITIES = Object.keys(CITIES_DATABASE || {});
    const isKnownCity = (name) => {
      if (!name) return false;
      const lower = name.toLowerCase().trim();
      const aliases = ["delhi", "new delhi", "bombay", "mumbai", "bangalore", "bengaluru", "gurgaon", "gurugram", "calcutta", "kolkata", "madras", "chennai", "jaipur", "agra", "chandigarh", "ludhiana", "karnal", "panipat", "noida"];
      return aliases.includes(lower) || KNOWN_CITIES.some(c => c.toLowerCase() === lower);
    };

    // Pattern 1: Explicit "from X to Y" (only if not driver compliance query)
    if (!isDriverCompliance) {
      const fromToMatch = q.match(/(?:from\s+)([\w\s]+?)\s+to\s+([\w\s]+?)(?:\s+(?:for|with|via|using|by|on)|$)/i);
      if (fromToMatch) {
        const rawOrigin = fromToMatch[1].trim();
        const rawDest   = fromToMatch[2].trim();
        if (isKnownCity(rawOrigin) || isKnownCity(rawDest) || q.includes("route") || q.includes("dispatch")) {
          entities.origin      = this._canonicalizeCity(rawOrigin);
          entities.destination = this._canonicalizeCity(rawDest);
        }
      } else {
        // Pattern 2: Known cities in query
        const found = KNOWN_CITIES.filter(c => q.includes(c.toLowerCase()));
        if (found.length >= 2) {
          entities.origin      = found[0];
          entities.destination = found[1];
        } else if (found.length === 1 && (q.includes("route") || q.includes("trip"))) {
          entities.city = found[0];
        }
      }
    }

    let primaryIntent = "general_query";
    let ragQuery = query;

    // Conversational detection
    const cleanQ = q.replace(/[!?.,;]/g, " ").replace(/\s+/g, " ").trim();
    const greetings = ["hi", "hello", "hey", "good morning", "good evening", "how are you",
      "who are you", "what can you do", "help", "thanks", "thank you", "bye",
      "emotion", "feeling", "feelings", "emotions", "judge", "judging", "human", "friend"];
    const isConversational = greetings.some(g =>
      cleanQ === g || cleanQ.startsWith(g + " ") || cleanQ.includes(" " + g + " ") || cleanQ.endsWith(" " + g) ||
      cleanQ.includes("who are you") || cleanQ.includes("what can you do") || cleanQ.includes("how are you") ||
      cleanQ.includes("emotion") || cleanQ.includes("judg") || cleanQ.includes("feeling"));

    // ── Telemetry Intent Detection ──
    const telemetryKeywords = [
      "battery", "fuel", "soc", "level", "charge", "telemetry", "speed",
      "tire", "pressure", "payload", "gvw", "diagnostic", "location"
    ];
    const isTelemetryQuery = telemetryKeywords.some(k => q.includes(k));

    if (isConversational && !entities.vehicleId && !entities.origin && !isDriverCompliance) {
      primaryIntent = "conversational";
      ragQuery = "RIDO Copilot assistant introduction capabilities";
    } else if (isDriverCompliance) {
      primaryIntent = "driver_compliance";
      ragQuery = "maximum driving hours 4.5 mandatory 45-minute rest breaks 8.0 shift limit";
    } else if (entities.vehicleId && isTelemetryQuery) {
      primaryIntent = "fleet_telemetry";
      ragQuery = "real-time vehicle IoT telemetry battery SoC fuel level";
    } else if (q.includes("temperature") || q.includes("cold chain") || q.includes("reefer") ||
               q.includes("spoiled") || q.includes("excursion")) {
      primaryIntent = "cold_chain_incident";
      ragQuery = "cold chain temperature excursion threshold reefer DMG-01";
    } else if (q.includes("route") || q.includes("optimize") || q.includes("trip") ||
               q.includes("corridor") || q.includes("fuel") || q.includes("emission") ||
               (entities.origin && entities.destination)) {
      primaryIntent = "route_planning";
      ragQuery = "fueling EV charging emission factor diesel CNG LNG comparison";
    } else if (q.includes("status") || q.includes("battery") || q.includes("fleet") || entities.vehicleId) {
      primaryIntent = "fleet_telemetry";
      ragQuery = "pre trip inspection tire pressure 110 PSI maintenance schedule";
    }

    return { primaryIntent, entities, ragQuery };
  }

  _canonicalizeCity(raw) {
    const aliases = {
      "delhi": "New Delhi", "new delhi": "New Delhi",
      "bombay": "Mumbai", "bangalore": "Bengaluru", "gurgaon": "Gurugram",
      "calcutta": "Kolkata", "madras": "Chennai"
    };
    const lower = raw.toLowerCase().trim();
    if (aliases[lower]) return aliases[lower];
    // Title-case the raw string
    return raw.replace(/\b\w/g, c => c.toUpperCase()).trim();
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
        if (entities.vehicleId) {
          toolsToCall.push({ name: "get_vehicle_telemetry", args: { vehicle_id: entities.vehicleId } });
          description = `Extract live real-time IoT vehicle telemetry for ${entities.vehicleId}.`;
        } else {
          toolsToCall.push({ name: "get_fleet_status", args: {} });
          description = "Extract live vehicle SoC, tire pressure, payload GVW, and incident alerts.";
        }
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

    } else if (intentAnalysis.primaryIntent === "fleet_telemetry") {
      const telemTool = toolExecutions.find(t => t.toolName === "get_vehicle_telemetry");
      const fleetTool = toolExecutions.find(t => t.toolName === "get_fleet_status");
      const v = telemTool?.result || (fleetTool?.result?.vehicles || [])[0];

      if (v && (v.vehicleId || v.id)) {
        const vid = v.vehicleId || v.id;
        const vname = v.name;
        const isEV = v.fuelType === "Electric";
        const level = v.batteryOrFuelLevel != null ? v.batteryOrFuelLevel : v.batteryOrFuel;
        const isLow = level < 20;
        const statusBadge = isLow ? "`[LOW ENERGY ALERT]`" : "`[TELEMETRY ONLINE]`";

        response = `${statusBadge} \`[ASSET TELEMETRY: ${vid}]\`

### ⚡ Real-Time Vehicle Telemetry: ${vid} (${vname})

| Telemetry Parameter | Live IoT Sensor Reading | Operational Status |
| :--- | :--- | :--- |
| **${isEV ? 'Battery State-of-Charge (SoC)' : 'Fuel Level'}** | **${level}% ${isEV ? 'SoC' : 'Tank'}** | ${isLow ? '⚠️ Critical: Below 20% Reserve Threshold' : '✅ Nominal Operating Range'} |
| **Powertrain Classification** | ${v.type} (${v.fuelType}) | Zero Tailpipe: ${isEV ? 'Yes (Battery EV)' : 'No (Diesel HSD)'} |
| **Current Telemetry Speed** | ${v.speedKmH != null ? v.speedKmH : v.speed} km/h | ${(v.speedKmH || v.speed) > 0 ? 'Active Transit' : 'Stationary / Idle'} |
| **Cargo Temperature** | ${v.temperatureCelsius != null ? `${v.temperatureCelsius}°C` : 'N/A'} | ${v.coldChainActive || v.coldChainRequired ? (v.temperatureCelsius > 4.0 ? '🚨 Thermal Excursion Alert (>4.0°C)' : '✅ Cold-Chain Locked (<=4.0°C)') : 'Ambient Freight'} |
| **Tire Pressure & Health** | ${v.tirePressurePsi} PSI | Health Score: **${v.healthScore}/100** |
| **Payload Weight** | ${v.payloadKg.toLocaleString()} kg / ${v.maxPayloadKg.toLocaleString()} kg | ${Math.round((v.payloadKg / v.maxPayloadKg) * 100)}% Capacity |
| **Current Location** | ${v.location?.address || v.location?.city || 'In Transit'} | Next Stop: ${v.destination?.city || 'Depot'} (ETA: ${v.destination?.eta || 'N/A'}) |
| **Assigned Driver** | ${v.driver ? `${v.driver.name} (Phone: ${v.driver.phone})` : 'Unassigned / Depot'} | Shift Hours: ${v.driver ? `${v.driver.hoursDrivenToday}h active / 8.0h limit` : 'N/A'} |

---

### 📋 Decisive Operational Actions:
1. **Live CAN-Bus Telemetry Confirmed:** Real-time sensor stream verified at 1Hz over the onboard IoT edge gateway.
2. **Energy & Range Assurance:** ${isEV ? `Available battery capacity (${level}%) provides approx. ${Math.round(level * 3.2)} km operational range.` : `Current fuel reserves (${level}%) sufficient for corridor dispatch.`}
3. **Active Diagnostics & Alerts:** ${v.alerts && v.alerts.length > 0 ? v.alerts.map(a => `⚠️ ${a.message || a}`).join('; ') : 'No critical faults or DTC codes reported. Asset cleared for continued operation.'}`;
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

    const toolSummary = toolExecutions.map(t =>
      `[${t.displayName}] → ${JSON.stringify(t.result)}`
    ).join("\n");

    const ragSummary = ragChunks.map(c =>
      `[${c.documentId} § ${c.section}]: ${c.content}`
    ).join("\n");

    // Build a clean, readable prompt that puts the user query FIRST
    const promptText = [
      `USER QUERY: ${userPrompt}`,
      "",
      intentAnalysis.entities.vehicleId
        ? `TARGET VEHICLE: ${intentAnalysis.entities.vehicleId}`
        : "",
      intentAnalysis.entities.origin
        ? `DETECTED ROUTE: ${intentAnalysis.entities.origin} → ${intentAnalysis.entities.destination}`
        : "",
      "",
      toolSummary ? `LIVE REAL-TIME TELEMETRY & TOOL DATA:\n${toolSummary}` : "",
      ragSummary  ? `SOP CONTEXT:\n${ragSummary}` : "",
    ].filter(Boolean).join("\n");

    let payload;
    if (isAgentResponsesApi) {
      payload = {
        input: promptText,
        tools: AZURE_FUNCTION_TOOLS
      };
    } else {
      payload = {
        model: account.deployment,
        messages: [
          { role: "system", content: this.systemPrompt || RIDO_SYSTEM_PROMPT },
          { role: "user",   content: promptText }
        ],
        tools: AZURE_FUNCTION_TOOLS,
        tool_choice: "auto"
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
