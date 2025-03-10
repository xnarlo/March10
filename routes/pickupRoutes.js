const express = require("express");
const router = express.Router();

// ✅ Render the Pick-up Notification page
router.get("/pickup", (req, res) => {
    res.render("pickup"); // Ensure pickup.ejs exists in the 'views' directory
});

module.exports = router;
