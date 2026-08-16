# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R1

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-fork-diff`
- 审核对象：基线 `1bc86a817046edbde93b4bfe6251492e2c3eb8fa` 到当前 dirty worktree 的全部插件源码、测试、README、发布证据和浏览器验收脚本；重点为 `src/client/normalize.ts`、`tests/normalize.spec.ts`、`scripts/verify-real-browser.mjs`
- 目标回执：`D:\knowledgeBase\dsh-fork-diff\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1.md`
- 只审上述范围；范围外变化只记录，不顺手修改。

## Baseline

- Git 基线：`1bc86a817046edbde93b4bfe6251492e2c3eb8fa`；当前分支 `main`，工作树有本轮未提交实现、测试、文档、截图和证据文件。
- 当前状态：最终 `npm run verify` 通过；typecheck、build、7 个测试文件 22/22、bundle contract 全部通过；`git diff --check` 和 UTF-8 strict 通过。
- 关键哈希：最终 tarball `dsh-fork-diff-0.1.0.tgz` 为 `A96D23B9CD441FA82C2ADD867A6E8212854CFBB78AAB785803C696AD7AFED9E5`；`lib/client.js` 为 `AA3A6E696FFCD515BC57538721C022B88225E8949225203A387019F4BDEFAD60`；三张截图哈希见 `docs/release-evidence.md`。
- 真实浏览器回执：`docs/browser-gate-receipt.json`；最终安装 profile 为 `D:\dsh-home\profiles\fork-diff-web`，DSH `0.1.0-rc.5`，Microsoft Edge `1440x1000` 与 `390x844`，console/page/request 错误均为 0。

## 变更意图

本轮修复真实 DSH 历史暴露的三项问题：只把 `source.kind = user` 计为直接用户消息；递归提取嵌套 `tool-result` 文本并识别 block-level error；明确忽略当前 DSH 正常控制/元数据事件，同时对真正未知 required 事件保持可见。新增真实 Edge 浏览器验收脚本、三张截图、中文 README 和发布证据。必须保持纯只读、无 session 写入、无凭据访问、无第二份 React，并且 README 不得把已验证会失败的 Git source 路径写成可用安装方式。

## Project Guardrails

- 遵守项目 `AGENTS.md`、`CLAUDE.md` 和用户全局规则。
- 只读审核，不修改任何文件或外部状态。
- 不读取凭据、Cookie、session 数据库或隐藏应用状态，不访问生产。
- 不调用 Codex、另一 Claude 会话、Agent 或任何其它模型。
- `GO` 仅限本通知声明的技术范围，不代表发布批准、真人审批或安全放行。

## Reproduction Commands

```text
git diff --stat 1bc86a817046edbde93b4bfe6251492e2c3eb8fa
git diff --check
npm run verify
Get-Content -Raw -Encoding UTF8 docs/browser-gate-receipt.json
Get-FileHash -Algorithm SHA256 dsh-fork-diff-0.1.0.tgz,lib/client.js,assets/*.png
```

## Known Gaps

- GitHub 公共仓库、Release 和两个 awesome 列表 PR 尚未创建；本轮只审核源码、最终构件和本地真实门禁。
- DSH 客户端摘要没有持久化 `seedLength`，因此插件不宣称精确 fork boundary 或事件级共同祖先。
- Claude 不具备 Bash/Write/Edit，也不应执行上述命令；命令和回执只作为待核对证据，Codex 会独立复核关键结果。

## 审核重点

1. `normalizeHistory` 是否会误把 agent/plugin/skill 上下文计为用户消息，或在嵌套 tool-result 中丢正文/错误标记。
2. 已知事件忽略集合、未知 required 事件提示、surface folding 和 diff 统计是否保持失败可见与边界一致。
3. UI 是否保持候选血缘约束、当前高亮、切换/导航、Escape/焦点陷阱、移动布局和无外部副作用；bundle 是否 external 宿主 React/Cordis/DSH 模块。
4. README、截图、browser receipt 和安装说明是否只表达已验证事实，是否把中间构件或失败 Git 安装误写成最终成功。

## Forbidden Actions

- 禁止 Write/Edit、commit、push、部署、服务重启、计划任务、凭据访问和外部消息。
- 禁止调用 Codex、Claude 子会话、Agent 或其它模型。
- 禁止使用权限绕过参数、读取隐藏会话存储或猜测未在本通知声明的事实。

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
