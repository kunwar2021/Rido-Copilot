/**
 * RIDO Route Optimizer Module
 * Features Leaflet.js interactive maps, waypoint routing, EV vs Diesel calculations, and dispatch actions.
 */

import { CITIES_DATABASE, INITIAL_FLEET_DATA } from "../data/fleetData.js";
import { AI_TOOLS } from "../agent/toolRegistry.js";

export class RouteOptimizerModule {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.routeLayer = null;
    this.markers = [];
    this.currentCalculation = null;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="route-header mb-6">
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="ri-route-line text-blue-400"></i>
          AI Route Optimizer & Green Fleet Dispatch
        </h2>
        <p class="text-slate-400 text-sm">Compute optimal logistics paths, EV charging corridors, toll passes, and carbon offset analytics</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Planner Form (5 Cols) -->
        <div class="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-white mb-4 flex items-center gap-2">
              <i class="ri-settings-4-line text-cyan-400"></i> Route Parameters
            </h3>

            <form id="routeForm" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Origin City</label>
                  <select id="originCity" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none">
                    <option value="New Delhi" selected>New Delhi (Hub A)</option>
                    <option value="Gurugram">Gurugram</option>
                    <option value="Noida">Noida</option>
                    <option value="Karnal">Karnal</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Destination City</label>
                  <select id="destinationCity" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none">
                    <option value="Jaipur" selected>Jaipur (Hub B)</option>
                    <option value="Agra">Agra</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="New Delhi">New Delhi</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Cargo Weight (kg)</label>
                  <input type="number" id="cargoWeight" value="6500" min="100" max="25000" step="500"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Vehicle Classification</label>
                  <select id="vehicleTypeSelect" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none">
                    <option value="EV Truck" selected>Commercial EV Truck (Zero Emission)</option>
                    <option value="Diesel Truck">Heavy Diesel Truck (Long Haul)</option>
                    <option value="Refrigerated Diesel">Reefer Truck (Cold Chain)</option>
                    <option value="Light EV">Light EV Van (Last Mile)</option>
                  </select>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input type="checkbox" id="coldChainCheck" class="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0">
                <label for="coldChainCheck" class="text-xs text-slate-300">Requires Cold-Chain Temp Monitoring (+2°C to +8°C)</label>
              </div>

              <button type="button" id="computeRouteBtn" class="w-full btn-primary py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <i class="ri-calculator-line"></i> Calculate Optimal Route & Dispatch
              </button>
            </form>
          </div>

          <!-- Dynamic Output Card -->
          <div id="routeResultsCard" class="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p class="text-xs text-slate-400 text-center">Click Calculate to preview route telemetry and financial metrics.</p>
          </div>
        </div>

        <!-- Leaflet Map Visualizer (7 Cols) -->
        <div class="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-700/50 flex flex-col">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i class="ri-map-2-line text-emerald-400"></i> Geospatial Corridor Map
            </h3>
            <span class="text-xs text-slate-400 font-mono" id="mapStatusBadge">Ready</span>
          </div>

          <div id="leafletMapContainer" class="w-full h-[480px] rounded-xl overflow-hidden border border-slate-700/60 relative z-0">
            <!-- Map mounts here -->
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this._initLeafletMap();
      this._attachEvents();
      this._triggerCalculation();
    }, 100);
  }

  _initLeafletMap() {
    const container = document.getElementById("leafletMapContainer");
    if (!container || typeof L === "undefined") return;

    if (this.map) {
      this.map.remove();
    }

    // Centered around Northern India / Delhi-Jaipur corridor initially
    this.map = L.map("leafletMapContainer", {
      zoomControl: true
    }).setView([28.0, 77.0], 7);

    // Dark-themed tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(this.map);
  }

  _attachEvents() {
    const computeBtn = document.getElementById("computeRouteBtn");
    if (computeBtn) {
      computeBtn.addEventListener("click", () => this._triggerCalculation());
    }
  }

  _triggerCalculation() {
    const origin = document.getElementById("originCity")?.value || "New Delhi";
    const destination = document.getElementById("destinationCity")?.value || "Jaipur";
    const weight = parseFloat(document.getElementById("cargoWeight")?.value) || 6000;
    const vehicleType = document.getElementById("vehicleTypeSelect")?.value || "EV Truck";
    const coldChain = document.getElementById("coldChainCheck")?.checked || false;

    const routeTool = AI_TOOLS.find(t => t.name === "optimize_route");
    const result = routeTool.execute({
      origin,
      destination,
      cargo_weight_kg: weight,
      vehicle_type: vehicleType
    });

    this.currentCalculation = result;
    this._updateResultsCard(result, coldChain);
    this._renderMapRoute(result);
  }

  _updateResultsCard(result, coldChain) {
    const card = document.getElementById("routeResultsCard");
    if (!card) return;

    const isEV = result.greenMetrics.isZeroEmission;

    card.innerHTML = `
      <div class="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <span class="text-xs uppercase text-slate-400 font-semibold">Recommended Dispatch</span>
          <p class="text-sm font-bold text-white">${result.recommendedVehicle}</p>
        </div>
        <span class="text-xs px-2.5 py-1 rounded-full ${isEV ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'}">
          ${isEV ? '🌱 Zero Emission' : 'Standard Long Haul'}
        </span>
      </div>

      <div class="grid grid-cols-3 gap-2 my-3 text-center">
        <div class="p-2 bg-slate-900 rounded-lg">
          <span class="text-[10px] text-slate-400 uppercase">Distance</span>
          <p class="text-sm font-bold text-cyan-400">${result.distanceKm} km</p>
        </div>
        <div class="p-2 bg-slate-900 rounded-lg">
          <span class="text-[10px] text-slate-400 uppercase">Est. Duration</span>
          <p class="text-sm font-bold text-white">${result.estimatedDuration.split(' ')[0]}h</p>
        </div>
        <div class="p-2 bg-slate-900 rounded-lg">
          <span class="text-[10px] text-slate-400 uppercase">Total Cost</span>
          <p class="text-sm font-bold text-emerald-400">₹${result.financialBreakdown.totalEstimatedCostINR.toLocaleString()}</p>
        </div>
      </div>

      <div class="text-xs text-slate-300 space-y-1 bg-slate-900/50 p-2.5 rounded-lg">
        <div class="flex justify-between">
          <span class="text-slate-400">Energy / Fuel:</span>
          <span>₹${result.financialBreakdown.fuelOrPowerCostINR.toLocaleString()}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Tolls & Passes:</span>
          <span>₹${result.financialBreakdown.tollChargesINR.toLocaleString()}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Driver Allowance:</span>
          <span>₹${result.financialBreakdown.driverAllowanceINR.toLocaleString()}</span>
        </div>
        ${coldChain ? `
          <div class="flex justify-between text-cyan-400 pt-1 border-t border-slate-800">
            <span>Reefer Cold Chain Surcharge:</span>
            <span>+ ₹850</span>
          </div>
        ` : ''}
        <div class="flex justify-between text-teal-400 pt-1 border-t border-slate-800 font-semibold">
          <span>Carbon Offset:</span>
          <span>${result.greenMetrics.co2OffsetKg} kg CO₂ saved</span>
        </div>
      </div>
    `;
  }

  _renderMapRoute(result) {
    if (!this.map || typeof L === "undefined") return;

    // Clear existing markers & route
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
    if (this.routeLayer) this.map.removeLayer(this.routeLayer);

    const origin = result.origin.coords;
    const dest = result.destination.coords;

    // Create custom icons
    const originIcon = L.divIcon({
      className: "map-pin-origin",
      html: `<div style="background: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px #3b82f6;"></div>`
    });

    const destIcon = L.divIcon({
      className: "map-pin-dest",
      html: `<div style="background: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px #10b981;"></div>`
    });

    const m1 = L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(this.map).bindPopup(`<b>Origin:</b> ${result.origin.name}`);
    const m2 = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(this.map).bindPopup(`<b>Destination:</b> ${result.destination.name}`);
    this.markers.push(m1, m2);

    // Interpolate midpoint curve for polyline realism
    const midLat = (origin.lat + dest.lat) / 2 + 0.08;
    const midLng = (origin.lng + dest.lng) / 2 - 0.08;

    const latlngs = [
      [origin.lat, origin.lng],
      [midLat, midLng],
      [dest.lat, dest.lng]
    ];

    this.routeLayer = L.polyline(latlngs, {
      color: result.greenMetrics.isZeroEmission ? "#10b981" : "#38bdf8",
      weight: 4,
      opacity: 0.85,
      dashArray: "6, 8"
    }).addTo(this.map);

    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });

    const statusBadge = document.getElementById("mapStatusBadge");
    if (statusBadge) statusBadge.innerText = `${result.origin.name} ➔ ${result.destination.name} (${result.distanceKm} km)`;
  }
}
