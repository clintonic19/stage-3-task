#!/usr/bin/env node

const { Command } = require("commander");

const login = require("./configs/login.util");
const logout = require("./configs/logout.util");
const profiles = require("./configs/profile.util");
const whoami = require("./configs/whoami.config");

const program = new Command();

program
  .name("insighta")
  .description("Insighta CLI")
  .version("1.0.0");

program
  .command("login")
  .description("Login to Insighta")
  .action(login);

program
  .command("whoami")
  .description("Show current logged in user")
  .action(whoami);

program
  .command("logout")
  .description("Logout")
  .action(logout);

program
  .command("profiles")
  .description("Manage profiles")
  .argument("<action>", "list | search")
  .argument("[query]")
  .action(profiles);

program.parse(process.argv);