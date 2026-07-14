const express = require("express");
const router = express.Router();

const { createPurchase } = require("../controllers/purchaseController");

// POST /purchase/
router.post("/", createPurchase);

module.exports = router;