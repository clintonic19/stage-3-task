const fs = require("fs-extra");
const path = require("path");

const CONFIG_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE,
  ".insighta.json"
);

async function saveToken(token) {
  await fs.writeJson(CONFIG_PATH, { token });
}

async function getToken() {
  try {
    const data = await fs.readJson(CONFIG_PATH);
    return data.token;
  } catch {
    return null;
  }
}

async function clearToken() {
  await fs.remove(CONFIG_PATH);
}

module.exports = { saveToken, getToken, clearToken };