require("dotenv").config();
const express = require("express");
const cors = require("cors");
const getProfileRoute = require("./routes/profile.routes");
const connectDB = require("./database/db");
const cookie = require("cookie-parser");
const morgan = require("morgan");
const { authLimiter, apiLimiter } = require("./middlewares/rateLimiter");
const session = require("express-session");

const app = express();

connectDB();

app.use(cors({ origin: process.env.WEB_PORTAL_URL,
              credentials: true,
              optionsSuccessStatus: 200,
              // methods: ["GET", "POST", "PUT", "DELETE"],
              allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
}));
app.use(express.json());
app.use(morgan("dev"));
app.use(cookie());

// app.use(authLimiter)
// app.use(apiLimiter)

app.use(session({
  name: "oauth-session",
  secret: process.env.JWT_SECRET || "dev_secret", // use env in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
    sameSite: "lax"
  }
}));


app.use("/api", getProfileRoute);
app.use("/api", require("./routes/gitHub.routes"));
app.use("/api/auth", require("./routes/device.routes"))

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Stage-2  Backend server is running fine",
    data: {
      time: new Date().toISOString()
    }
  });
});


app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode >= 500 ? "Server failure" : err.message || "Request failed";

  res.status(statusCode).json({
    status: "error",
    message
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Stage-3 Server running on port ${PORT}`);
  });
}

module.exports = app;
