# 部署指南（Cloudflare Workers）

## ✅ 当前线上状态（已自动部署）

本仓库已通过 **Cloudflare Workers Builds**（Git 集成）连接到 `createjob` Worker：
每次 push 到默认分支，Cloudflare 自动构建并上线。三个网站已全部在线（统一部署在旗舰 Worker 上）：

| 站点 | 自定义域名（主） | workers.dev（备用） |
|---|---|---|
| AgentLens（检测器/获客漏斗） | https://lens.agiscorecard.com/ | https://createjob.tuoqiantu.workers.dev/ |
| llms.txt Builder | https://llmstxt.agiscorecard.com/ | https://createjob.tuoqiantu.workers.dev/builder/ |
| AgentFront（主力方向） | https://agentfront.agiscorecard.com/ | https://createjob.tuoqiantu.workers.dev/store/ |

自定义域名通过根 `wrangler.jsonc` 的 `routes`（`custom_domain: true`）声明。Worker 内按 Host 分流：
`lens.*` → AgentLens，`agentfront.*` → /store 资产与 API（`llmstxt.*` 逻辑已预留但未启用子域名）。

> ✅ **自定义域名已生效**（2026-07-19 由 GitHub Actions 用仓库 Secret `CLOUDFLARE_API_TOKEN`
> 完成挂载）。当前有两条并行部署管道，push 后都会自动执行，结果幂等：
>
> 1. **Cloudflare Workers Builds**：只部署旗舰 `createjob`（CI 会强制覆盖 Worker 名，无法建其他 Worker）；
> 2. **GitHub Actions**（`.github/workflows/deploy.yml`）：部署全部三个 Worker（`createjob`、
>    `llmstxt-builder`、`agentfront`）并核对自定义域名——独立 Worker 与域名挂载全靠这条管道。

免费 API：`GET /api/check?url=<site>`（扫描）、`GET /store/api/catalog`（机器可读目录）、
`GET /api/build-info`（构建信息）。邮箱名单写入 KV `createjob-signups`。

工作机制：`npm postinstall`（`scripts/postinstall.mjs`）把 `/builder/`、`/store/` 两站资产并入旗舰
资产目录，Workers Builds 再执行 `npx wrangler deploy` 一次性上线三站。

> ⚠️ 注意：Workers Builds 会把构建内所有 `wrangler deploy` 的 Worker 名强制覆盖为所连接的
> Worker（`createjob`），因此**无法**在这条管道里创建独立的 `llmstxt-builder` / `agentfront`
> Worker——独立子域名需用下面两种方式之一。

## 可选：给每个站点独立的 Worker / 子域名

### 方式 A：本地一键部署

```bash
npm install
npx wrangler login        # 浏览器授权一次
npm run deploy            # 部署 createjob + llmstxt-builder + agentfront 三个 Worker
```

部署后新增：`https://llmstxt-builder.tuoqiantu.workers.dev` 和 `https://agentfront.tuoqiantu.workers.dev`。
（页面互链已自适应：在独立域名上自动切换为跨子域链接。）

### 方式 B：控制台连接（官方 monorepo 流程，之后全自动）

在 Cloudflare 控制台 Workers & Pages 中**再创建两个 Worker** 并各自连接本仓库：

1. Worker 名 `llmstxt-builder` → Settings → Build → 连接本仓库，Deploy command 设为
   `npx wrangler deploy -c sites/llmstxt-builder/wrangler.jsonc`；
2. Worker 名 `agentfront` → 同上，`npx wrangler deploy -c sites/agentfront/wrangler.jsonc`；
3. 之后每次 push 三个 Worker 同步自动部署。

### 方式 C：GitHub Actions（备用）

`.github/workflows/deploy.yml` 已配置（push 到 `main` 或手动触发）。需在 GitHub 仓库
Settings → Secrets 添加 `CLOUDFLARE_API_TOKEN`（"Edit Cloudflare Workers" 模板创建）。

## 上线后建议（重要）

1. **绑定自定义域名**（Workers → Custom Domains）：`workers.dev` 子域对 SEO/GEO 不利，正式运营务必绑定自有域名，并将三站拆分为独立域名/Worker；
2. **自检**：用 AgentLens 扫描自己的站点（应得高分，作为产品可信度展示）；
3. **查看邮箱名单**：控制台 → KV → `createjob-signups`，或
   `npx wrangler kv key list --namespace-id ad034fbd62384eb3abd7b612fc33e268`。

## 常见问题

- **浏览器能打开，但脚本/爬虫访问返回 403**：Cloudflare 对 workers.dev 的自动化流量有 bot 拦截，属平台行为，不影响真实用户。
- **KV 报错 namespace not found**：部署到了另一个 Cloudflare 账号——在该账号 `npx wrangler kv namespace create createjob-signups`，把新 id 替换到根 `wrangler.jsonc` 和 `sites/agentfront/wrangler.jsonc`。
- **扫描 API 返回 502/超时**：目标网站屏蔽数据中心 IP 或响应超 8 秒，属预期行为，前端会显示可读错误。
