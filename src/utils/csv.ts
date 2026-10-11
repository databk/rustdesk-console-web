/**
 * Shared CSV export utilities.
 *
 * sanitizeCsvCell neutralizes spreadsheet formula injection (OWASP CSV
 * Injection) by prefixing values that start with =, +, -, @, \t, \r,
 * or \n with a single quote, then quoting every cell so embedded
 * commas, quotes, and newlines are preserved.
 *
 * buildCsv assembles a complete CSV document from headers and rows.
 *
 * downloadCsv triggers a browser download with a UTF-8 BOM so Excel
 * opens the file with the correct encoding.
 */

export const sanitizeCsvCell = (cell: string): string => {
  let safe = cell.replace(/"/g, '""');
  if (/^[=+\-@\t\r\n]/.test(safe)) {
    safe = `'${safe}`;
  }
  return `"${safe}"`;
};

export const buildCsv = (headers: string[], rows: string[][]): string =>
  [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
  ].join('\n');

export const downloadCsv = (filename: string, csvContent: string): void => {
  const blob = new Blob([`\ufeff${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
