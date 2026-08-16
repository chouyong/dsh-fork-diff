# dsh-fork-diff Release Evidence

> 本文件只记录无密钥、可复核证据。未执行的门禁保持空白，不用预置成功值。

## Stage 0

- 日期：2026-08-16
- DSH：`0.1.0-rc.5`
- 环境：Windows，D 盘源码与 DSH home
- 竞品结论：未发现高可发现性的同类 DSH 插件；不是绝对唯一性声明
- 数据边界：浏览器公开会话列表 + `sessions.history`，纯只读

## Stage 1: Build

- `npm install --ignore-scripts --legacy-peer-deps`：通过。
- `npm run typecheck`：通过。
- `npm run build`：通过；Node 构件约 0.19 kB，browser `lib/client.js` 约 47.29 kB。
- `npm test`：R1A 前 7 个文件、22 个用例通过；修复近似匹配无界循环并补回归后，最终为 7 个文件、23 个用例全部通过。沙箱首轮 `spawn EPERM` 未执行用例，已单独记录。
- `npm run test:bundle`：通过；ModuleLoader wrapper、external 白名单和 React 单实例检查通过。
- `npm run verify`（R1A HOLD 修复后）：通过；typecheck、build、7 个文件 23 个用例和 bundle contract 全部通过。
- `npm pack`（最终）：通过，22 个文件，239,114 字节。
- 最终 tarball：`dsh-fork-diff-0.1.0.tgz`，SHA-256 `2E83CFD413E2F706DF589CA3888A73AE3EEDAF0509151D59E0E2408BF0C8C0BF`。
- 最终 browser bundle：`lib/client.js`，48,184 字节，SHA-256 `8371F230A2C695A03F34E40D24CAAFD473EB6884D2F65F7685DC170FCA5EA2BA`。
- 最终截图已进入 tarball；三张源图分别为 `47F3FB7636FB66E4C5BA1493AF7313AF91A14DDF345BD207B9457C52771A3EB4`、`60F605212A90B9EF501865685D6A0C686A925A0D0C5A7089553C68CA15559DC4`、`FC516B7D7E55CCC60AE9369444B4C66EA79B75902F23361487DE590CD0435677`。
- 实测工具版本：Node.js `v25.0.0`、npm `11.6.2`、DSH profile pnpm `11.7.0`。

补充契约：DSH `0.1.0-rc.5` 的客户端注入包为 `@deepseek-ai/dsh-client-connection`、`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`；会话摘要字段为 `id`、`parentId`、`displayTitle`。

## Stage 2: Install

- 隔离 profile：`D:\dsh-home\profiles\fork-diff-web`，由 DSH `PROFILE_TEMPLATES.web` 初始化；没有修改现有 `web` profile。
- Git source commit：`1bc86a817046edbde93b4bfe6251492e2c3eb8fa`，临时 bare Git 源位于用户临时目录。
- 首次安装命令使用 `git+file://...#1bc86a8...`，真实结果为 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`；profile 和 pnpm 原始诊断都指出应将精确 package+URL+SHA 键加入 `allowBuilds`。
- 已按诊断加入唯一精确键，未使用通配授权；重试结果见下一条。
- 第二次 Git 安装确实进入 prepare，但 pnpm 的 Git package 准备阶段执行 `npm install`，npm 自动解析未发布 DSH peer 链，对 `@deepseek-ai/dsh-paths@^0.0.1-rc.1` 返回 HTTP 404；最终错误为 `ERR_PNPM_PREPARE_PACKAGE`。
- 该失败是 Git source 安装的生态发布阻塞，不是插件源码 build/typecheck/test 失败；按预注册规则允许使用已验证的预构建 tarball fallback，且最终结论必须为 `PASS_AFTER_CHANGES` 或 `FAIL`。
- tarball fallback（最终构件）：成功。profile manifest 依赖为 `file:D:/knowledgeBase/dsh-fork-diff/dsh-fork-diff-0.1.0.tgz`，bundles 追加 `dsh-fork-diff`。
- R1A 修复后的首次重复 `plugin add` 更新了 lockfile integrity，但 pnpm 报 `Already up to date`，安装目录仍是旧 bundle；没有把该结果当成功。随后用官方 CLI 对隔离 profile 中精确的 `dsh-fork-diff` 执行 `remove` 再 `add`，最终安装目录被替换。
- 最终安装后 `node_modules/dsh-fork-diff/lib/client.js` SHA-256 为 `8371F230A2C695A03F34E40D24CAAFD473EB6884D2F65F7685DC170FCA5EA2BA`，三张安装目录截图与源图哈希一致。
- `dsh --profile fork-diff-web --dump-config` 通过，并显示 `# == dsh-fork-diff` 与 `id: fork-diff`。
- R1A 修复后真实启动在 `127.0.0.1:3091`；HTML boot entry 包含 `/plugins/dsh-fork-diff/client.js?rev=6e23f62a6699`。served asset 为 48,184 字节且 SHA-256 与最终 bundle 一致。
- 首次 served-asset 内存哈希包装器使用了本机不可用的 `System.Net.Http.HttpClient` / `SHA256.HashData`，只使该次测量无效；在终止错误模式下改用精确临时文件下载后，HTTP、字节数和哈希均通过，临时文件已删除。

## Stage 3: Browser

- 最终 DSH PID：`19464`，命令为 `apps/cli/lib/bin.js --profile fork-diff-web --port 3091`；该进程已在浏览器门禁完成后停止。mock PID `9632` 仅提供本地公开占位模型，不是插件进程，并已在发布收口时停止。
- root HTML 与 `/plugins/dsh-fork-diff/client.js` 均 HTTP 200；最终 boot entry 含 `dsh-fork-diff`，样式节点计数为 1。
- no-fork 基线：新上下文默认会话没有相关分支时不显示触发器；脚本通过公开侧边栏“展开其余会话”选择既有 fork 后继续。
- 真实父会话：`session-36c249b6-54cd-4c30-8aec-4eb20d66c187`。
- 真实兄弟分支：`session-5d82b759-493b-4d08-82dd-ea0c14d935f0` 与 `session-7b801d56-83da-45af-b806-f0baffc84f60`；两者 `parentSessionId` 均为上述父会话。
- 最终回执：3 个候选、两侧各 2 条直接用户消息、4 条差异、6 条全部、1 个当前高亮；工具错误正文为 `Error: unknown tool "mock_tool"`，已知运行时事件噪声消失。
- 交互：兄弟/父候选切换、`全部` 过滤、`打开会话` 导航、Escape、焦点恢复和 Tab/Shift+Tab 焦点陷阱均通过。
- 响应式：桌面 `1440x1000` 双栏、移动 `390x844` 单栏；人工检查三张原图无裁切、横向溢出或文字重叠。
- console errors：0；page errors：0；request failures：0。
- R1B 修复后的机器回执 SHA-256：`CA09182F3CD16CC4BDE90F302EF6AD185645D0CF01BBD931FE71F9F12E428D8C`；回执内记录 UTC 时间、Git HEAD/dirty 指纹、DSH `0.1.0-rc.5`、Edge `151.0.4129.86`、served/local bundle 同哈希、三张截图尺寸与哈希。
- 截图：`assets/fork-diff-desktop.png`（1440x1000，`47F3FB7636FB66E4C5BA1493AF7313AF91A14DDF345BD207B9457C52771A3EB4`）、`assets/fork-diff-selector.png`（1440x1000，`60F605212A90B9EF501865685D6A0C686A925A0D0C5A7089553C68CA15559DC4`）、`assets/fork-diff-mobile.png`（390x844，`FC516B7D7E55CCC60AE9369444B4C66EA79B75902F23361487DE590CD0435677`）。

## Stage 4: Publish

- Claude R2A 与 R2B 均为 `GO`；最终发布提交为 `9a16a072eba57b16f0a9040ad8047bacdcf389a1`。
- 公开仓库：`https://github.com/chouyong/dsh-fork-diff`，visibility 为 `PUBLIC`，默认分支 `main`；推送后本地与远端 `main` SHA 一致。
- Release：`https://github.com/chouyong/dsh-fork-diff/releases/tag/v0.1.0`，非草稿、非预发布，target 为 `9a16a072eba57b16f0a9040ad8047bacdcf389a1`。
- GitHub Release asset 为 `dsh-fork-diff-0.1.0.tgz`，239,114 字节；GitHub digest 与重新下载后的 SHA-256 均为 `2E83CFD413E2F706DF589CA3888A73AE3EEDAF0509151D59E0E2408BF0C8C0BF`。
- 新隔离 profile `fork-diff-release-web` 由 DSH 官方 `initProfile(..., PROFILE_TEMPLATES.web)` 初始化，初始 bundle 仅为 base + web-app。
- 官方 CLI 直接从公开 Release URL 安装时，pnpm 两轮重试均 `ETIMEDOUT` 并以 `fetch failed` 退出；独立 `curl -I -L` 同样在 15 秒连接超时。该路径未产生半安装，不能描述为公开 URL 安装成功。
- 通过 GitHub CLI 下载同一公开 Release asset 到 `D:\dsh-home\artifacts\dsh-fork-diff-0.1.0.tgz` 后重新核对大小与哈希，再由官方 DSH CLI 以本地 tarball fallback 安装到 `fork-diff-release-web`，安装成功。
- fallback 安装后的 manifest 为 base + web-app + `dsh-fork-diff`；版本 `0.1.0`，conversation peer 为 `>=0.0.1-rc.1`，bundle 与三张截图哈希均和发布构件一致，`--dump-config` 出现 `# == dsh-fork-diff` 与 `id: fork-diff`。
- 仓库 topics 已设置为 `dsh-plugin`、`deepseek-harness`、`conversation-diff`、`session`。
- `0xsline/awesome-deepseek-harness` PR：`https://github.com/0xsline/awesome-deepseek-harness/pull/270`；状态 `OPEN`、`MERGEABLE`，head `ac88cdb3f10fed5aeca80fe3d3bfb2f5b7255600`，只修改双语 README 各一行。该仓库 workflow 仅支持手工触发，未报告 PR checks；本地运行同一 `awesome-lint` 通过。
- `awesome-dsh-plugin` 已在最新 upstream `9109c2181db2c733ee96dcacdc3621fe6ee7991a` 上准备单提交 `aa1d1b87797bb29dc19d8b1c9512ea0c4ad12386`：新增插件 YAML、三图登记并由官方生成器更新双语 README；生成检查、lint、站点构建和 `diff --check` 均通过。
- `awesome-dsh-plugin` PR 尚未创建：其自动门禁要求插件仓库创建满 1 天且至少 10 个提交；实测仓库创建于 `2026-08-16T09:23:36Z` 且仅 2 个真实提交。不得用空提交或明知必败的 PR 伪造资格。
