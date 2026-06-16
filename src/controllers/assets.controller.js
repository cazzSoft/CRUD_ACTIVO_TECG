const { randomUUID } = require("crypto");
const { db } = require("../db");
const { logger } = require("../logger");

const listAssetsStmt = db.prepare(`
  SELECT id, name, category, serialNumber, status, location, purchaseDate, createdAt, updatedAt
  FROM assets
  ORDER BY createdAt DESC
`);

const findAssetStmt = db.prepare(`
  SELECT id, name, category, serialNumber, status, location, purchaseDate, createdAt, updatedAt
  FROM assets
  WHERE id = ?
`);

const createAssetStmt = db.prepare(`
  INSERT INTO assets (
    id, name, category, serialNumber, status, location, purchaseDate, createdAt, updatedAt
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateAssetStmt = db.prepare(`
  UPDATE assets
  SET name = ?,
      category = ?,
      serialNumber = ?,
      status = ?,
      location = ?,
      purchaseDate = ?,
      updatedAt = ?
  WHERE id = ?
`);

const deleteAssetStmt = db.prepare("DELETE FROM assets WHERE id = ?");

const logEvent = (event, meta) => {
  logger.info(event, {
    resourceId: meta.resourceId,
    method: meta.method,
    path: meta.path,
    statusCode: meta.statusCode
  });
};

const listAssets = (meta) => {
  const assets = listAssetsStmt.all();
  logEvent("assets_listed", { ...meta, statusCode: 200 });
  return { statusCode: 200, body: { data: assets } };
};

const getAssetById = (id, meta) => {
  const asset = findAssetStmt.get(id);

  if (!asset) {
    return { statusCode: 404, body: { error: "Asset not found" } };
  }

  logEvent("asset_read", { ...meta, resourceId: id, statusCode: 200 });
  return { statusCode: 200, body: { data: asset } };
};

const createAsset = (body, meta) => {
  const now = new Date().toISOString();
  const id = randomUUID();
  const asset = {
    id,
    ...body,
    createdAt: now,
    updatedAt: now
  };

  try {
    createAssetStmt.run(
      asset.id,
      asset.name,
      asset.category,
      asset.serialNumber,
      asset.status,
      asset.location,
      asset.purchaseDate,
      asset.createdAt,
      asset.updatedAt
    );
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { statusCode: 409, body: { error: "Asset serial number already exists" } };
    }
    throw err;
  }

  logEvent("asset_created", { ...meta, resourceId: id, statusCode: 201 });
  return { statusCode: 201, body: { data: asset } };
};

const updateAsset = (id, body, meta) => {
  const existingAsset = findAssetStmt.get(id);

  if (!existingAsset) {
    return { statusCode: 404, body: { error: "Asset not found" } };
  }

  try {
    updateAssetStmt.run(
      body.name,
      body.category,
      body.serialNumber,
      body.status,
      body.location,
      body.purchaseDate,
      new Date().toISOString(),
      id
    );
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { statusCode: 409, body: { error: "Asset serial number already exists" } };
    }
    throw err;
  }

  logEvent("asset_updated", { ...meta, resourceId: id, statusCode: 200 });
  return { statusCode: 200, body: { data: findAssetStmt.get(id) } };
};

const deleteAsset = (id, meta) => {
  const existingAsset = findAssetStmt.get(id);

  if (!existingAsset) {
    return { statusCode: 404, body: { error: "Asset not found" } };
  }

  deleteAssetStmt.run(id);
  logEvent("asset_deleted", { ...meta, resourceId: id, statusCode: 204 });
  return { statusCode: 204, body: null };
};

module.exports = {
  createAsset,
  deleteAsset,
  getAssetById,
  listAssets,
  updateAsset
};
