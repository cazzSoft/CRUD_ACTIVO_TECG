const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { config } = require("./config");
const { logger } = require("./logger");
const {
  createAsset,
  deleteAsset,
  getAssetById,
  listAssets,
  updateAsset
} = require("./controllers/assets.controller");
const { validateAssetBody, validateUuid } = require("./validators/asset.validator");
require("./db");

const MAX_BODY_SIZE = 10 * 1024;
const publicDir = path.join(__dirname, "public");
const indexFile = path.join(publicDir, "index.html");

const sendHtml = (res, statusCode, html) => {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store"
  });

  return res.end(html);
};

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store"
  });

  if (body === null) {
    return res.end();
  }

  return res.end(JSON.stringify(body));
};

const parseJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let receivedBytes = 0;
    let rawBody = "";

    req.on("data", (chunk) => {
      receivedBytes += chunk.length;

      if (receivedBytes > MAX_BODY_SIZE) {
        reject({ statusCode: 413, body: { error: "Request body too large" } });
        req.destroy();
        return;
      }

      rawBody += chunk.toString("utf8");
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(rawBody || "{}"));
      } catch {
        reject({ statusCode: 400, body: { error: "Malformed JSON body" } });
      }
    });

    req.on("error", () => {
      reject({ statusCode: 400, body: { error: "Invalid request body" } });
    });
  });

const requiresJsonBody = (method) => ["POST", "PUT", "PATCH"].includes(method);

const routeRequest = async (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;
  const path = url.pathname;
  const meta = { method, path };

  if (method === "GET" && path === "/health") {
    return { statusCode: 200, body: { status: "ok" } };
  }

  if (method === "GET" && path === "/") {
    const html = fs.readFileSync(indexFile, "utf8");
    return { statusCode: 200, html };
  }

  if (requiresJsonBody(method)) {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.toLowerCase().startsWith("application/json")) {
      return { statusCode: 415, body: { error: "Content-Type must be application/json" } };
    }
  }

  if (method === "GET" && path === "/api/assets") {
    return listAssets(meta);
  }

  if (method === "POST" && path === "/api/assets") {
    const body = await parseJsonBody(req);
    const validation = validateAssetBody(body);

    if (!validation.valid) {
      return {
        statusCode: 400,
        body: { error: "Invalid request data", details: validation.errors }
      };
    }

    return createAsset(validation.data, meta);
  }

  const assetRouteMatch = path.match(/^\/api\/assets\/([^/]+)$/);

  if (assetRouteMatch) {
    const id = assetRouteMatch[1];

    if (!validateUuid(id)) {
      return { statusCode: 400, body: { error: "Invalid route parameter" } };
    }

    if (method === "GET") {
      return getAssetById(id, meta);
    }

    if (method === "PUT") {
      const body = await parseJsonBody(req);
      const validation = validateAssetBody(body);

      if (!validation.valid) {
        return {
          statusCode: 400,
          body: { error: "Invalid request data", details: validation.errors }
        };
      }

      return updateAsset(id, validation.data, meta);
    }

    if (method === "DELETE") {
      return deleteAsset(id, meta);
    }
  }

  return { statusCode: 404, body: { error: "Endpoint not found" } };
};

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();

  try {
    const response = await routeRequest(req);
    logger.info("http_request", {
      method: req.method,
      path: new URL(req.url, `http://${req.headers.host}`).pathname,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt
    });

    if (response.html) {
      return sendHtml(res, response.statusCode, response.html);
    }

    return sendJson(res, response.statusCode, response.body);
  } catch (err) {
    if (err && err.statusCode && err.body) {
      logger.error("http_request_error", {
        method: req.method,
        path: new URL(req.url, `http://${req.headers.host}`).pathname,
        statusCode: err.statusCode,
        durationMs: Date.now() - startedAt
      });
      return sendJson(res, err.statusCode, err.body);
    }

    logger.error("unhandled_error", {
      method: req.method,
      path: req.url,
      statusCode: 500
    });
    return sendJson(res, 500, { error: "Internal server error" });
  }
});

server.listen(config.port, () => {
  logger.info("server_started", {
    port: config.port,
    environment: config.nodeEnv
  });
});
