const mysql = require("mysql2/promise");

// Database connection configuration
const dbConfig = {
  host: "localhost",
  user: "Raatul",
  password: "",
  database: "verifichain",
};

exports.login = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);

    let query;
    if (role === "Applicant") {
      query = "SELECT * FROM applicant WHERE Username = ? AND Password = ?";
    } else if (role === "Institute") {
      query = "SELECT * FROM institute WHERE Username = ? AND Password = ?";
    } else if (role === "Admin") {
      if (username === "admin" && password === "admin") {
        req.session.role = "Admin";
        req.session.username = "admin";
        return res.redirect("/admin/dashboard");
      } else {
        return res.status(401).send("Invalid credentials");
      }
    } else {
      return res.status(401).send("Invalid role");
    }

    const [rows] = await connection.execute(query, [username, password]);

    if (rows.length > 0) {
      req.session.role = role;
      req.session.username = username;
      if (role === "Applicant") {
        res.redirect("/applicant/dashboard");
      } else if (role === "Institute") {
        res.redirect("/institute/dashboard");
      }
    } else {
      res.status(401).send("Invalid credentials");
    }

    connection.end();
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Server error");
  }
};
