// npm postinstall hook.
//
// 1. Always: assemble the unified asset tree — the flagship Worker also
//    serves llms.txt Builder at /builder/ and AgentFront at /store/, so a
//    single deploy of the root config puts all three sites online.
// 2. Inside Cloudflare Workers Builds only (WORKERS_CI): additionally
//    deploy the two dedicated sibling Workers (llmstxt-builder,
//    agentfront) with the same injected credentials, and write a build
//    manifest that gets bundled into the flagship for diagnostics
//    (served at /api/build-info). Locally these steps are skipped, so
//    dev needs no credentials.
import { spawnSync } from "node:child_process";
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
  console.log("[postinstall] not in Workers Builds — skipping sibling deploys");
  process.exit(0);
}

const results = {};
for (const cfg of [
  "sites/llmstxt-builder/wrangler.jsonc",
  "sites/agentfront/wrangler.jsonc",
]) {
  console.log(`[postinstall] deploying ${cfg} …`);
  const r = spawnSync("npx", ["wrangler", "deploy", "-c", cfg], {
    stdio: "inherit",
    env: process.env,
  });
  results[cfg] = r.status;
  if (r.status !== 0) {
    // Never fail the install — the flagship deploy that follows must not
    // be blocked by a sibling failure.
    console.error(`[postinstall] WARNING: deploy failed for ${cfg} (exit ${r.status})`);
  }
}

// Build manifest: bundled into the flagship worker (imported by index.js)
// and also served as a raw asset at /build-info.json. Booleans and exit
// codes only — no secret values.
try {
  writeFileSync(
    "sites/agentlens/public/build-info.json",
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        branch: process.env.WORKERS_CI_BRANCH || null,
        commit: process.env.WORKERS_CI_COMMIT_SHA || null,
        siblingDeployExitCodes: results,
        env: {
          WORKERS_CI: Boolean(process.env.WORKERS_CI),
          hasApiToken: Boolean(process.env.CLOUDFLARE_API_TOKEN),
          hasAccountId: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
        },
      },
      null,
      2
    )
  );
  console.log("[postinstall] build-info.json written");
} catch (e) {
  console.error(`[postinstall] could not write build-info.json: ${e.message}`);
}
