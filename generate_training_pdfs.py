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

training_docs = [
    ("training_data/RIDO_Fleet_Training_Dataset.pdf", "RIDO Fleet Training Dataset - Multi-Fuel and SOPs", [
        "Scenario 1: Cold-Chain Thermal Excursion on Vehicle V-104 (8.9C vs target 3.5C). Status: CRITICAL COLD-CHAIN BREACH. Action: Immediate dynamic diversion to nearest cold-storage standby in Karnal. Generate e-POD non-compliance return code DMG-01.",
        "Scenario 2: Multi-Fuel Route Optimization from Delhi to Jaipur (280 km) for 8,000 kg cargo. Commercial EV consumes 266 kWh (Cost: INR 2,261, 0.00 kg tailpipe CO2, Net savings vs Diesel: INR 4,951 and 210.1 kg CO2 offset). Diesel baseline consumes 78.4L (Cost: INR 7,212, CO2: 210.1 kg at 2.68 kg CO2/L).",
        "Scenario 3: Driver Shift Hours Compliance for Rajesh Kumar (D-11). Reached 4.5 hours continuous driving limit. Status: MANDATORY SHIFT HALT. Action: Enforce 45-minute mandatory rest layby immediately. Daily shift ceiling capped at 8.0 hours.",
        "Scenario 4: Commercial EV Battery Management for Vehicle V-103 (SoC 18%). Status: LOW BATTERY WARNING. Action: Reroute to Indiranagar 60kW DC Fast Charger. Limit DC fast-charge depth to maximum 85% to preserve battery life cycle."
    ]),
    ("training_data/RIDO_Fleet_Validation_Dataset.pdf", "RIDO Fleet Validation and Evaluation Benchmark", [
        "Benchmark 1: Pre-Trip Inspection Tire Pressure Standards (Fleet_SOP.pdf § 1). Heavy commercial trucks (MHCV V-101, V-102, V-105) require 110 PSI with +/- 5 PSI tolerance. Light EVs (LCV V-103, V-106) require 32 to 35 PSI. Failing vehicles are tagged Maintenance.",
        "Benchmark 2: Adverse Weather Low Visibility Fog Protocol (Driver_Safety.pdf § 3). Visibility under 20 meters mandates immediate vehicle halt at nearest toll plaza or petrol station with hazard warning lights and safety reflectors deployed 15 meters behind rear bumper."
    ])
]

os.makedirs("training_data", exist_ok=True)
for fn, title, paras in training_docs:
    create_simple_pdf(fn, title, paras)
