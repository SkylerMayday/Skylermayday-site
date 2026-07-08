import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env, hasResendEnv, hasDiscordEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_NAME_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactRequestBody {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown; // honeypot — must be empty
}

interface ValidatedContact {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function validate(body: ContactRequestBody): { errors: string[]; data: ValidatedContact | null } {
  const errors: string[] = [];

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subjectRaw = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > MAX_NAME_LENGTH) errors.push("name");
  if (!email || !EMAIL_PATTERN.test(email) || email.length > MAX_NAME_LENGTH) errors.push("email");
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

async function sendContactEmail(data: ValidatedContact): Promise<boolean> {
  if (!hasResendEnv()) {
    console.warn("[contact] Resend env not configured; skipping email send.");
    return false;
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      replyTo: data.email,
      subject: `[SkylerMayday.com] ${data.subject}`,
      text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
    });

    if (result.error) {
      console.error("[contact] Resend send returned an error:", result.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[contact] Resend send threw:", err);
    return false;
  }
}

/**
 * Vercel populates `x-forwarded-for` on serverless requests; the client IP
 * is the first entry in that comma-separated list (Vercel prepends the real
 * client IP; downstream proxies append). Vercel does not expose `request.ip`
 * on the standard `Request` in a route handler, and `x-real-ip` is also set
 * by Vercel as a single value — use it as a fallback.
 *
 * Note on spoofability: `x-forwarded-for` is client-settable in general,
 * but on Vercel the platform overwrites/prepends the true client IP, so
 * trusting the first entry is correct for this deployment target. We do
 * not attempt to defend against a caller who bypasses Vercel's edge — not
 * reachable for a Vercel-hosted site.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // First hop is the real client IP on Vercel; trim whitespace.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  // Last resort: a single shared bucket. Fail toward limiting (shared bucket)
  // rather than failing open per-request, since a missing IP on Vercel is
  // abnormal and we'd rather rate-limit an anomaly than let it bypass.
  return "unknown";
}

async function fireDiscordWebhook(data: ValidatedContact): Promise<boolean> {
  if (!hasDiscordEnv()) {
    console.warn("[contact] Discord webhook env not configured; skipping.");
    return false;
  }

  try {
    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "New contact form submission",
            fields: [
              { name: "Name", value: data.name, inline: true },
              { name: "Email", value: data.email, inline: true },
              { name: "Subject", value: data.subject },
              {
                name: "Message",
                value: data.message.length > 1000 ? `${data.message.slice(0, 1000)}…` : data.message,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[contact] Discord webhook non-2xx: ${response.status}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[contact] Discord webhook threw:", err);
    return false;
  }
}

export async function POST(request: Request) {
  let body: ContactRequestBody;

  try {
    body = (await request.json()) as ContactRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "validation", fields: ["body"] },
      { status: 400 }
    );
  }

  // Honeypot: real users never fill this hidden field. Silently succeed
  // without sending anything, so bots get no signal that they were caught.
  const honeypot = typeof body.company === "string" ? body.company.trim() : "";
  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { errors, data } = validate(body);
  if (!data) {
    return NextResponse.json({ ok: false, error: "validation", fields: errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "RateLimit-Limit": String(rate.limit),
          "RateLimit-Remaining": String(rate.remaining),
          "RateLimit-Reset": String(Math.ceil((rate.resetAtMs - Date.now()) / 1000)),
        },
      }
    );
  }

  // Both legs attempted regardless of the other's outcome (spec §7 step 4).
  const [emailSent, webhookSent] = await Promise.all([
    sendContactEmail(data),
    fireDiscordWebhook(data),
  ]);

  if (!webhookSent) {
    console.warn("[contact] Discord webhook failed or not configured; email result still governs response.");
  }

  // Response is decided by the email result — the primary delivery
  // channel. Webhook is only a ping and never blocks a successful
  // submission (spec §7 step 4 / §6 edge cases table).
  if (emailSent) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "delivery" }, { status: 502 });
}
