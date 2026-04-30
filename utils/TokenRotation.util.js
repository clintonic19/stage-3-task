const express = require("express");
const RefreshToken  = require("../models/RefreshToken.model");
const UserModel = require("../models/User.model");
const { generateAccessToken, generateRefreshToken, generateTokens } = require("../services/RefreshToken.service");

// exports.refreshToken = async (req, res) => {
//   const { refresh_token } = req.body;

//   const stored = await RefreshToken.findOne({ token: refresh_token });
  
//   if (!stored) return res.status(403).json({ 
//     status: false,
//     error: error.message
//      });

//   await RefreshTokenModel.deleteOne({ token: refresh_token });

//   const user = await UserModel.findById(stored.userId);

//   const newAccess = generateAccessToken(user);
//   const newRefresh = await generateRefreshToken(user);

//   res.json({
//     status: "success",
//     access_token: newAccess,
//     refresh_token: newRefresh
//   });
// };


// Rotate refresh token
exports.rotateRefreshToken = async(oldToken) => {
  try {
    const token = await RefreshToken.findOne({ token: oldToken, revoked: false });

    if (!token || token.expiresAt <= new Date()) {
      throw new Error("Invalid token");
    }

    token.revoked = true;
  
    await token.save();

    const user = await UserModel.findById(token.userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      access_token: generateAccessToken(user),
      refresh_token: await generateRefreshToken(user),
      user,
    };

  } catch (error) {
    throw new Error(error.message); 
  }
}
