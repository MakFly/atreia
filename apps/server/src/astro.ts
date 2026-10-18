import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from "node:http";
import { join, relative } from "node:path";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";
import type { Logger } from "./logger.ts";

type NodeHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next?: (err?: unknown) => void,
  locals?: object,
) => void | Promise<void>;

/** Turn a Fetch request into the Node middleware response produced by the Astro adapter. */
export async function callNodeHandler(handler: NodeHandler, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers);
  headers.host ??= url.host;
  const body = request.body
    ? Readable.fromWeb(request.body as import("node:stream/web").ReadableStream)
    : Readable.from([]);
  const req = Object.assign(body, {
    method: request.method,
    url: `${url.pathname}${url.search}`,
    headers,
    httpVersion: "1.1",
    socket: { remoteAddress: "127.0.0.1" },
  }) as IncomingMessage;
  const res = new CollectedResponse(req);

  let settled = false;
  const fromNext = new Promise<Response>((resolve, reject) => {
    void Promise.resolve(handler(req, res as unknown as ServerResponse, (error) => {
      if (settled) return;
      settled = true;
      if (error) reject(error instanceof Error ? error : new Error(String(error)));
      else resolve(new Response(null, { status: 404 }));
    })).then(() => {
      if (settled) return;
      settled = true;
      resolve(res.toResponse());
    }, (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });
  return fromNext;
}

export async function mountAstro(app: Hono, distDir: string, log: Logger): Promise<boolean> {
  const entry = join(distDir, "server/entry.mjs");
  if (!existsSync(entry)) return false;
  const loaded = await import(pathToFileURL(entry).href) as { handler?: NodeHandler };
  if (typeof loaded.handler !== "function") throw new Error(`Entrée Astro sans handler : ${entry}`);
  const handler = loaded.handler;
  // En mode middleware, l'adaptateur Node ne sert pas dist/client : Hono s'en charge.
  const clientDir = join(distDir, "client");
  if (existsSync(clientDir)) {
    app.use("/assets/*", async (c, next) => {
      await next();
      if (c.res.ok) c.header("Cache-Control", "public, max-age=31536000, immutable");
    });
    app.use("/images/*", async (c, next) => {
      await next();
      if (c.res.ok) c.header("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    });
    app.use("*", serveStatic({ root: relative(process.cwd(), clientDir) }));
  }
  app.all("*", async (c) => {
    const response = await callNodeHandler(handler, c.req.raw);
    if (response.ok && c.req.path.startsWith("/assets/")) {
      response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (response.ok && c.req.path.startsWith("/images/")) {
      response.headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    }
    return response;
  });
  log.info("astro", { entry });
  return true;
}

class CollectedResponse extends EventEmitter {
  statusCode = 200;
  statusMessage = "";
  headersSent = false;
  req: IncomingMessage;
  private readonly headers = new Map<string, string[]>();
  private readonly chunks: Buffer[] = [];

  constructor(req: IncomingMessage) {
    super();
    this.req = req;
  }

  setHeader(name: string, value: number | string | readonly string[]): this {
    this.headers.set(name.toLowerCase(), Array.isArray(value) ? value.map(String) : [String(value)]);
    return this;
  }

  writeHead(code: number, messageOrHeaders?: string | OutgoingHttpHeaders, maybeHeaders?: OutgoingHttpHeaders): this {
    this.statusCode = code;
    const headers = typeof messageOrHeaders === "string" ? maybeHeaders : messageOrHeaders;
    if (typeof messageOrHeaders === "string") this.statusMessage = messageOrHeaders;
    if (headers) {
      for (const [name, value] of Object.entries(headers)) {
        if (value === undefined) continue;
        this.setHeader(name, value as number | string | readonly string[]);
      }
    }
    this.headersSent = true;
    return this;
  }

  write(chunk: unknown): boolean {
    this.headersSent = true;
    if (Buffer.isBuffer(chunk)) this.chunks.push(chunk);
    else if (chunk instanceof Uint8Array) this.chunks.push(Buffer.from(chunk));
    else this.chunks.push(Buffer.from(String(chunk)));
    return true;
  }

  end(chunk?: unknown): this {
    if (chunk !== undefined) this.write(chunk);
    this.headersSent = true;
    this.emit("finish");
    this.emit("close");
    return this;
  }

  destroy(error?: Error): this {
    if (error) this.emit("error", error);
    this.emit("close");
    return this;
  }

  toResponse(): Response {
    const headers = new Headers();
    for (const [name, values] of this.headers) {
      for (const value of values) headers.append(name, value);
    }
    return new Response(Buffer.concat(this.chunks), {
      status: this.statusCode,
      statusText: this.statusMessage,
      headers,
    });
  }
}
