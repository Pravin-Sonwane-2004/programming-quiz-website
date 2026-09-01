/**
 * Minimal stateless session helpers using HMAC-signed cookies.
 * No server-side session storage is required.
 */
const crypto = require("crypto");

const SESSION_COOKIE = "quiz_session";

/**
 * Sign a user id into an opaque, tamper-proof session token.
 * @param {number|string} value - user id
 * @param {string} secret - SESSION_SECRET
 * @returns {string} `payload.signature`
 */
function signSession(value, secret) {
  const payload = Buffer.from(String(value), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verify a session token and return the user id, or null when invalid.
 * @param {string} token
 * @param {string} secret
 * @returns {number|null}
 */
function verifySession(token, secret) {
  if (typeof token !== "string" || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  let expectedSignature;
  try {
    expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(parts[0])
      .digest("base64url");
  } catch (_err) {
    return null;
  }

  try {
    const expected = Buffer.from(expectedSignature, "base64url");
    const actual = Buffer.from(parts[1], "base64url");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return null;
    }
  } catch (_err) {
    return null;
  }

  const userId = parseInt(Buffer.from(parts[0], "base64url").toString("utf8"), 10);
  return Number.isNaN(userId) ? null : userId;
}

/**
 * Parse the Cookie header of a request into an object.
 * @param {http.IncomingMessage} req
 * @returns {Object.<string,string>}
 */
function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || "";
  header.split(";").forEach((part) => {
    const eq = part.indexOf("=");
    if (eq === -1) return;
    const key = part.slice(0, eq).trim();
    let value = part.slice(eq + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch (_err) {
      /* keep raw value */
    }
    if (key) cookies[key] = value;
  });
  return cookies;
}

/**
 * Build a Set-Cookie header value for a signed session token.
 * @param {string} token
 * @param {number|undefined} maxAgeSeconds
 * @returns {string}
 */
function sessionCookieHeader(token, maxAgeSeconds) {
  let value = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax`;
  if (maxAgeSeconds) value += `; Max-Age=${maxAgeSeconds}`;
  return value;
}

/**
 * Build a Set-Cookie header value that clears the session cookie.
 * @returns {string}
 */
function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

module.exports = {
  SESSION_COOKIE,
  signSession,
  verifySession,
  parseCookies,
  sessionCookieHeader,
  clearSessionCookieHeader,
};