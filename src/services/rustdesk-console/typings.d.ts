declare namespace API {
  type CurrentUser = {
    name?: string;
    email?: string;
    note?: string;
    status?: number;
    is_admin?: boolean;
    info?: {
      email_verification?: boolean;
      email_alarm_notification?: boolean;
      other?: Record<string, any>;
    };
  };

  type LoginParams = {
    username: string;
    password: string;
  };

  type LoginResult = {
    access_token?: string;
    type?: string;
    user?: CurrentUser;
    data?: {
      access_token?: string;
      type?: string;
      user?: CurrentUser;
    };
    [key: string]: any;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type PaginatedResult<T> = {
    data: T[];
    total: number;
  };

  type UserItem = {
    guid: string;
    name: string;
    email: string;
    note: string;
    status: number;
    is_admin: boolean;
  };

  type CreateUserParams = {
    name: string;
    email: string;
    password: string;
    note?: string;
    is_admin?: boolean;
  };

  type InviteUserParams = {
    email: string;
    note?: string;
  };

  type DeviceItem = {
    id: string;
    guid: string;
    info?: {
      username?: string;
      os?: string;
      device_name?: string;
    };
    status?: number;
    user?: string;
    user_name?: string;
    device_group?: string;
    device_group_name?: string;
    note?: string;
    last_online_time?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type DeviceGroupItem = {
    guid: string;
    name: string;
    note?: string;
    device_count?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateDeviceGroupParams = {
    name: string;
    note?: string;
  };

  type UpdateDeviceGroupParams = {
    name?: string;
    note?: string;
  };

  type SharedAddressBook = {
    guid: string;
    name: string;
    note?: string;
    password?: string;
    peer_count?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type AddSharedAddressBookParams = {
    name: string;
    note?: string;
    password?: string;
  };

  type UpdateSharedAddressBookParams = {
    guid: string;
    name?: string;
    note?: string;
  };

  type PeerItem = {
    id: string;
    hostname?: string;
    os?: string;
    os_version?: string;
    status?: string;
    note?: string;
    tags?: string[];
    [key: string]: any;
  };

  type AddPeerParams = {
    id: string;
    hostname?: string;
    os?: string;
    note?: string;
    tags?: string[];
  };

  type UpdatePeerParams = {
    id?: string;
    hostname?: string;
    os?: string;
    note?: string;
    tags?: string[];
  };

  type TagItem = {
    name: string;
    color?: string;
  };

  type AddTagParams = {
    name: string;
    color?: string;
  };

  type RenameTagParams = {
    name: string;
    newName: string;
  };

  type UpdateTagParams = {
    name: string;
    color: string;
  };

  type RuleItem = {
    id?: string;
    name?: string;
    [key: string]: any;
  };

  type CreateRuleParams = {
    name: string;
    [key: string]: any;
  };

  type UpdateRuleParams = {
    [key: string]: any;
  };

  type ConnectionAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    connId?: string;
    ip?: string;
    action?: string;
    peerId?: string;
    peerName?: string;
    type?: number;
    createdAt?: string;
    requestedAt?: string;
    establishedAt?: string;
    closedAt?: string;
    [key: string]: any;
  };

  type FileAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    peerId?: string;
    type?: number;
    path?: string;
    isFile?: boolean;
    clientIp?: string;
    clientName?: string;
    fileCount?: number;
    files?: Array<[string, number]>;
    createdAt?: string;
    [key: string]: any;
  };

  type AlarmAuditItem = {
    id?: string;
    from?: string;
    from_name?: string;
    to?: string;
    to_name?: string;
    alarm_type?: string;
    time?: string;
    [key: string]: any;
  };

  type ConsoleAuditItem = {
    id?: string;
    user?: string;
    action?: string;
    detail?: string;
    time?: string;
    [key: string]: any;
  };

  type AddressBookSettings = {
    max_peer_one_ab?: number;
    [key: string]: any;
  };

  type SystemInfo = {
    version?: string;
    latestVersion?: string;
    releaseUrl?: string;
    [key: string]: any;
  };

  type LicenseInfo = {
    currentDevices?: number;
    maxDevices?: number | string;
    expireTime?: string;
    warning?: string;
    [key: string]: any;
  };

  type RoleItem = {
    guid: string;
    name: string;
    note?: string;
    permission_count?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateRoleParams = {
    name: string;
    note?: string;
    permissions?: string[];
  };

  type UpdateRoleParams = {
    name?: string;
    note?: string;
    permissions?: string[];
  };

  type PermissionItem = {
    id: string;
    name: string;
    description?: string;
    module?: string;
    [key: string]: any;
  };

  type StrategyItem = {
    guid: string;
    name: string;
    note?: string;
    status?: number;
    rule_count?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateStrategyParams = {
    name: string;
    note?: string;
    rules?: RuleItem[];
  };

  type UpdateStrategyParams = {
    name?: string;
    note?: string;
    rules?: RuleItem[];
    status?: number;
  };

  type UserGroupItem = {
    guid: string;
    name: string;
    note?: string;
    user_count?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateUserGroupParams = {
    name: string;
    note?: string;
  };

  type UpdateUserGroupParams = {
    name?: string;
    note?: string;
  };

  type CustomClientItem = {
    guid: string;
    name: string;
    config?: Record<string, any>;
    download_url?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateCustomClientParams = {
    name: string;
    config?: Record<string, any>;
  };

  type UpdateCustomClientParams = {
    name?: string;
    config?: Record<string, any>;
  };

  type SettingItem = {
    key: string;
    value: string | number | boolean;
    type?: string;
    description?: string;
    category?: string;
    [key: string]: any;
  };
}
