const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const session = require("express-session");
const { serialPort, parser } = require("./serial");
const db = require("./config/db");
const mainRoutes = require("./routes/mainRoutes");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Session setup
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));

// Make session accessible in views
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Restrict access to authenticated users
app.use((req, res, next) => {
    const publicPaths = ["/login", "/auth/login"];
    if (!req.session.user && !publicPaths.includes(req.path)) {
        return res.redirect("/login");
    }
    next();
});

// Connect to DB and start server
db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed. Exiting...");
        process.exit(1);
    } else {
        console.log("✅ Connected to MySQL Database");
        server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
    }
});

// Serial port events
serialPort.on("open", () => console.log("✅ Serial Port Opened"));
serialPort.on("error", (err) => console.error("❌ Serial Port Error:", err.message));

parser.on("data", (data) => {
    const trimmedData = data.trim();
    console.log("📩 Received from Arduino:", trimmedData);

    if (["SMS_SENT", "SMS_FAILED"].includes(trimmedData)) {
        io.emit("sms_status", trimmedData);
    } else if (["CALL_STARTED", "CALL_ENDED"].includes(trimmedData)) {
        io.emit("call_status", trimmedData);
    }
});

// Routes
app.use("/", mainRoutes);
app.use("/", authRoutes);
