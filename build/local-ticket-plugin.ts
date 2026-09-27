import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import ticketWorker from "../src/server/index.js";

export function localTicket({ privateJwk = "" } = {}): Plugin {
  return {
    name: "local-ticket",
    configureServer(server) {
      const secure = Boolean(server.config.server.https);
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith("/api/")) return next();
        void serveLocalApi(request, response, secure, privateJwk).catch(next);
      });
    },
  };
}

async function serveLocalApi(
  request: IncomingMessage,
  response: ServerResponse,
  secure: boolean,
  privateJwk: string,
): Promise<void> {
  const headers = new Headers();
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    headers.append(request.rawHeaders[index], request.rawHeaders[index + 1]);
  }
  const body: Buffer[] = [];
  for await (const chunk of request) body.push(Buffer.from(chunk));
  const workerRequest = new Request(
    `${secure ? "https" : "http"}://${request.headers.host}${request.url}`,
    {
      method: request.method,
      headers,
      body: body.length ? Buffer.concat(body) : undefined,
    },
  );
  const workerResponse = await ticketWorker.fetch(workerRequest, {
    HOLODECK_TICKET_PRIVATE_JWK: privateJwk,
  });
  response.statusCode = workerResponse.status;
  workerResponse.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(Buffer.from(await workerResponse.arrayBuffer()));
}
