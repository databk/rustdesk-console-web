import { expect, jest, test } from '@jest/globals';
import { loadAllPages } from '@/utils/pagination';

test('loads every candidate page without truncating after the first page', async () => {
  const loadPage = jest
    .fn<(current: number) => Promise<API.PaginatedResult<string>>>()
    .mockResolvedValueOnce({ data: ['first', 'second'], total: 3 })
    .mockResolvedValueOnce({ data: ['third'], total: 3 });

  await expect(loadAllPages(loadPage)).resolves.toEqual([
    'first',
    'second',
    'third',
  ]);
  expect(loadPage).toHaveBeenNthCalledWith(1, 1);
  expect(loadPage).toHaveBeenNthCalledWith(2, 2);
});
