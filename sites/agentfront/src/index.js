/**
 * AgentFront — storefronts for the agentic web.
 * Static landing + waitlist API, and a machine-readable surface
 * that practices what it preaches (llms.txt, agents.txt, JSON catalog).
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      try {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const role = String(body.role || "").slice(0, 100);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          return json({ ok: false, error: "Invalid email address." }, 400);
        }
        await env.SIGNUPS.put(
          `signup:agentfront:${email}`,
          JSON.stringify({ email, role, source: "agentfront", at: new Date().toISOString() })
        );
        return json({ ok: true });
      } catch {
        return json({ ok: false, error: "Bad request." }, 400);
      }
    }

    // Machine-readable product catalog — the kind of endpoint agents will consume.
    if (url.pathname === "/api/catalog") {
      return json({
        store: "AgentFront Demo Store",
        version: "0.1",
        protocols_planned: ["x402", "ACP", "MCP"],
        products: [
          {
            id: "starter",
            name: "AgentFront Starter",
            description: "Agent-ready storefront template: llms.txt, agents.txt, JSON-LD product schema, machine-readable catalog endpoint.",
            price: { amount: 0, currency: "USD", note: "Free while in early access" },
            availability: "waitlist",
          },
        ],
      });
    }

    return env.ASSETS.fetch(request);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
