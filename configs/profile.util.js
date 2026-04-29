// const api = require("../services/api");
const api = require("./api.config");
const ora = require("ora");
const chalk = require("chalk");

module.exports = async (action, query) => {
  try {
    const spinner = ora("Fetching...").start();

    if (action === "list") {
      const res = await api.get("/profiles");
      spinner.stop();

      console.table(res.data);
    }

    if (action === "search") {
      const res = await api.get(`/profiles/search?q=${query}`);
      spinner.stop();

      console.table(res.data);
    }
  } catch (err) {
    console.error(chalk.red("Error fetching profiles"));
  }
};