// auth/oauth.service.js
const axios = require("axios");
import User from "../models/User.js";
import { generateTokens } from "./RefreshToken.service.js";

exports.handleGitHubCallback = async(code, codeVerifier) => {
  const tokenRes = await axios?.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
    },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = tokenRes.data.access_token;

  const userRes = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const githubUser = userRes.data;

  let user = await User.findOne({ githubId: githubUser.id });

  if (!user) {
    user = await User.create({
      githubId: githubUser.id,
      username: githubUser.login,
    });
  }

  return generateTokens(user);
}