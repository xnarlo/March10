const express = require("express");
const router = express.Router();
const { serialPort, parser } = require("../serial");

let latestMessageParts = 0;
let isProcessing = false; // Prevent duplicate SMS commands
let smsStatus = null;

// Listen for SMS status updates from the serial port
parser.on("data", (data) => {
    const trimmedData = data.trim();
    if (["SMS_SENT", "SMS_FAILED"].includes(trimmedData)) {
        smsStatus = trimmedData;
    }
});

// Route to render the original SMS form (if needed)
router.get("/sendsms", (req, res) => {
    res.render("sendsms");
});

// Route to render the pickup SMS page
router.get("/pickup-sms-page", (req, res) => {
    res.render("pickup-sms-page");
});

// API to get message parts (for tracking multipart SMS)
router.get("/get-message-parts", (req, res) => {
    res.json({ totalParts: latestMessageParts });
});

// Function to wait for SMS_SENT status from the serial port
const waitForSmsSent = async () => {
    return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => reject(new Error("Timeout waiting for SMS_SENT")), 10000);
        let checkInterval = setInterval(() => {
            if (smsStatus === "SMS_SENT") {
                clearTimeout(timeout);
                clearInterval(checkInterval);
                smsStatus = null; // Reset status after success
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

// Route to handle sending SMS
router.post("/send", async (req, res) => {
    if (isProcessing) {
        return res.status(429).send("⚠️ SMS already being processed. Please wait.");
    }
    
    isProcessing = true;
    let { number, message } = req.body;
    console.log("Received from /send:", { number, message, length: message.length });
    const maxPartLength = 150;

    if (message.length <= maxPartLength) {
        const command = `SEND_SMS,${number},${message}\n`;
        // Add a log here:
        console.log("Command being sent:", command);
        try {
            console.log("Command being sent:", command);
            serialPort.write(command);
            await waitForSmsSent();
            isProcessing = false;
            return res.send("✅ SMS sent successfully.");
        } catch (error) {
            isProcessing = false;
            return res.status(500).send(`❌ Error: ${error.message}`);
        }
    }

    // Function to split message into parts without splitting words
    const splitMessage = (msg, maxLen) => {
        let parts = [];
        let currentPart = "";

        msg.split(" ").forEach(word => {
            if ((currentPart + word).length > maxLen) {
                parts.push(currentPart.trim());
                currentPart = word + " ";
            } else {
                currentPart += word + " ";
            }
        });

        if (currentPart.trim().length > 0) {
            parts.push(currentPart.trim());
        }

        return parts;
    };

    const messageParts = splitMessage(message, maxPartLength);
    latestMessageParts = messageParts.length;
    let failedParts = 0;

    try {
        for (let i = 0; i < messageParts.length; i++) {
            let fullMessage = `(${i + 1}/${messageParts.length}) ${messageParts[i]}`;
            let command = `SEND_SMS,${number},${fullMessage}\n`;
            // Log each segmented command:
            console.log(`Command being sent (part ${i + 1}/${messageParts.length}):`, command);
            let attempts = 0;
            let sent = false;
            while (attempts < 3 && !sent) {
                console.log("Command being sent:", command);
                serialPort.write(command);
                try {
                    await waitForSmsSent();
                    sent = true;
                } catch (error) {
                    attempts++;
                }
            }
            if (!sent) {
                failedParts++;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        isProcessing = false;
        if (failedParts === 0) res.send("✅ All SMS parts sent successfully.");
        else res.status(500).send(`❌ Some messages failed. ${failedParts} parts were not sent.`);
    } catch (error) {
        isProcessing = false;
        res.status(500).send(`❌ Error: ${error.message}`);
    }
});

module.exports = router;

