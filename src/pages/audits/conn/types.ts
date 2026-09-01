export interface DetailField {
  label: string;
  dataIndex?: keyof API.ConnectionAuditItem;
  render?: (r: API.ConnectionAuditItem) => string;
}

export interface ConnectionAuditSearchParams extends API.PageParams {
  deviceId?: string;
  type?: number;
  createdAt?: [string, string];
}
