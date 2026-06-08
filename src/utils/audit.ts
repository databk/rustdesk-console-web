/**
 * Format a name and IP address for display.
 * Returns "name@ip" if both are present, "name" if only name,
 * "ip" if only IP, or "-" if neither.
 */
export const renderNameIp = (name?: string, ip?: string): string => {
  const cleanName = name || '';
  const cleanIp = (ip || '').replace('::ffff:', '');
  if (cleanName && cleanIp) return `${cleanName}@${cleanIp}`;
  if (cleanName) return cleanName;
  if (cleanIp) return cleanIp;
  return '-';
};
