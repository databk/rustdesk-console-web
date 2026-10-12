# Security boundaries

This experimental implementation is not an independent security certification.

## Authorization and encrypted transport

The gateway requires an authenticated Console login, explicit Web Client role
scope and an unambiguous active registered device. Single-use, short-lived tickets
bind the target, purpose, configured public key and relay UUID. Tickets appear
only in the first WebSocket message, never URLs; Console login tokens do not reach
native servers. Destination URLs are administrator-configured, not client-selected.

The server periodically revalidates login, role and device state. Revocation,
expiry, cancellation and parent-session termination close the associated sockets.
Audit failure prevents new admission; termination closes sockets before attempting
its audit. Grants are bounded and process-local.

Remote passwords/approval and native feature permissions remain authoritative.
The gateway forwards encrypted content without decrypting it. Independent file
permission controls the supported file-session flow; it cannot prove that a
modified client never hides another operation inside an admitted desktop stream.
Use remote native permissions for strict content-level restrictions.

Protect anonymous browser WS bypasses in deployment. Public native TCP/WS access
does not automatically inherit Console roles. Origin filtering protects browser
access paths, but is not authentication for arbitrary native clients.

## Native key exchange

Authenticated KX 1 uses direction-specific keys. Authenticated KX 0 remains
compatible and carries a persistent risk/upgrade notice. Its shared key and
cross-direction counter construction can reuse a nonce; compatibility does not
fix that confidentiality risk. WSS does not repair the inner cryptography.
Invalid signatures, identity mismatches, downgrade attempts, decrypt failures and
replay fail closed without retrying legacy encryption or plaintext.

Protocol inputs are fixed in `vendor/rustdesk-protocol/source.json`; see
[upstream attribution](../../vendor/rustdesk-protocol/NOTICE.md). Version labels
alone do not prove that a native binary includes a particular handshake change.

## Local credentials and input

Remembered device credentials stay inside the Worker and encrypted IndexedDB
storage using a non-exportable CryptoKey. They are isolated by Console account,
server identity and device, but remain password-equivalent and accessible to
authorized same-origin code. This is not protection against same-origin XSS.
Failed authentication invalidates the candidate; cancellation/forget operations
prevent delayed saves from restoring old records. No plaintext-storage fallback.

Focus loss, hidden pages, permission revocation and cleanup release held input,
keyboard capture, pending paste and microphone resources. Failed networking or a
whole-browser exit cannot guarantee that a remote release event was delivered.
Fullscreen keyboard capture depends on the browser/OS and cannot guarantee
suppression of every global shortcut.

## Audit and resource limits

Server admission, gateway-open and termination events are server observations.
Native-auth/file reports are explicitly browser-sourced, not independently
verified remote execution. Reports may be missing after closure, network failure,
rate limiting or storage failure. Historic audit events do not prove a session
is currently online. Administrators need scoped device-disconnect permission to
end another user's session; audit-view permission is insufficient.

Do not log passwords, derived credentials, tickets, clipboard/chat/file bodies,
keyboard input or PCM. File audit metadata is limited to basename, byte size and
direction. Packet/queue/decompression limits, epoch checks, startup deadlines and
bounded media recovery prevent unlimited accumulation; they are not a guarantee
about GPU memory, endpoint safety or Internet performance.

TCP diagnostics are read-only. System configuration and actual entry/relay
connections are separate observations; unobservable sockets remain unidentified.
