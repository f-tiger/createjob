// Runs via npm postinstall. Workers Builds ignores wrangler custom build
// commands, but it always installs dependencies — so this hook is how one
// git push ships all three Workers: the builds pipeline deploys the root
// config (createjob/AgentLens) itself, and this script deploys the two
// sibling Workers using the same injected credentials.
//
// Outside Workers Builds (local install, GitHub Actions install step) it
// is a no-op, so local dev needs no credentials.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

if (!process.env.WORKERS_CI) {
  console.log("[deploy-siblings] not in Workers Builds, skipping");
  process.exit(0);
}

const configs = [
  "sites/llmstxt-builder/wrangler.jsonc",
  "sites/agentfront/wrangler.jsonc",
];

const results = {};
for (const cfg of configs) {
  console.log(`[deploy-siblings] deploying ${cfg} …`);
  const r = spawnSync("npx", ["wrangler", "deploy", "-c", cfg], {
    stdio: "inherit",
    env: process.env,
  });
  results[cfg] = r.status;
  if (r.status !== 0) {
    // Log loudly but never fail the install — the flagship deploy that
    // follows must not be blocked by a sibling failure.
    console.error(`[deploy-siblings] WARNING: deploy failed for ${cfg} (exit ${r.status})`);
  }
}

// Drop a small build manifest into the flagship's assets (uploaded by the
// main deploy right after this hook) so deploy health is visible at
// /build-info.json. Booleans and exit codes only — no secret values.
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
} catch (e) {
  console.error(`[deploy-siblings] could not write build-info.json: ${e.message}`);
}
