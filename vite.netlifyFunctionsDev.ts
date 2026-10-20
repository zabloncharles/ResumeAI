import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import { join } from "path";
import { pathToFileURL } from "url";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const DEV_FUNCTIONS = new Set([
  "generateResume",
  "parseResume",
  "atsCheckResume",
]);

export function netlifyFunctionsDev(): Plugin {
  return {
    name: "netlify-functions-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        const match = pathname.match(
          /^\/\.netlify\/functions\/([a-zA-Z0-9_-]+)$/
        );
        if (!match || !DEV_FUNCTIONS.has(match[1])) {
          next();
          return;
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }

        const fnName = match[1];
        try {
          const body = await readBody(req);
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === "string") headers[key] = value;
            else if (Array.isArray(value) && value[0])
              headers[key] = value[0];
          }

          const modulePath = pathToFileURL(
            join(process.cwd(), "netlify/functions", `${fnName}.js`)
          ).href;
          const mod = await import(modulePath);
          const result = await mod.handler(
            { httpMethod: "POST", headers, body, path: pathname },
            {}
          );

          res.statusCode = result.statusCode ?? 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            typeof result.body === "string"
              ? result.body
              : JSON.stringify(result.body ?? {})
          );
        } catch (err) {
          console.error(`[dev] netlify function ${fnName} failed:`, err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                err instanceof Error ? err.message : "Function failed in dev",
            })
          );
        }
      });
    },
  };
}
