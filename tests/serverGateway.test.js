/**
 * Unit Tests for Express.js Backend Gateway & Azure AI Foundry Responses Protocol Proxy
 */
import test from "node:test";
import assert from "node:assert/strict";
import app from "../server.js";

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    // Listen on port 0 to choose an open ephemeral port
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Gateway Health Check Endpoint (/api/health)", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200, "Health check should return 200");
  const data = await res.json();
  assert.equal(data.status, "ok");
  assert.equal(data.agent, "RIDO-Copilot");
  assert.equal(data.model, "gpt-5.6-luna");
  assert.equal(data.vector_store, "vs_8BAryaF6Ajzbayfo0qGmoKnc");
});

test("Gateway Validation: Missing Message Field", async () => {
  const res = await fetch(`${baseUrl}/api/rido-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "DISPATCHER GATE" })
  });
  assert.equal(res.status, 400, "Missing message should return 400 Bad Request");
  const data = await res.json();
  assert.match(data.error, /Message field is required/);
});

test("Gateway Live Query: Driver HOS Compliance via Azure AI Foundry Agent", async () => {
  const res = await fetch(`${baseUrl}/api/rido-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Are any drivers close to exceeding their 8.0-hour daily limit or 4.5-hour continuous driving threshold?",
      role: "DISPATCHER GATE"
    })
  });

  assert.equal(res.status, 200, `Expected 200 OK from Azure Responses gateway but got ${res.status}`);
  const data = await res.json();
  assert.ok(data.reply, "Gateway should return a non-empty reply string");
  assert.ok(typeof data.reply === "string", "Reply must be a string");
  // The agent response should mention drivers / status / hours
  assert.ok(
    data.reply.toLowerCase().includes("driver") ||
    data.reply.toLowerCase().includes("hos") ||
    data.reply.toLowerCase().includes("sunil") ||
    data.reply.toLowerCase().includes("limit"),
    "Reply should address the driver compliance query"
  );
});
