// Runs as the root wrangler config's custom build step. Inside Cloudflare
// Workers Builds (which injects CI credentials) it also deploys the two
// sibling Workers, so one git push ships all three sites. Outside CI it is
// a no-op, keeping `wrangler dev` and local deploys credential-free.
import { spawnSync } from "node:child_process";

const inCI = process.env.WORKERS_CI || process.env.CI;
if (!inCI) {
  console.log("[deploy-siblings] not in CI, skipping sibling deploys");
  process.exit(0);
}

const configs = [
  "sites/llmstxt-builder/wrangler.jsonc",
  "sites/agentfront/wrangler.jsonc",
];

for (const cfg of configs) {
  console.log(`[deploy-siblings] deploying ${cfg} …`);
  const r = spawnSync("npx", ["wrangler", "deploy", "-c", cfg], {
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    // Log loudly but do not fail the build — the flagship deploy must not
    // be blocked by a sibling failure (e.g. missing token permission).
    console.error(`[deploy-siblings] WARNING: deploy failed for ${cfg} (exit ${r.status})`);
  }
}
