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
      // Cloudflare Pages project configs MUST NOT contain 'main', 'assets', or 'site'
      delete config.main;
      delete config.assets;
      delete config.site;
      fs.writeFileSync(target, JSON.stringify(config, null, 2));
      console.log(`[postbuild] Successfully sanitized ${target} for Cloudflare Pages (removed main & assets)`);
    } catch (err) {
      console.error(`[postbuild] Error processing ${target}:`, err);
    }
  }
}
