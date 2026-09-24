/**
 * Unit Tests for Foundry Agent Intent Detection & Query Routing
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FoundryAgent } from "../js/agent/foundryAgent.js";

// Mock AzureSettingsManager for testing
const mockAzureSettings = {
  getActiveAccount: () => null,
  getDualPool: () => ({ activePoolSize: 0 })
};

const agent = new FoundryAgent(mockAzureSettings);

test("Intent Detection: Driver HOS Compliance Queries", () => {
  const query = "Are any drivers close to exceeding their 8.0-hour daily limit or 4.5-hour continuous driving threshold?";
  const analysis = agent._detectIntent(query);

  assert.equal(analysis.primaryIntent, "driver_compliance",
    `Expected 'driver_compliance' but got '${analysis.primaryIntent}' for prompt: "${query}"`);
  assert.equal(analysis.entities.origin, undefined, "Driver query should not extract false origin");
  assert.equal(analysis.entities.destination, undefined, "Driver query should not extract false destination");
});

test("Intent Detection: Route Planning Queries", () => {
  const query = "Optimize route from New Delhi to Jaipur for 10000 kg cargo";
  const analysis = agent._detectIntent(query);

  assert.equal(analysis.primaryIntent, "route_planning",
    `Expected 'route_planning' but got '${analysis.primaryIntent}'`);
  assert.equal(analysis.entities.origin, "New Delhi");
  assert.equal(analysis.entities.destination, "Jaipur");
});

test("Intent Detection: Cold-Chain Incident Queries", () => {
  const query = "V-104 temperature is 8.9C check reefer thermal excursion";
  const analysis = agent._detectIntent(query);

  assert.equal(analysis.primaryIntent, "cold_chain_incident");
  assert.equal(analysis.entities.vehicleId, "V-104");
});

test("Intent Detection: Fleet Telemetry Queries", () => {
  const query = "Check vehicle status and battery level for V-101";
  const analysis = agent._detectIntent(query);

  assert.equal(analysis.primaryIntent, "fleet_telemetry");
  assert.equal(analysis.entities.vehicleId, "V-101");
});

test("Intent Detection: Conversational Queries", () => {
  const query = "Hello! Who are you and how can you help?";
  const analysis = agent._detectIntent(query);

  assert.equal(analysis.primaryIntent, "conversational");
});

test("Foundry Agent: Driver Compliance Response Generation", async () => {
  const query = "Are any drivers close to exceeding their 8.0-hour daily limit or 4.5-hour continuous driving threshold?";
  const result = await agent.processMessage(query);

  assert.ok(result.responseText.includes("Rajesh Kumar"), "Response should mention Rajesh Kumar");
  assert.ok(result.responseText.includes("Suresh Sharma"), "Response should mention Suresh Sharma");
  assert.ok(result.responseText.includes("4.5h"), "Response should address 4.5h threshold");
  assert.ok(result.responseText.includes("8.0h"), "Response should address 8.0h limit");
  assert.ok(!result.responseText.includes("Multi-Fuel Dispatch & Emissions Analysis"),
    "Response must NOT return multi-fuel route comparison for driver query");
});

test("Foundry Agent: Real-Time Telemetry Query for V-104 Battery / Fuel", async () => {
  const query = "What is the battery level of vehicle V-104?";
  const analysis = agent._detectIntent(query);

  assert.equal(analysis.primaryIntent, "fleet_telemetry", "Query should route to fleet_telemetry");
  assert.equal(analysis.entities.vehicleId, "V-104", "Should extract V-104 vehicleId");

  const result = await agent.processMessage(query);
  assert.ok(result.responseText.includes("V-104"), "Response must mention V-104");
  assert.ok(result.responseText.includes("48%"), "Response must report 48% level");
  assert.ok(!result.responseText.includes("[TELEMETRY UNAVAILABLE]"), "Must NOT report telemetry unavailable");
  assert.ok(!result.responseText.includes("Unknown"), "Must NOT report level as Unknown");
});

test("Foundry Agent: Real-Time Telemetry Query for V-101 EV Battery SoC", async () => {
  const query = "What is the battery level of vehicle V-101?";
  const result = await agent.processMessage(query);

  assert.ok(result.responseText.includes("V-101"), "Response must mention V-101");
  assert.ok(result.responseText.includes("82%"), "Response must report 82% SoC");
  assert.ok(result.responseText.includes("SoC"), "Response must identify Battery SoC");
});

