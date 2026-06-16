const fs = require("fs");
const path = require("path");
const { config } = require("./config");

const logsDir = path.join(process.cwd(), "logs");
const logFile = path.join(logsDir, "application.log");

let fileLoggingEnabled = true;

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.appendFileSync(logFile, "");
} catch {
  fileLoggingEnabled = false;
}

const write = (level, event, metadata = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...metadata
  };

  if (fileLoggingEnabled) {
    fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
  }

  if (config.nodeEnv !== "test") {
    console.log(JSON.stringify(entry));
  }
};

const logger = {
  info: (event, metadata) => write("info", event, metadata),
  error: (event, metadata) => write("error", event, metadata)
};

module.exports = { logger };
