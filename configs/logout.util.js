// const { clearToken } = require("../config/store");
const { clearToken } = require("./store.config");

module.exports = async () => {
  await clearToken();
  console.log("Logged out successfully");
};