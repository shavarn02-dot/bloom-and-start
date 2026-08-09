import fs from "node:fs";
import path from "node:path";

const targets = [
  path.resolve(process.cwd(), ".output/server/wrangler.json"),
  path.resolve(process.cwd(), "dist/_worker.js/wrangler.json"),
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    try {
      const config = JSON.parse(fs.readFileSync(target, "utf-8"));
      // Cloudflare Pages forbids binding name 'ASSETS'
      if (config.assets && config.assets.binding) {
        delete config.assets.binding;
      }
      if (!config.assets) {
        config.assets = { directory: "../public" };
      }
      fs.writeFileSync(target, JSON.stringify(config, null, 2));
      console.log(`[postbuild] Successfully sanitized ${target} for Cloudflare deployment!`);
    } catch (err) {
      console.error(`[postbuild] Error processing ${target}:`, err);
    }
  }
}
