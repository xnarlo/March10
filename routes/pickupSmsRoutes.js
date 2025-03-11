// routes/pickupSmsRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// API endpoint to save the generated message
router.post("/api/save-message", (req, res) => {
    const { contactNumber, message } = req.body;
    if (!contactNumber || !message) {
        return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    const sql = "INSERT INTO saved_messages (contact_number, message) VALUES (?, ?)";
    db.query(sql, [contactNumber, message], (err, result) => {
        if (err) {
            console.error("❌ Error saving message:", err);
            return res.status(500).json({ success: false, error: "Database error." });
        }
        return res.json({ success: true, id: result.insertId });
    });
});

// API endpoint to retrieve the most recent saved message
router.get("/api/get-saved-message", (req, res) => {
    const sql = "SELECT contact_number, message, created_at FROM saved_messages ORDER BY created_at DESC LIMIT 1";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error retrieving saved message:", err);
            return res.status(500).json({ success: false, error: "Database error." });
        }
        if (results.length > 0) {
            return res.json({ success: true, data: results[0] });
        }
        return res.json({ success: false, message: "No saved message found." });
    });
});

module.exports = router;
