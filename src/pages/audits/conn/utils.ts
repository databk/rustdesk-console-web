import dayjs from 'dayjs';
import { renderNameIp } from '@/utils/audit';

export const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const formatDateTime = (val?: string): string =>
  val ? dayjs(val).format(DATE_FORMAT) : '-';

export const renderLocalField = (record: API.ConnectionAuditItem): string =>
  renderNameIp(record.peerName, record.ip);

export const sanitizeCsvCell = (cell: string): string => {
  let safe = cell.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  return `"${safe}"`;
};

export const renderDuration = (record: API.ConnectionAuditItem): string => {
  if (!record.establishedAt || !record.closedAt) return '-';
  const start = dayjs(record.establishedAt);
  const end = dayjs(record.closedAt);
  const durationSeconds = end.diff(start, 'second');
  if (durationSeconds < 0) return '-';

  const days = Math.floor(durationSeconds / 86400);
  const hours = Math.floor((durationSeconds % 86400) / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};