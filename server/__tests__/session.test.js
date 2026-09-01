const {
  signSession,
  verifySession,
  parseCookies,
  sessionCookieHeader,
  clearSessionCookieHeader,
  SESSION_COOKIE,
} = require("../utils/session");

const SECRET = "test-secret";

describe("session cookie helpers", () => {
  test("signSession + verifySession round-trips a user id", () => {
    const token = signSession(42, SECRET);
    expect(verifySession(token, SECRET)).toBe(42);
  });

  test("verifySession returns null for a wrong secret", () => {
    const token = signSession(42, SECRET);
    expect(verifySession(token, "other-secret")).toBeNull();
  });

  test("verifySession rejects tampered tokens", () => {
    const token = signSession(42, SECRET);
    const [payload] = token.split(".");
    const tampered = `${payload}.AAAA`;
    expect(verifySession(tampered, SECRET)).toBeNull();
  });

  test("verifySession rejects garbage input", () => {
    expect(verifySession("", SECRET)).toBeNull();
    expect(verifySession(null, SECRET)).toBeNull();
    expect(verifySession("not-a-token", SECRET)).toBeNull();
    expect(verifySession("a.b.c", SECRET)).toBeNull();
  });

  test("parseCookies reads the session cookie", () => {
    const req = { headers: { cookie: `other=1; ${SESSION_COOKIE}=abc; foo=bar` } };
    expect(parseCookies(req)[SESSION_COOKIE]).toBe("abc");
  });

  test("sessionCookieHeader includes Secured options and optional Max-Age", () => {
    const header = sessionCookieHeader("abc", 3600);
    expect(header).toContain(`${SESSION_COOKIE}=abc`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Max-Age=3600");
  });

  test("sessionCookieHeader omits Max-Age when not requested", () => {
    const header = sessionCookieHeader("abc");
    expect(header).not.toContain("Max-Age");
  });

  test("clearSessionCookieHeader expires the cookie", () => {
    const header = clearSessionCookieHeader();
    expect(header).toContain("Max-Age=0");
    expect(header).toContain(`${SESSION_COOKIE}=`);
  });
});