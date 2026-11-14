export type TableSortDirection = 'ascend' | 'descend' | null | undefined;

export interface TableSortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Convert an Ant Design ProTable `sort` object into API query parameters.
 *
 * ProTable only allows a single active sorter, but the object still contains
 * every sortable column (inactive ones are `null`), so the first non-null
 * direction wins.
 *
 * @param sort Sort object passed to the ProTable `request` callback
 * @param fieldMap Maps a column `dataIndex` to the backend sort field when the
 * two differ (for example `status_display` -> `status`)
 */
export function toTableSortParams(
  sort: Record<string, TableSortDirection>,
  fieldMap: Record<string, string> = {},
): TableSortParams {
  const entry = Object.entries(sort ?? {}).find(
    ([, direction]) => direction === 'ascend' || direction === 'descend',
  );

  if (!entry) return {};

  const [field, direction] = entry;
  return {
    sort_by: fieldMap[field] ?? field,
    sort_order: direction === 'ascend' ? 'asc' : 'desc',
  };
}
