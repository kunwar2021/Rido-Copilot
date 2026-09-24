/**
 * Unit Tests for Fleet Telematics & Vehicle Data Logic
 */
import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_FLEET_DATA } from "../js/data/fleetData.js";

test("Fleet Data: Integrity and Required Telemetry Fields", () => {
  assert.ok(Array.isArray(INITIAL_FLEET_DATA), "INITIAL_FLEET_DATA must be an array");
  assert.ok(INITIAL_FLEET_DATA.length > 0, "Fleet must contain active vehicles");

  for (const vehicle of INITIAL_FLEET_DATA) {
    assert.ok(vehicle.id, `Vehicle missing ID: ${JSON.stringify(vehicle)}`);
    assert.ok(vehicle.name, `Vehicle ${vehicle.id} missing name`);
    assert.ok(["EV Truck", "Diesel Truck", "Light EV", "Refrigerated Diesel"].includes(vehicle.type),
      `Vehicle ${vehicle.id} has invalid vehicle type: ${vehicle.type}`);
    assert.ok(["In Transit", "Active Delivery", "Critical Alert", "Maintenance", "Idle"].includes(vehicle.status),
      `Vehicle ${vehicle.id} has invalid status: ${vehicle.status}`);
    assert.ok(typeof vehicle.batteryOrFuel === "number" && vehicle.batteryOrFuel >= 0 && vehicle.batteryOrFuel <= 100,
      `Vehicle ${vehicle.id} battery/fuel percentage out of bounds: ${vehicle.batteryOrFuel}`);
  }
});

test("Fleet Data: Payload Limits Validation", () => {
  for (const vehicle of INITIAL_FLEET_DATA) {
    assert.ok(vehicle.payloadKg <= vehicle.maxPayloadKg,
      `Vehicle ${vehicle.id} exceeded maximum payload: ${vehicle.payloadKg} > ${vehicle.maxPayloadKg}`);
  }
});

test("Fleet Data: Cold-Chain Integrity and Alerts", () => {
  const coldChainUnits = INITIAL_FLEET_DATA.filter(v => v.coldChainRequired);
  assert.ok(coldChainUnits.length > 0, "There should be cold-chain vehicles in fleet");

  for (const v of coldChainUnits) {
    assert.ok(typeof v.temperatureCelsius === "number", `Vehicle ${v.id} missing temperature reading`);
    assert.ok(typeof v.targetTempCelsius === "number", `Vehicle ${v.id} missing target temperature`);

    const tempDeviation = Math.abs(v.temperatureCelsius - v.targetTempCelsius);
    if (tempDeviation > 2.0) {
      assert.ok(v.alerts.length > 0 || v.status === "Critical Alert",
        `Vehicle ${v.id} has temperature deviation of ${tempDeviation.toFixed(1)}°C but no alert flagged`);
    }
  }
});

test("Fleet Data: Driver Hours of Service (HOS) Checks", () => {
  for (const vehicle of INITIAL_FLEET_DATA) {
    if (vehicle.driver) {
      assert.ok(vehicle.driver.hoursDrivenToday >= 0, `Driver hours cannot be negative for ${vehicle.id}`);
      assert.ok(vehicle.driver.hoursDrivenToday <= 24, `Driver hours cannot exceed 24 for ${vehicle.id}`);
      assert.ok(vehicle.driver.safetyRating >= 1.0 && vehicle.driver.safetyRating <= 5.0,
        `Driver safety rating out of 1.0 - 5.0 range: ${vehicle.driver.safetyRating}`);
    }
  }
});
