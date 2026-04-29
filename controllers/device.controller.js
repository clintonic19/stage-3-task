const axios = require("axios");
const User = require("../models/User.model");
const { generateAccessToken, 
  generateRefreshToken } = require("../services/RefreshToken.service");

// ===============================
// 🔹 1. Get Device Code
// ===============================
exports.getDeviceCode = async (req, res) => {
  try {
    const response = await axios.post(
      "https://github.com/login/device/code",
      new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        scope: "read:user user:email"
      }),
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    // GitHub returns:
    // device_code, user_code, verification_uri, expires_in, interval

    return res.json(response.data);

  } catch (error) {
    console.error("❌ DEVICE CODE ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      error: "Failed to get device code",
      details: error.response?.data || error.message
    });
  }
};



// ===============================
// 🔹 2. Poll Device Token
// ===============================
exports.pollDeviceToken = async (req, res) => {
  try {
    const { device_code } = req.body;

    if (!device_code) {
      return res.status(400).json({
        error: "device_code is required"
      });
    }

    const tokenRes = await axios.post(

      "https://github.com/login/oauth/access_token",

      new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code"
      }),
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = tokenRes.data;

    // ===============================
    // 🔁 Handle polling states
    // ===============================

    if (data.error === "authorization_pending") {
      return res.json({ error: "authorization_pending" });
    }

    if (data.error === "slow_down") {
      return res.json({ error: "slow_down" });
    }

    if (data.error === "access_denied") {
      return res.status(403).json({
        error: "User denied access"
      });
    }

    if (data.error === "expired_token") {
      return res.status(400).json({
        error: "Device code expired"
      });
    }

    // ===============================
    // ✅ Success: we got access token
    // ===============================

    const accessToken = data.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: "No access token returned",
        details: data
      });
    }

    // ===============================
    // 🔹 Fetch GitHub user
    // ===============================

    const userRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const githubUser = userRes.data;

    // ===============================
    // 🔹 Fetch email (important)
    // ===============================

    let email = githubUser.email;

    if (!email) {
      const emailRes = await axios.get("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      email = emailRes.data.find(e => e.primary && e.verified)?.email || null;
    }

    // ===============================
    // 🔹 Create / Find user
    // ===============================

    let user = await User.findOne({ githubId: githubUser.id });

    if (!user) {
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        email,
        provider: "github"
      });
    }

    // ===============================
    // 🔐 Issue tokens
    // ===============================

    const jwtAccess = generateAccessToken(user);
    const refresh = await generateRefreshToken(user);

    return res.json({
      success: true,
      access_token: jwtAccess,
      refresh_token: refresh
    });

  } catch (error) {
    console.error("❌ DEVICE TOKEN ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Device authentication failed",
      details: error.response?.data || error.message
    });
  }
};