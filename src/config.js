const os = require("os");
const path = require("path");

const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  dbFile:
    process.env.DB_FILE ||
    path.join(os.tmpdir(), "crud-activos-seguros", "database.sqlite"),
  logLevel: process.env.LOG_LEVEL || "info"
};

module.exports = { config };
