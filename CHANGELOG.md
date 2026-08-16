# 变更日志

本文件记录 `dsh-fork-diff` 的用户可见变化。版本遵循[语义化版本](https://semver.org/lang/zh-CN/)，条目结构参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

当前没有未发布的用户可见变化。

## [0.1.0] - 2026-08-16

### Added

- 在 DeepSeek Harness 会话标题栏提供“比较分支”入口。
- 基于父、子和兄弟血缘发现相关会话，当前会话固定在左侧。
- 反向分页读取完整公开历史，并对无进展、重复序号、非连续页、请求失败和页数上限失败关闭。
- 对齐用户消息、assistant 最终回答、工具调用和工具结果。
- 显示不变、已修改、仅左侧、仅右侧四类结构差异，以及已修改文本的行级高亮。
- 汇总用户消息、回答、工具调用、错误工具、耗时和可见 token usage。
- 支持“仅差异/全部”切换、比较对象切换和打开对应会话。
- 支持桌面双栏、移动端单栏、Escape 关闭、焦点陷阱与焦点恢复。
- 加入取消旧请求、过期结果隔离、未知事件提示和大历史快速对齐模式。
- 加入 ModuleLoader、external dependency 和单 React 实例 bundle contract。
- 提供三张来自真实 DSH `0.1.0-rc.5` 与 Microsoft Edge 的验收截图。

### Fixed

- 只把 `source.kind = user` 的直接输入计为用户消息，排除 agent instructions、plugin 和 skill catalog 上下文。
- 递归展开嵌套 `tool-result` block，并保留工具错误语义。
- 忽略已知 DSH 控制与元数据事件，同时继续显示真正未知的必需事件类型。
- 修复近似 diff 快速路径在重复 fingerprint 位置桶耗尽后可能不终止的问题，并加入 700 x 700 回归测试。

### Verification

- typecheck、生产构建、7 个 Vitest 文件 23/23 用例和 browser bundle contract 通过。
- 真实浏览器验收中 console error、page error 与 failed request 均为 0。
- `v0.1.0` Release asset 大小为 239,114 字节，SHA-256 为 `2E83CFD413E2F706DF589CA3888A73AE3EEDAF0509151D59E0E2408BF0C8C0BF`。
- 本机从公开 Release URL 直接安装遇到网络 `ETIMEDOUT`；下载同一公开资产、核对哈希后，由官方 DSH CLI 使用本地 tarball fallback 安装成功。

### Known limitations

- DeepSeek Harness 客户端摘要没有公开持久化 `seedLength`；本版本按可见历史推导共同前缀，不宣称精确 fork 点或事件级共同祖先。
- 插件不会判断分支优劣，也不执行 merge、cherry-pick、fork 创建、历史改写或文件修改。
- DSH `0.1.0-rc.5` 从 Git source 安装会在 prepare 阶段解析到尚未发布的 DSH peer 包，推荐使用预构建 Release tarball。

[Unreleased]: https://github.com/chouyong/dsh-fork-diff/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/chouyong/dsh-fork-diff/releases/tag/v0.1.0
