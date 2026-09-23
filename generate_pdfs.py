import os

def create_simple_pdf(filename, title, paragraphs):
    content_stream = f"BT /F1 14 Tf 50 740 Td ({title}) Tj ET\n"
    y = 700
    for p in paragraphs:
        words = p.split(' ')
        line = ""
        for w in words:
            clean_w = w.replace('(', '').replace(')', '').replace('\\', '')
            if len(line + " " + clean_w) > 75:
                content_stream += f"BT /F1 10 Tf 50 {y} Td ({line.strip()}) Tj ET\n"
                y -= 14
                line = clean_w
            else:
                line += " " + clean_w
        if line.strip():
            content_stream += f"BT /F1 10 Tf 50 {y} Td ({line.strip()}) Tj ET\n"
            y -= 22

    stream_len = len(content_stream.encode('latin1'))

    pdf_text = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
4 0 obj << /Length {stream_len} >>
stream
{content_stream}endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000115 00000 n 
0000000280 00000 n 
0000000210 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
450
%%EOF"""

    with open(filename, 'wb') as f:
        f.write(pdf_text.encode('latin1'))
    print(f"Generated PDF: {filename}")

docs = [
    ("knowledge_storage/Fleet_SOP.pdf", "RIDO SOP: Fleet Management and Maintenance", [
        "1. Pre-Trip Inspection Protocol: All drivers must complete the digital pre-trip inspection via the RIDO Driver App before starting any trip.",
        "Mandatory checklist items: 1. Tire pressure must be within +/- 5 PSI of rated pressure (110 PSI for heavy trucks, 32-35 PSI for light EVs). 2. Brake pad clearance inspection. 3. Fluid levels. 4. Battery State-of-Charge must be minimum 80% for EV departures. Any vehicle failing critical items must be tagged Maintenance and cannot be dispatched.",
        "2. Preventative Maintenance Schedule: Heavy diesel vehicles require A-Service every 15,000 km and B-Service every 45,000 km. Commercial EVs require high-voltage diagnostic checks every 20,000 km. Vehicles with Health Score below 75 must be routed to depot within 24 hours.",
        "3. Reefer Cold Chain Unit Operations: Refrigerated transport units must be pre-cooled for 45 minutes prior to loading cargo. If internal telemetry logs a temperature deviation exceeding 2.0C above setpoint for more than 15 consecutive minutes, execute immediate diversion to cold-storage standby."
    ]),
    ("knowledge_storage/Vehicle_Policy.pdf", "RIDO Corporate Fleet Policy and Energy Management", [
        "1. Fueling and EV Charging Guidelines: Diesel vehicles must refuel exclusively at authorized partner pumps using RFID corporate fuel cards. EV commercial vehicles must utilize designated 60kW/120kW DC fast chargers during scheduled breaks. Maximum EV fast charge depth is capped at 85% to preserve battery cycle life unless trip is greater than 250 km.",
        "2. Incident and Damage Protocol: In the event of breakdown or collision, secure the vehicle and deploy safety cones 15 meters behind rear bumper. Click Emergency SOS in driver terminal. Report photos within 20 minutes.",
        "3. Payload Limits and Overloading: Zero tolerance for overloading beyond registered Gross Vehicle Weight (GVW). Vehicles with payload exceeding 95% rated capacity have route speed restricted to 65 km/h on expressways and 40 km/h in urban corridors."
    ]),
    ("knowledge_storage/Driver_Safety.pdf", "RIDO Driver Health, Safety and Hours Standards", [
        "1. Maximum Driving Hours and Rest Breaks: Maximum continuous driving duration is 4.5 hours, followed by mandatory minimum 45-minute rest break. Maximum total daily driving limit is 8.0 hours within a 24-hour cycle. When driver reaches 7.0 hours, system issues warning alert and restricts subsequent dispatches.",
        "2. Speed Governance: Fleet speed is electronically governed to 80 km/h on expressways, 50 km/h on state highways, and 40 km/h in city boundaries. Telematics alerts trigger on speeds > 85 km/h or harsh braking > 0.4g.",
        "3. Adverse Weather and Low Visibility SOP: During heavy fog (visibility < 50 meters), hazard lights must be activated, speed reduced to max 30 km/h, and following distance increased to 50 meters. If visibility drops below 20 meters, drivers are mandated to park at nearest toll plaza or petrol station."
    ]),
    ("knowledge_storage/Delivery_SOP.pdf", "RIDO Delivery Execution and SLA Compliance", [
        "1. Electronic Proof of Delivery (e-POD): Every delivery requires digital sign-off via e-POD containing: customer signature, OTP verification, and geo-tagged timestamp within 50 meters of recipient pin. Damaged parcels log return code DMG-01.",
        "2. Cold Chain Verification at Destination: For pharmaceutical and perishable food shipments, receiver is provided digital cold-chain certificate generated by RIDO IoT sensors. If trip average exceeded permitted threshold (+2C to +8C), consignee has legal right of refusal under SLA Section 9.2.",
        "3. Delay Management: If in-transit delay exceeds 30 minutes past ETA due to traffic, dispatch engine recalculates secondary detour routes. Delays > 45 minutes trigger automated customer notification and account credit voucher."
    ])
]

os.makedirs("knowledge_storage", exist_ok=True)
for fn, title, paras in docs:
    create_simple_pdf(fn, title, paras)
