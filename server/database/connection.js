const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const host = process.env.MYSQL_HOST || "localhost";
const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
const user = process.env.MYSQL_USER || "root";
const password = process.env.MYSQL_PASSWORD || "";
const database = process.env.MYSQL_DATABASE || "quizDB";

if (!user || !database) {
  console.error("❌ Error: MYSQL_USER and MYSQL_DATABASE must be defined in the .env file.");
  process.exit(1);
}

const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

const connectToDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255),
        reset_token_expiration BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    connection.release();
    console.log("✅ MySQL connected successfully!");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
};

const getDb = () => {
  if (!pool) {
    throw new Error("❌ Database pool is not available. Call connectToDatabase first.");
  }
  return pool;
};

const gracefulShutdown = async () => {
  try {
    await pool.end();
    console.log("✅ MySQL connection pool closed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during MySQL shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

module.exports = {
  connectToDatabase,
  getDb,
};
