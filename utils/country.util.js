const AFRICAN_COUNTRIES = [
  { code: "AO", name: "Angola", aliases: ["angola"] },
  { code: "BJ", name: "Benin", aliases: ["benin"] },
  { code: "BW", name: "Botswana", aliases: ["botswana"] },
  { code: "BF", name: "Burkina Faso", aliases: ["burkina faso"] },
  { code: "BI", name: "Burundi", aliases: ["burundi"] },
  { code: "CM", name: "Cameroon", aliases: ["cameroon"] },
  { code: "CV", name: "Cabo Verde", aliases: ["cabo verde", "cape verde"] },
  {
    code: "CF",
    name: "Central African Republic",
    aliases: ["central african republic"],
  },
  { code: "TD", name: "Chad", aliases: ["chad"] },
  { code: "KM", name: "Comoros", aliases: ["comoros"] },
  {
    code: "CG",
    name: "Congo",
    aliases: ["congo", "republic of the congo", "congo brazzaville"],
  },
  {
    code: "CD",
    name: "Democratic Republic of the Congo",
    aliases: [
      "democratic republic of the congo",
      "dr congo",
      "drc",
      "congo kinshasa",
    ],
  },
  {
    code: "CI",
    name: "Cote d'Ivoire",
    aliases: ["cote d'ivoire", "cote divoire", "ivory coast"],
  },
  { code: "DJ", name: "Djibouti", aliases: ["djibouti"] },
  { code: "EG", name: "Egypt", aliases: ["egypt"] },
  { code: "GQ", name: "Equatorial Guinea", aliases: ["equatorial guinea"] },
  { code: "ER", name: "Eritrea", aliases: ["eritrea"] },
  { code: "SZ", name: "Eswatini", aliases: ["eswatini", "swaziland"] },
  { code: "ET", name: "Ethiopia", aliases: ["ethiopia"] },
  { code: "GA", name: "Gabon", aliases: ["gabon"] },
  { code: "GM", name: "Gambia", aliases: ["gambia", "the gambia"] },
  { code: "GH", name: "Ghana", aliases: ["ghana"] },
  { code: "GN", name: "Guinea", aliases: ["guinea"] },
  { code: "GW", name: "Guinea-Bissau", aliases: ["guinea-bissau", "guinea bissau"] },
  { code: "KE", name: "Kenya", aliases: ["kenya"] },
  { code: "LS", name: "Lesotho", aliases: ["lesotho"] },
  { code: "LR", name: "Liberia", aliases: ["liberia"] },
  { code: "LY", name: "Libya", aliases: ["libya"] },
  { code: "MG", name: "Madagascar", aliases: ["madagascar"] },
  { code: "MW", name: "Malawi", aliases: ["malawi"] },
  { code: "ML", name: "Mali", aliases: ["mali"] },
  { code: "MR", name: "Mauritania", aliases: ["mauritania"] },
  { code: "MU", name: "Mauritius", aliases: ["mauritius"] },
  { code: "MA", name: "Morocco", aliases: ["morocco"] },
  { code: "MZ", name: "Mozambique", aliases: ["mozambique"] },
  { code: "NA", name: "Namibia", aliases: ["namibia"] },
  { code: "NE", name: "Niger", aliases: ["niger"] },
  { code: "NG", name: "Nigeria", aliases: ["nigeria"] },
  { code: "RW", name: "Rwanda", aliases: ["rwanda"] },
  {
    code: "ST",
    name: "Sao Tome and Principe",
    aliases: ["sao tome and principe", "sao tome", "sao tome & principe"],
  },
  { code: "SN", name: "Senegal", aliases: ["senegal"] },
  { code: "SC", name: "Seychelles", aliases: ["seychelles"] },
  { code: "SL", name: "Sierra Leone", aliases: ["sierra leone"] },
  { code: "SO", name: "Somalia", aliases: ["somalia"] },
  { code: "ZA", name: "South Africa", aliases: ["south africa"] },
  { code: "SS", name: "South Sudan", aliases: ["south sudan"] },
  { code: "SD", name: "Sudan", aliases: ["sudan"] },
  { code: "TZ", name: "Tanzania", aliases: ["tanzania"] },
  { code: "TG", name: "Togo", aliases: ["togo"] },
  { code: "TN", name: "Tunisia", aliases: ["tunisia"] },
  { code: "UG", name: "Uganda", aliases: ["uganda"] },
  { code: "ZM", name: "Zambia", aliases: ["zambia"] },
  { code: "ZW", name: "Zimbabwe", aliases: ["zimbabwe"] },
];

const countryAliasMap = new Map();
const countryCodeMap = new Map();

for (const country of AFRICAN_COUNTRIES) {
  countryCodeMap.set(country.code, country.name);

  for (const alias of country.aliases) {
    countryAliasMap.set(alias, country.code);
  }
}

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveCountryCode = (input) => {
  if (!input || typeof input !== "string") {
    return null;
  }

  const normalized = input.trim().toLowerCase();

  if (countryAliasMap.has(normalized)) {
    return countryAliasMap.get(normalized);
  }

  const compact = normalized.replace(/\s+/g, " ");

  for (const alias of countryAliasMap.keys()) {
    const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i");
    if (pattern.test(compact)) {
      return countryAliasMap.get(alias);
    }
  }

  return null;
};

const getCountryNameByCode = (code) => {
  if (!code || typeof code !== "string") {
    return null;
  }

  return countryCodeMap.get(code.trim().toUpperCase()) || null;
};

module.exports = {
  AFRICAN_COUNTRIES,
  getCountryNameByCode,
  resolveCountryCode,
};
