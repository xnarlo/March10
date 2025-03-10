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

// Render SMS form
router.get("/sendsms", (req, res) => res.render("sendsms"));

// API to get SMS message parts
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

// Send SMS Route
router.post("/send", async (req, res) => {
    if (isProcessing) return res.status(429).send("⚠️ SMS already being processed. Please wait.");

    isProcessing = true;
    let { number, message } = req.body;
    const maxPartLength = 150;

    if (message.length <= maxPartLength) {
        try {
            serialPort.write(`SEND_SMS,${number},${message}\n`);
            await waitForSmsSent();
            isProcessing = false;
            return res.send("✅ SMS sent successfully.");
        } catch (error) {
            isProcessing = false;
            return res.status(500).send(`❌ Error: ${error.message}`);
        }
    }

    // Handle multipart SMS
    const totalParts = Math.ceil(message.length / maxPartLength);
    latestMessageParts = totalParts;
    let failedParts = 0;

    try {
        for (let i = 0; i < totalParts; i++) {
            let partMessage = message.substring(i * maxPartLength, (i + 1) * maxPartLength);
            let fullMessage = `(${i + 1}/${totalParts}) ${partMessage}`;
            serialPort.write(`SEND_SMS,${number},${fullMessage}\n`);

            try {
                await waitForSmsSent();
            } catch {
                failedParts++;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        isProcessing = false;
        return failedParts === 0
            ? res.send("✅ All SMS parts sent successfully.")
            : res.status(500).send(`❌ Some messages failed. ${failedParts} parts were not sent.`);
    } catch (error) {
        isProcessing = false;
        return res.status(500).send(`❌ Error: ${error.message}`);
    }
});

module.exports = router;
