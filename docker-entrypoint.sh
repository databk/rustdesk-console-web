#!/bin/sh
set -e

NGINX_RESOLVER=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)
case "$NGINX_RESOLVER" in
    *:*) NGINX_RESOLVER="[$NGINX_RESOLVER]" ;;
esac
export NGINX_RESOLVER

exec /docker-entrypoint.sh "$@"