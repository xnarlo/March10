const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Render the Quotation SMS page (quotation.ejs)
router.get("/quotation", (req, res) => {
  res.render("quotation");
});

// Render the Quotation SMS page
router.get("/quotation-sms-page", (req, res) => {
  res.render("quotation-sms-page");
});


// Search for STN and return details for quotation purposes
router.get("/quotation-search", (req, res) => {
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
      console.error("Error searching STN for quotation:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }
    if (results.length > 0) {
      let details = results[0];

      // Format dates to YYYY-MM-DD if valid; otherwise, use empty strings
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
