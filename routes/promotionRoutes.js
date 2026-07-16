const express = require("express");
const optionalAuth = require("../middleware/optionalAuth");
const controller = require("../controllers/promotionController");

const router = express.Router();

router.use(optionalAuth);
router.get("/startup", controller.getStartupPromotion);
router.post("/:id/impression", controller.recordImpression);
router.post("/:id/click", controller.recordClick);

module.exports = router;
