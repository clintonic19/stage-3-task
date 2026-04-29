// auth/token.service.js
const RefreshToken = require("../models/RefreshToken.model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

exports.generateAccessToken =  (user) => {
  return jwt.sign(
    {id: user._id, role: user.role},
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

exports.generateRefreshToken = async (user) => {
  const token = await crypto.randomBytes(40).toString("hex"); // Generate a random token string

  // Store in DB
  const result = await RefreshToken.create({
    user: user._id,
    token: token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  console.log(result);

  // await result.save();

  // return result; 
  return token;
}

exports.generateTokens= async(user) =>{
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}