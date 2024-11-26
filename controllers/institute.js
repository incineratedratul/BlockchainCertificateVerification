const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// View requests controller
exports.viewRequests = async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "Raatul",
      password: "",
      database: "verifichain",
    });

    const [rows] = await connection.execute(
      "SELECT * FROM requested_certificate"
    );
    await connection.end();

    res.render("institute/view-requests", {
      requests: rows,
      user: req.session.username, // Pass username to the EJS template
    });
  } catch (error) {
    console.error("Error fetching requests from the database:", error);
    res.render("institute/view-requests", {
      requests: [],
      user: req.session.username, // Pass username to the EJS template
      error: "Error fetching requests from the database",
    });
  }
};

// History controller
exports.history = async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "Raatul",
      password: "",
      database: "verifichain",
    });

    const [rows] = await connection.execute(
      "SELECT * FROM university_verified_certificates WHERE Institute = ?",
      [req.session.username] // Assuming req.session.username holds the institute's name
    );
    await connection.end();

    res.render("institute/history", {
      history: rows,
      user: req.session.username, // Pass username to the EJS template
    });
  } catch (error) {
    console.error("Error fetching history from the database:", error);
    res.render("institute/history", {
      history: [],
      user: req.session.username, // Pass username to the EJS template
      error: "Error fetching history from the database",
    });
  }
};

// Upload verified certificate controller
exports.uploadVerifiedCertificate = [
  upload.single("certificate"),
  async (req, res) => {
    const {
      username,
      fullName,
      certificateName,
      institute,
      certificateType,
      certificateID,
      verifier,
      verifierContact,
      timeVerified,
      encryptionKey,
      ipfsCID,
    } = req.body;
    const filename = req.file ? req.file.filename : null;

    if (!filename) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const connection = await mysql.createConnection({
        host: "localhost",
        user: "Raatul",
        password: "",
        database: "verifichain",
      });

      // Insert the verified certificate information into the database
      await connection.execute(
        `INSERT INTO university_verified_certificates (
          username, full_name, certificate_name, institute, certificate_type, certificate_id,
          filename, verifier, verifier_contact, time_verified, ipfs_cid, encryption_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          fullName,
          certificateName,
          institute,
          certificateType,
          certificateID,
          filename,
          verifier,
          verifierContact,
          timeVerified,
          ipfsCID,
          encryptionKey,
        ]
      );

      // Notify the admin and the user
      const notificationMessage = `Certificate ${certificateID} has been verified by ${institute}`;
      await connection.execute(
        "INSERT INTO ins_notifications (recipient_role, message) VALUES (?, ?), (?, ?)",
        ["Admin", notificationMessage, "Applicant", notificationMessage]
      );

      await connection.end();

      res
        .status(200)
        .json({ message: "Certificate verified and uploaded successfully." });
    } catch (error) {
      console.error("Error uploading verified certificate:", error);
      res.status(500).json({ error: "Error uploading verified certificate" });
    }
  },
];
