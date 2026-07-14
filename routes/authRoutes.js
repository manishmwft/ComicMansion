const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const {
  authLimiter,
  registerLimiter,
} = require("../middleware/rateLimiters");

router.post("/register", registerLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authLimiter, authController.logout);

router.get("/me", authMiddleware, authController.me);

module.exports = router;