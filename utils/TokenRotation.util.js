const express = require("express");
const RefreshToken  = require("../models/RefreshToken.model");
const { default: UserModel } = require("../models/User.model");
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
    // Find the token in the database
    const token = await RefreshToken.findOne({ token: oldToken, revoked: false });

  if (!token) throw new Error("Invalid token");

  token.revoked = true;
  
  await token.save(); // Mark the old token as revoked

  // Generate new access and refresh tokens for the user associated with the old token
  return generateTokens(token.user); 

  } catch (error) {
    throw new Error(error.message);
  
    throw new Error(error.message);  
    res.status(403).json({ 
      status: false,
      error: error.message
    });
  }
}