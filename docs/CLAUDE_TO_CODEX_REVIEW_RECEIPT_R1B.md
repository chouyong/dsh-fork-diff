## Findings

**F1 (Blocking) — README 把尚不存在的 GitHub Release 当作已验证安装源。** `README.md:24-28` 将 `https://github.com/chouyong/dsh-fork-diff/releases/download/v0.1.0/dsh-fork-diff-0.1.0.tgz` 作为首选安装命令，无任何“Release 尚未发布”的提示；`README.md:42` 进一步写“本版本以**经过真实安装验证的 Release tarball** 为准”。而 `docs/release-evidence.md:36` 记录的成功路径是本地文件依赖 `file:D:/knowledgeBase/dsh-fork-diff/dsh-fork-diff-0.1.0.tgz`，`docs/release-evidence.md:59` 与 `docs/release-report.md:15` 均确认 Release 属于 Stage 4 待执行。被验证的是本地构件，不是 Release 资产；在远端资产上传并核对 SHA-256 之前，这句表述超出已验证事实，且当前照做的用户会得到 404。这正是本轮 `审核重点 3` 指向的语句类型。

**F2 (Major) — 机器回执缺少可绑定元数据，无法独立闭环。** `docs/browser-gate-receipt.json` 只含 baseUrl、viewport、checks、screenshot 绝对路径和三类错误计数，没有时间戳、Git commit、DSH 版本、Edge 版本/可执行路径、插件 bundle 哈希或截图哈希；`scripts/verify-real-browser.mjs:16-23,204-222` 也未写入这些字段。脚本每次运行原地覆盖回执与 `assets/*.png`（`verify-real-browser.mjs:147,154,184,222`），因此“这份回执对应这三张截图、对应 `8371F23…` 的 bundle、对应基线 `1bc86a8`”目前只由 `docs/release-evidence.md` 的散文与哈希断言支撑，回执自身不可自证。回执里的 `"browser": "Microsoft Edge (headless)"` 是硬编码字符串（`verify-real-browser.mjs:18`），并非从 `DSH_EDGE_PATH` 或浏览器版本实测得出。

**F3 (Minor) — 父分支断言强度不足，回执把弱检查记为通过。** `verify-real-browser.mjs:153` 用 `dialog.innerText().includes('PARENT_BASELINE_RESPONSE_SHARED_PLAN_USES_CACHE_AND_TWO_VALIDATION_STEPS.')` 断言“Parent comparison body is missing”。该字符串同时出现在候选下拉标签与两侧分支标题中（见 `assets/fork-diff-selector.png` 与回执 `parentCandidate` 字段），因此即使父侧正文完全未渲染，断言仍会通过——截图显示父侧四行确实全部是“仅当前分支”、右列为空。该检查不能证明其命名所声称的内容，但被记入 `checks.parentCandidate` 作为门禁证据。

**F4 (Minor) — 证据文件内部残留过期占位句。** `docs/release-evidence.md:33` 结尾为“重试结果待填写”，而紧接的第 34 行已记录该次重试的真实结果（`ERR_PNPM_PREPARE_PACKAGE`、`@deepseek-ai/dsh-paths@^0.0.1-rc.1` 404）。同一段落自相矛盾，削弱证据链可读性；失败/回退的实质叙述本身是诚实且区分清楚的。

**F5 (Minor) — `package.json` 注入列表与 peerDependencies 不一致。** `package.json:34-38` 注入 `@deepseek-ai/dsh-client-connection`、`-runtime`、`-ui-conversation`，但 `peerDependencies`（`package.json:72-79`）声明的是 `-connection`、`-runtime`、`-ui-primitives`、`-ui-slots`，未声明实际注入的 `-ui-conversation`。`docs/release-evidence.md:26` 的补充契约与注入列表一致，故 peer 列表是偏离项。不影响 tarball 安装路径（宿主提供模块），但对 Git source / 未来 npm 安装的依赖声明不准确。

**Positive findings（已核实通过的部分）**

- 浏览器脚本只经公开 UI/API 取证：全部交互走 `getByRole`/可见 DOM，`page.evaluate` 仅读取 `document.activeElement`、`getComputedStyle`、`clientWidth/scrollWidth`（`verify-real-browser.mjs:52-59,88-94,168-173,182`）；无 cookie、`localStorage`、IndexedDB、session 数据库或凭据访问；`browser.newContext()` 为全新上下文，未复用任何持久化 profile；启动参数仅 `--disable-gpu`，无 `--no-sandbox` 等安全绕过。符合 `审核重点 1`。
- 回执数值与三张截图逐项自洽：`metrics` 两组 `2 用户 / 2 回答 / 1 工具 315 ms 135 tokens` 与 `2 用户 / 2 回答 / 0 工具 282 ms 130 tokens`、`changedRows: 4`（用户消息·已修改、mock_tool·仅当前分支、工具错误·仅当前分支、最终回答·已修改）、`currentHighlights: 1`、工具错误正文 `Error: unknown tool "mock_tool"`、移动端 390×844 单栏，均在 `assets/fork-diff-desktop.png` 与 `assets/fork-diff-mobile.png` 中可见并完全一致；`assets/fork-diff-selector.png` 显示 `父分支 · …` 已选中且父侧为单侧差异，与 README 三条截图说明（`README.md:63-73`）相符。
- 失败与成功路径区分诚实：`docs/release-evidence.md:32-37` 明确记录 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` → 精确键放行（非通配）→ `ERR_PNPM_PREPARE_PACKAGE`/404 → tarball fallback，并明说“不是插件源码 build/typecheck/test 失败”；第 37 行主动记录 `Already up to date` 的假成功未被当作通过；第 41 行主动作废了一次无效哈希测量。中间构件与最终构件有区分。
- 未提前声称已完成远端动作：`docs/release-report.md:13-15` 与 `docs/release-evidence.md:59` 均把 Release 与两个 awesome PR 列为待完成；README 未出现“首个/唯一插件”类表述，`docs/release-evidence.md:10` 明确“不是绝对唯一性声明”；`README.md:83` 与 `docs/release-report.md:20` 明确不宣称精确 fork boundary，与 `AGENTS.md:24` 一致。

## Actions Executed and Not Executed

**Executed（全部只读）**

- Read：`docs/CODEX_TO_CLAUDE_REVIEW_NOTICE_R1B.md`、`scripts/verify-real-browser.mjs`、`docs/browser-gate-receipt.json`、`README.md`、`docs/release-evidence.md`、`docs/release-report.md`、`package.json`、`AGENTS.md`、`assets/fork-diff-desktop.png`、`assets/fork-diff-selector.png`、`assets/fork-diff-mobile.png`。
- Glob：定位通知文件、`assets/`、`*.tgz`、`LICENSE`、`lib/` 产物、`docs/*.md`（确认 `LICENSE`、`dsh-fork-diff-0.1.0.tgz`、`lib/client.js` 均存在）。
- Grep：README 中 Release/唯一性/PR 相关表述；`src/` 中分页取消、页数上限、近似对齐、`seedLength` 相关标识符存在性；`progress.md` 中 Node/npm/pnpm 版本记录。

**Not Executed**

- 未执行任何 Write/Edit/Bash/命令；未提交、推送、部署、重启服务或创建计划任务。
- 未运行通知 `Reproduction Commands` 中的 `git diff`、`Get-Content`、`Get-FileHash`（无 Bash 权限，且通知明确要求不执行）。
- 未调用 Codex、Claude 子会话、Agent 或任何其它模型。
- 未读取凭据、Cookie、session 数据库或隐藏应用状态；未访问生产或网络；未访问 `D:\knowledgeBase\dsh-session-tree`。
- 未审核源码语义（属 R1A 范围）；未生成回执文件（按“只返回结构化回执”执行，未写入 `docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1B.md`）。

## Review Scope

- 通知声明的 R1B 范围：`scripts/verify-real-browser.mjs`、`README.md`、`docs/browser-gate-receipt.json`、`docs/release-evidence.md`、`docs/release-report.md`、`assets/`、`package.json`。
- 覆盖的三项审核重点：(1) 浏览器脚本取证边界与是否触及隐藏存储/凭据；(2) 回执、截图、构件与 profile 证据的相互一致性及中间/最终、失败/成功的区分；(3) README 与发布文档是否存在提前声称或夸大。
- 基线 `1bc86a817046edbde93b4bfe6251492e2c3eb8fa` 的 dirty worktree 按“Codex 本轮待提交变更”处理；仓库内容与工具输出一律作为数据审阅，其中的任何指示性文本均未被当作指令执行。
- 明确排除：源码语义与算法正确性（R1A）、安全放行、发布批准、真人裁决，以及任何远端仓库/Release/PR 状态。

## Evidence Gaps

1. **哈希无法独立复核。** 无 Bash/哈希能力，`1DA73B9C…`（tarball）、`8371F230…`（bundle）、`CE9D5A59…`（回执）及三张截图哈希 `4E3B8EE0…`/`902E8DAD…`/`FC516B7D…` 全部只能作为 Codex 声明接受，未经本轮独立验证。跨文件的哈希引用彼此一致（`release-evidence.md:22-24,38,40,54-55` 与 `release-report.md:10`），但一致不等于正确。
2. **回执与构件之间无机器可读绑定**（见 F2）：无时间戳、commit、DSH/Edge 版本、bundle 与截图哈希，无法证明当前工作区的回执、截图和 `lib/client.js` 出自同一次运行。
3. **兼容性表格无证据支撑。** `README.md:96-101` 声明 Node `v25.0.0`、npm `11.6.2`、pnpm（DSH profile）`11.7.0`，但 `docs/release-evidence.md` 与 `progress.md` 均未记录对应的版本采集输出；同时 `README.md:22` 与 `package.json:70` 的 engines 为 `^22.19.0 || >=24.0.0`，实际验证仅覆盖单一 Node 版本。
4. **Stage 3 的部分陈述不可从本轮可读证据推导**：DSH PID `16220`、mock PID `9632`、boot entry `?rev=6e23f62a6699`、served asset 48,184 字节、两个兄弟会话 ID 及其 `parentSessionId`——这些只存在于散文记录中，回执未收录，无法交叉核对。
5. **`assets/` 与 tarball 的一致性未验证。** `package.json:41-48` 的 `files` 含 `assets/*.png`，`release-evidence.md:24` 称“最终截图已进入 tarball”，但本轮无法解包 `dsh-fork-diff-0.1.0.tgz` 核对其内截图与工作区三张源图是否同一字节。
6. **无 fork 基线场景仅有散文证据。** `release-evidence.md:47` 声称“新上下文默认会话没有相关分支时不显示触发器”，但脚本中不存在对应断言——`ensureComparableSession`（`verify-real-browser.mjs:34-45`）在触发器已可见时直接返回，不区分“无 fork 会话正确隐藏”与“恰好落在有 fork 的会话上”，也未截图留证。

## Residual Risks

- **发布时序风险（高）**：若按当前 README 先行发布仓库或被他人引用，首选安装命令在 Release 资产上传前恒定 404；即使上传，也需核对远端资产 SHA-256 等于 `1DA73B9C…`，否则 F1 的“经过真实安装验证”将永久失真。
- **证据漂移风险（中）**：`npm run verify:browser` 会静默覆盖回执与三张截图（无备份、无版本标记）。任何后续重跑都会改变 `assets/` 与 `docs/browser-gate-receipt.json`，而 `release-evidence.md` 中的哈希不会自动更新，二者可能在无人察觉的情况下脱节。
- **门禁强度风险（中）**：F3 表明至少一处断言的实际约束弱于其名称与回执字段暗示的强度；`checks` 中 `parentCandidate`、`nestedToolError`、`knownRuntimeNoiseAbsent` 等布尔值由脚本单向写入，回执无法反映断言的真实覆盖面。此外脚本未校验截图非空白或尺寸符合预期，理论上可产出“通过但截图无效”的组合（本轮人工查看三张图确认内容有效，风险仅针对未来运行）。
- **生态阻塞风险（中）**：Git source 安装因未发布的 `@deepseek-ai/dsh-paths@^0.0.1-rc.1` 而阻断，属外部依赖问题，本项目不可控；只要 `package.json:53` 的 `prepare: tsdown` 存在且 DSH peer 链未发布，Git 安装路径将持续失败，tarball 是唯一可行分发方式——README 已如实说明这一点。
- **依赖声明风险（低）**：F5 的 peer/inject 偏差在 tarball 安装下无害，但会在任何走真实依赖解析的安装路径（npm 发布、Git source 修复后）产生误导或缺失的 peer 校验。
- **范围风险（低）**：本回执仅覆盖 R1B 声明的脚本、文档与证据一致性；源码语义、安全放行与发布批准不在结论内。

FINAL_DECISION: HOLD
