#!/bin/bash
# Bootstraps the instance on first boot: installs the runtime, clones the
# app, starts it under pm2, and puts nginx in front as a WebSocket-aware
# reverse proxy. Idempotent-ish (safe to re-run via `terraform apply`
# replacing user_data), but day-to-day deploys go through deploy.yml
# instead of re-running this.
set -euxo pipefail

dnf update -y
dnf install -y git nginx nodejs npm python3-pip

npm install -g pm2

APP_DIR=/opt/tiefighter
if [ ! -d "$APP_DIR" ]; then
  git clone ${repo_url} "$APP_DIR"
fi
cd "$APP_DIR"
git pull
npm run build

cat > server/src/.env <<EOF
WEB_SERVER=${app_port}
EOF

pm2 delete tiefighter 2>/dev/null || true
pm2 start main.js --name tiefighter --cwd "$APP_DIR/server/src"
pm2 save
# Running as root, pm2 self-installs the systemd unit here directly
# (no separate command to capture/eval, unlike the non-root case).
pm2 startup systemd -u root --hp /root

# certbot is installed here but NOT run here — DNS may not point at this
# instance's EIP yet at boot time. Run it once, manually, after `dig`
# confirms DNS has propagated (see infra/README.md).
python3 -m pip install certbot certbot-nginx

cat > /etc/nginx/conf.d/tiefighter.conf <<EOF
server {
    listen 80;
    server_name ${domain_name};

    location / {
        proxy_pass http://127.0.0.1:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

systemctl enable nginx
systemctl restart nginx
