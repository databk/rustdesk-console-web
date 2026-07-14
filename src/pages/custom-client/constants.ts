export type PageState =
  | 'loading'
  | 'bind'
  | 'tokenExpired'
  | 'repoRequired'
  | 'ready';

export const CONN_TYPE_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

export const ARCH_OPTIONS = [
  { value: 'x86_64', label: 'x86_64' },
  { value: 'aarch64', label: 'aarch64' },
  { value: 'x86', label: 'x86 (sciter)' },
];

export const SERVER_FIELDS = [
  { key: 'custom-rendezvous-server', labelKey: 'pages.nexus.rendezvousServer' },
  { key: 'relay-server', labelKey: 'pages.nexus.relayServer' },
  { key: 'key', labelKey: 'pages.nexus.key' },
  { key: 'api-server', labelKey: 'pages.nexus.apiServer' },
] as const;
