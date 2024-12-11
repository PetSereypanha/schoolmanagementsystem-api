#!/bin/bash
set -e

# Debug info
echo "Starting Nginx configuration..."
ls -la /etc/nginx/conf.d/

# Generate config
vars=$(compgen -A variable)
subst=$(printf '${%s} ' $vars)
envsubst "$subst" < /etc/nginx/conf.d/vhost.template > /etc/nginx/conf.d/default.conf

# Start nginx
echo "Starting Nginx..."
nginx -g 'daemon off;'