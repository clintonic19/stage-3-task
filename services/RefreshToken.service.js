// auth/token.service.js
const RefreshToken = require("../models/RefreshToken.model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || "dev_secret";

exports.generateAccessToken =  (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret,
    { expiresIn: "15m" }
  );
}

exports.generateRefreshToken = async (user) => {
  const token = crypto.randomBytes(40).toString("hex");

  await RefreshToken.create({
    userId: user._id,
    token: token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return token;
}

exports.generateTokens= async(user) =>{
  return {
    accessToken: generateAccessToken(user),
    refreshToken: await generateRefreshToken(user),
  };
}
