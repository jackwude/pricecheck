# 发版与版本管理

本文档提供一套"个人项目也好用"的最小发版流程：用 `main` 保持稳定，用 tag 标记可回退的版本点。

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

## 打 tag（可回退的"锚点"）

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

---

## Changelog

### v2.0.0 (2026-02-15)

**重大更新：迁移到 Supabase 云端数据库**

#### 新增
- 集成 Supabase PostgreSQL 数据库，替代 localStorage
- 新增 `src/lib/supabase.ts` Supabase 客户端配置
- 支持云端数据存储，多设备访问同一份数据

#### 变更
- `src/services/storage.ts` 完全重写，所有数据操作改为异步
- ID 格式从时间戳改为 UUID 格式
- 设置页面移除旧的同步配置功能

#### 移除
- 删除 `cloudflare/` 目录（Cloudflare Workers 配置）
- 删除 `functions/` 目录（Cloudflare Functions）
- 删除 `migrations/` 目录（D1 数据库迁移）
- 删除 `src/sync/` 目录（加密同步相关代码）

#### 依赖
- 新增 `@supabase/supabase-js` 依赖

---

### v1.0.0

- 初始版本
- 基于 localStorage 的本地存储
- Cloudflare Workers 同步支持
