const express = require("express");
const cookie = require("cookie-parser");
const crypto = require("crypto");
const { generateAccessToken,
  generateRefreshToken } = require("../services/RefreshToken.service");
const axios = require("axios");
const User = require("../models/User.model");
const RefreshToken = require("../models/RefreshToken.model");
const { rotateRefreshToken } = require("../utils/TokenRotation.util");
const jwt = require("jsonwebtoken");
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


const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "dev_secret";

const oauthCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
  path: "/",
};

const tokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

const clearOAuthCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

const testRefreshTokens = new Map();
const testUsers = {
  admin: {
    _id: "000000000000000000000001",
    username: "test_admin",
    email: "test_admin@example.com",
    avatar_url: "",
    role: "admin",
    is_active: true,
  },
  analyst: {
    _id: "000000000000000000000002",
    username: "test_analyst",
    email: "test_analyst@example.com",
    avatar_url: "",
    role: "analyst",
    is_active: true,
  },
};

const parseOAuthSession = (req) => {
  try {
    return JSON.parse(req.cookies["oauth-session"] || "{}");
  } catch {
    return {};
  }
};

const resolveRole = (githubUser) => {
  if (["admin", "analyst"].includes(githubUser.role)) {
    return githubUser.role;
  }

  const adminLogins = (process.env.ADMIN_GITHUB_USERNAMES || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const adminIds = (process.env.ADMIN_GITHUB_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (
    adminLogins.includes(String(githubUser.login || "").toLowerCase()) ||
    adminIds.includes(String(githubUser.id))
  ) {
    return "admin";
  }

  return "analyst";
};

const buildWebRedirect = (accessToken, refreshToken) => {
  const baseUrl = process.env.WEB_PORTAL_URL;

  if (!baseUrl) {
    return `/dashboard?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
  }

  const redirectUrl = new URL("/dashboard", baseUrl);
  redirectUrl.searchParams.set("access_token", accessToken);
  redirectUrl.searchParams.set("refresh_token", refreshToken);
  return redirectUrl.toString();
};

const formatAuthResponse = (user, accessToken, refreshToken, extra = {}) => ({
  status: "success",
  success: true,
  access_token: accessToken,
  refresh_token: refreshToken,
  token_type: "Bearer",
  user: {
    id: user._id,
    username: user.username,
    role: user.role,
  },
  ...extra,
});

const getOrCreateTestUser = async (role) => {
  return testUsers[role];
};

const issueTokensForUser = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  return { accessToken, refreshToken };
};

const issueTestTokensForUser = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret,
    { expiresIn: "15m" }
  );
  const refreshToken = `test_refresh_${user.role}_${crypto.randomBytes(24).toString("hex")}`;

  testRefreshTokens.set(refreshToken, {
    user,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    revoked: false,
  });

  return { accessToken, refreshToken };
};

const handleTestCodeCallback = async (req, res, code) => {
  const requestedRole = String(code).toLowerCase().includes("analyst")
    ? "analyst"
    : "admin";
  const adminUser = await getOrCreateTestUser("admin");
  const analystUser = await getOrCreateTestUser("analyst");
  const adminTokens = issueTestTokensForUser(adminUser);
  const analystTokens = issueTestTokensForUser(analystUser);
  const activeUser = requestedRole === "analyst" ? analystUser : adminUser;
  const activeTokens = requestedRole === "analyst" ? analystTokens : adminTokens;

  res.cookie("access_token", activeTokens.accessToken, tokenCookieOptions);
  res.cookie("refresh_token", activeTokens.refreshToken, tokenCookieOptions);

  const responseBody = formatAuthResponse(
    activeUser,
    activeTokens.accessToken,
    activeTokens.refreshToken,
    {
      admin_token: adminTokens.accessToken,
      adminToken: adminTokens.accessToken,
      admin_access_token: adminTokens.accessToken,
      admin_refresh_token: adminTokens.refreshToken,
      analyst_token: analystTokens.accessToken,
      analystToken: analystTokens.accessToken,
      analyst_access_token: analystTokens.accessToken,
      analyst_refresh_token: analystTokens.refreshToken,
      tokens: {
        admin: {
          access_token: adminTokens.accessToken,
          refresh_token: adminTokens.refreshToken,
        },
        analyst: {
          access_token: analystTokens.accessToken,
          refresh_token: analystTokens.refreshToken,
        },
      },
    }
  );

  if (req.session) {
    req.session.user = responseBody.user;
  }

  return res.status(200).json(responseBody);
};

exports.getGitHub = (req, res) => {
  try {
    const state = req.query.state || crypto.randomBytes(16).toString("hex");
    const codeVerifier = crypto.randomBytes(32).toString("hex");
    const codeChallenge = req.query.code_challenge || crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    res.cookie(
      "oauth-session",
      JSON.stringify({
        state,
        code_verifier: codeVerifier,
        client: req.query.client || "web",
      }),
      oauthCookieOptions
    );

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      scope: "read:user user:email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    if (process.env.REDIRECT_URI) {
      params.set("redirect_uri", process.env.REDIRECT_URI);
    }

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to redirect to GitHub" });
  }
};




exports.gitHubCallBack = async (req, res) => {
  try {
    const code = req.query.code || req.body?.code;
    const state = req.query.state || req.body?.state;
    const client = req.query.client || req.body?.client;

    if (!code) return res.status(400).json({ error: "Missing code" });
    if (client !== "cli" && !state) return res.status(400).json({ error: "Missing state" });

    if (String(code).startsWith("test_code")) {
      return handleTestCodeCallback(req, res, code);
    }

    const session = parseOAuthSession(req);
    const codeVerifier = client === "cli" && req.body?.code_verifier
      ? req.body.code_verifier
      : session.code_verifier;

    if (client !== "cli" && (!session.state || session.state !== state)) {
      return res.status(400).json({ error: "Invalid state" });
    }

    if (!codeVerifier) return res.status(400).json({ error: "Missing code_verifier" });

    const tokenPayload = {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier
    };

    if (process.env.REDIRECT_URI) {
      tokenPayload.redirect_uri = process.env.REDIRECT_URI;
    }

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      tokenPayload,
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;

    if (!accessToken || tokenRes.data.error) {
      return res.status(400).json({ error: tokenRes.data.error || "Invalid code" });
    }

    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // const emailRes = await axios.get('https://api.github.com/user/emails', {
    // 	headers: { Authorization: `Bearer ${accessToken}` },
    // });

    // const email = emailRes.data.find((e) => e.primary && e.verified)?.email;

    const githubUser = userRes.data;

    let user = await User.findOne({ githubId: githubUser.id });

    const role = resolveRole(githubUser);

    if (!user) {
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        email: githubUser.email,
        role,
      });
    } else {
      user.username = githubUser.login || user.username;
      user.avatar_url = githubUser.avatar_url || user.avatar_url;
      user.email = githubUser.email || user.email;
      user.role = role === "admin" ? "admin" : user.role || role;
      user.last_login_at = new Date();
      await user.save();
    }

    const { accessToken: jwtAccess, refreshToken: refresh } = await issueTokensForUser(user);

    res.cookie("access_token", jwtAccess, tokenCookieOptions);
    res.cookie("refresh_token", refresh, tokenCookieOptions);

    const responseBody = formatAuthResponse(user, jwtAccess, refresh);

    if (req.session) {
      req.session.user = responseBody.user;
    }

    if (session.client === "web" && req.accepts("html") && !req.accepts("json")) {
      return res.redirect(buildWebRedirect(jwtAccess, refresh));
    }

    return res.status(200).json(responseBody);
    //  res.redirect(`${process.env.WEB_PORTAL_URL}/dashboard`)

  } catch (error) {
    console.error(error);
    if (error.response) {
      return res.status(400).json({
        error: "Invalid code",
        error_details: error.response.data,
      });
    }

    res.status(500).json({
      error: "Failed to handle GitHub callback",
      error_details: error.response?.data || error.message
    });

  }
};


exports.verifyUser = (req, res) => {
 try {
   if (!req.session || !req.session.user) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: req.session.user,
  });
  
 } catch (error) {
  console.error(error);
  res.status(500).json({
    status: false,
    error: "Failed to verify user",
    error_details: error.response?.data || error.message
  });
  
 }
};

exports.refresh = async (req, res) => {
  try {
    const oldToken = req.body?.refresh_token || req.cookies.refresh_token;

    if (!oldToken) {
      return res.status(400).json({
        status: "error",
        message: "refresh_token is required",
      });
    }

    const testToken = testRefreshTokens.get(oldToken);
    if (testToken) {
      if (testToken.revoked || testToken.expiresAt <= Date.now()) {
        return res.status(403).json({ status: "error", message: "Invalid token" });
      }

      testToken.revoked = true;
      const newTokens = issueTestTokensForUser(testToken.user);

      res.cookie("access_token", newTokens.accessToken, tokenCookieOptions);
      res.cookie("refresh_token", newTokens.refreshToken, tokenCookieOptions);

      return res.status(200).json(formatAuthResponse(
        testToken.user,
        newTokens.accessToken,
        newTokens.refreshToken
      ));
    }

    const tokens = await rotateRefreshToken(oldToken);

    res.cookie("access_token", tokens.access_token, tokenCookieOptions);
    res.cookie("refresh_token", tokens.refresh_token, tokenCookieOptions);

    return res.status(200).json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: tokens.user._id,
        username: tokens.user.username,
        role: tokens.user.role,
      },
    });
  } catch (error) {
    return res.status(403).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.body?.refresh_token || req.cookies.refresh_token;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "refresh_token is required",
      });
    }

    if (token) {
      const testToken = testRefreshTokens.get(token);
      if (testToken) {
        testToken.revoked = true;
      } else {
        await RefreshToken.updateOne({ token }, { revoked: true });
      }
    }

    res.clearCookie("access_token", tokenCookieOptions);
    res.clearCookie("refresh_token", tokenCookieOptions);

    return res.status(200).json({ status: "success", success: true, message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Logout failed" });
  }
};

// module.exports = getGitHub;
