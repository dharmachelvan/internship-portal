const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// Vercel's function filesystem is read-only except for /tmp.
// Render/local development can use the project's data directory.
const dataDir = process.env.VERCEL
  ? "/tmp/internship-portal-data"
  : path.join(__dirname, "data");

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "internships.db"));
db.pragma("foreign_keys = ON");

db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

module.exports = db;
