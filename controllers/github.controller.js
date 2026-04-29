const express = require("express");
const { generateAccessToken,
  generateRefreshToken } = require("../services/RefreshToken.service");
const axios = require("axios");
const User = require("../models/User.model");
const { generateCodeVerifier, generateCodeChallenge } = require("../utils/Pkce.util");

// const getGitHub = (req, res) => {
//     const { state, code_challenge } = req.query;

//   const githubUrl = `https://github.com/login/oauth/authorize
//   ?client_id=${process.env.GITHUB_CLIENT_ID}
//   &redirect_uri=${process.env.REDIRECT_URI}
//   &state=${state}
//   &code_challenge=${code_challenge}
//   &code_challenge_method=S256`;

//   res.redirect(githubUrl);
// };

// exports.get = (_req, res) => {
// 	const redirectUri = 'http://localhost:4001/auth/github/callback';
// 	const clientId = process.env.GITHUB_CLIENT_ID;

// 	const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;

// 	res.redirect(url);
// };


exports.getGitHub = (req, res) => {
  try {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    if (!req.session) {
      throw new Error("Session middleware not configured");
    }
    // store verifier temporarily (Redis or memory for now)
    req.session.code_verifier = verifier;

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      code_challenge: challenge,
      code_challenge_method: "S256"
    });

    const githubUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    // const githubUrl = `https://github.com/login/oauth/authorize
    // ?client_id=${process.env.GITHUB_CLIENT_ID}
    // &code_challenge=${challenge}&code_challenge_method=S256`;

    res.redirect(githubUrl);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to redirect to GitHub" });
  }
};




exports.gitHubCallBack = async (req, res) => {
  try {
    //  const { code } = req.query;
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    if (!req.session?.code_verifier) {
      return res.status(400).json({ error: "Missing code_verifier" });
    }

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        code_verifier: req.session.code_verifier
      },
      { headers: { Accept: "application/json" } }
    );
    console.log("VERIFIER:", req.session.code_verifier);
    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // const emailRes = await axios.get('https://api.github.com/user/emails', {
    // 	headers: { Authorization: `Bearer ${accessToken}` },
    // });

    // const email = emailRes.data.find((e) => e.primary && e.verified)?.email;

    const githubUser = userRes.data;

    let user = await User.findOne({ githubId: githubUser.id });

    if (!user) {
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        provider: "github"
      });
    }
    console.log("Authenticated user:", user);

    // Issue tokens
    const jwtAccess = generateAccessToken(user);
    const refresh = await generateRefreshToken(user);

    // res.json({ access_token: jwtAccess, refresh_token: refresh });
    res.redirect(`${process.env.WEB_PORTAL_URL}dashboard`)

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to handle GitHub callback",
      error_details: error.response?.data || error.message
    });

  }
};

// module.exports = getGitHub;