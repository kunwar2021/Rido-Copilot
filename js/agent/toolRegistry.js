/**
 * RIDO AI Tools Registry
 * Implements Fleet API, Route API, and Cost API matching the Microsoft Foundry AI Agent architecture.
 */

import { INITIAL_FLEET_DATA, CITIES_DATABASE } from "../data/fleetData.js";

export const AI_TOOLS = [
  {
    name: "get_vehicle_telemetry",
    displayName: "Real-Time Vehicle Telemetry API",
    description: "Queries live, real-time IoT vehicle telemetry including battery State-of-Charge (SoC) %, fuel percentage, vehicle type, current speed, refrigeration cargo temperature, tire pressure, and driver details.",
    parameters: {
      vehicle_id: "Target vehicle ID (e.g. 'V-101', 'V-102', 'V-103', 'V-104', 'V-105', 'V-106')"
    },
    execute: (args = {}) => {
      const vid = (args.vehicle_id || "").trim().toUpperCase();
      const vehicle = INITIAL_FLEET_DATA.find(v => v.id.toUpperCase() === vid) ||
                      INITIAL_FLEET_DATA.find(v => v.id.replace("-", "") === vid.replace("-", ""));

      if (!vehicle) {
        return {
          status: "NOT_FOUND",
          error: `Vehicle ${args.vehicle_id} not found in fleet database. Valid IDs: V-101, V-102, V-103, V-104, V-105, V-106`
        };
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
        isLowEnergy: vehicle.batteryOrFuel < 20,
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
  },

  {
    name: "get_fleet_status",
    displayName: "Fleet Telemetry API",
    description: "Queries real-time telemetry, battery/fuel %, cargo payload, temperatures, and driver shifts.",
    parameters: {
      vehicle_id: "Optional vehicle ID string (e.g. 'V-101', 'V-104')",
      status: "Optional status filter (e.g. 'In Transit', 'Critical Alert', 'Active Delivery')"
    },
    execute: (args = {}) => {
      let data = [...INITIAL_FLEET_DATA];
      if (args.vehicle_id) {
        data = data.filter(v => v.id.toLowerCase() === args.vehicle_id.trim().toLowerCase());
      }
      if (args.status && args.status !== "All") {
        data = data.filter(v => v.status.toLowerCase().includes(args.status.trim().toLowerCase()));
      }
      return {
        timestamp: new Date().toISOString(),
        totalFound: data.length,
        vehicles: data
      };
    }
  },

  {
    name: "optimize_route",
    displayName: "Route Optimization API",
    description: "Calculates the most efficient route, waypoint sequence, distance, EV vs Diesel cost, and carbon offset.",
    parameters: {
      origin: "Origin city name",
      destination: "Destination city name",
      cargo_weight_kg: "Cargo weight in kg",
      vehicle_type: "Preferred vehicle type (EV Truck, Diesel Truck, Reefer)"
    },
    execute: (args = {}) => {
      const origin = args.origin || "New Delhi";
      const destination = args.destination || "Jaipur";
      const weight = parseFloat(args.cargo_weight_kg) || 5000;
      const vehicleType = args.vehicle_type || "EV Truck";

      const originCoords = CITIES_DATABASE[origin] || { lat: 28.6139, lng: 77.2090 };
      const destCoords = CITIES_DATABASE[destination] || { lat: 26.9124, lng: 75.7873 };

      // Calculate approximate Haversine distance
      const R = 6371;
      const dLat = (destCoords.lat - originCoords.lat) * Math.PI / 180;
      const dLng = (destCoords.lng - originCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(originCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Math.max(45, Math.round(R * c * 1.25)); // +25% road factor

      const isEV = vehicleType.toLowerCase().includes("ev");
      const durationHours = (distanceKm / 55).toFixed(1);
      const energyRate = isEV ? 3.4 : 13.8;
      const energyCost = Math.round(distanceKm * energyRate);
      const tolls = Math.round(distanceKm * 1.75);
      const driverCost = Math.round((distanceKm / 50) * 160);
      const totalCost = energyCost + tolls + driverCost;
      const co2Saved = isEV ? Math.round(distanceKm * 0.45) : 0;

      return {
        origin: { name: origin, coords: originCoords },
        destination: { name: destination, coords: destCoords },
        distanceKm,
        estimatedDuration: `${durationHours} hours (${Math.round(durationHours * 60)} mins)`,
        assignedVehicleType: vehicleType,
        recommendedVehicle: isEV ? "V-101 (Volvo FH Electric)" : "V-102 (Tata Signa Diesel)",
        financialBreakdown: {
          fuelOrPowerCostINR: energyCost,
          tollChargesINR: tolls,
          driverAllowanceINR: driverCost,
          totalEstimatedCostINR: totalCost,
          costPerKmINR: parseFloat((totalCost / distanceKm).toFixed(2))
        },
        greenMetrics: {
          co2OffsetKg: co2Saved,
          isZeroEmission: isEV,
          ecoScore: isEV ? 98 : 74
        }
      };
    }
  },

  {
    name: "calculate_operational_cost",
    displayName: "Operational Cost API",
    description: "Computes financial analytics, tolls, fuel/electricity expenditure, and driver shift allowances.",
    parameters: {
      distance_km: "Distance in kilometers",
      vehicle_id: "Target vehicle ID",
      has_cold_chain: "Whether reefer refrigeration is required"
    },
    execute: (args = {}) => {
      const distance = parseFloat(args.distance_km) || 200;
      const vehicle = INITIAL_FLEET_DATA.find(v => v.id === args.vehicle_id) || INITIAL_FLEET_DATA[0];
      const isEV = vehicle.fuelType === "Electric";

      const fuelCost = Math.round(distance * (isEV ? 3.2 : 13.5));
      const driverPay = Math.round((distance / 50) * 150);
      const reeferFee = (args.has_cold_chain || vehicle.coldChainRequired) ? 900 : 0;
      const tollFee = Math.round(distance * 1.8);
      const maintenanceBuffer = Math.round(distance * 1.2);
      const total = fuelCost + driverPay + reeferFee + tollFee + maintenanceBuffer;

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        fuelType: vehicle.fuelType,
        distanceKm: distance,
        costBreakdown: {
          energyCostINR: fuelCost,
          driverAllowanceINR: driverPay,
          coldChainSurchargeINR: reeferFee,
          tollPassesINR: tollFee,
          maintenanceBufferINR: maintenanceBuffer,
          totalOperationalCostINR: total
        },
        costPerKmINR: parseFloat((total / distance).toFixed(2))
      };
    }
  },

  {
    name: "get_driver_safety_record",
    displayName: "Driver Safety API",
    description: "Queries driver shift hours, active driving duration, safety rating, and compliance violations.",
    parameters: {
      driver_id: "Driver ID (e.g. 'D-11', 'D-14', 'D-22')"
    },
    execute: (args = {}) => {
      const targetId = args.driver_id ? args.driver_id.trim().toLowerCase() : null;
      const drivers = INITIAL_FLEET_DATA.filter(v => v.driver).map(v => ({
        ...v.driver,
        assignedVehicle: v.id,
        vehicleName: v.name,
        isShiftNearLimit: v.driver.hoursDrivenToday >= 7.0,
        isMaxLimitExceeded: v.driver.hoursDrivenToday >= 8.0
      }));

      const results = targetId ? drivers.filter(d => d.id.toLowerCase() === targetId) : drivers;
      return {
        totalDrivers: results.length,
        records: results
      };
    }
  },

  {
    name: "driver_tablet_dispatcher",
    displayName: "Driver In-Cab Tablet Dispatch API",
    description: "Sends real-time high-priority operational directives, rest break mandates, and re-routing orders directly to in-cab driver tablets.",
    parameters: {
      driver_id: "Driver ID (e.g. 'D-11', 'D-14', 'D-22')",
      action_code: "Directive code (e.g. 'MANDATORY_REST_45MIN', 'DYNAMIC_REROUTE_COLD_STORAGE', 'DEPOT_HANDOVER')",
      directive_message: "Text message to display on the in-cab heads-up display"
    },
    execute: (args = {}) => {
      return {
        dispatchStatus: "SUCCESS_DELIVERED_TO_CAB",
        driverId: args.driver_id || "D-11",
        actionCode: args.action_code || "MANDATORY_REST_45MIN",
        tabletDeviceAck: "ACK_200_DISPLAYED_ON_HUD",
        timestamp: new Date().toISOString(),
        deliveredMessage: args.directive_message || "Mandatory 45-minute rest break enforced per Driver_Safety SOP § 1."
      };
    }
  }
];

export const MCP_TOOL_SCHEMAS = AI_TOOLS.map(t => ({
  name: t.name,
  description: t.description,
  inputSchema: {
    type: "object",
    properties: Object.keys(t.parameters).reduce((acc, key) => {
      acc[key] = { type: "string", description: t.parameters[key] };
      return acc;
    }, {})
  }
}));

export const AZURE_FUNCTION_TOOLS = AI_TOOLS.map(t => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: {
      type: "object",
      properties: Object.keys(t.parameters).reduce((acc, key) => {
        acc[key] = { type: "string", description: t.parameters[key] };
        return acc;
      }, {}),
      required: Object.keys(t.parameters).filter(k => k === "vehicle_id" && t.name === "get_vehicle_telemetry")
    }
  }
}));

