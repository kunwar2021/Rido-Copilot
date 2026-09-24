/**
 * RIDO AI — Model Context Protocol (MCP) Server
 * Exposes Fleet Telemetry, Route Optimizer, Cost Calculator, and SOP RAG Search tools to IDEs.
 */

import http from "http";
import readline from "readline";
import { DualAccountManager } from "./dualAccountManager.js";
import { INITIAL_FLEET_DATA } from "../js/data/fleetData.js";
import { KNOWLEDGE_DOCUMENTS } from "../js/data/knowledgeDocs.js";

const accountManager = new DualAccountManager();

export const MCP_TOOLS = [
  {
    name: "get_vehicle_telemetry",
    description: "Get real-time IoT vehicle telemetry including battery SoC %, fuel level %, speed, cargo temperature, tire pressure, and driver shift hours for a specific vehicle.",
    inputSchema: {
      type: "object",
      properties: {
        vehicle_id: { type: "string", description: "Mandatory vehicle ID (e.g. 'V-101', 'V-102', 'V-103', 'V-104', 'V-105', 'V-106')" }
      },
      required: ["vehicle_id"]
    }
  },
  {
    name: "get_fleet_status",
    description: "Get real-time vehicle telemetry, battery/fuel status, current driver shift hours, and critical cold-chain alerts.",
    inputSchema: {
      type: "object",
      properties: {
        vehicle_id: { type: "string", description: "Optional specific vehicle ID (e.g. 'V-101', 'V-104'). Omit for all vehicles." },
        status_filter: { type: "string", enum: ["In Transit", "Active Delivery", "Critical Alert", "Maintenance", "Idle", "All"], description: "Filter by vehicle status" }
      }
    }
  },
  {
    name: "optimize_route",
    description: "Calculate optimal multi-stop route, waypoint distances, EV vs Diesel cost, toll estimations, and carbon emissions saved.",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "Starting city/depot (e.g. 'New Delhi')" },
        destination: { type: "string", description: "Target delivery city (e.g. 'Jaipur')" },
        cargo_weight_kg: { type: "number", description: "Total payload weight in kilograms" },
        vehicle_type: { type: "string", enum: ["EV Truck", "Diesel Truck", "Light EV", "Refrigerated Diesel"], description: "Vehicle classification" }
      },
      required: ["origin", "destination", "cargo_weight_kg"]
    }
  },
  {
    name: "calculate_operational_cost",
    description: "Breakdown financial cost for a route including fuel/energy, driver allowances, toll passes, and cold-chain refrigeration surcharge.",
    inputSchema: {
      type: "object",
      properties: {
        distance_km: { type: "number", description: "Total trip distance in kilometers" },
        vehicle_id: { type: "string", description: "Vehicle ID to pull exact consumption specs" },
        has_cold_chain: { type: "boolean", description: "Whether continuous refrigeration is required" }
      },
      required: ["distance_km", "vehicle_id"]
    }
  },
  {
    name: "search_knowledge_sops",
    description: "RAG Semantic Search over Fleet SOPs, Vehicle Policies, Driver Safety, and Delivery SLA manuals.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query (e.g. 'cold chain temperature limit', 'maximum driving hours')" },
        document_category: { type: "string", enum: ["All", "Operations", "Policy", "Safety", "Logistics"], description: "Optional filter by SOP category" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_azure_budget_status",
    description: "Check current $200 Azure Dual-Account pool usage, tokens consumed, and remaining balance across both accounts.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

export function handleToolExecution(name, args = {}) {
  switch (name) {
    case "get_vehicle_telemetry": {
      const vid = (args.vehicle_id || "").trim().toUpperCase();
      const vehicle = INITIAL_FLEET_DATA.find(v => v.id.toUpperCase() === vid) ||
                      INITIAL_FLEET_DATA.find(v => v.id.replace("-", "") === vid.replace("-", ""));
      if (!vehicle) {
        return { status: "NOT_FOUND", error: `Vehicle ${args.vehicle_id} not found.` };
      }
      return {
        status: "LIVE_TELEMETRY_ONLINE",
        timestamp: new Date().toISOString(),
        vehicleId: vehicle.id,
        name: vehicle.name,
        type: vehicle.type,
        fuelType: vehicle.fuelType,
        batteryOrFuelLevel: vehicle.batteryOrFuel,
        batteryOrFuelUnit: vehicle.fuelType === "Electric" ? "% SoC" : "% Fuel Tank",
        speedKmH: vehicle.speed,
        payloadKg: vehicle.payloadKg,
        maxPayloadKg: vehicle.maxPayloadKg,
        temperatureCelsius: vehicle.temperatureCelsius,
        targetTempCelsius: vehicle.targetTempCelsius,
        coldChainActive: vehicle.coldChainRequired,
        tirePressurePsi: vehicle.tirePressurePsi,
        healthScore: vehicle.healthScore,
        location: vehicle.location,
        destination: vehicle.destination,
        driver: vehicle.driver,
        alerts: vehicle.alerts
      };
    }

    case "get_fleet_status": {
      let results = [...INITIAL_FLEET_DATA];
      if (args.vehicle_id) {
        results = results.filter(v => v.id.toLowerCase() === args.vehicle_id.toLowerCase());
      }
      if (args.status_filter && args.status_filter !== "All") {
        results = results.filter(v => v.status.toLowerCase() === args.status_filter.toLowerCase());
      }
      return { count: results.length, vehicles: results };
    }

    case "optimize_route": {
      const { origin, destination, cargo_weight_kg, vehicle_type = "EV Truck" } = args;
      const baseDistance = 270; // Simulated km
      const isEV = vehicle_type.toLowerCase().includes("ev");
      const energyRatePerKm = isEV ? 3.2 : 12.8; // ₹ / km
      const energyCost = Math.round(baseDistance * energyRatePerKm);
      const tollCost = 480;
      const co2SavedKg = isEV ? Math.round(baseDistance * 0.42) : 0;

      return {
        origin,
        destination,
        distanceKm: baseDistance,
        estimatedTimeMinutes: 285,
        recommendedVehicle: isEV ? "V-101 (Volvo FH Electric)" : "V-102 (Tata Signa Diesel)",
        costBreakdown: {
          energyOrFuelINR: energyCost,
          tollsINR: tollCost,
          totalTripCostINR: energyCost + tollCost
        },
        environmentalImpact: {
          co2SavedKg,
          greenFleetRating: isEV ? "A+ Zero Tailpipe Emissions" : "B Standard Diesel"
        }
      };
    }

    case "calculate_operational_cost": {
      const { distance_km, vehicle_id, has_cold_chain = false } = args;
      const vehicle = INITIAL_FLEET_DATA.find(v => v.id === vehicle_id) || INITIAL_FLEET_DATA[0];
      const isEV = vehicle.fuelType === "Electric";
      const fuelCost = Math.round(distance_km * (isEV ? 3.5 : 13.5));
      const driverAllowance = Math.round((distance_km / 50) * 150);
      const reeferCost = has_cold_chain ? 850 : 0;
      const tollCost = Math.round(distance_km * 1.8);
      const total = fuelCost + driverAllowance + reeferCost + tollCost;

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        distanceKm: distance_km,
        fuelOrPowerCostINR: fuelCost,
        driverAllowanceINR: driverAllowance,
        coldChainSurchargeINR: reeferCost,
        tollPassesINR: tollCost,
        totalOperationalCostINR: total,
        costPerKmINR: parseFloat((total / distance_km).toFixed(2))
      };
    }

    case "search_knowledge_sops": {
      const query = (args.query || "").toLowerCase();
      const terms = query.split(/\s+/).filter(t => t.length > 2);
      const matches = [];

      for (const doc of KNOWLEDGE_DOCUMENTS) {
        if (args.document_category && args.document_category !== "All" && doc.category !== args.document_category) {
          continue;
        }
        for (const chunk of doc.chunks) {
          const text = (chunk.section + " " + chunk.content).toLowerCase();
          let score = 0;
          for (const t of terms) {
            if (text.includes(t)) score += 1;
          }
          if (score > 0 || terms.length === 0) {
            matches.push({
              documentId: doc.id,
              documentTitle: doc.title,
              category: doc.category,
              section: chunk.section,
              content: chunk.content,
              relevanceScore: parseFloat((score / (terms.length || 1)).toFixed(2))
            });
          }
        }
      }

      matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return { matchesFound: matches.length, topResults: matches.slice(0, 3) };
    }

    case "get_azure_budget_status": {
      return accountManager.getBudgetSummary();
    }

    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}

// -------------------------------------------------------------
// MCP JSON-RPC Stdio Server for IDEs
// -------------------------------------------------------------
if (!process.env.NODE_TEST_CONTEXT && (process.argv[1]?.includes("server.js") || process.env.RIDO_MCP_STDIO)) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  rl.on("line", (line) => {
    if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    const { id, method, params } = request;

    if (method === "initialize") {
      const response = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "rido-fleet-copilot", version: "1.0.0" }
        }
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    } else if (method === "tools/list") {
      const response = {
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS }
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    } else if (method === "tools/call") {
      const { name, arguments: toolArgs } = params || {};
      const result = handleToolExecution(name, toolArgs);
      const response = {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    } else {
      const response = {
        jsonrpc: "2.0",
        id,
        result: {}
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    }
  } catch (err) {
    const errorResponse = {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: err.message }
    };
    process.stdout.write(JSON.stringify(errorResponse) + "\n");
  }
  });
}

// -------------------------------------------------------------
// Optional HTTP/SSE Server for Multi-Laptop Collaboration
// -------------------------------------------------------------
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
if (portIndex !== -1 && args[portIndex + 1]) {
  const port = parseInt(args[portIndex + 1], 10);
  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === "/api/tools" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ tools: MCP_TOOLS }));
    } else if (req.url === "/api/call" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        try {
          const { tool, args } = JSON.parse(body);
          const result = handleToolExecution(tool, args);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, result }));
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    } else if (req.url === "/api/budget" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(accountManager.getBudgetSummary()));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "RIDO MCP Server Online", poolBudget: "$200.00", activePool: accountManager.activePoolSize }));
    }
  });

  server.listen(port, () => {
    console.error(`[RIDO MCP] Server listening for multi-laptop connections on port ${port}`);
  });
}
