// web app/utils/saveMessage.js
const db = require("../config/db");

function saveMessage({ recipient, message, sender }) {
    const query = `
        INSERT INTO saved_messages (contact_number, message, sender_full_name, created_at)
        VALUES (?, ?, ?, NOW())
    `;

    db.query(query, [recipient, message, sender], (err) => {
        if (err) {
            console.error("❌ Error saving message:", err);
        } else {
            console.log("✅ Message saved to DB.");
        }
    });
}

module.exports = saveMessage;
