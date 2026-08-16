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
- `npm test`：提升权限后 7 个文件、20 个用例全部通过；沙箱首轮 `spawn EPERM` 未执行用例，已单独记录。
- `npm run test:bundle`：通过；ModuleLoader wrapper、external 白名单和 React 单实例检查通过。
- `npm pack --dry-run`：通过，19 个文件。
- 正式 tarball：`dsh-fork-diff-0.1.0.tgz`，38,044 字节，SHA-256 `FF58024815E6436AF6A876893A498433A69702F1F2C7D6FB8B04510CAD442D82`。
- browser bundle：`lib/client.js`，47,289 字节，SHA-256 `4526B8915814A1EAD1492E558098281CF541C385AFD06500553C7C0C03C32F07`。

补充契约：DSH `0.1.0-rc.5` 的客户端注入包为 `@deepseek-ai/dsh-client-connection`、`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`；会话摘要字段为 `id`、`parentId`、`displayTitle`。

## Stage 2: Install

待执行。必须先记录官方 Git 安装的原始结果；只有 Git 路径真实失败后才允许 tarball fallback。

## Stage 3: Browser

待执行。截图必须来自本插件的真实 DSH 运行，不能用测试或其他插件素材替代。

## Stage 4: Publish

待执行。提交、Release 和两个 awesome 列表 PR 必须在 Stage 3 通过且核对远端 SHA 后进行。
