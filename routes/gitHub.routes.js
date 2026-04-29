const express = require("express");
const router = express.Router();
const {getGitHub, gitHubCallBack, verifyUser }= require("../controllers/github.controller");

router.get("/auth/github", getGitHub);
router.get("/auth/github/callback", gitHubCallBack);
router.get("/auth/verify", verifyUser);

// router.get("/auth/verify", (req, res) => {
//   if (req.session && req.session.user) {
//     res.json({ authenticated: true, user: req.session.user });
//   } else {
//     res.json({ authenticated: false });
//   }
// });

module.exports = router;
