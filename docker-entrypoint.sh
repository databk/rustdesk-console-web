#!/bin/sh
set -e

NGINX_RESOLVER=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)
export NGINX_RESOLVER

exec /docker-entrypoint.sh "$@"