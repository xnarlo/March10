const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const { serialPort, parser } = require("./serial");
const db = require("./config/db");
const mainRoutes = require("./routes/mainRoutes");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Ensure MySQL is connected before starting the server
db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed. Exiting...");
        process.exit(1); // Stop the server if the database fails
    } else {
        console.log("✅ Connected to MySQL Database");
        // Start server only if DB is connected
        server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
    }
});

// Handle serial port events
serialPort.on("open", () => console.log("✅ Serial Port Opened"));
serialPort.on("error", (err) => console.error("❌ Serial Port Error:", err.message));

// Emit serial events to clients
parser.on("data", (data) => {
    const trimmedData = data.trim();
    console.log("📩 Received from Arduino:", trimmedData);

    if (["SMS_SENT", "SMS_FAILED"].includes(trimmedData)) {
        io.emit("sms_status", trimmedData);
    } else if (["CALL_STARTED", "CALL_ENDED"].includes(trimmedData)) {
        io.emit("call_status", trimmedData);
    }
});

// Use routes
app.use("/", mainRoutes);
