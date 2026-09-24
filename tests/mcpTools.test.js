/**
 * Unit Tests for MCP Tool Execution & Routing Engine
 */
import test from "node:test";
import assert from "node:assert/strict";
import { MCP_TOOLS, handleToolExecution } from "../mcp-server/server.js";

test("MCP Tools: Schema Definition Integrity", () => {
  assert.ok(Array.isArray(MCP_TOOLS), "MCP_TOOLS must be an array");
  assert.ok(MCP_TOOLS.length >= 4, "Must define at least 4 core MCP tools");

  const expectedTools = ["get_fleet_status", "optimize_route", "calculate_operational_cost", "search_knowledge_sops"];
  const toolNames = MCP_TOOLS.map(t => t.name);

  for (const expected of expectedTools) {
    assert.ok(toolNames.includes(expected), `Missing MCP tool: ${expected}`);
  }

  for (const tool of MCP_TOOLS) {
    assert.ok(tool.name, "Tool must have name");
    assert.ok(tool.description, `Tool ${tool.name} must have description`);
    assert.equal(tool.inputSchema.type, "object", `Tool ${tool.name} schema must be object`);
  }
});

test("MCP Tool: get_vehicle_telemetry real-time query", () => {
  const telem104 = handleToolExecution("get_vehicle_telemetry", { vehicle_id: "V-104" });
  assert.equal(telem104.status, "LIVE_TELEMETRY_ONLINE");
  assert.equal(telem104.vehicleId, "V-104");
  assert.equal(telem104.batteryOrFuelLevel, 48);
  assert.equal(telem104.temperatureCelsius, 8.9);

  const telem101 = handleToolExecution("get_vehicle_telemetry", { vehicle_id: "V-101" });
  assert.equal(telem101.batteryOrFuelLevel, 82);
  assert.equal(telem101.fuelType, "Electric");
});

test("MCP Tool: get_fleet_status handler", () => {
  const allFleet = handleToolExecution("get_fleet_status", {});
  assert.ok(allFleet.count > 0, "Should return vehicles");
  assert.equal(allFleet.vehicles.length, allFleet.count);

  // Filter by single vehicle ID
  const single = handleToolExecution("get_fleet_status", { vehicle_id: "V-101" });
  assert.equal(single.count, 1, "Should filter down to 1 vehicle");
  assert.equal(single.vehicles[0].id, "V-101");

  // Filter by status
  const inTransit = handleToolExecution("get_fleet_status", { status_filter: "In Transit" });
  for (const v of inTransit.vehicles) {
    assert.equal(v.status, "In Transit");
  }
});

test("MCP Tool: optimize_route handler (EV vs Diesel)", () => {
  const evResult = handleToolExecution("optimize_route", {
    origin: "New Delhi",
    destination: "Jaipur",
    cargo_weight_kg: 10000,
    vehicle_type: "EV Truck"
  });

  assert.equal(evResult.origin, "New Delhi");
  assert.equal(evResult.destination, "Jaipur");
  assert.ok(evResult.distanceKm > 0);
  assert.ok(evResult.costBreakdown.totalTripCostINR > 0);
  assert.ok(evResult.environmentalImpact.co2SavedKg > 0, "EV should show carbon savings");

  const dieselResult = handleToolExecution("optimize_route", {
    origin: "New Delhi",
    destination: "Jaipur",
    cargo_weight_kg: 10000,
    vehicle_type: "Diesel Truck"
  });
  assert.ok(dieselResult.costBreakdown.energyOrFuelINR > evResult.costBreakdown.energyOrFuelINR,
    "Diesel fuel cost should be higher than EV electricity cost");
});

test("MCP Tool: calculate_operational_cost handler with cold-chain", () => {
  const withoutReefer = handleToolExecution("calculate_operational_cost", {
    distance_km: 300,
    vehicle_id: "V-101",
    has_cold_chain: false
  });

  const withReefer = handleToolExecution("calculate_operational_cost", {
    distance_km: 300,
    vehicle_id: "V-101",
    has_cold_chain: true
  });

  assert.equal(withoutReefer.coldChainSurchargeINR, 0);
  assert.equal(withReefer.coldChainSurchargeINR, 850);
  assert.equal(withReefer.totalOperationalCostINR, withoutReefer.totalOperationalCostINR + 850);
});

test("MCP Tool: search_knowledge_sops semantic RAG search", () => {
  const searchResult = handleToolExecution("search_knowledge_sops", {
    query: "cold chain temperature limit"
  });

  assert.ok(searchResult.matchesFound > 0, "Should match cold chain SOP chunks");
  assert.ok(searchResult.topResults[0].content.toLowerCase().includes("temperature") ||
            searchResult.topResults[0].content.toLowerCase().includes("reefer"),
            "Matching chunk should mention temperature or reefer");
});
