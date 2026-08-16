# dsh-fork-diff Release Report

## 状态

进行中。插件实现、真实部署、公开仓库和 Release 已完成；第一个 awesome 列表要求的至少 10 个提交已经满足，Stage 4 只剩仓库创建满 1 天的时间门槛。最终结论只允许为 `FIRST_PASS`、`PASS_AFTER_CHANGES` 或 `FAIL`，并必须引用完整构建、安装、真实浏览器、截图、审核和远端证据。由于产品归一化逻辑、测试夹具、浏览器自动化和安装路径均在首轮后修正，最终若所有门禁继续通过只能分类为 `PASS_AFTER_CHANGES`。

## 已完成

- 纯只读插件实现、自动化测试、类型检查、生产构建和 bundle contract。
- 最终 tarball 与三张真实截图已生成；R1B 修复后最终 tarball SHA-256 为 `2E83CFD413E2F706DF589CA3888A73AE3EEDAF0509151D59E0E2408BF0C8C0BF`，browser bundle SHA-256 为 `8371F230A2C695A03F34E40D24CAAFD473EB6884D2F65F7685DC170FCA5EA2BA`。
- 最终 tarball 已安装到隔离 `fork-diff-web` profile；最终 Edge 浏览器门禁通过，三类错误均为 0，详见 `docs/release-evidence.md` 与 `docs/browser-gate-receipt.json`。
- Claude R2A 与 R2B 均为 `GO`；`v0.1.0` 实现与 Release target `9a16a072eba57b16f0a9040ad8047bacdcf389a1` 已推送到公开仓库。
- `v0.1.0` Release 已发布；远端资产重新下载后的大小与 SHA-256 和本地验证构件一致。
- 公开资产已通过 GitHub CLI 下载并由官方 DSH CLI 安装到新的 `fork-diff-release-web`；bundle、三图、peer 声明和配置组合均通过。
- `awesome-deepseek-harness` PR #270 已创建并核对为 `OPEN`、`MERGEABLE`，仅修改双语列表各一行。
- 公开仓库资格复核基线 `7175f307d3fe1c0b11feded6591aad4742c2ae56` 有 16 个真实提交；GitHub Actions CI run `31942167177` 成功。后续证据文档提交只会继续增加真实提交数。

## 待完成

- `awesome-dsh-plugin` PR：提交数门槛已满足；待仓库于北京时间 `2026-08-17 17:23:36` 满 1 天后提交。当前准备分支为基于 upstream `617810c72c8ee805ff844665decfd707b81b4aa3` 的单提交 `9df7fc211eff5c767412adc6bca6311784f93005`，未用伪造时间或必败 PR 绕过门禁。

## 已知边界

- 插件不创建、合并或修改分支。
- 插件不宣称精确 fork boundary。
- 插件不自动评价哪个分支更好。
