"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

type SubmitStatus = "idle" | "pending" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LENGTH = 10;

export default function ContactForm() {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(itemParam ? `Re: ${itemParam}` : "");
  const [message, setMessage] = useState("");
  // Honeypot field — real users never fill this; bots often do.
  const [company, setCompany] = useState("");

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function validate(): string[] {
    const fieldErrors: string[] = [];
    if (!name.trim()) fieldErrors.push("name");
    if (!email.trim() || !EMAIL_PATTERN.test(email.trim())) fieldErrors.push("email");
    if (!message.trim() || message.trim().length < MIN_MESSAGE_LENGTH) fieldErrors.push("message");
    return fieldErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fieldErrors = validate();
    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      setStatus("idle");
      return;
    }

    setErrors([]);
    setErrorMessage(null);
    setStatus("pending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, company }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        fields?: string[];
      };

      if (response.ok && data.ok) {
        setStatus("success");
        return;
      }

      // Message is preserved on error — do not clear the form fields.
      setStatus("error");
      if (data.error === "validation" && data.fields) {
        setErrors(data.fields);
        setErrorMessage("Please check the highlighted fields and try again.");
      } else {
        setErrorMessage("Something went wrong sending your message. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error — please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      // Retokened off raw emerald onto --success (globals.css). The token is
      // used as a tint + hairline only, never as the text colour: at #1F8A5F
      // it clears the 3:1 non-text floor on both backgrounds but not the
      // 4.5:1 text floor in light mode, so the message body stays on --fg.
      <div className="rounded-lg border border-success/50 bg-success/10 p-6 text-fg" role="status">
        Thanks — I&apos;ll get back to you.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          // aria-invalid so the error state is not signalled by border colour
          // alone (design-implementation Phase 4's Web Interface Guidelines
          // forms rules).
          aria-invalid={errors.includes("name") || undefined}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={`rounded-lg border bg-surface px-3 py-2 text-base text-fg ${
            errors.includes("name") ? "border-danger" : "border-border"
          }`}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.includes("email") || undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`rounded-lg border bg-surface px-3 py-2 text-base text-fg ${
            errors.includes("email") ? "border-danger" : "border-border"
          }`}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium">
          {/* text-fg-muted (7.27:1) — was text-neutral-400, which computed to
              2.36:1 on the new --bg and was already a hard AA failure at
              2.53:1 on the old white background (Stage 4 verdict,
              Correction B). */}
          Subject <span className="text-fg-muted">(optional)</span>
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-base text-fg"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          aria-invalid={errors.includes("message") || undefined}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          className={`rounded-lg border bg-surface px-3 py-2 text-base text-fg ${
            errors.includes("message") ? "border-danger" : "border-border"
          }`}
          required
        />
      </div>

      {/* Honeypot — hidden from real users via CSS, bots often fill every field. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* --danger in light (5.28:1) / --danger-soft in dark (8.62:1). The
          saturated --danger only reaches 3.44:1 on the dark --bg, so it is a
          fill/border colour there, not a text colour — hence the paired soft
          form, exactly like --brand / --brand-soft. */}
      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm font-medium text-danger dark:text-danger-soft">
          {errorMessage}
        </p>
      )}

      {/* Single primary-button recipe sitewide: --brand fill, white text
          (4.64:1), --brand-strong on hover.

          Deliberately NOT dimmed while disabled. The only state that disables
          this button is `pending`, i.e. the moment it reads "Sending…" — the
          one moment the user most needs the status legible. `disabled:opacity-60`
          composited it to 2.53:1 in light mode. WCAG 1.4.3 exempts inactive
          controls so that was never a gate failure, but opacity was signalling
          the wrong thing: pending is "busy", not "invalid". The `disabled`
          attribute alone makes it non-interactive; `cursor-not-allowed` and
          the changed label carry the affordance. (DESIGN.md §5.4.) */}
      <button
        type="submit"
        disabled={status === "pending"}
        className="w-fit rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-strong disabled:cursor-not-allowed motion-reduce:transition-none"
      >
        {status === "pending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
