import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

function fixWranglerForPages() {
  return {
    name: "fix-wrangler-for-pages",
    closeBundle() {
      const paths = [
        path.resolve(process.cwd(), ".output/server/wrangler.json"),
        path.resolve(process.cwd(), "dist/_worker.js/wrangler.json"),
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) {
          try {
            const config = JSON.parse(fs.readFileSync(p, "utf-8"));
            delete config.assets;
            delete config.main;
            delete config.rules;
            fs.writeFileSync(p, JSON.stringify(config, null, 2));
            console.log(`[fix-wrangler] Sanitized ${p} for Cloudflare Pages`);
          } catch (e) {
            console.error(`[fix-wrangler] Error reading ${p}:`, e);
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [fixWranglerForPages()],
  tanstackStart: {
    server: { entry: "server" },
    nitro: {
      preset: "cloudflare-pages",
    },
  },
});
