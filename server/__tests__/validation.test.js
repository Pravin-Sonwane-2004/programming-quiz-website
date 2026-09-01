const {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRegistrationInput,
} = require("../utils/validation");

describe("validation helpers", () => {
  test("validateEmail accepts valid addresses and rejects invalid ones", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail(" user.name+tag@example.co.uk ")).toBe(true);
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("a@b")).toBe(false);
  });

  test("validatePassword enforces 8+ chars with a letter and a number", () => {
    expect(validatePassword("Password1")).toBe(true);
    expect(validatePassword("Password1!")).toBe(true);
    expect(validatePassword("short1")).toBe(false);
    expect(validatePassword("alllowercase1")).toBe(true);
    expect(validatePassword("NoNumbersHere")).toBe(false);
    expect(validatePassword("12345678")).toBe(false);
    expect(validatePassword("")).toBe(false);
  });

  test("validateUsername requires 3 to 100 characters", () => {
    expect(validateUsername("Bob")).toBe(true);
    expect(validateUsername("  Ali  ")).toBe(true);
    expect(validateUsername("Bo")).toBe(false);
    expect(validateUsername("x".repeat(200))).toBe(false);
  });

  test("validateRegistrationInput returns a list of errors", () => {
    const errors = validateRegistrationInput({
      username: "Bo",
      email: "bad-email",
      password: "weak",
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  test("validateRegistrationInput returns no errors for valid input", () => {
    const errors = validateRegistrationInput({
      username: "Alice",
      email: "alice@example.com",
      password: "StrongPass1",
    });
    expect(errors).toEqual([]);
  });
});