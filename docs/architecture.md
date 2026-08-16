# dsh-fork-diff 架构

本文说明 `dsh-fork-diff` 的运行边界、数据流、失败关闭策略和测试分层，帮助贡献者在不破坏只读约束与 DSH browser bundle 契约的前提下修改插件。

## 设计目标

- 只比较与当前会话存在父、子或兄弟血缘的普通用户会话。
- 通过公开 DSH 客户端服务读取数据，不打开后台 Agent，不读取隐藏数据库。
- 把原始公开历史转换为稳定、可测试的比较单元，再执行结构 diff 和文本 diff。
- 对分页异常、未知必需事件、过期请求和大历史降级保持可见，不静默伪造精确结果。
- 所有 UI、样式和 slot contribution 都由 Cordis 生命周期管理，可完整卸载。

非目标包括创建 fork、改写历史、修改文件、判断分支赢家、merge、cherry-pick 和上传会话。

## 运行分层

| 层 | 入口 | 职责 |
| --- | --- | --- |
| Node discovery | [`src/index.ts`](../src/index.ts) | 导出插件名称和空 `apply`，只让 DSH 发现 browser client；不读取会话 |
| Browser composition | [`src/client/index.ts`](../src/client/index.ts) | 注入 `connection`、`sessions`、`slots`，安装样式并注册 header action |
| UI state | [`src/client/ForkDiff.tsx`](../src/client/ForkDiff.tsx) | 候选选择、并行加载、请求取消、错误恢复、diff 展示和导航 |
| Pure data pipeline | `history.ts`、`normalize.ts`、`lineage.ts`、`diff.ts`、`text-diff.ts` | 分页、血缘、折叠、归一化、指标与差异算法 |
| Local host contract | [`src/client/contract.ts`](../src/client/contract.ts) | 只声明实际使用的 DSH 服务和事件形状，避免依赖未发布的完整客户端类型链 |

Browser 入口向 `conversation.session.header.actions` 注册 `fork-diff`，顺序为 16。浏览器构件由 `window.__ModuleLoader__.load(...)` 注册，React、Cordis、slots、runtime 和 DSH UI primitives 均由宿主提供。

## 数据流

```text
sessions.list (id / parentId / displayTitle)
    |
    v
findComparisonCandidates
    |
    +-- 无相关会话 --> 不渲染触发器
    |
    v
用户打开面板并选择比较对象
    |
    v
Promise.all(loadCompleteHistory(left), loadCompleteHistory(right))
    |
    +-- Abort / RPC / page invariant failure --> 可重试错误状态
    |
    v
normalizeHistory(events)
    |
    +-- units: user / assistant / tool-call / tool-result
    +-- metrics: messages / tools / duration / usage
    +-- unsupportedRequiredTypes
    |
    v
diffUnits(left.units, right.units) + diffText(left.body, right.body)
    |
    v
仅差异或全部视图；用户可导航到任一会话
```

当前会话始终在左侧。比较对象变化、面板关闭或组件卸载时，React effect 会中止两侧 `sessions.history` 请求；已中止请求的结果不能更新当前面板。

## 血缘候选

[`findComparisonCandidates`](../src/client/lineage.ts) 只使用插件侧 `SessionListState` 的 `id`、`parentId` 与稳定宿主顺序：

1. 同一父会话下的兄弟分支。
2. 当前会话的父分支。
3. 当前会话的直接子分支。

候选会排除当前会话、blank 会话和 subagent 会话，并以 `seen` 集合去重。不得把 Host wire 的 `sessionId` / `parentSessionId` 字段名套到这里。

## 完整历史分页

[`loadCompleteHistory`](../src/client/history.ts) 使用公开 `sessions.history` 反向读取消息对齐页：

- 默认每页 50 条消息，最多 1,000 页。
- 用当前页最早事件的 `seq` 作为下一页 `beforeSeq`。
- 每页事件序号必须严格递增且低于 `beforeSeq`。
- 跨页不允许重复序号，`hasMore` 时不允许空页或游标无进展。
- 拼接后的完整历史必须从序号 0 连续到最后一个事件。

任何不变量失败都会抛出带 `rpc`、`invalid-page`、`no-progress` 或 `page-limit` 分类的 `HistoryLoadError`。UI 显示可重试错误，不拿部分历史生成看似完整的 diff。

## 事件归一化

[`normalizeHistory`](../src/client/normalize.ts) 先根据公开 `surfaceOp` 折叠被替换的消息，再生成比较单元：

- `user/message`：只接受 `source.kind = user` 的直接输入。
- `assistant/message`：只显示最终回答，不混入 reasoning 或内嵌 tool call。
- `tool/call`：稳定排序 JSON 参数，无法解析时保留原文。
- `tool/result`：递归读取嵌套 `tool-result`，保留错误标记。

指标从原始事件和可见单元共同计算。耗时只累计有完整 `turn/start` / `turn/end` 的 turn；usage 只汇总公开 assistant message 字段。

已知控制事件不会成为比较单元。真正未知且非 `ignorable` 的事件类型进入 `unsupportedRequiredTypes` 并显示在面板通知中，不被解释为受支持内容。

## 差异算法

[`diffUnits`](../src/client/diff.ts) 先剥离完全相同的前缀和后缀，再处理分歧区间：

- 分歧矩阵不超过 400,000 个单元格时使用精确 LCS。
- 超过限制时使用确定性的递增贪心匹配，避免二次方内存；结果显式标记 `approximate`。
- 未匹配区间优先按单元类型对齐为 `changed`，其余显示为 `left-only` 或 `right-only`。
- 文本正文由独立 `text-diff.ts` 做行级高亮，长文本同样有明确的快速模式提示。

公开的 `commonPrefixUnits` 只是可见、归一化历史的相同前缀。DSH 客户端没有公开持久化 `SessionHeader.seedLength`，所以这个值不能称为精确 fork boundary。

## UI 与生命周期

- 没有相关候选时 `ForkDiff` 返回 `null`，不显示无效入口。
- 面板通过 portal 挂到 `document.body`，但仍由 React/Cordis 组件生命周期持有。
- 打开时锁定 body 滚动并聚焦关闭按钮；关闭时恢复滚动和触发器焦点。
- Tab/Shift+Tab 保持焦点在 dialog 内，Escape 和 backdrop 均可关闭。
- `installStyles` 的卸载函数交给 `ctx.effect`；slot 注入由 Cordis fiber 管理。
- 桌面使用双栏，移动端改为单栏；固定控件尺寸与文本溢出规则由 `styles.ts` 维护。

## 安全与隐私

客户端仅使用：

- `sessions.list` 获取公开摘要与血缘。
- `connection.api.sessions.history(...)` 获取公开历史。
- `sessions.open(id)` 响应用户主动导航。

实现不得增加 Cookie、localStorage、IndexedDB、环境变量、会话数据库或外部遥测读取。会话正文不写入日志或持久化文件。详细报告范围见 [`SECURITY.md`](../SECURITY.md)。

## 构建与测试分层

| 门禁 | 覆盖内容 |
| --- | --- |
| `npm run typecheck` | TypeScript 源码与局部宿主契约 |
| `npm run build` | Node discovery、browser bundle 和声明文件 |
| `npm test` | 血缘、分页、归一化、结构/文本 diff、样式与组件交互 |
| `npm run test:bundle` | ModuleLoader 包装、external allowlist、无第二份 React |
| 真实浏览器门禁 | 实际 DSH history、父/兄弟切换、导航、桌面/移动端、零浏览器错误 |

修改数据管线时优先增加纯函数回归测试；修改宿主交互或视觉行为时，在自动化门禁后补隔离 DSH profile 的真实浏览器证据。
