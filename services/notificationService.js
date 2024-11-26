const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "Raatul",
  password: "",
  database: "verifichain",
};

const NotificationService = {
  async sendNotificationToApplicant({
    companyUsername,
    applicantUsername,
    certificateID,
  }) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const query = `
        INSERT INTO notifications (company_user_id, applicant_user_id, certificate_id, status, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const message = `${companyUsername} has requested access to your certificate with ID ${certificateID}`;
      await connection.execute(query, [
        companyUsername,
        applicantUsername,
        certificateID,
        "Pending",
        message,
        new Date(),
      ]);
      connection.end();
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  },

  async getNotificationsForApplicant(applicantUsername) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const query = "SELECT * FROM notifications WHERE applicant_user_id = ?";
      const [rows] = await connection.execute(query, [applicantUsername]);
      connection.end();
      return rows;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  async getNotificationsForCompany(companyUsername) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const query = "SELECT * FROM notifications WHERE company_user_id = ?";
      const [rows] = await connection.execute(query, [companyUsername]);
      connection.end();
      return rows;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  async updateNotificationStatus(notificationId, status) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const query = "UPDATE notifications SET status = ? WHERE id = ?";
      await connection.execute(query, [status, notificationId]);
      connection.end();
    } catch (error) {
      console.error("Error updating notification status:", error);
      throw error;
    }
  },

  async getNotificationById(notificationId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const query = "SELECT * FROM notifications WHERE id = ?";
      const [rows] = await connection.execute(query, [notificationId]);
      connection.end();
      return rows[0];
    } catch (error) {
      console.error("Error fetching notification by ID:", error);
      throw error;
    }
  },

  async sendNotificationToCompany({
    companyUsername,
    applicantUsername,
    certificateID,
    message,
  }) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const query = `
        INSERT INTO notifications (company_user_id, applicant_user_id, certificate_id, status, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await connection.execute(query, [
        companyUsername,
        applicantUsername,
        certificateID,
        "Info",
        message,
        new Date(),
      ]);
      connection.end();
    } catch (error) {
      console.error("Error sending notification to company:", error);
      throw error;
    }
  },

  async deleteNotification(notificationId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const query = "DELETE FROM notifications WHERE id = ?";
      await connection.execute(query, [notificationId]);
      connection.end();
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },
};

module.exports = NotificationService;
