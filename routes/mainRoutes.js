const express = require("express");
const router = express.Router();

const indexRoutes = require("./indexRoutes");  // Home page route
const smsRoutes = require("./smsRoutes");      // SMS handling routes
const callRoutes = require("./callRoutes");    // Call handling routes
const pickupRoutes = require("./pickupRoutes"); // Pickup route

router.use("/", indexRoutes);
router.use("/", smsRoutes);
router.use("/", callRoutes);
router.use("/", pickupRoutes); 

module.exports = router;