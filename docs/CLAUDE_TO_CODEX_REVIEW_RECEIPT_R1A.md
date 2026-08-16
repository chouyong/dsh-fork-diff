## Findings

1. **[阻塞] `greedyMatches` 存在无界循环，快速路径可挂死渲染进程** — `src/client/diff.ts:119-131`。`while ((bucket[offset] ?? -1) < rightFloor) offset++` 在 `offset` 越过 `bucket` 末尾后取到 `undefined`，`?? -1` 恒小于 `rightFloor`（`rightFloor >= 0`），因此循环永不退出；紧随其后的 `if (rightIndex === undefined) continue` 是不可达代码，说明作者本意是要在 bucket 耗尽时跳过。触发条件：进入近似路径（`leftMiddle.length * rightMiddle.length > 400_000`，约双侧 633 单元以上的分歧中段）且左侧某 fingerprint 的出现次数多于右侧剩余可用位置。该条件在真实历史中容易满足：`unitOf` 对 `tool/result` 即使正文为空也生成单元（`src/client/normalize.ts:127-142`），空正文 + 同标题会产生大量完全相同的 fingerprint（`makeUnit` 的 `fingerprint` 仅由 kind/title/body/error 组成，`src/client/normalize.ts:165`）。后果是浏览器标签冻结，无超时、无中断点（`diffUnits` 在 `ForkDiff.tsx:73` 同步调用于 promise 回调中，`AbortSignal` 无法打断），属于可用性缺陷而非纯性能问题。
2. **[阻塞-测试覆盖] 近似路径的匹配逻辑实际零覆盖** — `tests/diff.spec.ts:34-38` 的大历史用例左右两侧 fingerprint 完全不相交，`positions.get(fingerprint)` 恒为 `undefined` 并 `continue`，因此第 124-127 行的 offset 推进逻辑从未被执行；断言只检查 `approximate === true`。通知声称"测试能覆盖高风险回归"，但本轮唯一的 fallback 用例恰好绕过了缺陷所在分支。
3. **本轮归一化修复本身正确，且与调研事实一致** — 仅 `data.source.kind === 'user'` 计为直接用户消息（`normalize.ts:95-100`），与 `findings.md:38` 记录的真实历史（`agent-instructions` / `plugin` / `skill-catalog` 共用 `user/message`）吻合；`contentText` 对 `type === 'tool-result'` 递归提取正文（`normalize.ts:194-196`），`contentHasToolError` 递归识别嵌套 `isError`（`normalize.ts:204-211`），`tool/result` 的错误判定同时覆盖 `message.isError`、嵌套块错误与 `data.error`（`normalize.ts:130-132`）。`tests/normalize.spec.ts:46-90` 对这三点均有针对性断言，`assistant/message` 正文排除 reasoning 与 tool-call（`normalize.ts:104`）也有覆盖。
4. **未知 required 事件提示是"类型级"而非"形状级"，存在静默降级面** — `normalize.ts:42-47` 只在事件 `type` 未知且非 `ignorable` 时记录。若未来出现新的 `user/message` `source.kind`（例如 slash-command 类直接输入），单元被静默丢弃且 `unsupportedRequiredTypes` 不报告，与 `AGENTS.md:39`"不将未经识别的必需事件静默解释为已支持"的取向相悖。同类静默面：`visibleSurfaceSequences` 在 `surfaceOp.start/end` 无法在当前 surface 中定位时 `continue`（`normalize.ts:80-82`），该替换消息会整体消失且无提示；`SURFACE_TYPES` 事件若缺失 `surfaceOp` 也被整体跳过（`normalize.ts:52`、`normalize.ts:75`）。以上均为保真度风险，不是安全风险。
5. **统计口径不自洽（非阻塞）** — `metricsOf` 从所有 `assistant/message` 累计 usage（`normalize.ts:252-258`），但 `assistantMessages` 只数可见单元。被 `replace` 折叠掉的回答会造成 `assistantMessages: 0` 与 `inputTokens: 10` 并存，这一组合正是 `tests/normalize.spec.ts:29-32` 断言的当前行为。作为"真实开销"口径可辩护，但 UI（`ForkDiff.tsx:301-305`）把两者并排展示且无说明，易被读成矛盾数据。
6. **分页失败关闭边界一致，可评为合格** — `loadCompleteHistory` 覆盖 RPC 失败、非法信封、页内非递增 seq、跨 `beforeSeq`、重复 seq、`hasMore` 空页无进展、未向更旧 seq 推进、页数上限，并在结束时要求整段 `seq === index`（`src/client/history.ts:43-114`），全部抛 `HistoryLoadError` 且在 UI 呈现可重试错误（`ForkDiff.tsx:75-78`、`ForkDiff.tsx:275-283`）。`tests/history.spec.ts` 对 6 条路径有断言。注意 `validateCompleteSequence` 隐含"完整历史必须自 seq 0 起严格连续"这一强假设，一旦真实 fork 会话不满足即整面板报错（fail-closed，方向正确）。
7. **只读边界与血缘约束成立** — 全仓 `src/` 对 `localStorage|sessionStorage|document.cookie|indexedDB|fetch|XMLHttpRequest|WebSocket|fs.|child_process|eval|innerHTML|dangerouslySetInnerHTML` 零命中（Grep 全量确认）；对外只用 `sessions.list`、`sessions.open`、`connection.api.sessions.history`（`src/client/index.ts:18-38`）。候选严格限定真实 `parentId` 血缘的 sibling→parent→child，并排除自身、`origin === 'subagent'` 与 `blank`，且拒绝以 subagent 为焦点（`src/client/lineage.ts:4-46`，`tests/lineage.spec.ts` 覆盖）。无 `seedLength`／精确 fork 点声明；`commonPrefixUnits` 仅为单元级前缀，未在 UI 中被表述为共同祖先。
8. **宿主模块保持 external，无第二份 React** — `tsdown.config.ts:5-17` 将 react、react-dom、cordis、ui-slots、ui-primitives、runtime/client 等列入 `neverBundle`，`alwaysBundle` 仅打包其余；ModuleLoader banner/footer 与 `intro` 的 CJS 壳符合 `AGENTS.md:31`。`@deepseek-ai/dsh-brand` 仅类型导入（`contract.ts:1`），构建后被擦除。
9. **Cordis effect 可逆性有一处未闭合** — 样式经 `ctx.effect(() => installStyles(), ...)` 注册且 `installStyles` 以 `data-*` 引用计数精确回收（`styles.ts:313-335`，`tests/styles.spec.ts` 覆盖）；对话框对 `document.body.style.overflow` 与 rAF 均有恢复、Escape 关闭与焦点回归（`ForkDiff.tsx:153-181`、`ForkDiff.tsx:84-87`，component 测试覆盖）。但 `slots.inject(...)` 的返回 disposer 在 `src/client/index.ts:25` 被丢弃，未包进 `ctx.effect`。若 DSH slots 服务不按调用方 fiber 自动回收，插件卸载后 header 注册会残留，违反 `AGENTS.md:33`。本地未安装 `@deepseek-ai/dsh-client-runtime`，无法从类型或实现证实自动回收（见 Evidence Gaps）。
10. **slot 契约本身对齐** — `inject` 返回 `{ hooks: { sessionList } }` 会由 `PropsHooks`/`InjectFace` 合成为 `useSessionList` 选择器 hook（`node_modules/@deepseek-ai/dsh-client-ui-slots/lib/types/index.d.ts:339-349`），与 `ForkDiffProps.useSessionList`（`ForkDiff.tsx:20`）匹配；`kind: 'list'`、`order: 16`、`scope: 'session'` 与 `contract.ts:87-95` 的 SlotMap 增补一致，组件 props 由 `ComposedProps` 在 register 调用点静态校验。

## Actions Executed and Not Executed

已执行（全部只读）：
- Read：`docs/CODEX_TO_CLAUDE_REVIEW_NOTICE_R1A.md`、`AGENTS.md`、`CLAUDE.md`、`package.json`、`tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`vitest.config.ts`、`cordis.patch.yml`、`src/index.ts`、`src/client/` 全部 8 个源文件 + `primitives.d.ts`、`tests/` 全部 9 个文件、`node_modules/@deepseek-ai/dsh-client-ui-slots/lib/types/index.d.ts`。
- Glob：`src/**`、`tests/**`、仓库根配置文件清单。
- Grep：`src/` 全量搜索存储/网络/文件系统/动态执行/DOM 注入 API（零命中）；`node_modules/@deepseek-ai/dsh-client-ui-slots` 搜索 `hooks|SnapshotSelectorHook|inject`；`findings.md` 定向搜索 `source|kind|inject|seq|contiguous`，仅用于核对 R1A 范围内 `source.kind` 与 `dsh.client.inject` 两条实现假设是否有调研依据，未审核该文件本身。
- 缺陷可达性分析以手工推演完成（`greedyMatches` 的 offset 推进与 `rightFloor` 单调性）。

未执行：
- 未运行任何命令：`git diff`、`npm run verify`、`typecheck`、`build`、`vitest`、`test:bundle`、`verify:browser` 一概未执行（CLAUDE.md 禁止 Bash，且本会话无 Bash 权限）。
- 未 Write/Edit/commit/push/部署，未写入回执文件，未改动任何仓库或外部状态；`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1A.md` 未创建（本回执以对话输出交付）。
- 未调用 Codex、Claude 子会话、Agent、子代理或任何其它模型；未 WebFetch/WebSearch。
- 未读取凭据、Cookie、session 数据库或任何隐藏存储；未访问 `D:\knowledgeBase\dsh-session-tree`。
- 未审核 R1B 范围内容：`README.md`、`assets/`、`scripts/verify-real-browser.mjs`、`docs/browser-gate-receipt.json`、`docs/release-evidence.md`、`docs/release-report.md`、`scripts/check-bundle.mjs`、`lib/` 产物。

## Review Scope

- 范围：`src/`（`index.ts` 与 `client/` 全部）、`tests/`（全部 9 个文件）、`package.json`、`tsdown.config.ts`、`AGENTS.md`、`CLAUDE.md`；旁证性地读取 `tsconfig*.json`、`vitest.config.ts`、`cordis.patch.yml` 与已安装的 slots 类型定义以判定编译与 slot 契约。
- 审核维度：源码正确性、事件归一化行为、测试覆盖、纯只读边界、候选血缘真实性、Cordis effect 可逆性、宿主模块 external。
- 基线：工作树当前 dirty 内容（通知声明基线为 `1bc86a817046edbde93b4bfe6251492e2c3eb8fa` + 本轮待提交变更）；我审核的是磁盘上的当前文件内容，未能逐项比对 diff。
- 明确不在范围：README/截图/浏览器脚本/发布证据（R1B）、发布批准、安全放行、真人裁决。

## Evidence Gaps

1. 无法执行 `npm run verify`，因此"typecheck + build + 7 文件 22/22 + bundle contract 通过"完全依赖通知自述。按文件手工计数测试用例为 22（normalize 5、history 6、lineage 3、diff 3、text-diff 2、styles 1、component 2），与自述一致，但通过与否未经独立验证。
2. 无法计算哈希，`lib/client.js` 的 `SHA-256 = AA3A...AD60` 及产物与源码的一致性未经独立核对；`lib/` 亦不在本轮范围。
3. `@deepseek-ai/dsh-client-connection`、`-runtime`、`-ui-conversation`、`-ui-primitives` 均未安装（仅 peerDependencies），故：slots 服务是否按调用方 fiber 自动回收 `inject` 注册（Findings 9）、`dsh.client.inject` 三项包名是否足以覆盖 bundle 实际 require 的 `-ui-primitives`/`-ui-slots` 外部依赖，均无法从类型或实现证实。
4. 真实历史中 `user/message` / `assistant/message` / `tool/result` 是否恒带 `surfaceOp`、以及 fork 子会话的 `seq` 是否恒自 0 连续，只有真实浏览器证据能确认，而该证据属 R1B。
5. `greedyMatches` 的挂死结论来自代码推演，未通过运行用例复现（无 Bash 权限）；建议 Codex 用 `left = [X, X]`、`right = [X]` 且分歧中段超过 400_000 单元格的构造直接复现。

## Residual Risks

1. **近似路径挂死（高）** — 长会话 fork 对比一旦进入 fallback 且出现重复 fingerprint，UI 线程无限循环，用户只能强制关闭标签；`AbortController` 无法救回。修复应为 `while (offset < bucket.length && (bucket[offset] ?? 0) < rightFloor) offset++`（或等价的边界判定），并补一条"左侧重复 fingerprint 多于右侧"的 fallback 用例。
2. **静默丢弃面（中）** — 未知 `source.kind`、无法定位的 `surfaceOp.replace` 区间、缺失 `surfaceOp` 的 surface 事件都会使内容从对比与统计中消失且无 notice，未来 DSH 版本变动时表现为"看起来正常但少了消息"，比报错更难发现。建议将这些降级路径并入 `unsupportedRequiredTypes` 之外的显式提示通道。
3. **统计口径易误读（低）** — 折叠后 `assistantMessages` 与 token 计数口径不同，UI 无说明。
4. **契约假设（低-中）** — 历史 `seq` 自 0 连续、surface 事件必带 `surfaceOp`、slots `inject` 自动回收三项假设成立与否决定真实环境行为；前两项失败时 fail-closed（方向正确），第三项失败会留下卸载残留。
5. **范围限定** — 本次为 R1A 技术审核，`HOLD` 仅针对上述技术阻塞项；不构成发布批准、安全放行或真人裁决，README/截图/浏览器与发布证据未审。

FINAL_DECISION: HOLD
