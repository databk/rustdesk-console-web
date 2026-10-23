# Server management scopes

Server management connects to one hbbs management origin. That hbbs exposes
its own registrations and manages the reverse control channels registered by
hbbr instances. A Console management entry identifies a service instance; it
does not establish that the instance runs on a different physical host.

## Page scopes

| Page | Scope | Selection |
| --- | --- | --- |
| Services | All returned hbbs and hbbr instances | None; card actions identify their own instance |
| Registrations | The primary hbbs registration table | None |
| Relay sessions | All registered relays, or one hbbr | A filter inside this page |
| Logs | One service instance | A selector inside this page |
| Configuration | One service instance | A selector inside this page |
| Bans | The connected hbbs and every relay it manages | None |

Logs and configuration keep the most recently selected instance when moving
between those pages. An instance is the pair of node ID and service name.
Never construct unsupported combinations such as a primary-only node with
`hbbr`, or a relay-only node with `hbbs`.

The Services page lists every returned instance together. Its log,
configuration and restart actions use the card's own node and service. The
current management API supports requesting a process restart. It does not
support starting or stopping containers, so the UI must not offer those
unsupported lifecycle actions.

## Registration and relay sessions

Registrations always query the primary hbbs. They are native registration
records, separate from the Console clients' heartbeat online state.

The default relay session view queries each registered relay and displays the
owning relay with every session. One failed query must be reported as an
incomplete view rather than a successful empty result. A relay filter narrows
the same view to one hbbr. Direct desktop connections are outside this list.

Disconnect targets the session's owning relay and UUID, not whichever
instance was last viewed in another page. It closes only that relay session.

The relay-session filter changes only when selected inside that page. Viewing
a relay's logs or configuration must not silently narrow the session view.
Selecting one relay in the session filter may carry that instance into Logs
and Configuration for the next operation.

The current node-list API does not expose whether relay discovery failed or
found no registered relays. With no queryable relays the page must say that
session data is unavailable, rather than claim it verified zero sessions.

## Configuration and unavailable targets

Configuration reads, saves and apply/restart actions bind to the selected
node/service pair. A missing target must remain visibly unavailable. Never
silently replace it with a different instance and continue a write.

Polling must not replace edited fields. Changing the selected instance,
switching away from edited configuration, explicitly refreshing, or leaving
the page requires protection against discarding unsaved changes. Delayed
responses from an old target must not populate another target's form.

Use the server's `pending_restart` response to distinguish saved dynamic
settings from settings requiring restart. Dynamic settings are accepted
without restarting; their effect on existing sessions follows the native
server implementation. A restart confirmation names the affected service
instance. Restarting hbbr interrupts the relay sessions it carries; hbbs and
other hbbr instances are not restarted by that request.

## Ban policy and observation limits

Ban rules always use the primary hbbs endpoint and affect the policy of that
hbbs and all its managed relays. The save confirmation must state this scope.
An edited ban rule set remains bound to the primary ID from which it was
loaded. A changed primary must not receive an old primary's draft.
The current response's hbbs/hbbr synchronization summary is not a durable,
per-relay acknowledgement; the UI must not claim every relay was individually
verified.

The TCP information card reads the Console backend's network environment.
It is not an observation of every remote hbbs/hbbr host and does not provide
network tuning controls.

## Regression checks

Use a primary and at least two relays to check the Services page, local
selectors, session ownership and disconnect routing. Include failed or removed
targets, delayed reads, unsaved configuration, save errors and restricted
permissions. Production browser acceptance should exercise real native
management connections; mocked page tests alone do not prove native relay
registration or data forwarding.
