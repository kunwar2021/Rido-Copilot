import fs from "fs";
import { INITIAL_FLEET_DATA } from "./js/data/fleetData.js";
import { KNOWLEDGE_DOCUMENTS } from "./js/data/knowledgeDocs.js";

// 1. Export Fleet Telemetry CSV
const fleetHeaders = [
  "vehicle_id",
  "vehicle_name",
  "plate_number",
  "vehicle_type",
  "fuel_type",
  "status",
  "battery_or_fuel_soc_pct",
  "speed_kmh",
  "payload_kg",
  "max_payload_kg",
  "cargo_temp_celsius",
  "target_temp_celsius",
  "cold_chain_required",
  "tire_pressure_psi",
  "health_score",
  "current_city",
  "current_address",
  "destination_city",
  "destination_eta",
  "driver_id",
  "driver_name",
  "driver_hours_driven_today",
  "driver_safety_rating",
  "active_alerts"
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

const fleetRows = INITIAL_FLEET_DATA.map(v => [
  v.id,
  v.name,
  v.plate,
  v.type,
  v.fuelType,
  v.status,
  v.batteryOrFuel,
  v.speed,
  v.payloadKg,
  v.maxPayloadKg,
  v.temperatureCelsius ?? "",
  v.targetTempCelsius ?? "",
  v.coldChainRequired ? "TRUE" : "FALSE",
  v.tirePressurePsi,
  v.healthScore,
  v.location?.city || "",
  v.location?.address || "",
  v.destination?.city || "Depot Yard",
  v.destination?.eta || "N/A",
  v.driver?.id || "N/A",
  v.driver?.name || "Unassigned",
  v.driver?.hoursDrivenToday ?? 0,
  v.driver?.safetyRating ?? 0,
  (v.alerts || []).map(a => a.message || a).join(" | ") || "None"
].map(escapeCSV).join(","));

const fleetCSV = [fleetHeaders.join(","), ...fleetRows].join("\n");
fs.writeFileSync("rido_fleet_telemetry.csv", fleetCSV, "utf-8");
console.log("Created: rido_fleet_telemetry.csv");

// 2. Export Logistics SOPs CSV
const sopHeaders = [
  "doc_id",
  "doc_title",
  "category",
  "version",
  "last_updated",
  "chunk_id",
  "section_title",
  "content"
];

const sopRows = [];
for (const doc of KNOWLEDGE_DOCUMENTS) {
  for (const chunk of doc.chunks) {
    sopRows.push([
      doc.id,
      doc.title,
      doc.category,
      doc.version,
      doc.lastUpdated,
      chunk.chunkId,
      chunk.section,
      chunk.content
    ].map(escapeCSV).join(","));
  }
}

const sopCSV = [sopHeaders.join(","), ...sopRows].join("\n");
fs.writeFileSync("rido_logistics_sops.csv", sopCSV, "utf-8");
console.log("Created: rido_logistics_sops.csv");
