const express = require("express");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || "dev_secret";


exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.access_token;

  if (!token) return res.status(401).json({ 
    status: false,
    message: "Unauthorized"
  });

  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;

    next();

  } catch {

    return res.status(401).json({ 
      status: false,
      message: "Invalid token"
    });  
  }
}
