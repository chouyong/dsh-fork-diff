# 贡献指南

感谢你改进 `dsh-fork-diff`。本项目优先接受能够提升会话分支比较准确性、兼容性、可访问性和可验证性的聚焦变更。

## 开始前

提交代码前，请先搜索已有 issue，确认问题没有重复。行为变化或较大的 UI 调整建议先创建 issue，说明使用场景、预期行为、兼容范围和不做什么，避免实现方向与插件的只读边界冲突。

需要以下环境：

- Node.js `^22.19.0 || >=24.0.0`
- npm 11 或兼容版本
- 需要真实运行验收时，使用 DeepSeek Harness `0.1.0-rc.5` 或明确记录的兼容版本

安装依赖：

```powershell
npm install --ignore-scripts --legacy-peer-deps
```

DSH 的部分 peer 包尚未发布到 npm，因此不要删除 `--legacy-peer-deps`，也不要把本地 DSH checkout 或绝对路径写入 `package.json`。

## 产品边界

贡献必须保持插件只读：

- 可以读取公开会话列表和 `sessions.history`，并使用 `sessions.open(id)` 导航。
- 不创建或改写 fork，不写 session event，不修改文件，不恢复后台 Agent。
- 不采集会话正文、凭据、Cookie、环境变量或隐藏数据库。
- 不把推导出的可见共同前缀描述成持久化的精确 fork 边界。
- 默认比较对象必须与当前会话存在父、子或兄弟血缘关系。

新增外部模块时，确认 browser bundle 仍从 DSH 宿主加载 React、Cordis 和客户端服务，不能打包第二份 React。

## 开发与测试

提交前运行：

```powershell
npm run verify
```

该命令执行类型检查、生产构建、完整 Vitest 和 browser bundle contract。变更历史分页、事件归一化、血缘选择、diff 对齐或统计时，需要增加能覆盖失败关闭与边界条件的测试。

UI 变更还应核对：

- 键盘操作、Escape 关闭、焦点恢复。
- 加载、空、错误和无相关分支状态。
- 桌面双栏与 390 像素宽移动端单栏。
- 长标题、长回答和工具结果不溢出、不遮挡控件。
- 插件卸载后样式和 slot contribution 被清理。

涉及真实 DSH 行为时，请记录 DSH、Node、浏览器版本和安装路径结果。截图必须来自真实运行，不得用静态 HTML、设计稿或其他插件截图替代。

## 提交与 Pull Request

- 每个提交只承担一个可说明的目的，不使用空提交凑数量。
- 文本文件使用 UTF-8，提交前运行 `git diff --check`。
- 不提交 `node_modules`、构建缓存、DSH profile、会话数据、日志或秘密。
- PR 描述应包含问题、方案、验证命令、行为风险和截图（如适用）。
- 如果首次验证失败，保留失败类别，并说明修复后通过；不要把它写成一次通过。
- 不在同一 PR 中夹带无关格式化、依赖升级或重构。

维护者会优先检查正确性、只读边界、宿主 bundle 契约、回归测试和真实运行证据。
