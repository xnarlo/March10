const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Render the forfeiture notification page
router.get("/forfeiture", (req, res) => {
  res.render("forfeiture");
});

// Render the forfeiture SMS page
router.get("/forfeiture-sms-page", (req, res) => {
    res.render("forfeiture-sms-page");
  });

// Search STN for forfeiture notifications and return details
router.get("/forfeiture-search", (req, res) => {
  const { stn } = req.query;
  if (!stn) {
    return res.json({ success: false, message: "STN is required." });
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
    FROM jo_database
    WHERE stn = ?
  `;

  db.query(sql, [stn], (err, results) => {
    if (err) {
      console.error("Error searching STN for forfeiture:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }
    if (results.length > 0) {
      let details = results[0];

      // Format dates to YYYY-MM-DD for consistency
      const formatDate = (date) => {
        if (!date || isNaN(new Date(date).getTime())) return "";
        return new Date(date).toISOString().split("T")[0];
      };

      details.quotation_sent = formatDate(details.quotation_sent);
      details.quotation_received = formatDate(details.quotation_received);
      details.eta_parts = formatDate(details.eta_parts);
      details.rr_created = formatDate(details.rr_created);

      // Replace null values with empty strings
      Object.keys(details).forEach(key => {
        if (details[key] === null) details[key] = "";
      });

      return res.json({ success: true, details });
    } else {
      return res.json({ success: false, message: "No matching data found." });
    }
  });
});

module.exports = router;
