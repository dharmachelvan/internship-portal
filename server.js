const express = require("express");
const helmet = require("helmet");
const path = require("path");
const db = require("./db");
const { validateInternship, validateApplication } = require("./validation");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));

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

app.post("/api/applications", (req, res) => {
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
