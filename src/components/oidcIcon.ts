const ICON_KEY_MAP: Record<string, string> = {
  azure: 'microsoft',
};

export function getOidcIconKey(name: string): string {
  const lowerName = name.toLowerCase();
  return ICON_KEY_MAP[lowerName] || lowerName;
}
