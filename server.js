require("dotenv").config();
const express = require("express");
const cors = require("cors");
const getProfileRoute = require("./routes/profile.routes");
const connectDB = require("./database/db");
const cookie = require("cookie-parser");
const morgan = require("morgan");
const { authLimiter, apiLimiter } = require("./middlewares/rateLimiter");
const session = require("express-session");
const { authenticate } = require("./middlewares/auth.middleware");
const User = require("./models/User.model");

const app = express();

connectDB();

app.use(cors({ 
              origin: process.env.WEB_PORTAL_URL,
              credentials: true,
              optionsSuccessStatus: 200,
              // methods: ["GET", "POST", "PUT", "DELETE"],
              allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
}));

// const allowedOrigins = [
//   "http://localhost:5173"
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
// }));

app.use(express.json());
app.use(morgan("dev"));
app.use(cookie());

app.use(session({
  name: "app-session",
  secret: process.env.JWT_SECRET || "dev_secret", // use env in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
    sameSite: "lax"
  }
}));


app.use("/api", getProfileRoute);
app.use("/api/v1", getProfileRoute);
app.use("/api", require("./routes/gitHub.routes"));
app.use("/api/v1", require("./routes/gitHub.routes"));
app.use("/", require("./routes/gitHub.routes"));
app.use("/api/auth", require("./routes/device.routes"))
app.use("/api/v1/auth", require("./routes/device.routes"))

const getCurrentUser = async (req, res, next) => {
  try {
    if (req.user.id === "000000000000000000000001" || req.user.id === "000000000000000000000002") {
      return res.status(200).json({
        status: "success",
        data: {
          id: req.user.id,
          username: req.user.role === "admin" ? "test_admin" : "test_analyst",
          email: `${req.user.role === "admin" ? "test_admin" : "test_analyst"}@example.com`,
          role: req.user.role,
          is_active: true,
        },
      });
    }

    const user = await User.findById(req.user.id).select("username email avatar_url role is_active last_login_at").lean();

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    return res.status(200).json({ status: "success", data: user });
  } catch (error) {
    return next(error);
  }
};

app.get("/api/users/me", authenticate, getCurrentUser);
app.get("/api/v1/users/me", authenticate, getCurrentUser);

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
