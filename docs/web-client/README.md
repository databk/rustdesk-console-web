# Experimental browser remote control

This client is usable in tested desktop configurations, but still needs broader
compatibility testing and refinement. It is maintained by Console, rather than
embedding the proprietary RustDesk V2 web application. Enable it explicitly and
deploy the companion backend. See [deployment](VPS-DEPLOYMENT.md),
[security boundaries](SECURITY.md) and [validation](VALIDATION.md).

## Connection and permissions

Open **Web Client**, select an authorized device or enter its ID, then provide its
RustDesk password or wait for remote approval. Cancel is available throughout
connection and authentication. Ordinary users require an explicitly assigned
`web_client.connect` role permission, even for their own devices. Independent
file sessions also require `web_client.file_transfer` for the target.

The Console gateway authorizes the current account, login and registered device.
Native password/approval and remote feature permissions remain necessary.
Owning a device or seeing it in an address book does not grant web access.

## Session tools

The centered toolbar groups session, display and keyboard/mouse settings. File
transfer, chat, voice, recording and quality monitoring open directly from it.

- **Session:** control/read-only mode, clipboard synchronization and saved-device
  credential removal. Read-only mode disables both keyboard and mouse input.
- **Display:** monitor, fit/original scale, quality presets, custom bitrate ratio,
  requested frame rate from 5 to 120 FPS, encoding preference, true color,
  remote cursor scaling and supported remote resolution changes.
- **Keyboard/mouse:** wheel reversal, swapped mouse buttons, Ctrl/Command mapping,
  touch mode, native secure-attention/lock actions and an independent screen keyboard.
- **Clipboard:** direct text/PNG paste and remote-copy synchronization; there is
  no clipboard panel. Browser permission and remote clipboard permission apply.
  A sent notification is not a remote application execution receipt.
- **Files:** a resizable two-pane window. Select a local directory with the
  browser's directory picker; only that authorized tree is accessible. Browse
  the remote tree independently. Transfer selected files with the center arrows,
  upload through the remote-pane toolbar, or save selected remote files locally.
  Native authentication is reused inside the Worker when available.
- **Chat/voice:** native protocol messages and a short-lived microphone capture
  for an accepted call. Stop, disconnect or loss of permission releases capture.
- **Recording:** save received video as WebM without re-encoding; video only.
  Cancellation aborts saving. Codec/display changes end the current recording.
- **Quality:** actual received, decoded and drawn frame counters, video bitrate,
  native TestDelay feedback and bounded local queue/timing diagnostics. The panel
  can be moved, resized and given 35–100% background opacity. Expanded frame
  diagnostics include separate entry and relay TCP observations.

VP8, VP9 and AV1 are offered only when browser probes permit them. VP9/AV1 8-bit
4:4:4 additionally require browser and remote support; VP8 does not expose it.
Actual stream headers determine the displayed encoding and color format.
Requested FPS is a ceiling, not a performance guarantee. Smooth quality reduces
the requested bitrate ratio; it cannot remove network or remote encoding limits.

Normal pages cannot reliably suppress OS/global shortcuts. Fullscreen keyboard
capture is used when supported, but some system keys remain local. The session
shows the observed capture state and prompts at most once per connection.
Browser fullscreen origin text is controlled by the browser.

Remembered passwords use encrypted, account/server/device-scoped derived
credentials in IndexedDB. They remain password-equivalent material and cannot
protect against same-origin malicious code. Missing/invalid records fall back
to manual authentication; explicit removal deletes the saved device record.

Chinese, English, French, Brazilian Portuguese and Russian are supported.

## Maintenance

Use Node 24 and the committed lockfile. `npm run build` builds the page and
self-contained Worker, then writes the Worker manifest, license/source notice
and upstream system-update metadata. Do not publish only part of these outputs.
Page/Worker build identity mismatches fail closed; service-worker updates are
bounded and must not mix old page code with new Worker code.

`npm run web-client:protocol:check` verifies the fixed protocol inputs and generated
output. Update them through `npm run web-client:protocol`, preserving
[source attribution](../../vendor/rustdesk-protocol/NOTICE.md) and
[third-party licenses](THIRD-PARTY-NOTICES.txt). Generated protocol code is not
hand-edited. Disable `WEB_CLIENT_ENABLED` and restart Console to disable new grants
and close existing grants during revalidation. No database migration is added.
