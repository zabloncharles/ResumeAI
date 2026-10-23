import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import { join } from "path";
import { pathToFileURL } from "url";
import { readdirSync, statSync } from "fs";

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
  "generateStudyCardsFromTranscript",
  "generatePodcastScript",
  "generatePodcastAudio",
  "recordAnalyticsEvent",
  "createPodcastEpisode-background",
]);

const BACKGROUND_FUNCTIONS = new Set(["createPodcastEpisode-background"]);

function collectMtimes(dir: string): number[] {
  try {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      const stats = statSync(full);
      if (stats.isDirectory()) return collectMtimes(full);
      return [stats.mtimeMs];
    });
  } catch {
    return [];
  }
}

function cacheToken(fnFilePath: string): string {
  const root = process.cwd();
  const mtimes = [
    statSync(fnFilePath).mtimeMs,
    ...collectMtimes(join(root, "shared")),
    ...collectMtimes(join(root, "netlify/functions")),
  ];
  return mtimes.reduce((max, n) => Math.max(max, n), 0).toString(36);
}

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

          const filePath = join(
            process.cwd(),
            "netlify/functions",
            `${fnName}.js`
          );
          const token = cacheToken(filePath);

          for (const mod of server.moduleGraph.idToModuleMap.values()) {
            const id = mod.id || "";
            if (
              id.includes("/netlify/functions/") ||
              id.includes("/shared/") ||
              id.includes("\\netlify\\functions\\") ||
              id.includes("\\shared\\")
            ) {
              server.moduleGraph.invalidateModule(mod);
            }
          }

          const modulePath = `${pathToFileURL(filePath).href}?t=${token}`;
          const mod = await import(modulePath);
          const event = { httpMethod: "POST", headers, body, path: pathname };

          if (BACKGROUND_FUNCTIONS.has(fnName)) {
            res.statusCode = 202;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, accepted: true }));
            void mod.handler(event, {}).catch((err: unknown) => {
              console.error(`[dev] background function ${fnName} failed:`, err);
            });
            return;
          }

          const result = await mod.handler(event, {});

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
