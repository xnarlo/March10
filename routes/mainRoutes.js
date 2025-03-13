const express = require("express");
const router = express.Router();

const indexRoutes = require("./indexRoutes");  // Home page route
const smsRoutes = require("./smsRoutes");      // SMS handling routes
const callRoutes = require("./callRoutes");    // Call handling routes
const pickupRoutes = require("./pickupRoutes"); // Pickup route
const pickupSmsRoutes = require("./pickupSmsRoutes"); // Pickup SMS route
const quotationRoutes = require("./quotationRoutes"); // Quotation route



router.use("/", indexRoutes);
router.use("/", smsRoutes);
router.use("/", callRoutes);
router.use("/", pickupRoutes); 
router.use("/", pickupSmsRoutes);
router.use("/", quotationRoutes);

module.exports = router;