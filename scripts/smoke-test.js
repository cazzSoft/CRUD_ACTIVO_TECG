const { spawn } = require("child_process");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(body?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return { response, body };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  const server = spawn(process.execPath, ["--no-warnings", "src/server.js"], {
    env: { ...process.env, NODE_ENV: "test" },
    stdio: "inherit"
  });

  try {
    await wait(700);

    const health = await request("/health");
    assert(health.body.status === "ok", "health check failed");

    const serial = `TEST-${Date.now()}`;
    const payload = {
      name: "Laptop Dell Latitude 5440",
      category: "laptop",
      serialNumber: serial,
      status: "available",
      location: "Laboratorio 1",
      purchaseDate: "2026-05-20"
    };

    const created = await request("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const id = created.body.data.id;
    assert(/^[0-9a-f-]{36}$/i.test(id), "created asset id is not a UUID");

    const read = await request(`/api/assets/${id}`);
    assert(read.body.data.serialNumber === serial, "asset read did not match created data");

    const updated = await request(`/api/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, status: "maintenance" })
    });
    assert(updated.body.data.status === "maintenance", "asset update failed");

    const deleted = await request(`/api/assets/${id}`, { method: "DELETE" });
    assert(deleted.response.status === 204, "asset delete failed");

    try {
      await request("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad json"
      });
      throw new Error("malformed JSON was accepted");
    } catch (err) {
      assert(err.status === 400, "malformed JSON did not return 400");
    }

    console.log("Smoke test passed");
  } finally {
    server.kill();
  }
};

run().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
