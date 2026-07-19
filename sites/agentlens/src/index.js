/**
 * AgentLens — AI Visibility & Agent-Readiness Checker
 * Scans any public website and scores how visible / usable it is
 * for AI crawlers, answer engines, and autonomous agents.
 */

import { handleWaitlist, handleCatalog } from "../../agentfront/src/handlers.js";
import buildInfo from "../public/build-info.json";

const AI_CRAWLERS = [
  { ua: "GPTBot", org: "OpenAI — model training" },
  { ua: "OAI-SearchBot", org: "OpenAI — ChatGPT Search" },
  { ua: "ChatGPT-User", org: "OpenAI — user-triggered browsing" },
  { ua: "ClaudeBot", org: "Anthropic — model training" },
  { ua: "Claude-User", org: "Anthropic — user-triggered browsing" },
  { ua: "PerplexityBot", org: "Perplexity — answer engine" },
  { ua: "Google-Extended", org: "Google — Gemini training" },
  { ua: "CCBot", org: "Common Crawl — open web corpus" },
  { ua: "meta-externalagent", org: "Meta — AI training" },
  { ua: "Bytespider", org: "ByteDance — AI training" },
];

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 512 * 1024;

// Subdomain -> unified asset prefix (lens.* / workers.dev root serve AgentLens as-is)
const SUBSITE_PREFIX = { agentfront: "/store", llmstxt: "/builder" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const prefix = SUBSITE_PREFIX[url.hostname.split(".")[0]];
    if (prefix === "/store") {
      if (url.pathname === "/api/waitlist" && request.method === "POST") {
        return handleWaitlist(request, env);
      }
      if (url.pathname === "/api/catalog") {
        return handleCatalog();
      }
    }
    if (prefix) {
      const mapped = new URL(url);
      mapped.pathname = prefix + url.pathname;
      return env.ASSETS.fetch(new Request(mapped, request));
    }

    if (url.pathname === "/api/check") {
      return handleCheck(request);
    }
    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      return handleSubscribe(request, env, "agentlens");
    }
    if (url.pathname === "/api/build-info") {
      return json(buildInfo);
    }
    // AgentFront also mounts under /store/ in the unified deployment
    if (url.pathname === "/store/api/waitlist" && request.method === "POST") {
      return handleWaitlist(request, env);
    }
    if (url.pathname === "/store/api/catalog") {
      return handleCatalog();
    }
    // Everything else -> static assets (incl. /builder/ and /store/ sites)
    return env.ASSETS.fetch(request);
  },
};

/* ---------------------------- subscribe ---------------------------- */

async function handleSubscribe(request, env, source) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const site = String(body.site || "").slice(0, 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json({ ok: false, error: "Invalid email address." }, 400);
    }
    const key = `signup:${source}:${email}`;
    await env.SIGNUPS.put(
      key,
      JSON.stringify({ email, site, source, at: new Date().toISOString() })
    );
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "Bad request." }, 400);
  }
}

/* ------------------------------ check ------------------------------ */

async function handleCheck(request) {
  const target = new URL(request.url).searchParams.get("url");
  const parsed = normalizeTarget(target);
  if (!parsed) {
    return json({ ok: false, error: "Please provide a valid public http(s) URL." }, 400);
  }

  const origin = parsed.origin;
  const started = Date.now();

  const [home, llms, llmsFull, robots, sitemap, agentsTxt] = await Promise.allSettled([
    timedFetch(parsed.href),
    timedFetch(origin + "/llms.txt"),
    timedFetch(origin + "/llms-full.txt"),
    timedFetch(origin + "/robots.txt"),
    timedFetch(origin + "/sitemap.xml"),
    timedFetch(origin + "/agents.txt"),
  ]);

  const homeRes = settled(home);
  if (!homeRes || !homeRes.ok) {
    return json(
      {
        ok: false,
        error:
          "Could not fetch that site" +
          (homeRes && homeRes.status ? ` (HTTP ${homeRes.status})` : "") +
          ". Check the URL and try again.",
      },
      502
    );
  }

  const robotsRes = settled(robots);
  const robotsRules = robotsRes && robotsRes.ok ? parseRobots(robotsRes.body) : null;
  const html = homeRes.body || "";
  const page = analyzeHtml(html);

  const pillars = [
    scoreAiAccess(robotsRules, robotsRes),
    scoreMachineSurface(settled(llms), settled(llmsFull), settled(sitemap), robotsRules),
    scoreContentStructure(page),
    scoreAgentReadiness(parsed, homeRes, page, settled(agentsTxt)),
  ];

  const score = pillars.reduce((s, p) => s + p.score, 0);
  const max = pillars.reduce((s, p) => s + p.max, 0);
  const pct = Math.round((score / max) * 100);

  return json({
    ok: true,
    url: parsed.href,
    fetchedAt: new Date().toISOString(),
    tookMs: Date.now() - started,
    score: pct,
    grade: grade(pct),
    pillars,
  });
}

function normalizeTarget(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  // Block obvious private / internal targets (SSRF hygiene)
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "0.0.0.0" ||
    host === "[::1]"
  ) {
    return null;
  }
  if (!host.includes(".")) return null;
  return u;
}

async function timedFetch(url) {
  const t0 = Date.now();
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AgentLensBot/1.0; +https://createjob.workers.dev)",
      Accept: "text/html,application/xhtml+xml,text/plain,*/*",
    },
    redirect: "follow",
    cf: { cacheTtl: 60 },
  });
  let body = "";
  try {
    const buf = await res.arrayBuffer();
    body = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, MAX_BODY_BYTES));
  } catch {
    /* body unavailable */
  }
  return {
    ok: res.ok,
    status: res.status,
    finalUrl: res.url,
    contentType: res.headers.get("content-type") || "",
    ms: Date.now() - t0,
    body,
  };
}

function settled(p) {
  return p.status === "fulfilled" ? p.value : null;
}

/* --------------------------- robots.txt ---------------------------- */

function parseRobots(text) {
  const groups = []; // { agents: [], disallow: [], allow: [] }
  let current = null;
  const sitemaps = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || current.rulesSeen) {
        current = { agents: [], disallow: [], allow: [], rulesSeen: false };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (field === "disallow" && current) {
      current.rulesSeen = true;
      current.disallow.push(value);
    } else if (field === "allow" && current) {
      current.rulesSeen = true;
      current.allow.push(value);
    } else if (field === "sitemap") {
      sitemaps.push(value);
    }
  }
  return { groups, sitemaps };
}

function crawlerPolicy(rules, ua) {
  // Returns "allowed" | "blocked" | "default"
  if (!rules) return "default";
  const lower = ua.toLowerCase();
  let match = null;
  for (const g of rules.groups) {
    if (g.agents.some((a) => a !== "*" && lower.includes(a))) match = match || g;
  }
  if (!match) {
    for (const g of rules.groups) {
      if (g.agents.includes("*")) match = match || g;
    }
    if (!match) return "default";
  }
  const blockedAll = match.disallow.some((d) => d === "/" );
  if (blockedAll && !match.allow.length) return "blocked";
  return "allowed";
}

/* --------------------------- html analysis -------------------------- */

function analyzeHtml(html) {
  const pick = (re) => {
    const m = html.match(re);
    return m ? m[1].trim() : null;
  };
  const jsonLdBlocks = [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];
  const jsonLdTypes = [];
  for (const b of jsonLdBlocks) {
    try {
      const data = JSON.parse(b[1]);
      const items = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const it of items) {
        if (it && it["@type"]) jsonLdTypes.push(String(it["@type"]));
      }
    } catch {
      /* unparseable block still counts as attempt */
    }
  }
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: pick(/<title[^>]*>([\s\S]*?)<\/title>/i),
    description: pick(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    ) || pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),
    canonical: pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    lang: pick(/<html[^>]+lang=["']([^"']*)["']/i),
    h1: /<h1[\s>]/i.test(html),
    ogTitle: /<meta[^>]+property=["']og:title["']/i.test(html),
    ogDesc: /<meta[^>]+property=["']og:description["']/i.test(html),
    viewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    jsonLdCount: jsonLdBlocks.length,
    jsonLdTypes: [...new Set(jsonLdTypes)].slice(0, 10),
    visibleTextChars: textOnly.length,
  };
}

/* ----------------------------- scoring ------------------------------ */

function check(id, label, status, detail, recommendation) {
  return { id, label, status, detail, recommendation };
}

function scoreAiAccess(rules, robotsRes) {
  const checks = [];
  let score = 0;
  const max = 25;

  if (!robotsRes || !robotsRes.ok) {
    score += 18;
    checks.push(
      check(
        "robots",
        "robots.txt",
        "warn",
        "No robots.txt found. AI crawlers default to full access, but you have no control surface.",
        "Add a robots.txt that explicitly welcomes the AI crawlers you want (GPTBot, ClaudeBot, PerplexityBot…) and blocks the ones you don't."
      )
    );
  } else {
    const blocked = [];
    const allowed = [];
    for (const c of AI_CRAWLERS) {
      const p = crawlerPolicy(rules, c.ua);
      (p === "blocked" ? blocked : allowed).push(c);
    }
    const ratio = allowed.length / AI_CRAWLERS.length;
    score += Math.round(ratio * 25);
    checks.push(
      check(
        "ai-crawlers",
        "AI crawler access",
        blocked.length === 0 ? "pass" : blocked.length >= 5 ? "fail" : "warn",
        `${allowed.length}/${AI_CRAWLERS.length} major AI crawlers can read this site.` +
          (blocked.length
            ? ` Blocked: ${blocked.map((b) => b.ua).join(", ")}.`
            : ""),
        blocked.length
          ? "Every blocked AI crawler is a distribution channel you're invisible in. Unblock the ones tied to answer engines (OAI-SearchBot, PerplexityBot, Claude-User) even if you block training bots."
          : null
      )
    );
  }
  return { name: "AI Access", key: "access", score: Math.min(score, max), max, checks };
}

function scoreMachineSurface(llms, llmsFull, sitemap, rules) {
  const checks = [];
  let score = 0;
  const max = 25;

  const llmsOk =
    llms && llms.ok && llms.body && !/^\s*</.test(llms.body) && llms.body.trim().length > 20;
  if (llmsOk) {
    score += 14;
    const wellFormed = /^#\s+/.test(llms.body.trim());
    checks.push(
      check(
        "llms",
        "llms.txt",
        wellFormed ? "pass" : "warn",
        wellFormed
          ? "llms.txt found and follows the spec (starts with an H1)."
          : "llms.txt found but doesn't start with a markdown H1 title.",
        wellFormed ? null : "Format it per llmstxt.org: `# Site name`, a `>` summary line, then `##` sections of links."
      )
    );
  } else {
    checks.push(
      check(
        "llms",
        "llms.txt",
        "fail",
        "No llms.txt found. 65% of top sites are missing this too — it's an easy edge.",
        "Publish /llms.txt: a markdown map of your key pages with one-line summaries, so LLMs and agents can navigate you deliberately."
      )
    );
  }

  if (llmsFull && llmsFull.ok && llmsFull.body && !/^\s*</.test(llmsFull.body)) {
    score += 3;
    checks.push(check("llms-full", "llms-full.txt", "pass", "llms-full.txt found — full content in one machine-readable file.", null));
  }

  const sitemapOk =
    (sitemap && sitemap.ok && /<(urlset|sitemapindex)/i.test(sitemap.body || "")) ||
    (rules && rules.sitemaps && rules.sitemaps.length > 0);
  if (sitemapOk) {
    score += 8;
    checks.push(check("sitemap", "XML sitemap", "pass", "Sitemap available — crawlers can enumerate your pages.", null));
  } else {
    checks.push(
      check(
        "sitemap",
        "XML sitemap",
        "fail",
        "No sitemap.xml found (and none referenced in robots.txt).",
        "Generate a sitemap.xml and reference it from robots.txt — it's how both search and AI crawlers discover your long tail."
      )
    );
  }

  return { name: "Machine-Readable Surface", key: "surface", score: Math.min(score, max), max, checks };
}

function scoreContentStructure(page) {
  const checks = [];
  let score = 0;
  const max = 25;

  if (page.title) {
    score += 4;
    checks.push(check("title", "Page title", "pass", `"${page.title.slice(0, 80)}"`, null));
  } else {
    checks.push(check("title", "Page title", "fail", "Missing <title>.", "Add a descriptive title — it's the #1 signal answer engines quote."));
  }

  if (page.description) {
    score += 4;
    checks.push(check("desc", "Meta description", "pass", "Present.", null));
  } else {
    checks.push(check("desc", "Meta description", "fail", "Missing meta description.", "Write a 150-char summary — AI snippets often reuse it verbatim."));
  }

  if (page.h1) {
    score += 3;
    checks.push(check("h1", "H1 heading", "pass", "Page has a top-level heading.", null));
  } else {
    checks.push(check("h1", "H1 heading", "warn", "No <h1> found on the homepage.", "Use one clear H1 so parsers know what the page is about."));
  }

  if (page.jsonLdCount > 0) {
    score += 8;
    checks.push(
      check(
        "jsonld",
        "Structured data (JSON-LD)",
        "pass",
        `${page.jsonLdCount} JSON-LD block(s)` +
          (page.jsonLdTypes.length ? ` — types: ${page.jsonLdTypes.join(", ")}` : ""),
        null
      )
    );
  } else {
    checks.push(
      check(
        "jsonld",
        "Structured data (JSON-LD)",
        "fail",
        "No JSON-LD structured data found.",
        "Add schema.org JSON-LD (Organization, Product, FAQPage…). It's the most direct way to feed facts to AI systems."
      )
    );
  }

  if (page.ogTitle && page.ogDesc) {
    score += 3;
    checks.push(check("og", "Open Graph tags", "pass", "og:title and og:description present.", null));
  } else {
    checks.push(check("og", "Open Graph tags", "warn", "Open Graph tags incomplete.", "Add og:title / og:description — many AI browsing tools read them first."));
  }

  if (page.lang) {
    score += 2;
    checks.push(check("lang", "Language declared", "pass", `lang="${page.lang}"`, null));
  } else {
    checks.push(check("lang", "Language declared", "warn", "No lang attribute on <html>.", "Declare the page language for correct parsing."));
  }

  if (page.canonical) {
    score += 1;
    checks.push(check("canonical", "Canonical URL", "pass", "Canonical link present.", null));
  }

  return { name: "Content Structure", key: "structure", score: Math.min(score, max), max, checks };
}

function scoreAgentReadiness(parsedUrl, homeRes, page, agentsTxt) {
  const checks = [];
  let score = 0;
  const max = 25;

  const httpsFinal = (homeRes.finalUrl || parsedUrl.href).startsWith("https://");
  if (httpsFinal) {
    score += 5;
    checks.push(check("https", "HTTPS", "pass", "Served over HTTPS.", null));
  } else {
    checks.push(check("https", "HTTPS", "fail", "Site is not on HTTPS.", "Agents and AI browsers increasingly refuse plain-HTTP sites."));
  }

  if (homeRes.ms <= 1500) {
    score += 5;
    checks.push(check("speed", "Response time", "pass", `Homepage responded in ${homeRes.ms} ms.`, null));
  } else if (homeRes.ms <= 4000) {
    score += 3;
    checks.push(check("speed", "Response time", "warn", `Homepage took ${homeRes.ms} ms.`, "Agents work on timeouts — aim for under 1.5 s at the edge."));
  } else {
    checks.push(check("speed", "Response time", "fail", `Homepage took ${homeRes.ms} ms.`, "Slow responses get dropped from agent workflows. Put the site behind a CDN."));
  }

  if (page.visibleTextChars >= 800) {
    score += 10;
    checks.push(
      check("ssr", "Content visible without JavaScript", "pass", `~${page.visibleTextChars} characters of server-rendered text.`, null)
    );
  } else if (page.visibleTextChars >= 200) {
    score += 5;
    checks.push(
      check(
        "ssr",
        "Content visible without JavaScript",
        "warn",
        `Only ~${page.visibleTextChars} characters of text in the raw HTML.`,
        "Most AI crawlers don't execute JavaScript. Server-render your key content or it doesn't exist to them."
      )
    );
  } else {
    checks.push(
      check(
        "ssr",
        "Content visible without JavaScript",
        "fail",
        `Almost no text (~${page.visibleTextChars} chars) in the raw HTML — likely a JS-only app.`,
        "To AI crawlers this site is a blank page. Add SSR/prerendering immediately."
      )
    );
  }

  if (agentsTxt && agentsTxt.ok && agentsTxt.body && !/^\s*</.test(agentsTxt.body)) {
    score += 5;
    checks.push(check("agents", "agents.txt", "pass", "agents.txt found — early adopter of agent capability declarations.", null));
  } else {
    checks.push(
      check(
        "agents",
        "agents.txt",
        "warn",
        "No agents.txt capability declaration (still rare — this is the frontier).",
        "Declare what agents may do on your site (browse, quote, transact) — early adopters get picked first by agent routers."
      )
    );
  }

  return { name: "Agent Readiness", key: "agent", score: Math.min(score, max), max, checks };
}

function grade(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 55) return "C";
  if (pct >= 40) return "D";
  return "F";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
