import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isAllowed, SA_PROXY_RATE_LIMIT } from "@/lib/stream-analyser/allowed-domains";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  if (!isAllowed(url)) {
    return new Response("URL not allowed", { status: 403 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`sa-proxy:${ip}`, Date.now(), SA_PROXY_RATE_LIMIT);
  if (!rate.allowed) {
    return new Response("Rate limited", {
      status: 429,
      headers: {
        "Retry-After": String(rate.retryAfterSeconds),
        "RateLimit-Limit": String(rate.limit),
        "RateLimit-Remaining": String(rate.remaining),
      },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch (err) {
    return new Response(`Proxy error: ${(err as Error).message}`, { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`Upstream returned ${upstream.status}`, { status: 502 });
  }

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") || "application/vnd.apple.mpegurl";

  return new Response(text, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}
