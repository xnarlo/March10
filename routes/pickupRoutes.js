const express = require("express");
const router = express.Router();
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
            res.json({ success: true, details: results[0] }); // Return first matching record
        } else {
            res.json({ success: false }); // No match found
        }
    });
});

module.exports = router;
