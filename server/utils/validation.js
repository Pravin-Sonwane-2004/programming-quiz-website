/**
 * Shared validation helpers used by the API routes.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function validateUsername(username) {
  return (
    typeof username === "string" &&
    username.trim().length >= 3 &&
    username.trim().length <= 100
  );
}

/**
 * Validate a registration payload and return a list of human-readable errors.
 * @returns {string[]}
 */
function validateRegistrationInput({ username, email, password } = {}) {
  const errors = [];
  if (!validateUsername(username)) {
    errors.push("Username must be at least 3 characters long.");
  }
  if (!validateEmail(email)) {
    errors.push("Please provide a valid email address.");
  }
  if (!validatePassword(password)) {
    errors.push("Password must be at least 8 characters and include a letter and a number.");
  }
  return errors;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRegistrationInput,
};