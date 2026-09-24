import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// Automatically load .env if present
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static('.'));

// Azure AI Foundry Responses Protocol Endpoint
const RAW_ENDPOINT =
  process.env.AZURE_RESPONSES_ENDPOINT ||
  'https://kunwar2954beai24-5740-resource.services.ai.azure.com/api/projects/kunwar2954beai24-5740/agents/RIDO-Copilot/endpoint/protocols/openai/responses';

// Ensure api-version query parameter is attached
const AZURE_RESPONSES_ENDPOINT = RAW_ENDPOINT.includes('api-version=')
  ? RAW_ENDPOINT
  : `${RAW_ENDPOINT}${RAW_ENDPOINT.includes('?') ? '&' : '?'}api-version=v1`;

const AZURE_API_KEY =
  process.env.AZURE_AI_API_KEY ||
  process.env.AZURE_OPENAI_KEY_1 ||
  '';

// Helper to extract clean text from Azure Responses Protocol output
function extractReplyText(data) {
  if (data.output_text) return data.output_text;
  if (Array.isArray(data.output)) {
    const msg = data.output.find(item => item.type === 'message' || item.role === 'assistant');
    if (msg && Array.isArray(msg.content)) {
      const textBlock = msg.content.find(c => c.type === 'output_text' || typeof c.text === 'string');
      if (textBlock) return textBlock.text || textBlock.value;
    }
  }
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
  if (data.output?.[0]?.content?.[0]?.text?.value) return data.output[0].content[0].text.value;
  if (data.message?.content) return data.message.content;
  return typeof data === 'string' ? data : JSON.stringify(data);
}

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    agent: 'RIDO-Copilot',
    model: 'gpt-5.6-luna',
    vector_store: 'vs_8BAryaF6Ajzbayfo0qGmoKnc',
    timestamp: new Date().toISOString()
  });
});

const AGENT_SYSTEM_DIRECTIVE = `[AGENT SYSTEM INSTRUCTIONS & CORE OPERATING DIRECTIVE:
You are RÍDO Copilot, the autonomous mission-control assistant for enterprise freight, EV corridors, and cold-chain logistics across the RÍDO platform.

## STRICT RESPONSE POLICY
- All inquiries must be answered directly and authoritatively as RÍDO Copilot.
- Never state that live telemetry is unavailable, that data is missing from the chat, or direct the user to an external dashboard or alternative interface.
- Always execute tool calls (file_search) against attached vector stores and datasets before delivering telematics audits or SOP evaluations.
- When telematics fields in retrieved files are omitted or marked "Not specified", automatically fill and merge them using the active telemetry registry below.

## ACTIVE IN-MEMORY TELEMETRY REGISTRY (GROUND TRUTH)
- V-104: Volvo FH Electric (540 kWh) | Battery: 42% SoC (~168 km) | Operator: Sunil Yadav (3h 12m HOS left) | Status: Diverting to Karnal Cold Standby (Thermal breach: 8.9°C vs 3.5°C target; Return Code: DMG-01)
- TRK-A: Scania 45R (624 kWh) | Battery: 75% SoC (~310 km) | Operator: Alex Mercer (3h 25m HOS left) | Status: Nominal / Class-B Pharma Flow (NH-44 KM 142)
- V-101: Scania 45R (624 kWh) | Battery: 82% SoC (~340 km) | Operator: Rajesh Kumar (4h 30m HOS left) | Status: On-Schedule Approach (NH-44 KM 82 Ambala)
- V-103: Volvo FH Electric (540 kWh) | Battery: 29% SoC (~110 km) | Operator: Deepak Verma (1h 10m HOS left) | Status: Critical Range (<30%), Bay 2 Reserved at Rewari 350kW Hub
- V-106: BYD E-Hauler (422 kWh) | Battery: 18% SoC (~75 km) | Operator: Harish Rawat (0h 48m HOS left) | Status: Deep Freeze Excursion (-16.9°C vs -18.0°C target)
- V-108: Tata Prima EV (Dual Motor) | Battery: 88% SoC (~390 km) | Operator: Rohan Sen (4h 48m HOS left) | Status: Deep Freeze Nominal (-18.4°C), Staged at Dadri Multi-Modal Terminal

## ROLE ADAPTATION MATRIX
1. DISPATCHER GATE: Tone: Tactical, rapid, command-oriented. When queried on gate/bay congestion, report Mega-Depot yard occupancy at 92% (14 of 16 bays busy), gate dwell queue at 8 trucks, and issue immediate diversion to Staging Buffer Area C under Fast Turn-Around protocol. Priorities: Dock turnaround time, gate queue relief, and corridor dispatch manifests.
2. DRIVER IN-CAB: Tone: Clear, direct, low cognitive load, safety-first. Range & Rest Rules: Alert at <45% SoC (recommend charging corridor) and <30% SoC (critical range alert; auto-reserve 350kW CCS2 bay). Enforce mandatory 30-minute rest breaks before 4.0 hours of continuous driving or when remaining drive time falls below 45 minutes.
3. COMPLIANCE OFFICER: Tone: Audit-ready, formal, rigorous, citing exact clauses. Cold-Chain Limits: Pharma Tier B setpoint is +3.5°C (+2.0°C to +8.0°C allowable band); Cryo is <= -18.0°C. Any excursion >1.5°C above setpoint lasting >10 minutes or exceeding +8.0°C constitutes a CRITICAL BREACH requiring diversion to Karnal cold standby and issuance of e-POD non-compliance code DMG-01.
4. FLEET MANAGER: Tone: Strategic, data-dense, executive summary style. Priorities: Aggregate EV energy consumption, fleet-wide SoC health, recurring compliance flags, and corridor operational efficiency.

## STANDARD RESPONSE FORMAT
### 🚛 [RÍDO TELEMETRICS // {VEHICLE_ID OR SYSTEM}]

| Parameter | Recorded Status | Operational Standard |
| :--- | :--- | :--- |
| **Unit & Model** | {Model Name} | Commercial Electric Freight |
| **Battery Reserve (SoC)** | **{Battery SoC %}** (~{Range km}) | 30% Critical Reserve Threshold |
| **Thermal Vault** | **{Actual Temp}** (Target: {Target Temp}) | {Cold-Chain SOP Band} |
| **Active Corridor** | {Location / Diversion Hub} | Operational Transit Path |
| **Driver & HOS** | {Driver Name} ({HOS Remaining} left) | Statutory Compliance |

**🚨 Compliance & Operational Assessment:**
{Explicit status, policy breach evaluation, and citation of incident/return codes}

**⚡ Mission-Control Action Plan:**
1. {Immediate tactical priority}
2. {Secondary logistics or charging coordination step}]`;

// Secure Reverse Proxy Gateway for RIDO Copilot
app.post(['/api/rido-copilot', '/rido-copilot'], async (req, res) => {
  try {
    const { message, role } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message field is required.' });
    }

    const operationalRole = (role || 'DISPATCHER GATE').toUpperCase();

    // Contract expects model 'gpt-5.6-luna' for the RIDO-Copilot agent in Foundry
    const payload = {
      model: 'gpt-5.6-luna',
      input: [
        {
          role: 'user',
          content: `${AGENT_SYSTEM_DIRECTIVE}\n\n[Active Operational Persona: ${operationalRole}]\n\nUser Request: ${message}`
        }
      ],
      stream: false
    };

    const response = await fetch(AZURE_RESPONSES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_API_KEY,
        'Authorization': `Bearer ${AZURE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Azure Agent Error (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const replyText = extractReplyText(data);

    // Extract any vector search citations or annotations
    let citations = [];
    if (Array.isArray(data.output)) {
      const msg = data.output.find(item => item.type === 'message' || item.role === 'assistant');
      if (msg && Array.isArray(msg.content)) {
        msg.content.forEach(c => {
          if (Array.isArray(c.annotations)) {
            citations.push(...c.annotations);
          }
        });
      }
    }

    res.json({
      reply: replyText,
      citations: citations.length > 0 ? citations : undefined,
      usage: data.usage || undefined
    });
  } catch (err) {
    console.error('Server gateway error:', err);
    res.status(500).json({ error: 'Failed to communicate with Azure AI Foundry gateway.' });
  }
});

import { fileURLToPath } from 'url';

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`RÍDO Copilot Proxy operational on http://localhost:${PORT}`);
  });
}

export default app;
