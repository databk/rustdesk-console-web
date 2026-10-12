# Validation

Run checks against the final revision and committed dependency lockfile. Record
the command, environment, exit status and any skipped case; historical counts or
capability probes do not certify a new deployment.

```sh
npm ci
npm test -- --runInBand --detectOpenHandles
npm run web-client:protocol:check
npx tsc --noEmit
npx @biomejs/biome lint
npx @biomejs/biome format --diagnostic-level=error
node --test scripts/*.test.cjs scripts/*.test.mjs
npm run build
docker build .
```

`node scripts/build-web-client-smoke.cjs` builds only a private synthetic media
entry under `node_modules/.cache/web-client-smoke/media.html`. Serve it on a local
secure origin to exercise the pinned VP9 fixtures; it does not connect a device
or bypass Console authorization. The obsolete direct-connection harness is removed.

For Docker HTTP checks, run `node deploy/web-client/smoke.cjs <local-origin>`
against the built Nginx image. Check the Worker manifest, MIME, cache policy,
missing assets and license output. Test WebSocket Upgrade separately with the
companion backend; ordinary HTTP success does not establish WS compatibility.

## Paired real-device acceptance

| Area | Required cases |
| --- | --- |
| Roles | No-role denial; own-device denial without connect; group/global scope; file denial without file permission; unknown/disabled/duplicate devices |
| Lifecycle | Actual login/role/account/device revocation; parent/file closure; admin disconnect; replay/wrong Origin; restart and audit-storage failure |
| Native auth | Password success/failure; remote accept/reject; cancel; remembered credentials and invalidation; authenticated KX 0/1 |
| Input | Click/double-click, drag, wheel, text/IME, mappings; fullscreen/normal shortcuts; loss of focus and permission restoration |
| Media | VP8/VP9/AV1; available VP9/AV1 4:4:4; actual remote resolution; motion at each quality/FPS setting; queue/decoder recovery |
| Clipboard | Bidirectional Unicode and PNG in real target apps; permission loss, synchronization disabled, oversized/unsupported input |
| Files | Directory picker, auth reuse, upload/download and byte hashes; cancellation, write rejection, parent/session failure |
| Audio | Continuous non-silent playback and user-confirmed sound; accepted/declined voice call, microphone permission/capture cleanup |
| Recording | Saved video-only WebM, file hash, duration/playback; cancellation, display/codec change, interrupted writes |
| Updates | Old service worker/page to new page/Worker; complete source/license/manifest identity; no mixed-version session |
| TCP | Actual system/connection scope and algorithms; unavailable reasons; independent entry/relay result; five-language popups |

Use a foreground browser tab and a continuously changing test screen for FPS
comparisons. Record requested and actual encoding, resolution, bitrate, received/
decoded/drawn FPS, native TestDelay and queue metrics. Compare network algorithms
on fresh sockets; do not report a requested 120 FPS ceiling as measured throughput.
Broader mobile/browser/native-version and long-session matrices remain necessary.
