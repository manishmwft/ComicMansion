const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const couponController = require("../controllers/couponController");
const { couponLimiter } = require("../middleware/rateLimiters");

router.post(
  "/validate",
  authMiddleware,
  couponLimiter,
  couponController.validateCoupon
);

module.exports = router;
