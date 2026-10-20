import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { netlifyFunctionsDev } from "./vite.netlifyFunctionsDev";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined && value) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), netlifyFunctionsDev()],
    resolve: {
      alias: {
        "@shared": path.resolve(projectRoot, "shared"),
      },
    },
  };
});
