import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import server from "../src/server/index.js";

function ticketRequest(userId) {
  const headers = {
    "Content-Type": "application/json",
    Origin: "https://munava.example",
  };
  if (userId) headers["oai-authenticated-user-id"] = userId;
  return new Request("https://munava.example/api/colyseus-ticket", {
    method: "POST",
    headers,
    body: JSON.stringify({ worldId: "wild-west", instanceId: "main" }),
  });
}

test("requires Sites identity before issuing a ticket", async () => {
  const response = await server.fetch(ticketRequest(null), {});
  assert.equal(response.status, 401);
});

test("issues a correctly signed short-lived Munava ticket", async () => {
  const keys = await webcrypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const privateJwk = await webcrypto.subtle.exportKey("jwk", keys.privateKey);
  const response = await server.fetch(ticketRequest("local-test-user"), {
    HOLODECK_TICKET_PRIVATE_JWK: JSON.stringify(privateJwk),
  });

  assert.equal(response.status, 200);
  const { ticket, expiresAt } = await response.json();
  const [encodedHeader, encodedPayload, encodedSignature] = ticket.split(".");
  const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString());
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
  assert.equal(header.alg, "ES256");
  assert.equal(header.kid, "holodeck-sites-es256-v1");
  assert.equal(payload.iss, "urn:deckeins:holodeck:sites");
  assert.equal(payload.aud, "colyseus.deckeins.de");
  assert.equal(payload.sub, "local-test-user");
  assert.equal(payload.worldId, "wild-west");
  assert.equal(payload.instanceId, "main");
  assert.deepEqual(payload.permissions, ["world:join"]);
  assert.equal(payload.exp, expiresAt);
  assert.equal(payload.exp - payload.iat, 90);
  assert.equal(await webcrypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    keys.publicKey,
    Buffer.from(encodedSignature, "base64url"),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  ), true);
});
