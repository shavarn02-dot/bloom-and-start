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
      // Remove forbidden ASSETS binding name for Pages compatibility
      if (config.assets && config.assets.binding) {
        delete config.assets.binding;
      }
      if (!config.main) {
        config.main = "index.mjs";
      }
      fs.writeFileSync(target, JSON.stringify(config, null, 2));
      console.log(`[postbuild] Sanitized ${target}`);
    } catch (err) {
      console.error(`[postbuild] Error processing ${target}:`, err);
    }
  }
}
