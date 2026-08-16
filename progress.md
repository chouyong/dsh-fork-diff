# Progress

## 2026-08-16

- Goal `01a00890-4d8c-7a82-a2ba-99b42e6fbf08` 已启动。
- 在 `D:\knowledgeBase\dsh-fork-diff` 初始化独立 Git 仓库，分支为 `main`。
- 恢复并阅读上游调研仓库的 `AGENTS.md`、`task_plan.md` 与 fork graph 交接文档。
- 调用 `$dsh-plugin-real-release-gate`，预注册 Stage 0→4；调用 `$planning-with-files` 保存跨阶段进度；完成后将调用 `$codex-claude-cli-review`。
- 用 DSH CodeGraph 核验 `sessions.history`、历史分页、事件数据和 session service 边界。
- 只读参考公开 `chouyong/dsh-fork-graph` 的 package、tsdown 与入口结构，未读取本地 `dsh-session-tree`。
- 当前进行：创建项目契约与规划文件，随后进入纯函数和 UI 实现。
- Stage 0 已完成：数据源、产品边界、验收标准和失败分类已经固化；Phase 1 转为进行中。
- 一次 GitHub API 参考批次因包含不存在的猜测文件返回 404；后续改为目录枚举，不重复同一失败。
- 已确认 `connection` 服务公开 `api` 并支持给 history 调用传入 `AbortSignal`；实现将对面板关闭和候选变化做主动取消。
- 完成发行骨架、局部 DSH 契约、lineage 候选、完整历史分页、surface 折叠、事件归一化、usage/耗时统计、结构与行级 diff。
- 完成 header action、portal 对话框、桌面双栏/移动单栏、加载/错误/空状态、请求取消、Escape、焦点陷阱和焦点恢复。
- 已补 lineage、history、normalize、diff、text diff、样式生命周期、组件交互和 bundle contract 测试；尚未执行首次安装/验证。
- 首次 `npm install --ignore-scripts --legacy-peer-deps` 与 `npm run typecheck` 通过。
- 首次并行 build/test 中 Vitest 在配置加载阶段遇到沙箱 `spawn EPERM`，尚未执行任何测试用例；已转为拆分证据。
- 独立 `npm run build` 通过：Node 0.19 kB，browser 47.29 kB；tsdown 报告 `external`/`noExternal` 弃用警告，待更新配置消除。
- 提升权限后 Vitest 完整执行，7 个文件、20 个测试全部通过。
- 首次 bundle contract 因检查器假设单行 banner/footer 而假失败；真实产物是正确的多行 ModuleLoader closure，检查器已按语义结构修正。
- 修正后 bundle contract 通过：46,953 字符，4 个实际 external require，均在宿主白名单内，未发现打包 React 指纹。
- 依据本地 tsdown 0.22 类型声明，将弃用的 `external`/`noExternal` 迁移为 `deps.neverBundle`/`deps.alwaysBundle`，保持相同宿主模块边界。
- 已核对真实 DSH `0.1.0-rc.5` 客户端契约：会话摘要使用 `id`/`parentId`/`displayTitle`，历史通过 `connection.api.sessions.history({ sessionId, beforeSeq, maxMessages }, signal)` 分页；客户端依赖为 `@deepseek-ai/dsh-client-connection`、`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`。
- 下一步进入 Stage 1 收口：生成 README、执行 `npm pack --dry-run`/`npm pack` 并记录 tarball 与 browser bundle SHA-256，然后开始官方 Git 安装尝试。
- 已创建完整中文 README，包含痛点、功能、安装/卸载、使用、隐私边界和兼容性；真实截图仍保持待 Stage 3 生成。
- `npm pack --dry-run` 与正式 `npm pack` 通过；正式 tarball 共 19 个文件、38,044 字节，SHA-256 `FF58024815E6436AF6A876893A498433A69702F1F2C7D6FB8B04510CAD442D82`；browser bundle SHA-256 `4526B8915814A1EAD1492E558098281CF541C385AFD06500553C7C0C03C32F07`。
- Phase 1 已完成，Phase 2 转为进行中。为避免干扰现有 `web` profile，将创建独立 `fork-diff-web` profile，并用官方 DSH CLI 对本地 Git source commit 执行安装门禁。
