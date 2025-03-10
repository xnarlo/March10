const express = require("express");
const router = express.Router();
const { serialPort } = require("../serial");

// Render Call Client form
router.get("/callclient", (req, res) => res.render("callclient"));

// Make a call
router.post("/call", (req, res) => {
    const { number } = req.body;
    serialPort.write(`MAKE_CALL,${number}\n`);
    res.send("📞 Call command sent");
});

// End call
router.post("/endcall", (req, res) => {
    serialPort.write("END_CALL\n");
    res.send("📴 End Call command sent");
});

module.exports = router;
