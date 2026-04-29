const express = require("express");
const router = express.Router();

const {
  getDeviceCode,
  pollDeviceToken
} = require("../controllers/device.controller");

router.post("/device/code", getDeviceCode);
router.post("/device/token", pollDeviceToken);

module.exports = router;