const express = require("express");
const router = express.Router();

const coinPackageController = require("../controllers/coinPackageController");

router.get("/", coinPackageController.getActivePackages);

module.exports = router;
