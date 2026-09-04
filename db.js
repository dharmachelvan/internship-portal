const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "internships.db"));
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(
  path.join(__dirname, "..", "database", "schema.sql"),
  "utf8"
);
db.exec(schema);

module.exports = db;
