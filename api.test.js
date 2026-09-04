const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";

const app = require("../backend/server");
const http = require("http");

let server;
let base;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const req = http.request(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

test.before(async () => {
  server = app.listen(0);
  const port = server.address().port;
  base = `http://127.0.0.1:${port}`;
});

test.after(() => server.close());

test("health endpoint returns healthy", async () => {
  const result = await request("/api/health");
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
});

test("internship list supports pagination", async () => {
  const result = await request("/api/internships?page=1&limit=2");
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.length <= 2, true);
  assert.equal(typeof result.body.pagination.total, "number");
});

test("invalid internship creation returns validation error", async () => {
  const result = await request("/api/internships", {
    method: "POST",
    body: { title: "" }
  });
  assert.equal(result.status, 422);
  assert.equal(result.body.error.code, "VALIDATION_ERROR");
});
