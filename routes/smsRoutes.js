const express = require("express");
const router = express.Router();
const { serialPort, parser } = require("../serial");

let latestMessageParts = 0;
let isProcessing = false;
let smsStatus = null;

// Handle serial responses
parser.on("data", (data) => {
    const trimmedData = data.trim();
    if (["SMS_SENT", "SMS_FAILED"].includes(trimmedData)) {
        smsStatus = trimmedData;
    }
});

// ✅ Render SMS form with predefined messages
router.get("/sendsms", (req, res) => {
    const predefinedMessage = req.query.message || ""; // Extract message from query
    res.render("sendsms", { predefinedMessage });
});

// ✅ API to get SMS message parts
router.get("/get-message-parts", (req, res) => res.json({ totalParts: latestMessageParts }));

const waitForSmsSent = async () => {
    return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => reject(new Error("Timeout waiting for SMS_SENT")), 10000);
        let checkInterval = setInterval(() => {
            if (smsStatus === "SMS_SENT") {
                clearTimeout(timeout);
                clearInterval(checkInterval);
                smsStatus = null;
                resolve();
            } else if (smsStatus === "SMS_FAILED") {
                clearTimeout(timeout);
                clearInterval(checkInterval);
                smsStatus = null;
                reject(new Error("SMS sending failed"));
            }
        }, 500);
    });
};

// ✅ Send SMS Route
router.post("/send", async (req, res) => {
    if (isProcessing) return res.status(429).send("⚠️ SMS already being processed. Please wait.");

    isProcessing = true;
    let { number, message } = req.body;
    console.log("Sending SMS:", { number, message });  // Debug log REMOVE LATER
    console.log("Sending SMS from page:", { number, message, length: message.length });

    serialPort.write(`SEND_SMS,${number},${message}\n`);

    try {
        await waitForSmsSent();
        isProcessing = false;
        return res.send("✅ SMS sent successfully.");
    } catch (error) {
        isProcessing = false;
        return res.status(500).send(`❌ Error: ${error.message}`);
    }
});

// In routes/smsRoutes.js (or create a new route file if you prefer)
router.get("/pickup-sms-page", (req, res) => {
    res.render("pickup-sms-page");
});

module.exports = router;
