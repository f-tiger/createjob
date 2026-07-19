# 工作规则（用户指定，长期有效）

1. **先优化 Prompt，再执行任务**：接到任何任务，先把它改写为一个明确的、带验收标准的优化版 Prompt（目标、必须回答的问题、输出要求、约束），向用户展示后再开始执行。
2. **重大方向决策前先深度调研竞对**：评估赛道拥挤度、免费巨头覆盖、差异化空间，给出"继续/调整/放弃"的明确结论后再动手建设。

# 项目背景

AI-First Web 工具矩阵（三站统一部署在 Cloudflare Worker `createjob` 上，Workers Builds 推送自动部署）：

- AgentLens（/）：AI 可见性检测器，`/api/check?url=` 免费扫描 API
- llms.txt Builder（/builder/）
- AgentFront（/store/）：agentic commerce 卡位站
- 线上地址：https://createjob.tuoqiantu.workers.dev/
- 调研与决策记录：docs/ 目录
- 注意：Workers Builds 会把 CI 内所有 wrangler deploy 强制改名为 createjob，独立 Worker 需本地部署或控制台连接（见 DEPLOY.md）
- 用户的 Cloudflare 账号下另有并行会话创建的同类站点（agentready、selltoagents 等），做方向决策时需考虑内部重叠
