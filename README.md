# AI-First Web 工具矩阵

> **⚠️ 2026-07-19 已合并入 [f-tiger/sellsomething](https://github.com/f-tiger/sellsomething)**：
> 本仓库与 sellsomething（另一并行会话产物）大部分重复（AgentLens≈AgentReady、
> llms.txt Builder≈其内置 llms-txt-generator、AgentFront 已整体迁入 `sites/agentfront`），
> 已决定以 sellsomething 为主体。本仓库站点暂保持在线，待确认后下线；深度竞对调研报告
> 也已迁至 sellsomething（docs/competitive-analysis.md）。
>
> **遗留事项**：`lens.agiscorecard.com` 与 `agentfront.agiscorecard.com` 两个自定义域名仍挂在
> 本仓库的 `createjob` Worker 上；移交/取舍见下文与 DEPLOY.md。

三个互相导流的网站，组成一个"帮网站进入 AI 时代"的工具矩阵，全部部署在 Cloudflare Workers 上。

**🟢 已上线**（push 即自动部署，详见 [DEPLOY.md](DEPLOY.md)）：

| 站点 | 自定义域名 | workers.dev 备用 |
|---|---|---|
| AgentLens | https://lens.agiscorecard.com/ | https://createjob.tuoqiantu.workers.dev/ |
| llms.txt Builder | https://lens.agiscorecard.com/builder/ | https://createjob.tuoqiantu.workers.dev/builder/ |
| AgentFront | https://agentfront.agiscorecard.com/ | https://createjob.tuoqiantu.workers.dev/store/ |

**⚠️ 定位调整（2026-07-19 竞对调研后，详见 [docs/competitive-analysis.md](docs/competitive-analysis.md)）**：
检测器与监控订阅赛道已被免费巨头商品化（Cloudflare isitagentready.com、HubSpot 免费 Grader + $50/月监控），
因此 AgentLens 降级为获客漏斗（卖"修复"不卖"分数"），**AgentFront（欧美 SMB agentic-commerce 接入工具）升级为主力方向**——
这是调研中唯一验证到的空档。

> 为什么是这个方向？完整调研与决策见 [docs/research-decision.md](docs/research-decision.md)。
> 一句话：不做拥挤的 AI 应用，做"让所有网站被 AI 看见、被 Agent 使用"的铲子生意——
> GEO 市场以 ~50% CAGR 增长但 SMB 无人服务；65% 的头部网站没有 llms.txt；
> agentic commerce 每年 4 倍增长而几乎没人卡位。

## 三个站点

| 目录 | Worker 名 | 站点 | 说明 |
|---|---|---|---|
| `sites/agentlens/` | `createjob` | **AgentLens** | AI 可见性 & Agent 就绪度检测器。输入任意网址，检测 AI 爬虫权限（robots.txt）、llms.txt、结构化数据（JSON-LD）、Agent 就绪度等 20+ 项，输出 0-100 分与按优先级排序的修复清单。含免费 JSON API：`GET /api/check?url=<site>`。邮箱捕获存入 KV。 |
| `sites/llmstxt-builder/` | `llmstxt-builder` | **llms.txt Builder** | 免费 llms.txt 生成器（表单→实时预览→复制/下载）+ 完整入门指南。纯静态，抢占新兴关键词，引流至 AgentLens。 |
| `sites/agentfront/` | `agentfront` | **AgentFront** | Agentic commerce（Agent 商店）卡位站：阐述市场数据、四层 Agent 原生商店架构，等待名单入 KV。站点自身即示范：携带 llms.txt、agents.txt、`/api/catalog` 机器可读目录。 |

三站页脚/导航互链（链接按当前 workers.dev 子域自动推导，换账号部署无需改代码）。

## 本地开发

```bash
npm install
npm run dev              # AgentLens  -> localhost:8787
npm run dev:llmstxt      # Builder
npm run dev:agentfront   # AgentFront
```

## 部署

见 [DEPLOY.md](DEPLOY.md)。最短路径：

```bash
npx wrangler login
npm run deploy           # 依次部署三个 Worker
```

## 营收与演进（摘要）

- **短期**：免费工具获客 → 邮箱名单（KV `createjob-signups`）；
- **中期**：AgentLens 定时监控订阅（$9-29/月，切企业级工具 $500+/月覆盖不到的 SMB）；
- **长期**：扫描 API 按量计费（Agent 生态的"信用评分"）；AgentFront 在 x402/ACP 支付协议成熟后做 Agent 商店模板/抽佣;
- **进化机制**：AI 生态每出一个新标准（WebMCP、A2A、AP2…），在检测引擎加一条规则 + 发一篇指南页，产品即自动跟随时代。
