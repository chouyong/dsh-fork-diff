# CLAUDE.md

本文件供 Claude 对 `dsh-fork-diff` 做独立只读审核时使用。

## 角色

Claude 只审核 Codex 已完成的实现与证据，不参与编码、不修改文件、不调用子代理或其他模型。审核只允许 Read、Glob、Grep；禁止 Bash、Write、Edit、Agent、WebFetch、WebSearch。

## 审核重点

- 插件是否保持纯只读，不写会话、不修改文件、不注入 prompt。
- 是否通过公开 `sessions.history` 完整分页读取任意会话，且有无进展和失败关闭保护。
- 是否只比较真实父、子、兄弟血缘，并诚实说明没有公开 `seedLength`。
- 事件归一化、结构 diff、usage/耗时统计是否可验证且不夸大精度。
- Browser bundle 是否使用 DSH ModuleLoader、external 宿主 React，并限制 require 白名单。
- Cordis effect、slot 注册、样式、监听器和焦点行为是否可逆。
- 测试、真实安装、真实浏览器和截图证据是否与当前构件哈希一致。

## 结论格式

审核回执必须包含 `Findings`、`Actions Executed and Not Executed`、`Review Scope`、`Evidence Gaps`、`Residual Risks`，最后一个非空行必须且只能是：

```text
FINAL_DECISION: GO
```

或：

```text
FINAL_DECISION: HOLD
```

`GO` 仅代表声明范围内的技术审核，不代表发布批准、安全放行或真人裁决。
