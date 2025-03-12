const express = require("express");
const router = express.Router(); // ✅ Define router before using it
const db = require("../config/db"); // ✅ Import database connection

// Render the Pick-up Notification page
router.get("/pickup", (req, res) => {
    res.render("pickup");
});

// ✅ Search STN in "jo_database" table and return all details
router.get("/pickup-search", (req, res) => {
    const { stn } = req.query;

    if (!stn) {
        return res.json({ success: false }); // Do nothing if input is empty
    }

    const sql = `
        SELECT 
            stn AS service_tracking_number, 
            ss_number AS service_slip_number, 
            client_name, 
            contact_person, 
            contact_number, 
            email, 
            model_number, 
            serial_number, 
            warranty_check, 
            quotation_sent, 
            quotation_received, 
            quotation_price, 
            eta_parts, 
            machine_status, 
            rr_created 
        FROM jo_database WHERE stn = ?
    `;

    db.query(sql, [stn], (err, results) => {
        if (err) {
            console.error("❌ Error searching STN:", err);
            return res.status(500).json({ success: false });
        }

        if (results.length > 0) {
            let details = results[0];

            // ✅ Improved date formatting function to prevent errors
            const formatDate = (date) => {
                if (!date || isNaN(new Date(date).getTime())) return ""; // Return empty if invalid
                return new Date(date).toISOString().split("T")[0]; // Convert to YYYY-MM-DD
            };

            details.quotation_sent = formatDate(details.quotation_sent);
            details.quotation_received = formatDate(details.quotation_received);
            details.eta_parts = formatDate(details.eta_parts);
            details.rr_created = formatDate(details.rr_created);

            // ✅ Replace null values with empty strings
            Object.keys(details).forEach((key) => {
                if (details[key] === null) details[key] = "";
            });

            res.json({ success: true, details });
        } else {
            res.json({ success: false }); // No match found
        }
    });
});

module.exports = router; // ✅ Export the router correctly

// This file handles routes related to the pick-up notification feature. It renders the pick-up notification page and provides an endpoint to search for service tracking numbers (STN) in the database. If a matching STN is found, it returns the details of the service tracking number.
