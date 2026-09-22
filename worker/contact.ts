interface Env {
  ASSETS: Fetcher;
  CONTACT_RATE_LIMITER: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
  TURNSTILE_SECRET_KEY: string;
  N8N_WEBHOOK_URL: string;
  N8N_SHARED_SECRET: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(payload: unknown): { name: string; email: string; message: string } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;

  const name = typeof p.name === "string" ? p.name.trim() : "";
  const email = typeof p.email === "string" ? p.email.trim() : "";
  const message = typeof p.message === "string" ? p.message.trim() : "";

  if (!name || name.length > 120) return null;
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  if (!message || message.length > 4000) return null;

  return { name, email, message };
}

async function verifyTurnstile(token: string, secret: string, remoteIp: string | null): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) return false;
  const result = (await res.json()) as { success?: boolean };
  return result.success === true;
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(400, { ok: false, error: "Invalid request" });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  const { success: withinRateLimit } = await env.CONTACT_RATE_LIMITER.limit({ key: ip });
  if (!withinRateLimit) {
    return jsonResponse(429, { ok: false, error: "Too many requests. Please try again shortly." });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid request" });
  }

  // Honeypot: hidden from real users, only a bot fills every field.
  const honeypot = typeof (payload as Record<string, unknown>)?.company === "string"
    ? ((payload as Record<string, unknown>).company as string).trim()
    : "";
  if (honeypot !== "") {
    return jsonResponse(400, { ok: false, error: "Invalid request" });
  }

  const fields = validateFields(payload);
  if (!fields) {
    return jsonResponse(400, { ok: false, error: "Please check the form fields and try again." });
  }

  const token = typeof (payload as Record<string, unknown>)?.turnstileToken === "string"
    ? ((payload as Record<string, unknown>).turnstileToken as string)
    : "";
  if (!token) {
    return jsonResponse(400, { ok: false, error: "Verification required." });
  }

  const verified = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip);
  if (!verified) {
    return jsonResponse(403, { ok: false, error: "Verification failed. Please try again." });
  }

  const forwarded = await fetch(env.N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Avora-Webhook-Secret": env.N8N_SHARED_SECRET,
    },
    body: JSON.stringify({ ...fields, source: "website" }),
  });

  if (!forwarded.ok) {
    return jsonResponse(502, { ok: false, error: "Something went wrong sending your message. Please try again, or email us directly." });
  }

  return jsonResponse(200, { ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
