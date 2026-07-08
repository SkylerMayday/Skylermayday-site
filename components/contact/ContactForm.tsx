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
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
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
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={`rounded border px-3 py-2 dark:bg-neutral-900 ${
            errors.includes("name") ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`rounded border px-3 py-2 dark:bg-neutral-900 ${
            errors.includes("email") ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"
          }`}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          className={`rounded border px-3 py-2 dark:bg-neutral-900 ${
            errors.includes("message") ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"
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

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "pending"}
        className="rounded bg-neutral-900 px-4 py-2 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {status === "pending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
