/**
 * Programming Quiz Website - web server.
 *
 * Serves the static client and provides a small JSON API for
 * registration, login, sessions, profile management and password reset.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", "config", ".env") });

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mime = require("mime-types");

const { connectToDatabase } = require("./database/connection");
const {
  createUser,
  findByEmail,
  findById,
  findByResetToken,
  updatePassword,
  updateProfile,
  setResetToken,
} = require("./models/userModel");
const { getAllQuestions } = require("./models/questionModel");
const {
  SESSION_COOKIE,
  signSession,
  verifySession,
  parseCookies,
  sessionCookieHeader,
  clearSessionCookieHeader,
} = require("./utils/session");
const { validateEmail, validatePassword, validateUsername, validateRegistrationInput } = require("./utils/validation");

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const CLIENT_PUBLIC_DIR = path.join(__dirname, "..", "client", "public");
const ONE_DAY_SECONDS = 24 * 60 * 60;
const THIRTY_DAYS_SECONDS = 30 * ONE_DAY_SECONDS;

if (!SESSION_SECRET) {
  console.warn("Warning: SESSION_SECRET is not set. Sessions will not be secure. Add SESSION_SECRET to config/.env.");
}

const HTML_PAGES = {
  "/": "login.html",
  "/login.html": "login.html",
  "/register.html": "register.html",
  "/index.html": "index.html",
  "/quiz.html": "quiz.html",
  "/profile.html": "profile.html",
  "/forget.html": "forget.html",
};

const STATIC_EXTENSIONS = [".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp"];

/* ------------------------------------------------------------------ */
/* Response / request helpers                                          */
/* ------------------------------------------------------------------ */

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function serveStaticFile(res, filePath) {
  const fullPath = path.join(CLIENT_PUBLIC_DIR, filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      console.error(`Error serving ${filePath}:`, err.message);
      const statusCode = err.code === "ENOENT" ? 404 : 500;
      const message = err.code === "ENOENT" ? "File Not Found" : "Internal Server Error";
      res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(message);
    }

    const contentType = mime.lookup(filePath) || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

/**
 * Read the request body and parse it as JSON (preferred) or URL-encoded.
 * @returns {Promise<Object>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        const contentType = String(req.headers["content-type"] || "").toLowerCase();
        if (contentType.includes("application/json")) {
          resolve(raw.trim() ? JSON.parse(raw) : {});
        } else {
          const params = new URLSearchParams(raw);
          const body = {};
          for (const [key, value] of params) body[key] = value;
          resolve(body);
        }
      } catch (_err) {
        reject(new Error("Invalid request body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Resolve the currently logged-in user from the session cookie, or null.
 */
async function getAuthenticatedUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  const userId = verifySession(token, SESSION_SECRET);
  if (!userId) return null;
  return findById(userId);
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/* ------------------------------------------------------------------ */
/* Auth handlers                                                       */
/* ------------------------------------------------------------------ */

async function handleRegister(req, res) {
  const body = await readBody(req);
  const username = String(body.username || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const errors = validateRegistrationInput({ username, email, password });
  if (errors.length > 0) {
    return sendJson(res, 400, { success: false, message: errors.join(" ") });
  }

  const existing = await findByEmail(email);
  if (existing) {
    return sendJson(res, 400, { success: false, message: "Email is already registered." });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await createUser(username, email, hashedPassword);

  sendJson(res, 201, { success: true, message: "Registration successful. Please log in." });
}

async function handleLogin(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const remember = body.remember === true || body.remember === "true" || body.remember === "on";

  if (!validateEmail(email)) {
    return sendJson(res, 400, { success: false, message: "Please provide a valid email address." });
  }
  if (!password) {
    return sendJson(res, 400, { success: false, message: "Password is required." });
  }

  const user = await findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return sendJson(res, 400, { success: false, message: "Invalid email or password." });
  }

  const token = signSession(user.id, SESSION_SECRET);
  const maxAge = remember ? THIRTY_DAYS_SECONDS : undefined;
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Set-Cookie": sessionCookieHeader(token, maxAge),
  });
  res.end(JSON.stringify({ success: true, message: "Login successful." }));
}

async function handleLogout(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Set-Cookie": clearSessionCookieHeader(),
  });
  res.end(JSON.stringify({ success: true, message: "Logged out." }));
}

/* ------------------------------------------------------------------ */
/* Profile handlers                                                    */
/* ------------------------------------------------------------------ */

async function handleProfileGet(req, res) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return sendJson(res, 401, { success: false, message: "You must be logged in to view your profile." });
  }

  sendJson(res, 200, {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      joinedDate: user.created_at ? new Date(user.created_at).toISOString() : null,
      // Quiz performance is tracked in the browser (localStorage) - this field is kept for API parity.
      performance: [],
    },
  });
}

async function handleProfileUpdate(req, res) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return sendJson(res, 401, { success: false, message: "You must be logged in to update your profile." });
  }

  const body = await readBody(req);
  const username = String(body.username || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const newPassword = typeof body.password === "string" && body.password.trim() ? body.password : null;

  const errors = [];
  if (!validateUsername(username)) errors.push("Username must be between 3 and 100 characters.");
  if (!validateEmail(email)) errors.push("Please provide a valid email address.");
  if (newPassword !== null && !validatePassword(newPassword)) {
    errors.push("Password must be at least 8 characters and include a letter and a number.");
  }
  if (errors.length > 0) {
    return sendJson(res, 400, { success: false, message: errors.join(" ") });
  }

  if (email !== user.email) {
    const clash = await findByEmail(email);
    if (clash && clash.id !== user.id) {
      return sendJson(res, 400, { success: false, message: "Email is already in use." });
    }
  }

  await updateProfile(user.id, username, email);
  if (newPassword !== null) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await updatePassword(user.id, hashedPassword);
  }

  sendJson(res, 200, { success: true, message: "Profile updated successfully." });
}

/* ------------------------------------------------------------------ */
/* Password reset handlers                                             */
/* ------------------------------------------------------------------ */

async function handleForgot(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();

  if (!validateEmail(email)) {
    return sendJson(res, 400, { success: false, message: "Please provide a valid email address." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const user = await findByEmail(email);
  if (!user) {
    // Do not reveal whether the address exists.
    return sendJson(res, 200, {
      success: true,
      message: "If that email address is registered, a reset link has been generated.",
    });
  }

  await setResetToken(user.id, hashResetToken(resetToken), Date.now() + 60 * 60 * 1000);
  const resetLink = `http://${req.headers.host || `localhost:${PORT}`}/forget.html?token=${resetToken}`;
  // No email provider is configured, so we return the link in the response (and log it).
  console.log(`Password reset link for ${email}: ${resetLink}`);
  sendJson(res, 200, {
    success: true,
    message: "Reset link generated. For now the link is shown below since no email service is configured.",
    resetLink,
  });
}

async function handlePasswordReset(req, res) {
  const body = await readBody(req);
  const token = String(body.token || "").trim();
  const newPassword = String(body.newPassword || "");

  if (!token) {
    return sendJson(res, 400, { success: false, message: "Reset token is required." });
  }
  if (!validatePassword(newPassword)) {
    return sendJson(res, 400, {
      success: false,
      message: "Password must be at least 8 characters and include a letter and a number.",
    });
  }

  const user = await findByResetToken(hashResetToken(token));
  if (!user) {
    return sendJson(res, 400, { success: false, message: "Invalid or expired reset token." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await updatePassword(user.id, hashedPassword);

  sendJson(res, 200, { success: true, message: "Password has been reset. Please log in." });
}

/* ------------------------------------------------------------------ */
/* Main server                                                         */
/* ------------------------------------------------------------------ */

const server = http.createServer(async (req, res) => {
  try {
    const base = `http://${req.headers.host || `localhost:${PORT}`}`;
    const { pathname } = new URL(req.url, base);

    if (req.method === "GET") {
      if (pathname === "/api/questions") {
        const questions = await getAllQuestions();
        return sendJson(res, 200, questions);
      }
      if (pathname === "/api/user/profile") {
        return handleProfileGet(req, res);
      }
      if (HTML_PAGES[pathname]) {
        return serveStaticFile(res, HTML_PAGES[pathname]);
      }
      const extension = path.extname(pathname).toLowerCase();
      if (STATIC_EXTENSIONS.includes(extension)) {
        return serveStaticFile(res, pathname);
      }
      return sendJson(res, 404, { success: false, message: "Not found." });
    }

    if (req.method === "POST") {
      if (pathname === "/register") return handleRegister(req, res);
      if (pathname === "/login") return handleLogin(req, res);
      if (pathname === "/logout") return handleLogout(req, res);
      if (pathname === "/forgot") return handleForgot(req, res);
      if (pathname === "/reset") return handlePasswordReset(req, res);
    }

    if (req.method === "PUT" && pathname === "/api/user/profile") {
      return handleProfileUpdate(req, res);
    }

    return sendJson(res, 404, { success: false, message: "Not found." });
  } catch (err) {
    console.error(`Error handling ${req.method} ${req.url}:`, err.message);
    return sendJson(res, 500, { success: false, message: "Internal server error." });
  }
});

(async () => {
  if (process.env.SKIP_DB_CONNECT === "1") {
    console.warn("Skipping database connection (SKIP_DB_CONNECT=1). Auth endpoints will fail until MySQL is available.");
  } else {
    try {
      await connectToDatabase();
      console.log("Ready with MySQL!");
    } catch (error) {
      console.error("Failed to connect to MySQL:", error.message);
      process.exit(1);
    }
  }

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
})();
