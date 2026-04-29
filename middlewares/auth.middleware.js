const express = require("express");
const jwt = require("jsonwebtoken");


exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ 
    status: false,
    message: "Unauthorized"
  });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch {

    return res.status(401).json({ 
      status: false,
      message: "Invalid token"
    });  
  }
}