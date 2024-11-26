const express = require("express");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const multer = require("multer");
const fs = require("fs"); // Required for reading files
const { create } = require("ipfs-http-client");
const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Use helmet to set security headers
app.use(helmet());

// Middleware to generate a nonce and set CSP
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64"); // base64 encode the nonce
  res.locals.nonce = nonce;
  res.setHeader(
    "Content-Security-Policy",
    `
    default-src 'self'; 
    script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com; 
    style-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
    img-src 'self' data: https://cdn.jsdelivr.net; 
    connect-src 'self' http://localhost:5001; 
    font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
    object-src 'none'; 
    media-src 'self'; 
    frame-src 'none';
  `
      .replace(/\s{2,}/g, " ")
      .trim()
  ); // Ensure single spaces and trim whitespace
  next();
});

// Middleware to make session available to EJS templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Middleware to check if the user is authenticated as Admin
function isAuthenticatedAdmin(req, res, next) {
  if (req.session.role === "Admin") {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Middleware to check if the user is authenticated as Institute
function isAuthenticatedInstitute(req, res, next) {
  if (req.session.role === "Institute") {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Middleware to check if the user is authenticated as Applicant
function isAuthenticatedApplicant(req, res, next) {
  if (req.session.role === "Applicant") {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Login route
app.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "imdenigma",
      password: "aaspass",
      database: "verifichain",
    });

    let query = "";
    let params = [];

    if (role === "Admin") {
      if (username === "admin" && password === "admin") {
        req.session.role = "Admin";
        return res.redirect("/admin/dashboard");
      } else {
        return res.render("pages/login", {
          error: "Invalid Admin credentials",
        });
      }
    } else if (role === "Applicant") {
      query = "SELECT * FROM applicant WHERE `User ID` = ? AND Password = ?";
      params = [username, password];
    } else if (role === "Institute") {
      query = "SELECT * FROM univerisity WHERE `User ID` = ? AND Password = ?";
      params = [username, password];
    } else if (role === "Company") {
      query = "SELECT * FROM company WHERE `User ID` = ? AND Password = ?";
      params = [username, password];
    }

    const [rows] = await connection.execute(query, params);
    connection.end();

    if (rows.length > 0) {
      req.session.role = role;
      req.session.username = username;
      if (role === "Applicant") {
        res.redirect("/applicant/dashboard");
      } else if (role === "Institute") {
        res.redirect("/institute/dashboard");
      } else if (role === "Company") {
        res.redirect("/company/dashboard");
      }
    } else {
      res.render("pages/login", { error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.render("pages/login", { error: "Error during login" });
  }
});

// Routes
const indexRouter = require("./routes/homepage");
const usersRouter = require("./routes/users");
const applicantRouter = require("./routes/applicant");
const instituteRouter = require("./routes/institute");
const adminRouter = require("./routes/admin");
const ipfsRouter = require("./routes/ipfs");

app.use("/", indexRouter);
app.use("/", usersRouter);
app.use("/applicant", applicantRouter);
app.use("/institute", instituteRouter);
app.use("/admin", adminRouter);
app.use("/ipfs", ipfsRouter);

// Notifications page for Admin
app.get("/admin/notifications", isAuthenticatedAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "imdenigma",
      password: "aaspass",
      database: "verifichain",
    });

    const [rows] = await connection.execute(
      "SELECT * FROM ins_notifications WHERE recipient_role = ?",
      ["Admin"]
    );
    connection.end();

    res.render("admin/notifications", {
      notifications: rows,
      user: req.session,
    });
  } catch (error) {
    console.error("Error fetching notifications from the database:", error);
    res.render("admin/notifications", {
      notifications: [],
      user: req.session,
      error: "Error fetching notifications from the database",
    });
  }
});

// View Requests page for Institute
app.get(
  "/institute/view-requests",
  isAuthenticatedInstitute,
  async (req, res) => {
    try {
      const connection = await mysql.createConnection({
        host: "localhost",
        user: "imdenigma",
        password: "aaspass",
        database: "verifichain",
      });

      const [rows] = await connection.execute(
        "SELECT * FROM requested_certificate"
      );
      connection.end();

      res.render("institute/view-requests", {
        requests: rows,
        user: req.session,
      });
    } catch (error) {
      console.error("Error fetching requests from the database:", error);
      res.render("institute/view-requests", {
        requests: [],
        user: req.session,
        error: "Error fetching requests from the database",
      });
    }
  }
);

// History page for Institute
app.get("/institute/history", isAuthenticatedInstitute, async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "imdenigma",
      password: "aaspass",
      database: "verifichain",
    });

    const [rows] = await connection.execute(
      "SELECT * FROM univerisity_verified_certificates WHERE Institute = ?",
      [req.session.instituteName]
    );
    connection.end();

    res.render("institute/history", { history: rows, user: req.session });
  } catch (error) {
    console.error("Error fetching history from the database:", error);
    res.render("institute/history", {
      history: [],
      user: req.session,
      error: "Error fetching history from the database",
    });
  }
});

// New route for IPFS upload
app.get("/upload-ipfs", (req, res) => {
  res.render("input-ipfs");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
