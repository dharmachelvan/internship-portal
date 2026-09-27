const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");

process.env.NODE_ENV = "test";

const app = require("./server");
const db = require("./db");

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
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

test.before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("health endpoint returns healthy", async () => {
  const result = await request("/api/health");
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.status, "healthy");
});

test("internship list supports pagination and filtering", async () => {
  const result = await request("/api/internships?page=1&limit=2&domain=Engineering");
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.length <= 2, true);
  assert.equal(typeof result.body.pagination.total, "number");
  assert.equal(result.body.data.every(item => item.domain === "Engineering"), true);
});

test("internship details returns a seeded record", async () => {
  const result = await request("/api/internships/1");
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.id, 1);
  assert.ok(Array.isArray(result.body.data.skills));
});

test("invalid internship creation returns validation error", async () => {
  const result = await request("/api/internships", {
    method: "POST",
    body: { title: "" }
  });
  assert.equal(result.status, 422);
  assert.equal(result.body.error.code, "VALIDATION_ERROR");
});

test("internship CRUD create, update, and delete works", async () => {
  const create = await request("/api/internships", {
    method: "POST",
    body: {
      title: "Automated Test Intern",
      company: "TestWorks",
      location: "Remote",
      domain: "Engineering",
      type: "Internship",
      duration: "2 months",
      stipend: "₹8,000/month",
      description: "Temporary record used to verify CRUD behavior.",
      skills: ["Node.js", "Testing"],
      apply_url: "https://example.com/test"
    }
  });

  assert.equal(create.status, 201);
  const id = create.body.data.id;
  assert.equal(typeof id, "number");

  const update = await request(`/api/internships/${id}`, {
    method: "PUT",
    body: {
      title: "Updated Test Intern",
      company: "TestWorks",
      location: "Remote",
      domain: "Engineering",
      type: "Internship",
      duration: "3 months",
      stipend: "₹9,000/month",
      description: "Updated temporary record used to verify CRUD behavior.",
      skills: ["Node.js", "Express", "Testing"],
      apply_url: "https://example.com/updated-test"
    }
  });

  assert.equal(update.status, 200);
  assert.equal(update.body.data.title, "Updated Test Intern");

  const remove = await request(`/api/internships/${id}`, { method: "DELETE" });
  assert.equal(remove.status, 200);
  assert.equal(remove.body.data.deleted, true);

  const missing = await request(`/api/internships/${id}`);
  assert.equal(missing.status, 404);
});

test("application endpoint validates and stores an application", async () => {
  const email = `test-${Date.now()}@example.com`;
  const result = await request("/api/applications", {
    method: "POST",
    body: {
      internship_id: 1,
      name: "Test Applicant",
      email,
      phone: "+91 9876543210",
      resume_url: "https://example.com/resume.pdf",
      cover_note: "I am interested in this internship and enjoy building web applications."
    }
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.success, true);
  assert.equal(typeof result.body.data.application_id, "number");

  const duplicate = await request("/api/applications", {
    method: "POST",
    body: {
      internship_id: 1,
      name: "Test Applicant",
      email,
      phone: "+91 9876543210",
      resume_url: "https://example.com/resume.pdf",
      cover_note: "I am interested in this internship and enjoy building web applications."
    }
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, "DUPLICATE_APPLICATION");

  db.prepare("DELETE FROM applications WHERE internship_id = 1 AND email = ?").run(email);
});

test("invalid application returns validation error", async () => {
  const result = await request("/api/applications", {
    method: "POST",
    body: { internship_id: 1, name: "A", email: "bad" }
  });
  assert.equal(result.status, 422);
  assert.equal(result.body.error.code, "VALIDATION_ERROR");
});

test("unknown API route returns JSON 404", async () => {
  const result = await request("/api/does-not-exist");
  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "API_NOT_FOUND");
});
