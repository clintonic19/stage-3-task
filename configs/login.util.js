const readline = require("readline");
// const ora = require("ora");
// const chalk = require("chalk");

// const { loginRequest } = require("../services/auth");
// const { saveToken } = require("../config/store");
// const { loginRequest } = require("./auth.config");
// const { saveToken } = require("./store.config");

// function ask(question) {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   return new Promise((resolve) =>
//     rl.question(question, (ans) => {
//       rl.close();
//       resolve(ans);
//     })
//   );
// }

// module.exports = async () => {
//   try {
//     const email = await ask("Email: ");
//     const password = await ask("Password: ");

//     const spinner = ora("Logging in...").start();

//     const res = await loginRequest(email, password);

//     await saveToken(res.token);

//     spinner.succeed(chalk.green("Login successful!"));
//   } catch (err) {
  
//     console.error(chalk.red( "Login failed" ));
//   }
// };


// Refactored to use API client and handle GitHub OAuth login as well

//updated login code
const axios = require("axios");
const open = require("open").default;
const ora = require("ora").default;
const chalk = require("chalk");
// const storage = require("../utils/storage");
const storage = require("./store.config");

const API = "http://localhost:5001/api/auth";

module.exports = async () => {
try {
    console.log(chalk.blue("🔐 Starting GitHub login..."));

  const { data } = await axios.post(`${API}/device/code`);

  console.log("\n👉 Open this URL:");
  console.log(chalk.green(data.verification_uri));

  console.log("\n👉 Enter this code:");
  console.log(chalk.yellow.bold(data.user_code));

  await open(data.verification_uri);

  const spinner = ora("Waiting for authorization...").start();

  while (true) {
    await new Promise(r => setTimeout(r, data.interval * 1000));

    const res = await axios.post(`${API}/device/token`, {
      device_code: data.device_code
    });

    if (res.data.access_token) {
      spinner.succeed("✅ Login successful!");
      storage.save(res.data);
      return;
    }
   // after you receive access_token
    await open(process.env.WEB_PORTAL_URL + "dashboard");

    if (res.data.error === "authorization_pending") {
      spinner.text = "Waiting for authorization...";
    }
  }
} catch (error) {
    console.error(chalk.red("❌ Login failed:"), error.response?.data || error.message);
}
};