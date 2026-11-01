export const OS_OPTIONS = [
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'macos', label: 'macOS' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
  { value: 'all', label: 'All Platforms' },
];

export const ARCH_OPTIONS = [
  { value: 'x86_64', label: 'x86_64' },
  { value: 'aarch64', label: 'aarch64' },
  { value: 'x86', label: 'x86 (sciter)' },
  { value: 'armv7', label: 'armv7' },
];

export const CONN_TYPE_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

export const SERVER_FIELDS = [
  {
    key: 'custom-rendezvous-server',
    labelKey: 'pages.customClient.rendezvousServer',
  },
  { key: 'relay-server', labelKey: 'pages.customClient.relayServer' },
  { key: 'key', labelKey: 'pages.customClient.key' },
  { key: 'api-server', labelKey: 'pages.customClient.apiServer' },
] as const;
