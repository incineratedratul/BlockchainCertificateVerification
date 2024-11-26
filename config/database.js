const mysql = require('mysql2/promise');

const connection = async () => {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'imdenigma',
    password: 'aaspass',
    database: 'verifichain',
  });
};

module.exports = connection;
