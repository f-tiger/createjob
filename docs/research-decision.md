# AI 时代创业机会调研与决策报告

日期：2026-07-19 ｜ 状态：已决策，已执行（三站已建成）

## 一、目标回顾

1. 创建多个网站并上线 Cloudflare；
2. 调研创业机会，选择**容易落地执行、可自动化转化营收、非拥挤赛道**的方向；
3. 网站要能**跟随 AI 时代进化**，并提前布局未来 10x / 100x 的方向。

## 二、关键调研发现（2026 年 7 月）

### 1. AI 搜索正在取代传统搜索，"AI 可见性"成为新刚需

- 2026 年美国约 **31.3%** 的人口使用生成式 AI 搜索（ChatGPT 占 AI 搜索约 70% 份额）；
- Google 头部链接与 AI 引用来源的重合度已从 **70% 跌到 20% 以下**——在 Google 排名好 ≠ 被 AI 看见；
- AI 可见性赢家与输家的差距已达 **9 倍**，且每月扩大 3.2%；只有 **16%** 的品牌系统性追踪 AI 搜索表现；
- GEO（生成引擎优化）市场：2025 年约 **$8.5 亿** → 预计 2034 年 **$337 亿**（CAGR ~50%）。

**赛道拥挤度**：已有 8-15 家 GEO 平台，但**全部面向企业客户（enterprise）**；调研明确显示"大多数 SMB 和中型团队还没有开始做 GEO"。→ **SMB 自助工具是空档**。

### 2. Agentic Web（智能体网络）处于极早期，是 10x-100x 的布局窗口

- OpenAI、Anthropic、Google、Perplexity 均已发布能替人浏览、下单的 Agent；
- eMarketer 预测 2026 年 AI 平台将承接美国零售电商约 **$209 亿**（去年的 4 倍）；摩根士丹利预测 2030 年 agentic commerce 影响达 **$3850 亿**；
- x402 支付协议至 2026 年 4 月已有 ~6.9 万个 Agent 结算 **1.65 亿+笔**交易；
- 头部 100 网站的"Agent 就绪度"平均仅 **55%**，**65% 的头部网站连 llms.txt 都没有**；
- Cloudflare 官方推出了 Agent Readiness 评分——巨头入场验证了赛道，但工具生态几乎空白。

### 3. 传统"内容站+广告"模式已被证伪（须避开）

- 全球出版商 Google 搜索流量一年内下降 **33%**；58.5% 的美国搜索**零点击**；
- 2026 年 3 月核心更新后，纯批量内容站流量暴跌 60-90%；
- 结论：**避开**内容农场/广告变现模式；**工具型、数据型、API 型**站点是 AI 时代唯一可规模化的形态。

## 三、候选方向对比

| 方向 | 落地难度 | 拥挤度 | 自动化营收 | AI 时代进化性 | 10x/100x 潜力 |
|---|---|---|---|---|---|
| A. SMB 自助 AI 可见性工具（GEO/AEO 检测） | 低（纯 Worker 可实现） | 低（企业级拥挤，SMB 自助空白） | 高（免费扫描→订阅监控） | 高（检测项随 AI 生态扩展） | 中-高 |
| B. llms.txt / Agent 协议工具与内容 | 极低（静态站） | 极低（标准刚兴起） | 中（引流+SEO/GEO 入口） | 高（跟随协议演进） | 中 |
| C. Agentic Commerce 基础设施（Agent 商店） | 中（协议未定型，先卡位） | 极低（几乎无人做 SMB 层） | 前期低、后期极高 | 极高 | **极高（百倍级）** |
| D. 程序化 SEO 内容站 + 广告 | 低 | 高 | 已失效 | 低 | 低 |
| E. 通用 AI SaaS（聊天机器人等） | 中 | **极高** | 中 | 中 | 低（红海） |

**否决 D、E**（拥挤/已死），**采纳 A+B+C 组合**——三者共享同一叙事（"帮网站进入 AI 时代"），互相导流，形成漏斗矩阵而非孤立站点。

## 四、最终决策：「AI-First Web 工具矩阵」

> 淘金热里卖铲子：不做拥挤的 AI 应用，做"让所有网站被 AI 看见、被 Agent 使用"的基础设施工具。

### 三个网站及分工

| 站点 | Worker 名 | 角色 | 营收路径 |
|---|---|---|---|
| **AgentLens** — AI 可见性检测器 | `createjob`（旗舰） | 流量入口+转化核心：输入网址秒出 0-100 分与修复清单 | 免费扫描 → 邮箱捕获 → 未来 $9-29/月订阅监控（对标企业级 $500+/月的 1/20 价格切 SMB） |
| **llms.txt Builder** — 生成器+指南 | `llmstxt-builder` | SEO/GEO 引流：抢占 "llms.txt generator" 等新兴关键词 | 引流到 AgentLens；未来加 API 付费版 |
| **AgentFront** — Agent 商店模板 | `agentfront` | 百倍期权：agentic commerce 卡位+等待名单 | 等待名单验证需求 → 模板/SaaS 收费（x402 时代抽佣） |

### 为什么这个组合满足全部三条目标

1. **易落地**：全部跑在 Cloudflare Workers 免费额度内，零边际成本，已全部建成；
2. **可自动化营收**：工具自助使用、邮箱自动入库（KV）、无需人工交付；扫描 API 本身对 Agent 开放（`/api/check?url=`），未来可按调用计费；
3. **非拥挤**：SMB 自助 GEO 检测、llms.txt 工具、Agent 商店三个细分都处于空白/极早期；
4. **随 AI 进化**：检测引擎的检查项是数据驱动的——新协议（WebMCP、A2A、AP2…）出现即加一条检查规则，产品自动"变新"；
5. **10x/100x 布局**：AgentFront 押注 agentic commerce（4 倍/年增速，2030 年 $3850 亿）；AgentLens 的扫描 API 未来可成为 Agent 生态的"信用评分"基础设施。

## 五、演进路线图

- **T0（已完成）**：三站上线，免费工具跑通，邮箱捕获开始积累名单；
- **T+1 个月**：绑定自定义域名（对 GEO 至关重要）；提交搜索引擎；在 Product Hunt / HN / IndieHackers 发布 AgentLens 免费扫描；
- **T+3 个月**：根据 KV 中的名单量验证需求；上线定时监控（Cron Triggers + 邮件报告）作为首个付费功能；
- **T+6 个月**：扫描 API 商业化（按量计费，面向 Agent 与开发者）；AgentFront 按等待名单反馈决定做模板还是 SaaS;
- **持续**：每当 AI 生态出现新标准，24 小时内加入检测项并发一篇对应指南页——这是别人难以自动化、而本矩阵天然自动化的护城河。

## 六、数据来源

- [eMarketer: FAQ on GEO and AEO 2026](https://www.emarketer.com/content/faq-on-geo-aeo--where-ai-search-seo-overlap-2026)
- [Omnibound: GEO Statistics 2026](https://www.omnibound.ai/blog/generative-engine-optimization-statistics)
- [MarketScale: GEO platforms multiply in 2026](https://www.marketscale.com/industries/marketing-tech/ai-answer-engine-visibility-becomes-a-measurable-discipline-as-geo-platforms-multiply-in-2026)
- [Cloudflare Blog: Agent Readiness score](https://blog.cloudflare.com/agent-readiness/)
- [Sanbi: The Agent Stack 2026 — MCP, A2A, x402, AP2, llms.txt](https://sanbi.ai/blog/agent-stack-protocols-2026)
- [AgentGrade: Agent Readiness](https://agentgrade.com/agent-readiness)
- [Omnibound: AI SEO Statistics — zero-click & traffic decline](https://www.omnibound.ai/blog/ai-seo-statistics)
- [GrackerAI: Is Programmatic SEO Still Effective in 2026](https://gracker.ai/blog/is-programmatic-seo-still-effective-2026)
- [Fortune: Solo founders using AI](https://fortune.com/2026/05/18/solo-founders-ai-automation-entire-teams-entrepreneurs/)
- [SimplyBusiness: Solopreneur ideas 2026](https://www.simplybusiness.com/resource/best-solopreneur-business-ideas-for-2026-future-proof-high-profit/)
