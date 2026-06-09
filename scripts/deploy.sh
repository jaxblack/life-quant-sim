#!/usr/bin/env bash
# 一键部署脚本：本地构建校验 → 提交 → 推送 main，触发 GitHub Actions 自动部署到 Pages。
#
# 用法：
#   ./scripts/deploy.sh                 # 用默认提交信息
#   ./scripts/deploy.sh "你的提交信息"   # 自定义提交信息
#
# 说明：
#   - 实际的静态构建与发布由 .github/workflows/deploy.yml 在 GitHub Actions 上完成；
#   - 本脚本在推送前先在本地跑一遍 type-check + build，避免把构建失败的代码推上去；
#   - 推送成功后即触发线上自动部署，部署地址：
#       https://jaxblack.github.io/life-quant-sim/

set -euo pipefail

# 切到仓库根目录（脚本所在目录的上一级）。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
COMMIT_MSG="${1:-chore: deploy $(date '+%Y-%m-%d %H:%M:%S')}"

echo "==> 仓库: ${ROOT_DIR}"
echo "==> 当前分支: ${BRANCH}"

if [[ "${BRANCH}" != "main" ]]; then
  echo "!! 当前不在 main 分支（自动部署只监听 main）。"
  read -r -p "仍要继续推送到 ${BRANCH} 吗？(y/N) " ans
  [[ "${ans}" == "y" || "${ans}" == "Y" ]] || { echo "已取消。"; exit 1; }
fi

echo "==> 本地校验：type-check + build"
cd "${ROOT_DIR}/web"
npx tsc --noEmit
NEXT_PUBLIC_BASE_PATH="/$(basename "${ROOT_DIR}")" npx next build
cd "${ROOT_DIR}"

if [[ -z "$(git status --porcelain)" ]]; then
  echo "==> 没有改动需要提交，直接推送以确保线上同步。"
else
  echo "==> 提交改动：${COMMIT_MSG}"
  git add -A
  git commit -m "${COMMIT_MSG}"
fi

echo "==> 推送到 origin/${BRANCH}（将触发 GitHub Actions 自动部署）"
git push origin "${BRANCH}"

echo ""
echo "✅ 已推送。GitHub Actions 正在构建并部署。"
echo "   进度查看: https://github.com/jaxblack/life-quant-sim/actions"
echo "   部署地址: https://jaxblack.github.io/life-quant-sim/"
