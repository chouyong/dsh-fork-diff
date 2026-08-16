# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R1A（R1 无回执超时后的拆分审核）

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-fork-diff`
- 审核对象：`src/`、`tests/`、`package.json`、`tsdown.config.ts`、`AGENTS.md`、`CLAUDE.md`
- 目标回执：`D:\knowledgeBase\dsh-fork-diff\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1A.md`
- 只审源码正确性、归一化行为、测试覆盖和纯只读边界；README、截图、浏览器脚本及发布证据留给 R1B。

## Baseline

- Git 基线：`1bc86a817046edbde93b4bfe6251492e2c3eb8fa`；当前 dirty worktree 是 Codex 本轮待提交变更。
- 当前状态：最终 `npm run verify` 已通过，包含 typecheck、build、7 个测试文件 22/22 和 bundle contract。
- 关键哈希：当前 `lib/client.js` SHA-256 为 `AA3A6E696FFCD515BC57538721C022B88225E8949225203A387019F4BDEFAD60`。

## 变更意图

审核插件是否通过 DSH 公开 API 只读比较真实父、子和兄弟分支；重点检查本轮归一化修复：只有 `data.source.kind === 'user'` 的 `user/message` 算直接用户消息，嵌套 `tool-result` 正文与错误标记被递归提取，已知控制事件被忽略而真正未知的 required 事件仍保持可见。不得写 session、注入 prompt、读取隐藏存储或打包第二份 React。

## Project Guardrails

- 遵守项目 `AGENTS.md`、`CLAUDE.md` 和用户全局规则。
- 只读审核，不修改任何文件或外部状态。
- 不读取凭据、Cookie 或 session 数据库，不访问生产，不启动新的模型或子代理。
- `GO` 仅限本通知声明的技术范围，不代表发布批准、安全放行或真人裁决。

## Reproduction Commands

```text
git diff 1bc86a817046edbde93b4bfe6251492e2c3eb8fa -- src tests package.json tsdown.config.ts
npm run verify
```

Claude 没有 Bash 权限，不应执行命令；请用 Read、Glob、Grep 检查文件。命令仅列出 Codex 独立复核范围。

## Known Gaps

- DSH 客户端摘要不持久化公开 `seedLength`，实现不得宣称精确 fork boundary 或事件级共同祖先。
- GitHub 发布、Release 和 awesome PR 尚未执行；不属于 R1A。

## 审核重点

1. `normalizeHistory` 是否可能误计 agent/plugin/skill 上下文，或遗漏嵌套 tool-result 正文与错误标记。
2. 已知控制事件忽略集合、真正未知 required 事件提示、surface folding、分页失败关闭和 diff 统计是否边界一致。
3. 是否严格只读、候选仅限真实血缘、Cordis effect 可逆、宿主 React/Cordis/DSH 模块保持 external，且测试能覆盖高风险回归。

## Forbidden Actions

- 禁止 Write/Edit、Bash、commit、push、部署、服务重启、计划任务、凭据访问和外部消息。
- 禁止调用 Codex、Claude 子会话、Agent 或其它模型。
- 禁止使用权限绕过参数、读取隐藏会话存储或扩大审核范围。

## 回执契约

按以下顺序输出，并以唯一末行收口：

```text
## Findings
## Actions Executed and Not Executed
## Review Scope
## Evidence Gaps
## Residual Risks
FINAL_DECISION: GO
```

存在任何阻塞项或证据不足时，末行必须改为 `FINAL_DECISION: HOLD`。
