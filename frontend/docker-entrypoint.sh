#!/bin/sh
set -e

# Railway sets PORT dynamically; default to 8080 if not set
PORT="${PORT:-8080}"

echo "=== Frontend Container Starting ==="
echo "PORT=$PORT"
echo "BACKEND_URL=$BACKEND_URL"

# Remove default nginx config to avoid port conflicts
rm -f /etc/nginx/conf.d/default.conf

cat > /etc/nginx/conf.d/app.conf <<EOF
server {
    listen $PORT default_server;
    listen [::]:$PORT default_server;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass $BACKEND_URL;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "=== Generated nginx config ==="
cat /etc/nginx/conf.d/app.conf
echo "=== Starting nginx on port $PORT ==="

exec nginx -g 'daemon off;'
