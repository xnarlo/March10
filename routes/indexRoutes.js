const express = require("express");
const router = express.Router();

// Render homepage (index.ejs)
router.get("/", (req, res) => {
    res.render("index", { title: "Home" });
});

module.exports = router;
