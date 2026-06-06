// 静态导出配置，用于部署到 GitHub Pages。
// 在 GitHub Actions 中通过 NEXT_PUBLIC_BASE_PATH 注入仓库名作为 basePath。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

module.exports = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
}
