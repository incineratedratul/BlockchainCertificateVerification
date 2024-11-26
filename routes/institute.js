const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const { create } = require("ipfs-http-client");
const path = require("path");

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.role === "Institute") {
    return next();
  } else {
    res.redirect("/login");
  }
}

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

// Dashboard page
router.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("institute/dashboard", { user: req.session });
});

// View Requests page
router.get("/view-requests", isAuthenticated, async (req, res) => {
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
});

// History page
router.get("/history", isAuthenticated, async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "Raatul",
      password: "",
      database: "verifichain",
    });

    const [rows] = await connection.execute(
      "SELECT * FROM university_verified_certificates WHERE institute = ?",
      [req.session.username]
    );
    await connection.end();

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

// Notifications page
router.get("/notifications", isAuthenticated, async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "Raatul",
      password: "",
      database: "verifichain",
    });

    res.render("institute/notifications", {
      notifications: rows,
      user: req.session,
    });
  } catch (error) {
    console.error("Error fetching notifications from the database:", error);
    res.render("institute/notifications", {
      notifications: [],
      user: req.session,
      error: "Error fetching notifications from the database",
    });
  }
});

// New route to render verify-certificate page
router.get("/verify-certificate", isAuthenticated, (req, res) => {
  const { certificateID } = req.query;
  res.render("institute/verify-certificate", { certificateID });
});

let ipfs;

async function initIPFS() {
  if (!ipfs) {
    ipfs = create({
      host: "localhost",
      port: 5001,
      protocol: "http",
    });
  }
}

async function encryptAndUploadToIPFS(fileBuffer, password) {
  await initIPFS();

  // Encryption setup
  const iv = crypto.randomBytes(12);
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encryptedBuffer = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const combinedBuffer = Buffer.concat([salt, iv, encryptedBuffer, authTag]);

  try {
    const result = await ipfs.add(combinedBuffer);
    return { ipfsCID: result.path, encryptionKey: password };
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw error;
  }
}

router.post(
  "/upload-verified-certificate",
  isAuthenticated,
  upload.single("certificate"),
  async (req, res) => {
    try {
      const {
        username,
        fullName,
        certificateName,
        institute,
        certificateType,
        verifier,
        verifierContact,
        timeVerified,
        ipfsCID,
        encryptionKey, // Received from the client
      } = req.body;

      const file = req.file;

      if (
        !username ||
        !fullName ||
        !certificateName ||
        !institute ||
        !certificateType ||
        !verifier ||
        !verifierContact ||
        !timeVerified ||
        !file ||
        !ipfsCID ||
        !encryptionKey
      ) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const connection = await mysql.createConnection({
        host: "localhost",
        user: "Raatul",
        password: "",
        database: "verifichain",
      });

      // Generate unique certificate ID
      const certificateID = `CERT-${crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase()}`;

      // Check for duplicate certificate ID
      const [rows] = await connection.execute(
        "SELECT COUNT(*) AS count FROM university_verified_certificates WHERE certificate_id = ?",
        [certificateID]
      );

      if (rows[0].count > 0) {
        return res
          .status(400)
          .json({ error: "Duplicate certificate ID detected. Please retry." });
      }

      const values = [
        username,
        fullName,
        certificateName,
        institute,
        certificateType,
        certificateID,
        file.filename,
        verifier,
        verifierContact,
        timeVerified,
        ipfsCID,
        encryptionKey,
      ];

      await connection.execute(
        "INSERT INTO university_verified_certificates (username, full_name, certificate_name, institute, certificate_type, certificate_id, filename, verifier, verifier_contact, time_verified, ipfs_cid, encryption_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        values
      );

      await connection.end();

      res.status(200).json({
        message: "Certificate verified and uploaded successfully.",
        ipfsCID,
        encryptionKey,
      });
    } catch (error) {
      console.error("Error in upload route:", error);
      res.status(500).json({
        error: "Certificate Uploaded Successfully!",
        details: error.message,
      });
    }
  }
);

module.exports = router;
