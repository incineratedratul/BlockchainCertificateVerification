const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const NotificationService = require("../services/notificationService");
const mysql = require("mysql2/promise");

// Middleware to check if the user is authenticated as Company
function isAuthenticatedCompany(req, res, next) {
  if (req.session.role === "Company") {
    return next();
  } else {
    res.redirect("/login");
  }
}

const dbConfig = {
  host: "localhost",
  user: "Raatul",
  password: "",
  database: "verifichain",
};

// Company Dashboard
router.get("/dashboard", isAuthenticatedCompany, (req, res) => {
  res.render("company/dashboard", { user: req.session });
});

// Route for Search User page
router.get("/search-user", isAuthenticatedCompany, (req, res) => {
  res.render("company/search-user", { user: req.session });
});

// Route for Search Certificate page
router.get("/search-certificate", isAuthenticatedCompany, (req, res) => {
  res.render("company/search-certificate", { user: req.session });
});

// Route for View Certificates page
router.get("/view-certificates", isAuthenticatedCompany, (req, res) => {
  res.render("company/view-certificates", { user: req.session });
});

router.get("/notifications", isAuthenticatedCompany, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Fetch the latest notification
    const [notifications] = await connection.execute(
      "SELECT filename FROM comp_notification LIMIT 1"
    );

    // Always pass a filename, even if null
    const filename =
      notifications.length > 0 ? notifications[0].filename : null;

    res.render("company/notifications", {
      user: req.session,
      filename: filename,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.render("company/notifications", {
      user: req.session,
      filename: null,
      error: "Error fetching notifications",
    });
  } finally {
    if (connection) await connection.end();
  }
});
// Route for Search by CID page
router.get("/search-by-cid", isAuthenticatedCompany, (req, res) => {
  res.render("company/search-by-cid", { user: req.session });
});

// Route for Search by Username page
router.get("/search-by-username", isAuthenticatedCompany, (req, res) => {
  res.render("company/search-by-username", { user: req.session });
});

// Route to handle Search by CID POST request (for fetching certificate by CID)
router.post("/search-by-cid", isAuthenticatedCompany, async (req, res) => {
  const { cid, username } = req.body;
  try {
    // Fetch certificate information from blockchain using CID (placeholder)
    const certificate = await someBlockchainService.getCertificateByCID(cid); // Example blockchain interaction

    res.render("company/search-results", { certificate, user: req.session });
  } catch (error) {
    console.error("Error fetching certificate by CID:", error);
    res.status(500).send("Error fetching certificate by CID");
  }
});

// Route to send notification (POST)
router.post("/send-notification", isAuthenticatedCompany, async (req, res) => {
  const { username, certificateID } = req.body;
  const companyUserID = req.session.username;

  try {
    await NotificationService.sendNotificationToApplicant({
      companyUsername: companyUserID,
      applicantUsername: username,
      certificateID,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ success: false });
  }
});

// Request Notifications page for Company
router.get(
  "/request-notifications",
  isAuthenticatedCompany,
  async (req, res) => {
    try {
      const notifications =
        await NotificationService.getNotificationsForCompany(
          req.session.username
        );
      res.render("company/request-notifications", {
        notifications,
        user: req.session,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.render("company/request-notifications", {
        notifications: [],
        user: req.session,
        error: "Error fetching notifications",
      });
    }
  }
);
//addhere
router.get("/debug-uploads", isAuthenticatedCompany, (req, res) => {
  const uploadsPath = path.join(__dirname, "..", "uploads");

  try {
    // Read all files in the uploads directory
    const files = fs.readdirSync(uploadsPath);

    console.log("Files in uploads directory:", files);

    res.json({
      uploadsPath: uploadsPath,
      files: files,
    });
  } catch (error) {
    console.error("Error reading uploads directory:", error);
    res.status(500).json({
      error: "Could not read uploads directory",
      details: error.message,
    });
  }
});

router.get("/downloads/:filename", isAuthenticatedCompany, (req, res) => {
  const filename = req.params.filename.trim(); // Ensure filename is clean
  const uploadsPath = path.join(__dirname, "..", "uploads");
  const filePath = path.join(uploadsPath, filename);

  console.log("Download request details:", {
    rawUrl: req.originalUrl,
    requestedFilename: filename,
    uploadsPath,
    resolvedFilePath: filePath,
  });

  try {
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsPath)) {
      console.error("Uploads directory missing:", uploadsPath);
      return res.status(500).send("Uploads directory not found");
    }

    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      console.log("Available files in uploads:", fs.readdirSync(uploadsPath));
      return res.status(404).send(`File not found: ${filename}`);
    }

    // Send file for download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error during download:", err);
        return res.status(500).send("Error downloading file");
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send("Server error during file download");
  }
});

router.post("/match-and-store", async (req, res) => {
  const { fullName, filename } = req.body;
  const companyUserID = req.session.username; // Get the company's user ID from the session

  if (!fullName || !filename || !companyUserID) {
    return res.status(400).json({
      error: "Full Name, Filename, and Company User ID are required.",
    });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Fetch matching certificates including username
    const [matchingCertificates] = await connection.execute(
      `SELECT full_name, certificate_name, certificate_type, filename, ipfs_cid, encryption_key, username
       FROM university_verified_certificates
       WHERE full_name = ? AND filename = ?`,
      [fullName, filename]
    );

    if (matchingCertificates.length === 0) {
      return res.status(404).json({ error: "No matching certificates found." });
    }

    // Ensure the matched_certificates table exists
    const newTableName = "matched_certificates";
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS ${newTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        applicant_username VARCHAR(255),
        full_name VARCHAR(255),
        certificate_name VARCHAR(255),
        certificate_type VARCHAR(255),
        filename VARCHAR(255),
        requested_company VARCHAR(255), -- Field to store the company User ID
        ipfs_cid VARCHAR(255),
        encryption_key TEXT
      )`
    );

    // Insert matches into the matched_certificates table
    const insertPromises = matchingCertificates.map((cert) =>
      connection.execute(
        `INSERT INTO ${newTableName} 
          (applicant_username, full_name, certificate_name, certificate_type, filename, requested_company, ipfs_cid, encryption_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cert.username, // Storing the applicant username
          cert.full_name,
          cert.certificate_name,
          cert.certificate_type,
          cert.filename,
          companyUserID, // Store the company User ID
          cert.ipfs_cid,
          cert.encryption_key,
        ]
      )
    );
    await Promise.all(insertPromises);

    res.json({
      storedCount: matchingCertificates.length,
      storedCertificates: matchingCertificates.map((cert) => ({
        name: cert.certificate_name,
        type: cert.certificate_type,
        applicantUsername: cert.username, // Include the username in the response
        company: companyUserID,
      })),
    });
  } catch (error) {
    console.error("Error matching and storing certificates:", error);
    res.status(500).json({ error: "Error matching and storing certificates." });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
