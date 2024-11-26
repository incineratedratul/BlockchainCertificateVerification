const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");

// Middleware to check if the user is authenticated and is an admin
function isAuthenticated(req, res, next) {
  if (req.session.role === "Admin") {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Admin Dashboard
router.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("admin/dashboard", { user: req.session });
});

// View all certificates
router.get("/view-certificates", isAuthenticated, async (req, res) => {
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
    connection.end();

    res.render("admin/view-certificates", {
      certificates: rows,
      user: req.session,
    });
  } catch (error) {
    console.error("Error fetching certificates from the database:", error);
    res.render("admin/view-certificates", {
      certificates: [],
      user: req.session,
      error: "Error fetching certificates from the database",
    });
  }
});

// Send verification request to the institute
router.post("/send-request", isAuthenticated, async (req, res) => {
  const { certificateID, institute } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "Raatul",
      password: "",
      database: "verifichain",
    });

    // Create a notification for the institute
    await connection.execute(
      "INSERT INTO notifications (recipient_role, recipient_id, message) VALUES (?, ?, ?)",
      [
        "Institute",
        institute,
        `Verification request for certificate ID: ${certificateID}`,
      ]
    );

    connection.end();

    res.redirect("/admin/view-certificates");
  } catch (error) {
    console.error("Error sending verification request:", error);
    res.redirect("/admin/view-certificates");
  }
});

// View Requests page
router.get("/view-requests", isAuthenticated, (req, res) => {
  res.render("admin/view-requests", { user: req.session });
});

// Verify Requests page
router.get("/verify-requests", isAuthenticated, (req, res) => {
  res.render("admin/verify-requests", { user: req.session });
});

// Input Blockchain page
router.get("/input-blockchain", isAuthenticated, (req, res) => {
  res.render("admin/input-blockchain", { user: req.session });
});

// Input to IPFS page
router.get("/input-ipfs", isAuthenticated, (req, res) => {
  res.render("admin/input-ipfs", { user: req.session });
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

    const [rows] = await connection.execute(
      "SELECT * FROM notifications WHERE recipient_role = ?",
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

module.exports = router;
