const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const { serialPort, parser } = require("./serial");
const mainRoutes = require("./routes/mainRoutes");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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

// Start server
server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
