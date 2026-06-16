const categories = [
  "laptop",
  "desktop",
  "monitor",
  "printer",
  "router",
  "projector",
  "other"
];

const statuses = ["available", "assigned", "maintenance", "retired"];

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hasInvalidTextCharacters = (value) => /[<>]/.test(value);

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

const validateUuid = (id) => uuidRegex.test(id);

const validateAssetBody = (body) => {
  const errors = [];
  const allowedFields = [
    "name",
    "category",
    "serialNumber",
    "status",
    "location",
    "purchaseDate"
  ];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      errors: [{ field: "body", message: "Request body must be a JSON object" }]
    };
  }

  for (const field of Object.keys(body)) {
    if (!allowedFields.includes(field)) {
      errors.push({ field, message: "Field is not allowed" });
    }
  }

  const name = typeof body.name === "string" ? body.name.trim() : body.name;
  if (typeof name !== "string" || name.length < 3 || name.length > 100) {
    errors.push({ field: "name", message: "name must be a string from 3 to 100 characters" });
  } else if (hasInvalidTextCharacters(name)) {
    errors.push({ field: "name", message: "name contains invalid characters" });
  }

  if (!categories.includes(body.category)) {
    errors.push({ field: "category", message: "category has an invalid value" });
  }

  const serialNumber =
    typeof body.serialNumber === "string" ? body.serialNumber.trim() : body.serialNumber;
  if (
    typeof serialNumber !== "string" ||
    serialNumber.length < 5 ||
    serialNumber.length > 50 ||
    !/^[A-Za-z0-9-]+$/.test(serialNumber)
  ) {
    errors.push({
      field: "serialNumber",
      message: "serialNumber must contain 5 to 50 letters, numbers or hyphens"
    });
  }

  if (!statuses.includes(body.status)) {
    errors.push({ field: "status", message: "status has an invalid value" });
  }

  const location = typeof body.location === "string" ? body.location.trim() : body.location;
  if (typeof location !== "string" || location.length < 3 || location.length > 80) {
    errors.push({
      field: "location",
      message: "location must be a string from 3 to 80 characters"
    });
  } else if (hasInvalidTextCharacters(location)) {
    errors.push({ field: "location", message: "location contains invalid characters" });
  }

  if (typeof body.purchaseDate !== "string" || !isValidDate(body.purchaseDate)) {
    errors.push({
      field: "purchaseDate",
      message: "purchaseDate must be a valid date using YYYY-MM-DD"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      name,
      category: body.category,
      serialNumber,
      status: body.status,
      location,
      purchaseDate: body.purchaseDate
    }
  };
};

module.exports = {
  categories,
  statuses,
  validateAssetBody,
  validateUuid
};
