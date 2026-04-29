require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const connectDB = require("./db");
const Profile = require("../models/profile.model");
const { getAgeGroup } = require("../utils/age.util");
const { getCountryNameByCode } = require("../utils/country.util");
const { createUuidV7, isUuidV7 } = require("../utils/uuid.util");

const DEFAULT_SEED_FILE = path.join(__dirname, "seeds", "seed_profiles.json");

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseCsv = (content) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = values[index];
      return record;
    }, {});
  });
};

const loadSeedContent = async () => {
  if (process.env.PROFILE_SEED_URL) {
    const response = await axios.get(process.env.PROFILE_SEED_URL, {
      responseType: "text",
    });

    return {
      content: response.data,
      source:
        process.env.PROFILE_SEED_URL.toLowerCase().endsWith(".csv") ? "csv" : "json",
    };
  }

  const seedFile = process.env.PROFILE_SEED_FILE || DEFAULT_SEED_FILE;

  if (!fs.existsSync(seedFile)) {
    throw new Error(
      `Seed file not found. Expected ${seedFile} or set PROFILE_SEED_FILE / PROFILE_SEED_URL.`
    );
  }

  return {
    content: fs.readFileSync(seedFile, "utf8"),
    source: seedFile.toLowerCase().endsWith(".csv") ? "csv" : "json",
  };
};

const toProfiles = (records) =>
  records
    .map((record) => {
      const age = toNumberOrNull(record.age);
      const countryId = normalizeString(record.country_id)?.toUpperCase() || null;
      const normalized = {
        id: isUuidV7(record.id) ? record.id : createUuidV7(),
        name: normalizeString(record.name),
        gender: normalizeString(record.gender)?.toLowerCase() || null,
        gender_probability: toNumberOrNull(record.gender_probability),
        age,
        age_group:
          normalizeString(record.age_group)?.toLowerCase() ||
          (age === null ? null : getAgeGroup(age)),
        country_id: countryId,
        country_name: normalizeString(record.country_name) || getCountryNameByCode(countryId),
        country_probability: toNumberOrNull(record.country_probability),
        created_at: normalizeString(record.created_at) || new Date().toISOString(),
      };

      return normalized;
    })
    .filter((record) => record.name);

const loadRecords = async () => {
  const { content, source } = await loadSeedContent();

  if (source === "csv") {
    return parseCsv(content);
  }

  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.data || [];
};

const run = async () => {
  await connectDB();

  const records = await loadRecords();
  const profiles = toProfiles(records);

  if (profiles.length === 0) {
    console.log("No profiles found in seed source.");
    process.exit(0);
  }

  const operations = profiles.map((profile) => ({
    updateOne: {
      filter: { name: profile.name },
      update: { $set: profile, $setOnInsert: { id: profile.id } },
      upsert: true,
      collation: { locale: "en", strength: 2 },
    },
  }));

  const result = await Profile.bulkWrite(operations, { ordered: false });

  console.log(
    JSON.stringify(
      {
        status: "success",
        processed: profiles.length,
        upserted: result.upsertedCount || 0,
        modified: result.modifiedCount || 0,
        matched: result.matchedCount || 0,
      },
      null,
      2
    )
  );

  process.exit(0);
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "error",
        message: error.message,
      },
      null,
      2
    )
  );

  process.exit(1);
});
