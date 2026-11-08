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
  { value: 'universal', label: 'universal' },
];

export const OS_ARCH_MAP: Record<string, string[]> = {
  windows: ['x86_64', 'x86', 'aarch64'],
  linux: ['x86_64', 'aarch64', 'armv7'],
  macos: ['x86_64', 'aarch64'],
  android: ['aarch64', 'armv7', 'x86_64', 'universal'],
  ios: ['aarch64'],
};

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
