const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middlewares/rateLimiter");
const {
  getGitHub,
  gitHubCallBack,
  verifyUser,
  refresh,
  logout,
}= require("../controllers/github.controller");

router.get("/auth/github", authLimiter, getGitHub);
router.get("/auth/github/callback", gitHubCallBack);
router.post("/auth/github/callback", gitHubCallBack);
router.get("/auth/verify", verifyUser);
router.post("/auth/refresh", refresh);
router.post("/auth/logout", logout);
router.all("/auth/refresh", (req, res) => {
  res.status(405).json({ error: "Method not allowed" });
});
router.all("/auth/logout", (req, res) => {
  res.status(405).json({ error: "Method not allowed" });
});

// router.get("/auth/verify", (req, res) => {
//   if (req.session && req.session.user) {
//     res.json({ authenticated: true, user: req.session.user });
//   } else {
//     res.json({ authenticated: false });
//   }
// });

module.exports = router;
