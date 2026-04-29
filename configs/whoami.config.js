const api = require("./api.config");

module.exports = async () => {
  try {
    const res = await api.get("/user/me");

    console.log("\n👤 Logged in as:");
    console.log(`Username: ${res.data.username}`);
    console.log(`Role: ${res.data.role}`);

  } catch (err) {
    console.error("Not authenticated");
  }
};