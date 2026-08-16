# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R2B（修复 R1B HOLD 后复审）

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-fork-diff`
- 审核对象：`README.md`、`scripts/verify-real-browser.mjs`、`docs/browser-gate-receipt.json`、`docs/release-evidence.md`、`docs/release-report.md`、`package.json`、`package-lock.json`、`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1B.md`。
- 目标回执：`D:\knowledgeBase\dsh-fork-diff\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R2B.md`
- 只判断 R1B 的 F1-F5 是否关闭；不重新审核源码算法或 R2A。

## Baseline

- 基线：R1B 回执 `FINAL_DECISION: HOLD`；Git HEAD 仍为 `1bc86a817046edbde93b4bfe6251492e2c3eb8fa` 加当前待提交 worktree。
- 当前验证：`node --check scripts/verify-real-browser.mjs`、`npm run verify`、官方 tarball remove→add、增强 Edge 门禁均通过。
- 最终 tarball：239,114 字节，SHA-256 `2E83CFD413E2F706DF589CA3888A73AE3EEDAF0509151D59E0E2408BF0C8C0BF`。
- browser bundle：48,184 字节，SHA-256 `8371F230A2C695A03F34E40D24CAAFD473EB6884D2F65F7685DC170FCA5EA2BA`。
- browser receipt：SHA-256 `CA09182F3CD16CC4BDE90F302EF6AD185645D0CF01BBD931FE71F9F12E428D8C`。

## 变更意图

关闭 R1B 五项：README 明确 Release URL 仅在发布后可用，远端必须下载核对哈希；回执机器绑定 UTC、Git、DSH/Edge、served/local bundle 和三图哈希；父分支正文断言在“全部”视图中核对右侧真实 cell；删除过期“待填写”；peerDependencies 与实际 inject 同时声明 `@deepseek-ai/dsh-client-ui-conversation` 并同步 lockfile。

## Project Guardrails

- 遵守项目 `AGENTS.md`、`CLAUDE.md` 和用户全局规则。
- 只读审核，不修改任何文件或外部状态。
- 不读取凭据、Cookie、session 数据库或隐藏应用状态，不访问生产，不启动新的模型或子代理。
- `GO` 仅表示 R1B F1-F5 在本通知范围内关闭，不代表发布批准、安全放行或真人裁决。

## Reproduction Commands

```text
node --check scripts/verify-real-browser.mjs
npm run verify
Get-FileHash -Algorithm SHA256 dsh-fork-diff-0.1.0.tgz,lib/client.js,assets/*.png,docs/browser-gate-receipt.json
```

Claude 没有 Bash 权限，不应执行命令；请用 Read、Glob、Grep 核对文件。命令仅列出 Codex 已独立执行的验证。

## Known Gaps

- GitHub 仓库与 v0.1.0 Release 仍未创建；README 现在明确发布前 URL 不可用，发布后必须下载核对同一哈希。
- 回执记录 `git.dirty = true` 并绑定 status/diff 指纹，因为本轮审核发生在提交前；运行时构件由 served/local bundle 同哈希直接绑定。
- R1A 的未知事件形状和近似匹配质量 residual risks 不属于 R2B。

## 审核重点

1. README 是否不再把当前不存在的 Release URL 描述为已验证可用源，同时保留发布后可执行的一键安装命令。
2. 回执是否由脚本真实生成并绑定 Git、实际浏览器版本、DSH 版本、served/local bundle 和三张截图；父正文检查是否只可能命中右侧 row cell。
3. 证据占位是否消失，conversation peer 是否与 inject 及 lockfile 一致，文档哈希是否引用最终构件而非中间构件。

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

R1B 任一 F1-F5 未关闭或证据不足时，末行必须改为 `FINAL_DECISION: HOLD`。
