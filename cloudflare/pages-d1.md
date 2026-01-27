# Cloudflare Pages + Functions + D1（数据库版同步）

本方案将前端部署到 Cloudflare Pages，并用 Pages Functions + D1 提供同域同步接口：`/api/sync`。

## 1. Cloudflare 控制台配置（一次性）
### 1) 创建 Pages 项目
1. Cloudflare Dashboard → Workers & Pages → Pages → Create a project
2. 选择 Connect to Git → 绑定 GitHub → 选择仓库 `pricecheck`
3. Branch 选择：`feature/d1-migration`（开发阶段）
4. Build settings：
   - Framework：Vite / React（或留空也可）
   - Build command：`npm ci && npm run build`
   - Build output directory：`dist`

### 2) 创建 D1 数据库
1. Cloudflare Dashboard → Workers & Pages → D1 → Create database
2. 名称建议：`pricecheck-db`

### 3) 将 D1 绑定给 Pages Functions
在 Pages 项目里找到 Functions/Settings（不同 UI 可能略有差异），添加 D1 binding：
- Binding name：`DB`
- Database：选择 `pricecheck-db`

如果你在 Pages 的 Settings 里发现 “Bindings 由 wrangler.toml 管理” 导致无法点击 Add，请确保仓库根目录没有 `wrangler.toml`，然后重新触发一次部署后再添加绑定。

## 2. 初始化数据库表
本仓库提供迁移文件：[0001_sync_spaces.sql](file:///Users/fx/Library/Mobile%20Documents/com~apple~CloudDocs/Anti-gravity/pricecheck/migrations/0001_sync_spaces.sql)

推荐用 wrangler 执行迁移：
1. 安装并登录
   - `npm i -g wrangler`
   - `wrangler login`
2. 执行迁移
   - `wrangler d1 migrations apply pricecheck-db --remote`

## 3. 前端如何填写同步地址
在 Cloudflare Pages 环境，推荐使用同域地址（最短、无需 CORS）：
- 同步服务地址：`/api/sync`

应用会自动拼接 `?sid=...`，不要手工带 `sid`。

## 4. 本地调试（推荐）
目标：本地保留 Vite HMR，同时让 `/api/*` 走 Pages Functions（带 D1）。

1) 启动 Vite（5173）
- `npm run dev`

2) 启动 Pages 本地代理（8788）
- `wrangler pages dev --proxy 5173 --d1 DB=pricecheck-db`

3) 打开
- `http://localhost:8788/`

此时：
- 页面资源由 Vite 提供（支持热更新）
- `/api/sync` 由 Pages Functions 提供（连 D1）

## 5. 同步接口说明
Pages Functions 实现在：[sync.js](file:///Users/fx/Library/Mobile%20Documents/com~apple~CloudDocs/Anti-gravity/pricecheck/functions/api/sync.js)
- `GET /api/sync?sid=...` → `{ rev, blob }`
- `PUT /api/sync?sid=...` → `{ rev }`（rev 冲突返回 409）
