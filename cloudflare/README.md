# Cloudflare 同步服务（无登录）

## 功能
- `GET /sync?sid=...`：获取 `{ rev, blob }`
- `PUT /sync?sid=...`：提交 `{ rev, blob }`，冲突返回 409
- KV 只存加密 blob，Worker 不接触明文数据

## 部署（推荐用 wrangler）
1. 安装并登录
   - `npm i -g wrangler`
   - `wrangler login`
2. 创建 KV
   - `wrangler kv namespace create PRICECHECK_SYNC`
3. 把输出的 KV id 填到 [wrangler.toml](file:///Users/fx/Library/Mobile%20Documents/com~apple~CloudDocs/Anti-gravity/pricecheck/cloudflare/wrangler.toml) 的 `id` 字段里
4. 发布
   - `cd cloudflare`
   - `wrangler deploy`

## 前端配置
- 部署后会得到一个 Worker URL（形如 `https://xxx.workers.dev`）
- 在应用“设置 → 同步”里填入：`https://xxx.workers.dev/sync`
- 或者把 `#api=...` 放进同步链接中，其他设备打开同一链接即可自动配置

## 本地开发（可选）
- 如果你需要在本地 `http://localhost:5173` 调试前端同步，请在 Worker 里把 `ALLOWED_ORIGINS` 配置为逗号分隔：
  - `https://jackwude.github.io,http://localhost:5173`
