const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Change if necessary
    password: 'P@zzword1', // Your database password
    database: 'ER506'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL Database");
    }
});

module.exports = db;
