import { describe, it, expect } from "vitest";
import {
  validate,
  MAX_NAME_LENGTH,
  MAX_SUBJECT_LENGTH,
  MAX_MESSAGE_LENGTH,
  type ContactRequestBody,
} from "@/lib/contact-validation";

/** Factory for a valid contact body — override only what a test cares about. */
const validBody = (overrides?: Partial<ContactRequestBody>): ContactRequestBody => ({
  name: "Skyler",
  email: "skyler@example.com",
  subject: "Hello",
  message: "This is a test message.",
  ...overrides,
});

/** Builds a syntactically valid email of an exact length, for boundary tests. */
const emailOfLength = (len: number): string => {
  const suffix = "@b.co"; // 5 chars — valid domain + "." + tld tail
  return "a".repeat(len - suffix.length) + suffix;
};

describe("validate", () => {
  it("happy path: full valid body returns no errors and trimmed data", () => {
    const { errors, data } = validate(validBody());
    expect(errors).toEqual([]);
    expect(data).not.toBeNull();
    expect(data?.subject).toBe("Hello");
  });

  it("trims leading/trailing whitespace on all fields in the returned data", () => {
    const { data } = validate(
      validBody({
        name: "  Skyler  ",
        email: "  skyler@example.com  ",
        subject: "  Hello  ",
        message: "  This is a test message.  ",
      })
    );
    expect(data).toEqual({
      name: "Skyler",
      email: "skyler@example.com",
      subject: "Hello",
      message: "This is a test message.",
    });
  });

  describe("name", () => {
    it("empty string produces a name error", () => {
      const { errors, data } = validate(validBody({ name: "" }));
      expect(errors).toContain("name");
      expect(data).toBeNull();
    });

    it("whitespace-only (trims to empty) produces a name error", () => {
      const { errors, data } = validate(validBody({ name: "   " }));
      expect(errors).toContain("name");
      expect(data).toBeNull();
    });

    it("non-string value (treated as empty) produces a name error", () => {
      const { errors, data } = validate(validBody({ name: 123 }));
      expect(errors).toContain("name");
      expect(data).toBeNull();
    });

    it(`length exactly MAX_NAME_LENGTH (${MAX_NAME_LENGTH}) is OK`, () => {
      const { errors } = validate(validBody({ name: "a".repeat(MAX_NAME_LENGTH) }));
      expect(errors).not.toContain("name");
    });

    it(`length MAX_NAME_LENGTH + 1 produces a name error`, () => {
      const { errors } = validate(validBody({ name: "a".repeat(MAX_NAME_LENGTH + 1) }));
      expect(errors).toContain("name");
    });
  });

  describe("email", () => {
    it("valid address passes", () => {
      const { errors } = validate(validBody({ email: "a@b.co" }));
      expect(errors).not.toContain("email");
    });

    it.each([
      ["ab.co", "missing @"],
      ["a@bco", "missing dot after @"],
      ["@b.co", "empty local part"],
      ["a b@c.co", "contains a space"],
      ["", "empty string"],
    ])("rejects %s (%s)", (email) => {
      const { errors, data } = validate(validBody({ email }));
      expect(errors).toContain("email");
      expect(data).toBeNull();
    });

    // F1 lock: email length is capped by MAX_NAME_LENGTH, not a dedicated
    // MAX_EMAIL_LENGTH — this is a copy-paste smell flagged for Skyler
    // (see .pipeline/changes.md Findings), not an endorsement. This test
    // asserts CURRENT behavior only, so a future fix doesn't regress silently.
    it(`length exactly MAX_NAME_LENGTH (${MAX_NAME_LENGTH}) is OK (F1: reuses name's cap)`, () => {
      const { errors } = validate(validBody({ email: emailOfLength(MAX_NAME_LENGTH) }));
      expect(errors).not.toContain("email");
    });

    it("length MAX_NAME_LENGTH + 1 produces an email error (F1: reuses name's cap)", () => {
      const { errors } = validate(validBody({ email: emailOfLength(MAX_NAME_LENGTH + 1) }));
      expect(errors).toContain("email");
    });
  });

  describe("subject", () => {
    it("empty subject produces NO subject error and defaults data.subject to 'New contact'", () => {
      const { errors, data } = validate(validBody({ subject: "" }));
      expect(errors).not.toContain("subject");
      expect(data?.subject).toBe("New contact");
    });

    it("whitespace-only subject (trims to empty) also defaults to 'New contact'", () => {
      const { errors, data } = validate(validBody({ subject: "   " }));
      expect(errors).not.toContain("subject");
      expect(data?.subject).toBe("New contact");
    });

    it(`length exactly MAX_SUBJECT_LENGTH (${MAX_SUBJECT_LENGTH}) is OK`, () => {
      const { errors } = validate(validBody({ subject: "a".repeat(MAX_SUBJECT_LENGTH) }));
      expect(errors).not.toContain("subject");
    });

    it("length MAX_SUBJECT_LENGTH + 1 produces a subject error", () => {
      const { errors } = validate(validBody({ subject: "a".repeat(MAX_SUBJECT_LENGTH + 1) }));
      expect(errors).toContain("subject");
    });

    it("a missing subject never produces a subject error (no requiredness, only a length cap)", () => {
      const { errors } = validate(validBody({ subject: undefined }));
      expect(errors).not.toContain("subject");
    });
  });

  describe("message", () => {
    it("empty message produces a message error", () => {
      const { errors, data } = validate(validBody({ message: "" }));
      expect(errors).toContain("message");
      expect(data).toBeNull();
    });

    it(`length exactly MAX_MESSAGE_LENGTH (${MAX_MESSAGE_LENGTH}) is OK`, () => {
      const { errors } = validate(validBody({ message: "a".repeat(MAX_MESSAGE_LENGTH) }));
      expect(errors).not.toContain("message");
    });

    it("length MAX_MESSAGE_LENGTH + 1 produces a message error", () => {
      const { errors } = validate(validBody({ message: "a".repeat(MAX_MESSAGE_LENGTH + 1) }));
      expect(errors).toContain("message");
    });
  });

  it("accumulates multiple errors (bad name AND bad email) with data null", () => {
    const { errors, data } = validate(validBody({ name: "", email: "not-an-email" }));
    expect(errors).toContain("name");
    expect(errors).toContain("email");
    expect(data).toBeNull();
  });
});
