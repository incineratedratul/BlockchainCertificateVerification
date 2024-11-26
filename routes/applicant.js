const express = require("express");
const router = express.Router();
const multer = require("multer");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const NotificationService = require("../services/notificationService");
const nonce = crypto.randomBytes(16).toString("base64"); // Generate a random nonce

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

// Function to generate a nonce
function generateNonce() {
  return crypto.randomBytes(16).toString("base64");
}

//ends here

// Dashboard page
router.get("/dashboard", isAuthenticated, (req, res) => {
  const nonce = generateNonce();
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self';`
  );
  res.render("applicant/dashboard", { user: req.session, nonce });
});

// My Certificates page
router.get("/my-certificates", isAuthenticated, async (req, res) => {
  const nonce = generateNonce();
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com https://fonts.googleapis.com;`
  );

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
      nonce,
    });
  } catch (error) {
    console.error("Error fetching certificates from the database:", error);
    res.render("applicant/my-certificates", {
      certificates: [],
      user: req.session,
      nonce,
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
    const filename = req.file ? req.file.filename : null;

    if (!filename) {
      return res.status(400).send("No file uploaded.");
    }

    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        "INSERT INTO requested_certificate (Username, `Full Name`, `Certificate Name`, Institute, `Certificate Type`, `Certificate ID`, Filename) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
      connection.end();
      res.redirect("/applicant/my-certificates");
    } catch (error) {
      console.error("Error uploading certificate:", error);
      res.status(500).send("Error uploading certificate.");
    }
  }
);

// My Profile page
router.get("/my-profile", isAuthenticated, (req, res) => {
  res.render("applicant/my-profile", { user: req.session });
});

// Notifications page for Applicant
router.get("/request-notifications", isAuthenticated, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch rows from matched_certificates for the logged-in applicant
    console.log("Fetching notifications for username:", req.session.username);

    const [notifications] = await connection.execute(
      `SELECT id, 
              full_name, 
              certificate_name, 
              filename, 
              requested_company 
       FROM matched_certificates 
       WHERE applicant_username = ?`,
      [req.session.username]
    );

    // Log fetched notifications for debugging
    console.log("Fetched notifications:", notifications);

    connection.end();

    // Render the notifications page with the fetched data
    res.render("applicant/request-notifications", {
      notifications,
      user: req.session,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).send("Error fetching notifications.");
  }
});

router.post("/notifications/:id/approve", isAuthenticated, async (req, res) => {
  const notificationId = req.params.id;

  try {
    const notification = await NotificationService.getNotificationById(
      notificationId
    );

    // Send notification to the company
    await NotificationService.sendNotificationToCompany({
      companyUsername: notification.company_user_id,
      applicantUsername: notification.applicant_user_id,
      certificateID: notification.certificate_id,
      message: `The applicant ${notification.applicant_user_id} has approved your request to access the certificate.`,
    });

    // Delete the notification from the applicant's list
    await NotificationService.deleteNotification(notificationId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error approving notification:", error);
    res
      .status(500)
      .json({ success: false, error: "Error approving notification" });
  }
});

router.post("/notifications/:id/reject", isAuthenticated, async (req, res) => {
  const notificationId = req.params.id;

  try {
    const notification = await NotificationService.getNotificationById(
      notificationId
    );

    // Send notification to the company
    await NotificationService.sendNotificationToCompany({
      companyUsername: notification.company_user_id,
      applicantUsername: notification.applicant_user_id,
      certificateID: notification.certificate_id,
      message: `The applicant ${notification.applicant_user_id} has denied your request to access the certificate.`,
    });

    // Delete the notification from the applicant's list
    await NotificationService.deleteNotification(notificationId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error rejecting notification:", error);
    res
      .status(500)
      .json({ success: false, error: "Error rejecting notification" });
  }
});

// View Certificate page
router.get(
  "/view-certificate/:certificateID",
  isAuthenticated,
  async (req, res) => {
    const { certificateID } = req.params;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        "SELECT * FROM university_verified_certificates WHERE certificate_id = ?",
        [certificateID]
      );
      connection.end();

      if (rows.length > 0) {
        res.render("applicant/view-certificate", {
          certificate: rows[0],
          user: req.session,
        });
      } else {
        res.status(404).send("Certificate not found");
      }
    } catch (error) {
      console.error("Error fetching certificate from the database:", error);
      res.status(500).send("Error fetching certificate from the database");
    }
  }
);

// Route to render fetch-and-confirm page
router.get("/fetch-and-confirm", isAuthenticated, async (req, res) => {
  const nonce = generateNonce();
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self';`
  );
  res.render("applicant/fetch-and-confirm", { user: req.session, nonce });
});

// Fetch certificates and return as JSON
router.get("/fetch-certificates", isAuthenticated, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT Username as username, Time_Verified as time_verified, Certificate_Name as certificate_name, Full_Name as full_name,
       Institute as institute, Certificate_Type as certificate_type,
       Certificate_ID as certificate_id, Filename as filename, 
       Verifier as verifier, Verifier_Contact as verifier_contact, IPFS_CID as ipfs_cid 
       FROM university_verified_certificates WHERE username = ?`,
      [req.session.username]
    );
    connection.end();

    // Log the data retrieved from the database
    console.log("Certificates fetched from database:", rows);

    res.json({ certificates: rows });
  } catch (error) {
    console.error("Error fetching certificates from the database:", error);
    res
      .status(500)
      .json({ error: "Error fetching certificates from the database" });
  }
});

// View Verified Certificates page
router.get("/view-verified-certificates", isAuthenticated, async (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).send("Filename is required.");
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch the certificate details from the database using the filename
    const [rows] = await connection.execute(
      `SELECT 
        Username AS username,
        Full_Name AS full_name,
        Certificate_Name AS certificate_name,
        Institute AS institute,
        Certificate_Type AS certificate_type,
        Certificate_ID AS certificate_id,
        Verifier AS verifier,
        Verifier_Contact AS verifier_contact,
        IPFS_CID AS ipfs_cid,
        Time_Verified AS time_verified,
        Filename AS filename,
        Encryption_Key AS encryption_key
      FROM university_verified_certificates 
      WHERE filename = ? AND username = ?`,
      [filename, req.session.username]
    );

    connection.end();

    if (rows.length === 0) {
      return res.status(404).send("Certificate not found.");
    }

    // Pass the certificates array to the EJS template
    res.render("applicant/view-verified-certificates", {
      certificates: rows, // Array of certificates
      user: req.session, // User session data
    });
  } catch (error) {
    console.error("Error fetching verified certificates:", error);
    res.status(500).send("Error fetching verified certificates.");
  }
});

router.post("/approve-notification", isAuthenticated, async (req, res) => {
  const { id } = req.body; // Notification ID

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch certificate details from `matched_certificates` using the notification ID
    const [rows] = await connection.execute(
      `SELECT filename, full_name, certificate_name, certificate_type, requested_company 
       FROM matched_certificates 
       WHERE id = ? AND applicant_username = ?`,
      [id, req.session.username]
    );

    connection.end();

    if (rows.length === 0) {
      return res.status(404).send("Notification not found.");
    }

    const certificate = rows[0];

    // Redirect to the view-verified-certificate page with the certificate filename
    res.redirect(
      `/applicant/view-verified-certificates?filename=${certificate.filename}`
    );
  } catch (error) {
    console.error("Error approving notification:", error);
    res.status(500).send("Error approving notification.");
  }
});

router.post("/approve-notification", isAuthenticated, async (req, res) => {
  const { id } = req.body;

  try {
    // Fetch the row to get the filename (or any other required details)
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT filename FROM matched_certificates WHERE id = ? AND username = ?`,
      [id, req.session.username]
    );

    connection.end();

    if (rows.length === 0) {
      return res.status(404).send("Notification not found.");
    }

    // Redirect to view-verified-certificate with the filename
    const filename = rows[0].filename;
    res.redirect(`/applicant/view-verified-certificates?filename=${filename}`);
  } catch (error) {
    console.error("Error approving notification:", error);
    res.status(500).send("Error approving notification.");
  }
});

router.post("/reject-notification", isAuthenticated, async (req, res) => {
  const { id } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Delete the notification by ID
    await connection.execute(
      `DELETE FROM matched_certificates 
       WHERE id = ? AND applicant_username = ?`,
      [id, req.session.username]
    );

    connection.end();

    // Refresh the notifications page
    res.redirect("/applicant/request-notifications");
  } catch (error) {
    console.error("Error rejecting notification:", error);
    res.status(500).send("Error rejecting notification.");
  }
});

router.get("/downloads/:filename", isAuthenticated, (req, res) => {
  const filename = req.params.filename.trim(); // Ensure no extra spaces
  const uploadsPath = path.join(__dirname, "..", "uploads");
  const filePath = path.join(uploadsPath, filename);

  console.log("Download request:", {
    rawUrl: req.originalUrl,
    requestedFilename: filename,
    resolvedFilePath: filePath,
  });

  try {
    // Ensure `uploads` directory exists
    if (!fs.existsSync(uploadsPath)) {
      console.error("Uploads directory does not exist:", uploadsPath);
      return res.status(500).send("Uploads directory not found.");
    }

    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist:", filePath);
      console.log("Available files:", fs.readdirSync(uploadsPath));
      return res.status(404).send(`File not found: ${filename}`);
    }

    // Serve the file
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error during file download:", err);
        res.status(500).send("Error downloading file.");
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send("Server error during file download.");
  }
});

module.exports = router;
