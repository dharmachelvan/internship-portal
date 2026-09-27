const express = require("express");
const helmet = require("helmet");
const path = require("path");
const db = require("./db");
const { validateInternship, validateApplication } = require("./validation");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));

// The frontend is served from this same application, so CORS is disabled by
// default. Set ALLOWED_ORIGIN to the exact frontend origin when cross-origin
// access is required.
app.use((req, res, next) => {
  const origin = req.get("Origin");
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (origin && allowedOrigin && origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    return allowedOrigin && origin === allowedOrigin
      ? res.status(204).end()
      : res.status(403).end();
  }
  next();
});

function createRateLimiter({ windowMs, max, message }) {
  const clients = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key);
    }
  }, Math.min(windowMs, 60_000));
  cleanup.unref();

  return (req, res, next) => {
    const forwarded = req.get("x-forwarded-for");
    const key = (forwarded ? forwarded.split(",")[0].trim() : req.ip) || "unknown";
    const now = Date.now();
    let entry = clients.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }

    entry.count += 1;
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count));

    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return fail(res, 429, "RATE_LIMITED", message);
    }

    next();
  };
}

const apiRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 120,
  message: "Too many API requests. Please try again shortly."
});

const applicationRateLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  message: "Too many application attempts. Please try again later."
});

function ok(res, data, status = 200, extra = {}) {
  return res.status(status).json({ success: true, data, ...extra });
}

function fail(res, status, code, message, fields) {
  const error = { code, message };
  if (fields) error.fields = fields;
  return res.status(status).json({ success: false, error });
}

function serialize(row) {
  if (!row) return null;
  let skills = [];
  try { skills = JSON.parse(row.skills || "[]"); } catch { skills = []; }
  return { ...row, skills };
}

app.use("/api", apiRateLimit);

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM internships").get().count;
  if (count === 0) {
    require("./seed");
  }
}

seedIfEmpty();

app.get("/api/health", (req, res) => ok(res, { status: "healthy" }));

app.get("/api/domains", (req, res) => {
  const domains = db.prepare("SELECT DISTINCT domain FROM internships ORDER BY domain").all().map(row => row.domain);
  return ok(res, domains);
});

app.get("/api/internships", (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 6));
  const search = String(req.query.search || "").trim();
  const domain = String(req.query.domain || "").trim();
  const conditions = [];
  const params = {};

  if (search) {
    conditions.push(`(title LIKE @search OR company LIKE @search OR location LIKE @search OR description LIKE @search OR skills LIKE @search)`);
    params.search = `%${search}%`;
  }
  if (domain) {
    conditions.push("domain = @domain");
    params.domain = domain;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = db.prepare(`SELECT COUNT(*) AS count FROM internships ${where}`).get(params).count;
  const pages = Math.ceil(total / limit);
  const safePage = pages === 0 ? 1 : Math.min(page, pages);
  const offset = (safePage - 1) * limit;
  const rows = db.prepare(`
    SELECT * FROM internships ${where}
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  return ok(res, rows.map(serialize), 200, { pagination: { page: safePage, limit, total, pages } });
});

app.get("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, "INVALID_ID", "Internship ID must be an integer.");
  const row = db.prepare("SELECT * FROM internships WHERE id = ?").get(id);
  if (!row) return fail(res, 404, "NOT_FOUND", "Internship not found.");
  return ok(res, serialize(row));
});

app.post("/api/internships", (req, res) => {
  const result = validateInternship(req.body || {});
  if (!result.valid) return fail(res, 422, "VALIDATION_ERROR", "Please correct the highlighted fields.", result.fields);
  const info = db.prepare(`
    INSERT INTO internships
    (title, company, location, domain, type, duration, stipend, description, skills, apply_url)
    VALUES (@title, @company, @location, @domain, @type, @duration, @stipend, @description, @skills, @apply_url)
  `).run({ ...result.value, skills: JSON.stringify(result.value.skills) });
  return ok(res, serialize(db.prepare("SELECT * FROM internships WHERE id = ?").get(info.lastInsertRowid)), 201);
});

app.put("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, "INVALID_ID", "Internship ID must be an integer.");
  if (!db.prepare("SELECT id FROM internships WHERE id = ?").get(id)) return fail(res, 404, "NOT_FOUND", "Internship not found.");
  const result = validateInternship(req.body || {});
  if (!result.valid) return fail(res, 422, "VALIDATION_ERROR", "Please correct the highlighted fields.", result.fields);
  db.prepare(`
    UPDATE internships SET title=@title, company=@company, location=@location, domain=@domain,
    type=@type, duration=@duration, stipend=@stipend, description=@description,
    skills=@skills, apply_url=@apply_url, updated_at=CURRENT_TIMESTAMP WHERE id=@id
  `).run({ ...result.value, id, skills: JSON.stringify(result.value.skills) });
  return ok(res, serialize(db.prepare("SELECT * FROM internships WHERE id = ?").get(id)));
});

app.delete("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, "INVALID_ID", "Internship ID must be an integer.");
  const info = db.prepare("DELETE FROM internships WHERE id = ?").run(id);
  if (!info.changes) return fail(res, 404, "NOT_FOUND", "Internship not found.");
  return ok(res, { deleted: true, id });
});

app.post("/api/applications", applicationRateLimit, (req, res) => {
  const result = validateApplication(req.body || {});
  if (!result.valid) return fail(res, 422, "VALIDATION_ERROR", "Please correct the highlighted fields.", result.fields);
  if (!db.prepare("SELECT id FROM internships WHERE id = ?").get(result.value.internship_id)) {
    return fail(res, 404, "INTERNSHIP_NOT_FOUND", "That internship no longer exists.");
  }
  try {
    const info = db.prepare(`
      INSERT INTO applications (internship_id, name, email, phone, resume_url, cover_note)
      VALUES (@internship_id, @name, @email, @phone, @resume_url, @cover_note)
    `).run(result.value);
    return ok(res, { application_id: info.lastInsertRowid, message: "Application submitted successfully." }, 201);
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return fail(res, 409, "DUPLICATE_APPLICATION", "This email has already been used for this internship.");
    }
    throw error;
  }
});

// Serve the vanilla frontend from the repository root.
app.use(express.static(__dirname));

app.use("/api", (req, res) => fail(res, 404, "API_NOT_FOUND", "API route not found."));

app.get("*splat", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  return fail(res, 500, "SERVER_ERROR", "Something went wrong on the server.");
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => console.log(`Internship Portal running on port ${PORT}`));
}

module.exports = app;
