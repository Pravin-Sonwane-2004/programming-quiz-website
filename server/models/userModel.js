const { getDb } = require("../database/connection");

const createUser = async (username, email, password) => {
  const pool = getDb();
  const [result] = await pool.execute(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password]
  );
  return result;
};

const findByEmail = async (email) => {
  const pool = getDb();
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const pool = getDb();
  const [rows] = await pool.execute(
    "SELECT id, username, email, created_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

const updateProfile = async (userId, username, email) => {
  const pool = getDb();
  await pool.execute(
    "UPDATE users SET username = ?, email = ? WHERE id = ?",
    [username, email, userId]
  );
};

const findByResetToken = async (token) => {
  const pool = getDb();
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiration > ?",
    [token, Date.now()]
  );
  return rows[0] || null;
};

const updatePassword = async (userId, hashedPassword) => {
  const pool = getDb();
  await pool.execute(
    "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?",
    [hashedPassword, userId]
  );
};

const setResetToken = async (userId, token, expiration) => {
  const pool = getDb();
  await pool.execute(
    "UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE id = ?",
    [token, expiration, userId]
  );
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  findByResetToken,
  updatePassword,
  updateProfile,
  setResetToken,
};
