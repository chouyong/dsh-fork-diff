# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R2A（修复 R1A HOLD 后复审）

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-fork-diff`
- 审核对象：`src/client/diff.ts`、`tests/diff.spec.ts`、`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1A.md`；仅为关闭 R1A 的两个阻塞项，并核对 slot 生命周期证据。
- slot 权威旁证：`D:\knowledgeBase\deepseek-harness\packages\client\runtime\src\client\slots.ts` 第 119-176 行，只读。
- 目标回执：`D:\knowledgeBase\dsh-fork-diff\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R2A.md`
- 不重新审核 R1B 范围；范围外变化只记录，不顺手修改。

## Baseline

- 审核基线：R1A 回执中的 `FINAL_DECISION: HOLD`；Git 基线仍为 `1bc86a817046edbde93b4bfe6251492e2c3eb8fa` 加当前 dirty worktree。
- 当前状态：R1A 后只在 `greedyMatches` 增加位置桶边界检查，并新增一个真实进入近似路径、耗尽重复 fingerprint 右侧位置的 700×700 回归用例。
- 验证结果：定向 diff 测试 4/4；完整 `npm run verify` 为 7 个文件 23/23、typecheck/build/bundle contract 全部通过。
- 关键哈希：最终 `lib/client.js` SHA-256 为 `8371F230A2C695A03F34E40D24CAAFD473EB6884D2F65F7685DC170FCA5EA2BA`。

## 变更意图

R1A 发现 `greedyMatches` 在 `offset` 越过 bucket 末尾后用 `-1` 继续比较，导致无界循环；本轮要求它在 bucket 耗尽时立即跳过，并用高风险重复 fingerprint 用例证明 fallback 能结束且保留一个有效匹配。不得改变 exact LCS、行对齐或插件只读边界。

R1A 对 `slots.inject` 卸载是否自动清理留有证据缺口。DSH 权威实现注释明确：服务代理在调用时把 `this.ctx` 绑定到调用方 context，controller 属于调用方 fiber，插件卸载会取消 pending wait 并移除 active contribution；内部又用嵌套 `ctx.effect(callback, ...)` 管理 `slots.register()` 返回的 disposer。请只读核对上述源码，不要求插件额外嵌套 disposer。

## Project Guardrails

- 遵守项目 `AGENTS.md`、`CLAUDE.md` 和用户全局规则。
- 只读审核，不修改任何文件或外部状态。
- 不读取凭据、Cookie、session 数据库或隐藏应用状态，不访问生产，不启动新的模型或子代理。
- `GO` 仅代表 R1A 阻塞项在本通知范围内关闭，不代表发布批准、安全放行或真人裁决。

## Reproduction Commands

```text
npx vitest run tests/diff.spec.ts
npm run verify
```

Claude 没有 Bash 权限，不应执行命令；请用 Read、Glob、Grep 检查文件。命令仅列出 Codex 已独立执行的验证。

## Known Gaps

- R1A 的未知 source/surface 形状和 metrics 展示口径属于已记录的非阻塞 residual risks，本轮不把它们伪装成已修复。
- README、浏览器脚本、截图和发布证据由顺序执行的 R1B 审核，不属于 R2A。

## 审核重点

1. bucket 边界是否在所有 `rightFloor`/offset 状态下终止，且不会跳过仍可用的递增位置。
2. 新测试是否确实满足 `leftMiddle.length * rightMiddle.length > 400_000`、共享重复 fingerprint 且左侧需求超过右侧可用位置，而非再次绕过缺陷分支。
3. DSH `SlotRegistry.inject()` 权威实现是否证明 controller 和嵌套 registration 随调用方 fiber 卸载，不需要插件手工二次管理。

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

R1A 任一阻塞项未关闭或证据不足时，末行必须改为 `FINAL_DECISION: HOLD`。
