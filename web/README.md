# life-quant-sim-web
Next.js 14 App Router 前端骨架。
当前包含首页与 /sim 占位页。
暂不接入 engine API。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:3000
```

## 部署到 GitHub Pages

仓库已配置 `output: 'export'` 静态导出与 `.github/workflows/deploy.yml`。

1. 在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main` 分支即自动构建并发布。
3. 站点地址：`https://<用户名>.github.io/<仓库名>/`。

本地预览静态产物：

```bash
NEXT_PUBLIC_BASE_PATH=/life-quant-sim npm run build   # 产物在 web/out
```
