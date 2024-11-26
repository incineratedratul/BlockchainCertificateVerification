const mysql = require("mysql2/promise");

exports.notifications = async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "Raatul",
      password: "",
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
};

exports.viewCertificates = async (req, res) => {
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
};

exports.sendRequest = async (req, res) => {
  const { certificateID, institute } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "Raatul",
      password: "",
      database: "verifichain",
    });

    await connection.execute(
      "INSERT INTO ins_notifications (recipient_role, recipient_id, message) VALUES (?, ?, ?)",
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
};
