# 部署修复

GitHub Actions 工作流中 `npm ci` 需要 lock 文件，但仓库中没有。

修复方案：将 `.github/workflows/deploy.yml` 中的 `npm ci` 改为 `npm install`。

同时建议移除 `cache: npm` 配置，因为不使用 lock 文件时缓存效果有限。

另外确保 `astro.config.mjs` 中的 `base` 设置为 `/Dawnbyones/`。
