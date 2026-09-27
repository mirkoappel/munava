const identifier = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const issuer = "urn:deckeins:holodeck:sites";
const audience = "colyseus.deckeins.de";
const keyId = "holodeck-sites-es256-v1";
const lifetimeSeconds = 90;

function base64url(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function issueTicket(request, env) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }
  if (!isSameOrigin(request)) return jsonResponse({ error: "Forbidden" }, 403);

  const userId = request.headers.get("oai-authenticated-user-id");
  if (!userId) return jsonResponse({ error: "Authentication required" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  const { worldId, instanceId } = body;
  if (typeof worldId !== "string" || !identifier.test(worldId)
    || typeof instanceId !== "string" || !identifier.test(instanceId)) {
    return jsonResponse({ error: "Invalid world or instance" }, 400);
  }

  if (!env.HOLODECK_TICKET_PRIVATE_JWK) {
    return jsonResponse({ error: "Ticket service unavailable" }, 503);
  }

  let privateJwk;
  try {
    privateJwk = JSON.parse(env.HOLODECK_TICKET_PRIVATE_JWK);
  } catch {
    return jsonResponse({ error: "Ticket service unavailable" }, 503);
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + lifetimeSeconds;
  const header = base64url(JSON.stringify({ alg: "ES256", typ: "JWT", kid: keyId }));
  const payload = base64url(JSON.stringify({
    iss: issuer,
    aud: audience,
    sub: userId,
    worldId,
    instanceId,
    permissions: ["world:join"],
    iat: now,
    exp: expiresAt,
    jti: crypto.randomUUID(),
  }));
  const signingInput = `${header}.${payload}`;

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      privateJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      new TextEncoder().encode(signingInput),
    );
    return jsonResponse({ ticket: `${signingInput}.${base64url(signature)}`, expiresAt });
  } catch {
    return jsonResponse({ error: "Ticket service unavailable" }, 503);
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/colyseus-ticket") return issueTicket(request, env);
    if (pathname.startsWith("/api/")) return jsonResponse({ error: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  },
};
