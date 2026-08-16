# AGENTS.md

## 项目定位

本仓库实现 `dsh-fork-diff`：一个面向 DeepSeek Harness 的只读会话分支比较插件。它读取公开会话列表和历史 API，在当前分支与相关父、子或兄弟分支之间展示结构化差异。

## 开发分工

- Codex 主导架构、实现、测试、真实部署、证据收集和发布。
- Claude 仅在实现与证据稳定后进行只读独立审核，不参与编码。
- 禁止读取、修改或干扰 `D:\knowledgeBase\dsh-session-tree`。

## 语言与编码

- 文档使用简体中文；源码标识符和必要注释使用英文。
- 文本文件统一使用 UTF-8，禁止 ANSI、GBK 或本地代码页覆写。
- 编辑优先使用原生 `apply_patch`；编辑后执行 UTF-8 严格解码、`git diff --check` 和定向测试。

## 产品边界

- 只读取 `sessions.list`、`sessions.open(id)` 与 `connection.api.sessions.history(...)`。
- 不创建 fork，不写 session event，不恢复 Agent，不注入 prompt，不修改文件，不上传会话。
- v1 比较公开历史中的用户消息、最终回答、工具调用/结果、耗时和 usage。
- 客户端摘要未暴露持久化 `SessionHeader.seedLength`；不得宣称事件级精确共同祖先、精确 fork 点、安全 merge 或自动判断赢家。
- 所有分支选择必须来自真实 parent/child/sibling 血缘，不把无关会话放进默认候选。

## DSH 契约

- 插件消费的会话列表字段是 `id` / `parentId` / `displayTitle`，不是 Host wire 的 `sessionId` / `parentSessionId`。
- UI 挂载点是 `conversation.session.header.actions`，顺序为 16。
- 浏览器产物必须调用 `window.__ModuleLoader__.load({ id, factory })`。
- React、Cordis、slots、runtime 和 DSH UI primitives 必须 external，禁止打包第二份 React。
- 每个 Cordis effect 都必须有精确 disposer；插件卸载后不得留下样式、监听器或 DOM。

## 代码质量

- 历史分页、事件归一化、血缘候选、结构 diff 与统计必须是可独立测试的纯函数。
- 历史分页需要检测无进展、重复 seq、非连续页和请求失败，失败关闭并向用户显示可恢复错误。
- 不将未经识别的必需事件静默解释为已支持；未知展示数据可以降级为明确的摘要。
- UI 必须支持键盘操作、Escape 关闭、焦点恢复、加载/空/错误状态、桌面双栏和移动端单栏。
- 不记录会话正文、凭据、Cookie、环境变量或隐藏应用状态。

## 门禁与发布

- 使用 `$dsh-plugin-real-release-gate` 按 Stage 0→4 执行，并区分 `FIRST_PASS`、`PASS_AFTER_CHANGES`、`FAIL`。
- Stage 2 先走官方 Git 安装；仅在记录真实失败后使用预构建 tarball 回退。
- Stage 3 必须在真实 DSH 中创建父会话与两个兄弟 fork，验证实际历史差异、交互、控制台和网络错误，并生成本插件自己的至少三张截图。
- README 必须包含痛点、安装命令、真实截图、使用说明、隐私边界和兼容版本。
- 发布前执行 Claude CLI 只读独立审核；`HOLD` 修复后使用新的 R2 通知与回执，不覆盖 R1。
- 禁止强推或替用户合并 PR；推送、Release 和 awesome PR 只在对应门禁与授权范围内进行。

## 计划与证据

- `task_plan.md`：阶段状态、门禁和错误记录。
- `findings.md`：源码契约与调研事实。
- `progress.md`：执行、命令、结果和修正过程。
- `docs/release-evidence.md`：可复核的真实构建、安装和浏览器证据。
- `docs/release-report.md`：最终结论与发布对象。

## 记忆去重

- 写入共享文档前先搜索同义内容，优先更新既有段落，避免在多个文件复制同一事实。
- 本项目事实只写入本仓库需要的共享文档；不额外写私有或跨项目长期记忆。
- 大范围合并、迁移或删除持久记忆必须先取得用户确认。
