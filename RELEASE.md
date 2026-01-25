# 发版与版本管理

本文档提供一套“个人项目也好用”的最小发版流程：用 `main` 保持稳定，用 tag 标记可回退的版本点。

## 基本原则

- `main` 永远保持可构建/可运行
- 每次发版都在 `main` 上打一个 tag（例如 `v1.0.1`）
- 需要撤销已经推送到远端的提交时，优先使用 `git revert`

## 发版前检查

```bash
git switch main
git pull --rebase
npm ci
npm run build
```

## 版本号（推荐 SemVer）

- `MAJOR.MINOR.PATCH`
  - `PATCH`：修 bug、小改动（推荐最常用）
  - `MINOR`：向后兼容的新功能
  - `MAJOR`：破坏性改动

版本号可以写在 `package.json` 的 `version` 字段里。

## 打 tag（可回退的“锚点”）

```bash
git tag -a v1.0.1 -m "release v1.0.1"
git push origin v1.0.1
```

## 部署说明

### GitHub Pages

仓库里已配置 GitHub Pages 工作流：对 `main` 的 push 会自动构建并发布 `dist/`。

因此常见做法是：

- 合并到 `main` → push → 自动部署
- 同时在该点打 tag（便于回退到同一份线上版本）

### Cloudflare Worker（同步服务）

同步服务位于 `cloudflare/`，发布方式见 `cloudflare/README.md`（使用 `wrangler deploy`）。

