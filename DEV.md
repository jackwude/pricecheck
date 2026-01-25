# 开发指南

## 环境要求

- Node.js 20（与 GitHub Pages CI 保持一致）
- npm

## 本地开发

```bash
npm ci
npm run dev
```

如需在局域网设备上访问本机开发服务器：

```bash
npm run dev -- --host
```

## 构建与预览

```bash
npm run build
npm run preview
```

## 项目结构速览

- 入口链路：`index.html` → `src/main.tsx` → `src/App.tsx`
- 路由：`react-router-dom`
- 持久化：`src/services/storage.ts`（基于 `localStorage`）

## 推荐的 Git 工作流（个人开发版）

目标：主线永远可运行，试错不污染主线。

- `main`：稳定分支，只合入“确定可用”的改动
- `feature/*`：功能开发分支
- `experiment/*`：实验分支（可随时丢弃）

典型流程：

```bash
git switch main
git pull --rebase

git switch -c feature/your-feature

# 开发中勤提交（每次提交都尽量能跑起来）
git add -A
git commit -m "feat: ..."

git switch main
git merge --no-ff feature/your-feature
git push
```

如果做出来不满意：

```bash
git switch main
git branch -D feature/your-feature
```

## 回退与救火

### 丢弃未提交改动

- 丢弃所有未暂存改动：

```bash
git restore .
```

- 取消暂存：

```bash
git restore --staged .
```

### 暂存现场（WIP）

```bash
git stash push -u -m "wip"
git stash pop
```

### 回到某个提交（改历史，适合只在本地/私有分支）

```bash
git log --oneline
git reset --hard <commit>
```

### 撤销某个提交（不改历史，更安全）

```bash
git revert <commit>
```

## 常见问题

### tsc 报 Cannot find type definition file for 'xxx 2'

这通常是文件系统或 iCloud 同步导致 `node_modules/@types` 下出现空的重复目录（如 `xxx 2`）。删除这些空目录后，重新执行 `npm ci` 或 `npm run build` 即可恢复。

