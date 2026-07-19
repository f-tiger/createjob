# 工作规则（用户指定，长期有效）

1. **先优化 Prompt，再执行任务**：接到任何任务，先把它改写为一个明确的、带验收标准的优化版 Prompt（目标、必须回答的问题、输出要求、约束），向用户展示后再开始执行。
2. **重大方向决策前先深度调研竞对**：评估赛道拥挤度、免费巨头覆盖、差异化空间，给出"继续/调整/放弃"的明确结论后再动手建设。

# 项目背景

**⚠️ 本仓库已于 2026-07-19 合并入 f-tiger/sellsomething（以该仓库为主体），仅维持在线待下线确认。**
AgentFront 已迁至 sellsomething/sites/agentfront；调研文档已同步迁移。
遗留：lens/agentfront.agiscorecard.com 两个域名仍挂在 createjob Worker 上。


AI-First Web 工具矩阵（三站统一部署在 Cloudflare Worker `createjob` 上，Workers Builds 推送自动部署）：

- AgentLens（lens.agiscorecard.com，/）：AI 可见性检测器，`/api/check?url=` 免费扫描 API——定位为获客漏斗
- llms.txt Builder（llmstxt.agiscorecard.com，/builder/）：引流资产，零投入维持
- AgentFront（agentfront.agiscorecard.com，/store/）：**主力方向**——欧美 SMB agentic-commerce 接入工具（2026-07-19 竞对调研结论，见 docs/competitive-analysis.md：检测/监控已被免费巨头商品化，接入层是唯一空档）
- workers.dev 备用地址：https://createjob.tuoqiantu.workers.dev/
- 调研与决策记录：docs/ 目录
- 注意：Workers Builds 会把 CI 内所有 wrangler deploy 强制改名为 createjob，独立 Worker 需本地部署或控制台连接（见 DEPLOY.md）
- 用户的 Cloudflare 账号下另有并行会话创建的同类站点（agentready、selltoagents 等），做方向决策时需考虑内部重叠
