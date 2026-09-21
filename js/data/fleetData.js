/**
 * RIDO Data Services - Fleet, Vehicle, Route, and Delivery Mock Telemetry
 */

export const INITIAL_FLEET_DATA = [
  {
    id: "V-101",
    name: "Volvo FH Electric (Heavy)",
    plate: "DL-01-EV-4412",
    type: "EV Truck",
    status: "In Transit",
    driver: { id: "D-11", name: "Rajesh Kumar", phone: "+91 98765-43210", safetyRating: 4.9, hoursDrivenToday: 4.5 },
    location: { city: "New Delhi", lat: 28.6139, lng: 77.2090, address: "Connaught Place Hub" },
    destination: { city: "Jaipur", lat: 26.9124, lng: 75.7873, address: "Jaipur Logistics Hub", eta: "19:45 PM" },
    batteryOrFuel: 82, // %
    fuelType: "Electric",
    speed: 62, // km/h
    payloadKg: 14500,
    maxPayloadKg: 20000,
    temperatureCelsius: 4.2, // for cold chain
    coldChainRequired: true,
    targetTempCelsius: 4.0,
    tirePressurePsi: 110,
    healthScore: 96,
    alerts: []
  },
  {
    id: "V-102",
    name: "Tata Signa 4825.TK (Diesel)",
    plate: "MH-04-TR-8819",
    type: "Diesel Truck",
    status: "In Transit",
    driver: { id: "D-14", name: "Suresh Sharma", phone: "+91 98111-22334", safetyRating: 4.4, hoursDrivenToday: 7.2 },
    location: { city: "Gurugram", lat: 28.4595, lng: 77.0266, address: "NH-48 Industrial Area" },
    destination: { city: "Agra", lat: 27.1767, lng: 78.0081, address: "Agra Warehousing Park", eta: "21:15 PM" },
    batteryOrFuel: 38, // %
    fuelType: "Diesel",
    speed: 78,
    payloadKg: 18200,
    maxPayloadKg: 25000,
    temperatureCelsius: 26.0,
    coldChainRequired: false,
    tirePressurePsi: 98, // slightly low
    healthScore: 84,
    alerts: [
      { type: "warning", message: "Driver close to maximum allowable 8h shift limit (7.2h active)." }
    ]
  },
  {
    id: "V-103",
    name: "Mahindra Treo Zor (EV Cargo)",
    plate: "KA-05-EV-9012",
    type: "Light EV",
    status: "Active Delivery",
    driver: { id: "D-19", name: "Amit Verma", phone: "+91 97654-12345", safetyRating: 4.8, hoursDrivenToday: 2.1 },
    location: { city: "Bengaluru", lat: 12.9716, lng: 77.5946, address: "Indiranagar 100ft Road" },
    destination: { city: "Bengaluru East", lat: 12.9784, lng: 77.6408, address: "Whitefield Tech Park", eta: "17:30 PM" },
    batteryOrFuel: 64,
    fuelType: "Electric",
    speed: 38,
    payloadKg: 450,
    maxPayloadKg: 650,
    temperatureCelsius: 24.5,
    coldChainRequired: false,
    tirePressurePsi: 34,
    healthScore: 99,
    alerts: []
  },
  {
    id: "V-104",
    name: "Eicher Pro 3015 (Reefer)",
    plate: "HR-26-RF-3310",
    type: "Refrigerated Diesel",
    status: "Critical Alert",
    driver: { id: "D-22", name: "Vikas Mehra", phone: "+91 99887-76655", safetyRating: 4.6, hoursDrivenToday: 3.8 },
    location: { city: "Karnal", lat: 29.6857, lng: 76.9905, address: "GT Road Cold Storage" },
    destination: { city: "Chandigarh", lat: 30.7333, lng: 76.7794, address: "Sector 26 Mandi", eta: "18:50 PM" },
    batteryOrFuel: 48,
    fuelType: "Diesel",
    speed: 55,
    payloadKg: 8500,
    maxPayloadKg: 10000,
    temperatureCelsius: 8.9, // Temp Excursion!
    coldChainRequired: true,
    targetTempCelsius: 3.5,
    tirePressurePsi: 105,
    healthScore: 72,
    alerts: [
      { type: "critical", message: "Temperature Excursion: Cargo temp 8.9°C exceeds 4.0°C limit! Check Reefer Unit." }
    ]
  },
  {
    id: "V-105",
    name: "Ashok Leyland BOSS 1920",
    plate: "TN-09-AL-5501",
    type: "Diesel Truck",
    status: "Idle",
    driver: { id: "D-05", name: "Murugan P", phone: "+91 94433-22110", safetyRating: 4.95, hoursDrivenToday: 0.0 },
    location: { city: "Chennai", lat: 13.0827, lng: 80.2707, address: "Ennore Port Terminal Yard" },
    destination: null,
    batteryOrFuel: 95,
    fuelType: "Diesel",
    speed: 0,
    payloadKg: 0,
    maxPayloadKg: 19000,
    temperatureCelsius: 28.0,
    coldChainRequired: false,
    tirePressurePsi: 112,
    healthScore: 98,
    alerts: []
  },
  {
    id: "V-106",
    name: "Tata Ace EV (Last Mile)",
    plate: "DL-03-EV-1120",
    type: "Light EV",
    status: "Maintenance",
    driver: null,
    location: { city: "Noida", lat: 28.5355, lng: 77.3910, address: "Sector 63 Service Center" },
    destination: null,
    batteryOrFuel: 15,
    fuelType: "Electric",
    speed: 0,
    payloadKg: 0,
    maxPayloadKg: 1000,
    temperatureCelsius: 25.0,
    coldChainRequired: false,
    tirePressurePsi: 28,
    healthScore: 65,
    alerts: [
      { type: "warning", message: "Scheduled 10,000 km Brake & Battery diagnostics in progress." }
    ]
  }
];

export const CITIES_DATABASE = {
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  "Gurugram": { lat: 28.4595, lng: 77.0266 },
  "Noida": { lat: 28.5355, lng: 77.3910 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Agra": { lat: 27.1767, lng: 78.0081 },
  "Chandigarh": { lat: 30.7333, lng: 76.7794 },
  "Karnal": { lat: 29.6857, lng: 76.9905 },
  "Bengaluru": { lat: 12.9716, lng: 77.5946 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 }
};
