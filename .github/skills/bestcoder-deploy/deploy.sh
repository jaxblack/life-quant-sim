#!/usr/bin/env bash
# Redeploy the static site to the self-hosted bestcoder.cn server (https://life.bestcoder.cn).
# Pure-static (Next.js output:'export') → build, rsync, fix perms, smoke test. No cert/reload needed.
#
# Usage (from anywhere):
#   ./.github/skills/bestcoder-deploy/deploy.sh
#
# First-time NEW subdomain setup is NOT handled here — see SKILL.md.

set -euo pipefail

KEY="${HOME}/Downloads/wordpressraw_key.pem"
HOST="azureuser@57.158.24.185"
REMOTE_ROOT="/var/www/life"
DOMAIN="life.bestcoder.cn"

# Repo root = two levels up from this script's dir (.github/skills/bestcoder-deploy → repo root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
cd "${ROOT_DIR}"

[[ -f "${KEY}" ]] || { echo "!! SSH key not found: ${KEY}"; exit 1; }

echo "==> 1/3 静态构建 (空 basePath)"
# Make sure no GitHub-Pages basePath leaks in.
unset NEXT_PUBLIC_BASE_PATH
( cd web && rm -rf .next out && npx next build )

echo "==> 2/3 rsync 上传 → ${HOST}:${REMOTE_ROOT}"
rsync -az --delete -e "ssh -i ${KEY}" --rsync-path="sudo rsync" \
  web/out/ "${HOST}:${REMOTE_ROOT}/"

echo "==> 3/3 修正属主/权限 (nginx)"
ssh -i "${KEY}" "${HOST}" \
  "sudo chown -R nginx:nginx ${REMOTE_ROOT} && sudo chmod -R 755 ${REMOTE_ROOT}"

echo "==> 冒烟测试"
code="$(curl -sI -o /dev/null -w '%{http_code}' "https://${DOMAIN}/")"
title="$(curl -s "https://${DOMAIN}/" | grep -o '<title>[^<]*</title>' || true)"
echo "    https://${DOMAIN}/ -> ${code}  ${title}"

if [[ "${code}" == "200" ]]; then
  echo "✅ 部署完成: https://${DOMAIN}"
else
  echo "!! 预期 200，实际 ${code} — 见 SKILL.md 排错章节"
  exit 1
fi
