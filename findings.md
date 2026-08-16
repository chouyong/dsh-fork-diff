# Findings

## 2026-08-16 Stage 0

- DSH 源码为 `D:\knowledgeBase\deepseek-harness`，版本 `0.1.0-rc.5`；Cordis 为 `D:\knowledgeBase\cordis`。
- DSH home 为 `D:\dsh-home`，Web profile 为 `D:\dsh-home\profiles\web`。
- `sessions.binding(id)` 只解析当前绑定，不能用于加载两个非当前会话。
- 正式浏览器 API `ctx.connection.api.sessions.history({ sessionId, beforeSeq, maxMessages })` 可读取任意普通会话；Host 对冷会话做持久化 inspection，不恢复 Agent、不发布事件。
- DSH 客户端常量 `PAGE_MESSAGES = 50`。分页按完整 append-origin 消息边界切割，返回 `{ events: HistoryEntry[], hasMore, projections? }`；用当前页最小 `seq` 作为下一页 `beforeSeq`。
- `HistoryEntry` 由原始 `SessionEvent` 与可选 `ToolEventView` 组成。插件只需要公开事件，不读取内部数据库。
- 客户端插件消费的列表行为是 `id` / `parentId` / `displayTitle`，可用 `sessions.open(id)` 导航；挂载点是 `conversation.session.header.actions`。
- 持久化 `SessionHeader.seedLength` 没有进入插件可消费的列表摘要。v1 只能按 lineage 选择比较对象、按可见历史推导共同前缀，不得称为精确 fork boundary。
- 浏览器构件必须通过 `window.__ModuleLoader__.load({ id, factory })` 注册，并 external 宿主 React/Cordis/DSH 模块。
- 客户端 connection 插件通过 `ctx.provide('connection', handle)` 暴露 `handle.api: IApiClient`；本插件使用 `ctx.get('connection')` 的局部契约即可，不需要导入未发布的完整连接类型。
- `IApiClient.sessions.history(payload, signal?)` 支持 `AbortSignal`。面板关闭或比较对象变化时必须中止两侧读取，并忽略旧请求结果。
- `dsh-fork-graph` 的公开发行结构包含独立 Node/browser 入口、`cordis.patch.yml`、tsdown ModuleLoader bundle、局部 contract、纯函数测试与 bundle contract；本插件只复用工程契约，不复制其图组件。
- 2026-08-16 的 GitHub 同名与描述搜索未发现可见的 `dsh-fork-diff` 或 DSH 会话 fork diff 插件；该结果表示低可发现性，不证明绝对不存在。

## MVP 决策

- 默认候选优先级：兄弟分支，其次父分支，再次直接子分支；当前会话固定为左侧。
- 比较单元：用户消息、assistant 最终消息、tool call、tool result。
- 统计：可见条目数、工具数、错误工具数、turn 起止时间推导耗时、assistant usage 汇总。
- 差异模型使用稳定序列对齐，输出 unchanged/changed/left-only/right-only；不修改任一会话。
- 桌面双栏，移动端单栏；加载、空、错误和未知内容均有明确状态。

## 2026-08-16 Stage 1 收口

- 真实 DSH web profile 的客户端模块包名已经从本地源码和运行契约复核：`@deepseek-ai/dsh-client-connection`、`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`；插件的 `dsh.client.inject` 与此一致。
- `npm run typecheck`、`npm run build`、提升权限后完整 Vitest（7 个文件、20 个用例）和 bundle contract 均通过。首次 bundle contract 的失败来自检查器格式假设，已修正检查器并重新通过，因此最终发布分类不能是 `FIRST_PASS`。
- 仍未产生真实运行截图，README 暂不声称浏览器行为已验收；截图必须来自本插件的真实 DSH 运行。
- DSH 官方文档确认：checkout 安装为 `dsh plugin --profile <name> add ./plugin`；GitHub 安装为 `github:owner/repo`；Git dependency 的 `prepare` 在 pnpm 10+ 首次通常因 `allowBuilds` 失败，必须只复制 pnpm 报出的精确包键后重试。预构建 tarball 不需要构建授权。
- 本机没有全局 `dsh` 命令，验收使用已构建的 `D:\knowledgeBase\deepseek-harness\apps\cli\lib\bin.js`，版本与源码一致为 `0.1.0-rc.5`。
