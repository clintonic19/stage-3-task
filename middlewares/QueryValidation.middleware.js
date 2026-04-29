const FILTER_KEYS = new Set([
  "gender",
  "age_group",
  "country_id",
  "min_age",
  "max_age",
  "min_gender_probability",
  "min_country_probability",
  "sort_by",
  "order",
  "page",
  "limit",
]);

const SEARCH_KEYS = new Set(["q", "page", "limit"]); // Only 'q', 'page', and 'limit' are allowed for search
const GENDERS = new Set(["male", "female"]); // Allowed genders
const AGE_GROUPS = new Set(["child", "teenager", "adult", "senior"]); // Allowed age groups
const SORT_FIELDS = new Set(["age", "created_at", "gender_probability"]); // Allowed sort fields
const SORT_ORDERS = new Set(["asc", "desc"]); // Allowed sort orders

const errorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({
    status: "error",
    message,
  });

  // Helper function to check if a value is empty (undefined, null, or empty string)
const isEmptyValue = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const toNumber = (value) => Number(value); // Convert to number, will return NaN for invalid inputs

exports.validateQuery = (req, res, next) => {
  const isSearchRoute = req.path === "/profiles/search"; // Determine if the current route is the search route
  const allowedKeys = isSearchRoute ? SEARCH_KEYS : FILTER_KEYS; // Determine allowed keys based on the route

  // Validate that all query parameters are allowed and not empty
  for (const [key, value] of Object.entries(req.query)) {
    if (!allowedKeys.has(key)) {
      return errorResponse(res, 422, "Invalid query parameters");
    }

    // Check for empty values only for the 'q' parameter in search route, and for all parameters in filter route
    if (isEmptyValue(value)) {
      return errorResponse(
        res,
        key === "q" ? 400 : 422,
        key === "q" ? "Missing or empty parameter" : "Invalid query parameters"
      );
    }
  }

  if (isSearchRoute) {
    if (isEmptyValue(req.query.q)) {
      return errorResponse(res, 400, "Missing or empty parameter");
    }

    if (req.query.page !== undefined && !Number.isInteger(toNumber(req.query.page))) {
      return errorResponse(res, 422, "Invalid query parameters");
    }

    if (req.query.limit !== undefined && !Number.isInteger(toNumber(req.query.limit))) {
      return errorResponse(res, 422, "Invalid query parameters");
    }

    if (
      (req.query.page !== undefined && toNumber(req.query.page) < 1) ||
      (req.query.limit !== undefined &&
        (toNumber(req.query.limit) < 1 || toNumber(req.query.limit) > 50))
    ) {
      return errorResponse(res, 422, "Invalid query parameters");
    }

    return next();
  }

  if (req.query.gender && !GENDERS.has(String(req.query.gender).trim().toLowerCase())) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  if (
    req.query.age_group &&
    !AGE_GROUPS.has(String(req.query.age_group).trim().toLowerCase())
  ) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  if (
    req.query.country_id &&
    !/^[A-Za-z]{2}$/.test(String(req.query.country_id).trim())
  ) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  if (
    req.query.sort_by &&
    !SORT_FIELDS.has(String(req.query.sort_by).trim())
  ) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  if (req.query.order && !SORT_ORDERS.has(String(req.query.order).trim().toLowerCase())) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  
  const numericKeys = [
    "min_age",
    "max_age",
    "min_gender_probability",
    "min_country_probability",
    "page",
    "limit",
  ];
// Validate numeric parameters
  for (const key of numericKeys) {
    if (req.query[key] === undefined) {
      continue;
    }

    const parsed = toNumber(req.query[key]);

    if (!Number.isFinite(parsed)) {
      return errorResponse(res, 422, "Invalid query parameters");
    }

    if (["min_age", "max_age", "page", "limit"].includes(key) && !Number.isInteger(parsed)) {
      return errorResponse(res, 422, "Invalid query parameters");
    }
  }

  if (
    (req.query.page !== undefined && toNumber(req.query.page) < 1) ||
    (req.query.limit !== undefined &&
      (toNumber(req.query.limit) < 1 || toNumber(req.query.limit) > 50))
  ) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  /// Validate probability parameters
  if (
    (req.query.min_gender_probability !== undefined &&
      (toNumber(req.query.min_gender_probability) < 0 ||
        toNumber(req.query.min_gender_probability) > 1)) ||
    (req.query.min_country_probability !== undefined &&
      (toNumber(req.query.min_country_probability) < 0 ||
        toNumber(req.query.min_country_probability) > 1))
  ) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  if (
    req.query.min_age !== undefined && // Validate that min_age is not greater than max_age
    req.query.max_age !== undefined &&
    toNumber(req.query.min_age) > toNumber(req.query.max_age)
  ) {
    return errorResponse(res, 422, "Invalid query parameters");
  }

  return next();
};
