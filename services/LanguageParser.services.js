const { resolveCountryCode } = require("../utils/country.util");

const hasToken = (value, pattern) => pattern.test(value);

exports.parseQuery = (q) => {
  if (typeof q !== "string" || q.trim().length === 0) {
    return null;
  }

  const query = {};
  const lower = q.trim().toLowerCase().replace(/\s+/g, " ");

  // Gender-related tokens
  // If "male" or "female" is mentioned, set the gender filter accordingly. 
  // If both are mentioned, don't filter by gender 
  // since the user might be referring to a mixed group.
  const hasMale = hasToken(lower, /\bmales?\b/); 
  const hasFemale = hasToken(lower, /\bfemales?\b/);

  // If both "male" and "female" are mentioned, don't filter by gender.
  //  If only one is mentioned,  filter by that gender.
  if (hasMale && !hasFemale) {
    query.gender = "male";
  } else if (hasFemale && !hasMale) {
    query.gender = "female";
  }

  // Age-related tokens
  // If "young" is mentioned, set an age range of 16-24. This is a common definition for "young" in demographic contexts.
  if (hasToken(lower, /\byoung\b/)) {
    query.min_age = 16;
    query.max_age = 24;
  }

  // If "old" is mentioned, set a minimum age of 60. 
  // This is a common threshold for "old" in demographic contexts.
  // If "old" is mentioned, set a minimum age of 60. 
  // This is a common threshold for "old" in demographic contexts.
  if (hasToken(lower, /\bchild(?:ren)?\b/)) {
    query.age_group = "child";
  } else if (hasToken(lower, /\bteen(?:ager)?s?\b/)) {
    query.age_group = "teenager";
  } else if (hasToken(lower, /\badults?\b/)) {
    query.age_group = "adult";
  } else if (hasToken(lower, /\bseniors?\b/)) {
    query.age_group = "senior";
  }

  // If "above", "over", "older than", or "at least" is mentioned followed by a number, 
  // set the minimum age accordingly.
  const aboveMatch = lower.match(/\b(?:above|over|older than|at least)\s+(\d+)\b/);
  if (aboveMatch) {
    query.min_age = Number(aboveMatch[1]);
  }

  // If "below", "under", "younger than", or "at most" is mentioned followed by a number, 
  // set the maximum age accordingly.
  const belowMatch = lower.match(/\b(?:below|under|younger than|at most)\s+(\d+)\b/);
  if (belowMatch) {
    query.max_age = Number(belowMatch[1]);
  }
// Country-related tokens
  // If a country name is mentioned, attempt
  //  to resolve it to a country code and set the country_id filter.
  const countryId = resolveCountryCode(lower);
  if (countryId) {
    query.country_id = countryId;
  }

  return Object.keys(query).length > 0 ? query : null; // Return null if no valid filters were extracted
};
