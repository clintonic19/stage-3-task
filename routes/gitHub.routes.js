const express = require("express");
const router = express.Router();
const {getGitHub, gitHubCallBack }= require("../controllers/github.controller");

router.get("/auth/github", getGitHub);
router.get("/auth/github/callback", gitHubCallBack);
module.exports = router;
