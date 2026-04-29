const express = require("express");
const router = express.Router();
const {
  getProfiles,
  searchProfiles,
  createProfile,
  getProfileById,
  deleteProfile,
} = require("../controllers/profile.controller");

const { validateQuery } = require("../middlewares/QueryValidation.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/Rbac.middleware");

// router.get("/profiles",  validateQuery, getProfiles);

router.get("/profiles", authenticate, authorize("admin"), validateQuery, getProfiles);

router.get("/profiles/search", authenticate,  validateQuery, searchProfiles);

router.post("/profiles", authenticate, authorize("admin"), createProfile);

router.get("/profiles/:id", authenticate,  getProfileById);

router.delete("/profiles/:id", authenticate,  deleteProfile);

module.exports = router;
