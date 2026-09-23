import os

def create_simple_pdf(filename, title, paragraphs):
    content_stream = f"BT /F1 14 Tf 50 740 Td ({title}) Tj ET\n"
    y = 700
    for p in paragraphs:
        words = p.split(' ')
        line = ""
        for w in words:
            clean_w = w.replace('(', '').replace(')', '').replace('\\', '').replace('[', '').replace(']', '')
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

advanced_docs = [
    ("knowledge_storage/Green_Corridor_EV_Optimization.pdf", "RIDO Green Corridor and EV Battery Thermal Protocol", [
        "1. Extreme Ambient Temperature Protocol: When ambient temperature exceeds 40C in summer corridors, EV battery thermal management system (BTMS) must maintain internal cell temperature between 25C and 35C. If battery temperature exceeds 48C, trigger mandatory thermal throttling with speed capped to 50 km/h.",
        "2. Dynamic Charging Corridor Selection: Long-haul EV trips (>300 km) must schedule high-power 120kW DC charging stops only when State-of-Charge reaches 15% to 25% window to maximize charging curve efficiency. Never fast-charge past 85% at public commercial hubs.",
        "3. Regenerative Braking and Payload Compensation: For heavy commercial EVs descending ghat / hilly terrain (gradient > 4%), drivers must engage Stage-3 Regenerative Braking to recover up to 18% kinetic energy into the traction battery while avoiding mechanical brake fade."
    ]),
    ("knowledge_storage/Pharma_Vaccine_Cold_Chain_SLA.pdf", "RIDO Pharmaceutical and Vaccine Cold-Chain SLA", [
        "1. Deep Frozen and Bio-Pharma Temperature Tiers: Tier A vaccines require continuous deep frozen integrity (-25C to -15C). Tier B pharmaceutical biologicals require standard cold-chain (+2C to +8C). IoT dual-probe temperature logging is mandatory with 60-second telemetry polling intervals.",
        "2. Thermal Deviation and Escalation Matrix: Any continuous thermal deviation exceeding 1.5C from setpoint for more than 10 minutes triggers automated Level-2 Escalation to Chief Logistics Officer, with automatic reroute to the nearest cold-chain certified standby depot.",
        "3. Consignee Rights of Refusal: If temperature breach code DMG-01 is logged, consignee has mandatory legal entitlement to reject delivery under SLA Clause 9.2 with zero freight liability."
    ]),
    ("knowledge_storage/Emergency_Incident_and_Safety_SOP.pdf", "RIDO Emergency Breakdown and Incident Escalation SOP", [
        "1. Expressway Breakdown Protocol: Immediately steer vehicle to hard shoulder. Switch on hazard warning lights. Place fluorescent safety warning triangles 15 meters and 50 meters behind rear bumper.",
        "2. Emergency SOS and Telematics Escalation: Driver must activate SOS button in RIDO terminal within 5 minutes of breakdown. Central dispatch automatically dispatches mobile repair unit and backup tow vehicle within 30 km radius.",
        "3. Driver Fatigue and Night Driving Restrictions: Driving between 01:00 AM and 05:00 AM requires mandatory Level-4 Telematics Driver Monitoring for eyelid closure and lane departure. Maximum continuous night shift driving is capped at 3.5 hours."
    ])
]

os.makedirs("knowledge_storage", exist_ok=True)
for fn, title, paras in advanced_docs:
    create_simple_pdf(fn, title, paras)
