# 部署指南（Cloudflare Workers）

三个站点 = 三个 Worker：`createjob`（AgentLens 旗舰）、`llmstxt-builder`、`agentfront`。
KV 命名空间 `createjob-signups`（id `ad034fbd62384eb3abd7b612fc33e268`）已在你的 Cloudflare 账号创建完毕，
两个 wrangler 配置已直接引用，无需再手动创建。

## 方式 A：本地一键部署（最快）

```bash
npm install
npx wrangler login        # 浏览器授权一次
npm run deploy            # 部署全部三个站点
```

部署后访问：

- `https://createjob.<你的子域>.workers.dev` — AgentLens
- `https://llmstxt-builder.<你的子域>.workers.dev` — llms.txt Builder
- `https://agentfront.<你的子域>.workers.dev` — AgentFront

## 方式 B：Cloudflare Workers Builds（Git 自动部署）

你的账号里已存在名为 `createjob` 的 Worker。若已在 Cloudflare 控制台将其连接到本仓库（Workers Builds）：

1. 控制台 → Workers & Pages → `createjob` → Settings → Build，确认已连接本仓库与生产分支；
2. **Build command 留空、Deploy command 设为 `npx wrangler deploy`** —— 根目录 `wrangler.jsonc` 即 AgentLens；
3. 若想一次推送部署三个站点，把 Deploy command 改为：`npm run deploy`；
4. 之后每次 push 到生产分支即自动上线。

## 方式 C：GitHub Actions（已配置）

仓库自带 `.github/workflows/deploy.yml`：push 到 `main` 或手动触发时自动部署三站。
只需在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：

- `CLOUDFLARE_API_TOKEN`：Cloudflare 控制台 → My Profile → API Tokens → 使用 "Edit Cloudflare Workers" 模板创建。

## 上线后建议（重要）

1. **绑定自定义域名**（Workers → 域名 → Custom Domains）：`workers.dev` 子域对 SEO/GEO 不利，正式运营务必绑定自有域名；绑定后三站互链会按域名结构自动失效——把各页 `data-sister` 链接改为正式域名即可（全局搜索 `data-sister`）；
2. **验证**：用 AgentLens 扫自己的三个站（应得 90+ 分，作为产品可信度展示）；
3. **查看名单**：控制台 → KV → `createjob-signups`，或 `npx wrangler kv key list --namespace-id ad034fbd62384eb3abd7b612fc33e268`。

## 常见问题

- **`wrangler deploy` 报未登录**：先 `npx wrangler login`；CI 环境用 `CLOUDFLARE_API_TOKEN` 环境变量。
- **KV 报错 namespace not found**：说明部署到了另一个 Cloudflare 账号——在该账号 `npx wrangler kv namespace create createjob-signups`，把新 id 替换到根 `wrangler.jsonc` 和 `sites/agentfront/wrangler.jsonc`。
- **扫描 API 返回 403/超时**：目标网站屏蔽了数据中心 IP 或响应超过 8 秒，属预期行为，前端会显示可读错误。
