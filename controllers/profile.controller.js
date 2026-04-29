const mongoose = require("mongoose");
const Profile = require("../models/profile.model");
const { buildQuery } = require("../services/QueryBuilder.services");
const { parseQuery } = require("../services/LanguageParser.services");
const { getPagination } = require("../utils/Pagination.utils");
const { getSortOptions } = require("../utils/Sorting");
const { getAgeGroup } = require("../utils/age.util");
const { getCountryNameByCode } = require("../utils/country.util");
const { createUuidV7 } = require("../utils/uuid.util");
const {
  getGender,
  getAge,
  getNationality,
} = require("../services/externalApi.services");

// Note: The following code is designed to be robust and handle various edge cases gracefully.
// It includes comprehensive error handling, input validation, 
// and standardized responses to ensure a reliable and user-friendly API experience.
const PROFILE_FIELDS =
  "id name gender gender_probability age age_group country_id country_name country_probability created_at";

  // Helper function to send standardized error responses
const errorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({
    status: "error",
    message,
  });

  // Helper function to extract the value from a Promise.allSettled result,
  // returning null if the promise was rejected or did not return a valid value.
const settledValue = (result) =>
  result && result.status === "fulfilled" ? result.value : null;

// Helper function to pick the country with the highest probability
// from the list of countries returned by the API. 
// This ensures the use of most likely country for the profile.
const pickTopCountry = (countries) => {
  if (!Array.isArray(countries) || countries.length === 0) {
    return null;
  }

  return countries.reduce((best, current) => {
    if (!best) {
      return current;
    }

    return (current?.probability ?? 0) > (best?.probability ?? 0) ? current : best;
  }, null);
};

// Helper function to check if a token exists in the input string using
//  a regex pattern
const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper function to find a profile by name, case-insensitive, and 
// ignoring leading/trailing whitespace
const findProfileByName = (name) =>
  Profile.findOne({
    name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
  })
    .select(PROFILE_FIELDS)
    .collation({ locale: "en", strength: 2 });

    // Build a query to find a profile by either 'id' or '_id'. 
    // This allows for flexible identification using either the custom,
    //  'id' field or the default MongoDB '_id'.
const buildProfileIdentifierQuery = (value) => {
  const query = [{ id: value }];

  if (mongoose.Types.ObjectId.isValid(value)) {
    query.push({ _id: value });
  }

  return { $or: query };
};

// Helper function to list profiles based on filters and options, 
// used by both getProfiles and searchProfiles
const listProfiles = async (res, filters, options = {}) => {
  const { page, limit, skip } = getPagination(options.page, options.limit);
  const sort = getSortOptions(options.sort_by, options.order);

  const [data, total] = await Promise.all([
    Profile.find(filters)
      .select(PROFILE_FIELDS)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Profile.countDocuments(filters),
  ]);

  return res.status(200).json({
    status: "success",
    page,
    limit,
    total,
    data,
  });
};

exports.getProfiles = async (req, res, next) => {
  try {
    const filters = buildQuery(req.query);

    return await listProfiles(res, filters, req.query);
  } catch (error) {
    return next(error);
  }
};

exports.searchProfiles = async (req, res, next) => {
  try {
    const parsedQuery = parseQuery(req.query.q);

    if (!parsedQuery) {
      return errorResponse(res, 400, "Unable to interpret query");
    }

    const filters = buildQuery(parsedQuery);
    return await listProfiles(res, filters, req.query);
  } catch (error) {
    return next(error);
  }
};

exports.createProfile = async (req, res, next) => {
  try {
    const rawName = req.body?.name;

    if (rawName === undefined || rawName === null || String(rawName).trim() === "") {
      return errorResponse(res, 400, "Missing or empty parameter");
    }

    if (typeof rawName !== "string") {
      return errorResponse(res, 422, "Invalid parameter type");
    }

    const name = rawName.trim();
    const existingProfile = await findProfileByName(name);

    if (existingProfile) {
      return res.status(200).json({
        status: "success",
        data: existingProfile.toJSON ? existingProfile.toJSON() : existingProfile,
      });
    }

    const [genderResult, ageResult, nationalityResult] = await Promise.allSettled([
      getGender(name),
      getAge(name),
      getNationality(name),
    ]);

    const gender = settledValue(genderResult);
    const age = settledValue(ageResult);
    const nationality = settledValue(nationalityResult);
    const topCountry = pickTopCountry(nationality?.country);
    const ageValue = Number.isInteger(age?.age) ? age.age : null;
    const countryCode =
      typeof topCountry?.country_id === "string" ? topCountry.country_id.toUpperCase() : null;

    const profile = await Profile.create({
      id: createUuidV7(),
      name,
      gender: typeof gender?.gender === "string" ? gender.gender.toLowerCase() : null,
      gender_probability:
        typeof gender?.probability === "number" ? gender.probability : null,
      age: ageValue,
      age_group: ageValue === null ? null : getAgeGroup(ageValue),
      country_id: countryCode,
      country_name: getCountryNameByCode(countryCode),
      country_probability:
        typeof topCountry?.probability === "number" ? topCountry.probability : null,
    });

    return res.status(201).json({
      status: "success",
      data: profile.toJSON(),
    });
  } catch (error) {
    if (error?.code === 11000 && req.body?.name) {
      try {
        const duplicateProfile = await findProfileByName(String(req.body.name).trim());
        if (duplicateProfile) {
          return res.status(200).json({
            status: "success",
            data: duplicateProfile.toJSON
              ? duplicateProfile.toJSON()
              : duplicateProfile,
          });
        }
      } catch (lookupError) {
        return next(lookupError);
      }
    }

    return next(error);
  }
};

exports.getProfileById = async (req, res, next) => {
  try {
    const profile = await Profile.findOne(buildProfileIdentifierQuery(req.params.id))
      .select(PROFILE_FIELDS)
      .lean();

    if (!profile) {
      return errorResponse(res, 404, "Profile not found");
    }

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndDelete(
      buildProfileIdentifierQuery(req.params.id)
    );

    if (!profile) {
      return errorResponse(res, 404, "Profile not found");
    }

    return res.status(200).json({
      status: "success",
      message: "Profile deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};
