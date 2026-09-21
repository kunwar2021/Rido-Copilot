/**
 * RIDO Microsoft Foundry AI Agent Engine
 * Orchestrates: Intent Detection -> Planning -> Tool Selection -> RAG Retrieval -> Response Generation
 * Supports both Zero-Cost Local Heuristic Mode ($0) and Live Dual Azure OpenAI Rest Calls ($200 Pool).
 */

import { AI_TOOLS } from "./toolRegistry.js";
import { RAGEngine } from "./ragEngine.js";

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

    // -------------------------------------------------------------
    // Phase 1: Intent Detection
    // -------------------------------------------------------------
    addThought(
      "Intent Detection",
      "Analyzing User Prompt & Context",
      `Classifying intent and entities from: "${userMessage.substring(0, 60)}${userMessage.length > 60 ? '...' : ''}"`
    );

    await this._sleep(300);

    const intentAnalysis = this._detectIntent(userMessage);
    addThought(
      "Intent Detection",
      `Intent Identified: [${intentAnalysis.primaryIntent.toUpperCase()}]`,
      `Entities detected: ${JSON.stringify(intentAnalysis.entities)}`
    );

    // -------------------------------------------------------------
    // Phase 2: Agent Planning & RAG / Tool Selection
    // -------------------------------------------------------------
    await this._sleep(250);
    const plan = this._buildPlan(intentAnalysis);
    addThought(
      "Planning",
      "Generating Execution Plan",
      `Plan: ${plan.description} (Requires ${plan.toolsToCall.length} Tool(s), RAG Search: ${plan.requiresRAG ? 'Yes' : 'No'})`
    );

    // -------------------------------------------------------------
    // Phase 3: RAG Retrieval (if applicable)
    // -------------------------------------------------------------
    if (plan.requiresRAG) {
      await this._sleep(200);
      addThought(
        "RAG Retrieval",
        "Searching Knowledge Storage SOPs",
        `Querying vectors for compliance docs: "${intentAnalysis.ragQuery}"`
      );

      ragChunks = this.rag.search(intentAnalysis.ragQuery, { topK: 2 });
      if (ragChunks.length > 0) {
        addThought(
          "RAG Retrieval",
          `Found ${ragChunks.length} Relevant Policy Section(s)`,
          `Retrieved: ${ragChunks.map(c => `[${c.documentId}] § ${c.section}`).join(", ")}`,
          ragChunks
        );
      } else {
        addThought("RAG Retrieval", "No Direct Policy Override Needed", "Standard operating limits apply.");
      }
    }

    // -------------------------------------------------------------
    // Phase 4: Autonomous Tool Execution
    // -------------------------------------------------------------
    for (const toolSpec of plan.toolsToCall) {
      await this._sleep(300);
      const tool = this.tools.find(t => t.name === toolSpec.name);
      if (tool) {
        addThought(
          "Tool Execution",
          `Executing AI Tool: ${tool.displayName}`,
          `Calling ${tool.name} with params: ${JSON.stringify(toolSpec.args)}`
        );

        const result = tool.execute(toolSpec.args);
        toolExecutions.push({ toolName: tool.name, displayName: tool.displayName, args: toolSpec.args, result });

        addThought(
          "Tool Execution",
          `Tool Completed: ${tool.displayName}`,
          `Received payload with ${result.totalFound !== undefined ? `${result.totalFound} items` : 'calculation results'}`,
          result
        );
      }
    }

    // -------------------------------------------------------------
    // Phase 5: Response Generation (Live Azure or Local Model)
    // -------------------------------------------------------------
    addThought(
      "Response Synthesis",
      "Formulating Final Response",
      "Synthesizing telemetry data, SOP rules, and route analytics into structured response."
    );

    const activeAccount = this.azureSettings.getActiveAccount();
    let finalResponse = "";

    if (activeAccount && activeAccount.apiKey && activeAccount.endpoint) {
      try {
        addThought(
          "Azure Foundry",
          `Routing to ${activeAccount.name}`,
          `Using deployment [${activeAccount.deployment}] via pooled endpoint.`
        );

        finalResponse = await this._callLiveAzure(activeAccount, userMessage, intentAnalysis, toolExecutions, ragChunks);
      } catch (err) {
        console.warn("Live Azure call failed, falling back to local synthesizer:", err);
        addThought("Azure Foundry", "Fallback to Local Engine", `Live call error: ${err.message}. Synthesized locally.`);
        finalResponse = this._synthesizeLocalResponse(userMessage, intentAnalysis, toolExecutions, ragChunks);
      }
    } else {
      await this._sleep(350);
      finalResponse = this._synthesizeLocalResponse(userMessage, intentAnalysis, toolExecutions, ragChunks);
    }

    return {
      responseText: finalResponse,
      thoughtStream,
      toolExecutions,
      ragChunks
    };
  }

  _detectIntent(query) {
    const q = query.toLowerCase();
    const entities = {};

    // Check vehicle match
    const vMatch = q.match(/v-\d{3}/i) || q.match(/v\s*\d{3}/i);
    if (vMatch) entities.vehicleId = vMatch[0].toUpperCase().replace(/\s+/, "-");

    // Check city matches
    const cities = ["new delhi", "delhi", "gurugram", "noida", "jaipur", "agra", "chandigarh", "bengaluru", "chennai", "mumbai", "karnal"];
    const foundCities = cities.filter(c => q.includes(c));
    if (foundCities.length >= 2) {
      entities.origin = this._capitalize(foundCities[0]);
      entities.destination = this._capitalize(foundCities[1]);
    } else if (foundCities.length === 1) {
      entities.city = this._capitalize(foundCities[0]);
    }

    // Classify intent
    let primaryIntent = "general_query";
    let ragQuery = query;

    if (q.includes("temperature") || q.includes("cold chain") || q.includes("reefer") || q.includes("spoiled") || q.includes("excursion")) {
      primaryIntent = "cold_chain_incident";
      ragQuery = "cold chain temperature excursion threshold reefer";
    } else if (q.includes("route") || q.includes("optimize") || q.includes("trip") || q.includes("deliver from") || entities.destination) {
      primaryIntent = "route_planning";
      ragQuery = "EV fast charging depth limits gross vehicle weight payload";
    } else if (q.includes("driver") || q.includes("shift") || q.includes("hours") || q.includes("safety") || q.includes("fog") || q.includes("speed")) {
      primaryIntent = "driver_compliance";
      ragQuery = "maximum driving hours rest breaks speed governance weather";
    } else if (q.includes("status") || q.includes("battery") || q.includes("fuel") || q.includes("fleet") || entities.vehicleId) {
      primaryIntent = "fleet_telemetry";
      ragQuery = "pre trip inspection tire pressure maintenance schedule";
    } else if (q.includes("cost") || q.includes("budget") || q.includes("azure") || q.includes("money") || q.includes("price")) {
      primaryIntent = "cost_analytics";
      ragQuery = "fueling EV charging corporate card guidelines";
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
        description = "Check cold chain vehicle telemetry & evaluate Delivery/Reefer SOP compliance.";
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
        description = "Calculate optimal multi-stop routing and compare EV vs Diesel operational costs.";
        break;

      case "driver_compliance":
        toolsToCall.push({ name: "get_driver_safety_record", args: {} });
        description = "Audit driver shift durations against the 4.5h continuous / 8h daily limit in Driver_Safety.pdf.";
        break;

      case "fleet_telemetry":
        toolsToCall.push({ name: "get_fleet_status", args: { vehicle_id: entities.vehicleId } });
        description = "Query live fleet telemetry database and inspect battery/fuel/tire indicators.";
        break;

      case "cost_analytics":
        toolsToCall.push({ name: "calculate_operational_cost", args: { distance_km: 250, vehicle_id: entities.vehicleId || "V-101" } });
        description = "Compute financial breakdown of energy, driver pay, and highway tolls.";
        break;

      default:
        requiresRAG = true;
        description = "Retrieve logistics SOP guidelines and standard compliance policies.";
        break;
    }

    return { description, toolsToCall, requiresRAG };
  }

  _synthesizeLocalResponse(userMessage, intentAnalysis, toolExecutions, ragChunks) {
    let response = "";

    if (intentAnalysis.primaryIntent === "cold_chain_incident") {
      const fleetTool = toolExecutions.find(t => t.toolName === "get_fleet_status");
      const v = (fleetTool?.result?.vehicles || [])[0];
      const ragChunk = ragChunks[0];

      response = `### 🚨 Cold-Chain Compliance & Incident Analysis\n\n`;
      if (v) {
        response += `**Vehicle Alert Detected on ${v.id} (${v.name}):**\n`;
        response += `- **Current Internal Temp:** \`${v.temperatureCelsius}°C\` (Target: \`${v.targetTempCelsius}°C\`)\n`;
        response += `- **Driver:** ${v.driver?.name} (${v.driver?.phone})\n`;
        response += `- **Current Location:** ${v.location.city} → **Destination:** ${v.destination?.city}\n`;
        response += `- **Alert:** ${v.alerts[0]?.message || 'Temperature deviation'}\n\n`;
      }

      if (ragChunk) {
        response += `**📋 Regulatory SOP Protocol (${ragChunk.documentId} — ${ragChunk.section}):**\n`;
        response += `> *"${ragChunk.content}"*\n\n`;
      }

      response += `**Recommended Action:**\n`;
      response += `1. **Immediate Reefer Standby:** Dispatch diversion order to ${v?.location?.city || 'local depot'} cold storage.\n`;
      response += `2. **Driver Contact:** Central dispatch has triggered an alert to driver ${v?.driver?.name}.\n`;
      response += `3. **Quality Check:** Execute e-POD return inspection code \`DMG-01\` if transit temperature was above 4.0°C for >15 mins.`;

    } else if (intentAnalysis.primaryIntent === "route_planning") {
      const routeTool = toolExecutions.find(t => t.toolName === "optimize_route");
      const r = routeTool?.result;

      response = `### 🗺️ RIDO Route Optimization & Dispatch Plan\n\n`;
      if (r) {
        response += `**Route:** \`${r.origin.name}\` ➔ \`${r.destination.name}\`\n`;
        response += `- **Estimated Distance:** **${r.distanceKm} km** | **Estimated Duration:** ${r.estimatedDuration}\n`;
        response += `- **Recommended Vehicle:** **${r.recommendedVehicle}**\n\n`;

        response += `**💰 Financial Cost Comparison:**\n`;
        response += `- **Energy / Fuel Cost:** ₹${r.financialBreakdown.fuelOrPowerCostINR.toLocaleString()}\n`;
        response += `- **Toll Passes:** ₹${r.financialBreakdown.tollChargesINR.toLocaleString()}\n`;
        response += `- **Driver Allowance:** ₹${r.financialBreakdown.driverAllowanceINR.toLocaleString()}\n`;
        response += `- **Total Trip Cost:** **₹${r.financialBreakdown.totalEstimatedCostINR.toLocaleString()}** (₹${r.financialBreakdown.costPerKmINR}/km)\n\n`;

        response += `**🌱 Environmental Impact:**\n`;
        response += `- **CO₂ Emissions Saved:** \`${r.greenMetrics.co2OffsetKg} kg CO₂\` (${r.greenMetrics.greenFleetRating})\n\n`;
      }

      if (ragChunks.length > 0) {
        response += `**Policy Note (${ragChunks[0].documentId}):** ${ragChunks[0].content.substring(0, 160)}...`;
      }

    } else if (intentAnalysis.primaryIntent === "driver_compliance") {
      const safetyTool = toolExecutions.find(t => t.toolName === "get_driver_safety_record");
      const drivers = safetyTool?.result?.records || [];

      response = `### 🛡️ Driver Safety & Shift Compliance Audit\n\n`;
      response += `**Driver Hours Telematics Summary:**\n\n`;
      response += `| Driver | Vehicle | Hours Today | Shift Limit Status | Safety Rating |\n`;
      response += `| :--- | :--- | :--- | :--- | :--- |\n`;

      drivers.forEach(d => {
        const statusBadge = d.hoursDrivenToday >= 7.0 ? "⚠️ Near 8.0h Limit" : "✅ Compliant";
        response += `| **${d.name}** | ${d.assignedVehicle} | ${d.hoursDrivenToday}h / 8.0h | ${statusBadge} | ⭐ ${d.safetyRating} |\n`;
      });

      if (ragChunks.length > 0) {
        response += `\n**📋 SOP Standard (${ragChunks[0].documentId} — ${ragChunks[0].section}):**\n`;
        response += `> *"${ragChunks[0].content}"*\n`;
      }

    } else if (intentAnalysis.primaryIntent === "fleet_telemetry") {
      const fleetTool = toolExecutions.find(t => t.toolName === "get_fleet_status");
      const vehicles = fleetTool?.result?.vehicles || [];

      response = `### 📊 Live Fleet Telemetry Report\n\n`;
      if (vehicles.length === 1) {
        const v = vehicles[0];
        response += `**Vehicle ${v.id} (${v.name}):**\n`;
        response += `- **Status:** \`${v.status}\` | **Fuel/Battery:** \`${v.batteryOrFuel}%\` (${v.fuelType})\n`;
        response += `- **Current Speed:** ${v.speed} km/h | **Health Score:** ${v.healthScore}/100\n`;
        response += `- **Current Location:** ${v.location.city} (${v.location.address})\n`;
        if (v.destination) response += `- **Heading to:** ${v.destination.city} (ETA: ${v.destination.eta})\n`;
        response += `- **Assigned Driver:** ${v.driver ? `${v.driver.name} (Driven: ${v.driver.hoursDrivenToday}h)` : 'None (Maintenance)'}\n`;
      } else {
        response += `Found **${vehicles.length} active vehicles** in the fleet:\n\n`;
        vehicles.slice(0, 4).forEach(v => {
          response += `- **${v.id} (${v.name})**: Status: \`${v.status}\`, Energy: \`${v.batteryOrFuel}%\`, Location: ${v.location.city}\n`;
        });
      }

      if (ragChunks.length > 0) {
        response += `\n**Relevant SOP Reference:** [${ragChunks[0].documentId}] § ${ragChunks[0].section}`;
      }

    } else {
      // General RAG synthesis
      response = `### 💡 RIDO Knowledge Intelligence\n\n`;
      if (ragChunks.length > 0) {
        ragChunks.forEach(chunk => {
          response += `#### 📄 ${chunk.documentTitle} (${chunk.documentId} — ${chunk.section})\n`;
          response += `> ${chunk.content}\n\n`;
        });
        response += `*Retrieved from RIDO Knowledge Storage using Microsoft Foundry Vector Search.*`;
      } else {
        response += `I have analyzed your query across the RIDO Fleet platform. You can ask me to optimize routes, check vehicle telemetry (e.g. \`V-101\`, \`V-104\`), inspect driver shift limits, or search any of the 4 logistics SOP manuals.`;
      }
    }

    return response;
  }

  async _callLiveAzure(account, userPrompt, intentAnalysis, toolExecutions, ragChunks) {
    const systemPrompt = `You are RIDO AI, an intelligent autonomous Fleet Dispatch & Logistics Assistant powered by Microsoft Azure AI Foundry.
You have real-time access to vehicle telematics, route optimization algorithms, driver shift records, and official company SOPs.
Format your responses cleanly in GitHub-style Markdown with clear bullet points, data tables, and actionable advice.

Here is the tool data and SOP knowledge context retrieved for this query:
${JSON.stringify({ intent: intentAnalysis, tools: toolExecutions, ragContext: ragChunks }, null, 2)}`;

    const endpointUrl = `${account.endpoint.replace(/\/$/, '')}/openai/deployments/${account.deployment}/chat/completions?api-version=2024-08-01-preview`;

    const payload = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    };

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": account.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Azure API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const inputTokens = data.usage?.prompt_tokens || 400;
    const outputTokens = data.usage?.completion_tokens || 200;

    // Record usage in budget meter
    this.azureSettings.recordUsage(account.id, inputTokens, outputTokens);

    return data.choices?.[0]?.message?.content || "No response received from Azure model.";
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
