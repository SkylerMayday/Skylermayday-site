// Extracted out of app/api/contact/route.ts (not left there) because Next.js's
// generated route-type check (.next/types/app/**/route.ts) enforces that a
// route.ts file may only export recognized route handlers/config (GET, POST,
// runtime, etc.) — any other export fails `tsc --noEmit` with a
// checkFields<Diff<...>> error. Moving the pure, side-effect-free validation
// core here keeps it unit-testable without importing next/server's route
// module and without breaking that generated check. See .pipeline/changes.md
// "Findings" for the full explanation (this deviates from specs.md R2, which
// called for exporting directly from route.ts).

export const MAX_NAME_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 254; // RFC 5321 practical max (64 local + '@' + 255 domain, capped in practice)
export const MAX_SUBJECT_LENGTH = 300;
export const MAX_MESSAGE_LENGTH = 5000;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactRequestBody {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown; // honeypot — must be empty
}

export interface ValidatedContact {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function validate(body: ContactRequestBody): { errors: string[]; data: ValidatedContact | null } {
  const errors: string[] = [];

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subjectRaw = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > MAX_NAME_LENGTH) errors.push("name");
  if (!email || !EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) errors.push("email");
  if (subjectRaw.length > MAX_SUBJECT_LENGTH) errors.push("subject");
  if (!message || message.length > MAX_MESSAGE_LENGTH) errors.push("message");

  if (errors.length > 0) {
    return { errors, data: null };
  }

  return {
    errors: [],
    data: {
      name,
      email,
      subject: subjectRaw || "New contact",
      message,
    },
  };
}
