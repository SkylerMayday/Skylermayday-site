import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isAllowed, SA_PROXY_RATE_LIMIT } from "@/lib/stream-analyser/allowed-domains";

export const runtime = "nodejs";

const USER_AGENT = "SkylerMayday-StreamAnalyser/1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const init = searchParams.get("init");
  const seg = searchParams.get("seg");

  if (!init || !seg) {
    return new Response("Missing init or seg", { status: 400 });
  }

  if (!isAllowed(init) || !isAllowed(seg)) {
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

  let initRes: Response;
  let segRes: Response;
  try {
    [initRes, segRes] = await Promise.all([
      fetch(init, { headers: { "User-Agent": USER_AGENT } }),
      fetch(seg, { headers: { "User-Agent": USER_AGENT } }),
    ]);
  } catch (err) {
    return new Response(`Proxy error: ${(err as Error).message}`, { status: 502 });
  }

  if (!initRes.ok || !segRes.ok) {
    return new Response(
      `Upstream returned ${!initRes.ok ? initRes.status : segRes.status}`,
      { status: 502 }
    );
  }

  const [initBytes, segBytes] = await Promise.all([
    initRes.arrayBuffer(),
    segRes.arrayBuffer(),
  ]);

  const combined = new Uint8Array(initBytes.byteLength + segBytes.byteLength);
  combined.set(new Uint8Array(initBytes), 0);
  combined.set(new Uint8Array(segBytes), initBytes.byteLength);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(combined);
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-store",
    },
  });
}
