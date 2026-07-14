const express = require("express");
const router = express.Router();

const { createComic, getComics } = require("../controllers/comicsController");

// POST /comics/
router.post("/", createComic);

// GET /comics/
router.get("/", getComics);

module.exports = router;