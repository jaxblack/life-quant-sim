---
name: bestcoder-deploy
description: "Deploy or update this static Next.js site (life-quant-sim) to the self-hosted bestcoder.cn server. USE WHEN: user asks to deploy/redeploy/publish/上线/部署/更新 to bestcoder.cn or life.bestcoder.cn; push static build to the Azure nginx server; add a new *.bestcoder.cn subdomain; issue/renew an HTTPS cert with certbot; debug the nginx static hosting. DO NOT USE FOR: GitHub Pages deploy (use scripts/deploy.sh instead); local dev server; code changes unrelated to hosting."
---

# Deploy to bestcoder.cn (self-hosted)

Live site: **https://life.bestcoder.cn** · Source root: `web/` (Next.js 14, `output: 'export'` → pure static).

## Server facts (do not re-discover)

| Item | Value |
|------|-------|
| SSH | `ssh -i ~/Downloads/wordpressraw_key.pem azureuser@57.158.24.185` |
| Stack | Azure VM, nginx + certbot, WordPress also hosted here |
| DNS | Wildcard `*.bestcoder.cn → 57.158.24.185` already exists (no DNS step needed) |
| Static root | `/var/www/life/` — owner `nginx:nginx`, perms `755` |
| nginx conf | `/etc/nginx/conf.d/life.conf` (certbot injected 443 + HTTP→HTTPS 301) |
| Cert | Let's Encrypt, auto-renews via certbot scheduled task |

**Critical:** This is a subdomain *root* deploy, so `basePath` MUST be empty. Do **NOT** set
`NEXT_PUBLIC_BASE_PATH` (that var is only for the GitHub Pages build). The cost is ~0 — pure
static files, any minimal VPS serves it; nginx just serves files, no Node process.

## Redeploy (existing site) — 3 steps

Run the bundled script from the repo root:

```bash
./.github/skills/bestcoder-deploy/deploy.sh
```

Or run the steps manually (from repo root):

```bash
# 1. Clean static build (out/ ~1.9M). Empty basePath on purpose.
cd web && rm -rf .next out && npx next build && cd ..

# 2. Upload (sudo rsync so nginx-owned files can be overwritten)
rsync -az --delete -e "ssh -i ~/Downloads/wordpressraw_key.pem" --rsync-path="sudo rsync" \
  web/out/ azureuser@57.158.24.185:/var/www/life/

# 3. Fix ownership/perms for nginx
ssh -i ~/Downloads/wordpressraw_key.pem azureuser@57.158.24.185 \
  'sudo chown -R nginx:nginx /var/www/life && sudo chmod -R 755 /var/www/life'
```

Then smoke test:

```bash
curl -sI -o /dev/null -w "https -> %{http_code}\n" https://life.bestcoder.cn/
curl -s https://life.bestcoder.cn/ | grep -o '<title>[^<]*</title>'
```
Expect `200` and the page title. No nginx reload or cert step needed for a redeploy.

## First-time setup for a NEW subdomain (`<name>.bestcoder.cn`)

Only needed once per new project. After this, redeploys use the 3 steps above.

```bash
# a. Create root dir, upload (steps 1-3 above but target /var/www/<name>/)
ssh -i ~/Downloads/wordpressraw_key.pem azureuser@57.158.24.185 'sudo mkdir -p /var/www/<name>'

# b. Write nginx server block (HTTP only; certbot adds 443 next)
ssh -i ~/Downloads/wordpressraw_key.pem azureuser@57.158.24.185 'sudo tee /etc/nginx/conf.d/<name>.conf >/dev/null <<EOF
server {
    listen 80;
    server_name <name>.bestcoder.cn;
    root /var/www/<name>;
    index index.html;
    location /_next/static/ {
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location / {
        try_files \$uri \$uri.html \$uri/ /index.html;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx'

# c. Issue HTTPS cert + enable redirect (DNS wildcard already resolves, so this just works)
ssh -i ~/Downloads/wordpressraw_key.pem azureuser@57.158.24.185 \
  'sudo certbot --nginx -d <name>.bestcoder.cn --non-interactive --agree-tos -m admin@bestcoder.cn --redirect'
```

## Troubleshooting

- **403 / 404 from nginx**: ownership wrong — re-run step 3 (`chown nginx:nginx`).
- **Stale page after deploy**: browser/`_next` long cache; hard-reload. The HTML itself isn't cached.
- **`rsync` permission denied**: must keep `--rsync-path="sudo rsync"` (target dir is nginx-owned).
- **Wrong asset paths (404 on `/_next/...`)**: a non-empty `basePath` leaked in — rebuild WITHOUT `NEXT_PUBLIC_BASE_PATH`.
- **Cert renewal**: automatic; to force `ssh ... 'sudo certbot renew'`.
