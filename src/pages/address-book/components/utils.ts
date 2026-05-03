import { useIntl } from '@umijs/max';

export const getTablePaginationConfig = (key: string) => {
  return {
    defaultPageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  };
};

export const t = (
  id: string,
  needWrap?: boolean,
  defaultMessage?: string,
  intl?: any,
) => {
  if (intl) {
    return intl.formatMessage({
      id: `pages.addressBook.${id}`,
      defaultMessage: defaultMessage || id,
    });
  }
  return defaultMessage || id;
};
