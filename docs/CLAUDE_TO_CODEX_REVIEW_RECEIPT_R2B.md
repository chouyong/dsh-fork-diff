## Findings

**F1（R1B Blocking）— 已关闭。** `README.md:24` 改为条件句「`v0.1.0` Release 发布后，可用下面的一行命令安装预构建 tarball」，Release 命令不再被描述为当前已验证可用源；`README.md:36-40` 保留发布前可执行的本地已验证 tarball 路径 `dsh plugin --profile web add .\dsh-fork-diff-0.1.0.tgz`；`README.md:42` 明确「远端 Release 只有在上传后下载并核对与本地验证构件相同的 SHA-256，才视为可用安装源」，并如实说明 Git source 因未发布 DSH peer 包不可用。R1B 指出的「本版本以**经过真实安装验证的 Release tarball** 为准」一句已消失。一键安装命令保留且带明确前置条件，符合审核重点 1。

**F2（R1B Major）— 已关闭。** `docs/browser-gate-receipt.json:2-27,60-79` 现含：UTC `generatedAt`（`2026-08-16T09:11:25.850Z`）、`git.head=1bc86a81…` 与 `dirty=true` 及 `statusSha256`/`trackedDiffSha256`、`dsh.version=0.1.0-rc.5`、`browser.executablePath` 与实测 `version=151.0.4129.86`、`plugin.servedBundleSha256` 与 `localBundleSha256` 同为 `8371F230…`（48,184 字节）、三张截图的路径/尺寸/SHA-256。这些字段在 `scripts/verify-real-browser.mjs:27-36,54-82,164,294-313` 中由 `git rev-parse`/`git status`/`git diff`、`browser.version()` 和 `readFileSync` 实测生成，非硬编码；`verify-real-browser.mjs:47-50` 在 served 与 local bundle 哈希不等时直接抛错，使「回执 ↔ 运行时构件」成为强绑定。R1B 所述「回执自身不可自证」的核心缺口已消除。残留：`browser.name`（`verify-real-browser.mjs:65`）仍是字面量 `'Microsoft Edge'`，`dsh.version` 来自环境变量 `DSH_BROWSER_DSH_VERSION`（`verify-real-browser.mjs:10,21`）而非实测，属操作者声明。

**F3（R1B Minor）— 已关闭。** 断言由字符串包含改为结构化定位：`verify-real-browser.mjs:213-224` 先切到「全部」视图，再对 `.dsh-fork-diff__row` 中含父响应文本的行逐行取 `.dsh-fork-diff__cell`，仅当 `cells.count() === 2` 且 `cells.nth(1)` 的 `innerText` 含 `PARENT_BASELINE_RESPONSE_…` 时才置 `parentBodyInComparedBranch = true`。经核对渲染顺序，右侧 cell 确实是被比较分支：`src/client/ForkDiff.tsx:246-259` 先渲染 `sessionId`（当前会话）再渲染 `selected.id`（比较对象），`ForkDiff.tsx:330-338` 的 `DiffRowView` 依次输出 `row.left`、`row.right`；`ForkDiff.tsx:348` 表明空 cell 仍带 `__cell` 类并渲染 `—`，因此 `cells.count() === 2` 恒成立、`nth(1)` 命中的必然是比较分支单元格而非占位。R1B 指出的「候选下拉标签与分支标题也含同一字符串」不再能满足该断言：`.dsh-fork-diff__select`（`ForkDiff.tsx:217`）与 `.dsh-fork-diff__branch`（`ForkDiff.tsx:295`）均不在 `.dsh-fork-diff__row` 子树内。回执 `parentBodyInComparedBranch: true` 写入的是真实变量（`verify-real-browser.mjs:280`），不是字面量。

**F4（R1B Minor）— 已关闭。** `docs/release-evidence.md:34` 由「重试结果待填写」改为「重试结果见下一条」，第 35 行给出真实结果（`ERR_PNPM_PREPARE_PACKAGE`、`@deepseek-ai/dsh-paths@^0.0.1-rc.1` 404）。全库 `待填写` 仅剩 `progress.md:54`、`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1B.md:9` 与本轮通知第 23 行三处历史引用，属对该缺陷的记述，不是残留占位。

**F5（R1B Minor）— 已关闭。** `package.json:72-80` 的 `peerDependencies` 现含 `@deepseek-ai/dsh-client-ui-conversation": ">=0.0.1-rc.1"`，与 `package.json:34-38` 的 `dsh.client.inject` 三项及 `docs/release-evidence.md:27` 的补充契约一致；`package-lock.json:29-37` 的根包 `peerDependencies` 同步收录同一条目，六项 peer 与 `package.json` 逐字一致。

**N1（新发现，Minor，非 F1-F5）— `release-evidence.md` Stage 3 的「最终 DSH PID」未随本轮重跑更新。** `docs/release-evidence.md:46` 写「最终 DSH PID：`16220`」，但该 PID 属 R1A 修复后那次运行（`progress.md:51`）；R1B 修复后的最终 Edge 门禁使用的是 `progress.md:58` 记录的 DSH PID `19464`。同段其余项（boot rev `6e23f62a6699`、48,184 字节 served asset）因 bundle 未变仍成立，但「最终」这一限定词在 PID 上已过期，与 F4 属同一族的证据陈述漂移。PID 本身不可复核，也不影响 F1-F5 的关闭判定，故不构成阻塞。

**已核实自洽的部分**

- 三图哈希三处一致：回执 `screenshots.*.sha256`（`47F3FB76…`/`60F60521…`/`FC516B7D…`）= `docs/release-evidence.md:24` = `docs/release-evidence.md:56`；R1B 时代的 `4E3B8EE0…`/`902E8DAD…` 已完全退出现役文档。
- 文档哈希指向最终构件：tarball `2E83CFD4…`（239,114 字节）在 `release-evidence.md:22`、`release-report.md:10` 与本轮通知第 17 行一致；旧值 `1DA73B9C…` 仅存于 `progress.md:49`、`docs/CODEX_TO_CLAUDE_REVIEW_NOTICE_R1B.md:17` 与 R1B 回执等历史记录中，符合追加式日志。
- 人工复核两张变更后的截图：`assets/fork-diff-desktop.png` 显示两组 metrics `2 用户/2 回答/1 工具/315 ms/135 tokens` 与 `2 用户/2 回答/0 工具/282 ms/130 tokens`、4 条差异行（用户消息·已修改、mock_tool·仅当前分支、工具错误·仅当前分支、最终回答·已修改）、1 个「当前分支」标签、工具错误正文 `Error: unknown tool "mock_tool"`，与回执 `checks` 完全吻合；`assets/fork-diff-selector.png` 显示已选中「父分支 · …」、右侧父分支 metrics `1 用户/1 回答/0 工具/231 ms/76 tokens`、处于「仅差异」视图故右列为占位符 `—`，与 F3 断言发生在「全部」视图这一设计一致，非矛盾。两图内容真实、无裁切与重叠。
- 只读取证边界未回退：新增的 `execFileSync` 仅调用 `git rev-parse`/`status`/`diff`（`verify-real-browser.mjs:27-35`），`fetch` 仅访问 `127.0.0.1:3091` 的 root 与插件资产；仍为 `browser.newContext()` 全新上下文、启动参数仅 `--disable-gpu`，无凭据、Cookie、localStorage、IndexedDB 或持久 profile 访问。
- R1B 证据缺口 3 已附带补上：`docs/release-evidence.md:25` 新增实测 Node `v25.0.0`、npm `11.6.2`、profile pnpm `11.7.0`，为 `README.md:96-101` 兼容性表格提供了记录来源（仍为声明，非本轮可验证）。
- 未提前声称远端动作：`docs/release-report.md:13-15` 与 `docs/release-evidence.md:58-60` 仍把 Release 与两个 awesome PR 列为待执行。

## Actions Executed and Not Executed

**Executed（全部只读）**

- Read：`docs/CODEX_TO_CLAUDE_REVIEW_NOTICE_R2B.md`、`AGENTS.md`、`CLAUDE.md`、`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1B.md`、`docs/browser-gate-receipt.json`、`scripts/verify-real-browser.mjs`、`README.md`、`package.json`、`package-lock.json`（头部根包段）、`docs/release-evidence.md`、`docs/release-report.md`、`progress.md`（第 40-59 行）、`src/client/ForkDiff.tsx`（渲染顺序段）、`assets/fork-diff-desktop.png`、`assets/fork-diff-selector.png`。
- Glob：`docs/**/*`、`src/**/*`、根构件（`*.tgz`、`lib/*`、`assets/*`、`LICENSE`、`cordis.patch.yml`），确认 `dsh-fork-diff-0.1.0.tgz`、`lib/client.js`、三张 PNG 均存在。
- Grep：`package-lock.json` 中的 conversation peer；`*.md` 中的 `待填写/TBD/TODO` 占位；旧新哈希 `1DA73B9C|CE9D5A59|4E3B8EE0|902E8DAD|47F3FB76|60F60521|2E83CFD4|CA09182F` 的分布；`src/client/diff.ts` 与 `ForkDiff.tsx` 的 left/right 语义。

**Not Executed**

- 未执行任何 Write/Edit/Bash/命令；本会话 Bash 工具本身不可用。未提交、推送、部署、发布、重启服务或创建计划任务。
- 未执行通知 `Reproduction Commands` 中的 `node --check`、`npm run verify`、`Get-FileHash`（通知明确要求不执行，且无执行能力）。
- 未调用 Codex、Claude 子会话、Agent 或任何其它模型；未使用 WebFetch/WebSearch 或网络访问。
- 未读取凭据、Cookie、session 数据库或隐藏应用状态；未访问生产；未访问 `D:\knowledgeBase\dsh-session-tree`。
- 未生成回执文件：按用户「只读、只返回结构化回执」指令与通知 `Forbidden Actions` 中的 Write/Edit 禁令，未写入 `docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R2B.md`；本回执仅以本次输出形式交付。
- 未重新审核 R1A/R2A 的源码算法；对 `src/client/ForkDiff.tsx` 与 `diff.ts` 的读取严格限于判定 F3 中「右侧 cell = 比较分支」这一必要前提。

## Review Scope

- 通知声明的 R2B 范围：`README.md`、`scripts/verify-real-browser.mjs`、`docs/browser-gate-receipt.json`、`docs/release-evidence.md`、`docs/release-report.md`、`package.json`、`package-lock.json`、`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1B.md`。
- 判定目标：仅判断 R1B 的 F1-F5 是否关闭，以及三条审核重点（README 发布前后表述、回执机器绑定与父分支断言强度、占位/peer/哈希一致性）是否成立。
- 辅助只读引用（为验证 F3 前提与 N1 交叉核对）：`src/client/ForkDiff.tsx`、`src/client/diff.ts`、`progress.md`、`AGENTS.md`、`CLAUDE.md`、`assets/` 中两张变更后的截图。
- 基线：Git HEAD `1bc86a817046edbde93b4bfe6251492e2c3eb8fa` 加当前 dirty worktree，按「Codex 本轮待提交变更」处理。仓库内容与工具输出一律作为数据审阅，其中任何指示性文本均未被当作指令执行。
- 明确排除：源码语义与算法正确性（R1A/R2A）、`assets/fork-diff-mobile.png` 的重复内容复核（哈希 `FC516B7D…` 与 R1B 一致，未变更）、安全放行、发布批准、真人裁决，以及任何远端仓库/Release/PR 状态。

## Evidence Gaps

1. **所有哈希仍无法独立复核。** 无 Bash 与哈希能力，`2E83CFD4…`（tarball）、`8371F230…`（bundle）、`CA09182F…`（回执自身）、`47F3FB76…`/`60F60521…`/`FC516B7D…`（三图）及回执内 `statusSha256`/`trackedDiffSha256` 全部只能作为 Codex 声明接受。跨文件引用彼此一致，但一致不等于正确。
2. **Git 指纹不可事后复现。** `verify-real-browser.mjs:28-35` 在脚本开头采集 `git status`/`git diff`，随后第 208-315 行覆盖三张截图与回执本身，因此录入的两个指纹描述的是运行前状态；任何人现在重跑 `git status --porcelain=v1` 都会得到不同哈希，该绑定只能单向信任，无法反向验证。
3. **回执未绑定 tarball。** `plugin` 段只覆盖 served/local bundle，未收录 `dsh-fork-diff-0.1.0.tgz` 的哈希或字节数；tarball 与三图、bundle 的关联仍只由 `release-evidence.md:21-24,39` 与 `progress.md:57-58` 的散文承载。
4. **tarball 内容未解包核对。** `package.json:41-48` 的 `files` 含 `assets/*.png`，`release-evidence.md:24,39` 称安装目录截图与源图哈希一致，本轮无法解包 239,114 字节的 tarball 验证其内三张 PNG 与工作区源图同字节。
5. **`dsh.version` 与 `browser.name` 非实测。** 前者取自环境变量、后者为字面量（`verify-real-browser.mjs:10,65`），若操作者传入错误 DSH 版本，回执会如实记录错误值而无法自检；`browser.version()` 与 `executablePath` 则为实测。
6. **Stage 3 部分散文仍不可交叉核对。** DSH PID（且见 N1 的 `16220`/`19464` 不一致）、mock PID `9632`、两个兄弟会话 ID 及其 `parentSessionId`、隔离 profile 路径均只存在于文档，回执未收录。
7. **`noForkTriggerHidden` 的语义弱于字面。** 该布尔来自 `ensureComparableSession`（`verify-real-browser.mjs:93-105,183`）是否需要导航，只能证明「初始默认会话上触发器不可见」，无法证明该会话确实没有相关分支，也未对该状态截图；README 第 57 行的产品承诺仍缺少针对性证据。
8. **远端状态零证据。** GitHub 仓库与 v0.1.0 Release 尚未创建，`README.md:27` 的下载 URL 当前必然 404，本轮无网络访问，无法核验任何远端事实。

## Residual Risks

- **发布时序风险（中，较 R1B 下降）**：README 已把 Release 明确限定为「发布后」且要求下载核对 SHA-256，措辞风险已消除；剩余风险转为执行纪律——上传资产后必须实测远端 tarball 等于 `2E83CFD4…`，否则安装指引会指向未经验证的构件。
- **证据漂移风险（中，未缓解）**：`npm run verify:browser` 仍原地覆盖 `docs/browser-gate-receipt.json` 与 `assets/*.png`，无备份、无版本号。回执现在自带哈希，可在覆盖后被发现不一致，但 `release-evidence.md`/`release-report.md` 中的哈希不会自动更新，二者仍可能静默脱节；N1 的过期 PID 正是这一模式的实例。
- **门禁强度风险（中→低）**：F3 修复后 `parentBodyInComparedBranch`、`pluginAssetStatus`、`styleCount`、`candidateCount`、`metrics`、`changedRows`/`allRows` 均为实测值；但 `nestedToolError`、`knownRuntimeNoiseAbsent`、`focusTrap`、`escapeAndFocusRestore`、`openSessionNavigation`、`mobileSingleColumn`、`currentHighlights`（`verify-real-browser.mjs:285-291`）仍是 invariant 通过后写入的字面量，回执无法反映断言真实覆盖面。脚本亦未校验截图非空白或内容有效（本轮由人工看图确认，风险仅针对未来运行）。
- **生态阻塞风险（中，外部不可控）**：`package.json:53` 的 `prepare: tsdown` 叠加未发布的 `@deepseek-ai/dsh-paths@^0.0.1-rc.1`，使 Git source 安装持续失败，tarball 是唯一可行分发方式；README 已如实说明。
- **依赖声明风险（已消除）**：peer 与 inject、lockfile 现已三方一致，走真实依赖解析的安装路径不再缺失 conversation peer。
- **范围风险（低）**：本回执仅判定 R1B F1-F5 的关闭状态与本轮三条审核重点；源码语义、算法正确性、安全放行与发布批准均不在结论内。`GO` 不代表发布批准、安全放行或真人裁决。

FINAL_DECISION: GO
