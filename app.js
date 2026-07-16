const express = require("express");
const cors = require("cors");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const downloadRoutes = require("./routes/downloadRoutes");
const authRoutes = require("./routes/authRoutes");
const comicsRoutes = require("./routes/comicsRoutes");
const episodesRoutes = require("./routes/episodesRoutes");
const pagesRoutes = require("./routes/pagesRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const adminRoutes = require("./routes/adminRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const readingProgressRoutes = require("./routes/readingProgressRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const commentRoutes = require("./routes/commentRoutes");
const unlockRoutes = require("./routes/unlockRoutes");
const rewardedAdRoutes = require("./routes/rewardedAdRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const coinPackageRoutes = require("./routes/coinPackageRoutes");
const couponRoutes = require("./routes/couponRoutes");
const promotionRoutes =
  require("./routes/promotionRoutes");
const {
  helmetMiddleware,
  hppMiddleware,
  sanitizeRequest,
} = require("./middleware/securityMiddleware");

const { commonLimiter } = require("./middleware/rateLimiters");

const app = express();

/* ================= TRUST PROXY ================= */

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* ================= CORS ================= */

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/+$/, ""));

function isLocalFlutterWebOrigin(origin) {
  try {
    const url = new URL(origin);

    return (
      url.protocol === "http:" &&
      (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1"
      )
    );
  } catch (error) {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin =
      typeof origin === "string"
        ? origin.trim().replace(/\/+$/, "")
        : "";
  
    // Allow requests that have no browser Origin header.
    // Examples: Flutter Android/iOS, Postman, curl,
    // server-to-server requests.
    if (!normalizedOrigin) {
      return callback(null, true);
    }
  
    // Some mobile WebViews, local files, and sandboxed clients
    // send the literal Origin value "null".
    //
    // Allow it during local development.
    if (
      normalizedOrigin === "null" &&
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
  
    if (
      configuredOrigins.includes(
        normalizedOrigin
      )
    ) {
      return callback(null, true);
    }
  
    if (
      isLocalFlutterWebOrigin(
        normalizedOrigin
      )
    ) {
      return callback(null, true);
    }
  
    console.warn(
      "CORS BLOCKED ORIGIN:",
      normalizedOrigin
    );
  
    const error =
      new Error("Not allowed by CORS");
  
    error.status = 403;
  
    return callback(error);
  },
  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],

  exposedHeaders: [
    "Content-Type",
    "Content-Length",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

/* ================= BODY PARSER ================= */

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/* ================= SECURITY ================= */

app.use(helmetMiddleware);
app.use(hppMiddleware);
app.use(sanitizeRequest);

/* ================= RATE LIMIT ================= */

app.use(commonLimiter);

/* ================= VIEW ENGINE ================= */

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/admin");

/* ================= STATIC FILES ================= */

app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"), {
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
    etag: true,
  })
);

/* ================= SESSION ================= */

app.use(
  session({
    name: "bharat_admin_session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "admin_sessions",
      ttl: 60 * 60 * 24,
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

/* ================= FLASH MESSAGES ================= */

app.use((req, res, next) => {
  res.locals.success = req.session ? req.session.success : null;
  res.locals.error = req.session ? req.session.error : null;

  if (req.session) {
    delete req.session.success;
    delete req.session.error;
  }

  next();
});

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Bharat Comics API Running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  return res.json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ================= ROUTES ================= */

app.use("/auth", authRoutes);
app.use("/comics", comicsRoutes);
app.use("/episodes", episodesRoutes);
app.use("/pages", pagesRoutes);
app.use("/purchase", purchaseRoutes);
app.use("/admin", adminRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/reading-progress", readingProgressRoutes);
app.use("/rewards", rewardRoutes);
app.use("/comments", commentRoutes);
app.use("/unlock", unlockRoutes);
app.use("/downloads", downloadRoutes);
app.use("/rewarded-ads", rewardedAdRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/discovery", discoveryRoutes);
app.use("/coin-packages", coinPackageRoutes);
app.use("/coupons", couponRoutes);
app.use(
  "/promotions",
  promotionRoutes
);



app.use((req, res) => {
  return res.status(404).json({
    success: false,
    detail: "Route not found",
    path: req.originalUrl,
  });
});



app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      detail: "CORS blocked this request",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    detail:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

/* ================= EXPORT ================= */

module.exports = app;