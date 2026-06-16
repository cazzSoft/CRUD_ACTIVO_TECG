const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");
const { config } = require("./config");
const { logger } = require("./logger");

const dbPath = path.isAbsolute(config.dbFile)
  ? config.dbFile
  : path.join(process.cwd(), config.dbFile);

let db;

const openDatabase = () => new DatabaseSync(dbPath);

const openMemoryDatabase = () => {
  logger.error("database_file_open_failed", {
    configuredPath: dbPath,
    fallback: "memory"
  });
  return new DatabaseSync(":memory:");
};

try {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  db = openDatabase();
} catch (err) {
  try {
    if (fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "");
      db = openDatabase();
    } else {
      throw err;
    }
  } catch {
    db = openMemoryDatabase();
  }
}

const initializeSchema = () => {
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN (
        'laptop',
        'desktop',
        'monitor',
        'printer',
        'router',
        'projector',
        'other'
      )),
      serialNumber TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK (status IN (
        'available',
        'assigned',
        'maintenance',
        'retired'
      )),
      location TEXT NOT NULL,
      purchaseDate TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
};

try {
  initializeSchema();
} catch (err) {
  if (fs.existsSync(dbPath) && String(err.message).includes("not a database")) {
    db.close();
    fs.writeFileSync(dbPath, "");
    db = openDatabase();
    initializeSchema();
  } else {
    throw err;
  }
}

module.exports = { db };
