// npm postinstall hook.
//
// 1. Always: assemble the unified asset tree — the flagship Worker also
//    serves llms.txt Builder at /builder/ and AgentFront at /store/, so a
//    single deploy of the root config puts all three sites online.
// 2. Inside Cloudflare Workers Builds (WORKERS_CI): write a build manifest
//    that gets bundled into the flagship (served at /api/build-info).
//
// Note: do NOT try to `wrangler deploy` the sibling configs from inside
// Workers Builds — the CI system force-overrides every deploy's Worker
// name to the connected Worker ("createjob"), so sibling deploys would
// just redeploy the flagship. Dedicated sibling Workers are deployed
// either locally (`npm run deploy`) or by connecting them to this repo
// in the Cloudflare dashboard (see DEPLOY.md).
import { cpSync, rmSync, writeFileSync } from "node:fs";

const copies = [
  ["sites/llmstxt-builder/public", "sites/agentlens/public/builder"],
  ["sites/agentfront/public", "sites/agentlens/public/store"],
];
for (const [src, dest] of copies) {
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
}
console.log("[postinstall] unified asset tree assembled (/builder, /store)");

if (!process.env.WORKERS_CI) {
  process.exit(0);
}

try {
  writeFileSync(
    "sites/agentlens/public/build-info.json",
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        branch: process.env.WORKERS_CI_BRANCH || null,
        commit: process.env.WORKERS_CI_COMMIT_SHA || null,
      },
      null,
      2
    )
  );
  console.log("[postinstall] build-info.json written");
} catch (e) {
  console.error(`[postinstall] could not write build-info.json: ${e.message}`);
}
