const express = require("express");
const router = express.Router();
const { serialPort, parser } = require("../serial");
const saveMessage = require("../utils/saveMessage"); // ✅ Utility for saving messages

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

// Route to render the original SMS form
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

    try {
        // Split message into 160-char parts
        const segments = message.match(/.{1,160}/g);
        latestMessageParts = segments.length;

        for (let i = 0; i < segments.length; i++) {
            const part = segments[i];
            const command = `SEND_SMS,${number},${part}\n`;
//changed the line above from
//const command = `AT+CMGS="${number}"\r${part}\x1A`;


            serialPort.write(command, (err) => {
                if (err) {
                    throw new Error("Failed to write to serial port: " + err.message);
                }
            });

            console.log(`📤 Sending part ${i + 1}/${segments.length}`);
            await waitForSmsSent();
        }

        // ✅ Save message to database after successful send
        saveMessage({
            recipient: number,
            message: message,
            sender: req.session?.user?.full_name || "Unknown"
        });

        res.status(200).send("✅ Message sent successfully!");
    } catch (error) {
        console.error("❌ Error in /send:", error.message);
        res.status(500).send("❌ Failed to send SMS.");
    } finally {
        isProcessing = false;
    }
});

module.exports = router;
