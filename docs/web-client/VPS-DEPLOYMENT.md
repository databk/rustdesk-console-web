# Paired deployment

Use matching frontend and backend revisions. The companion
[backend PR](https://github.com/databk/rustdesk-console/pull/393) contains the
configuration and gateway deployment documentation. After merge, see
[`docs/web-client-integration.zh-CN.md`](https://github.com/databk/rustdesk-console/blob/main/docs/web-client-integration.zh-CN.md)
and [`deploy/web-client-gateway/README.zh-CN.md`](https://github.com/databk/rustdesk-console/blob/main/deploy/web-client-gateway/README.zh-CN.md).

## Required configuration

```dotenv
WEB_CLIENT_ENABLED=true
WEB_CLIENT_ALLOWED_ORIGIN=https://console.example.com
WEB_CLIENT_ID_SERVER_URL=wss://console.example.com/ws/id
WEB_CLIENT_RELAY_SERVER_URL=wss://console.example.com/ws/relay
WEB_CLIENT_SERVER_PUBLIC_KEY=<existing-base64-public-key>
WEB_CLIENT_ID_UPSTREAM_URL=ws://hbbs:21118
WEB_CLIENT_RELAY_UPSTREAM_URL=ws://hbbr:21119
```

Set the exact HTTPS origin, including a non-default port if used. Upstream URLs
are backend-only fixed destinations; browser requests cannot select an upstream.
Retain existing JWT secrets, database/server volumes, server keys and certificates.
Assign the Web Client role permissions before testing ordinary accounts.

The supplied Docker Nginx template upgrades the exact `/api/web-client/socket`
path to Console. An outer HTTPS proxy must preserve Upgrade, Connection and
the browser's Origin. The native frontend HTTP binary does not upgrade WebSocket
requests; route this exact path directly to Console at the outer proxy instead.

Protect old `/ws/id`, `/ws/relay` and bare WS ports against anonymous browser
bypass. Keep native TCP/UDP access separate; Console authorization does not
automatically govern native clients. The backend example documents browser-Origin
filtering and its limitations.

## Publishing and rollback

Build with `SOURCE_COMMIT` set to the actual source revision. Publish the complete
static output and corresponding source; retain immutable image digests and a
rollback configuration. Do not use a movable `latest` tag as source evidence.
Keep `/web-client-worker.json`, `/system-update-health.json` and `/index.html`
uncached; missing JavaScript/WASM assets must return 404 rather than SPA HTML.

Grants/tickets are process-local. A single Console instance is supported;
replicas require the grant HTTP request and its sockets to reach the same instance.
Restarting Console ends existing browser sessions.

Read-only TCP diagnostics need no helper, extra container or system write. Actual
relay-socket reads can use an explicitly associated, already enrolled management
node. Optional in-process hbbs/hbbr management reuses Console and requires explicit
Docker access, enrolled container labels and private native management endpoints.
These permissions are unnecessary for reading Console's own TCP configuration.

For rollback, disable the feature, restore the matched frontend/backend revisions
and proxy configuration, and preserve all existing data and server keys.
