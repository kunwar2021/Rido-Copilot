/**
 * RIDO Knowledge Base - SOPs, Policies, and Manuals for RAG (Retrieval-Augmented Generation)
 * Matching the Microsoft Foundry Knowledge Storage Architecture
 */

export const KNOWLEDGE_DOCUMENTS = [
  {
    id: "Fleet_SOP.pdf",
    title: "Standard Operating Procedure: Fleet Management & Maintenance",
    category: "Operations",
    lastUpdated: "2026-03-15",
    version: "v3.2",
    chunks: [
      {
        chunkId: "fleet_sop_01",
        section: "Pre-Trip Inspection Protocol",
        content: "All drivers must complete the digital pre-trip inspection via the RIDO Driver App before starting any trip. Mandatory checklist items: (1) Tire pressure must be within ±5 PSI of rated pressure (110 PSI for heavy trucks, 32-35 PSI for light EVs). (2) Brake pad clearance inspection. (3) Fluid levels (coolant, DEF, brake fluid). (4) Battery state-of-charge must be minimum 80% for EV departures. Any vehicle failing critical items must be tagged 'Maintenance' and cannot be dispatched."
      },
      {
        chunkId: "fleet_sop_02",
        section: "Preventative Maintenance Schedule",
        content: "Heavy diesel vehicles require A-Service every 15,000 km (oil filter, lubrication) and B-Service every 45,000 km (transmission, differential, full brake overhaul). Electric commercial vehicles require high-voltage battery diagnostic checks every 20,000 km, regenerative braking calibration, and coolant loop flush at 50,000 km. Vehicles flagged with Health Score below 75 must be routed to the nearest regional depot within 24 hours."
      },
      {
        chunkId: "fleet_sop_03",
        section: "Reefer & Cold Chain Unit Operations",
        content: "Refrigerated transport units (Reefer) must be pre-cooled for 45 minutes prior to loading cargo. Temperature setpoints must be locked by the depot supervisor. If internal telemetry logs a temperature deviation exceeding 2.0°C above target setpoint for more than 15 consecutive minutes, the driver and central dispatch must receive a Tier-1 Critical Alert and execute immediate diversion to cold-storage standby."
      }
    ]
  },
  {
    id: "Vehicle_Policy.pdf",
    title: "Corporate Fleet Policy & Fuel/Energy Management",
    category: "Policy",
    lastUpdated: "2026-01-10",
    version: "v2.8",
    chunks: [
      {
        chunkId: "veh_pol_01",
        section: "Fueling and EV Charging Guidelines",
        content: "Diesel vehicles must refuel exclusively at authorized BPCL/IOCL fleet partner pumps using RFID corporate fuel cards. EV commercial vehicles must utilize designated 60kW/120kW DC fast chargers during scheduled mid-route breaks. Maximum EV fast charge depth is capped at 85% to preserve battery life cycle, unless the route optimizer dictates a required 100% top-up for intercity legs (>250 km)."
      },
      {
        chunkId: "veh_pol_02",
        section: "Vehicle Incident and Damage Protocol",
        content: "In the event of an accident, mechanical breakdown, or minor collision: (1) Secure the vehicle and deploy safety cones 15 meters behind the rear bumper. (2) Immediately click 'Emergency SOS' in RIDO driver terminal. (3) Report incident photos within 20 minutes to dispatch. (4) Do not negotiate private settlement; all RIDO fleet vehicles are covered under zero-depreciation commercial insurance."
      },
      {
        chunkId: "veh_pol_03",
        section: "Payload Limits & Overloading Rules",
        content: "Zero tolerance for overloading. Overloading beyond registered Gross Vehicle Weight (GVW) incurs immediate disciplinary action and invalidates insurance coverage. Vehicles with payload exceeding 95% rated capacity must have route speed restricted to 65 km/h on expressways and 40 km/h in urban corridors."
      }
    ]
  },
  {
    id: "Driver_Safety.pdf",
    title: "Driver Health, Safety & Working Hours Standards",
    category: "Safety",
    lastUpdated: "2026-02-20",
    version: "v4.1",
    chunks: [
      {
        chunkId: "driver_safe_01",
        section: "Maximum Driving Hours & Mandatory Rest Breaks",
        content: "To combat driver fatigue: Maximum continuous driving duration is 4.5 hours, followed by a mandatory minimum 45-minute rest break. Maximum total daily driving limit is 8.0 hours within a 24-hour cycle. When a driver reaches 7.0 hours of active driving, the RIDO system issues a warning alert and restricts the dispatch of any subsequent delivery legs."
      },
      {
        chunkId: "driver_safe_02",
        section: "Speed Governance and Telematics Violations",
        content: "Fleet speed is electronically governed: 80 km/h maximum on 4-lane highways/expressways, 50 km/h on state highways, and 40 km/h in city boundaries. Telematics alerts trigger automatically if: (1) Speed exceeds 85 km/h for >30 seconds, (2) Harsh braking (>0.4g deceleration), or (3) Sudden swerving. Accumulation of 3 violations in a single shift deducts 0.2 points from Driver Safety Rating."
      },
      {
        chunkId: "driver_safe_03",
        section: "Adverse Weather & Low Visibility SOP",
        content: "During heavy fog (visibility < 50 meters), torrential rain, or severe smog: Hazard lights must be activated, speed reduced to maximum 30 km/h, and minimum following distance increased to 50 meters. If visibility drops below 20 meters, drivers are mandated to park at the nearest certified toll plaza or petrol station and notify dispatch."
      }
    ]
  },
  {
    id: "Delivery_SOP.pdf",
    title: "Standard Operating Procedure: Delivery Execution & SLA Compliance",
    category: "Logistics",
    lastUpdated: "2026-04-01",
    version: "v3.0",
    chunks: [
      {
        chunkId: "del_sop_01",
        section: "Electronic Proof of Delivery (e-POD) & Customer Handoff",
        content: "Every delivery requires digital sign-off via e-POD containing: (1) Customer digital signature, (2) OTP verification sent to recipient mobile, (3) Geo-tagged timestamp within 50 meters of recipient pin. For damaged parcels, driver must take 3 high-res photos and log return code 'DMG-01' in the terminal before handing over partial shipment."
      },
      {
        chunkId: "del_sop_02",
        section: "Cold Chain Verification at Destination",
        content: "For pharmaceutical and perishable food shipments, receiver is provided a digital cold-chain certificate generated by RIDO IoT sensors showing continuous temperature logs from origin to destination. If trip average exceeded permitted threshold (+2°C to +8°C for pharma), consignee has legal right of refusal under standard SLA Section 9.2."
      },
      {
        chunkId: "del_sop_03",
        section: "Delay Management & Customer SLA Escalation",
        content: "If an in-transit delay exceeds 30 minutes past scheduled ETA due to traffic or route obstruction: The RIDO Dispatch engine must recalculate secondary detour routes. If estimated arrival is still delayed by >45 minutes, automated SMS/WhatsApp notification is triggered to customer with live tracker link and an account credit voucher is queued."
      }
    ]
  }
];
