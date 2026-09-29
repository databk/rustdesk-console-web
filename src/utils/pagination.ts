export const DEFAULT_PAGINATION = {
  defaultPageSize: 20,
  showSizeChanger: true,
  showQuickJumper: true,
} as const;

export function toTableResult<T>(result: API.PaginatedResult<T>) {
  return {
    data: result.data || [],
    total: result.total || 0,
    success: true,
  };
}

export async function loadAllPages<T>(
  loadPage: (current: number) => Promise<API.PaginatedResult<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let current = 1;
  let total = 0;
  do {
    const page = await loadPage(current);
    const data = page.data ?? [];
    items.push(...data);
    total = page.total;
    current += 1;
    if (data.length === 0) break;
  } while (items.length < total);
  return items;
}
