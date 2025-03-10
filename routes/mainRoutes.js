const express = require("express");
const router = express.Router();

const indexRoutes = require("./indexRoutes");  // Home page route
const smsRoutes = require("./smsRoutes");      // SMS handling routes
const callRoutes = require("./callRoutes");    // Call handling routes

router.use("/", indexRoutes);
router.use("/", smsRoutes);
router.use("/", callRoutes);

module.exports = router;
