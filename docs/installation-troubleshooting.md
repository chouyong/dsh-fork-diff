# 安装与排障

本文面向 `dsh-fork-diff v0.1.0` 与 DeepSeek Harness `0.1.0-rc.5`。插件仍依赖预发布阶段的 DSH 客户端契约；使用其他版本时请先在隔离 profile 中验证。

## 安装前检查

```powershell
node --version
dsh --version
```

Node.js 需要 `^22.19.0 || >=24.0.0`。确认要修改的 profile 名称，以下示例使用 `web`；不要把生产 profile 当作首次兼容性试验环境。

插件只需要 DSH Web profile，不需要单独 API key，也不会读取现有凭据。安装命令本身不应包含任何模型密钥。

## 推荐安装

从公开 Release 安装预构建 tarball：

```powershell
dsh plugin --profile web add https://github.com/chouyong/dsh-fork-diff/releases/download/v0.1.0/dsh-fork-diff-0.1.0.tgz
```

启动或重启 profile：

```powershell
dsh --profile web
```

查看合成配置时，应能找到 `dsh-fork-diff` 与 `id: fork-diff`：

```powershell
dsh --profile web --dump-config
```

不要把“命令退出 0”作为唯一安装证据。至少同时核对合成配置、浏览器中的“比较分支”入口，以及插件 client asset 没有加载错误。

## Release URL 超时

本项目发布门禁中，pnpm 从公开 Release URL 下载时两轮 `ETIMEDOUT`，但 GitHub Release 本身可通过 GitHub CLI 下载。遇到相同网络问题时，不要反复重装或把超时归类为插件构建失败。

先下载同一个公开资产：

```powershell
New-Item -ItemType Directory -Path .\artifacts -Force
gh release download v0.1.0 --repo chouyong/dsh-fork-diff --pattern dsh-fork-diff-0.1.0.tgz --dir .\artifacts
Get-FileHash -Algorithm SHA256 .\artifacts\dsh-fork-diff-0.1.0.tgz
```

`v0.1.0` 的预期值：

```text
2E83CFD413E2F706DF589CA3888A73AE3EEDAF0509151D59E0E2408BF0C8C0BF
```

只有大小和 SHA-256 与 Release 一致后，才使用本地 tarball fallback：

```powershell
dsh plugin --profile web add .\artifacts\dsh-fork-diff-0.1.0.tgz
```

该路径证明“下载后的公开 Release 构件由官方 CLI 本地安装成功”，不等于“公开 URL 直装成功”。

## 不要使用 Git source 作为 v0.1.0 安装路径

DSH `0.1.0-rc.5` 使用 pnpm 10+ 安装 Git dependency 时，首次可能报告 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`。即使只允许 pnpm 打印的精确 commit-qualified 构建键，prepare 仍会运行内部 npm 安装，并可能解析到尚未发布的 `@deepseek-ai/dsh-paths` 等 DSH peer 包而返回 404。

这不是放宽通配 `allowBuilds` 的理由。请改用已验证的 Release tarball，不要：

- 添加 `*` 或宽泛包名到 build allowlist。
- 用本地 DSH checkout、绝对路径或私有 registry 改写插件 `package.json`。
- 把 Git prepare 的 peer 404 描述成插件源码编译失败。

## 安装后没有“比较分支”入口

先确认当前会话确实存在可比较对象。插件只显示父、子或兄弟血缘中的普通非 blank 会话；全新会话、孤立会话和 subagent 会话不显示入口，这是预期行为。

依次检查：

1. `dsh --profile web --dump-config` 中存在 `dsh-fork-diff`。
2. 启动的 profile 与安装命令中的 profile 相同。
3. 当前会话至少有一个通过 DSH 正常 fork 流程创建的父、子或兄弟会话。
4. 重启安装前已运行的 DSH Web 进程，并刷新浏览器页面。
5. 浏览器开发者工具中插件 client asset 返回成功，console 没有 ModuleLoader、React 或 injected service 错误。

不要为了让按钮出现而放宽 no-fork 规则或把无关会话加入候选。

## 历史读取失败或提示重试

插件会拒绝以下不完整历史：

- RPC 明确失败。
- 页面序号无效、重复或越过 `beforeSeq`。
- `hasMore` 为真但返回空页或游标没有前移。
- 完整拼接后事件序号不连续。
- 超过 1,000 页的安全上限。

可以先点击“重试”排除瞬时请求失败。如果稳定复现：

1. 记录 DSH、插件、Node 和浏览器版本。
2. 确认两个会话都能在 DSH 正常打开。
3. 检查浏览器 console 和失败请求，但不要上传响应正文或凭据。
4. 使用合成或脱敏事件构造最小复现，并按 [`CONTRIBUTING.md`](../CONTRIBUTING.md) 提交 issue。

不要禁用连续性、重复序号或无进展检查来获得一个“可显示”的部分 diff。

## 大历史和未知事件提示

当分歧区间超过 400,000 个 diff 单元格时，插件使用确定性快速对齐并显示“历史较大，结构对齐使用快速模式”。这是受控降级，不是错误；结果不会被称为精确对齐。

“未渲染的必需事件类型”表示当前 DSH 产生了插件尚未识别且不允许静默忽略的公开事件。请保留提示并报告类型名称，不要把真实事件正文贴到公开 issue。

## 卸载与恢复

```powershell
dsh plugin --profile web remove dsh-fork-diff
```

重启对应 DSH profile 后，标题栏入口、样式和 slot contribution 都应消失。插件不写会话或文件，因此卸载不需要迁移数据。

如果卸载后仍看到旧 UI，先确认浏览器连接的是已经重启的同一 profile，再执行普通页面刷新。不要删除 DSH home、会话目录或其他插件来排查本插件。

## 提交问题前的最小信息

- `dsh-fork-diff` 版本与安装来源（Release URL 或已核哈希的本地 tarball）。
- DSH、Node、npm/pnpm 和浏览器版本。
- profile 名称可以提供，但不要提供 DSH home 内容或凭据。
- `npm run verify` 或真实浏览器复现的成功/失败阶段。
- 已脱敏的错误类型和最小步骤。

安全问题请遵循 [`SECURITY.md`](../SECURITY.md)，不要公开披露会话正文、秘密或可直接使用的利用细节。
