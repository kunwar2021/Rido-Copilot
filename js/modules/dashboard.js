/**
 * RIDO Fleet Dashboard Module
 * Handles telemetry KPIs, real-time vehicle cards, health alerts, and Chart.js graphs.
 */

import { INITIAL_FLEET_DATA } from "../data/fleetData.js";

export class DashboardModule {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.fleet = [...INITIAL_FLEET_DATA];
    this.currentFilter = "All";
    this.chartInstance = null;
  }

  render() {
    if (!this.container) return;

    const totalVehicles = this.fleet.length;
    const inTransit = this.fleet.filter(v => v.status === "In Transit" || v.status === "Active Delivery").length;
    const criticalAlerts = this.fleet.filter(v => v.status === "Critical Alert" || v.alerts.length > 0).length;
    const evCount = this.fleet.filter(v => v.fuelType === "Electric").length;
    const avgHealth = Math.round(this.fleet.reduce((acc, v) => acc + v.healthScore, 0) / totalVehicles);

    this.container.innerHTML = `
      <div class="dashboard-header mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            <span class="inline-block w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
            Real-Time Fleet Operations
          </h2>
          <p class="text-slate-400 text-sm">Live IoT Telematics, Battery Health, and Active Dispatches</p>
        </div>
        <div class="flex items-center gap-3">
          <button id="refreshTelemetryBtn" class="btn-secondary text-sm">
            <i class="ri-refresh-line"></i> Refresh Telemetry
          </button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="kpi-card glass-panel p-4 rounded-xl border border-slate-700/50">
          <div class="flex justify-between items-start">
            <span class="text-xs uppercase text-slate-400 font-semibold">Total Fleet</span>
            <span class="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-lg"><i class="ri-truck-line"></i></span>
          </div>
          <div class="text-2xl font-bold text-white mt-2">${totalVehicles}</div>
          <div class="text-xs text-slate-400 mt-1">${evCount} Commercial EVs | ${totalVehicles - evCount} Diesel</div>
        </div>

        <div class="kpi-card glass-panel p-4 rounded-xl border border-slate-700/50">
          <div class="flex justify-between items-start">
            <span class="text-xs uppercase text-slate-400 font-semibold">In Transit</span>
            <span class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-lg"><i class="ri-navigation-line"></i></span>
          </div>
          <div class="text-2xl font-bold text-emerald-400 mt-2">${inTransit}</div>
          <div class="text-xs text-slate-400 mt-1">Active Deliveries on Road</div>
        </div>

        <div class="kpi-card glass-panel p-4 rounded-xl border border-slate-700/50">
          <div class="flex justify-between items-start">
            <span class="text-xs uppercase text-slate-400 font-semibold">Critical Alerts</span>
            <span class="p-2 rounded-lg bg-rose-500/10 text-rose-400 text-lg"><i class="ri-alarm-warning-line"></i></span>
          </div>
          <div class="text-2xl font-bold text-rose-400 mt-2">${criticalAlerts}</div>
          <div class="text-xs text-rose-400/80 mt-1">Requires Dispatch Action</div>
        </div>

        <div class="kpi-card glass-panel p-4 rounded-xl border border-slate-700/50">
          <div class="flex justify-between items-start">
            <span class="text-xs uppercase text-slate-400 font-semibold">Average Health</span>
            <span class="p-2 rounded-lg bg-amber-500/10 text-amber-400 text-lg"><i class="ri-heart-pulse-line"></i></span>
          </div>
          <div class="text-2xl font-bold text-amber-400 mt-2">${avgHealth}%</div>
          <div class="text-xs text-slate-400 mt-1">Telemetry Sensor Index</div>
        </div>

        <div class="kpi-card glass-panel p-4 rounded-xl border border-slate-700/50">
          <div class="flex justify-between items-start">
            <span class="text-xs uppercase text-slate-400 font-semibold">Green Energy</span>
            <span class="p-2 rounded-lg bg-teal-500/10 text-teal-400 text-lg"><i class="ri-leaf-line"></i></span>
          </div>
          <div class="text-2xl font-bold text-teal-400 mt-2">1,240 kg</div>
          <div class="text-xs text-slate-400 mt-1">CO₂ Offset This Week</div>
        </div>
      </div>

      <!-- Main Section: Grid & Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Vehicle Telemetry List (2 Cols) -->
        <div class="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-700/50">
          <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="ri-dashboard-3-line text-blue-400"></i> Active Vehicles Telemetry
            </h3>
            <div class="flex gap-2">
              <button class="filter-chip active text-xs px-3 py-1.5 rounded-lg" data-filter="All">All (${totalVehicles})</button>
              <button class="filter-chip text-xs px-3 py-1.5 rounded-lg" data-filter="In Transit">In Transit</button>
              <button class="filter-chip text-xs px-3 py-1.5 rounded-lg" data-filter="Critical Alert">Alerts (${criticalAlerts})</button>
              <button class="filter-chip text-xs px-3 py-1.5 rounded-lg" data-filter="EV">EVs (${evCount})</button>
            </div>
          </div>

          <div id="vehicleCardsGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Telemetry Graph & Alerts Feed (1 Col) -->
        <div class="flex flex-col gap-6">
          <!-- Live Alerts Panel -->
          <div class="glass-panel p-5 rounded-2xl border border-slate-700/50">
            <h3 class="text-base font-bold text-white mb-3 flex items-center gap-2">
              <i class="ri-notification-3-line text-amber-400"></i> Dispatch Incident Feed
            </h3>
            <div class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              ${this._renderAlertsFeed()}
            </div>
          </div>

          <!-- Chart.js Fleet Telemetry -->
          <div class="glass-panel p-5 rounded-2xl border border-slate-700/50 flex-1 flex flex-col">
            <h3 class="text-base font-bold text-white mb-2 flex items-center gap-2">
              <i class="ri-bar-chart-2-line text-cyan-400"></i> Energy & Fleet Efficiency
            </h3>
            <div class="relative flex-1 min-h-[190px]">
              <canvas id="fleetEfficiencyChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    this._renderVehicles();
    this._attachEvents();
    this._initChart();
  }

  _renderVehicles() {
    const grid = document.getElementById("vehicleCardsGrid");
    if (!grid) return;

    let filtered = [...this.fleet];
    if (this.currentFilter === "In Transit") {
      filtered = filtered.filter(v => v.status === "In Transit" || v.status === "Active Delivery");
    } else if (this.currentFilter === "Critical Alert") {
      filtered = filtered.filter(v => v.status === "Critical Alert" || v.alerts.length > 0);
    } else if (this.currentFilter === "EV") {
      filtered = filtered.filter(v => v.fuelType === "Electric");
    }

    grid.innerHTML = filtered.map(v => {
      const isCritical = v.status === "Critical Alert" || v.alerts.some(a => a.type === "critical");
      const isEV = v.fuelType === "Electric";
      const statusColor = isCritical ? "text-rose-400 bg-rose-500/10 border-rose-500/30" :
                          v.status === "In Transit" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                          v.status === "Maintenance" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                          "text-blue-400 bg-blue-500/10 border-blue-500/30";

      return `
        <div class="vehicle-card p-4 rounded-xl border border-slate-700/50 bg-slate-900/60 hover:border-blue-500/40 transition">
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-base">${v.id}</span>
                <span class="text-xs px-2 py-0.5 rounded-full border ${statusColor}">${v.status}</span>
              </div>
              <p class="text-xs text-slate-400">${v.name}</p>
            </div>
            <span class="text-xs font-mono px-2 py-1 bg-slate-800 rounded text-slate-300">${v.plate}</span>
          </div>

          <!-- Metrics Row -->
          <div class="grid grid-cols-3 gap-2 my-3 p-2 bg-slate-950/40 rounded-lg text-center">
            <div>
              <span class="text-[10px] uppercase text-slate-400">${isEV ? 'Battery' : 'Fuel'}</span>
              <p class="text-sm font-bold ${v.batteryOrFuel < 25 ? 'text-rose-400' : 'text-emerald-400'}">
                ${v.batteryOrFuel}%
              </p>
            </div>
            <div>
              <span class="text-[10px] uppercase text-slate-400">Speed</span>
              <p class="text-sm font-bold text-cyan-400">${v.speed} <span class="text-[10px]">km/h</span></p>
            </div>
            <div>
              <span class="text-[10px] uppercase text-slate-400">${v.coldChainRequired ? 'Cargo Temp' : 'Health'}</span>
              <p class="text-sm font-bold ${v.coldChainRequired && v.temperatureCelsius > 4.0 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}">
                ${v.coldChainRequired ? `${v.temperatureCelsius}°C` : `${v.healthScore}%`}
              </p>
            </div>
          </div>

          <!-- Location & Driver Info -->
          <div class="text-xs text-slate-400 space-y-1">
            <div class="flex items-center justify-between">
              <span><i class="ri-map-pin-line text-blue-400"></i> ${v.location.city}</span>
              ${v.destination ? `<span class="text-slate-300">➔ ${v.destination.city} (${v.destination.eta})</span>` : '<span class="text-slate-500">Depot Standby</span>'}
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-800">
              <span><i class="ri-user-3-line text-slate-400"></i> ${v.driver ? v.driver.name : 'No Driver'}</span>
              ${v.driver ? `<span class="text-slate-400">Shift: ${v.driver.hoursDrivenToday}h/8h</span>` : ''}
            </div>
          </div>

          ${v.alerts.length > 0 ? `
            <div class="mt-3 p-2 rounded bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-1.5">
              <i class="ri-error-warning-line text-rose-400 shrink-0 mt-0.5"></i>
              <span>${v.alerts[0].message}</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join("");
  }

  _renderAlertsFeed() {
    const alerts = [];
    this.fleet.forEach(v => {
      v.alerts.forEach(a => {
        alerts.push({ vehicleId: v.id, vehicleName: v.name, ...a });
      });
    });

    if (alerts.length === 0) {
      return `<p class="text-xs text-slate-500 text-center py-4">All systems operating within SOP parameters.</p>`;
    }

    return alerts.map(a => `
      <div class="p-2.5 rounded-lg bg-slate-900/80 border ${a.type === 'critical' ? 'border-rose-500/40 text-rose-300' : 'border-amber-500/40 text-amber-300'} text-xs">
        <div class="flex justify-between font-bold text-white mb-0.5">
          <span>${a.vehicleId}</span>
          <span class="text-[10px] uppercase px-1.5 py-0.2 bg-slate-800 rounded">${a.type}</span>
        </div>
        <p class="text-slate-300 text-[11px]">${a.message}</p>
      </div>
    `).join("");
  }

  _attachEvents() {
    const filterButtons = this.container.querySelectorAll(".filter-chip");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this._renderVehicles();
      });
    });

    const refreshBtn = document.getElementById("refreshTelemetryBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        // Random slight telemetry drift
        this.fleet.forEach(v => {
          if (v.status === "In Transit") {
            v.batteryOrFuel = Math.max(10, v.batteryOrFuel - Math.floor(Math.random() * 2));
            v.speed = Math.max(40, Math.min(85, v.speed + Math.floor(Math.random() * 7 - 3)));
          }
        });
        this.render();
      });
    }
  }

  _initChart() {
    const canvas = document.getElementById("fleetEfficiencyChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = canvas.getContext("2d");
    this.chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["V-101 (EV)", "V-102 (Diesel)", "V-103 (EV)", "V-104 (Reefer)", "V-105 (Diesel)"],
        datasets: [
          {
            label: "Health Score (%)",
            data: [96, 84, 99, 72, 98],
            backgroundColor: "rgba(56, 189, 248, 0.7)",
            borderRadius: 6
          },
          {
            label: "Battery / Fuel (%)",
            data: [82, 38, 64, 48, 95],
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#94a3b8", font: { size: 10 } }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: "#64748b", font: { size: 10 } },
            grid: { color: "rgba(51, 65, 85, 0.3)" }
          },
          x: {
            ticks: { color: "#94a3b8", font: { size: 9 } },
            grid: { display: false }
          }
        }
      }
    });
  }
}
