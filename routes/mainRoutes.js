const express = require("express");
const router = express.Router();

const smsRoutes = require("./smsRoutes");
const callRoutes = require("./callRoutes");

router.use("/", smsRoutes);
router.use("/", callRoutes);

module.exports = router;
