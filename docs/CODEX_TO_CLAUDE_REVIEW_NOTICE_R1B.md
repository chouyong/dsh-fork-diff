# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R1B（R1 无回执超时后的拆分审核）

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-fork-diff`
- 审核对象：`scripts/verify-real-browser.mjs`、`README.md`、`docs/browser-gate-receipt.json`、`docs/release-evidence.md`、`docs/release-report.md`、`assets/`、`package.json`
- 目标回执：`D:\knowledgeBase\dsh-fork-diff\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1B.md`
- 只审浏览器验收脚本、文档陈述、构件/截图哈希和本地发布证据；源码语义由 R1A 审核。

## Baseline

- Git 基线：`1bc86a817046edbde93b4bfe6251492e2c3eb8fa`；当前 dirty worktree 是 Codex 本轮待提交变更。
- 当前状态：真实 DSH `0.1.0-rc.5` 隔离 profile 已完成父会话与两个兄弟 fork 的 Edge 验收；机器回执为 `docs/browser-gate-receipt.json`。
- 关键哈希：tarball `1DA73B9C75A37B061819D95DE507867382E1A0571D3F425683AC7F39D9230CA6`；browser bundle `8371F230A2C695A03F34E40D24CAAFD473EB6884D2F65F7685DC170FCA5EA2BA`；三张截图哈希记录在 `docs/release-evidence.md`。

## 变更意图

审核发布材料是否只表达已验证事实：Git source 安装在 DSH `0.1.0-rc.5` 先遇到 pnpm prepare 限制，精确放行后又因未发布 `@deepseek-ai/dsh-paths@^0.0.1-rc.1` 返回 404，最终成功路径是预构建 tarball fallback。README 不得把 Git source 写成成功安装，也不得宣称精确 fork boundary、首个/唯一插件或未执行的远端发布结果。

## Project Guardrails

- 遵守项目 `AGENTS.md`、`CLAUDE.md` 和用户全局规则。
- 只读审核，不修改任何文件或外部状态。
- 不读取凭据、Cookie、session 数据库或隐藏应用状态，不访问生产，不启动新的模型或子代理。
- `GO` 仅限本通知声明的技术范围，不代表发布批准、安全放行或真人裁决。

## Reproduction Commands

```text
git diff 1bc86a817046edbde93b4bfe6251492e2c3eb8fa -- README.md scripts docs assets package.json
Get-Content -Raw -Encoding UTF8 docs/browser-gate-receipt.json
Get-FileHash -Algorithm SHA256 dsh-fork-diff-0.1.0.tgz,lib/client.js,assets/*.png
```

Claude 没有 Bash 权限，不应执行命令；请用 Read、Glob、Grep 检查文件。命令仅列出 Codex 独立复核范围。

## Known Gaps

- GitHub 公共仓库、Release 与两个 awesome PR 尚未创建；README 中的 Release URL 是发布完成后的一键安装目标，不能当作当前已可下载证据。
- R1B 不重新判断源码语义，只核对脚本和现有证据是否自洽、诚实且无越界行为。

## 审核重点

1. 浏览器脚本是否仅通过公开 UI/API 验证候选、差异、导航、键盘、移动布局和错误收集，不读取隐藏 session 存储或凭据。
2. receipt、截图、构件和 profile 哈希是否相互一致，是否区分中间构件与最终构件、失败 Git 安装与成功 tarball fallback。
3. README 和 release 文档是否没有提前声称 GitHub Release/PR 已完成，也没有夸大精度、唯一性或真实安装路径。

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
