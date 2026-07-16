import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env, hasResendEnv, hasDiscordEnv } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validate, type ContactRequestBody, type ValidatedContact } from "@/lib/contact-validation";

export const runtime = "nodejs";

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
