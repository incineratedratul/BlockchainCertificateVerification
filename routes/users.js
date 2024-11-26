const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2/promise");

// Middleware to check if the user is authenticated and is an applicant
function isAuthenticated(req, res, next) {
  if (req.session.role === "Applicant") {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Database connection configuration
const dbConfig = {
  host: "localhost",
  user: "Raatul",
  password: "",
  database: "verifichain",
};

// Dashboard page
router.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("applicant/dashboard", { user: req.session });
});

// My Certificates page
router.get("/my-certificates", isAuthenticated, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM requested_certificate WHERE Username = ?",
      [req.session.username]
    );
    connection.end();

    res.render("applicant/my-certificates", {
      certificates: rows,
      user: req.session,
    });
  } catch (error) {
    console.error("Error fetching certificates from the database:", error);
    res.render("applicant/my-certificates", {
      certificates: [],
      user: req.session,
      error: "Error fetching certificates from the database",
    });
  }
});

// Upload Certificates page
router.get("/upload-certificates", isAuthenticated, (req, res) => {
  res.render("applicant/upload-certificates", { user: req.session });
});

// Handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post(
  "/upload-certificates",
  isAuthenticated,
  upload.single("certificate"),
  async (req, res) => {
    const { fullName, certificateName, institute, certificateType } = req.body;
    const username = req.session.username;
    const certificateID = Date.now().toString();
    const filename = req.file.filename;

    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        "INSERT INTO requested_certificate (Username, Full Name, Certificate Name, Institute, Certificate Type, Certificate ID, Filename) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          username,
          fullName,
          certificateName,
          institute,
          certificateType,
          certificateID,
          filename,
        ]
      );

      // Send notification to admin
      await connection.execute(
        "INSERT INTO ins_notifications (recipient_role, message) VALUES (?, ?)",
        ["Admin", `New certificate request from ${username}: ${certificateID}`]
      );

      connection.end();

      res.redirect("/applicant/my-certificates");
    } catch (error) {
      console.error("Error uploading certificate:", error);
      res.redirect("/applicant/upload-certificates");
    }
  }
);

// My Profile page
router.get("/my-profile", isAuthenticated, (req, res) => {
  res.render("applicant/my-profile", { user: req.session });
});

// Notifications page
router.get("/notifications", isAuthenticated, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM ins_notifications WHERE recipient_role = ?",
      ["Applicant"]
    );
    connection.end();

    res.render("applicant/notifications", {
      notifications: rows,
      user: req.session,
    });
  } catch (error) {
    console.error("Error fetching notifications from the database:", error);
    res.render("applicant/notifications", {
      notifications: [],
      user: req.session,
      error: "Error fetching notifications from the database",
    });
  }
});

module.exports = router;
