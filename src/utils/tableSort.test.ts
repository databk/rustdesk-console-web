import { describe, expect, it } from '@jest/globals';
import { toTableSortParams } from './tableSort';

describe('toTableSortParams', () => {
  it('returns no params when nothing is sorted', () => {
    expect(toTableSortParams({})).toEqual({});
    expect(toTableSortParams({ id: null, note: null })).toEqual({});
  });

  it('maps an ascending sorter to the API parameters', () => {
    expect(toTableSortParams({ id: 'ascend', note: null })).toEqual({
      sort_by: 'id',
      sort_order: 'asc',
    });
  });

  it('maps a descending sorter to the API parameters', () => {
    expect(toTableSortParams({ device_name: 'descend' })).toEqual({
      sort_by: 'device_name',
      sort_order: 'desc',
    });
  });

  it('translates UI-only column names through the field map', () => {
    expect(
      toTableSortParams(
        { status_display: 'descend' },
        { status_display: 'status' },
      ),
    ).toEqual({
      sort_by: 'status',
      sort_order: 'desc',
    });
  });

  it('keeps the original column name when no mapping exists', () => {
    expect(
      toTableSortParams(
        { unknown_column: 'ascend' },
        { status_display: 'status' },
      ),
    ).toEqual({
      sort_by: 'unknown_column',
      sort_order: 'asc',
    });
  });
});
