# dsh-fork-diff Release Report

## 状态

进行中。最终结论只允许为 `FIRST_PASS`、`PASS_AFTER_CHANGES` 或 `FAIL`，并必须引用完整构建、安装、真实浏览器、截图、审核和远端证据。由于产品归一化逻辑、测试夹具、浏览器自动化和安装路径均在首轮后修正，最终若所有门禁继续通过只能分类为 `PASS_AFTER_CHANGES`。

## 已完成

- 纯只读插件实现、自动化测试、类型检查、生产构建和 bundle contract。
- 最终 tarball 与三张真实截图已生成；R1B 修复后最终 tarball SHA-256 为 `2E83CFD413E2F706DF589CA3888A73AE3EEDAF0509151D59E0E2408BF0C8C0BF`，browser bundle SHA-256 为 `8371F230A2C695A03F34E40D24CAAFD473EB6884D2F65F7685DC170FCA5EA2BA`。
- 最终 tarball 已安装到隔离 `fork-diff-web` profile；最终 Edge 浏览器门禁通过，三类错误均为 0，详见 `docs/release-evidence.md` 与 `docs/browser-gate-receipt.json`。

## 待完成

- Claude R1/R2 审核、GitHub Release 及两个 awesome 列表 PR。

## 已知边界

- 插件不创建、合并或修改分支。
- 插件不宣称精确 fork boundary。
- 插件不自动评价哪个分支更好。
